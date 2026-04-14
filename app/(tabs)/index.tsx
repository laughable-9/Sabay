import { Stack } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Placeholder } from '../../components/Placeholder';

export default function TabsHome() {
  const { state, currentUser } = useApp();

  if (state.role === 'driver') {
    return (
      <>
        <Stack.Screen options={{ title: 'Driver' }} />
        <Placeholder
          title="Driver Home"
          subtitle={`Hi ${currentUser.firstName}. Post a ride or manage active ones.`}
          links={[
            { href: '/(driver)/create-ride', label: 'Create Ride' },
            { href: '/(driver)/home', label: 'My Rides' },
          ]}
        />
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
