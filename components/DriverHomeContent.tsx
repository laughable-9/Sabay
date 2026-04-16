import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
import { formatPHP } from '../utils/pricing';
import { formatDepartureTime } from '../utils/format';
import { colors, spacing } from '../constants/theme';
import type { Ride, RideRequest } from '../utils/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DriverHomeContent() {
  const { state, currentUser } = useApp();
  const insets = useSafeAreaInsets();

  const myRides = useMemo(
    () =>
      state.rides
        .filter(
          (r) =>
            r.driverId === currentUser.id &&
            r.status !== 'completed' &&
            r.status !== 'cancelled',
        )
        .sort((a, b) => a.departureTime - b.departureTime),
    [state.rides, currentUser.id],
  );

  const completedRides = useMemo(
    () =>
      state.rides
        .filter((r) => r.driverId === currentUser.id && r.status === 'completed')
        .sort((a, b) => b.departureTime - a.departureTime),
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

  // Dashboard stats
  const totalFuelCovered = useMemo(
    () =>
      completedRides.reduce(
        (sum, r) => sum + r.pricePerPerson * r.passengers.length,
        0,
      ),
    [completedRides],
  );

  const recentCompleted = completedRides.slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      {/* Greeting */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {getGreeting()}, {currentUser.firstName}
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {myRides.length === 0
            ? 'Post a ride to start carpooling.'
            : `${myRides.length} upcoming ride${myRides.length === 1 ? '' : 's'}.`}
        </Text>
      </View>

      {/* Dashboard stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="gas-station" size={20} color={colors.primary} />
          <Text variant="titleMedium" style={styles.statValue}>
            {formatPHP(totalFuelCovered)}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Fuel covered
          </Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="check-decagram" size={20} color={colors.primary} />
          <Text variant="titleMedium" style={styles.statValue}>
            {completedRides.length}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Rides
          </Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="star" size={20} color={colors.warning} />
          <Text variant="titleMedium" style={styles.statValue}>
            {currentUser.rating.toFixed(1)}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            Rating
          </Text>
        </View>
      </View>

      {/* Create ride CTA */}
      <Link href="/(driver)/create-ride" asChild>
        <Button mode="contained" icon="plus">
          Create Ride
        </Button>
      </Link>

      {/* My active rides */}
      {myRides.length > 0 && (
        <View style={styles.list}>
          {myRides.map((ride) => (
            <MyRideCard key={ride.id} ride={ride} />
          ))}
        </View>
      )}

      {/* Quick re-post */}
      {recentCompleted.length > 0 && (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Repeat a ride
          </Text>
          <View style={styles.list}>
            {recentCompleted.map((ride) => (
              <RepeatRideCard key={ride.id} ride={ride} />
            ))}
          </View>
        </View>
      )}

      {/* Open requests */}
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

/* ─── Sub-components ─── */

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
        <Pressable
          style={styles.returnBtn}
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: '/(driver)/create-ride',
              params: { from: ride.to, to: ride.from },
            });
          }}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
          <Text variant="labelMedium" style={styles.returnBtnText}>
            Post return trip
          </Text>
        </Pressable>
      </Card.Content>
    </Card>
  );
}

function RepeatRideCard({ ride }: { ride: Ride }) {
  const dateLabel = new Date(ride.departureTime).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const onRepost = () => {
    router.push({
      pathname: '/(driver)/create-ride',
      params: { from: ride.from, to: ride.to },
    });
  };

  return (
    <Card style={styles.card} onPress={onRepost}>
      <Card.Content style={styles.repeatContent}>
        <View style={styles.repeatIcon}>
          <MaterialCommunityIcons name="repeat" size={18} color={colors.primary} />
        </View>
        <View style={styles.repeatText}>
          <Text variant="titleSmall">
            {ride.from} → {ride.to}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {dateLabel} · {ride.passengers.length} rider{ride.passengers.length === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={styles.repeatActions}>
          <Pressable
            style={styles.swapBtn}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: '/(driver)/create-ride',
                params: { from: ride.to, to: ride.from },
              });
            }}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
          </Pressable>
          <Chip compact mode="outlined" textStyle={styles.repostChipText}>
            Re-post
          </Chip>
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
    <Card style={styles.card} onPress={onMatch}>
      <Card.Content style={styles.requestCardContent}>
        <Avatar uri={request.riderProfilePicUri} firstName={request.riderFirstName} size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">
            {request.from} → {request.to}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {request.riderFirstName} · {timeLabel}
            {request.notes ? ` · "${request.notes}"` : ''}
          </Text>
        </View>
        <View style={styles.requestCta}>
          <Text variant="labelMedium" style={styles.offerText}>
            Offer ride
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.primary}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

/* ─── Styles ─── */

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

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 14,
  },
  statLabel: {
    color: colors.muted,
    textAlign: 'center',
  },

  // Lists
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

  // Ride cards
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

  // Repeat ride
  repeatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  repeatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatText: {
    flex: 1,
  },
  repeatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repostChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  returnBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Request prompt
  requestCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  offerText: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Shared
  muted: {
    color: colors.muted,
    marginTop: 2,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
});
