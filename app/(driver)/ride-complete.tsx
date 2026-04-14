import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function DriverRideComplete() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ride Complete' }} />
      <Placeholder
        title="Ride Complete (Driver)"
        subtitle="Earnings summary, fare breakdown per passenger, rate riders."
        links={[{ href: '/(driver)/home', label: 'Back to Dashboard' }]}
      />
    </>
  );
}
