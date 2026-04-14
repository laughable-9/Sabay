import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';

type Props = {
  pickedUp: number;
  total: number;
};

export function PassengerBadge({ pickedUp, total }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="account-group" color={colors.primary} size={16} />
      <Text variant="labelLarge" style={styles.text}>
        {pickedUp}/{total} riders
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  text: {
    color: colors.primary,
    fontWeight: '700',
  },
});
