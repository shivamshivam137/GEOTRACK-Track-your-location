/**
 * GeoDistance & Geospatial Precision Utilities — GeoTrack Field Console
 *
 * Implements WGS-84 geodesic calculations, Kalman position smoothing,
 * accuracy quality classification, and advanced bearing/bounds utilities.
 */

export const EARTH_RADIUS_METERS = 6371000; // WGS-84 mean Earth radius (m)

// ─── UNIT CONVERSIONS ────────────────────────────────────────────────────────

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function metersPerSecondToKmH(mps: number | null): number | null {
  if (mps === null || mps === undefined || isNaN(mps) || mps < 0) return null;
  return Math.round(mps * 3.6 * 10) / 10;
}

// ─── HAVERSINE GREAT-CIRCLE DISTANCE ─────────────────────────────────────────

/**
 * Calculates great-circle distance between two WGS-84 coordinates
 * using the Haversine formula. Error: < 0.5% for any two points on Earth.
 * @returns Distance in meters (2 decimal precision)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const radLat1 = degreesToRadians(lat1);
  const radLat2 = degreesToRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

// ─── BEARING / HEADING ────────────────────────────────────────────────────────

/**
 * Calculates initial forward azimuth (bearing) from point A → B.
 * @returns Bearing in degrees [0, 360)
 */
export function calculateBearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const radLat1 = degreesToRadians(lat1);
  const radLat2 = degreesToRadians(lat2);
  const dLon = degreesToRadians(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  return (radiansToDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Smoothly interpolates between two bearing values (handles 359°→1° wrap-around).
 */
export function smoothBearing(from: number, to: number, alpha = 0.4): number {
  let diff = to - from;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (from + diff * alpha + 360) % 360;
}

/**
 * 16-point compass direction label from a bearing.
 */
export function bearingToCardinal(bearing: number | null): string {
  if (bearing === null || isNaN(bearing)) return '—';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(((bearing % 360) / 22.5)) % 16];
}

// ─── GPS ACCURACY QUALITY CLASSIFIER ─────────────────────────────────────────

export type AccuracyGrade = 'excellent' | 'good' | 'moderate' | 'poor' | 'unusable';

export interface AccuracyClassification {
  grade: AccuracyGrade;
  label: string;
  color: string;
  shouldAccept: boolean;
}

/**
 * Classifies a GPS accuracy reading into meaningful quality grades.
 * Based on U-blox and SiRF HDOP mapping guidelines.
 */
export function classifyAccuracy(accuracyMeters: number): AccuracyClassification {
  if (accuracyMeters <= 5) {
    return { grade: 'excellent', label: 'Excellent — GNSS Satellite Fix', color: '#D8F36A', shouldAccept: true };
  } else if (accuracyMeters <= 15) {
    return { grade: 'good', label: 'Good — A-GPS Active', color: '#8BDF5E', shouldAccept: true };
  } else if (accuracyMeters <= 50) {
    return { grade: 'moderate', label: 'Moderate — Partial Satellite Fix', color: '#F7C444', shouldAccept: true };
  } else if (accuracyMeters <= 500) {
    return { grade: 'poor', label: 'Low — Cell Tower / Wi-Fi Fix', color: '#EC5B3B', shouldAccept: true };
  } else {
    return { grade: 'unusable', label: 'City-Level — IP/Network Position', color: '#A5AAA0', shouldAccept: true };
  }
}

// ─── 1D KALMAN FILTER FOR COORDINATES ────────────────────────────────────────

/**
 * Lightweight 1-dimensional Kalman filter for smoothing GPS coordinate jitter.
 *
 * State: [position]
 * Process noise Q: estimated position uncertainty per second (degrees²/s)
 * Measurement noise R: derived from GPS accuracy reading
 *
 * Reference: Welch & Bishop — "An Introduction to the Kalman Filter"
 */
export class KalmanFilter1D {
  private estimate: number;
  private errorCovariance: number;
  private processNoise: number;

  constructor(initialEstimate: number, initialError = 1, processNoise = 1e-5) {
    this.estimate = initialEstimate;
    this.errorCovariance = initialError;
    this.processNoise = processNoise;
  }

  /**
   * Update filter with a new measurement.
   * @param measurement  New raw GPS reading (degrees)
   * @param measurementNoise Variance derived from accuracy (meters converted to degrees²)
   * @param dtSeconds Elapsed time since last update (for process noise growth)
   */
  update(measurement: number, measurementNoise: number, dtSeconds = 1): number {
    // Predict: grow error covariance by process noise × time elapsed
    const predictedError = this.errorCovariance + this.processNoise * dtSeconds;

    // Update: Kalman gain K = P_pred / (P_pred + R)
    const K = predictedError / (predictedError + measurementNoise);

    // Correct the estimate
    this.estimate = this.estimate + K * (measurement - this.estimate);
    this.errorCovariance = (1 - K) * predictedError;

    return this.estimate;
  }

  getEstimate(): number { return this.estimate; }
  getError(): number { return this.errorCovariance; }
  reset(value: number): void {
    this.estimate = value;
    this.errorCovariance = 1;
  }
}

/**
 * Converts GPS accuracy in meters to coordinate variance (degrees²).
 * 1 degree latitude ≈ 111,111 meters → variance = (acc / 111111)²
 */
export function accuracyToVariance(accuracyMeters: number): number {
  const degreesPerMeter = 1 / 111111;
  return (accuracyMeters * degreesPerMeter) ** 2;
}

// ─── ADAPTIVE JUMP & STATIONARY FILTER ───────────────────────────────────────

export interface JumpFilterResult {
  accepted: boolean;
  impliedSpeedKmH: number;
  distanceMeters: number;
  reason?: string;
}

/**
 * Accuracy-Aware Adaptive Position Filter
 *
 * Key insight: when GPS accuracy is ±10,000 m (Wi-Fi/IP fallback), standard
 * fixed thresholds are useless — a "jump" of 500 m is perfectly valid within
 * the uncertainty circle, yet our old 200 m hard gate rejected everything.
 *
 * This filter scales every threshold relative to the actual HDOP accuracy so it
 * works correctly across the full range: ±3 m GNSS → ±15,000 m IP fallback.
 *
 * Rules applied in order:
 *  1. TELEPORT GUARD  — reject only if distance > 4× the uncertainty circle
 *                       AND implied speed is physically impossible (> maxSpeedKmH)
 *  2. STATIONARY NOISE — reject micro-jitter that is clearly within the noise floor
 *                        (movement < 2% of accuracy OR < absolute minMeters)
 *  3. ACCEPT           — all other readings pass through
 *
 * @param prevAccuracy  HDOP of previous accepted point (metres)
 * @param newAccuracy   HDOP of incoming point (metres)
 * @param maxSpeedKmH   Physically plausible maximum speed (default 300 km/h)
 * @param absMinMeters  Absolute floor for minimum movement (default 1.5 m)
 */
export function runJumpFilter(
  prevLat: number, prevLng: number, prevTimestamp: number,
  newLat: number,  newLng: number,  newTimestamp: number,
  newAccuracy: number,
  prevAccuracy = newAccuracy,
  maxSpeedKmH = 300,
  absMinMeters = 1.5
): JumpFilterResult {
  const distanceMeters  = calculateHaversineDistance(prevLat, prevLng, newLat, newLng);
  const timeDiffSec     = Math.max(0.1, (newTimestamp - prevTimestamp) / 1000);
  const impliedSpeedKmH = (distanceMeters / timeDiffSec) * 3.6;

  // Uncertainty radius = worst of the two readings
  const uncertaintyRadius = Math.max(prevAccuracy, newAccuracy);

  // ── Rule 1: Teleport guard ──────────────────────────────────────────────────
  // Only reject if BOTH the distance is absurdly large relative to the uncertainty
  // AND the implied speed is physically impossible. One condition alone is not enough
  // (e.g. slow Wi-Fi switchover can jump 2 km in 30 s = 240 km/h, but within ±5 km circle → valid).
  const isTeleport =
    distanceMeters > uncertaintyRadius * 4 &&
    impliedSpeedKmH > maxSpeedKmH;

  if (isTeleport) {
    return {
      accepted: false,
      impliedSpeedKmH,
      distanceMeters,
      reason: `Teleport: ${distanceMeters.toFixed(0)} m in ${timeDiffSec.toFixed(1)} s → ${impliedSpeedKmH.toFixed(0)} km/h (> ${maxSpeedKmH} km/h) and outside uncertainty radius`
    };
  }

  // ── Rule 2: Stationary noise guard ─────────────────────────────────────────
  // Adaptive floor = 2% of the accuracy circle (e.g. ±10 m GPS → ignore < 0.2 m)
  // but never below the absolute minimum (1.5 m) to stop sub-metre drift.
  const adaptiveMinMovement = Math.max(absMinMeters, uncertaintyRadius * 0.02);

  if (distanceMeters < adaptiveMinMovement) {
    return {
      accepted: false,
      impliedSpeedKmH,
      distanceMeters,
      reason: `Stationary noise: ${distanceMeters.toFixed(2)} m < adaptive floor ${adaptiveMinMovement.toFixed(1)} m`
    };
  }

  // ── Accept ──────────────────────────────────────────────────────────────────
  return { accepted: true, impliedSpeedKmH, distanceMeters };
}

// ─── BOUNDING BOX ─────────────────────────────────────────────────────────────

export function calculateBounds(
  points: { latitude: number; longitude: number }[]
): [[number, number], [number, number]] | null {
  if (!points || points.length === 0) return null;

  let minLat = points[0].latitude, maxLat = points[0].latitude;
  let minLng = points[0].longitude, maxLng = points[0].longitude;

  for (const pt of points) {
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
  }

  if (minLat === maxLat && minLng === maxLng) {
    return [[minLat - 0.005, minLng - 0.005], [maxLat + 0.005, maxLng + 0.005]];
  }
  return [[minLat, minLng], [maxLat, maxLng]];
}
