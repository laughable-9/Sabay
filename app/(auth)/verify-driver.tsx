import { Stack } from 'expo-router';
import { Placeholder } from '../../components/Placeholder';

export default function VerifyDriver() {
  return (
    <>
      <Stack.Screen options={{ title: 'Driver Verification' }} />
      <Placeholder
        title="Driver Verification"
        subtitle="Rider requirements + driver's license, vehicle info, OR/CR."
        links={[{ href: '/verify-pending', label: 'Submit' }]}
      />
    </>
  );
}
