import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore
} from 'firebase/firestore';
import type { FirebaseConfigStatus, UserProfile } from '../types/tracking';

// Safe extraction of environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Validate configuration
export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'your_api_key_here' &&
  projectId &&
  projectId !== 'your_project_id_here'
);

export const firebaseConfigStatus: FirebaseConfigStatus = {
  isConfigured: isFirebaseConfigured,
  apiKeyAvailable: Boolean(apiKey && apiKey !== 'your_api_key_here'),
  projectIdAvailable: Boolean(projectId && projectId !== 'your_project_id_here'),
  error: isFirebaseConfigured ? undefined : 'Firebase credentials not found in environment. Operating in Local Mode.'
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    // eslint-disable-next-line no-console
    console.info('[GeoTrack Firebase] Successfully initialized Cloud Services.');
  } catch (err: unknown) {
    console.error('[GeoTrack Firebase] Initialization error:', err);
    firebaseConfigStatus.isConfigured = false;
    firebaseConfigStatus.error = err instanceof Error ? err.message : 'Unknown Firebase init error';
  }
}

export { app, auth, db };

// Authentication helpers
export async function authenticateUser(email: string, pass: string, isSignUp = false): Promise<UserProfile> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure .env with valid credentials.');
  }

  const cred = isSignUp
    ? await createUserWithEmailAndPassword(auth, email, pass)
    : await signInWithEmailAndPassword(auth, email, pass);

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || email.split('@')[0]
  };
}

export async function logOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Field Agent'
      });
    } else {
      callback(null);
    }
  });
}
