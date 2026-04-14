import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, Card, Dialog, Portal, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { SabayMap } from '../../components/SabayMap';
import { PassengerBadge } from '../../components/PassengerBadge';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { useRideSimulation } from '../../hooks/useRideSimulation';
import { shortToken } from '../../utils/rideSimulation';
import { formatPHP } from '../../utils/pricing';
import { colors, spacing } from '../../constants/theme';

export default function RiderActiveRide() {
  const { activeRide, dispatch, currentUser } = useApp();
  const { polyline, position, etaLabel, region, phaseLabel } = useRideSimulation(activeRide);
  const insets = useSafeAreaInsets();
  const [pickupDismissed, setPickupDismissed] = useState(false);

  // When the ride wraps, route to ride-complete.
  useEffect(() => {
    if (activeRide?.driverStatus === 'arrived') {
      const id = activeRide.id;
      dispatch({ type: 'END_RIDE', rideId: id });
      router.replace({ pathname: '/(rider)/ride-complete', params: { id } });
    }
  }, [activeRide?.driverStatus, activeRide?.id, dispatch]);

  if (!activeRide) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + spacing.xl }]}>
        <Stack.Screen options={{ title: 'Active Ride', headerBackVisible: false }} />
        <Text variant="titleMedium">No active ride</Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Join a ride from the Home tab to see live tracking.
        </Text>
      </View>
    );
  }

  if (activeRide.driverStatus === 'preparing') {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + spacing.xl }]}>
        <Stack.Screen options={{ title: 'Active Ride', headerBackVisible: false }} />
        <MaterialCommunityIcons name="clock-outline" size={48} color={colors.muted} />
        <Text variant="titleMedium">Trip hasn't started yet</Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Live tracking opens once the driver is on the way.
        </Text>
        <Button
          mode="contained"
          icon="chat"
          onPress={() => router.replace({ pathname: '/chat', params: { id: activeRide.id } })}
          style={{ marginTop: spacing.md }}
        >
          Back to chat
        </Button>
      </View>
    );
  }

  const joined = activeRide.passengers.length;
  const showPickupPrompt =
    activeRide.driverStatus === 'at_pickup' && !pickupDismissed;

  const onShare = async () => {
    const token = shortToken(activeRide.id);
    await Share.share({
      message: `Track my Sabay ride: sabay://track/${token}\nFrom ${activeRide.from} to ${activeRide.to}, arriving in ${etaLabel}.`,
    });
  };

  const onConfirmPickup = () => {
    const self = activeRide.passengers.find((p) => p.userId === currentUser.id);
    if (self) {
      dispatch({ type: 'PICKUP_PASSENGER', rideId: activeRide.id, passengerId: self.id });
    }
    dispatch({ type: 'SET_DRIVER_STATUS', rideId: activeRide.id, status: 'to_destination' });
  };

  const onDismissPrompt = () => setPickupDismissed(true);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Active Ride',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.mapWrap}>
          <SabayMap
            driverPosition={position ?? undefined}
            polyline={polyline}
            region={region}
          />
          <View style={styles.badgeOverlay}>
            <PassengerBadge joined={joined} total={activeRide.totalSeats} />
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.phaseRow}>
            <MaterialCommunityIcons
              name={
                activeRide.driverStatus === 'to_destination'
                  ? 'car'
                  : activeRide.driverStatus === 'at_pickup'
                    ? 'map-marker-radius'
                    : 'map-marker-path'
              }
              size={16}
              color={colors.primary}
            />
            <Text variant="labelLarge" style={styles.phaseText}>
              {phaseLabel || 'Tracking your ride'}
            </Text>
          </View>

          <Card style={styles.infoCard} mode="contained">
            <Card.Content>
              <View style={styles.driverHeader}>
                <Avatar
                  uri={activeRide.driverProfilePicUri}
                  firstName={activeRide.driverFirstName}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.driverRow}>
                    <Text variant="titleMedium">{activeRide.driverFirstName}</Text>
                    {activeRide.driverVerified ? <VerifiedBadge compact /> : null}
                  </View>
                  <Text variant="bodySmall" style={styles.muted}>
                    {activeRide.driverRating.toFixed(1)} ★
                  </Text>
                </View>
              </View>
              <View style={styles.vehicleRow}>
                <MaterialCommunityIcons name="car-side" size={16} color={colors.muted} />
                <Text variant="bodyMedium">
                  {activeRide.vehicle.color} {activeRide.vehicle.make} {activeRide.vehicle.model}
                </Text>
                <View style={styles.platePill}>
                  <Text variant="labelSmall" style={styles.plateText}>
                    {activeRide.vehicle.plateNumber}
                  </Text>
                </View>
              </View>
              <View style={styles.etaRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
                <Text variant="bodyMedium" style={styles.muted}>
                  ETA {etaLabel} · Fare {formatPHP(activeRide.pricePerPerson)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <View
            style={[
              styles.actions,
              { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.xs) },
            ]}
          >
            <Button mode="contained" icon="share-variant" onPress={onShare}>
              Share my ride
            </Button>
            <Button
              mode="text"
              icon="eye-outline"
              onPress={() => router.push('/tracking')}
            >
              Preview what recipients see
            </Button>
          </View>
        </View>
      </View>

      <Portal>
        <Dialog visible={showPickupPrompt} onDismiss={onDismissPrompt} dismissable={false}>
          <Dialog.Icon icon="map-marker-check" color={colors.primary} />
          <Dialog.Title style={{ textAlign: 'center' }}>
            {activeRide.driverFirstName} is at your pickup
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              Your driver has arrived at {activeRide.from}. Confirm once you're in the car and
              the trip will start.
            </Text>
            {activeRide.driverPhone ? (
              <View style={styles.gcashBox}>
                <Text variant="labelSmall" style={styles.muted}>
                  Send the fare share via GCash
                </Text>
                <Text variant="titleMedium" style={styles.gcashNumber}>
                  {activeRide.driverPhone}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>
                  {formatPHP(activeRide.pricePerPerson)} to {activeRide.driverFirstName}
                </Text>
              </View>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onDismissPrompt}>Not yet</Button>
            <Button mode="contained" icon="car-arrow-left" onPress={onConfirmPickup}>
              I'm in the car
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  sheet: {
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phaseText: {
    color: colors.primary,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: colors.card,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  platePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: 6,
  },
  plateText: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 1,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  muted: {
    color: colors.muted,
  },
  actions: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gcashBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.xs,
  },
  gcashNumber: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
