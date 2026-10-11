import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, Txt } from '@/ui/components';
import { t } from '@/ui/strings';
import { useTheme } from '@/ui/theme';

const variant = String(Constants.expoConfig?.extra?.variant ?? 'development');

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Txt>{label}</Txt>
      <Txt tone="muted">{value}</Txt>
    </View>
  );
}

export default function ProfileScreen() {
  const c = useTheme();
  return (
    <Screen>
      <Txt size={28} bold accessibilityRole="header">
        {t.tabs.profile}
      </Txt>
      <Card>
        <Line label={t.profile.version} value={Constants.expoConfig?.version ?? ''} />
        <View testID="variant">
          <Line label={t.profile.variant} value={t.profile.variants[variant] ?? variant} />
        </View>
      </Card>
      <Card>
        <Line label={t.profile.privacy} value={t.profile.comingLater} />
        <Line label={t.profile.sources} value={t.profile.comingLater} />
        <Line label={t.profile.deleteAccount} value={t.profile.comingLater} />
      </Card>
      {variant !== 'production' && (
        <Link href="/self-check" asChild>
          <Pressable testID="open-self-check" accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Card>
              <Txt bold tone="accent">
                {t.profile.selfCheck}
              </Txt>
              <Txt size={14} style={{ color: c.muted }}>
                {t.profile.selfCheckHint}
              </Txt>
            </Card>
          </Pressable>
        </Link>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
});
