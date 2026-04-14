import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function Signup() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sign Up' }} />
      <Placeholder
        title="Sign Up"
        subtitle="Account creation — name, phone, email, password, role selection."
        links={[
          { href: '/verify-rider', label: 'Continue as Rider' },
          { href: '/verify-driver', label: 'Continue as Driver' },
        ]}
      />
    </>
  );
}
