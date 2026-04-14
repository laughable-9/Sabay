import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Searchbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { RideCard } from './RideCard';
import { formatDepartureTime } from '../utils/format';
import { colors, spacing } from '../constants/theme';
import type { RideRequest } from '../utils/types';

export function RiderHomeContent() {
  const { state, dispatch, currentUser } = useApp();
  const insets = useSafeAreaInsets();
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

  const activeRequests = useMemo(
    () =>
      state.rideRequests
        .filter((r) => r.riderId === currentUser.id && r.status === 'open')
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.rideRequests, currentUser.id],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Searchbar
        placeholder="Where are you heading?"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        data={matches}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {activeRequests.length > 0 ? (
              <View style={styles.section}>
                <Text variant="labelLarge" style={styles.sectionLabel}>
                  Your request
                </Text>
                {activeRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onCancel={() =>
                      dispatch({ type: 'CANCEL_REQUEST', requestId: req.id })
                    }
                  />
                ))}
              </View>
            ) : (
              <Button
                mode="contained-tonal"
                icon="plus"
                onPress={() => router.push('/(rider)/post-request')}
                style={styles.postBtn}
              >
                Can't find a ride? Post a request
              </Button>
            )}

            <Text variant="labelLarge" style={styles.sectionLabel}>
              {matches.length} ride{matches.length === 1 ? '' : 's'} available
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No rides match</Text>
            <Text variant="bodyMedium" style={styles.muted}>
              Try a different destination or post a request.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RideCard
            ride={item}
            onPress={() =>
              router.push({ pathname: '/(rider)/ride-details', params: { id: item.id } })
            }
          />
        )}
      />
    </View>
  );
}

function RequestCard({
  request,
  onCancel,
}: {
  request: RideRequest;
  onCancel: () => void;
}) {
  const when = formatDepartureTime(request.desiredDepartureTime);
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.rowHeader}>
          <View style={styles.rowTitle}>
            <MaterialCommunityIcons name="hand-wave" size={16} color={colors.primary} />
            <Text variant="titleMedium">
              {request.from} → {request.to}
            </Text>
          </View>
          <Chip compact>open</Chip>
        </View>
        <Text variant="bodySmall" style={styles.muted}>
          {when} · {request.distanceKm} km · waiting for a driver
        </Text>
        {request.notes ? (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
            “{request.notes}”
          </Text>
        ) : null}
        <Button mode="text" compact onPress={onCancel} style={styles.cancelBtn}>
          Cancel request
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  search: {
    backgroundColor: colors.card,
  },
  muted: {
    color: colors.muted,
  },
  notes: {
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  cancelBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  postBtn: {
    alignSelf: 'stretch',
  },
  listHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.muted,
    marginTop: spacing.xs,
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
