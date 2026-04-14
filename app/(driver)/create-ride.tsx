import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { calculateFare } from '../../utils/pricing';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { estimateDistance } from '../../utils/distance';
import { DEFAULT_FUEL_EFFICIENCY_KM_PER_L } from '../../constants/config';
import { colors, spacing } from '../../constants/theme';
import type { Ride } from '../../utils/types';

const HOUR = 60 * 60 * 1000;

export default function CreateRide() {
  const { state, dispatch, currentUser } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [seats, setSeats] = useState('3');
  const [notes, setNotes] = useState('');
  const [departureType, setDepartureType] = useState<'now' | 'scheduled'>('now');

  const fuelPrice = useMemo(
    () => aggregateGasPrices(state.gasPrices, 'unleaded').medianPrice,
    [state.gasPrices],
  );

  const vehicle = currentUser.vehicle;
  const fuelEfficiency = vehicle?.fuelEfficiency ?? DEFAULT_FUEL_EFFICIENCY_KM_PER_L;
  const seatCount = Math.max(1, Math.min(6, Number(seats) || 1));

  const estimate = useMemo(() => {
    if (!from.trim() || !to.trim()) return null;
    return estimateDistance(from, to);
  }, [from, to]);

  const breakdown = useMemo(() => {
    if (!estimate) return null;
    return calculateFare({
      distanceKm: estimate.distanceKm,
      fuelPricePerLiter: fuelPrice,
      fuelEfficiency,
      passengerCount: seatCount,
    });
  }, [estimate, fuelPrice, fuelEfficiency, seatCount]);

  const canSubmit = !!vehicle && !!breakdown && !!estimate;

  const onPost = () => {
    if (!vehicle || !breakdown || !estimate) return;
    const now = Date.now();
    const ride: Ride = {
      id: `r_${now}`,
      driverId: currentUser.id,
      driverFirstName: currentUser.firstName,
      driverRating: currentUser.rating,
      driverVerified: currentUser.verified,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        plateNumber: vehicle.plateNumber,
      },
      from: from.trim(),
      to: to.trim(),
      distanceKm: estimate.distanceKm,
      durationMin: estimate.durationMin,
      departureTime: departureType === 'now' ? now + 15 * 60 * 1000 : now + HOUR,
      totalSeats: seatCount,
      pricePerPerson: breakdown.farePerPerson,
      fuelEfficiency,
      terrainMultiplier: 1.0,
      status: 'open',
      passengers: [],
      notes: notes.trim() || undefined,
      createdAt: now,
    };
    dispatch({ type: 'ADD_RIDE', ride });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Create Ride' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextInput
          label="From"
          value={from}
          onChangeText={setFrom}
          mode="outlined"
          placeholder="e.g. La Trinidad"
        />
        <TextInput
          label="To"
          value={to}
          onChangeText={setTo}
          mode="outlined"
          placeholder="e.g. UP Baguio"
        />

        <View style={styles.group}>
          <Text variant="labelLarge" style={styles.label}>
            Departure
          </Text>
          <SegmentedButtons
            value={departureType}
            onValueChange={(v) => setDepartureType(v as 'now' | 'scheduled')}
            buttons={[
              { value: 'now', label: 'Leaving now' },
              { value: 'scheduled', label: 'Scheduled' },
            ]}
          />
        </View>

        <TextInput
          label="Available seats"
          value={seats}
          onChangeText={setSeats}
          mode="outlined"
          keyboardType="number-pad"
        />
        <TextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          placeholder="Pag-uwi na, may space pa."
        />

        {!vehicle ? (
          <Text style={styles.warning}>
            Your profile has no vehicle on file. This demo user should be a driver — check mock data.
          </Text>
        ) : null}

        {estimate ? (
          <Text variant="bodySmall" style={styles.muted}>
            {estimate.source === 'cached' ? 'Cached route' : 'Estimated route'} ·{' '}
            {estimate.distanceKm} km · {estimate.durationMin} min
          </Text>
        ) : (
          <Text variant="bodySmall" style={styles.muted}>
            Enter origin and destination to see the fare.
          </Text>
        )}

        {breakdown ? <PriceBreakdown breakdown={breakdown} /> : null}

        <Button mode="contained" disabled={!canSubmit} onPress={onPost} style={styles.submit}>
          Post Ride
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  group: {
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
  },
  muted: {
    color: colors.muted,
  },
  warning: {
    color: colors.danger,
  },
  submit: {
    marginTop: spacing.md,
  },
});
