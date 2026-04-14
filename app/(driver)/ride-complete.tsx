import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../../components/StarRating';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Avatar } from '../../components/Avatar';
import { formatPHP } from '../../utils/pricing';
import { PLATFORM_FEE_PERCENT, PLATFORM_FEE_PHP } from '../../constants/config';
import { colors, spacing } from '../../constants/theme';

export default function DriverRideComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const ride = state.rides.find((r) => r.id === id);

  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const earnings = useMemo(() => {
    if (!ride) return { gross: 0, platformCut: 0, net: 0, paidCount: 0 };
    const paidCount = ride.passengers.filter((p) => p.status !== 'waiting').length;
    const gross = paidCount * ride.pricePerPerson;
    const platformCut = paidCount * Math.max(PLATFORM_FEE_PHP, ride.pricePerPerson * PLATFORM_FEE_PERCENT);
    return { gross, platformCut, net: gross - platformCut, paidCount };
  }, [ride]);

  if (!ride) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'Ride Complete' }} />
        <Text>Ride not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ride Complete' }} />
      <ScrollView contentContainerStyle={styles.container}>
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
              {formatPHP(earnings.net)}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {earnings.paidCount} rider{earnings.paidCount === 1 ? '' : 's'} chipped in to split your fuel cost.
            </Text>
          </Card.Content>
        </Card>

        {ride.passengers.length > 0 ? (
          <Card style={styles.card}>
            <Card.Content style={{ gap: spacing.sm }}>
              <Text variant="labelLarge" style={styles.muted}>
                Passengers
              </Text>
              {ride.passengers.map((p) => (
                <View key={p.id} style={styles.paxRow}>
                  <View style={styles.paxName}>
                    <Avatar uri={p.profilePicUri} firstName={p.firstName} size={32} />
                    <Text variant="bodyLarge">{p.firstName}</Text>
                    {p.verified ? <VerifiedBadge compact /> : null}
                  </View>
                  <View style={styles.paxRight}>
                    <Text variant="bodyMedium">{formatPHP(ride.pricePerPerson)}</Text>
                    <Chip compact>{p.status === 'waiting' ? 'no-show' : 'paid'}</Chip>
                  </View>
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
  earnings: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  paxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paxName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paxRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
