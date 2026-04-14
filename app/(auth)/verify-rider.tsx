import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

type UploadState = 'pending' | 'uploaded';

export default function VerifyRider() {
  const insets = useSafeAreaInsets();
  const [idState, setIdState] = useState<UploadState>('pending');
  const [selfieState, setSelfieState] = useState<UploadState>('pending');
  const [agreed, setAgreed] = useState(false);

  const canSubmit = idState === 'uploaded' && selfieState === 'uploaded' && agreed;

  return (
    <>
      <Stack.Screen options={{ title: 'Rider Verification' }} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg) },
        ]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Quick verification
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          We only verify that you're a real person. Photos are reviewed and then deleted —
          never shown to drivers.
        </Text>

        <UploadCard
          icon="card-account-details-outline"
          title="Valid ID"
          subtitle="School ID or any government-issued ID"
          state={idState}
          onPress={() => setIdState('uploaded')}
        />

        <UploadCard
          icon="emoticon-happy-outline"
          title="Quick selfie"
          subtitle="So we can match your face to your ID"
          state={selfieState}
          onPress={() => setSelfieState('uploaded')}
        />

        <Pressable style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
          <MaterialCommunityIcons
            name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={26}
            color={agreed ? colors.primary : colors.muted}
          />
          <Text variant="bodyMedium" style={styles.agreeText}>
            I agree to the Terms and the Data Privacy Policy.
          </Text>
        </Pressable>

        <Button
          mode="contained"
          disabled={!canSubmit}
          onPress={() => router.replace('/verify-pending')}
        >
          Submit
        </Button>
      </ScrollView>
    </>
  );
}

function UploadCard({
  icon,
  title,
  subtitle,
  state,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
  state: UploadState;
  onPress: () => void;
}) {
  const uploaded = state === 'uploaded';
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.cardContent}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: uploaded ? colors.success : colors.surface },
          ]}
        >
          <MaterialCommunityIcons
            name={uploaded ? 'check' : icon}
            size={24}
            color={uploaded ? '#FFFFFF' : colors.muted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{title}</Text>
          <Text variant="bodySmall" style={styles.muted}>
            {uploaded ? 'Uploaded' : subtitle}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.muted}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontWeight: '700',
  },
  muted: {
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  agreeText: {
    flex: 1,
    color: colors.text,
  },
});
