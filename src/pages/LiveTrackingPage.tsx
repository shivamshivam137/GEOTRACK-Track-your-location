import React from 'react';
import { LiveMap } from '../components/LiveMap';
import { TelemetryPanel } from '../components/TelemetryPanel';
import type { LocationPoint, TrackingTelemetry } from '../types/tracking';

interface LiveTrackingPageProps {
  telemetry: TrackingTelemetry;
  activePoints: LocationPoint[];
  isDemoMode: boolean;
  selectedSessionPoints: LocationPoint[] | null;
  onClearSelectedSession: () => void;
  onStartRealTracking: () => void;
  onStopRealTracking: () => void;
  onStartDemoMode: () => void;
  onPauseDemoMode: () => void;
  onResumeDemoMode: () => void;
  onResetDemoMode: () => void;
  onSaveSession: () => void;
  demoSpeedMultiplier: number;
  onSetDemoSpeedMultiplier: (multiplier: number) => void;
}

export const LiveTrackingPage: React.FC<LiveTrackingPageProps> = ({
  telemetry,
  activePoints,
  isDemoMode,
  selectedSessionPoints,
  onClearSelectedSession,
  onStartRealTracking,
  onStopRealTracking,
  onStartDemoMode,
  onPauseDemoMode,
  onResumeDemoMode,
  onResetDemoMode,
  onSaveSession,
  demoSpeedMultiplier,
  onSetDemoSpeedMultiplier
}) => {
  return (
    <div className="console-workspace">
      {/* Inspected Session Banner if user clicked "Inspect on Map" */}
      {selectedSessionPoints && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 950,
            background: 'var(--color-forest)',
            color: 'var(--color-ivory)',
            border: '1px solid var(--color-chartreuse)',
            padding: '8px 16px',
            borderRadius: '4px',
            boxShadow: 'var(--shadow-panel)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px'
          }}
        >
          <span>
            Inspecting Historical Route: <strong>{selectedSessionPoints.length} points</strong>
          </span>
          <button
            type="button"
            onClick={onClearSelectedSession}
            className="btn-instrument btn-chartreuse"
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            Return to Live
          </button>
        </div>
      )}

      {/* Main Map Canvas */}
      <LiveMap
        currentPoint={telemetry.currentPoint}
        points={activePoints}
        status={telemetry.status}
        isSimulated={isDemoMode}
        selectedSessionPoints={selectedSessionPoints}
      />

      {/* Dedicated Right Telemetry Panel */}
      <TelemetryPanel
        telemetry={telemetry}
        recentPoints={activePoints}
        onStartRealTracking={onStartRealTracking}
        onStopRealTracking={onStopRealTracking}
        onStartDemoMode={onStartDemoMode}
        onPauseDemoMode={onPauseDemoMode}
        onResumeDemoMode={onResumeDemoMode}
        onResetDemoMode={onResetDemoMode}
        onSaveSession={onSaveSession}
        demoSpeedMultiplier={demoSpeedMultiplier}
        onSetDemoSpeedMultiplier={onSetDemoSpeedMultiplier}
      />
    </div>
  );
};
