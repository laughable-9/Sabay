import { Stack } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { DriverHomeContent } from '../../components/DriverHomeContent';
import { RiderHomeContent } from '../../components/RiderHomeContent';

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
      <RiderHomeContent />
    </>
  );
}
