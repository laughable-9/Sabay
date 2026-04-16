import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';

type Props = {
  compact?: boolean;
};

export function VerifiedBadge({ compact = false }: Props) {
  return (
    <View style={[styles.container, compact ? styles.compact : styles.full]}>
      <MaterialCommunityIcons name="check-decagram" color={colors.primary} size={compact ? 14 : 16} />
      {!compact ? (
        <Text variant="labelSmall" style={styles.label}>
          Verified
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compact: {
    paddingHorizontal: 2,
  },
  full: {
    paddingHorizontal: spacing.xs,
  },
  label: {
    color: colors.primary,
    fontWeight: '600',
  },
});
