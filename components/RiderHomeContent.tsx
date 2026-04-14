import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Searchbar, Text } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { RideCard } from './RideCard';
import { colors, spacing } from '../constants/theme';

export function RiderHomeContent() {
  const { state, currentUser } = useApp();
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.rides
      .filter((r) => r.driverId !== currentUser.id)
      .filter((r) => r.status === 'open')
      .filter((r) => r.passengers.length < r.totalSeats)
      .filter((r) => {
        if (!q) return true;
        return (
          r.to.toLowerCase().includes(q) ||
          r.from.toLowerCase().includes(q) ||
          r.driverFirstName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.departureTime - b.departureTime);
  }, [state.rides, currentUser.id, query]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search destination"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <Text variant="bodySmall" style={styles.muted}>
        {matches.length} ride{matches.length === 1 ? '' : 's'} available
      </Text>
      <FlatList
        data={matches}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No rides match</Text>
            <Text variant="bodyMedium" style={styles.muted}>
              Try a different destination.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RideCard
            ride={item}
            onPress={() => router.push({ pathname: '/(rider)/ride-details', params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  search: {
    backgroundColor: colors.surface,
  },
  muted: {
    color: colors.muted,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
});
