import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

export default function Privacy() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg) },
        ]}
      >
        <Text variant="headlineSmall" style={styles.h1}>
          Privacy Policy
        </Text>
        <Text variant="bodySmall" style={styles.muted}>
          Last updated: April 15, 2026
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          Sabay handles personal information in line with the Philippine Data Privacy Act
          (RA 10173). This policy explains what we collect, why, and how you control it.
        </Text>

        <Section title="What we collect">
          {[
            'Name and phone number (doubles as your GCash for fare transfers).',
            'Profile photo you choose to upload.',
            'A government or school ID and a selfie — only during verification, reviewed then deleted.',
            "For drivers: driver's license and OR/CR photos — reviewed then deleted after approval.",
            'Vehicle information you type in (make, model, color, plate, efficiency).',
            'Live location — only while you are in an active ride.',
            'Chat messages within a ride thread.',
            'Gas price submissions you make to the Gas Price Hub (stored anonymized).',
          ]}
        </Section>

        <Section title="Why we collect it">
          {[
            'To verify that every user is a real person (trust).',
            'To match riders with drivers going the same way.',
            'To calculate a transparent fare split.',
            'To let riders share their live ride with family for safety.',
            'To keep crowdsourced gas prices accurate.',
          ]}
        </Section>

        <Section title="Who sees what">
          {[
            'Other users see your first name, verified badge, rating, and — for matched rides — the masked plate number of your car.',
            'Your phone number is never shown on public listings. Only matched ride participants see it for the GCash transfer.',
            'Verification documents are never shared with other users.',
            'Gas price submissions are displayed as aggregates only — individual submissions are not attributed publicly.',
          ]}
        </Section>

        <Section title="How long we keep data">
          {[
            'Verification photos (ID, selfie, license, OR/CR) are deleted once your status is approved or rejected.',
            'Live location is purged when the ride ends.',
            'Ride history, messages, and ratings are retained for your own records until you delete your account.',
            'Shareable tracking links expire the moment the ride ends.',
          ]}
        </Section>

        <Section title="Your rights">
          {[
            'Access — view all data linked to your account from the Profile tab.',
            'Correction — edit your name, phone, and profile photo anytime.',
            'Deletion — delete your account and all associated records via Profile › Settings.',
            'Portability — request an export of your ride history by emailing privacy@sabay.ph.',
          ]}
        </Section>

        <Section title="Contact">
          {[
            'Data Protection Officer: privacy@sabay.ph',
            'General questions: hello@sabay.ph',
          ]}
        </Section>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: string[] }) {
  return (
    <>
      <Text variant="titleMedium" style={styles.h2}>
        {title}
      </Text>
      {children.map((line, i) => (
        <Text key={i} variant="bodyMedium" style={styles.bullet}>
          • {line}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  h1: {
    fontWeight: '800',
  },
  h2: {
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  body: {
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  bullet: {
    color: colors.text,
    lineHeight: 22,
  },
  muted: {
    color: colors.muted,
  },
});
