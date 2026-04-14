import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SabayMap } from '../components/SabayMap';
import { useRideSimulation } from '../hooks/useRideSimulation';
import { colors, spacing } from '../constants/theme';

export default function Tracking() {
  const { activeRide } = useApp();
  const { polyline, position, etaLabel } = useRideSimulation(activeRide);

  if (!activeRide) {
    return (
      <>
        <Stack.Screen options={{ title: 'Shared Ride' }} />
        <View style={styles.expired}>
          <MaterialCommunityIcons name="link-variant-off" size={48} color={colors.muted} />
          <Text variant="titleMedium">Link expired</Text>
          <Text variant="bodyMedium" style={styles.muted}>
            The shared ride has ended or the link is no longer valid.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Shared Ride', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.banner}>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.primary} />
          <Text variant="labelSmall" style={styles.bannerText}>
            Live location shared via sabay.ph
          </Text>
        </View>

        <View style={styles.mapWrap}>
          <SabayMap driverPosition={position ?? undefined} polyline={polyline} />
        </View>

        <View style={styles.infoCard}>
          <Text variant="labelSmall" style={styles.muted}>
            {activeRide.driverFirstName} is driving
          </Text>
          <Text variant="titleMedium">
            {activeRide.from} → {activeRide.to}
          </Text>
          <View style={styles.etaRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
            <Text variant="bodyMedium" style={styles.muted}>
              ETA {etaLabel}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.muted}>
            Link expires when the ride ends. No app install needed.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  bannerText: {
    color: colors.primary,
    fontWeight: '600',
  },
  mapWrap: {
    flex: 1,
  },
  infoCard: {
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  muted: {
    color: colors.muted,
  },
  expired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});
