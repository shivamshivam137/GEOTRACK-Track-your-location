import React from 'react';
import {
  User,
  LogOut,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import type { UserProfile, TrackingStatus } from '../types/tracking';
import { isFirebaseConfigured } from '../services/firebase';

interface AppHeaderProps {
  sessionId: string;
  status: TrackingStatus;
  isSimulated: boolean;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  sessionId,
  status,
  isSimulated,
  currentUser,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <header className="editorial-header">
      <div className="header-left">
        <div className="header-title-block">
          <div className="app-wordmark">
            GEOTRACK <span>•</span> FIELD CONSOLE
          </div>
          <div className="header-subtitle">
            WMC LIVE TELEMETRY SYSTEM &bull; MUMBAI UNIVERSITY BE SEM 5
          </div>
        </div>

        <div className="header-meta-divider" />

        {/* Session Identifier Tag */}
        <div className="header-session-tag">
          <span style={{ color: 'var(--text-secondary)' }}>SESSION:</span>
          <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
            {sessionId.toUpperCase()}
          </span>
          {isSimulated ? (
            <span className="instrument-badge badge-simulated" style={{ fontSize: '9px', padding: '1px 5px' }}>
              SIMULATED
            </span>
          ) : status === 'tracking' ? (
            <span className="instrument-badge badge-live" style={{ fontSize: '9px', padding: '1px 5px' }}>
              LIVE GNSS
            </span>
          ) : (
            <span className="instrument-badge badge-idle" style={{ fontSize: '9px', padding: '1px 5px' }}>
              STANDBY
            </span>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Cloud Mode / Local Mode Indicator */}
        {isFirebaseConfigured ? (
          <div
            title="Cloud Firestore link operational"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-forest)',
              padding: '4px 8px',
              background: '#E7F7E6',
              border: '1px solid #B5E4B2',
              borderRadius: '3px'
            }}
          >
            <ShieldCheck size={13} color="#2B7A27" />
            <span>CLOUD ONLINE</span>
          </div>
        ) : (
          <div
            title="Local browser storage mode (Firebase not configured)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#555E5B',
              padding: '4px 8px',
              background: 'var(--bg-stone-subtle)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '3px'
            }}
          >
            <HardDrive size={13} />
            <span>LOCAL MODE</span>
          </div>
        )}

        {/* User Authentication Status */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-forest)'
              }}
            >
              {currentUser.email || currentUser.displayName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="btn-instrument"
              style={{ padding: '6px 10px', fontSize: '11px' }}
              title="Sign Out of Field Console"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="btn-instrument btn-forest"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <User size={14} />
            <span>Field Agent Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
