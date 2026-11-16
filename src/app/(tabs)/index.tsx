import { StyleSheet, View } from 'react-native';

import { shortDate } from '@/core/time';
import { isNow } from '@/core/trip-plan';
import { Badge, Card, Divider, GapLine, HeroCard, PlanRow, Screen, SectionLabel, Title, Txt, planRowWhen } from '@/ui/components';
import { t } from '@/ui/strings';
import { size, useTheme } from '@/ui/theme';
import { useSamplePlan } from '@/ui/use-sample-plan';

export default function TodayScreen() {
  const c = useTheme();
  const { plan, now, summary } = useSamplePlan();
  const { day, ahead, tomorrow, later } = summary;
  // The green card answers one question: what is happening now, or else what is next.
  const current = ahead.find((r) => isNow(r, now));
  const focus = current ?? ahead.find((r) => r.status !== 'cancelled');
  const rest = ahead.filter((r) => r !== focus);
  const total = plan.days.length;

  return (
    <Screen>
      <Title above={shortDate(now.today)} right={<Badge text={t.sampleTrip} />}>
        {t.tabs.today}
      </Title>
      {!day ? (
        <Card>
          <Txt tone="muted">{t.today.notInTrip}</Txt>
        </Card>
      ) : (
        <>
          <HeroCard testID="today-card">
            <View style={styles.heroTop}>
              <Txt size={size.label} bold tone="gold" style={styles.caps}>
                {t.day(day.n).toUpperCase()} · {shortDate(day.date).toUpperCase()}
              </Txt>
              <Txt size={size.small} tone="onHeroMuted">
                {day.city}
              </Txt>
            </View>
            {focus ? (
              <View style={styles.focus}>
                <Txt size={size.small} tone="onHeroMuted">
                  {current ? t.today.happeningNow : t.today.nextUp}
                </Txt>
                <Txt size={size.heading} tone="onHero" style={styles.heavy}>
                  {focus.title}
                </Txt>
                <Txt tone="onHeroMuted">{[planRowWhen(focus), focus.note, focus.who.join(', ')].filter(Boolean).join(' · ')}</Txt>
              </View>
            ) : (
              <Txt size={size.large} tone="onHero">
                {t.today.nothingLeft}
              </Txt>
            )}
            <View style={[styles.track, { backgroundColor: c.heroTrack }]} accessible accessibilityRole="progressbar" accessibilityLabel={t.today.dayOf(day.n, total)}>
              <View style={[styles.done, { backgroundColor: c.gold, width: `${Math.round((day.n / total) * 100)}%` }]} />
            </View>
          </HeroCard>
          {day.gaps.map((g) => (
            <GapLine key={g.text} gap={g} />
          ))}
          {rest.length > 0 && (
            <View style={styles.section}>
              <SectionLabel>{t.today.next}</SectionLabel>
              <Card tight>
                {rest.map((r, i) => (
                  <View key={r.type + r.id}>
                    {i > 0 && <Divider />}
                    <PlanRow row={r} now={now} />
                  </View>
                ))}
              </Card>
            </View>
          )}
        </>
      )}
      {tomorrow ? (
        <View style={styles.section}>
          <SectionLabel>{t.today.tomorrow}</SectionLabel>
          <Card tight>
            <PlanRow row={tomorrow} now={now} />
          </Card>
        </View>
      ) : later ? (
        <View style={styles.section}>
          <SectionLabel>{t.today.later(shortDate(later.day.date))}</SectionLabel>
          <Card tight>
            <PlanRow row={later.row} now={now} />
          </Card>
        </View>
      ) : null}
      <Txt size={size.small} tone="muted" style={styles.note}>
        {t.sampleNote}
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  caps: { letterSpacing: 0.8 },
  focus: { gap: 4 },
  heavy: { fontWeight: '700' },
  track: { height: 6, borderRadius: 3 },
  done: { height: 6, borderRadius: 3 },
  section: { gap: 10 },
  note: { textAlign: 'center' },
});
