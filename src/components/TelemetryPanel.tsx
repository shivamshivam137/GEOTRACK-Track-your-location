import React from 'react';
import {
  Gauge,
  Navigation,
  Clock,
  Activity,
  Play,
  Square,
  Pause,
  RotateCcw,
  Save,
  AlertTriangle,
  Zap,
  Radio
} from 'lucide-react';
import type { LocationPoint, TrackingTelemetry } from '../types/tracking';
import {
  formatLatitudeDD,
  formatLongitudeDD,
  formatCoordinateDMS,
  formatAccuracy,
  formatSpeed,
  formatDistance,
  formatDuration,
  formatTelemetryTime
} from '../utils/formatters';
import { bearingToCardinal } from '../utils/geoDistance';

interface TelemetryPanelProps {
  telemetry: TrackingTelemetry;
  recentPoints: LocationPoint[];
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

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  recentPoints,
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
  const {
    currentPoint,
    status,
    elapsedSeconds,
    totalDistanceMeters,
    currentSpeedKmH,
    averageSpeedKmH,
    maxSpeedKmH,
    pointsCount,
    accuracyMeters,
    headingDegrees,
    errorMessage,
    isSimulated,
    signalQuality
  } = telemetry;

  const isTracking = status === 'tracking';
  const isRequesting = status === 'requesting';
  const isPaused = status === 'paused';

  // Status badge visual helper
  const getStatusBadge = () => {
    if (isSimulated) {
      return (
        <span className="telemetry-status-pill badge-simulated">
          SIMULATED TRANSECT
        </span>
      );
    }
    switch (status) {
      case 'tracking':
        return (
          <span className="telemetry-status-pill badge-dark-live">
            ● GPS ACTIVE
          </span>
        );
      case 'requesting':
        return (
          <span className="telemetry-status-pill" style={{ background: '#594411', color: '#F7D070' }}>
            ACQUIRING FIX...
          </span>
        );
      case 'paused':
        return (
          <span className="telemetry-status-pill" style={{ background: '#3F3B32', color: '#D2CFC7' }}>
            PAUSED
          </span>
        );
      case 'error':
        return (
          <span className="telemetry-status-pill" style={{ background: '#5A1F16', color: '#FFA090' }}>
            SIGNAL ERROR
          </span>
        );
      default:
        return (
          <span className="telemetry-status-pill" style={{ background: '#223834', color: '#A5AAA0' }}>
            STANDBY / IDLE
          </span>
        );
    }
  };

  return (
    <aside className="telemetry-panel" aria-label="Geospatial Telemetry Instrument Panel">
      {/* Telemetry Header */}
      <div className="telemetry-header">
        <div className="telemetry-title">
          <Activity size={16} color="var(--color-chartreuse)" />
          <span>Field Console Telemetry</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Error Alert Display */}
      {errorMessage && (
        <div style={{ padding: '10px 16px', background: '#4A1C16', color: '#FFB5A7', fontSize: '12px', borderBottom: '1px solid #732E24', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Coordinate Instrument Readout */}
      <div className="telemetry-coordinates-block">
        <div className="coord-row">
          <span className="coord-label">Latitude [N/S]</span>
          <span className="coord-value">
            {formatLatitudeDD(currentPoint?.latitude)}
          </span>
        </div>
        {currentPoint?.latitude !== undefined && currentPoint?.latitude !== null && (
          <div className="coord-dms-subtext">
            {formatCoordinateDMS(currentPoint.latitude, true)}
          </div>
        )}

        <div className="coord-row" style={{ marginTop: '4px' }}>
          <span className="coord-label">Longitude [E/W]</span>
          <span className="coord-value">
            {formatLongitudeDD(currentPoint?.longitude)}
          </span>
        </div>
        {currentPoint?.longitude !== undefined && currentPoint?.longitude !== null && (
          <div className="coord-dms-subtext">
            {formatCoordinateDMS(currentPoint.longitude, false)}
          </div>
        )}
      </div>

      {/* Primary Metrics Matrix (2x2 Grid) */}
      <div className="telemetry-grid">
        {/* Speed */}
        <div className="telemetry-cell">
          <div className="telemetry-cell-label">
            <Gauge size={13} color="var(--color-chartreuse)" />
            <span>Speed (Ground)</span>
          </div>
          <div className="telemetry-cell-value accent-chartreuse">
            {formatSpeed(currentSpeedKmH)}
          </div>
          <div className="telemetry-cell-sub">
            Avg: {formatSpeed(averageSpeedKmH)} • Max: {formatSpeed(maxSpeedKmH)}
          </div>
        </div>

        {/* Distance */}
        <div className="telemetry-cell">
          <div className="telemetry-cell-label">
            <Navigation size={13} color="var(--color-vermilion)" />
            <span>Total Trajectory</span>
          </div>
          <div className="telemetry-cell-value accent-vermilion">
            {formatDistance(totalDistanceMeters)}
          </div>
          <div className="telemetry-cell-sub">
            Points Logged: {pointsCount}
          </div>
        </div>

        {/* Accuracy + Kalman grade */}
        <div className="telemetry-cell">
          <div className="telemetry-cell-label">
            <Radio size={13} />
            <span>Accuracy (HDOP)</span>
          </div>
          <div className="telemetry-cell-value">
            {formatAccuracy(accuracyMeters)}
          </div>
          <div className="telemetry-cell-sub" style={{ color: (() => {
            if (!accuracyMeters) return 'var(--color-muted)';
            if (accuracyMeters <= 5)  return '#D8F36A';
            if (accuracyMeters <= 15) return '#8BDF5E';
            if (accuracyMeters <= 50) return '#F7C444';
            return '#EC5B3B';
          })() }}>
            {signalQuality?.grade || (accuracyMeters ? 'Kalman Filtering' : 'Awaiting Satellite Fix')}
          </div>
        </div>

        {/* Elapsed Duration */}
        <div className="telemetry-cell">
          <div className="telemetry-cell-label">
            <Clock size={13} />
            <span>Mission Clock</span>
          </div>
          <div className="telemetry-cell-value">
            {formatDuration(elapsedSeconds)}
          </div>
          <div className="telemetry-cell-sub">
            Latest Fix: {formatTelemetryTime(currentPoint?.timestamp)}
          </div>
        </div>
      </div>

      {/* Secondary Sensor Parameters */}
      <div className="telemetry-subgrid">
        <div className="telemetry-keyvalue">
          <span className="telemetry-key">Bearing / Heading:</span>
          <span className="telemetry-val">
            {headingDegrees !== null ? `${headingDegrees}° (${bearingToCardinal(headingDegrees)})` : '—'}
          </span>
        </div>
        <div className="telemetry-keyvalue">
          <span className="telemetry-key">Altitude (MSL):</span>
          <span className="telemetry-val">
            {currentPoint?.altitude !== null && currentPoint?.altitude !== undefined
              ? `${currentPoint.altitude.toFixed(1)} m`
              : '—'}
          </span>
        </div>
        <div className="telemetry-keyvalue">
          <span className="telemetry-key">Datum / Projection:</span>
          <span className="telemetry-val">WGS-84 / Web Mercator</span>
        </div>
        <div className="telemetry-keyvalue">
          <span className="telemetry-key">Carrier / Network:</span>
          <span className="telemetry-val" style={{ color: 'var(--color-chartreuse)' }}>
            {isSimulated ? 'Simulated Generator' : 'Browser GNSS / WiFi Position'}
          </span>
        </div>

        {/* Kalman Filter Statistics — only shown in real GPS mode */}
        {!isSimulated && signalQuality && (
          <>
            <div style={{ margin: '8px 0 4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-on-dark-secondary)', fontFamily: 'var(--font-mono)' }}>
                GPS Filter Engine (Kalman)
              </span>
            </div>
            <div className="telemetry-keyvalue">
              <span className="telemetry-key">Fixes Accepted:</span>
              <span className="telemetry-val" style={{ color: '#8BDF5E' }}>
                {signalQuality.consecutiveAccepted} streak / {pointsCount} total
              </span>
            </div>
            <div className="telemetry-keyvalue">
              <span className="telemetry-key">Fixes Rejected:</span>
              <span className="telemetry-val" style={{ color: signalQuality.totalRejected > 0 ? '#F7C444' : 'var(--color-muted)' }}>
                {signalQuality.totalRejected} (teleport/noise/accuracy)
              </span>
            </div>
            <div className="telemetry-keyvalue">
              <span className="telemetry-key">Raw HDOP:</span>
              <span className="telemetry-val">
                {signalQuality.lastAccuracyMeters !== null
                  ? `±${signalQuality.lastAccuracyMeters.toFixed(1)} m`
                  : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main Tracking Controls Toolbar */}
      <div className="telemetry-actions-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-on-dark-secondary)' }}>
            Instrument Controls
          </span>
          {pointsCount > 0 && (
            <button
              type="button"
              onClick={onSaveSession}
              className="btn-instrument btn-dark-subtle"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              title="Save Session Locally and to Cloud"
            >
              <Save size={13} />
              <span>Save Session</span>
            </button>
          )}
        </div>

        {/* Real GPS Tracking Buttons */}
        <div className="control-buttons-row">
          {!isTracking && !isRequesting ? (
            <button
              type="button"
              onClick={onStartRealTracking}
              className="btn-instrument btn-vermilion"
              style={{ flex: 1, padding: '12px' }}
              aria-label="Start Real GPS Live Tracking"
            >
              <Play size={16} fill="currentColor" />
              <span>START LIVE GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopRealTracking}
              className="btn-instrument btn-forest"
              style={{ flex: 1, padding: '12px', border: '1px solid var(--color-vermilion)', color: 'var(--color-vermilion)' }}
              aria-label="Stop Live GPS Tracking"
            >
              <Square size={16} fill="currentColor" />
              <span>STOP TRACKING</span>
            </button>
          )}
        </div>

        {/* Demo Simulation Controls (Reproducible Classroom Presentation) */}
        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px dashed var(--border-dark-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-chartreuse)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={12} />
              <span>Classroom Demo Mode</span>
            </span>
            {isSimulated && (
              <span className="instrument-badge badge-simulated" style={{ fontSize: '9px' }}>
                ACTIVE SIMULATION
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {!isSimulated || status === 'idle' || status === 'stopped' ? (
              <button
                type="button"
                onClick={onStartDemoMode}
                className="btn-instrument btn-chartreuse"
                style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
              >
                <Play size={12} />
                <span>Run Demo Route</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={onResumeDemoMode}
                className="btn-instrument btn-chartreuse"
                style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
              >
                <Play size={12} />
                <span>Resume Demo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPauseDemoMode}
                className="btn-instrument btn-dark-subtle"
                style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
              >
                <Pause size={12} />
                <span>Pause Demo</span>
              </button>
            )}

            {isSimulated && (
              <button
                type="button"
                onClick={onResetDemoMode}
                className="btn-instrument btn-dark-subtle"
                style={{ padding: '6px 10px', fontSize: '11px' }}
                title="Reset Demonstration Route"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Speed multiplier selector */}
          {isSimulated && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-on-dark-dim)' }}>Sim Speed:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 4].map(mult => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => onSetDemoSpeedMultiplier(mult)}
                    style={{
                      background: demoSpeedMultiplier === mult ? 'var(--color-chartreuse)' : 'transparent',
                      color: demoSpeedMultiplier === mult ? 'var(--color-forest)' : 'var(--text-on-dark-secondary)',
                      border: '1px solid var(--border-dark-hairline)',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chronological Recent Points Feed */}
      <div className="telemetry-points-feed">
        <div className="feed-header">
          <span className="feed-title">Recent Telemetry Fixes</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-on-dark-dim)' }}>
            Showing last {Math.min(recentPoints.length, 6)} of {recentPoints.length}
          </span>
        </div>

        <div className="feed-list" role="feed" aria-label="Chronological GNSS position updates">
          {recentPoints.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-on-dark-dim)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              No location telemetry received yet.
              <br />
              <span style={{ color: 'var(--text-on-dark-secondary)' }}>
                Click <strong>START LIVE GPS</strong> or run <strong>Demo Route</strong>.
              </span>
            </div>
          ) : (
            recentPoints.slice(-6).reverse().map(pt => (
              <div key={pt.id} className="feed-item">
                <div>
                  <div className="feed-item-coords">
                    {pt.latitude.toFixed(5)}°, {pt.longitude.toFixed(5)}°
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-on-dark-dim)', marginTop: '2px' }}>
                    Dist: +{pt.distanceFromPreviousMeters} m • Acc: ±{pt.accuracy} m
                  </div>
                </div>
                <div className="feed-item-meta">
                  <div style={{ color: 'var(--color-chartreuse)' }}>
                    {pt.speedKmH !== null ? `${pt.speedKmH} km/h` : '—'}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    {formatTelemetryTime(pt.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
