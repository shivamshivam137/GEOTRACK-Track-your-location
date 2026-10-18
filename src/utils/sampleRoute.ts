import { calculateBearing } from './geoDistance';

export interface PredefinedWayPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  speedKmH: number;
  accuracy: number;
  note: string;
}

/**
 * Predefined realistic field transect:
 * Mumbai Coastal Field Route (Marine Drive Transect, Mumbai University WMC Test)
 * High accuracy simulation points spaced across 18.9220 N to 18.9540 N.
 */
export const SAMPLE_ROUTE_WAYPOINTS: PredefinedWayPoint[] = [
  {
    latitude: 18.9224,
    longitude: 72.8211,
    altitude: 4.2,
    speedKmH: 0.0,
    accuracy: 4.8,
    note: 'WayPoint 01: Nariman Point Beacon'
  },
  {
    latitude: 18.9248,
    longitude: 72.8225,
    altitude: 4.5,
    speedKmH: 22.4,
    accuracy: 4.2,
    note: 'WayPoint 02: NCPA Junction'
  },
  {
    latitude: 18.9281,
    longitude: 72.8239,
    altitude: 4.6,
    speedKmH: 34.8,
    accuracy: 5.1,
    note: 'WayPoint 03: Air India Building Approach'
  },
  {
    latitude: 18.9325,
    longitude: 72.8248,
    altitude: 5.0,
    speedKmH: 42.1,
    accuracy: 4.9,
    note: 'WayPoint 04: Oval Maidan Promenade'
  },
  {
    latitude: 18.9372,
    longitude: 72.8242,
    altitude: 5.2,
    speedKmH: 38.6,
    accuracy: 3.8,
    note: 'WayPoint 05: Churchgate Station West Arc'
  },
  {
    latitude: 18.9418,
    longitude: 72.8229,
    altitude: 5.1,
    speedKmH: 36.2,
    accuracy: 4.1,
    note: 'WayPoint 06: Brabourne Sector'
  },
  {
    latitude: 18.9465,
    longitude: 72.8198,
    altitude: 4.8,
    speedKmH: 31.5,
    accuracy: 4.5,
    note: 'WayPoint 07: Princess Street Flyover Bay'
  },
  {
    latitude: 18.9504,
    longitude: 72.8164,
    altitude: 4.4,
    speedKmH: 28.0,
    accuracy: 5.2,
    note: 'WayPoint 08: Marine Lines Coastal Curve'
  },
  {
    latitude: 18.9542,
    longitude: 72.8131,
    altitude: 4.1,
    speedKmH: 19.4,
    accuracy: 4.6,
    note: 'WayPoint 09: Chowpatty South Ingress'
  },
  {
    latitude: 18.9558,
    longitude: 72.8115,
    altitude: 3.9,
    speedKmH: 0.0,
    accuracy: 3.9,
    note: 'WayPoint 10: Girgaon Chowpatty Terminal'
  }
];

/**
 * Generates intermediate interpolated points to give smooth real-time simulated telemetry
 */
export function generateDenseSimulatedRoute(stepsBetweenPoints = 4): {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number; // m/s
  speedKmH: number;
  accuracy: number;
  heading: number;
  note: string;
}[] {
  const densePoints = [];

  for (let i = 0; i < SAMPLE_ROUTE_WAYPOINTS.length - 1; i++) {
    const p1 = SAMPLE_ROUTE_WAYPOINTS[i];
    const p2 = SAMPLE_ROUTE_WAYPOINTS[i + 1];

    const bearing = calculateBearing(p1.latitude, p1.longitude, p2.latitude, p2.longitude);

    for (let step = 0; step < stepsBetweenPoints; step++) {
      const ratio = step / stepsBetweenPoints;
      const lat = p1.latitude + (p2.latitude - p1.latitude) * ratio;
      const lng = p1.longitude + (p2.longitude - p1.longitude) * ratio;
      const alt = p1.altitude + (p2.altitude - p1.altitude) * ratio;
      const speedKmH = p1.speedKmH + (p2.speedKmH - p1.speedKmH) * ratio;
      const acc = p1.accuracy + (p2.accuracy - p1.accuracy) * ratio;

      densePoints.push({
        latitude: Math.round(lat * 1000000) / 1000000,
        longitude: Math.round(lng * 1000000) / 1000000,
        altitude: Math.round(alt * 10) / 10,
        speed: Math.round((speedKmH / 3.6) * 100) / 100,
        speedKmH: Math.round(speedKmH * 10) / 10,
        accuracy: Math.round(acc * 10) / 10,
        heading: Math.round(bearing),
        note: step === 0 ? p1.note : `Interp Segment ${i + 1}.${step}`
      });
    }
  }

  // Add final waypoint
  const last = SAMPLE_ROUTE_WAYPOINTS[SAMPLE_ROUTE_WAYPOINTS.length - 1];
  const secondLast = SAMPLE_ROUTE_WAYPOINTS[SAMPLE_ROUTE_WAYPOINTS.length - 2];
  const finalBearing = calculateBearing(
    secondLast.latitude,
    secondLast.longitude,
    last.latitude,
    last.longitude
  );

  densePoints.push({
    latitude: last.latitude,
    longitude: last.longitude,
    altitude: last.altitude,
    speed: 0,
    speedKmH: 0,
    accuracy: last.accuracy,
    heading: Math.round(finalBearing),
    note: last.note
  });

  return densePoints;
}
