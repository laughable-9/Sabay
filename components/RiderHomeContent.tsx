import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, SegmentedButtons, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { RideCard } from './RideCard';
import { formatDepartureTime } from '../utils/format';
import { colors, spacing } from '../constants/theme';
import type { RideRequest } from '../utils/types';

type Mode = 'find' | 'requests';

export function RiderHomeContent() {
  const { state, dispatch, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('find');
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

  const myRequests = useMemo(
    () =>
      state.rideRequests
        .filter((r) => r.riderId === currentUser.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.rideRequests, currentUser.id],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as Mode)}
        buttons={[
          { value: 'find', label: 'Find Rides' },
          { value: 'requests', label: 'My Requests' },
        ]}
      />

      {mode === 'find' ? (
        <>
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
                  Try posting a request instead.
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
        </>
      ) : (
        <>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => router.push('/(rider)/post-request')}
          >
            Post Request
          </Button>
          <FlatList
            data={myRequests}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="titleMedium">No requests yet</Text>
                <Text variant="bodyMedium" style={styles.muted}>
                  Post one so drivers know you need a ride.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <RequestCard
                request={item}
                onCancel={() => dispatch({ type: 'CANCEL_REQUEST', requestId: item.id })}
              />
            )}
          />
        </>
      )}
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
          <Text variant="titleMedium">
            {request.from} → {request.to}
          </Text>
          <Chip compact style={chipStyleFor(request.status)} textStyle={chipTextStyleFor(request.status)}>
            {request.status}
          </Chip>
        </View>
        <Text variant="bodySmall" style={styles.muted}>
          {when} · {request.distanceKm} km · {request.durationMin} min
        </Text>
        {request.notes ? (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
            “{request.notes}”
          </Text>
        ) : null}
        {request.status === 'open' ? (
          <Button mode="text" compact onPress={onCancel} style={styles.cancelBtn}>
            Cancel
          </Button>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function chipStyleFor(status: RideRequest['status']) {
  if (status === 'matched') return { backgroundColor: '#E6F3E8' };
  if (status === 'cancelled') return { backgroundColor: '#F5F5F5' };
  return undefined;
}
function chipTextStyleFor(status: RideRequest['status']) {
  if (status === 'matched') return { color: colors.primary, fontWeight: '600' as const };
  return undefined;
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
  cancelBtn: {
    alignSelf: 'flex-end',
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
