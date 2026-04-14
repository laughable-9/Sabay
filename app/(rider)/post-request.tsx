import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { estimateDistance } from '../../utils/distance';
import { formatPHP } from '../../utils/pricing';
import { colors, spacing } from '../../constants/theme';
import type { RideRequest } from '../../utils/types';

const HOUR = 60 * 60 * 1000;

export default function PostRequest() {
  const { dispatch, currentUser } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [maxFare, setMaxFare] = useState('');
  const [notes, setNotes] = useState('');
  const [departureType, setDepartureType] = useState<'soon' | 'scheduled'>('soon');

  const estimate = useMemo(() => {
    if (!from.trim() || !to.trim()) return null;
    return estimateDistance(from, to);
  }, [from, to]);

  const maxFareNum = Number(maxFare);
  const maxFareValid = !maxFare || (Number.isFinite(maxFareNum) && maxFareNum > 0);
  const canSubmit = !!from.trim() && !!to.trim() && !!estimate && maxFareValid;

  const onPost = () => {
    if (!estimate) return;
    const now = Date.now();
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
      desiredDepartureTime: departureType === 'soon' ? now + 30 * 60 * 1000 : now + HOUR,
      maxFare: maxFare ? maxFareNum : undefined,
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="bodyMedium" style={styles.muted}>
          Tell drivers where you want to go. A matching ride might get posted.
        </Text>

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
          <Text variant="labelLarge" style={styles.muted}>
            Departure
          </Text>
          <SegmentedButtons
            value={departureType}
            onValueChange={(v) => setDepartureType(v as 'soon' | 'scheduled')}
            buttons={[
              { value: 'soon', label: 'Within the hour' },
              { value: 'scheduled', label: 'Later' },
            ]}
          />
        </View>

        <TextInput
          label="Max fare you'd pay (optional)"
          value={maxFare}
          onChangeText={setMaxFare}
          mode="outlined"
          keyboardType="decimal-pad"
          placeholder="PHP"
        />
        <TextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          placeholder="Flexible on timing, prefer AC, etc."
        />

        {estimate ? (
          <Text variant="bodySmall" style={styles.hint}>
            {estimate.source === 'cached' ? 'Cached route' : 'Estimated route'} ·{' '}
            {estimate.distanceKm} km · {estimate.durationMin} min
            {maxFare && maxFareValid ? ` · Up to ${formatPHP(maxFareNum)}` : ''}
          </Text>
        ) : (
          <Text variant="bodySmall" style={styles.hint}>
            Enter both origin and destination to preview the route.
          </Text>
        )}

        <Button mode="contained" disabled={!canSubmit} onPress={onPost} style={styles.submit}>
          Post Request
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  group: {
    gap: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  hint: {
    color: colors.muted,
  },
  submit: {
    marginTop: spacing.md,
  },
});
