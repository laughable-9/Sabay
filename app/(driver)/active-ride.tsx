import { FlatList, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { PassengerBadge } from '../../components/PassengerBadge';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { formatPHP } from '../../utils/pricing';
import { formatDepartureTime } from '../../utils/format';
import { colors, spacing } from '../../constants/theme';
import type { Passenger, PassengerStatus } from '../../utils/types';

export default function DriverActiveRide() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useApp();

  const ride = state.rides.find((r) => r.id === id);

  if (!ride) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Active Ride' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const pickedUp = ride.passengers.filter((p) => p.status === 'picked_up').length;

  const onConfirmPickup = (passengerId: string) => {
    dispatch({ type: 'PICKUP_PASSENGER', rideId: ride.id, passengerId });
  };

  const onEndRide = () => {
    const rideId = ride.id;
    dispatch({ type: 'END_RIDE', rideId });
    router.replace({ pathname: '/(driver)/ride-complete', params: { id: rideId } });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Driving' }} />
      <View style={styles.container}>
        <Card style={styles.summary}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <View>
                <Text variant="titleMedium">
                  {ride.from} → {ride.to}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>
                  {formatDepartureTime(ride.departureTime)} · {ride.distanceKm} km ·{' '}
                  {ride.durationMin} min
                </Text>
              </View>
              <PassengerBadge pickedUp={pickedUp} total={ride.totalSeats} />
            </View>
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Passengers
        </Text>

        {ride.passengers.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="bodyMedium" style={styles.muted}>
              No one has joined yet. Riders who join will show up here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={ride.passengers}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <PassengerRow
                passenger={item}
                fare={ride.pricePerPerson}
                onConfirm={() => onConfirmPickup(item.id)}
              />
            )}
          />
        )}

        <View style={styles.footer}>
          <Button mode="contained" onPress={onEndRide}>
            End Ride
          </Button>
        </View>
      </View>
    </>
  );
}

function PassengerRow({
  passenger,
  fare,
  onConfirm,
}: {
  passenger: Passenger;
  fare: number;
  onConfirm: () => void;
}) {
  const statusLabel: Record<PassengerStatus, string> = {
    waiting: 'Waiting for pickup',
    picked_up: 'Picked up',
    dropped_off: 'Dropped off',
  };

  return (
    <Card style={styles.row}>
      <Card.Content>
        <View style={styles.rowHeader}>
          <View style={styles.rowName}>
            <Avatar uri={passenger.profilePicUri} firstName={passenger.firstName} size={32} />
            <Text variant="titleSmall">{passenger.firstName}</Text>
            {passenger.verified ? <VerifiedBadge compact /> : null}
          </View>
          <Chip compact>{statusLabel[passenger.status]}</Chip>
        </View>
        <View style={styles.rowFooter}>
          <Text variant="bodySmall" style={styles.muted}>
            Paying {formatPHP(fare)}
          </Text>
          {passenger.status === 'waiting' ? (
            <Button mode="contained-tonal" compact onPress={onConfirm}>
              Confirm Pickup
            </Button>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summary: {
    backgroundColor: colors.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: colors.muted,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  list: {
    paddingBottom: spacing.md,
  },
  row: {
    backgroundColor: colors.card,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footer: {
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
