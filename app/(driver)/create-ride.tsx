import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function CreateRide() {
  return (
    <>
      <Stack.Screen options={{ title: 'Create Ride' }} />
      <Placeholder
        title="Create Ride"
        subtitle="From/To text inputs, seats, auto-calculated price preview."
        links={[{ href: '/(driver)/active-ride', label: 'Post Ride' }]}
      />
    </>
  );
}
