import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function RiderHome() {
  return (
    <>
      <Stack.Screen options={{ title: 'Find a Ride' }} />
      <Placeholder
        title="Rider Home"
        subtitle="Search destination, browse matching rides."
        links={[{ href: '/(rider)/ride-details', label: 'Open a Ride' }]}
      />
    </>
  );
}
