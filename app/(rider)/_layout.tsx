import { Stack } from 'expo-router';
import { theme } from '../../constants/theme';

export default function RiderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Find a Ride' }} />
      <Stack.Screen name="post-request" options={{ title: 'Post a Request' }} />
      <Stack.Screen name="ride-details" options={{ title: 'Ride Details' }} />
      <Stack.Screen
        name="active-ride"
        options={{ title: 'Your Ride', headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="ride-complete" options={{ title: 'Ride Complete', headerBackVisible: false }} />
    </Stack>
  );
}
