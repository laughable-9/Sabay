import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Dialog, Portal, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hapticSuccess } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { ReportDialog } from '../../components/ReportDialog';
import { SabayMap } from '../../components/SabayMap';
import { PassengerBadge } from '../../components/PassengerBadge';
import { Avatar } from '../../components/Avatar';
import { useRideSimulation } from '../../hooks/useRideSimulation';
import { shortToken } from '../../utils/rideSimulation';
import { formatPHP } from '../../utils/pricing';
import { colors, spacing } from '../../constants/theme';

export default function DriverActiveRide() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const insets = useSafeAreaInsets();
  const ride = state.rides.find((r) => r.id === id);
  const { polyline, position, etaLabel, region, phaseLabel } = useRideSimulation(ride ?? null);
  const [dropoffOpen, setDropoffOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (ride?.driverStatus === 'arrived') {
      const rideId = ride.id;
      dispatch({ type: 'END_RIDE', rideId });
      router.replace({ pathname: '/(driver)/ride-complete', params: { id: rideId } });
    }
  }, [ride?.driverStatus, ride?.id, dispatch]);

  // If every picked-up rider has been dropped off early, there's no one
  // left in the car and the trip is effectively over — auto-arrive.
  useEffect(() => {
    if (!ride) return;
    if (ride.driverStatus !== 'to_destination') return;
    const stillInCar = ride.passengers.filter((p) => p.status === 'picked_up').length;
    const droppedOff = ride.passengers.filter((p) => p.status === 'dropped_off').length;
    if (stillInCar === 0 && droppedOff > 0) {
      dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'arrived' });
    }
  }, [ride, dispatch]);

  useEffect(() => {
    if (ride && ride.driverStatus === 'preparing') {
      router.replace({ pathname: '/chat', params: { id: ride.id } });
    }
  }, [ride?.driverStatus, ride?.id]);

  if (!ride) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + spacing.xl }]}>
        <Stack.Screen options={{ title: 'Driving', headerBackVisible: false }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const joined = ride.passengers.length;
  const waitingCount = ride.passengers.filter((p) => p.status === 'waiting').length;
  const atPickup = ride.driverStatus === 'at_pickup';
  const inTrip = ride.driverStatus === 'to_destination';
  const pickedUpPassengers = ride.passengers.filter((p) => p.status === 'picked_up');

  const onShare = async () => {
    const token = shortToken(ride.id);
    await Share.share({
      message: `I'm driving a Sabay ride from ${ride.from} to ${ride.to}. Track at sabay://track/${token}.`,
    });
  };

  const onConfirmPickup = () => {
    ride.passengers
      .filter((p) => p.status === 'waiting')
      .forEach((p) => {
        hapticSuccess();
        dispatch({ type: 'PICKUP_PASSENGER', rideId: ride.id, passengerId: p.id });
      });
    dispatch({ type: 'SET_DRIVER_STATUS', rideId: ride.id, status: 'to_destination' });
  };

  const onEarlyDropoff = (passengerId: string, firstName: string) => {
    dispatch({ type: 'DROP_OFF_PASSENGER', rideId: ride.id, passengerId });
    dispatch({
      type: 'SEND_MESSAGE',
      rideId: ride.id,
      message: {
        id: `m_sys_dropoff_${Date.now()}`,
        senderId: 'system',
        senderFirstName: 'System',
        text: `${firstName} dropped off early`,
        sentAt: Date.now(),
        isSystem: true,
      },
    });
    setDropoffOpen(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Driving',
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
            <PassengerBadge joined={joined} total={ride.totalSeats} />
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.phaseRow}>
            <MaterialCommunityIcons
              name={
                ride.driverStatus === 'to_destination'
                  ? 'car'
                  : ride.driverStatus === 'at_pickup'
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
              <Text variant="labelLarge" style={styles.muted}>
                Riders on this trip
              </Text>
              {ride.passengers.length === 0 ? (
                <Text variant="bodyMedium" style={styles.muted}>
                  No one has joined yet.
                </Text>
              ) : (
                <View style={styles.passengerRow}>
                  {ride.passengers.map((p) => (
                    <View key={p.id} style={styles.passengerChip}>
                      <Avatar uri={p.profilePicUri} firstName={p.firstName} size={28} />
                      <Text variant="bodyMedium">{p.firstName}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.etaRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
                <Text variant="bodyMedium" style={styles.muted}>
                  ETA {etaLabel} · {formatPHP(ride.pricePerPerson)} / rider
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
            {atPickup ? (
              <Button
                mode="contained"
                icon="account-check"
                onPress={onConfirmPickup}
                disabled={waitingCount === 0}
              >
                Picked up rider{waitingCount === 1 ? '' : 's'}
              </Button>
            ) : inTrip ? (
              <Button
                mode="contained"
                icon="map-marker-minus"
                onPress={() => setDropoffOpen(true)}
                disabled={pickedUpPassengers.length === 0}
              >
                Early dropoff
              </Button>
            ) : null}
            <Button mode="outlined" icon="share-variant" onPress={onShare}>
              Share my ride
            </Button>
            <Button mode="text" icon="flag-outline" textColor={colors.muted} compact onPress={() => setReportOpen(true)}>
              Report an issue
            </Button>
          </View>
        </View>
      </View>

      <Portal>
        <Dialog visible={dropoffOpen} onDismiss={() => setDropoffOpen(false)}>
          <Dialog.Title>Early dropoff</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.muted}>
              Pick the rider getting off here.
            </Text>
            <View style={styles.dropoffList}>
              {pickedUpPassengers.length === 0 ? (
                <Text variant="bodySmall" style={styles.muted}>
                  No riders in the car right now.
                </Text>
              ) : (
                pickedUpPassengers.map((p) => (
                  <Button
                    key={p.id}
                    mode="contained-tonal"
                    icon="account-arrow-right"
                    onPress={() => onEarlyDropoff(p.id, p.firstName)}
                    style={styles.dropoffItem}
                    contentStyle={{ justifyContent: 'flex-start' }}
                  >
                    {p.firstName}
                  </Button>
                ))
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDropoffOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <ReportDialog
          visible={reportOpen}
          targetType="ride"
          targetId={ride.id}
          reporterId={currentUser.id}
          onDismiss={() => setReportOpen(false)}
          onSubmit={(report) => {
            dispatch({ type: 'SUBMIT_REPORT', report });
            setReportOpen(false);
          }}
        />
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
  passengerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  passengerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  actions: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  dropoffList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dropoffItem: {
    alignSelf: 'stretch',
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
