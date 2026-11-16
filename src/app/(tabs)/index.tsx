import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { shortDate } from '@/core/time';
import { isNow } from '@/core/trip-plan';
import { Badge, Card, Divider, GapLine, HeroCard, PlanRow, Screen, SectionLabel, Title, Txt, planRowWhen } from '@/ui/components';
import { countdownText } from '@/ui/countdown';
import { Fill, Pulse } from '@/ui/motion';
import { t } from '@/ui/strings';
import { size, useTheme } from '@/ui/theme';
import { useSamplePlan } from '@/ui/use-sample-plan';

/** Hours, minutes and seconds to a moment, ticking. It is information, so it runs even with Reduce Motion on. */
function Countdown({ to, label, onDone }: { to: number; label: string; onDone: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const text = countdownText(to - now);
  // At zero the screen is told at once, so the card moves on with the countdown instead of up to 30 seconds later.
  const over = !text;
  useEffect(() => {
    if (over) onDone();
  }, [over, onDone]);
  if (!text) return null;
  return (
    <View>
      <Txt testID="countdown" size={size.title} tone="gold" style={styles.digits}>
        {text}
      </Txt>
      <Txt size={size.small} tone="onHeroMuted">
        {label}
      </Txt>
    </View>
  );
}

/** A quiet skyline in the corner of the green card: two minarets and the buildings between. Decoration only. */
function Skyline({ colour }: { colour: string }) {
  const block = (width: number, height: number) => <View style={{ width, height, backgroundColor: colour }} />;
  const minaret = (height: number) => (
    <View style={styles.minaret}>
      <View style={[styles.spire, { borderBottomColor: colour }]} />
      {block(7, height)}
    </View>
  );
  return (
    <View style={styles.skyline} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {minaret(62)}
      {block(22, 30)}
      {block(46, 50)}
      {block(24, 34)}
      {minaret(54)}
    </View>
  );
}

export default function TodayScreen() {
  const c = useTheme();
  const { plan, now, summary, refresh } = useSamplePlan();
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
            <Skyline colour={c.onHero} />
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
                <View style={styles.nowLine}>
                  {current ? <Pulse colour={c.gold} /> : null}
                  <Txt size={size.small} tone="onHeroMuted">
                    {current ? t.today.happeningNow : t.today.nextUp}
                  </Txt>
                </View>
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
            {current?.until ? (
              <Countdown key="end" to={current.until} label={t.today.untilEnd} onDone={refresh} />
            ) : focus?.at ? (
              <Countdown key="start" to={focus.at} label={t.today.untilStart} onDone={refresh} />
            ) : null}
            <Fill fraction={day.n / total} colour={c.gold} track={c.heroTrack} label={t.today.dayOf(day.n, total)} />
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
  nowLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  digits: { fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  skyline: { position: 'absolute', right: 14, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 3, opacity: 0.12 },
  minaret: { alignItems: 'center' },
  spire: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  section: { gap: 10 },
  note: { textAlign: 'center' },
});
