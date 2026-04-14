import { Redirect, Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { colors } from '../../constants/theme';

export default function TabsLayout() {
  const { state } = useApp();

  // Lock users into the ride flow (Grab/Uber style): while there's an active
  // ride, any tab visit bounces to /chat so they can't wander away from the trip.
  if (state.activeRideId) {
    return <Redirect href={{ pathname: '/chat', params: { id: state.activeRideId } }} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.surface,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="gas-prices"
        options={{
          title: 'Gas Prices',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gas-station" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
