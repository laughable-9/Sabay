import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { calculateFare } from '../../utils/pricing';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { estimateDistance } from '../../utils/distance';
import { DEFAULT_FUEL_EFFICIENCY_KM_PER_L } from '../../constants/config';
import { colors, spacing } from '../../constants/theme';
import type { Passenger, Ride } from '../../utils/types';

const LOCATIONS = [
  'Session Road', 'SM Baguio', 'UP Baguio', 'La Trinidad',
  'SLU Maryheights', 'Baguio CBD', 'Camp John Hay', 'Itogon',
  'Tuba', 'Pinsao Proper', 'Trancoville', 'Ambuklao',
];

type AutoRider = {
  userId: string;
  firstName: string;
  verified: boolean;
  profilePicUri?: string;
  joinDelayMs: number;
  messageDelayMs: number;
  message: string;
};

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
  const [focusedField, setFocusedField] = useState<'from' | 'to' | null>(null);
  const fulfillingRequestId = params.requestId;

  const fuelPrice = useMemo(
    () => aggregateGasPrices(state.gasPrices, 'unleaded').medianPrice,
    [state.gasPrices],
  );

  const vehicle = currentUser.vehicle;
  const fuelEfficiency = vehicle?.fuelEfficiency ?? DEFAULT_FUEL_EFFICIENCY_KM_PER_L;
  const seatCount = Math.max(2, Math.min(6, Number(seats) || 2));

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

  const suggestions = useMemo(() => {
    if (!focusedField) return [];
    const q = (focusedField === 'from' ? from : to).trim().toLowerCase();
    if (!q) return LOCATIONS;
    return LOCATIONS.filter((l) => l.toLowerCase().includes(q));
  }, [focusedField, from, to]);

  const pickSuggestion = (value: string) => {
    if (focusedField === 'from') setFrom(value);
    else if (focusedField === 'to') setTo(value);
    setFocusedField(null);
  };

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
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Fulfilling request banner */}
          {fulfillingRequestId && (
            <View style={styles.banner}>
              <MaterialCommunityIcons name="handshake" size={18} color={colors.primary} />
              <Text variant="labelMedium" style={styles.bannerText}>
                Fulfilling a rider request — posting this ride will mark it matched.
              </Text>
            </View>
          )}

          {/* Route card */}
          <Card style={styles.card}>
            <Card.Content style={styles.routeCard}>
              <View style={styles.routeDots}>
                <View style={styles.greenDot} />
                <View style={styles.dottedLine} />
                <View style={styles.redDot} />
              </View>
              <View style={styles.routeInputs}>
                <TextInput
                  label="Pickup location"
                  value={from}
                  onChangeText={(v) => { setFrom(v); setFocusedField('from'); }}
                  onFocus={() => setFocusedField('from')}
                  mode="outlined"
                  placeholder="e.g. La Trinidad"
                  dense
                  style={styles.routeInput}
                />
                <TextInput
                  label="Drop-off"
                  value={to}
                  onChangeText={(v) => { setTo(v); setFocusedField('to'); }}
                  onFocus={() => setFocusedField('to')}
                  mode="outlined"
                  placeholder="e.g. UP Baguio"
                  dense
                  style={styles.routeInput}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Autocomplete suggestions */}
          {focusedField && suggestions.length > 0 && (
            <Card style={styles.suggestCard}>
              <Card.Content style={styles.suggestContent}>
                <Pressable style={styles.suggestRow} onPress={() => pickSuggestion('Baguio CBD')}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.primary} />
                  <Text variant="bodyMedium" style={styles.currentLocText}>Use current location</Text>
                </Pressable>
                <View style={styles.suggestDivider} />
                {suggestions.map((loc) => (
                  <Pressable key={loc} style={styles.suggestRow} onPress={() => pickSuggestion(loc)}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.muted} />
                    <Text variant="bodyMedium">{loc}</Text>
                  </Pressable>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Route preview */}
          {estimate && (
            <View style={styles.routePreview}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.primary} />
              <Text variant="bodySmall" style={styles.previewText}>
                {estimate.source === 'cached' ? 'Known route' : 'Estimated'} · {estimate.distanceKm} km · {estimate.durationMin} min
              </Text>
            </View>
          )}

          {/* Departure card */}
          <Card style={styles.card}>
            <Card.Content style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                <Text variant="labelLarge">When are you leaving?</Text>
              </View>
              <SegmentedButtons
                value={departureType}
                onValueChange={(v) => setDepartureType(v as 'now' | 'scheduled')}
                buttons={[
                  { value: 'now', label: 'Leaving now' },
                  { value: 'scheduled', label: 'Scheduled' },
                ]}
              />
              {departureType === 'scheduled' && (
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
                  {pickerOpen && (
                    <DateTimePicker
                      value={scheduledAt}
                      mode="datetime"
                      minimumDate={new Date()}
                      onChange={(_, date) => {
                        setPickerOpen(Platform.OS === 'ios');
                        if (date) setScheduledAt(date);
                      }}
                    />
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Ride details card */}
          <Card style={styles.card}>
            <Card.Content style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="car-side" size={18} color={colors.primary} />
                <Text variant="labelLarge">Ride details</Text>
              </View>
              <TextInput
                label="Available seats (min. 2)"
                value={seats}
                onChangeText={setSeats}
                mode="outlined"
                keyboardType="number-pad"
                dense
                style={styles.inputBg}
              />
              <TextInput
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                placeholder="Pag-uwi na, may space pa."
                dense
                style={styles.inputBg}
              />
            </Card.Content>
          </Card>

          {/* Vehicle warning */}
          {!vehicle && (
            <View style={styles.warningRow}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
              <Text variant="bodySmall" style={styles.warningText}>
                No vehicle on file. Add one in your profile to post rides.
              </Text>
            </View>
          )}

          {/* Fare breakdown */}
          {breakdown && (
            <Card style={styles.card}>
              <Card.Content style={styles.sectionContent}>
                <Pressable
                  style={styles.fareToggle}
                  onPress={() => setBreakdownOpen((v) => !v)}
                >
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="calculator-variant" size={18} color={colors.primary} />
                    <Text variant="labelLarge">Fare breakdown</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={breakdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
                {breakdownOpen && <PriceBreakdown breakdown={breakdown} />}
              </Card.Content>
            </Card>
          )}

          {/* Submit */}
          <Button
            mode="contained"
            disabled={!canSubmit}
            onPress={onPost}
            style={styles.submit}
            contentStyle={styles.submitContent}
            labelStyle={styles.submitLabel}
          >
            Post Ride
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#E6F3E8',
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
    color: colors.primary,
    fontWeight: '600',
  },

  // Route section
  routeCard: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  routeDots: {
    alignItems: 'center',
    paddingTop: 20,
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
    height: 28,
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
  routeInputs: {
    flex: 1,
    gap: spacing.sm,
  },
  routeInput: {
    backgroundColor: colors.card,
  },

  // Autocomplete
  suggestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: -spacing.xs,
  },
  suggestContent: {
    gap: 0,
  },
  currentLocText: {
    color: colors.primary,
    fontWeight: '600',
  },
  suggestDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  // Route preview
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  previewText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Section cards
  sectionContent: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputBg: {
    backgroundColor: colors.card,
  },

  // Warning
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  warningText: {
    color: colors.danger,
    flex: 1,
  },

  // Fare toggle
  fareToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Submit
  submit: {
    marginTop: spacing.sm,
    borderRadius: 12,
  },
  submitContent: {
    paddingVertical: 4,
  },
  submitLabel: {
    fontWeight: '700',
    fontSize: 15,
  },
});
