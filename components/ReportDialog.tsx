import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';
import type { Report } from '../utils/types';

const REASONS: { label: string; icon: string }[] = [
  { label: 'Suspicious behavior', icon: 'alert-circle-outline' },
  { label: 'Inappropriate messages', icon: 'message-alert-outline' },
  { label: 'Fake profile', icon: 'account-alert-outline' },
  { label: 'Safety concern', icon: 'shield-alert-outline' },
  { label: 'Other', icon: 'dots-horizontal-circle-outline' },
];

type Props = {
  visible: boolean;
  targetType: 'ride' | 'user';
  targetId: string;
  reporterId: string;
  onDismiss: () => void;
  onSubmit: (report: Report) => void;
};

export function ReportDialog({ visible, targetType, targetId, reporterId, onDismiss, onSubmit }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setReason(null);
    setDetails('');
    setSubmitted(false);
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit({
      id: `rpt_${Date.now()}`,
      reporterId,
      targetType,
      targetId,
      reason,
      details: details.trim() || undefined,
      createdAt: Date.now(),
    });
    setSubmitted(true);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleDismiss} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={96}>
      <Card style={styles.sheet}>
        <Card.Content style={styles.content}>
          {submitted ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle" size={48} color={colors.primary} />
              <Text variant="titleMedium" style={styles.successTitle}>Report submitted</Text>
              <Text variant="bodyMedium" style={styles.muted}>
                Thanks for helping keep Sabay safe. Our team will review this.
              </Text>
              <Button mode="contained" onPress={handleDismiss} style={styles.doneBtn}>
                Done
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                  Report {targetType === 'ride' ? 'this ride' : 'this user'}
                </Text>
                <Pressable onPress={handleDismiss} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>

              <Text variant="bodySmall" style={styles.muted}>
                What went wrong? Select a reason below.
              </Text>

              <View style={styles.reasonList}>
                {REASONS.map((r) => (
                  <Pressable
                    key={r.label}
                    style={[styles.reasonRow, reason === r.label && styles.reasonRowSelected]}
                    onPress={() => setReason(r.label)}
                  >
                    <MaterialCommunityIcons
                      name={r.icon as any}
                      size={20}
                      color={reason === r.label ? colors.primary : colors.muted}
                    />
                    <Text
                      variant="bodyMedium"
                      style={[styles.reasonLabel, reason === r.label && styles.reasonLabelSelected]}
                    >
                      {r.label}
                    </Text>
                    {reason === r.label && (
                      <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>

              <TextInput
                label="Details (optional)"
                value={details}
                onChangeText={setDetails}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Tell us more about what happened..."
                dense
              />

              <View style={styles.actions}>
                <Button mode="text" onPress={handleDismiss}>Cancel</Button>
                <Button
                  mode="contained"
                  buttonColor={colors.danger}
                  disabled={!reason}
                  onPress={handleSubmit}
                >
                  Submit Report
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '85%',
  },
  content: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  reasonList: {
    gap: spacing.xs,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  reasonRowSelected: {
    backgroundColor: '#E6F3E8',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reasonLabel: {
    flex: 1,
    color: colors.text,
  },
  reasonLabelSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  successTitle: {
    fontWeight: '700',
  },
  doneBtn: {
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
});
