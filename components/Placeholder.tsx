import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Link } from 'expo-router';
import { colors, spacing } from '../constants/theme';

type NavLink = { href: string; label: string };

type Props = {
  title: string;
  subtitle?: string;
  links?: NavLink[];
};

export function Placeholder({ title, subtitle, links = [] }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      <View style={styles.links}>
        {links.map((l) => (
          <Link key={l.href} href={l.href as never} asChild>
            <Button mode="outlined" style={styles.link}>
              {l.label}
            </Button>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
  },
  links: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  link: {
    alignSelf: 'flex-start',
  },
});
