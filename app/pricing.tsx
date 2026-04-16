import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useApp } from '../context/AppContext';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { calculateFare, formatPHP } from '../utils/pricing';
import { aggregateGasPrices } from '../utils/gasPrice';
import { DEFAULT_FUEL_EFFICIENCY_KM_PER_L } from '../constants/config';
import { colors, spacing } from '../constants/theme';

export default function Pricing() {
  const { state } = useApp();
  const medianPrice = useMemo(
    () => aggregateGasPrices(state.gasPrices, 'unleaded').medianPrice,
    [state.gasPrices],
  );

  const [distance, setDistance] = useState(8);
  const [passengers, setPassengers] = useState(3);
  const [fuelPrice, setFuelPrice] = useState(medianPrice);

  const breakdown = useMemo(
    () =>
      calculateFare({
        distanceKm: distance,
        fuelPricePerLiter: fuelPrice,
        fuelEfficiency: DEFAULT_FUEL_EFFICIENCY_KM_PER_L,
        passengerCount: passengers,
      }),
    [distance, fuelPrice, passengers],
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Pricing Calculator' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="bodyMedium" style={styles.intro}>
          See how fares change as distance, passengers, and fuel price move. Uses the same
          transparent formula as real ride postings.
        </Text>

        <SliderRow
          label="Distance"
          value={distance}
          min={1}
          max={30}
          step={1}
          displayValue={`${distance} km`}
          onChange={setDistance}
        />

        <SliderRow
          label="Passengers"
          value={passengers}
          min={1}
          max={6}
          step={1}
          displayValue={`${passengers}`}
          onChange={setPassengers}
        />

        <SliderRow
          label="Fuel price"
          value={fuelPrice}
          min={80}
          max={150}
          step={0.5}
          displayValue={`${formatPHP(fuelPrice)}/L`}
          onChange={setFuelPrice}
        />
        <Text variant="bodySmall" style={styles.hint}>
          Current crowdsourced median: {formatPHP(medianPrice)}/L
        </Text>

        <View style={styles.resultBox}>
          <PriceBreakdown breakdown={breakdown} />
        </View>
      </ScrollView>
    </>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text variant="labelLarge">{label}</Text>
        <Text variant="bodyMedium" style={styles.value}>
          {displayValue}
        </Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: {
    color: colors.muted,
  },
  row: {
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontWeight: '600',
  },
  hint: {
    color: colors.muted,
  },
  resultBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
});
