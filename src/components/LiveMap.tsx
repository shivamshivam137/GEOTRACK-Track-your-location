import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  Circle
} from 'react-leaflet';
import L from 'leaflet';
import {
  Crosshair,
  Maximize2,
  Layers
} from 'lucide-react';
import type { LocationPoint, TrackingStatus } from '../types/tracking';
import { calculateBounds } from '../utils/geoDistance';
import {
  formatLatitudeDD,
  formatLongitudeDD,
  formatCoordinateDMS,
  formatAccuracy,
  formatSpeed,
  formatTelemetryTime
} from '../utils/formatters';

interface LiveMapProps {
  currentPoint: LocationPoint | null;
  points: LocationPoint[];
  status: TrackingStatus;
  isSimulated: boolean;
  selectedSessionPoints?: LocationPoint[] | null;
}

// Map Controller Subcomponent to handle recentering
function MapAutoViewHandler({
  currentPoint,
  shouldRecenterRef
}: {
  currentPoint: LocationPoint | null;
  shouldRecenterRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();

  useEffect(() => {
    if (shouldRecenterRef.current && currentPoint) {
      map.panTo([currentPoint.latitude, currentPoint.longitude], {
        animate: true,
        duration: 0.6
      });
    }
  }, [currentPoint, map, shouldRecenterRef]);

  return null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  currentPoint,
  points,
  status,
  isSimulated,
  selectedSessionPoints
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const autoRecenterRef = useRef<boolean>(true);
  const [mapLayer, setMapLayer] = React.useState<'osm_standard' | 'osm_hot' | 'esri_sat'>('osm_standard');

  // Display either the active tracking points or an inspected session's points
  const displayPoints = selectedSessionPoints || points;
  const activeCurrent = selectedSessionPoints
    ? (selectedSessionPoints.length > 0 ? selectedSessionPoints[selectedSessionPoints.length - 1] : null)
    : currentPoint;
  const startPoint = displayPoints.length > 0 ? displayPoints[0] : null;

  // Polyline coordinates array [lat, lng]
  const polylineCoords = useMemo(() => {
    return displayPoints.map(p => [p.latitude, p.longitude] as [number, number]);
  }, [displayPoints]);

  // Dynamic Tile URLs (100% Free, No API Keys or Watermarks Required)
  const tileConfig = useMemo(() => {
    switch (mapLayer) {
      case 'osm_hot':
        return {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>'
        };
      case 'esri_sat':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        };
      case 'osm_standard':
      default:
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
    }
  }, [mapLayer]);

  // Recenter button click
  const handleRecenter = () => {
    autoRecenterRef.current = true;
    if (mapRef.current && activeCurrent) {
      mapRef.current.setView([activeCurrent.latitude, activeCurrent.longitude], 17, {
        animate: true
      });
    }
  };

  // Fit bounds to entire route
  const handleFitRoute = () => {
    if (!mapRef.current || displayPoints.length === 0) return;
    const bounds = calculateBounds(displayPoints);
    if (bounds) {
      autoRecenterRef.current = false;
      mapRef.current.fitBounds(bounds, {
        padding: [45, 45],
        animate: true,
        maxZoom: 18
      });
    }
  };

  // Custom Live Location Marker Icon (Pulsing Beacon with Cartographic Reticle)
  const liveMarkerIcon = useMemo(() => {
    const isLiveActive = status === 'tracking';
    const ringClass = isSimulated ? 'vermilion-beacon-ring' : 'live-beacon-ring';
    const coreColor = isSimulated ? '#EC5B3B' : '#D8F36A';
    const heading = activeCurrent?.heading;

    return L.divIcon({
      className: 'custom-live-marker-container',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          ${isLiveActive ? `<div class="${ringClass}" style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${coreColor}; opacity: 0.4;"></div>` : ''}
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #172A27; border: 2px solid ${coreColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(23,42,39,0.5);">
            ${heading !== null && heading !== undefined ? `
              <div style="transform: rotate(${heading}deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-bottom: 7px solid ${coreColor}; margin-top: -3px;"></div>
              </div>
            ` : `
              <div style="width: 6px; height: 6px; border-radius: 50%; background: ${coreColor};"></div>
            `}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  }, [status, isSimulated, activeCurrent]);

  // Start Waypoint Icon
  const startMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div style="width: 24px; height: 24px; border-radius: 4px; background: #FFFFFF; border: 2px solid #172A27; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700; color: #172A27;">A</div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }, []);

  // Initial center fallback (Mumbai University / Gateway of India region for realistic context if initial empty state)
  const defaultCenter: [number, number] = [18.9220, 72.8347];
  const initialCenter: [number, number] = activeCurrent
    ? [activeCurrent.latitude, activeCurrent.longitude]
    : defaultCenter;

  return (
    <div className="map-canvas-container" role="region" aria-label="Geospatial Live Map Canvas">
      {/* Map Control Floating Toolbar (Top Left) */}
      <div className="map-floating-bar-top">
        <button
          type="button"
          onClick={handleRecenter}
          disabled={!activeCurrent}
          className="btn-instrument"
          title="Recenter Map on Active Position"
          aria-label="Recenter Map on Active Position"
        >
          <Crosshair size={15} color="var(--color-vermilion)" />
          <span>Recenter</span>
        </button>

        <button
          type="button"
          onClick={handleFitRoute}
          disabled={displayPoints.length === 0}
          className="btn-instrument"
          title="Fit View to Entire Route"
          aria-label="Fit View to Entire Route"
        >
          <Maximize2 size={15} />
          <span>Fit Route ({displayPoints.length} pts)</span>
        </button>
      </div>

      {/* Layer Toggle Floating Controls (Top Right) */}
      <div className="map-floating-bar-right">
        <button
          type="button"
          onClick={() => {
            setMapLayer(prev =>
              prev === 'osm_standard' ? 'osm_hot' : prev === 'osm_hot' ? 'esri_sat' : 'osm_standard'
            );
          }}
          className="btn-instrument"
          title={`Active Style: ${mapLayer}. Click to toggle layer style.`}
          aria-label="Switch map style"
        >
          <Layers size={15} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
            {mapLayer === 'osm_standard' ? 'Standard OSM' : mapLayer === 'osm_hot' ? 'Field Topo' : 'Satellite GNSS'}
          </span>
        </button>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="map-floating-legend">
        <div style={{ fontWeight: 600, color: 'var(--color-chartreuse)', fontSize: '10px', textTransform: 'uppercase' }}>
          Cartographer Legend
        </div>
        <div className="legend-item">
          <div className="legend-dot-origin" />
          <span>Origin Beacon [A]</span>
        </div>
        <div className="legend-item">
          <div className="legend-line-trail" />
          <span>{isSimulated ? 'Simulated Transect' : 'Recorded Route'}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot-live" />
          <span>Live Location Reticle</span>
        </div>
      </div>

      {/* React-Leaflet Map */}
      <MapContainer
        center={initialCenter}
        zoom={activeCurrent ? 16 : 13}
        scrollWheelZoom={true}
        className="leaflet-map-wrapper"
        ref={mapRef}
      >
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />

        {/* Auto view synchronizer */}
        <MapAutoViewHandler
          currentPoint={activeCurrent}
          shouldRecenterRef={autoRecenterRef}
        />

        {/* Trajectory Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: isSimulated ? '#EC5B3B' : '#EC5B3B',
              weight: 4,
              opacity: 0.9,
              dashArray: isSimulated ? '6, 6' : undefined,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Start Position Marker */}
        {startPoint && (
          <Marker
            position={[startPoint.latitude, startPoint.longitude]}
            icon={startMarkerIcon}
          >
            <Popup>
              <div style={{ padding: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <strong style={{ color: 'var(--color-chartreuse)' }}>Origin Beacon [A]</strong>
                <br />
                {formatLatitudeDD(startPoint.latitude)}, {formatLongitudeDD(startPoint.longitude)}
                <br />
                <span style={{ color: '#A5AAA0' }}>Time: {formatTelemetryTime(startPoint.timestamp)}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Current Position Marker */}
        {activeCurrent && (
          <>
            {/* GPS Accuracy Uncertainty Circle (capped visually for map legibility) */}
            <Circle
              center={[activeCurrent.latitude, activeCurrent.longitude]}
              radius={Math.min(250, Math.max(4, activeCurrent.accuracy))}
              pathOptions={{
                fillColor: isSimulated ? '#EC5B3B' : '#D8F36A',
                fillOpacity: 0.12,
                color: isSimulated ? '#EC5B3B' : '#D8F36A',
                weight: 1,
                dashArray: '3, 3'
              }}
            />

            <Marker
              position={[activeCurrent.latitude, activeCurrent.longitude]}
              icon={liveMarkerIcon}
            >
              <Popup>
                <div style={{ padding: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', minWidth: '180px' }}>
                  <div style={{ color: isSimulated ? '#EC5B3B' : '#D8F36A', fontWeight: 700, marginBottom: '4px' }}>
                    {isSimulated ? '● SIMULATED POSITION' : '● LIVE GPS BEACON'}
                  </div>
                  <div><strong>Lat:</strong> {formatLatitudeDD(activeCurrent.latitude)}</div>
                  <div><strong>Lng:</strong> {formatLongitudeDD(activeCurrent.longitude)}</div>
                  <div><strong>DMS:</strong> {formatCoordinateDMS(activeCurrent.latitude, true)}</div>
                  <div><strong>Accuracy:</strong> {formatAccuracy(activeCurrent.accuracy)}</div>
                  <div><strong>Speed:</strong> {formatSpeed(activeCurrent.speedKmH)}</div>
                  <div><strong>Time:</strong> {formatTelemetryTime(activeCurrent.timestamp)}</div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};
