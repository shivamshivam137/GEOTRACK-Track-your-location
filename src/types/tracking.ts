export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null; // degrees from north
  speed: number | null; // in m/s (from Geolocation API)
  speedKmH: number | null; // calculated or converted
  timestamp: number; // epoch ms
  isoTimestamp: string;
  distanceFromPreviousMeters: number;
  cumulativeDistanceMeters: number;
  isSimulated?: boolean;
}

export type TrackingStatus = 'idle' | 'requesting' | 'tracking' | 'paused' | 'stopped' | 'error';

export interface TrackingSession {
  id: string;
  title: string;
  startTime: number;
  endTime: number | null;
  durationSeconds: number;
  totalDistanceMeters: number;
  averageSpeedKmH: number;
  maxSpeedKmH: number;
  pointCount: number;
  isSimulated: boolean;
  points: LocationPoint[];
  cloudSynced: boolean;
  userId?: string;
  notes?: string;
}

export interface GpsSignalQuality {
  consecutiveAccepted: number;
  consecutiveRejected: number;
  totalRejected: number;
  lastAccuracyMeters: number | null;
  grade: string;
}

export interface TrackingTelemetry {
  currentPoint: LocationPoint | null;
  previousPoint: LocationPoint | null;
  status: TrackingStatus;
  sessionStartTime: number | null;
  elapsedSeconds: number;
  totalDistanceMeters: number;
  currentSpeedKmH: number | null;
  averageSpeedKmH: number;
  maxSpeedKmH: number;
  pointsCount: number;
  accuracyMeters: number | null;
  headingDegrees: number | null;
  errorMessage: string | null;
  isSimulated: boolean;
  signalQuality?: GpsSignalQuality | null;
}

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  apiKeyAvailable: boolean;
  projectIdAvailable: boolean;
  error?: string;
}

export interface SyncStatus {
  state: 'synced' | 'syncing' | 'local_only' | 'error';
  lastSyncedAt: number | null;
  pendingCount: number;
  errorMessage?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
