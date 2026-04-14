import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Switch, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../../components/StarRating';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { formatPHP } from '../../utils/pricing';
import { colors, spacing } from '../../constants/theme';

export default function DriverRideComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, currentUser } = useApp();
  const ride = state.rides.find((r) => r.id === id);
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const summary = useMemo(() => {
    if (!ride) return { settled: 0, expected: 0, outstanding: 0, paidCount: 0, expectedCount: 0 };
    const expectedPassengers = ride.passengers.filter((p) => p.status !== 'waiting');
    const paidPassengers = expectedPassengers.filter((p) => p.paymentReceived);
    const expected = expectedPassengers.length * ride.pricePerPerson;
    const settled = paidPassengers.length * ride.pricePerPerson;
    return {
      settled,
      expected,
      outstanding: expected - settled,
      paidCount: paidPassengers.length,
      expectedCount: expectedPassengers.length,
    };
  }, [ride]);

  if (!ride) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Ride Complete' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  const togglePayment = (passengerId: string, received: boolean) => {
    dispatch({ type: 'SET_PASSENGER_PAYMENT', rideId: ride.id, passengerId, received });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ride Complete' }} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg) },
        ]}
      >
        <View style={styles.hero}>
          <MaterialCommunityIcons name="flag-checkered" size={56} color={colors.success} />
          <Text variant="headlineSmall" style={styles.title}>
            Ride wrapped
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {ride.from} → {ride.to}
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.muted}>
              Fuel cost covered
            </Text>
            <Text variant="displaySmall" style={styles.earnings}>
              {formatPHP(summary.settled)}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {summary.paidCount} of {summary.expectedCount} rider
              {summary.expectedCount === 1 ? '' : 's'} have sent their share via GCash to{' '}
              {currentUser.phone ?? 'your number'}.
            </Text>
            {summary.outstanding > 0 ? (
              <Text variant="bodySmall" style={styles.outstanding}>
                {formatPHP(summary.outstanding)} still outstanding
              </Text>
            ) : null}
          </Card.Content>
        </Card>

        {ride.passengers.length > 0 ? (
          <Card style={styles.card}>
            <Card.Content style={{ gap: spacing.sm }}>
              <Text variant="labelLarge" style={styles.muted}>
                Payments
              </Text>
              {ride.passengers.map((p) => (
                <View key={p.id} style={styles.paxRow}>
                  <View style={styles.paxName}>
                    <Avatar uri={p.profilePicUri} firstName={p.firstName} size={36} />
                    <View>
                      <View style={styles.nameRow}>
                        <Text variant="bodyLarge">{p.firstName}</Text>
                        {p.verified ? <VerifiedBadge compact /> : null}
                      </View>
                      <Text variant="bodySmall" style={styles.muted}>
                        {formatPHP(ride.pricePerPerson)} ·{' '}
                        {p.status === 'waiting'
                          ? 'no-show'
                          : p.status === 'dropped_off'
                            ? 'dropped off early'
                            : 'rode with you'}
                      </Text>
                    </View>
                  </View>
                  {p.status === 'waiting' ? (
                    <Chip compact>no-show</Chip>
                  ) : (
                    <View style={styles.paymentToggle}>
                      <Text
                        variant="labelSmall"
                        style={[
                          styles.paymentLabel,
                          p.paymentReceived ? styles.paymentPaid : styles.paymentDue,
                        ]}
                      >
                        {p.paymentReceived ? 'Paid' : 'Unpaid'}
                      </Text>
                      <Switch
                        value={!!p.paymentReceived}
                        onValueChange={(v) => togglePayment(p.id, v)}
                      />
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Rate your riders</Text>
            <Text variant="bodySmall" style={styles.muted}>
              One tap for the whole group.
            </Text>
            <View style={styles.rating}>
              <StarRating value={rating} onChange={setRating} disabled={submitted} />
            </View>
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
          Back to Dashboard
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
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
  earnings: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  outstanding: {
    color: colors.warning,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  paxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paxName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentLabel: {
    fontWeight: '600',
  },
  paymentPaid: {
    color: colors.success,
  },
  paymentDue: {
    color: colors.muted,
  },
  rating: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
