import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { getBackend } from '@/data/default-backend';
import { SessionProvider } from '@/ui/session';
import { t } from '@/ui/strings';
import { useTheme } from '@/ui/theme';

export default function RootLayout() {
  const c = useTheme();
  const base = useColorScheme() === 'dark' ? DarkTheme : DefaultTheme;
  const nav = { ...base, colors: { ...base.colors, background: c.background, card: c.background, text: c.text, border: c.line, primary: c.accent } };
  return (
    <SessionProvider backend={getBackend()}>
      <ThemeProvider value={nav}>
        {/* Every pushed screen has a header with a worded Back button: nobody has to know a swipe. */}
        <Stack screenOptions={{ headerBackTitle: t.back, headerShadowVisible: false, headerTintColor: c.accent, headerTitleStyle: { color: c.text }, headerStyle: { backgroundColor: c.background }, contentStyle: { backgroundColor: c.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tutorial" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
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
