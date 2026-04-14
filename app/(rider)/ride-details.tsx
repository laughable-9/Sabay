import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function RideDetails() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ride Details' }} />
      <Placeholder
        title="Ride Details"
        subtitle="Driver info, route summary, price breakdown, Join button."
        links={[{ href: '/(rider)/active-ride', label: 'Join Ride' }]}
      />
    </>
  );
}
