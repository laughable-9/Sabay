import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, RadioButton, Text, TextInput } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';
import type { Report } from '../utils/types';

const REASONS = [
  'Suspicious behavior',
  'Inappropriate messages',
  'Fake profile',
  'Safety concern',
  'Other',
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
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');

  const reset = () => {
    setReason(REASONS[0]);
    setDetails('');
  };

  return (
    <Dialog visible={visible} onDismiss={() => { reset(); onDismiss(); }}>
      <Dialog.Title>Report {targetType === 'ride' ? 'this ride' : 'this user'}</Dialog.Title>
      <Dialog.Content style={styles.content}>
        <Text variant="bodySmall" style={styles.muted}>
          Select a reason for your report. Our team will review it.
        </Text>
        <RadioButton.Group value={reason} onValueChange={setReason}>
          {REASONS.map((r) => (
            <View key={r} style={styles.radioRow}>
              <RadioButton value={r} />
              <Text variant="bodyMedium" style={styles.radioLabel}>{r}</Text>
            </View>
          ))}
        </RadioButton.Group>
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
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => { reset(); onDismiss(); }}>Cancel</Button>
        <Button
          mode="contained"
          buttonColor={colors.danger}
          onPress={() => {
            onSubmit({
              id: `rpt_${Date.now()}`,
              reporterId,
              targetType,
              targetId,
              reason,
              details: details.trim() || undefined,
              createdAt: Date.now(),
            });
            reset();
          }}
        >
          Submit Report
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  muted: {
    color: colors.muted,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    flex: 1,
  },
});
