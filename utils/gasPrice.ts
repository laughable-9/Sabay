import { FALLBACK_GAS_PRICE_PHP_PER_LITER } from '../constants/config';
import type { FuelType, GasPriceSubmission } from './types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LOOKBACK_COUNT = 20;
const MIN_SUBMISSIONS_FOR_AGGREGATE = 5;

export type GasPriceAggregate = {
  fuelType: FuelType;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  reportCount: number;
  lastUpdated: number | null;
  trend: 'up' | 'down' | 'stable';
  usingFallback: boolean;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stddev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function markOutliers<T extends GasPriceSubmission>(submissions: T[]): T[] {
  if (submissions.length < 3) return submissions.map((s) => ({ ...s, isOutlier: false }));
  const prices = submissions.map((s) => s.pricePerLiter);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const sd = stddev(prices, mean);
  if (sd === 0) return submissions.map((s) => ({ ...s, isOutlier: false }));
  return submissions.map((s) => ({
    ...s,
    isOutlier: Math.abs(s.pricePerLiter - mean) > 2 * sd,
  }));
}

export function aggregateGasPrices(
  submissions: GasPriceSubmission[],
  fuelType: FuelType,
  now: number = Date.now(),
): GasPriceAggregate {
  const recent = submissions
    .filter((s) => s.fuelType === fuelType)
    .filter((s) => now - s.submittedAt <= SEVEN_DAYS_MS)
    .sort((a, b) => b.submittedAt - a.submittedAt)
    .slice(0, LOOKBACK_COUNT);

  if (recent.length < MIN_SUBMISSIONS_FOR_AGGREGATE) {
    return {
      fuelType,
      medianPrice: FALLBACK_GAS_PRICE_PHP_PER_LITER,
      minPrice: FALLBACK_GAS_PRICE_PHP_PER_LITER,
      maxPrice: FALLBACK_GAS_PRICE_PHP_PER_LITER,
      reportCount: recent.length,
      lastUpdated: recent[0]?.submittedAt ?? null,
      trend: 'stable',
      usingFallback: true,
    };
  }

  const valid = recent.filter((s) => !s.isOutlier).map((s) => s.pricePerLiter);
  const currentMedian = median(valid);
  const previousWeek = submissions
    .filter((s) => s.fuelType === fuelType && !s.isOutlier)
    .filter((s) => {
      const age = now - s.submittedAt;
      return age > SEVEN_DAYS_MS && age <= 2 * SEVEN_DAYS_MS;
    })
    .map((s) => s.pricePerLiter);
  const prevMedian = previousWeek.length > 0 ? median(previousWeek) : currentMedian;
  const delta = currentMedian - prevMedian;
  const trend: GasPriceAggregate['trend'] =
    Math.abs(delta) < 0.5 ? 'stable' : delta > 0 ? 'up' : 'down';

  return {
    fuelType,
    medianPrice: currentMedian,
    minPrice: Math.min(...valid),
    maxPrice: Math.max(...valid),
    reportCount: recent.length,
    lastUpdated: recent[0].submittedAt,
    trend,
    usingFallback: false,
  };
}
