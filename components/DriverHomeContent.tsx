import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
import { formatPHP } from '../utils/pricing';
import { formatDepartureTime } from '../utils/format';
import { colors, spacing } from '../constants/theme';
import type { Ride, RideRequest } from '../utils/types';

export function DriverHomeContent() {
  const { state, currentUser } = useApp();
  const insets = useSafeAreaInsets();

  const myRides = useMemo(
    () =>
      state.rides
        .filter((r) => r.driverId === currentUser.id && r.status !== 'completed')
        .sort((a, b) => a.departureTime - b.departureTime),
    [state.rides, currentUser.id],
  );

  const openRequests = useMemo(
    () =>
      state.rideRequests
        .filter((r) => r.status === 'open')
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3),
    [state.rideRequests],
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
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
        <View style={styles.list}>
          {myRides.map((ride) => (
            <MyRideCard key={ride.id} ride={ride} />
          ))}
        </View>
      )}

      {openRequests.length > 0 ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Open requests near you
          </Text>
          <View style={styles.list}>
            {openRequests.map((req) => (
              <RequestPrompt key={req.id} request={req} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function MyRideCard({ ride }: { ride: Ride }) {
  const seatsTaken = ride.passengers.filter((p) => p.status !== 'dropped_off').length;
  const timeLabel = formatDepartureTime(ride.departureTime);

  const onPress = () => {
    router.push({ pathname: '/chat', params: { id: ride.id } });
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

function RequestPrompt({ request }: { request: RideRequest }) {
  const timeLabel = formatDepartureTime(request.desiredDepartureTime);

  const onMatch = () => {
    router.push({
      pathname: '/(driver)/create-ride',
      params: {
        requestId: request.id,
        from: request.from,
        to: request.to,
      },
    });
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.requestHeader}>
          <Avatar uri={request.riderProfilePicUri} firstName={request.riderFirstName} size={36} />
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall">
              {request.riderFirstName} needs a ride
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {request.from} → {request.to} · {timeLabel}
            </Text>
          </View>
        </View>
        {request.notes ? (
          <Text variant="bodySmall" style={styles.muted} numberOfLines={2}>
            “{request.notes}”
          </Text>
        ) : null}
        <Button mode="contained-tonal" compact onPress={onMatch} style={styles.matchBtn}>
          Post matching ride
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
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
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionLabel: {
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
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
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  muted: {
    color: colors.muted,
    marginTop: 2,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
  matchBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
});
