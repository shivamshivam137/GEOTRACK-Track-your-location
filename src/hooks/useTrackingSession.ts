import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  LocationPoint,
  TrackingSession,
  TrackingStatus,
  TrackingTelemetry,
  UserProfile,
  SyncStatus
} from '../types/tracking';
import { useGeolocation } from './useGeolocation';
import { generateDenseSimulatedRoute } from '../utils/sampleRoute';
import { calculateHaversineDistance } from '../utils/geoDistance';
import { TrackingRepository } from '../services/trackingRepository';
import { isFirebaseConfigured } from '../services/firebase';

interface UseTrackingSessionProps {
  currentUser: UserProfile | null;
}

export function useTrackingSession({ currentUser }: UseTrackingSessionProps) {
  // Real GPS Geolocation Hook
  const realGeo = useGeolocation();

  // Mode: Real GPS vs Demo Simulation
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoStatus, setDemoStatus] = useState<TrackingStatus>('idle');
  const [demoPoints, setDemoPoints] = useState<LocationPoint[]>([]);
  const [demoIndex, setDemoIndex] = useState<number>(0);
  const [demoSpeedMultiplier, setDemoSpeedMultiplier] = useState<number>(1);

  // Active Session Meta
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Date.now()}`);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Cloud Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: isFirebaseConfigured ? 'synced' : 'local_only',
    lastSyncedAt: null,
    pendingCount: 0
  });

  // Precomputed simulated route points
  const simulatedRoutePoints = useMemo(() => generateDenseSimulatedRoute(3), []);

  // Interval timer references
  const durationTimerRef = useRef<number | null>(null);
  const demoIntervalRef = useRef<number | null>(null);

  // Active points and status depending on mode
  const activeStatus: TrackingStatus = isDemoMode ? demoStatus : realGeo.status;
  const activePoints: LocationPoint[] = isDemoMode ? demoPoints : realGeo.points;
  const currentPoint: LocationPoint | null = isDemoMode
    ? (demoPoints.length > 0 ? demoPoints[demoPoints.length - 1] : null)
    : realGeo.currentPoint;
  const previousPoint: LocationPoint | null = isDemoMode
    ? (demoPoints.length > 1 ? demoPoints[demoPoints.length - 2] : null)
    : realGeo.previousPoint;

  // Duration Timer
  useEffect(() => {
    if (activeStatus === 'tracking') {
      if (sessionStartTime === null) {
        setSessionStartTime(Date.now());
      }
      durationTimerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current !== null) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current !== null) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [activeStatus, sessionStartTime]);

  // Derived Metrics
  const totalDistanceMeters = useMemo(() => {
    if (isDemoMode) {
      if (demoPoints.length <= 1) return 0;
      return demoPoints[demoPoints.length - 1].cumulativeDistanceMeters;
    }
    return realGeo.totalDistanceMeters;
  }, [isDemoMode, demoPoints, realGeo.totalDistanceMeters]);

  const maxSpeedKmH = useMemo(() => {
    let max = 0;
    for (const pt of activePoints) {
      if (pt.speedKmH && pt.speedKmH > max) {
        max = pt.speedKmH;
      }
    }
    return Math.round(max * 10) / 10;
  }, [activePoints]);

  const averageSpeedKmH = useMemo(() => {
    if (elapsedSeconds <= 0 || totalDistanceMeters <= 0) return 0;
    const speed = (totalDistanceMeters / elapsedSeconds) * 3.6;
    return Math.round(speed * 10) / 10;
  }, [elapsedSeconds, totalDistanceMeters]);

  // ==========================================
  // REAL TRACKING HANDLERS
  // ==========================================
  const startRealTracking = useCallback(() => {
    if (isDemoMode) {
      if (demoIntervalRef.current !== null) clearInterval(demoIntervalRef.current);
      setIsDemoMode(false);
      setDemoStatus('idle');
      setDemoPoints([]);
      setDemoIndex(0);
    }
    setSessionId(`real_${Date.now()}`);
    setSessionStartTime(Date.now());
    setElapsedSeconds(0);
    realGeo.startRealTracking();
  }, [isDemoMode, realGeo]);

  const stopRealTracking = useCallback(() => {
    realGeo.stopRealTracking();
  }, [realGeo]);

  // ==========================================
  // DEMO MODE HANDLERS
  // ==========================================
  const advanceDemoStep = useCallback(() => {
    setDemoIndex(prevIdx => {
      if (prevIdx >= simulatedRoutePoints.length) {
        if (demoIntervalRef.current !== null) clearInterval(demoIntervalRef.current);
        setDemoStatus('stopped');
        return prevIdx;
      }

      const raw = simulatedRoutePoints[prevIdx];
      const now = Date.now();

      setDemoPoints(oldPoints => {
        const prev = oldPoints.length > 0 ? oldPoints[oldPoints.length - 1] : null;
        let segmentDist = 0;
        if (prev) {
          segmentDist = calculateHaversineDistance(
            prev.latitude,
            prev.longitude,
            raw.latitude,
            raw.longitude
          );
        }
        const prevCumulative = prev ? prev.cumulativeDistanceMeters : 0;
        const cumulative = Math.round((prevCumulative + segmentDist) * 10) / 10;

        const simulatedPoint: LocationPoint = {
          id: `demo_${prevIdx}_${now}`,
          latitude: raw.latitude,
          longitude: raw.longitude,
          accuracy: raw.accuracy,
          altitude: raw.altitude,
          altitudeAccuracy: 1.5,
          heading: raw.heading,
          speed: raw.speed,
          speedKmH: raw.speedKmH,
          timestamp: now,
          isoTimestamp: new Date(now).toISOString(),
          distanceFromPreviousMeters: Math.round(segmentDist * 10) / 10,
          cumulativeDistanceMeters: cumulative,
          isSimulated: true
        };

        return [...oldPoints, simulatedPoint];
      });

      return prevIdx + 1;
    });
  }, [simulatedRoutePoints]);

  const startDemoMode = useCallback(() => {
    realGeo.stopRealTracking();
    realGeo.resetTracking();

    setIsDemoMode(true);
    setDemoStatus('tracking');
    setDemoPoints([]);
    setDemoIndex(0);
    setSessionId(`demo_${Date.now()}`);
    setSessionStartTime(Date.now());
    setElapsedSeconds(0);

    if (demoIntervalRef.current !== null) clearInterval(demoIntervalRef.current);

    advanceDemoStep();

    const stepInterval = Math.max(400, Math.floor(1500 / demoSpeedMultiplier));
    demoIntervalRef.current = window.setInterval(advanceDemoStep, stepInterval);
  }, [realGeo, demoSpeedMultiplier, advanceDemoStep]);

  const pauseDemoMode = useCallback(() => {
    if (demoIntervalRef.current !== null) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setDemoStatus('paused');
  }, []);

  const resumeDemoMode = useCallback(() => {
    if (demoStatus === 'paused') {
      setDemoStatus('tracking');
      const stepInterval = Math.max(400, Math.floor(1500 / demoSpeedMultiplier));
      demoIntervalRef.current = window.setInterval(advanceDemoStep, stepInterval);
    }
  }, [demoStatus, demoSpeedMultiplier, advanceDemoStep]);

  const resetDemoMode = useCallback(() => {
    if (demoIntervalRef.current !== null) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setDemoStatus('idle');
    setDemoPoints([]);
    setDemoIndex(0);
    setElapsedSeconds(0);
    setSessionStartTime(null);
  }, []);

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current !== null) clearInterval(demoIntervalRef.current);
    };
  }, []);

  // ==========================================
  // SESSION PERSISTENCE & CLOUD SYNC
  // ==========================================
  const saveCurrentSession = useCallback(async (customTitle?: string): Promise<TrackingSession | null> => {
    if (activePoints.length === 0) return null;

    const session: TrackingSession = {
      id: sessionId,
      title: customTitle || (isDemoMode ? `Simulated Route — Marine Drive Transect` : `Field Session #${sessionId.slice(-4)}`),
      startTime: sessionStartTime || Date.now(),
      endTime: Date.now(),
      durationSeconds: elapsedSeconds,
      totalDistanceMeters,
      averageSpeedKmH,
      maxSpeedKmH,
      pointCount: activePoints.length,
      isSimulated: isDemoMode,
      points: [...activePoints],
      cloudSynced: false,
      userId: currentUser?.uid
    };

    TrackingRepository.saveLocalSession(session);

    if (currentUser?.uid && isFirebaseConfigured) {
      setSyncStatus(prev => ({ ...prev, state: 'syncing' }));
      const result = await TrackingRepository.syncSessionToCloud(session, currentUser.uid);
      if (result.success) {
        setSyncStatus({
          state: 'synced',
          lastSyncedAt: Date.now(),
          pendingCount: 0
        });
      } else {
        setSyncStatus(prev => ({
          ...prev,
          state: 'error',
          errorMessage: result.error
        }));
      }
    }

    return session;
  }, [
    activePoints,
    sessionId,
    isDemoMode,
    sessionStartTime,
    elapsedSeconds,
    totalDistanceMeters,
    averageSpeedKmH,
    maxSpeedKmH,
    currentUser
  ]);

  const telemetry: TrackingTelemetry = {
    currentPoint,
    previousPoint,
    status: activeStatus,
    sessionStartTime,
    elapsedSeconds,
    totalDistanceMeters,
    currentSpeedKmH: currentPoint?.speedKmH ?? null,
    averageSpeedKmH,
    maxSpeedKmH,
    pointsCount: activePoints.length,
    accuracyMeters: currentPoint?.accuracy ?? null,
    headingDegrees: currentPoint?.heading ?? null,
    errorMessage: isDemoMode ? null : realGeo.errorMessage,
    isSimulated: isDemoMode,
    signalQuality: isDemoMode ? null : realGeo.signalQuality
  };

  return {
    telemetry,
    activePoints,
    isDemoMode,
    demoIndex,
    sessionId,
    syncStatus,
    startRealTracking,
    stopRealTracking,
    startDemoMode,
    pauseDemoMode,
    resumeDemoMode,
    resetDemoMode,
    saveCurrentSession,
    demoSpeedMultiplier,
    setDemoSpeedMultiplier
  };
}
