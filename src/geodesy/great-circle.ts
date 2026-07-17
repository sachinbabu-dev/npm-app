import type { LatLon } from './types.js';

export const EARTH_RADIUS_M = 6371008.8;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export function haversineDistance(a: LatLon, b: LatLon, radius: number = EARTH_RADIUS_M): number {
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dPhi = toRad(b.lat - a.lat);
  const dLam = toRad(b.lon - a.lon);
  const h =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function initialBearing(a: LatLon, b: LatLon): number {
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dLam = toRad(b.lon - a.lon);
  const y = Math.sin(dLam) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLam);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function finalBearing(a: LatLon, b: LatLon): number {
  return (initialBearing(b, a) + 180) % 360;
}

export function destinationPoint(
  start: LatLon,
  bearingDeg: number,
  distanceMeters: number,
  radius: number = EARTH_RADIUS_M,
): LatLon {
  const delta = distanceMeters / radius;
  const theta = toRad(bearingDeg);
  const phi1 = toRad(start.lat);
  const lam1 = toRad(start.lon);
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta),
  );
  const lam2 =
    lam1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    );
  return { lat: toDeg(phi2), lon: ((toDeg(lam2) + 540) % 360) - 180 };
}

export function crossTrackDistance(
  point: LatLon,
  pathStart: LatLon,
  pathEnd: LatLon,
  radius: number = EARTH_RADIUS_M,
): number {
  const d13 = haversineDistance(pathStart, point, radius) / radius;
  const theta13 = toRad(initialBearing(pathStart, point));
  const theta12 = toRad(initialBearing(pathStart, pathEnd));
  return Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12)) * radius;
}

export function midpoint(a: LatLon, b: LatLon): LatLon {
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const lam1 = toRad(a.lon);
  const dLam = toRad(b.lon - a.lon);
  const bx = Math.cos(phi2) * Math.cos(dLam);
  const by = Math.cos(phi2) * Math.sin(dLam);
  const phi3 = Math.atan2(
    Math.sin(phi1) + Math.sin(phi2),
    Math.sqrt((Math.cos(phi1) + bx) ** 2 + by ** 2),
  );
  const lam3 = lam1 + Math.atan2(by, Math.cos(phi1) + bx);
  return { lat: toDeg(phi3), lon: ((toDeg(lam3) + 540) % 360) - 180 };
}
