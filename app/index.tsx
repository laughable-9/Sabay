import { Stack } from 'expo-router';
import { Placeholder } from '../components/Placeholder';

export default function Splash() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sabay' }} />
      <Placeholder
        title="Sabay"
        subtitle="A carpool platform for Baguio City commuters."
        links={[
          { href: '/(tabs)', label: 'Get Started' },
          { href: '/signup', label: 'Sign Up (shell)' },
        ]}
      />
    </>
  );
}
