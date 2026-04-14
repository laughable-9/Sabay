import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { Button, Card, Chip, SegmentedButtons, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { formatPHP } from '../../utils/pricing';
import { formatDepartureTime } from '../../utils/format';
import { colors, spacing } from '../../constants/theme';
import type { Role } from '../../utils/types';

export default function Profile() {
  const { state, dispatch, currentUser, resetDemo } = useApp();
  const insets = useSafeAreaInsets();

  const history = useMemo(
    () =>
      state.rides
        .filter(
          (r) =>
            r.status === 'completed' &&
            (r.driverId === currentUser.id ||
              r.passengers.some((p) => p.userId === currentUser.id)),
        )
        .sort((a, b) => b.departureTime - a.departureTime),
    [state.rides, currentUser.id],
  );

  const contributions = useMemo(
    () => state.gasPrices.filter((g) => g.submittedByUserId === currentUser.id).length,
    [state.gasPrices, currentUser.id],
  );

  const driverStats = useMemo(() => {
    let offset = 0;
    let ridersServed = 0;
    let tripsDriven = 0;
    for (const ride of state.rides) {
      if (ride.driverId !== currentUser.id) continue;
      if (ride.status !== 'completed') continue;
      tripsDriven += 1;
      for (const p of ride.passengers) {
        if (p.paymentReceived) {
          offset += ride.pricePerPerson;
          ridersServed += 1;
        }
      }
    }
    return { offset, ridersServed, tripsDriven };
  }, [state.rides, currentUser.id]);

  const riderStats = useMemo(() => {
    let timesRidden = 0;
    let kmSaved = 0;
    for (const ride of state.rides) {
      if (ride.status !== 'completed') continue;
      if (ride.passengers.some((p) => p.userId === currentUser.id)) {
        timesRidden += 1;
        kmSaved += ride.distanceKm;
      }
    }
    return { timesRidden, kmSaved };
  }, [state.rides, currentUser.id]);

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar
                uri={currentUser.profilePicUri}
                firstName={currentUser.firstName}
                size={64}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Text variant="titleLarge">{currentUser.firstName}</Text>
                  {currentUser.verified ? <VerifiedBadge /> : null}
                </View>
                <Text variant="bodyMedium" style={styles.muted}>
                  {currentUser.rating.toFixed(1)} ★ · {currentUser.completedRides + history.length} rides
                </Text>
              </View>
            </View>
            {contributions > 0 ? (
              <View style={styles.badgeRow}>
                <MaterialCommunityIcons name="gas-station" size={14} color={colors.warning} />
                <Text variant="labelMedium" style={styles.contributor}>
                  Community Contributor · {contributions} price{contributions === 1 ? '' : 's'} submitted
                </Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>

        {driverStats.tripsDriven > 0 ? (
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="labelLarge" style={styles.muted}>
                Fuel cost offset (as driver)
              </Text>
              <Text variant="displaySmall" style={styles.statValue}>
                {formatPHP(driverStats.offset)}
              </Text>
              <Text variant="bodySmall" style={styles.hint}>
                From {driverStats.ridersServed} rider
                {driverStats.ridersServed === 1 ? '' : 's'} across {driverStats.tripsDriven} completed
                {driverStats.tripsDriven === 1 ? ' trip' : ' trips'}.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {riderStats.timesRidden > 0 ? (
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="labelLarge" style={styles.muted}>
                Rides shared (as rider)
              </Text>
              <Text variant="displaySmall" style={styles.statValue}>
                {riderStats.timesRidden}
              </Text>
              <Text variant="bodySmall" style={styles.hint}>
                {riderStats.kmSaved.toFixed(0)} km carpooled instead of solo.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Active role
          </Text>
          <SegmentedButtons
            value={state.role}
            onValueChange={(v) => dispatch({ type: 'SET_ROLE', role: v as Role })}
            buttons={[
              { value: 'rider', label: 'Rider' },
              { value: 'driver', label: 'Driver' },
            ]}
          />
          <Text variant="bodySmall" style={styles.hint}>
            Switch roles to demo the other side of the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Ride history
          </Text>
          {history.length === 0 ? (
            <Text variant="bodyMedium" style={styles.muted}>
              No completed rides yet. Finish one from the Home tab.
            </Text>
          ) : (
            history.map((ride) => {
              const isDriver = ride.driverId === currentUser.id;
              return (
                <Card key={ride.id} style={styles.historyCard}>
                  <Card.Content>
                    <View style={styles.historyHeader}>
                      <Text variant="titleSmall">
                        {ride.from} → {ride.to}
                      </Text>
                      <Chip compact>{isDriver ? 'Drove' : 'Rode'}</Chip>
                    </View>
                    <Text variant="bodySmall" style={styles.muted}>
                      {formatDepartureTime(ride.departureTime)} · {ride.distanceKm} km ·{' '}
                      {formatPHP(ride.pricePerPerson)}
                    </Text>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Demo controls
          </Text>
          <Button mode="outlined" icon="restart" onPress={resetDemo}>
            Reset demo data
          </Button>
          <Text variant="bodySmall" style={styles.hint}>
            Clears saved state and re-seeds fresh rides, gas prices, and requests.
          </Text>
        </View>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  contributor: {
    color: colors.warning,
    fontWeight: '600',
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.muted,
  },
  historyCard: {
    backgroundColor: colors.card,
  },
  statsCard: {
    backgroundColor: colors.card,
  },
  statValue: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.muted,
  },
});
