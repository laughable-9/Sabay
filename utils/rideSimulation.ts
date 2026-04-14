import { BAGUIO_CENTER } from '../constants/config';
import type { LatLng } from '../components/SabayMap';

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function buildPolyline(rideId: string, steps = 8): LatLng[] {
  const seed = hash(rideId);
  const base = BAGUIO_CENTER;
  const startLat = base.latitude - 0.018;
  const startLng = base.longitude - 0.012;
  const endLat = base.latitude + 0.004;
  const endLng = base.longitude + 0.010;
  const path: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = Math.sin((seed + i) * 0.9) * 0.0015;
    path.push({
      latitude: startLat + (endLat - startLat) * t + jitter,
      longitude: startLng + (endLng - startLng) * t + jitter * 0.7,
    });
  }
  return path;
}

export function interpolateAlongPath(path: LatLng[], progress: number): LatLng {
  if (path.length === 0) return BAGUIO_CENTER;
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
