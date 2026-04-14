import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { calculateFare, formatPHP } from '../../utils/pricing';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { maskPlate } from '../../utils/format';
import { colors, spacing } from '../../constants/theme';
import type { Passenger } from '../../utils/types';

export default function RideDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();

  const ride = state.rides.find((r) => r.id === id);

  const fuelPrice = useMemo(
    () => aggregateGasPrices(state.gasPrices, 'unleaded').medianPrice,
    [state.gasPrices],
  );

  const breakdown = useMemo(() => {
    if (!ride) return null;
    return calculateFare({
      distanceKm: ride.distanceKm,
      fuelPricePerLiter: fuelPrice,
      fuelEfficiency: ride.fuelEfficiency,
      passengerCount: ride.totalSeats,
      terrainMultiplier: ride.terrainMultiplier,
    });
  }, [ride, fuelPrice]);

  if (!ride) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Ride Details' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const seatsLeft = ride.totalSeats - ride.passengers.filter((p) => p.status !== 'dropped_off').length;
  const alreadyJoined = ride.passengers.some((p) => p.userId === currentUser.id);
  const canJoin = seatsLeft > 0 && !alreadyJoined && ride.status === 'open';

  const onJoin = () => {
    const passenger: Passenger = {
      id: `p_${Date.now()}`,
      userId: currentUser.id,
      firstName: currentUser.firstName,
      verified: currentUser.verified,
      status: 'waiting',
      joinedAt: Date.now(),
    };
    dispatch({ type: 'JOIN_RIDE', rideId: ride.id, passenger });
    router.replace('/(rider)/active-ride');
  };

  const departure = new Date(ride.departureTime);

  return (
    <>
      <Stack.Screen options={{ title: 'Ride Details' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.driverRow}>
              <Text variant="titleLarge">{ride.driverFirstName}</Text>
              {ride.driverVerified ? <VerifiedBadge /> : null}
            </View>
            <Text variant="bodyMedium" style={styles.muted}>
              {ride.driverRating.toFixed(1)} ★ · {ride.vehicle.make} {ride.vehicle.model} ·{' '}
              {ride.vehicle.color} · plate {maskPlate(ride.vehicle.plateNumber)}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Route
          </Text>
          <Text variant="titleMedium">
            {ride.from} → {ride.to}
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {departure.toLocaleString([], {
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            · {ride.distanceKm} km · {ride.durationMin} min · {seatsLeft} seat
            {seatsLeft === 1 ? '' : 's'} left
          </Text>
          {ride.notes ? (
            <Text variant="bodyMedium" style={styles.notes}>
              “{ride.notes}”
            </Text>
          ) : null}
        </View>

        {breakdown ? (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>
              Fare breakdown
            </Text>
            <PriceBreakdown breakdown={breakdown} />
          </View>
        ) : null}

        <Button
          mode="contained"
          disabled={!canJoin}
          onPress={onJoin}
          style={styles.submit}
        >
          {alreadyJoined
            ? 'Already Joined'
            : seatsLeft === 0
              ? 'Ride Full'
              : `Join Ride · ${formatPHP(ride.pricePerPerson)}`}
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.xs,
  },
  label: {
    color: colors.muted,
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  notes: {
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  submit: {
    marginTop: spacing.md,
  },
});
