import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

export default function Terms() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg) },
        ]}
      >
        <Text variant="headlineSmall" style={styles.h1}>
          Terms of Service
        </Text>
        <Text variant="bodySmall" style={styles.muted}>
          Last updated: April 15, 2026
        </Text>

        <Section title="1. What Sabay is">
          Sabay is a peer-to-peer carpooling platform for Baguio City and Benguet. It connects
          commuters heading along common routes so they can share a ride and split the fuel
          cost. Sabay is not a for-hire transportation service, and drivers on the platform
          are not professional drivers.
        </Section>

        <Section title="2. Cost sharing, not profit">
          Every fare shown in the app is a split of the driver's estimated fuel cost,
          calculated from the trip distance, the vehicle's efficiency, a crowdsourced median
          fuel price, and the number of passengers. A small platform fee is added to keep the
          service running. Drivers do not profit from rides — they offset fuel costs.
        </Section>

        <Section title="3. Eligibility">
          You must be at least 18 years old to use Sabay. To drive on the platform, you must
          hold a valid Philippine driver's license and be the registered owner of the vehicle
          you are sharing (or have the owner's written permission).
        </Section>

        <Section title="4. User conduct">
          You agree to follow all applicable traffic laws and to treat fellow users with
          respect. Harassment, discrimination, reckless driving, and any form of illegal
          activity on the platform are grounds for immediate suspension.
        </Section>

        <Section title="5. Payments">
          Fare payments are sent directly from riders to drivers via GCash or other means
          agreed outside the app. Sabay does not process or hold payments on your behalf.
          The small platform fee is the only transaction Sabay collects.
        </Section>

        <Section title="6. Safety">
          Sabay provides verification badges, real-time shareable tracking links, and in-app
          chat to help you carpool safely. These tools do not replace your own judgment.
          Always confirm the driver, plate number, and car match before boarding.
        </Section>

        <Section title="7. Limitation of liability">
          Sabay is a platform. We are not a party to rides booked through the app and are
          not responsible for vehicle condition, driving behavior, delays, or losses. You
          agree to use the service at your own risk.
        </Section>

        <Section title="8. Termination">
          You may delete your account at any time from the Profile tab. We may suspend or
          terminate accounts that violate these Terms.
        </Section>

        <Section title="9. Contact">
          Questions? Reach out at hello@sabay.ph.
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <>
      <Text variant="titleMedium" style={styles.h2}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        {children}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  h1: {
    fontWeight: '800',
  },
  h2: {
    fontWeight: '700',
    marginTop: spacing.md,
  },
  body: {
    color: colors.text,
    lineHeight: 22,
  },
  muted: {
    color: colors.muted,
  },
});
