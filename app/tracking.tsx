import { Stack } from 'expo-router';
import { Placeholder } from '../components/Placeholder';

export default function Tracking() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tracking Link' }} />
      <Placeholder
        title="Tracking Link View"
        subtitle="What a non-app user sees: map with live pin, ride info, ETA."
      />
    </>
  );
}
