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
          { href: '/signup', label: 'Sign Up' },
          { href: '/(rider)/home', label: 'Rider Home' },
          { href: '/(driver)/home', label: 'Driver Home' },
          { href: '/pricing', label: 'Pricing Calculator' },
          { href: '/gas-prices', label: 'Gas Price Hub' },
          { href: '/tracking', label: 'Tracking Link View' },
          { href: '/profile', label: 'Profile' },
        ]}
      />
    </>
  );
}
