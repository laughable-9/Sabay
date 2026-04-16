import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SabayMap } from '../components/SabayMap';
import { Avatar } from '../components/Avatar';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRideSimulation } from '../hooks/useRideSimulation';
import { maskPlate } from '../utils/format';
import { colors, spacing } from '../constants/theme';

export default function Tracking() {
  const { activeRide } = useApp();
  const { polyline, position, etaLabel, region } = useRideSimulation(activeRide);
  const insets = useSafeAreaInsets();

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
        <View style={[styles.banner, { paddingTop: insets.top + spacing.sm }]}>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.primary} />
          <Text variant="labelSmall" style={styles.bannerText}>
            Live location shared via sabay.ph
          </Text>
        </View>

        <View style={styles.mapWrap}>
          <SabayMap
            driverPosition={position ?? undefined}
            polyline={polyline}
            region={region}
          />
        </View>

        <View
          style={[
            styles.infoCard,
            { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.sm) },
          ]}
        >
          <View style={styles.driverRow}>
            <Avatar
              uri={activeRide.driverProfilePicUri}
              firstName={activeRide.driverFirstName}
              size={44}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.driverNameRow}>
                <Text variant="titleMedium">{activeRide.driverFirstName}</Text>
                {activeRide.driverVerified ? <VerifiedBadge compact /> : null}
              </View>
              <Text variant="bodySmall" style={styles.muted}>
                {activeRide.driverRating.toFixed(1)} ★ · driving now
              </Text>
            </View>
          </View>

          <View style={styles.vehicleRow}>
            <MaterialCommunityIcons name="car-side" size={16} color={colors.muted} />
            <Text variant="bodyMedium">
              {activeRide.vehicle.color} {activeRide.vehicle.make} {activeRide.vehicle.model}
            </Text>
            <View style={styles.platePill}>
              <Text variant="labelSmall" style={styles.plateText}>
                {maskPlate(activeRide.vehicle.plateNumber)}
              </Text>
            </View>
          </View>

          <Text variant="titleSmall" style={styles.route}>
            {activeRide.from} → {activeRide.to}
          </Text>
          <View style={styles.etaRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.muted} />
            <Text variant="bodyMedium" style={styles.muted}>
              ETA {etaLabel}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.footer}>
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
    backgroundColor: colors.card,
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
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  platePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: 6,
  },
  plateText: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 1,
  },
  route: {
    marginTop: spacing.xs,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  muted: {
    color: colors.muted,
  },
  footer: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  expired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});
