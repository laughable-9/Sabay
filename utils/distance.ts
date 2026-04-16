import { BAGUIO_CENTER } from '../constants/config';

export type LocationCoord = {
  latitude: number;
  longitude: number;
};

// Approximate centroids for common Baguio/Benguet landmarks. Good enough for
// map-region fitting and polyline endpoints in the demo.
const LOCATION_COORDS: Record<string, LocationCoord> = {
  'la trinidad': { latitude: 16.4565, longitude: 120.5876 },
  'up baguio': { latitude: 16.3816, longitude: 120.6169 },
  'session road': { latitude: 16.413, longitude: 120.594 },
  'sm baguio': { latitude: 16.4141, longitude: 120.5936 },
  'slu maryheights': { latitude: 16.3987, longitude: 120.5969 },
  'itogon': { latitude: 16.3625, longitude: 120.6781 },
  'baguio cbd': { latitude: 16.4115, longitude: 120.5935 },
  'tuba': { latitude: 16.3392, longitude: 120.5725 },
  'camp john hay': { latitude: 16.4031, longitude: 120.6055 },
  'ambuklao': { latitude: 16.4639, longitude: 120.7906 },
  'pinsao proper': { latitude: 16.4212, longitude: 120.5783 },
  'trancoville': { latitude: 16.4221, longitude: 120.5974 },
};

const CACHED_ROUTES: Record<string, { distanceKm: number; durationMin: number }> = {
  'la trinidad|up baguio': { distanceKm: 8, durationMin: 25 },
  'la trinidad|session road': { distanceKm: 9, durationMin: 28 },
  'la trinidad|sm baguio': { distanceKm: 9, durationMin: 30 },
  'up baguio|sm baguio': { distanceKm: 5, durationMin: 18 },
  'up baguio|session road': { distanceKm: 3, durationMin: 10 },
  'slu maryheights|sm baguio': { distanceKm: 6, durationMin: 20 },
  'slu maryheights|up baguio': { distanceKm: 4, durationMin: 15 },
  'itogon|baguio cbd': { distanceKm: 14, durationMin: 40 },
  'itogon|up baguio': { distanceKm: 13, durationMin: 38 },
  'tuba|up baguio': { distanceKm: 12, durationMin: 35 },
  'tuba|baguio cbd': { distanceKm: 11, durationMin: 33 },
  'camp john hay|sm baguio': { distanceKm: 5, durationMin: 18 },
  'camp john hay|session road': { distanceKm: 4, durationMin: 14 },
  'sm baguio|session road': { distanceKm: 2, durationMin: 8 },
};

export type DistanceEstimate = {
  distanceKm: number;
  durationMin: number;
  source: 'cached' | 'heuristic';
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function getCoord(name: string): LocationCoord {
  return LOCATION_COORDS[normalize(name)] ?? BAGUIO_CENTER;
}

/** Haversine distance in km between two coordinates. */
function haversineKm(a: LocationCoord, b: LocationCoord): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Returns true if `waypoint` is roughly on the way from `from` to `to`.
 * Uses the triangle-inequality detour check: if going from→waypoint→to adds
 * no more than 30% extra distance compared to from→to, it's "on the way".
 */
export function isOnTheWay(from: string, waypoint: string, to: string): boolean {
  const a = getCoord(from);
  const w = getCoord(waypoint);
  const b = getCoord(to);
  const direct = haversineKm(a, b);
  if (direct < 0.5) return false; // same place
  const detour = haversineKm(a, w) + haversineKm(w, b);
  return detour <= direct * 1.3;
}

export function estimateDistance(from: string, to: string): DistanceEstimate {
  const a = normalize(from);
  const b = normalize(to);
  const direct = CACHED_ROUTES[`${a}|${b}`];
  if (direct) return { ...direct, source: 'cached' };
  const reverse = CACHED_ROUTES[`${b}|${a}`];
  if (reverse) return { ...reverse, source: 'cached' };

  const base = 6;
  const textFactor = Math.min(10, Math.abs(a.length - b.length) * 0.3 + 2);
  const distanceKm = Math.round((base + textFactor) * 10) / 10;
  const durationMin = Math.round(distanceKm * 3);
  return { distanceKm, durationMin, source: 'heuristic' };
}
