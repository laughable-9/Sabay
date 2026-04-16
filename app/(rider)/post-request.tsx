import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, Card, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { estimateDistance } from '../../utils/distance';
import { colors, spacing } from '../../constants/theme';
import type { RideRequest } from '../../utils/types';

const LOCATIONS = [
  'Session Road', 'SM Baguio', 'UP Baguio', 'La Trinidad',
  'SLU Maryheights', 'Baguio CBD', 'Camp John Hay', 'Itogon',
  'Tuba', 'Pinsao Proper', 'Trancoville', 'Ambuklao',
];

export default function PostRequest() {
  const { dispatch, currentUser } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [notes, setNotes] = useState('');
  const [departureType, setDepartureType] = useState<'soon' | 'scheduled'>('soon');
  const [scheduledAt, setScheduledAt] = useState<Date>(() => new Date(Date.now() + 60 * 60 * 1000));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<'from' | 'to' | null>(null);

  const estimate = useMemo(() => {
    if (!from.trim() || !to.trim()) return null;
    return estimateDistance(from, to);
  }, [from, to]);

  const canSubmit = !!from.trim() && !!to.trim() && !!estimate;

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
    if (!estimate) return;
    const now = Date.now();
    const departure =
      departureType === 'soon' ? now + 30 * 60 * 1000 : scheduledAt.getTime();
    const request: RideRequest = {
      id: `req_${now}`,
      riderId: currentUser.id,
      riderFirstName: currentUser.firstName,
      riderVerified: currentUser.verified,
      riderProfilePicUri: currentUser.profilePicUri,
      from: from.trim(),
      to: to.trim(),
      distanceKm: estimate.distanceKm,
      durationMin: estimate.durationMin,
      desiredDepartureTime: departure,
      notes: notes.trim() || undefined,
      status: 'open',
      createdAt: now,
    };
    dispatch({ type: 'POST_REQUEST', request });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Post a Request' }} />
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
          {/* Route card */}
          <Card style={styles.card}>
            <Card.Content style={styles.routeCard}>
              {/* Route dots */}
              <View style={styles.routeDots}>
                <View style={styles.greenDot} />
                <View style={styles.dottedLine} />
                <View style={styles.redDot} />
              </View>

              {/* Inputs */}
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
                  label="Destination"
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
                <Text variant="labelLarge">When do you want to leave?</Text>
              </View>
              <SegmentedButtons
                value={departureType}
                onValueChange={(v) => setDepartureType(v as 'soon' | 'scheduled')}
                buttons={[
                  { value: 'soon', label: 'Within the hour' },
                  { value: 'scheduled', label: 'Later' },
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

          {/* Notes card */}
          <Card style={styles.card}>
            <Card.Content style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.primary} />
                <Text variant="labelLarge">Notes for drivers</Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                placeholder="Flexible on timing, prefer AC, etc."
                dense
              />
            </Card.Content>
          </Card>

          {/* Submit */}
          <Button
            mode="contained"
            disabled={!canSubmit}
            onPress={onPost}
            style={styles.submit}
            contentStyle={styles.submitContent}
            labelStyle={styles.submitLabel}
          >
            Post Request
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
