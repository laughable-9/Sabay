import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { calculateFare } from '../../utils/pricing';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { estimateDistance } from '../../utils/distance';
import { DEFAULT_FUEL_EFFICIENCY_KM_PER_L } from '../../constants/config';
import { colors, spacing } from '../../constants/theme';
import type { Passenger, Ride } from '../../utils/types';

type AutoRider = {
  userId: string;
  firstName: string;
  verified: boolean;
  profilePicUri?: string;
  joinDelayMs: number;
  messageDelayMs: number;
  message: string;
};

// Populated after a driver posts a ride so a single-device demo has real
// passengers showing up and chatting without a second device.
const DEFAULT_AUTO_RIDERS: AutoRider[] = [
  {
    userId: 'u_bea',
    firstName: 'Bea',
    verified: true,
    profilePicUri:
      'https://ui-avatars.com/api/?name=Bea&background=059669&color=fff&bold=true&size=256',
    joinDelayMs: 2500,
    messageDelayMs: 4000,
    message: 'Nandito po kami sa pickup point kuya 🙏',
  },
  {
    userId: 'u_rico',
    firstName: 'Rico',
    verified: true,
    profilePicUri:
      'https://ui-avatars.com/api/?name=Rico&background=7C3AED&color=fff&bold=true&size=256',
    joinDelayMs: 5000,
    messageDelayMs: 6500,
    message: 'Sabay na po ako sakay 😊',
  },
];

export default function CreateRide() {
  const { state, dispatch, currentUser } = useApp();
  const params = useLocalSearchParams<{ requestId?: string; from?: string; to?: string }>();
  const [from, setFrom] = useState(params.from ?? '');
  const [to, setTo] = useState(params.to ?? '');
  const [seats, setSeats] = useState('3');
  const [notes, setNotes] = useState('');
  const [departureType, setDepartureType] = useState<'now' | 'scheduled'>('now');
  const [scheduledAt, setScheduledAt] = useState<Date>(() => new Date(Date.now() + 60 * 60 * 1000));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const fulfillingRequestId = params.requestId;

  const fuelPrice = useMemo(
    () => aggregateGasPrices(state.gasPrices, 'unleaded').medianPrice,
    [state.gasPrices],
  );

  const vehicle = currentUser.vehicle;
  const fuelEfficiency = vehicle?.fuelEfficiency ?? DEFAULT_FUEL_EFFICIENCY_KM_PER_L;
  const seatCount = Math.max(1, Math.min(6, Number(seats) || 1));

  const estimate = useMemo(() => {
    if (!from.trim() || !to.trim()) return null;
    return estimateDistance(from, to);
  }, [from, to]);

  const breakdown = useMemo(() => {
    if (!estimate) return null;
    return calculateFare({
      distanceKm: estimate.distanceKm,
      fuelPricePerLiter: fuelPrice,
      fuelEfficiency,
      passengerCount: seatCount,
    });
  }, [estimate, fuelPrice, fuelEfficiency, seatCount]);

  const canSubmit = !!vehicle && !!breakdown && !!estimate;

  const onPost = () => {
    if (!vehicle || !breakdown || !estimate) return;
    const now = Date.now();
    const departureTime =
      departureType === 'now' ? now + 15 * 60 * 1000 : scheduledAt.getTime();
    const ride: Ride = {
      id: `r_${now}`,
      driverId: currentUser.id,
      driverFirstName: currentUser.firstName,
      driverRating: currentUser.rating,
      driverVerified: currentUser.verified,
      driverProfilePicUri: currentUser.profilePicUri,
      driverCompletedRides: currentUser.completedRides,
      driverJoinedAt: currentUser.joinedAt,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        plateNumber: vehicle.plateNumber,
      },
      from: from.trim(),
      to: to.trim(),
      distanceKm: estimate.distanceKm,
      durationMin: estimate.durationMin,
      departureTime,
      totalSeats: seatCount,
      pricePerPerson: breakdown.farePerPerson,
      fuelEfficiency,
      terrainMultiplier: 1.0,
      status: 'open',
      passengers: [],
      messages: [],
      driverStatus: 'preparing',
      notes: notes.trim() || undefined,
      createdAt: now,
    };
    dispatch({ type: 'ADD_RIDE', ride });

    const fulfilledRequest = fulfillingRequestId
      ? state.rideRequests.find((r) => r.id === fulfillingRequestId)
      : undefined;
    if (fulfilledRequest) {
      dispatch({ type: 'FULFILL_REQUEST', requestId: fulfilledRequest.id, rideId: ride.id });
    }

    // First joiner is the requester if we're fulfilling, otherwise Bea.
    // Second joiner is always Rico so single-device demos always end up
    // with two real-feeling people chatting in the ride.
    const firstJoiner: AutoRider = fulfilledRequest
      ? {
          userId: fulfilledRequest.riderId,
          firstName: fulfilledRequest.riderFirstName,
          verified: fulfilledRequest.riderVerified,
          profilePicUri: fulfilledRequest.riderProfilePicUri,
          joinDelayMs: DEFAULT_AUTO_RIDERS[0].joinDelayMs,
          messageDelayMs: DEFAULT_AUTO_RIDERS[0].messageDelayMs,
          message: `Salamat sa ride kuya! Nandito po ako sa ${ride.from}.`,
        }
      : DEFAULT_AUTO_RIDERS[0];
    const secondJoiner = DEFAULT_AUTO_RIDERS[1];

    const queue: AutoRider[] = [firstJoiner];
    if (ride.totalSeats >= 2 && secondJoiner.userId !== firstJoiner.userId) {
      queue.push(secondJoiner);
    }

    for (const rider of queue) {
      setTimeout(() => {
        const passenger: Passenger = {
          id: `p_auto_${rider.userId}_${Date.now()}`,
          userId: rider.userId,
          firstName: rider.firstName,
          verified: rider.verified,
          status: 'waiting',
          joinedAt: Date.now(),
          profilePicUri: rider.profilePicUri,
        };
        dispatch({ type: 'JOIN_RIDE', rideId: ride.id, passenger });
        dispatch({
          type: 'SEND_MESSAGE',
          rideId: ride.id,
          message: {
            id: `m_sys_join_${rider.userId}_${Date.now()}`,
            senderId: 'system',
            senderFirstName: 'System',
            text: `${rider.firstName} joined the ride`,
            sentAt: Date.now(),
            isSystem: true,
          },
        });
      }, rider.joinDelayMs);

      setTimeout(() => {
        dispatch({
          type: 'SEND_MESSAGE',
          rideId: ride.id,
          message: {
            id: `m_auto_msg_${rider.userId}_${Date.now()}`,
            senderId: rider.userId,
            senderFirstName: rider.firstName,
            senderProfilePicUri: rider.profilePicUri,
            text: rider.message,
            sentAt: Date.now(),
          },
        });
      }, rider.messageDelayMs);
    }

    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Create Ride' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {fulfillingRequestId ? (
            <View style={styles.banner}>
              <Text variant="labelMedium" style={styles.bannerText}>
                Fulfilling a rider request — posting this ride will mark it matched.
              </Text>
            </View>
          ) : null}
          <TextInput
            label="From"
            value={from}
            onChangeText={setFrom}
            mode="outlined"
            placeholder="e.g. La Trinidad"
          />
          <TextInput
            label="To"
            value={to}
            onChangeText={setTo}
            mode="outlined"
            placeholder="e.g. UP Baguio"
          />

          <View style={styles.group}>
            <Text variant="labelLarge" style={styles.label}>
              Departure
            </Text>
            <SegmentedButtons
              value={departureType}
              onValueChange={(v) => setDepartureType(v as 'now' | 'scheduled')}
              buttons={[
                { value: 'now', label: 'Leaving now' },
                { value: 'scheduled', label: 'Scheduled' },
              ]}
            />
            {departureType === 'scheduled' ? (
              <>
                <Button mode="outlined" icon="calendar" onPress={() => setPickerOpen(true)}>
                  {scheduledAt.toLocaleString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Button>
                {pickerOpen ? (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="datetime"
                    minimumDate={new Date()}
                    onChange={(_, date) => {
                      setPickerOpen(Platform.OS === 'ios');
                      if (date) setScheduledAt(date);
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </View>

          <TextInput
            label="Available seats"
            value={seats}
            onChangeText={setSeats}
            mode="outlined"
            keyboardType="number-pad"
          />
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            placeholder="Pag-uwi na, may space pa."
          />

          {!vehicle ? (
            <Text style={styles.warning}>
              Your profile has no vehicle on file. This demo user should be a driver — check mock data.
            </Text>
          ) : null}

          {estimate ? (
            <Text variant="bodySmall" style={styles.muted}>
              {estimate.source === 'cached' ? 'Cached route' : 'Estimated route'} ·{' '}
              {estimate.distanceKm} km · {estimate.durationMin} min
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.muted}>
              Enter origin and destination to see the fare.
            </Text>
          )}

          {breakdown ? (
            <View style={styles.breakdown}>
              <Button
                mode="text"
                icon={breakdownOpen ? 'chevron-up' : 'chevron-down'}
                contentStyle={{ flexDirection: 'row-reverse' }}
                onPress={() => setBreakdownOpen((v) => !v)}
              >
                {breakdownOpen ? 'Hide fare breakdown' : 'Show fare breakdown'}
              </Button>
              {breakdownOpen ? <PriceBreakdown breakdown={breakdown} /> : null}
            </View>
          ) : null}

          <Button mode="contained" disabled={!canSubmit} onPress={onPost} style={styles.submit}>
            Post Ride
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  group: {
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
  },
  muted: {
    color: colors.muted,
  },
  warning: {
    color: colors.danger,
  },
  banner: {
    padding: spacing.md,
    backgroundColor: '#E6F3E8',
    borderRadius: 8,
  },
  bannerText: {
    color: colors.primary,
    fontWeight: '600',
  },
  submit: {
    marginTop: spacing.md,
  },
  breakdown: {
    gap: spacing.sm,
  },
});
