import React from 'react';
import {
  Compass,
  MapPin,
  Clock,
  Cloud,
  BookOpen
} from 'lucide-react';
import type { TrackingStatus } from '../types/tracking';

export type NavView = 'live' | 'history' | 'cloud' | 'overview';

interface NavigationRailProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  status: TrackingStatus;
  isSimulated: boolean;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentView,
  onSelectView,
  status,
  isSimulated
}) => {
  const isTracking = status === 'tracking';

  return (
    <nav className="nav-rail" aria-label="Primary Field Navigation Rail">
      <div className="nav-rail-top">
        {/* GeoTrack Wordmark Icon */}
        <div
          className="nav-logo-mark"
          title="GeoTrack — Cartographer's Field Console"
          onClick={() => onSelectView('live')}
          style={{ cursor: 'pointer' }}
        >
          <Compass size={24} />
        </div>

        {/* Primary View Navigation Buttons */}
        <div className="nav-items-group">
          <button
            type="button"
            className={`nav-button ${currentView === 'live' ? 'active' : ''}`}
            onClick={() => onSelectView('live')}
            title="Live GPS Tracking Canvas"
            aria-label="Live Tracking View"
          >
            <MapPin size={20} />
            <span className="nav-label-micro">TRACK</span>
          </button>

          <button
            type="button"
            className={`nav-button ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onSelectView('history')}
            title="Recorded Route History & Archives"
            aria-label="Route History View"
          >
            <Clock size={20} />
            <span className="nav-label-micro">ROUTES</span>
          </button>

          <button
            type="button"
            className={`nav-button ${currentView === 'cloud' ? 'active' : ''}`}
            onClick={() => onSelectView('cloud')}
            title="Cloud Synchronization & Firebase Status"
            aria-label="Cloud and Connection View"
          >
            <Cloud size={20} />
            <span className="nav-label-micro">CLOUD</span>
          </button>

          <button
            type="button"
            className={`nav-button ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectView('overview')}
            title="Mumbai University WMC Project Architecture"
            aria-label="WMC Academic Documentation View"
          >
            <BookOpen size={20} />
            <span className="nav-label-micro">WMC BE</span>
          </button>
        </div>
      </div>

      <div className="nav-rail-bottom">
        {/* Hardware / GNSS Live Status Beacon */}
        <div
          className={`live-indicator-dot ${
            isTracking ? (isSimulated ? 'simulated' : 'active') : ''
          }`}
          title={
            isTracking
              ? isSimulated
                ? 'Simulation Running'
                : 'Live GPS Satellite Fix Active'
              : 'GNSS Receiver Idle'
          }
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--text-on-dark-dim)',
            textAlign: 'center'
          }}
        >
          v1.0
        </span>
      </div>
    </nav>
  );
};
