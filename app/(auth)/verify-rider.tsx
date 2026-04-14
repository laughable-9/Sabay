import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function VerifyRider() {
  return (
    <>
      <Stack.Screen options={{ title: 'Rider Verification' }} />
      <Placeholder
        title="Rider Verification"
        subtitle="Upload ID photo + selfie, agree to terms."
        links={[{ href: '/verify-pending', label: 'Submit' }]}
      />
    </>
  );
}
