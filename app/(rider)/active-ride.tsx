import { Share, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  if (activeRide.driverStatus !== 'enroute') {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Active Ride' }} />
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
                  {activeRide.vehicle.make} {activeRide.vehicle.model}
                </Text>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.routeLine}>
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
          <Button
            mode="outlined"
            icon="chat"
            onPress={() =>
              router.push({ pathname: '/chat', params: { id: activeRide.id } })
            }
            style={styles.action}
          >
            Chat
          </Button>
          <Button mode="contained" icon="share-variant" onPress={onShare} style={styles.action}>
            Share
          </Button>
          <Button mode="text" onPress={onCancel} style={styles.action}>
            Cancel
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
  routeLine: {
    marginTop: spacing.xs,
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
