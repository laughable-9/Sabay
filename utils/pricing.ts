import {
  DEFAULT_FUEL_EFFICIENCY_KM_PER_L,
  PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_PHP,
} from '../constants/config';

export type PricingInput = {
  distanceKm: number;
  fuelPricePerLiter: number;
  fuelEfficiency?: number;
  passengerCount: number;
  terrainMultiplier?: number;
};

export type PricingBreakdown = {
  distanceKm: number;
  fuelPricePerLiter: number;
  fuelEfficiency: number;
  terrainMultiplier: number;
  passengerCount: number;
  litersUsed: number;
  baseFuelCost: number;
  splitPerPerson: number;
  platformFee: number;
  farePerPerson: number;
};

export function calculateFare(input: PricingInput): PricingBreakdown {
  const efficiency = input.fuelEfficiency ?? DEFAULT_FUEL_EFFICIENCY_KM_PER_L;
  const terrain = input.terrainMultiplier ?? 1.0;
  const passengers = Math.max(1, input.passengerCount);

  const litersUsed = input.distanceKm / efficiency;
  const baseFuelCost = litersUsed * input.fuelPricePerLiter * terrain;
  const splitPerPerson = baseFuelCost / passengers;
  const platformFee = Math.max(PLATFORM_FEE_PHP, splitPerPerson * PLATFORM_FEE_PERCENT);
  const farePerPerson = splitPerPerson + platformFee;

  return {
    distanceKm: input.distanceKm,
    fuelPricePerLiter: input.fuelPricePerLiter,
    fuelEfficiency: efficiency,
    terrainMultiplier: terrain,
    passengerCount: passengers,
    litersUsed,
    baseFuelCost,
    splitPerPerson,
    platformFee,
    farePerPerson,
  };
}

export function formatPHP(amount: number): string {
  return `PHP ${amount.toFixed(2)}`;
}
