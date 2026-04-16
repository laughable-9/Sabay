import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../constants/theme';

type Props = {
  uri?: string;
  firstName: string;
  size?: number;
};

const FALLBACK_COLORS = [
  '#34773D',
  '#D97706',
  '#2563EB',
  '#DB2777',
  '#7C3AED',
  '#059669',
  '#C62828',
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function Avatar({ uri, firstName, size = 40 }: Props) {
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.surface }}
        accessibilityLabel={`${firstName}'s profile photo`}
      />
    );
  }
  const bg = FALLBACK_COLORS[hashName(firstName) % FALLBACK_COLORS.length];
  const initial = firstName.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
