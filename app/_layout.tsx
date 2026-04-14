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
          <Stack screenOptions={{ headerShown: true }} />
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
