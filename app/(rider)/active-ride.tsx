import { Share, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { SabayMap } from '../../components/SabayMap';
import { PassengerBadge } from '../../components/PassengerBadge';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { useRideSimulation } from '../../hooks/useRideSimulation';
import { shortToken } from '../../utils/rideSimulation';
import { formatPHP } from '../../utils/pricing';
import { colors, spacing } from '../../constants/theme';

export default function RiderActiveRide() {
  const { activeRide, dispatch } = useApp();
  const { polyline, position, etaLabel } = useRideSimulation(activeRide);

  if (!activeRide) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Active Ride' }} />
        <Text variant="titleMedium">No active ride</Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Join a ride from the Home tab to see live tracking.
        </Text>
      </View>
    );
  }

  const pickedUp = activeRide.passengers.filter((p) => p.status === 'picked_up').length;

  const onShare = async () => {
    const token = shortToken(activeRide.id);
    await Share.share({
      message: `Track my Sabay ride: sabay://track/${token}\nFrom ${activeRide.from} to ${activeRide.to}, arriving in ${etaLabel}.`,
    });
  };

  const onCancel = () => {
    const rideId = activeRide.id;
    dispatch({ type: 'END_RIDE', rideId });
    router.replace({ pathname: '/(rider)/ride-complete', params: { id: rideId } });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Active Ride' }} />
      <View style={styles.container}>
        <View style={styles.mapWrap}>
          <SabayMap driverPosition={position ?? undefined} polyline={polyline} />
          <View style={styles.badgeOverlay}>
            <PassengerBadge pickedUp={pickedUp} total={activeRide.totalSeats} />
          </View>
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.driverRow}>
              <Text variant="titleMedium">{activeRide.driverFirstName}</Text>
              {activeRide.driverVerified ? <VerifiedBadge compact /> : null}
              <Text variant="bodySmall" style={styles.muted}>
                · {activeRide.vehicle.make} {activeRide.vehicle.model}
              </Text>
            </View>
            <Text variant="bodyMedium">
              {activeRide.from} → {activeRide.to}
            </Text>
            <View style={styles.etaRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
              <Text variant="bodyMedium" style={styles.muted}>
                ETA {etaLabel} · Fare {formatPHP(activeRide.pricePerPerson)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button mode="contained" icon="share-variant" onPress={onShare} style={styles.action}>
            Share My Ride
          </Button>
          <Button mode="outlined" onPress={onCancel} style={styles.action}>
            Cancel Ride
          </Button>
        </View>
      </View>
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
  infoCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
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
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  action: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
