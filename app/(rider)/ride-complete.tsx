import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function RiderRideComplete() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ride Complete' }} />
      <Placeholder
        title="Ride Complete"
        subtitle="Fare summary, rate driver, trip stats (distance, CO2 saved)."
        links={[{ href: '/(rider)/home', label: 'Back to Home' }]}
      />
    </>
  );
}
