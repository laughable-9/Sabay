import { Stack } from 'expo-router';
import { DriverHomeContent } from '../../components/DriverHomeContent';

export default function DriverHome() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Rides' }} />
      <DriverHomeContent />
    </>
  );
}
