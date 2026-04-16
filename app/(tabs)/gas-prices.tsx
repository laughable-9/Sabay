import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { aggregateGasPrices } from '../../utils/gasPrice';
import { formatPHP } from '../../utils/pricing';
import { colors, spacing } from '../../constants/theme';
import { hapticSuccess } from '../../utils/haptics';
import type { FuelType, GasPriceSubmission } from '../../utils/types';

const FUEL_OPTIONS: Array<{ value: FuelType; label: string }> = [
  { value: 'unleaded', label: 'Unleaded' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'premium', label: 'Premium' },
];

const TREND_ICON = {
  up: { name: 'trending-up' as const, color: colors.danger },
  down: { name: 'trending-down' as const, color: colors.success },
  stable: { name: 'trending-neutral' as const, color: colors.muted },
};

export default function GasPrices() {
  const { state, currentUser, dispatch } = useApp();
  const insets = useSafeAreaInsets();
  const [fuelType, setFuelType] = useState<FuelType>('unleaded');
  const [dialogOpen, setDialogOpen] = useState(false);

  const aggregate = useMemo(
    () => aggregateGasPrices(state.gasPrices, fuelType),
    [state.gasPrices, fuelType],
  );

  const recent = useMemo(
    () =>
      state.gasPrices
        .filter((s) => s.fuelType === fuelType)
        .sort((a, b) => b.submittedAt - a.submittedAt)
        .slice(0, 12),
    [state.gasPrices, fuelType],
  );

  const trendIcon = TREND_ICON[aggregate.trend];

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <SegmentedButtons
          value={fuelType}
          onValueChange={(v) => setFuelType(v as FuelType)}
          buttons={FUEL_OPTIONS}
        />

        <Card style={styles.hero}>
          <Card.Content>
            <View style={styles.heroHeader}>
              <Text variant="labelLarge" style={styles.muted}>
                Community median
              </Text>
              <View style={styles.trendPill}>
                <MaterialCommunityIcons name={trendIcon.name} color={trendIcon.color} size={16} />
                <Text variant="labelSmall" style={{ color: trendIcon.color, fontWeight: '700' }}>
                  {aggregate.trend === 'up' ? 'Up' : aggregate.trend === 'down' ? 'Down' : 'Stable'} vs last week
                </Text>
              </View>
            </View>
            <Text variant="displaySmall" style={styles.price}>
              {formatPHP(aggregate.medianPrice)}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              per liter · {aggregate.usingFallback ? 'fallback default' : 'crowdsourced'}
            </Text>
            <View style={styles.statsRow}>
              <Stat label="Range" value={`${formatPHP(aggregate.minPrice)} – ${formatPHP(aggregate.maxPrice)}`} />
              <Stat label="Reports" value={`${aggregate.reportCount} this week`} />
            </View>
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={[styles.muted, styles.sectionLabel]}>
          Recent submissions
        </Text>
        <FlatList
          data={recent}
          keyExtractor={(s) => s.id}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text variant="bodyMedium" style={styles.muted}>
              No submissions yet for {fuelType}.
            </Text>
          }
          renderItem={({ item }) => <SubmissionRow submission={item} />}
        />

        <Button mode="contained" icon="plus" onPress={() => setDialogOpen(true)}>
          Submit Price
        </Button>
      </View>

      <Portal>
        <SubmitDialog
          visible={dialogOpen}
          defaultFuelType={fuelType}
          onDismiss={() => setDialogOpen(false)}
          onSubmit={(submission) => {
            hapticSuccess();
            dispatch({ type: 'SUBMIT_GAS_PRICE', submission });
            setDialogOpen(false);
          }}
          submittedByUserId={currentUser.id}
        />
      </Portal>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="bodySmall" style={styles.muted}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function SubmissionRow({ submission }: { submission: GasPriceSubmission }) {
  const when = timeAgo(submission.submittedAt);
  return (
    <Card style={styles.row}>
      <Card.Content style={styles.rowContent}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{formatPHP(submission.pricePerLiter)}/L</Text>
          <Text variant="bodySmall" style={styles.muted}>
            {submission.stationName ?? 'Unspecified station'} · {when}
          </Text>
        </View>
        {submission.isOutlier ? (
          <Text variant="labelSmall" style={styles.outlier}>
            flagged
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function SubmitDialog({
  visible,
  defaultFuelType,
  onDismiss,
  onSubmit,
  submittedByUserId,
}: {
  visible: boolean;
  defaultFuelType: FuelType;
  onDismiss: () => void;
  onSubmit: (s: GasPriceSubmission) => void;
  submittedByUserId: string;
}) {
  const [fuelType, setFuelType] = useState<FuelType>(defaultFuelType);
  const [price, setPrice] = useState('');
  const [station, setStation] = useState('');

  const priceNum = Number(price);
  const canSubmit = Number.isFinite(priceNum) && priceNum >= 10 && priceNum <= 200;

  const reset = () => {
    setPrice('');
    setStation('');
    setFuelType(defaultFuelType);
  };

  return (
    <Dialog visible={visible} onDismiss={() => { reset(); onDismiss(); }}>
      <Dialog.Title>Submit Gas Price</Dialog.Title>
      <Dialog.Content style={{ gap: spacing.md }}>
        <SegmentedButtons
          value={fuelType}
          onValueChange={(v) => setFuelType(v as FuelType)}
          buttons={FUEL_OPTIONS}
        />
        <TextInput
          label="Price per liter (PHP)"
          value={price}
          onChangeText={setPrice}
          mode="outlined"
          keyboardType="decimal-pad"
          placeholder="65.50"
        />
        <TextInput
          label="Station (optional)"
          value={station}
          onChangeText={setStation}
          mode="outlined"
          placeholder="Shell Session Road"
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => { reset(); onDismiss(); }}>Cancel</Button>
        <Button
          mode="contained"
          disabled={!canSubmit}
          onPress={() => {
            onSubmit({
              id: `g_${Date.now()}`,
              fuelType,
              pricePerLiter: priceNum,
              stationName: station.trim() || undefined,
              submittedAt: Date.now(),
              submittedByUserId,
              isOutlier: false,
            });
            reset();
          }}
        >
          Submit
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.card,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    gap: 2,
  },
  statValue: {
    fontWeight: '600',
  },
  sectionLabel: {
    marginTop: spacing.sm,
  },
  list: {
    paddingBottom: spacing.sm,
  },
  row: {
    backgroundColor: colors.card,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  muted: {
    color: colors.muted,
  },
  outlier: {
    color: colors.warning,
    fontWeight: '700',
  },
});
