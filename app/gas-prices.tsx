import { Stack } from 'expo-router';
import { Placeholder } from '../components/Placeholder';

export default function GasPrices() {
  return (
    <>
      <Stack.Screen options={{ title: 'Gas Price Hub' }} />
      <Placeholder
        title="Gas Price Hub"
        subtitle="Crowdsourced fuel prices — median, range, recent submissions."
      />
    </>
  );
}
