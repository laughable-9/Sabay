import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../utils/haptics';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { calculateFare, formatPHP } from '../../utils/pricing';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { maskPlate, formatMonthYear } from '../../utils/format';
import { SafetyTips } from '../../components/SafetyTips';
import { ReportDialog } from '../../components/ReportDialog';
import { colors, spacing } from '../../constants/theme';
import type { Passenger } from '../../utils/types';

export default function RideDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
      <View style={styles.empty}>
        <Stack.Screen options={{ title: 'Ride Details' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const seatsLeft = ride.totalSeats - ride.passengers.filter((p) => p.status !== 'dropped_off').length;
  const alreadyJoined = ride.passengers.some((p) => p.userId === currentUser.id);
  const canJoin = seatsLeft > 0 && !alreadyJoined && ride.status === 'open';

  const onJoin = () => {
    hapticSuccess();
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
  const departureLabel = departure.toLocaleString([], {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Ride Details' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* ── Driver card ── */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.driverCard}>
              <Avatar
                uri={ride.driverProfilePicUri}
                firstName={ride.driverFirstName}
                size={56}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.driverNameRow}>
                  <Text variant="titleLarge" style={styles.driverName}>{ride.driverFirstName}</Text>
                  {ride.driverVerified ? <VerifiedBadge compact /> : null}
                </View>
                <View style={styles.chipRow}>
                  <Chip compact icon="shield-check" style={styles.licensedChip} textStyle={styles.licensedChipText}>
                    Licensed Driver
                  </Chip>
                </View>
              </View>
            </View>

            <View style={styles.driverStatsRow}>
              <View style={styles.driverStat}>
                <Text variant="titleMedium" style={styles.statValue}>
                  {ride.driverRating.toFixed(1)} ★
                </Text>
                <Text variant="bodySmall" style={styles.muted}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.driverStat}>
                <Text variant="titleMedium" style={styles.statValue}>
                  {ride.driverCompletedRides ?? 0}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>Rides</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.driverStat}>
                <Text variant="titleMedium" style={styles.statValue}>
                  {ride.driverJoinedAt ? formatMonthYear(ride.driverJoinedAt) : '—'}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>Joined</Text>
              </View>
            </View>

            <View style={styles.vehicleRow}>
              <MaterialCommunityIcons name="car-side" size={16} color={colors.muted} />
              <Text variant="bodySmall" style={styles.muted}>
                {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.color} · {maskPlate(ride.vehicle.plateNumber)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* ── Route card ── */}
        <Card style={styles.card}>
          <Card.Content style={styles.routeCard}>
            <View style={styles.routeDots}>
              <View style={styles.greenDot} />
              <View style={styles.dottedLine} />
              <View style={styles.redDot} />
            </View>
            <View style={styles.routeInfo}>
              <View>
                <Text variant="labelSmall" style={styles.muted}>FROM</Text>
                <Text variant="titleSmall">{ride.from}</Text>
              </View>
              <View>
                <Text variant="labelSmall" style={styles.muted}>TO</Text>
                <Text variant="titleSmall">{ride.to}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* ── Trip info row ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />
            <Text variant="labelMedium" style={styles.infoPillText}>{departureLabel}</Text>
          </View>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.primary} />
            <Text variant="labelMedium" style={styles.infoPillText}>{ride.distanceKm} km · {ride.durationMin} min</Text>
          </View>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons name="seat-passenger" size={14} color={seatsLeft <= 1 ? colors.danger : colors.primary} />
            <Text variant="labelMedium" style={[styles.infoPillText, seatsLeft <= 1 && { color: colors.danger }]}>
              {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left
            </Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {ride.notes ? (
          <Card style={styles.card}>
            <Card.Content style={styles.notesContent}>
              <MaterialCommunityIcons name="format-quote-open" size={16} color={colors.muted} />
              <Text variant="bodyMedium" style={styles.notesText}>
                {ride.notes}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {/* ── Price ── */}
        <Card style={styles.priceCard}>
          <Card.Content>
            <View style={styles.priceHeader}>
              <View>
                <Text variant="labelSmall" style={styles.muted}>YOUR FARE</Text>
                <Text variant="headlineMedium" style={styles.priceValue}>
                  {formatPHP(ride.pricePerPerson)}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.muted}>per person</Text>
            </View>
            {breakdown ? (
              <>
                <Button
                  mode="text"
                  icon={breakdownOpen ? 'chevron-up' : 'chevron-down'}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                  compact
                  style={styles.breakdownToggle}
                  onPress={() => setBreakdownOpen((v) => !v)}
                >
                  {breakdownOpen ? 'Hide breakdown' : 'How is this calculated?'}
                </Button>
                {breakdownOpen ? <PriceBreakdown breakdown={breakdown} /> : null}
              </>
            ) : null}
          </Card.Content>
        </Card>

        {/* ── Safety tips ── */}
        <SafetyTips compact />

        {/* ── Join button ── */}
        <Button
          mode="contained"
          disabled={!canJoin}
          onPress={onJoin}
          style={styles.joinBtn}
          contentStyle={styles.joinBtnContent}
          labelStyle={styles.joinBtnLabel}
        >
          {alreadyJoined
            ? 'Already Joined'
            : seatsLeft === 0
              ? 'Ride Full'
              : `Join Ride · ${formatPHP(ride.pricePerPerson)}`}
        </Button>

        <Button
          mode="text"
          icon="flag-outline"
          textColor={colors.muted}
          compact
          onPress={() => setReportOpen(true)}
          style={styles.reportBtn}
        >
          Report this ride
        </Button>
      </ScrollView>

      <ReportDialog
        visible={reportOpen}
        targetType="ride"
        targetId={ride.id}
        reporterId={currentUser.id}
        onDismiss={() => setReportOpen(false)}
        onSubmit={(report) => {
          dispatch({ type: 'SUBMIT_REPORT', report });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  priceCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  // Driver section
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  driverName: {
    fontWeight: '700',
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
    fontSize: 11,
  },
  driverStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface,
  },
  driverStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
    color: colors.text,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.surface,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface,
  },

  // Route section
  routeCard: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  routeDots: {
    alignItems: 'center',
    paddingTop: 4,
    gap: 2,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dottedLine: {
    width: 2,
    height: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.muted,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  routeInfo: {
    flex: 1,
    gap: spacing.md,
  },

  // Info pills
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  infoPillText: {
    color: colors.text,
  },

  // Notes
  notesContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  notesText: {
    flex: 1,
    fontStyle: 'italic',
    color: colors.muted,
  },

  // Price
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceValue: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  breakdownToggle: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },

  // Actions
  joinBtn: {
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  joinBtnContent: {
    paddingVertical: 4,
  },
  joinBtnLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  reportBtn: {
    alignSelf: 'center',
  },

  muted: {
    color: colors.muted,
  },
});
