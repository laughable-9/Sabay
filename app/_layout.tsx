import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: true }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
