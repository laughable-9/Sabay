import { Stack } from 'expo-router';
import { Placeholder } from '../components/Placeholder';

export default function Profile() {
  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <Placeholder
        title="Profile"
        subtitle="User info, ride history, verification status, safety settings."
      />
    </>
  );
}
