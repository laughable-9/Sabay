import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';

const AUTO_APPROVE_MS = 2500;

export default function VerifyPending() {
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const approveTimer = setTimeout(() => setApproved(true), AUTO_APPROVE_MS);
    const routeTimer = setTimeout(() => {
      router.replace('/(tabs)');
    }, AUTO_APPROVE_MS + 900);
    return () => {
      clearTimeout(approveTimer);
      clearTimeout(routeTimer);
    };
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackVisible: false }} />
      <View style={styles.container}>
        <View style={styles.hero}>
          {approved ? (
            <MaterialCommunityIcons
              name="check-decagram"
              size={72}
              color={colors.success}
            />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
          <Text variant="headlineSmall" style={styles.title}>
            {approved ? "You're verified" : 'Reviewing your documents'}
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {approved
              ? 'Welcome to Sabay. Opening your dashboard…'
              : 'This usually takes a few seconds. Hang tight.'}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  muted: {
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
