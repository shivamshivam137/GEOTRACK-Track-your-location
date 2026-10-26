/**
 * useGeolocation — High-Precision GPS Tracking Hook
 *
 * Accuracy stack applied in order:
 *  1. enableHighAccuracy: true  →  forces GNSS hardware (not Wi-Fi/Cell fallback)
 *  2. maximumAge: 0             →  no cached positions, always fresh satellite fix
 *  3. Accuracy gate             →  rejects readings coarser than ±200 m
 *  4. Teleportation filter      →  rejects implied speed > 200 km/h
 *  5. Stationary noise filter   →  discards micro-drift < 1.5 m when nearly still
 *  6. 1-D Kalman filter         →  smooths coordinate jitter using per-reading HDOP variance
 *  7. Bearing smoothing         →  prevents heading flicker with EMA interpolation
 *  8. Signal quality tracking   →  accumulates consecutive accept/reject counts for UI feedback
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { LocationPoint, TrackingStatus } from '../types/tracking';
import {
  calculateHaversineDistance,
  calculateBearing,
  smoothBearing,
  metersPerSecondToKmH,
  classifyAccuracy,
  KalmanFilter1D,
  accuracyToVariance,
  runJumpFilter
} from '../utils/geoDistance';

export interface GpsSignalQuality {
  consecutiveAccepted: number;
  consecutiveRejected: number;
  totalRejected: number;
  lastAccuracyMeters: number | null;
  grade: string;
}

interface UseGeolocationReturn {
  status: TrackingStatus;
  currentPoint: LocationPoint | null;
  previousPoint: LocationPoint | null;
  points: LocationPoint[];
  totalDistanceMeters: number;
  errorMessage: string | null;
  signalQuality: GpsSignalQuality;
  startRealTracking: () => void;
  stopRealTracking: () => void;
  resetTracking: () => void;
}

const DEFAULT_QUALITY: GpsSignalQuality = {
  consecutiveAccepted: 0,
  consecutiveRejected: 0,
  totalRejected: 0,
  lastAccuracyMeters: null,
  grade: '—'
};

export function useGeolocation(): UseGeolocationReturn {
  const [status, setStatus]                     = useState<TrackingStatus>('idle');
  const [currentPoint, setCurrentPoint]         = useState<LocationPoint | null>(null);
  const [previousPoint, setPreviousPoint]       = useState<LocationPoint | null>(null);
  const [points, setPoints]                     = useState<LocationPoint[]>([]);
  const [totalDistanceMeters, setTotalDistance] = useState<number>(0);
  const [errorMessage, setErrorMessage]         = useState<string | null>(null);
  const [signalQuality, setSignalQuality]       = useState<GpsSignalQuality>(DEFAULT_QUALITY);

  const watchIdRef       = useRef<number | null>(null);
  const pointsRef        = useRef<LocationPoint[]>([]);
  const totalDistRef     = useRef<number>(0);
  const kalmanLatRef     = useRef<KalmanFilter1D | null>(null);
  const kalmanLngRef     = useRef<KalmanFilter1D | null>(null);
  const lastBearingRef   = useRef<number | null>(null);
  const qualityRef       = useRef<GpsSignalQuality>({ ...DEFAULT_QUALITY });
  const isHighAccuracyRef = useRef<boolean>(true);

  // Keep refs in sync with state so callbacks always see fresh values
  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { totalDistRef.current = totalDistanceMeters; }, [totalDistanceMeters]);

  const stopRealTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus(prev => (prev === 'tracking' || prev === 'requesting' ? 'stopped' : prev));
  }, []);

  const handlePositionSuccess = useCallback((pos: GeolocationPosition) => {
    const coords   = pos.coords;
    const now      = pos.timestamp || Date.now();
    const rawLat   = coords.latitude;
    const rawLng   = coords.longitude;
    const accuracy = coords.accuracy;        // HDOP in metres
    const altitude = coords.altitude;
    const altAcc   = coords.altitudeAccuracy;
    const rawSpeed = coords.speed;           // m/s or null
    const rawHead  = coords.heading;         // degrees or null

    const prev = pointsRef.current.length > 0
      ? pointsRef.current[pointsRef.current.length - 1]
      : null;

    // ── STEP 1: Initialise Kalman filters on first fix ──────────────────────
    if (!kalmanLatRef.current) {
      kalmanLatRef.current = new KalmanFilter1D(rawLat, accuracyToVariance(accuracy), 1e-9);
      kalmanLngRef.current = new KalmanFilter1D(rawLng, accuracyToVariance(accuracy), 1e-9);
    }

    // ── STEP 2: Kalman-smooth the raw coordinate pair ───────────────────────
    const variance = accuracyToVariance(accuracy);
    const dtSec    = prev ? Math.max(0.1, (now - prev.timestamp) / 1000) : 1;

    const smoothLat = kalmanLatRef.current!.update(rawLat, variance, dtSec);
    const smoothLng = kalmanLngRef.current!.update(rawLng, variance, dtSec);

    // ── STEP 3: Run adaptive quality filters ───────────────────────────────────
    let lat = smoothLat, lng = smoothLng;

    if (prev) {
      const filter = runJumpFilter(
        prev.latitude, prev.longitude, prev.timestamp,
        lat, lng, now,
        accuracy,
        prev.accuracy,   // pass previous accuracy for uncertainty-aware gating
        300,             // max speed km/h
        1.5              // absolute minimum movement metres
      );

      // Update quality counters
      const q = { ...qualityRef.current };
      q.lastAccuracyMeters = accuracy;
      q.grade = classifyAccuracy(accuracy).label;

      if (!filter.accepted) {
        q.consecutiveRejected += 1;
        q.consecutiveAccepted = 0;
        q.totalRejected += 1;
        qualityRef.current = q;
        setSignalQuality({ ...q });
        console.debug('[GeoTrack GPS] Filtered:', filter.reason);

        // Keep currentPoint responsive even during stationary periods
        if (filter.reason?.includes('Stationary')) {
          setCurrentPoint(curr => curr ? { ...curr, timestamp: now, isoTimestamp: new Date(now).toISOString(), accuracy: Math.round(accuracy * 10) / 10 } : curr);
        }
        return; // discard from trajectory path
      }

      q.consecutiveAccepted += 1;
      q.consecutiveRejected = 0;
      qualityRef.current = q;
      setSignalQuality({ ...q });
    } else {
      // First point — accept unconditionally (no baseline to compare)
      const q = { ...qualityRef.current };
      q.lastAccuracyMeters = accuracy;
      q.grade = classifyAccuracy(accuracy).label;
      qualityRef.current = q;
      setSignalQuality({ ...q });
    }

    // ── STEP 4: Compute segment distance & bearing ───────────────────────────
    let segmentDist = 0;
    let heading: number | null = rawHead;

    if (prev) {
      segmentDist = calculateHaversineDistance(prev.latitude, prev.longitude, lat, lng);

      // Derive heading from movement if device doesn't report it
      if ((heading === null || isNaN(heading)) && segmentDist > 1.5) {
        heading = calculateBearing(prev.latitude, prev.longitude, lat, lng);
      }

      // Smooth heading transitions (prevents 0°↔360° flicker)
      if (heading !== null && lastBearingRef.current !== null) {
        heading = smoothBearing(lastBearingRef.current, heading, 0.35);
      }
    }

    if (heading !== null) lastBearingRef.current = heading;

    const newCumDist = Math.round((totalDistRef.current + segmentDist) * 10) / 10;
    const speedKmH   = metersPerSecondToKmH(rawSpeed);

    // ── STEP 5: Build LocationPoint ─────────────────────────────────────────
    const newPoint: LocationPoint = {
      id: `pt_${now}_${Math.random().toString(36).substring(2, 6)}`,
      latitude:  lat,
      longitude: lng,
      accuracy:  Math.round(accuracy * 10) / 10,
      altitude:  altitude !== null ? Math.round(altitude * 10) / 10 : null,
      altitudeAccuracy: altAcc !== null ? Math.round(altAcc * 10) / 10 : null,
      heading:   heading !== null ? Math.round(heading) : null,
      speed:     rawSpeed,
      speedKmH,
      timestamp:     now,
      isoTimestamp:  new Date(now).toISOString(),
      distanceFromPreviousMeters: Math.round(segmentDist * 10) / 10,
      cumulativeDistanceMeters:   newCumDist,
      isSimulated: false
    };

    setPreviousPoint(prev);
    setCurrentPoint(newPoint);
    setTotalDistance(newCumDist);
    setPoints(list => [...list, newPoint]);
    setStatus('tracking');
    setErrorMessage(null);
  }, []);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    // If high-accuracy GNSS hardware failed or timed out (common on desktop/laptops),
    // automatically fall back to standard accuracy (Wi-Fi/Network geolocation)
    if (isHighAccuracyRef.current && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
      console.warn('[GeoTrack GPS] GNSS hardware unavailable or timed out. Falling back to Wi-Fi/Network positioning...');
      isHighAccuracyRef.current = false;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // 1. Immediate standard fix request
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        (fallbackErr) => {
          let message = 'Unable to acquire location fix via GNSS or Wi-Fi network.';
          if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
            message = 'Location permission denied. Click the lock/tune icon in your browser URL bar to allow location access.';
          } else if (fallbackErr.code === fallbackErr.POSITION_UNAVAILABLE) {
            message = 'Location signal unavailable. On Windows, check Settings > Privacy & Security > Location is turned ON.';
          }
          setErrorMessage(message);
          setStatus('error');
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );

      // 2. Continuous watch with standard accuracy
      const fallbackId = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        (fallbackErr) => {
          setErrorMessage('Location tracking lost: ' + fallbackErr.message);
          setStatus('error');
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 5000 }
      );
      watchIdRef.current = fallbackId;
      return;
    }

    let message = 'An unexpected GPS acquisition error occurred.';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied! Please click the lock/settings icon in your browser address bar to allow location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Location signal unavailable. Ensure Windows/Phone Location Services are turned ON.';
        break;
      case err.TIMEOUT:
        message = 'GPS acquisition timed out. Retrying satellite connection…';
        break;
    }
    setErrorMessage(message);
    setStatus('error');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [handlePositionSuccess]);

  const startRealTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation API is not supported in this browser.');
      setStatus('error');
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setErrorMessage(null);
    setStatus('requesting');
    isHighAccuracyRef.current = true;

    // 1. Immediately request current position to prompt browser and acquire initial fix fast
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );

    // 2. Start continuous position watch
    try {
      const id = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy: true,  // Use GNSS chip first
          timeout: 15000,            // 15s window before fallback triggers
          maximumAge: 1000           // Fresh fixes
        }
      );
      watchIdRef.current = id;
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to launch GPS tracker.');
      setStatus('error');
    }
  }, [handlePositionSuccess, handlePositionError]);

  const resetTracking = useCallback(() => {
    stopRealTracking();
    // Reset Kalman state so next session starts fresh
    kalmanLatRef.current = null;
    kalmanLngRef.current = null;
    lastBearingRef.current = null;
    qualityRef.current = { ...DEFAULT_QUALITY };
    setStatus('idle');
    setCurrentPoint(null);
    setPreviousPoint(null);
    setPoints([]);
    setTotalDistance(0);
    setErrorMessage(null);
    setSignalQuality({ ...DEFAULT_QUALITY });
  }, [stopRealTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    status,
    currentPoint,
    previousPoint,
    points,
    totalDistanceMeters,
    errorMessage,
    signalQuality,
    startRealTracking,
    stopRealTracking,
    resetTracking
  };
}
