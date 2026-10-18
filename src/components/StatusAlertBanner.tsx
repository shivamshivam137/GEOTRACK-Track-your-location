import React from 'react';
import { AlertTriangle, HardDrive } from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

interface StatusAlertBannerProps {
  isSimulated: boolean;
  onNavigateCloud: () => void;
}

export const StatusAlertBanner: React.FC<StatusAlertBannerProps> = ({
  isSimulated,
  onNavigateCloud
}) => {
  if (isSimulated) {
    return (
      <div className="status-alert-bar simulated" role="alert">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} color="#8C3707" />
          <span>
            <strong>DEMONSTRATION MODE ACTIVE — SIMULATED DATA ONLY:</strong> Telemetry points are synthetically generated from a predefined Mumbai coastal transect. Real GPS sensors are not transmitting.
          </span>
        </div>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Classroom Presentation Mode
        </span>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="status-alert-bar local" role="status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={14} color="#555E5B" />
          <span>
            <strong>LOCAL MODE — CLOUD SYNC NOT CONFIGURED:</strong> Records are saved to browser local storage. To enable multi-device live sync, configure Firebase credentials in <code>.env</code>.
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateCloud}
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-forest)',
            fontWeight: 600
          }}
        >
          View Config & Rules &rarr;
        </button>
      </div>
    );
  }

  return null;
};
