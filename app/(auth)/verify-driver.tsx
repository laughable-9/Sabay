import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

type UploadState = 'pending' | 'uploaded';

export default function VerifyDriver() {
  const insets = useSafeAreaInsets();
  const [licenseState, setLicenseState] = useState<UploadState>('pending');
  const [orcrState, setOrcrState] = useState<UploadState>('pending');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [agreed, setAgreed] = useState(false);

  const canSubmit =
    licenseState === 'uploaded' &&
    orcrState === 'uploaded' &&
    plate.trim().length > 0 &&
    model.trim().length > 0 &&
    agreed;

  return (
    <>
      <Stack.Screen options={{ title: 'Driver Verification' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.lg) },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text variant="headlineSmall" style={styles.title}>
            Verify your driving
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            Drivers need to be licensed and own the vehicle they're sharing. Documents are
            reviewed once and deleted after approval.
          </Text>

          <UploadCard
            icon="card-account-details-outline"
            title="Driver's license"
            subtitle="Front and back"
            state={licenseState}
            onPress={() => setLicenseState('uploaded')}
          />

          <UploadCard
            icon="file-document-outline"
            title="OR / CR"
            subtitle="Official Receipt and Certificate of Registration"
            state={orcrState}
            onPress={() => setOrcrState('uploaded')}
          />

          <Text variant="labelLarge" style={styles.section}>
            Vehicle details
          </Text>
          <TextInput
            label="Plate number"
            value={plate}
            onChangeText={setPlate}
            mode="outlined"
            autoCapitalize="characters"
            placeholder="ABC 1234"
          />
          <TextInput
            label="Make and model"
            value={model}
            onChangeText={setModel}
            mode="outlined"
            placeholder="Toyota Vios"
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
            onPress={() => router.replace({ pathname: '/verify-pending', params: { role: 'driver' } })}
          >
            Submit for review
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
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
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
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
  section: {
    color: colors.muted,
    marginTop: spacing.sm,
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
