import { StyleSheet, View } from 'react-native';
import { Stack, Link } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';

export default function Splash() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>S</Text>
          </View>
          <Text variant="displaySmall" style={styles.wordmark}>
            Sabay
          </Text>
          <Text variant="bodyLarge" style={styles.tagline}>
            Carpool with Baguio, split fair by the tank.
          </Text>
        </View>

        <View style={styles.actions}>
          <Link href="/(tabs)" asChild>
            <Button
              mode="contained"
              buttonColor="#FFFFFF"
              textColor={colors.primary}
              contentStyle={styles.primaryContent}
            >
              Get Started
            </Button>
          </Link>
          <Link href="/signup" asChild>
            <Button mode="text" textColor="#FFFFFF">
              Sign Up (demo shell)
            </Button>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
    width: 104,
    height: 104,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMark: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  wordmark: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  tagline: {
    color: '#EAF4EA',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryContent: {
    paddingVertical: spacing.xs,
  },
});
