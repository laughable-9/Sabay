import { Stack } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Placeholder } from '../../components/Placeholder';
import { DriverHomeContent } from '../../components/DriverHomeContent';

export default function TabsHome() {
  const { state } = useApp();

  if (state.role === 'driver') {
    return (
      <>
        <Stack.Screen options={{ title: 'Driver' }} />
        <DriverHomeContent />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Find a Ride' }} />
      <Placeholder
        title="Rider Home"
        subtitle="Search for a destination to find a carpool."
        links={[{ href: '/(rider)/home', label: 'Browse Rides' }]}
      />
    </>
  );
}
