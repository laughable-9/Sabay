import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildPolylineBetween,
  driverApproachStart,
  interpolateAlongPath,
  regionForPath,
} from '../utils/rideSimulation';
import { getCoord } from '../utils/distance';
import type { LatLng } from '../components/SabayMap';
import type { Ride } from '../utils/types';
import { useApp } from '../context/AppContext';

const PHASE_PICKUP_DURATION_MS = 15_000;
const PHASE_DESTINATION_DURATION_MS = 30_000;

export type SimulatedRide = {
  polyline: LatLng[];
  position: LatLng | null;
  progress: number;
  etaLabel: string;
  region: ReturnType<typeof regionForPath>;
  phaseLabel: string;
};

export function useRideSimulation(ride: Ride | null): SimulatedRide {
  const { dispatch } = useApp();

  const pickupCoord = useMemo(() => (ride ? getCoord(ride.from) : null), [ride]);
  const destinationCoord = useMemo(() => (ride ? getCoord(ride.to) : null), [ride]);

  const pickupPolyline = useMemo(() => {
    if (!ride || !pickupCoord) return [];
    const start = driverApproachStart(ride.id, pickupCoord);
    return buildPolylineBetween(ride.id + 'pickup', start, pickupCoord);
  }, [ride, pickupCoord]);

  const tripPolyline = useMemo(() => {
    if (!ride || !pickupCoord || !destinationCoord) return [];
    return buildPolylineBetween(ride.id + 'trip', pickupCoord, destinationCoord);
  }, [ride, pickupCoord, destinationCoord]);

  const phase: 'pickup' | 'destination' | 'idle' = useMemo(() => {
    if (!ride) return 'idle';
    if (ride.driverStatus === 'to_pickup') return 'pickup';
    if (ride.driverStatus === 'at_pickup') return 'pickup';
    if (ride.driverStatus === 'to_destination') return 'destination';
    return 'idle';
  }, [ride?.driverStatus]);

  const activePolyline =
    phase === 'destination' ? tripPolyline : pickupPolyline;
  const activeDuration =
    phase === 'destination' ? PHASE_DESTINATION_DURATION_MS : PHASE_PICKUP_DURATION_MS;
  const region = useMemo(() => regionForPath(activePolyline), [activePolyline]);

  const [position, setPosition] = useState<LatLng | null>(
    activePolyline[0] ?? null,
  );
  const [progress, setProgress] = useState(0);
  const [etaLabel, setEtaLabel] = useState('--');

  const phaseStartedAt = useRef<number>(Date.now());
  const hasTransitionedThisPhase = useRef(false);

  useEffect(() => {
    if (!ride || phase === 'idle') return;
    phaseStartedAt.current = Date.now();
    hasTransitionedThisPhase.current = false;
    setPosition(activePolyline[0] ?? null);
    setProgress(0);

    const interval = setInterval(() => {
      const elapsed = Date.now() - phaseStartedAt.current;
      const p = Math.min(1, elapsed / activeDuration);
      setProgress(p);
      setPosition(interpolateAlongPath(activePolyline, p));
      const remaining = Math.max(0, activeDuration - elapsed);
      const mins = Math.ceil(remaining / 60_000);
      setEtaLabel(remaining <= 1000 ? 'Arriving' : `${mins} min`);

      if (p >= 1 && !hasTransitionedThisPhase.current) {
        hasTransitionedThisPhase.current = true;
        if (phase === 'pickup' && ride.driverStatus === 'to_pickup') {
          dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'at_pickup' });
        } else if (phase === 'destination' && ride.driverStatus === 'to_destination') {
          dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'arrived' });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [ride?.id, ride?.driverStatus, phase, activePolyline, activeDuration, dispatch]);

  const phaseLabel =
    phase === 'pickup'
      ? ride?.driverStatus === 'at_pickup'
        ? 'Arrived at pickup'
        : `Heading to pickup at ${ride?.from ?? ''}`
      : phase === 'destination'
        ? `En route to ${ride?.to ?? ''}`
        : '';

  return {
    polyline: activePolyline,
    position,
    progress,
    etaLabel,
    region,
    phaseLabel,
  };
}
