import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import type { PricingBreakdown } from '../utils/pricing';
import { formatPHP } from '../utils/pricing';
import { colors, spacing } from '../constants/theme';

type Props = {
  breakdown: PricingBreakdown;
};

export function PriceBreakdown({ breakdown }: Props) {
  const rows: Array<[string, string]> = [
    ['Distance', `${breakdown.distanceKm.toFixed(1)} km`],
    ['Fuel price', `${formatPHP(breakdown.fuelPricePerLiter)}/L`],
    ['Efficiency', `${breakdown.fuelEfficiency} km/L`],
    ['Liters used', `${breakdown.litersUsed.toFixed(2)} L`],
    ['Base fuel cost', formatPHP(breakdown.baseFuelCost)],
    ['Split / passenger', formatPHP(breakdown.splitPerPerson)],
    ['Platform fee', formatPHP(breakdown.platformFee)],
  ];

  return (
    <View style={styles.container}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text variant="bodyMedium" style={styles.label}>
            {label}
          </Text>
          <Text variant="bodyMedium">{value}</Text>
        </View>
      ))}
      <Divider style={styles.divider} />
      <View style={styles.row}>
        <Text variant="titleMedium">Fare per rider</Text>
        <Text variant="titleMedium" style={styles.fare}>
          {formatPHP(breakdown.farePerPerson)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.muted,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  fare: {
    color: colors.primary,
    fontWeight: '700',
  },
});
