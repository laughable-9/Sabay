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
