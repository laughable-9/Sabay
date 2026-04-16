import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';

const TIPS = [
  'Meet at PUBLIC, well-known landmarks (Burnham Park, Session Road, SM City, school gates).',
  'Tell a friend or family member where you're going and who you're riding with.',
  'Never share your exact home address with someone you just matched with.',
];

export function SafetyTips({ compact }: { compact?: boolean }) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <MaterialCommunityIcons name="shield-check" size={16} color={colors.warning} />
        <Text variant="labelMedium" style={styles.title}>
          Safety reminders
        </Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.warning}
        />
      </Pressable>
      {expanded && (
        <View style={styles.tips}>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text variant="bodySmall" style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    flex: 1,
    color: '#6D4C00',
    fontWeight: '700',
  },
  tips: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bullet: {
    color: '#6D4C00',
    lineHeight: 18,
  },
  tipText: {
    flex: 1,
    color: '#6D4C00',
    lineHeight: 18,
  },
});
