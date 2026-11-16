import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { getBackend } from '@/data/default-backend';
import { SessionProvider } from '@/ui/session';
import { t } from '@/ui/strings';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return (
    <SessionProvider backend={getBackend()}>
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackTitle: t.back }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="self-check" options={{ title: t.selfCheck.title, headerBackTitle: t.tabs.profile }} />
        <Stack.Screen name="account/sign-up" options={{ title: t.account.createTitle }} />
        <Stack.Screen name="account/sign-in" options={{ title: t.account.signInTitle }} />
        <Stack.Screen name="account/forgot" options={{ title: t.account.forgotTitle }} />
        <Stack.Screen name="account/name" options={{ title: t.account.editName }} />
        <Stack.Screen name="account/delete" options={{ title: t.account.deleteTitle }} />
        <Stack.Screen name="account/needed" options={{ title: t.account.neededTitle, presentation: 'modal' }} />
        <Stack.Screen name="group/[id]" options={{ title: t.group.title }} />
        <Stack.Screen name="group/join" options={{ title: t.group.joinTitle }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </SessionProvider>
  );
}
