import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  ShieldCheck,
  User,
  Key,
  Copy,
  Check,
  FileCode,
  Smartphone
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';
import { TrackingRepository } from '../services/trackingRepository';
import type { UserProfile, SyncStatus } from '../types/tracking';
import { formatDateTime } from '../utils/formatters';

interface DataSettingsPageProps {
  currentUser: UserProfile | null;
  syncStatus: SyncStatus;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const DataSettingsPage: React.FC<DataSettingsPageProps> = ({
  currentUser,
  syncStatus,
  onOpenAuthModal,
  onLogout
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [localSessionsCount, setLocalSessionsCount] = useState(0);

  useEffect(() => {
    const list = TrackingRepository.getLocalSessions();
    setLocalSessionsCount(list.length);
  }, []);

  const sampleEnvConfig = `# GeoTrack Firebase Cloud Configuration
# Place in root .env file
VITE_FIREBASE_API_KEY=AIzaSyA_Example_Key_Mumbai_WMC
VITE_FIREBASE_AUTH_DOMAIN=geotrack-wmc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=geotrack-wmc
VITE_FIREBASE_STORAGE_BUCKET=geotrack-wmc.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456`;

  const sampleFirestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated user-space security rule
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /points/{pointId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="history-page-container">
      <div className="history-page-header">
        <h2 style={{ fontSize: '20px', color: 'var(--color-forest)' }}>
          Data, Cloud Synchronization & Firebase Configuration
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Inspect local storage, cloud uplink state, and cross-device telemetry architecture.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Status Card: Cloud Connection */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px', boxShadow: 'var(--shadow-instrument)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            {isFirebaseConfigured ? (
              <ShieldCheck size={22} color="#2B7A27" />
            ) : (
              <HardDrive size={22} color="#555E5B" />
            )}
            <h3 style={{ fontSize: '15px', color: 'var(--color-forest)' }}>
              {isFirebaseConfigured ? 'Cloud Sync Status: ONLINE' : 'Mode: LOCAL STORAGE ONLY'}
            </h3>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Uplink Status:</span>
              <strong style={{ color: isFirebaseConfigured ? '#2B7A27' : 'var(--text-secondary)' }}>
                {isFirebaseConfigured ? 'Configured & Active' : 'Unconfigured (Local Fallback)'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Agent Account:</span>
              <strong>{currentUser ? currentUser.email : 'Not signed in (Local Agent)'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Local Saved Sessions:</span>
              <strong>{localSessionsCount} sessions</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Last Cloud Sync:</span>
              <strong>
                {syncStatus.lastSyncedAt ? formatDateTime(syncStatus.lastSyncedAt) : 'No cloud uploads performed yet'}
              </strong>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ marginTop: '16px' }}>
            {currentUser ? (
              <button
                type="button"
                onClick={onLogout}
                className="btn-instrument"
                style={{ width: '100%', padding: '9px' }}
              >
                Sign Out Field Agent
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="btn-instrument btn-forest"
                style={{ width: '100%', padding: '9px' }}
              >
                <User size={14} />
                <span>Sign In / Register Cloud Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Cross Device Tracking Workflow (WMC Demonstration) */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px', boxShadow: 'var(--shadow-instrument)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Smartphone size={22} color="var(--color-vermilion)" />
            <h3 style={{ fontSize: '15px', color: 'var(--color-forest)' }}>
              Cross-Device Tracking Setup (Phone &rarr; Laptop)
            </h3>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
            For your Mumbai University Wireless Mobile Communication classroom demo:
          </p>

          <ol style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Host on HTTPS</strong> (e.g. Vercel, Firebase Hosting, or local tunnel) so your smartphone browser allows Geolocation access.
            </li>
            <li>
              <strong>Sign into the same Field Agent account</strong> on both your mobile device and classroom laptop.
            </li>
            <li>
              On your phone, tap <strong>START LIVE GPS</strong>. The phone transmits coordinates to Cloud Firestore via 4G/5G/Wi-Fi.
            </li>
            <li>
              On the classroom laptop projector, the telemetry console will stream the position updates in real-time through Firestore snapshot listeners!
            </li>
          </ol>
        </div>
      </div>

      {/* Code Snippets Section: .env and firestore.rules */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Environment File (.env) */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={16} color="var(--color-forest)" />
              <strong style={{ fontSize: '14px', color: 'var(--color-forest)' }}>
                Firebase Configuration (.env.example)
              </strong>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(sampleEnvConfig, setCopiedSnippet)}
              className="btn-instrument"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {copiedSnippet ? <Check size={13} color="#2B7A27" /> : <Copy size={13} />}
              <span>{copiedSnippet ? 'Copied' : 'Copy .env'}</span>
            </button>
          </div>

          <pre style={{ background: 'var(--color-forest)', color: 'var(--color-ivory)', padding: '14px', borderRadius: '4px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {sampleEnvConfig}
          </pre>
        </div>

        {/* Firestore Security Rules */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={16} color="var(--color-forest)" />
              <strong style={{ fontSize: '14px', color: 'var(--color-forest)' }}>
                Secure Firestore Rules (firestore.rules)
              </strong>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(sampleFirestoreRules, setCopiedRules)}
              className="btn-instrument"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {copiedRules ? <Check size={13} color="#2B7A27" /> : <Copy size={13} />}
              <span>{copiedRules ? 'Copied' : 'Copy Rules'}</span>
            </button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            These strict rules ensure that each student/field agent can only read and write their own telemetry records.
          </p>

          <pre style={{ background: 'var(--color-forest)', color: 'var(--color-ivory)', padding: '14px', borderRadius: '4px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {sampleFirestoreRules}
          </pre>
        </div>
      </div>
    </div>
  );
};
