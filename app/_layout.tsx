import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants/theme';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: true,
              headerBackTitle: '',
              headerBackButtonDisplayMode: 'minimal',
              headerShadowVisible: false,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          />
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
