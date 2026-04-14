import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Card } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { colors, spacing } from '../../constants/theme';
import type { Role } from '../../utils/types';

export default function Profile() {
  const { state, dispatch, currentUser } = useApp();

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">{currentUser.firstName}</Text>
            <Text variant="bodyMedium" style={styles.muted}>
              {currentUser.verified ? 'Verified' : 'Unverified'} · {currentUser.rating.toFixed(1)} ★ ·{' '}
              {currentUser.completedRides} rides
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.label}>
            Active role
          </Text>
          <SegmentedButtons
            value={state.role}
            onValueChange={(v) => dispatch({ type: 'SET_ROLE', role: v as Role })}
            buttons={[
              { value: 'rider', label: 'Rider' },
              { value: 'driver', label: 'Driver' },
            ]}
          />
          <Text variant="bodySmall" style={styles.hint}>
            Switch roles to see the other side of the demo. Real signup picks this once.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
