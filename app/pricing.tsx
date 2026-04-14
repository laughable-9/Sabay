import { Stack } from 'expo-router';
import { Placeholder } from '../components/Placeholder';

export default function Pricing() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pricing Calculator' }} />
      <Placeholder
        title="Pricing Calculator"
        subtitle="Sliders for distance / passengers / fuel price. Live fare compute."
      />
    </>
  );
}
