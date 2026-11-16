import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { useSession } from '@/ui/session';
import { t } from '@/ui/strings';
import { size, useTheme } from '@/ui/theme';
import { markTutorialSeen, tutorialDecision, tutorialSeen } from '@/ui/tutorial';

type IconName = keyof typeof Ionicons.glyphMap;
const icon = (name: IconName) => {
  const TabIcon = ({ color }: { color: ColorValue }) => <Ionicons name={name} color={color} size={24} />;
  return TabIcon;
};

export default function TabsLayout() {
  const c = useTheme();
  const { ready, user } = useSession();
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    void tutorialSeen().then(setSeen);
  }, []);

  const decision = tutorialDecision(seen, ready, !!user);
  // Someone already signed in is never shown the tutorial, now or after signing out.
  useEffect(() => {
    if (decision === 'skip' && seen === false) void markTutorialSeen();
  }, [decision, seen]);
  if (decision === 'show') return <Redirect href="/tutorial" />;

  return (
    <View style={styles.fill}>
      {/* Four tabs, always visible, each an icon with its word. */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.muted,
          tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line },
          tabBarLabelStyle: { fontSize: size.label, fontWeight: '600' },
          sceneStyle: { backgroundColor: c.background },
        }}>
        <Tabs.Screen name="index" options={{ title: t.tabs.today, tabBarIcon: icon('sunny-outline'), tabBarButtonTestID: 'tab-today' }} />
        <Tabs.Screen name="plan" options={{ title: t.tabs.plan, tabBarIcon: icon('calendar-outline'), tabBarButtonTestID: 'tab-plan' }} />
        <Tabs.Screen name="group" options={{ title: t.tabs.group, tabBarIcon: icon('people-outline'), tabBarButtonTestID: 'tab-group' }} />
        <Tabs.Screen name="profile" options={{ title: t.tabs.profile, tabBarIcon: icon('person-outline'), tabBarButtonTestID: 'tab-profile' }} />
      </Tabs>
      {/* Until the phone has said whether the tutorial was seen, show plain paper, not a flash of Today. */}
      {decision === 'wait' ? <View testID="starting" style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
