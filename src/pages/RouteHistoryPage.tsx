import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Trash2,
  ExternalLink,
  Compass,
  MapPin
} from 'lucide-react';
import type { TrackingSession } from '../types/tracking';
import { TrackingRepository } from '../services/trackingRepository';
import {
  formatDistance,
  formatDuration,
  formatDateTime,
  formatSpeed
} from '../utils/formatters';

interface RouteHistoryPageProps {
  onInspectSessionOnMap: (session: TrackingSession) => void;
  onOpenSessionDetails: (session: TrackingSession) => void;
}

export const RouteHistoryPage: React.FC<RouteHistoryPageProps> = ({
  onInspectSessionOnMap,
  onOpenSessionDetails
}) => {
  const [sessions, setSessions] = useState<TrackingSession[]>([]);

  const loadSessions = () => {
    const list = TrackingRepository.getLocalSessions();
    setSessions(list);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this route from local history?')) {
      TrackingRepository.deleteLocalSession(id);
      loadSessions();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all recorded route history?')) {
      TrackingRepository.clearAllLocalSessions();
      loadSessions();
    }
  };

  return (
    <div className="history-page-container">
      <div className="history-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--color-forest)' }}>
              Recorded Route Archives
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Historical telemetry logs, geodesic paths, and distance metrics stored in local storage.
            </p>
          </div>

          {sessions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="btn-instrument"
              style={{ color: '#B52B0E', borderColor: '#F5C5BB', fontSize: '11px' }}
            >
              <Trash2 size={13} />
              <span>Clear All Archives</span>
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-strong)',
            borderRadius: '6px',
            maxWidth: '600px',
            margin: '40px auto'
          }}
        >
          <Compass size={40} color="var(--color-stone)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--color-forest)', marginBottom: '8px' }}>
            No Field Trajectories Recorded Yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Begin tracking on the Live Tracking screen or trigger the Classroom Demo route. Once you click &quot;Save Session&quot;, your recorded routes will appear here.
          </p>
        </div>
      ) : (
        <div className="history-cards-grid">
          {sessions.map(session => (
            <div
              key={session.id}
              className="history-card"
              onClick={() => onOpenSessionDetails(session)}
              style={{ cursor: 'pointer' }}
            >
              <div className="history-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {session.isSimulated ? (
                      <span className="instrument-badge badge-simulated" style={{ fontSize: '9px' }}>
                        SIMULATED
                      </span>
                    ) : (
                      <span className="instrument-badge badge-live" style={{ fontSize: '9px' }}>
                        GPS FIX
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      #{session.id.slice(-6)}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '14px', color: 'var(--color-forest)' }}>
                    {session.title}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={e => handleDelete(session.id, e)}
                  title="Delete Session"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <Calendar size={13} />
                <span>{formatDateTime(session.startTime)}</span>
              </div>

              {/* Stats Box */}
              <div className="history-card-stats">
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DISTANCE</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-vermilion)' }}>
                    {formatDistance(session.totalDistanceMeters)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DURATION</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-forest)' }}>
                    {formatDuration(session.durationSeconds)}
                  </div>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>POINTS</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {session.points.length} coords
                  </div>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AVG SPEED</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {formatSpeed(session.averageSpeedKmH)}
                  </div>
                </div>
              </div>

              {/* Inspect Button */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onInspectSessionOnMap(session);
                  }}
                  className="btn-instrument btn-vermilion"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
                >
                  <MapPin size={13} />
                  <span>Inspect on Live Map</span>
                </button>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onOpenSessionDetails(session);
                  }}
                  className="btn-instrument"
                  style={{ padding: '7px 10px', fontSize: '12px' }}
                  title="View Details & GeoJSON Export"
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
