import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { t } from '@/ui/strings';
import { useTheme } from '@/ui/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const icon = (name: IconName) => {
  const TabIcon = ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color} size={size} />;
  return TabIcon;
};

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line },
      }}>
      <Tabs.Screen name="index" options={{ title: t.tabs.today, tabBarIcon: icon('today-outline'), tabBarButtonTestID: 'tab-today' }} />
      <Tabs.Screen name="plan" options={{ title: t.tabs.plan, tabBarIcon: icon('list-outline'), tabBarButtonTestID: 'tab-plan' }} />
      <Tabs.Screen name="profile" options={{ title: t.tabs.profile, tabBarIcon: icon('person-outline'), tabBarButtonTestID: 'tab-profile' }} />
    </Tabs>
  );
}
