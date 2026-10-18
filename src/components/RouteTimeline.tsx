import React from 'react';
import {
  Navigation,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import type { LocationPoint } from '../types/tracking';
import { formatDistance, formatSpeed, formatTelemetryTime } from '../utils/formatters';

interface RouteTimelineProps {
  points: LocationPoint[];
  totalDistanceMeters: number;
  currentSpeedKmH: number | null;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  points,
  totalDistanceMeters,
  currentSpeedKmH
}) => {
  const startPoint = points.length > 0 ? points[0] : null;
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;

  // Max 24 display nodes in bottom timeline
  const maxNodes = 24;
  const sampleStep = Math.max(1, Math.floor(points.length / maxNodes));
  const sampledNodes = points.filter((_, idx) => idx % sampleStep === 0).slice(-maxNodes);

  return (
    <footer className="bottom-timeline-strip" aria-label="Route Progress Strip">
      <div className="timeline-left">
        <div className="timeline-strip-label">
          <Activity size={14} color="var(--color-vermilion)" />
          <span>Active Transect Trail</span>
        </div>

        {/* Visual Points Nodes Representation */}
        <div className="timeline-points-bar" title={`${points.length} coordinates recorded`}>
          {points.length === 0 ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              Awaiting trajectory initialization...
            </span>
          ) : (
            sampledNodes.map((pt, i) => (
              <div
                key={pt.id || i}
                className={`timeline-node ${i === sampledNodes.length - 1 ? 'highlighted' : ''}`}
                title={`Point ${i + 1}: ${pt.latitude.toFixed(4)}°, ${pt.longitude.toFixed(4)}° • ${formatTelemetryTime(pt.timestamp)}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="timeline-right">
        {startPoint && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Origin:</span>
            <strong>{formatTelemetryTime(startPoint.timestamp)}</strong>
          </div>
        )}

        {latestPoint && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowRight size={13} color="var(--color-stone)" />
            <span style={{ color: 'var(--text-secondary)' }}>Latest Fix:</span>
            <strong>{formatTelemetryTime(latestPoint.timestamp)}</strong>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
          <Navigation size={13} color="var(--color-vermilion)" />
          <span style={{ color: 'var(--text-secondary)' }}>Distance:</span>
          <strong style={{ color: 'var(--color-vermilion)' }}>
            {formatDistance(totalDistanceMeters)}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={13} color="var(--color-forest)" />
          <span style={{ color: 'var(--text-secondary)' }}>Speed:</span>
          <strong>{formatSpeed(currentSpeedKmH)}</strong>
        </div>
      </div>
    </footer>
  );
};
