import React from 'react';
import {
  X,
  MapPin,
  Download,
  Trash2
} from 'lucide-react';
import type { TrackingSession } from '../types/tracking';
import {
  formatDistance,
  formatSpeed,
  formatDuration,
  formatDateTime,
  formatLatitudeDD,
  formatLongitudeDD
} from '../utils/formatters';
import { TrackingRepository } from '../services/trackingRepository';

interface SessionDetailModalProps {
  session: TrackingSession | null;
  onClose: () => void;
  onInspectOnMap: (session: TrackingSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onInspectOnMap,
  onDeleteSession
}) => {
  if (!session) return null;

  const handleDownloadGeoJSON = () => {
    const geoJsonStr = TrackingRepository.exportToGeoJSON(session);
    const blob = new Blob([geoJsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.id}_route.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startPt = session.points.length > 0 ? session.points[0] : null;
  const endPt = session.points.length > 0 ? session.points[session.points.length - 1] : null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="instrument-badge" style={{ background: 'var(--color-chartreuse)', color: 'var(--color-forest)', fontSize: '9px' }}>
                {session.isSimulated ? 'SIMULATION' : 'FIELD LOG'}
              </span>
              <h3 style={{ color: 'var(--color-ivory)', fontSize: '15px' }}>
                {session.title}
              </h3>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-on-dark-secondary)', marginTop: '2px' }}>
              ID: {session.id} • {formatDateTime(session.startTime)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-on-dark-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-stone-subtle)', borderRadius: '4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                TOTAL DISTANCE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--color-vermilion)' }}>
                {formatDistance(session.totalDistanceMeters)}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-stone-subtle)', borderRadius: '4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                RECORDED DURATION
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--color-forest)' }}>
                {formatDuration(session.durationSeconds)}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-stone-subtle)', borderRadius: '4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                VALID POINTS
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--color-forest)' }}>
                {session.points.length}
              </div>
            </div>
          </div>

          {/* Speed & Geodesic Extents */}
          <div style={{ padding: '14px', border: '1px solid var(--border-hairline)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Speed:</span>
              <strong>{formatSpeed(session.averageSpeedKmH)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Max Velocity:</span>
              <strong>{formatSpeed(session.maxSpeedKmH)}</strong>
            </div>
            {startPt && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Origin Coordinates:</span>
                <span>{formatLatitudeDD(startPt.latitude)}, {formatLongitudeDD(startPt.longitude)}</span>
              </div>
            )}
            {endPt && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Terminal Coordinates:</span>
                <span>{formatLatitudeDD(endPt.latitude)}, {formatLongitudeDD(endPt.longitude)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this recorded trajectory session from storage?')) {
                onDeleteSession(session.id);
                onClose();
              }
            }}
            className="btn-instrument"
            style={{ color: '#B52B0E', borderColor: '#F5C5BB' }}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadGeoJSON}
              className="btn-instrument"
              title="Download standard GeoJSON route file"
            >
              <Download size={14} />
              <span>Export GeoJSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onInspectOnMap(session);
                onClose();
              }}
              className="btn-instrument btn-vermilion"
            >
              <MapPin size={14} />
              <span>Inspect on Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
