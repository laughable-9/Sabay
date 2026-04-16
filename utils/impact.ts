// Per-km CO2 emission for an average sedan, in kg.
// Used as a rough estimate; the STS narrative multiplies by passenger count
// since each rider would otherwise make the same trip alone.
const KG_CO2_PER_KM = 0.12;

export function estimateCO2SavedKg(distanceKm: number, passengerCount: number): number {
  return distanceKm * KG_CO2_PER_KM * passengerCount;
}

export function formatKg(kg: number): string {
  if (kg < 1) return `${(kg * 1000).toFixed(0)} g`;
  return `${kg.toFixed(1)} kg`;
}
