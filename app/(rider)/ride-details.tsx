import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { calculateFare, formatPHP } from '../../utils/pricing';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { maskPlate, formatMonthYear } from '../../utils/format';
import { colors, spacing } from '../../constants/theme';
import type { Passenger } from '../../utils/types';

export default function RideDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();
  const [breakdownOpen, setBreakdownOpen] = useState(false);

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
      profilePicUri: currentUser.profilePicUri,
    };
    dispatch({ type: 'JOIN_RIDE', rideId: ride.id, passenger });
    router.replace({ pathname: '/chat', params: { id: ride.id } });
  };

  const departure = new Date(ride.departureTime);

  return (
    <>
      <Stack.Screen options={{ title: 'Ride Details' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.driverCard}>
              <Avatar
                uri={ride.driverProfilePicUri}
                firstName={ride.driverFirstName}
                size={56}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.driverRow}>
                  <Text variant="titleLarge">{ride.driverFirstName}</Text>
                  {ride.driverVerified ? <VerifiedBadge compact /> : null}
                </View>
                <View style={styles.chipRow}>
                  <Chip compact style={styles.licensedChip} textStyle={styles.licensedChipText}>
                    Licensed Driver
                  </Chip>
                </View>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.statsLine}>
              {ride.driverRating.toFixed(1)} ★ ·{' '}
              {(ride.driverCompletedRides ?? 0)} rides
              {ride.driverJoinedAt ? ` · Since ${formatMonthYear(ride.driverJoinedAt)}` : ''}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.color} · plate{' '}
              {maskPlate(ride.vehicle.plateNumber)}
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
            <Button
              mode="text"
              icon={breakdownOpen ? 'chevron-up' : 'chevron-down'}
              contentStyle={{ flexDirection: 'row-reverse' }}
              style={styles.breakdownToggle}
              onPress={() => setBreakdownOpen((v) => !v)}
            >
              {breakdownOpen ? 'Hide fare breakdown' : 'Show fare breakdown'}
            </Button>
            {breakdownOpen ? <PriceBreakdown breakdown={breakdown} /> : null}
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
    backgroundColor: colors.card,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  licensedChip: {
    backgroundColor: '#E6F3E8',
    alignSelf: 'flex-start',
  },
  licensedChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  statsLine: {
    color: colors.text,
    marginTop: spacing.sm,
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
  breakdownToggle: {
    alignSelf: 'flex-start',
  },
});
