import type { LocationCoord } from './distance';
import { getCachedPolyline } from './cachedPolylines';

export type LatLng = LocationCoord;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function buildPolylineBetween(
  seedId: string,
  start: LatLng,
  end: LatLng,
  fromName?: string,
  toName?: string,
  steps = 14,
): LatLng[] {
  if (fromName && toName) {
    const cached = getCachedPolyline(fromName, toName);
    if (cached) return cached;
  }

  const seed = hash(seedId);

  // If the caller passed identical (or near-identical) coords — usually
  // because the user typed an unknown origin/destination and both fell
  // back to BAGUIO_CENTER via getCoord — synthesize a small displacement
  // so the polyline has visible length and the pin has somewhere to move.
  const EPSILON = 1e-6;
  let resolvedEnd = end;
  const initialDistance = Math.hypot(end.latitude - start.latitude, end.longitude - start.longitude);
  if (initialDistance < EPSILON) {
    const angle = ((seed % 360) * Math.PI) / 180;
    const r = 0.008;
    resolvedEnd = {
      latitude: start.latitude + r * Math.cos(angle),
      longitude: start.longitude + r * Math.sin(angle),
    };
  }

  const dLat = resolvedEnd.latitude - start.latitude;
  const dLng = resolvedEnd.longitude - start.longitude;
  const distance = Math.hypot(dLat, dLng);
  const amplitude = distance * 0.08;

  const normLat = -dLng / (distance || 1);
  const normLng = dLat / (distance || 1);

  const path: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wiggle =
      Math.sin(t * Math.PI * 2 + seed * 0.01) * 0.6 +
      Math.sin(t * Math.PI * 4 + seed * 0.03) * 0.3;
    const taper = Math.sin(t * Math.PI);
    const offset = wiggle * amplitude * taper;
    path.push({
      latitude: start.latitude + dLat * t + normLat * offset,
      longitude: start.longitude + dLng * t + normLng * offset,
    });
  }
  return path;
}

// Given a pickup coord, synthesize a plausible "driver is approaching" start
// point roughly 1km away, deterministic per ride id.
export function driverApproachStart(rideId: string, pickup: LatLng): LatLng {
  const seed = hash(rideId);
  const angle = ((seed % 360) * Math.PI) / 180;
  const r = 0.012; // ~1.3 km at Baguio's latitude
  return {
    latitude: pickup.latitude + r * Math.cos(angle),
    longitude: pickup.longitude + r * Math.sin(angle),
  };
}

export function interpolateAlongPath(path: LatLng[], progress: number): LatLng {
  if (path.length === 0) return { latitude: 0, longitude: 0 };
  const clamped = Math.max(0, Math.min(1, progress));
  const segmentFloat = clamped * (path.length - 1);
  const i = Math.floor(segmentFloat);
  if (i >= path.length - 1) return path[path.length - 1];
  const t = segmentFloat - i;
  const a = path[i];
  const b = path[i + 1];
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

export function shortToken(rideId: string): string {
  const base = Math.abs(hash(rideId)).toString(36);
  return (base + Math.random().toString(36).slice(2)).slice(0, 10);
}

export function regionForPath(path: LatLng[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | undefined {
  if (path.length === 0) return undefined;
  let minLat = path[0].latitude;
  let maxLat = path[0].latitude;
  let minLng = path[0].longitude;
  let maxLng = path[0].longitude;
  for (const p of path) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }
  const latitudeDelta = Math.max(0.01, (maxLat - minLat) * 1.6);
  const longitudeDelta = Math.max(0.01, (maxLng - minLng) * 1.6);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
