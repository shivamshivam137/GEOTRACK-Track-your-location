/**
 * Cartographic Formatters for GeoTrack Field Console
 * Provides precise instrument readouts for coordinates, distances, speeds, and timestamps.
 */

/**
 * Formats latitude to Decimal Degrees with direction indicator (N/S).
 * Example: 18.922000° N
 */
export function formatLatitudeDD(lat: number | null | undefined, precision = 6): string {
  if (lat === null || lat === undefined || isNaN(lat)) return '—';
  const dir = lat >= 0 ? 'N' : 'S';
  return `${Math.abs(lat).toFixed(precision)}° ${dir}`;
}

/**
 * Formats longitude to Decimal Degrees with direction indicator (E/W).
 * Example: 72.834700° E
 */
export function formatLongitudeDD(lng: number | null | undefined, precision = 6): string {
  if (lng === null || lng === undefined || isNaN(lng)) return '—';
  const dir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lng).toFixed(precision)}° ${dir}`;
}

/**
 * Converts decimal degrees to Degrees Minutes Seconds (DMS) format.
 * Example: 18° 55' 19.2" N
 */
export function formatCoordinateDMS(
  val: number | null | undefined,
  isLatitude: boolean
): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const dir = isLatitude ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  const absVal = Math.abs(val);
  const degrees = Math.floor(absVal);
  const minutesDec = (absVal - degrees) * 60;
  const minutes = Math.floor(minutesDec);
  const seconds = ((minutesDec - minutes) * 60).toFixed(1);

  return `${degrees}° ${minutes}' ${seconds}" ${dir}`;
}

/**
 * Formats distance with appropriate units (m or km).
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || isNaN(meters)) return '0.0 m';
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Formats speed in km/h. If null, displays honest placeholder '—'.
 */
export function formatSpeed(kmH: number | null | undefined): string {
  if (kmH === null || kmH === undefined || isNaN(kmH)) return '—';
  return `${kmH.toFixed(1)} km/h`;
}

/**
 * Formats accuracy in meters with ± symbol.
 */
export function formatAccuracy(accuracyMeters: number | null | undefined): string {
  if (accuracyMeters === null || accuracyMeters === undefined || isNaN(accuracyMeters)) return '—';
  return `±${accuracyMeters.toFixed(1)} m`;
}

/**
 * Formats duration in seconds to HH:MM:SS.
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats epoch timestamp into military / ISO-like field console time.
 * Example: 21:14:08.452
 */
export function formatTelemetryTime(epochMs: number | null | undefined): string {
  if (!epochMs) return '—';
  const d = new Date(epochMs);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`;
}

/**
 * Formats epoch timestamp to full date and time.
 * Example: Oct 17, 2026 • 21:14:08
 */
export function formatDateTime(epochMs: number | null | undefined): string {
  if (!epochMs) return '—';
  const d = new Date(epochMs);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}
