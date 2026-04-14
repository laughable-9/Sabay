import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { formatPHP } from '../utils/pricing';
import { formatDepartureTime } from '../utils/format';
import { colors, spacing } from '../constants/theme';
import type { Ride } from '../utils/types';

export function DriverHomeContent() {
  const { state, currentUser } = useApp();

  const myRides = useMemo(
    () =>
      state.rides
        .filter((r) => r.driverId === currentUser.id && r.status !== 'completed')
        .sort((a, b) => a.departureTime - b.departureTime),
    [state.rides, currentUser.id],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Hi {currentUser.firstName}
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {myRides.length === 0
            ? 'Post a ride to start carpooling.'
            : `${myRides.length} upcoming ride${myRides.length === 1 ? '' : 's'}.`}
        </Text>
      </View>

      <Link href="/(driver)/create-ride" asChild>
        <Button mode="contained" icon="plus">
          Create Ride
        </Button>
      </Link>

      {myRides.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.muted}>
            No active rides yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={myRides}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MyRideCard ride={item} />}
        />
      )}
    </View>
  );
}

function MyRideCard({ ride }: { ride: Ride }) {
  const seatsTaken = ride.passengers.filter((p) => p.status !== 'dropped_off').length;
  const timeLabel = formatDepartureTime(ride.departureTime);

  const onPress = () => {
    router.push({ pathname: '/(driver)/active-ride', params: { id: ride.id } });
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">
            {ride.from} → {ride.to}
          </Text>
          <Chip compact>{ride.status}</Chip>
        </View>
        <Text variant="bodyMedium" style={styles.muted}>
          {timeLabel} · {ride.distanceKm} km · {ride.durationMin} min
        </Text>
        <View style={styles.cardFooter}>
          <Text variant="bodyMedium">
            {seatsTaken}/{ride.totalSeats} seats filled
          </Text>
          <Text variant="titleMedium" style={styles.price}>
            {formatPHP(ride.pricePerPerson)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
});
