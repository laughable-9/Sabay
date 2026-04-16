import { Stack } from 'expo-router';
import { RiderHomeContent } from '../../components/RiderHomeContent';

export default function RiderHome() {
  return (
    <>
      <Stack.Screen options={{ title: 'Find a Ride' }} />
      <RiderHomeContent />
    </>
  );
}
