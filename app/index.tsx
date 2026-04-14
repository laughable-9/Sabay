import { Image, StyleSheet, View } from 'react-native';
import { Stack, Link } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';

export default function Splash() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="displaySmall" style={styles.wordmark}>
            Sabay
          </Text>
          <Text variant="bodyLarge" style={styles.tagline}>
            Carpool with Baguio.
          </Text>
        </View>

        <View style={styles.actions}>
          <Link href="/signup" asChild>
            <Button mode="contained" contentStyle={styles.primaryContent}>
              Get Started
            </Button>
          </Link>
          <Text variant="bodySmall" style={styles.footnote}>
            Sign up with a photo and your GCash number — takes a few seconds.
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
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 160,
    height: 160,
  },
  wordmark: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  tagline: {
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryContent: {
    paddingVertical: spacing.xs,
  },
  footnote: {
    color: colors.muted,
    textAlign: 'center',
  },
});
