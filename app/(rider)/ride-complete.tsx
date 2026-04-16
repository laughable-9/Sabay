import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../../components/StarRating';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { formatPHP } from '../../utils/pricing';
import { estimateCO2SavedKg, formatKg } from '../../utils/impact';
import { colors, spacing } from '../../constants/theme';

export default function RiderRideComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const ride = state.rides.find((r) => r.id === id);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!ride) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Ride Complete' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const co2 = estimateCO2SavedKg(ride.distanceKm, ride.passengers.length || 1);

  return (
    <>
      <Stack.Screen options={{ title: 'Ride Complete' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.hero}>
          <MaterialCommunityIcons
            name="check-circle"
            size={56}
            color={colors.success}
          />
          <Text variant="headlineSmall" style={styles.title}>
            You've arrived
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {ride.from} → {ride.to}
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.statsGrid}>
            <Stat label="Fare paid" value={formatPHP(ride.pricePerPerson)} />
            <Stat label="Distance" value={`${ride.distanceKm} km`} />
            <Stat label="Duration" value={`${ride.durationMin} min`} />
            <Stat label="CO₂ saved" value={formatKg(co2)} highlight />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.driverRow}>
              <Text variant="titleMedium">Rate {ride.driverFirstName}</Text>
              {ride.driverVerified ? <VerifiedBadge compact /> : null}
            </View>
            <Text variant="bodySmall" style={styles.muted}>
              How was the ride?
            </Text>
            <View style={styles.rating}>
              <StarRating value={rating} onChange={setRating} disabled={submitted} />
            </View>
            <TextInput
              label="Add a comment (optional)"
              value={comment}
              onChangeText={setComment}
              mode="outlined"
              multiline
              numberOfLines={3}
              disabled={submitted}
              style={styles.comment}
            />
            <Button
              mode="contained-tonal"
              disabled={rating === 0 || submitted}
              onPress={() => setSubmitted(true)}
              style={styles.submit}
            >
              {submitted ? 'Thanks for rating' : 'Submit rating'}
            </Button>
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={() => router.replace('/(tabs)')}>
          Back to Home
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text variant="bodySmall" style={styles.muted}>
        {label}
      </Text>
      <Text
        variant="titleMedium"
        style={[styles.statValue, highlight ? styles.statHighlight : null]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  title: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stat: {
    minWidth: '40%',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  statHighlight: {
    color: colors.success,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  rating: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  comment: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
