import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function VerifyPending() {
  return (
    <>
      <Stack.Screen options={{ title: 'Verification Pending' }} />
      <Placeholder
        title="Verification Pending"
        subtitle="Review in progress. Demo auto-approves after a short delay."
        links={[
          { href: '/(rider)/home', label: 'Go to Rider Home' },
          { href: '/(driver)/home', label: 'Go to Driver Home' },
        ]}
      />
    </>
  );
}
