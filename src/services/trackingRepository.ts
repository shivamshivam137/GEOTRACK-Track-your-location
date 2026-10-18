import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import type { LocationPoint, TrackingSession } from '../types/tracking';

const LOCAL_STORAGE_SESSIONS_KEY = 'geotrack_field_sessions_v1';

export class TrackingRepository {
  /**
   * Retrieves all sessions from local storage.
   */
  static getLocalSessions(): TrackingSession[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
      if (!data) return [];
      return JSON.parse(data) as TrackingSession[];
    } catch (err) {
      console.error('[GeoTrack Repository] Failed to parse local sessions:', err);
      return [];
    }
  }

  /**
   * Saves or updates a session in local storage.
   */
  static saveLocalSession(session: TrackingSession): void {
    try {
      const current = this.getLocalSessions();
      const existingIdx = current.findIndex(s => s.id === session.id);
      if (existingIdx >= 0) {
        current[existingIdx] = session;
      } else {
        current.unshift(session);
      }
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(current));
    } catch (err) {
      console.error('[GeoTrack Repository] Failed to persist session locally:', err);
    }
  }

  /**
   * Deletes a session by ID from local storage.
   */
  static deleteLocalSession(sessionId: string): void {
    try {
      const current = this.getLocalSessions().filter(s => s.id !== sessionId);
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(current));
    } catch (err) {
      console.error('[GeoTrack Repository] Failed to delete session locally:', err);
    }
  }

  /**
   * Clears all local sessions.
   */
  static clearAllLocalSessions(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSIONS_KEY);
    } catch (err) {
      console.error('[GeoTrack Repository] Failed to clear local sessions:', err);
    }
  }

  /**
   * Syncs a completed or active session to Cloud Firestore under authorized user context.
   */
  static async syncSessionToCloud(
    session: TrackingSession,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseConfigured || !db) {
      return { success: false, error: 'Cloud Firestore not configured. Data safely saved locally.' };
    }

    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
      
      // Store session metadata
      await setDoc(
        sessionRef,
        {
          id: session.id,
          title: session.title,
          startTime: session.startTime,
          endTime: session.endTime,
          durationSeconds: session.durationSeconds,
          totalDistanceMeters: session.totalDistanceMeters,
          averageSpeedKmH: session.averageSpeedKmH,
          maxSpeedKmH: session.maxSpeedKmH,
          pointCount: session.points.length,
          isSimulated: session.isSimulated,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // Throttled points upload: batch points into subcollection
      const pointsColRef = collection(db, 'users', userId, 'sessions', session.id, 'points');
      for (const pt of session.points) {
        const ptDocRef = doc(pointsColRef, pt.id);
        await setDoc(ptDocRef, {
          ...pt,
          uploadedAt: serverTimestamp()
        }, { merge: true });
      }

      // Mark local copy as cloud synced
      session.cloudSynced = true;
      this.saveLocalSession(session);

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown Firestore sync error';
      console.error('[GeoTrack Repository] Cloud sync failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Subscribes to real-time updates for an active cloud tracking session.
   */
  static subscribeToRemoteSessionPoints(
    userId: string,
    sessionId: string,
    onPointsReceived: (points: LocationPoint[]) => void
  ): Unsubscribe | null {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const pointsColRef = collection(db, 'users', userId, 'sessions', sessionId, 'points');
      const q = query(pointsColRef, orderBy('timestamp', 'asc'));

      return onSnapshot(
        q,
        snapshot => {
          const remotePoints: LocationPoint[] = [];
          snapshot.forEach(docSnap => {
            remotePoints.push(docSnap.data() as LocationPoint);
          });
          onPointsReceived(remotePoints);
        },
        error => {
          console.warn('[GeoTrack Repository] Remote listener warning:', error.message);
        }
      );
    } catch (err) {
      console.error('[GeoTrack Repository] Failed to create snapshot listener:', err);
      return null;
    }
  }

  /**
   * Exports session route as standard GeoJSON feature collection.
   */
  static exportToGeoJSON(session: TrackingSession): string {
    const coordinates = session.points.map(p => [p.longitude, p.latitude, p.altitude || 0]);
    
    const geoJson = {
      type: 'FeatureCollection',
      metadata: {
        title: session.title,
        id: session.id,
        durationSeconds: session.durationSeconds,
        distanceMeters: session.totalDistanceMeters,
        generator: 'GeoTrack Field Console — Mumbai University WMC'
      },
      features: [
        {
          type: 'Feature',
          properties: {
            name: `${session.title} Route`,
            pointsCount: session.points.length,
            isSimulated: session.isSimulated
          },
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
      ]
    };

    return JSON.stringify(geoJson, null, 2);
  }
}
