import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function DriverActiveRide() {
  return (
    <>
      <Stack.Screen options={{ title: 'Active Ride' }} />
      <Placeholder
        title="Active Ride (Driver)"
        subtitle="Passenger list, Confirm Pickup buttons, navigation, End Ride."
        links={[{ href: '/(driver)/ride-complete', label: 'End Ride' }]}
      />
    </>
  );
}
