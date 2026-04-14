import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { VerifiedBadge } from './VerifiedBadge';
import { formatPHP } from '../utils/pricing';
import { formatDepartureTime } from '../utils/format';
import { colors, spacing } from '../constants/theme';
import type { Ride } from '../utils/types';

type Props = {
  ride: Ride;
  onPress?: () => void;
};

export function RideCard({ ride, onPress }: Props) {
  const seatsLeft = ride.totalSeats - ride.passengers.filter((p) => p.status !== 'dropped_off').length;
  const timeLabel = formatDepartureTime(ride.departureTime);

  return (
    <Card onPress={onPress} style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.driverRow}>
            <Text variant="titleMedium">{ride.driverFirstName}</Text>
            {ride.driverVerified ? <VerifiedBadge compact /> : null}
            <Text variant="bodySmall" style={styles.muted}>
              · {ride.driverRating.toFixed(1)} ★
            </Text>
          </View>
          <Text variant="titleMedium" style={styles.price}>
            {formatPHP(ride.pricePerPerson)}
          </Text>
        </View>

        <Text variant="bodyLarge" style={styles.route}>
          {ride.from} → {ride.to}
        </Text>
        <Text variant="bodySmall" style={styles.muted}>
          {timeLabel} · {ride.distanceKm} km · {ride.durationMin} min · {seatsLeft} seat
          {seatsLeft === 1 ? '' : 's'} left
        </Text>
        {ride.notes ? (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={1}>
            “{ride.notes}”
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  route: {
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  notes: {
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
});
