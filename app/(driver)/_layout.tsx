import { Stack } from 'expo-router';
import { theme } from '../../constants/theme';

export default function DriverLayout() {
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
      <Stack.Screen name="home" options={{ title: 'My Rides' }} />
      <Stack.Screen name="create-ride" options={{ title: 'Create Ride' }} />
      <Stack.Screen
        name="active-ride"
        options={{ title: 'Driving', headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="ride-complete" options={{ title: 'Ride Complete', headerBackVisible: false }} />
    </Stack>
  );
}
