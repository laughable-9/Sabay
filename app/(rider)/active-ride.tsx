import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function RiderActiveRide() {
  return (
    <>
      <Stack.Screen options={{ title: 'Active Ride' }} />
      <Placeholder
        title="Active Ride"
        subtitle="Live map, passenger count, ETA, Share Location button."
        links={[
          { href: '/tracking', label: 'Preview Tracking Link' },
          { href: '/(rider)/ride-complete', label: 'End Ride' },
        ]}
      />
    </>
  );
}
