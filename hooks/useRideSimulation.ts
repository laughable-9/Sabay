import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPolyline, interpolateAlongPath } from '../utils/rideSimulation';
import type { LatLng } from '../components/SabayMap';
import type { Ride } from '../utils/types';

const SIMULATION_DURATION_MS = 90_000;

export type SimulatedRide = {
  polyline: LatLng[];
  position: LatLng | null;
  etaLabel: string;
};

export function useRideSimulation(ride: Ride | null): SimulatedRide {
  const polyline = useMemo(() => (ride ? buildPolyline(ride.id) : []), [ride]);
  const startedAt = useRef<number>(Date.now());
  const [position, setPosition] = useState<LatLng | null>(polyline[0] ?? null);
  const [etaLabel, setEtaLabel] = useState('--');

  useEffect(() => {
    if (!ride) return;
    startedAt.current = Date.now();
    setPosition(polyline[0] ?? null);
    const arrivalTime = ride.departureTime + ride.durationMin * 60_000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const progress = Math.min(1, elapsed / SIMULATION_DURATION_MS);
      setPosition(interpolateAlongPath(polyline, progress));
      const remainingMs = arrivalTime - Date.now();
      setEtaLabel(remainingMs <= 0 ? 'Arriving' : `${Math.ceil(remainingMs / 60_000)} min`);
    }, 1000);
    return () => clearInterval(interval);
  }, [ride, polyline]);

  return { polyline, position, etaLabel };
}
