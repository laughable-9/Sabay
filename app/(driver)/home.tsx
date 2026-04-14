import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function DriverHome() {
  return (
    <>
      <Stack.Screen options={{ title: 'Driver Dashboard' }} />
      <Placeholder
        title="Driver Home"
        subtitle="Online/offline toggle, active rides, Create Ride entry point."
        links={[{ href: '/(driver)/create-ride', label: 'Create Ride' }]}
      />
    </>
  );
}
