import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { t } from '@/ui/strings';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="self-check" options={{ title: t.selfCheck.title, headerBackTitle: t.tabs.profile }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
