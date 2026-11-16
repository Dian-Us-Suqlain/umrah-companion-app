import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { shortDate } from '@/core/time';
import { isPast } from '@/core/trip-plan';
import { Badge, Card, Divider, GapLine, NowLine, PlanRow, Screen, SectionLabel, Title, Txt } from '@/ui/components';
import { Pulse } from '@/ui/motion';
import { t } from '@/ui/strings';
import { useTheme } from '@/ui/theme';
import { useSamplePlan } from '@/ui/use-sample-plan';

export default function PlanScreen() {
  const c = useTheme();
  const { plan, now } = useSamplePlan();
  const first = plan.days[0];
  const last = plan.days[plan.days.length - 1];
  return (
    <Screen>
      <Title above={first ? t.plan.range(shortDate(first.date), shortDate(last.date), plan.days.length) : undefined} right={<Badge text={t.sampleTrip} />}>
        {t.tabs.plan}
      </Title>
      {plan.days.map((day) => {
        const isToday = day.date === now.today;
        // the Now line sits before the first thing that has not passed; after everything when the day is over
        const firstAhead = day.rows.findIndex((r) => r.status !== 'cancelled' && !isPast(r, now));
        const nowAt = firstAhead === -1 ? day.rows.length : firstAhead;
        return (
          <View key={day.date} style={styles.leg}>
            {/* The journey line: a filled mark for days passed, a pulsing one for today, a hollow one for days to come. */}
            <View style={styles.rail}>
              {day !== last ? <View style={[styles.line, { backgroundColor: day.date < now.today ? c.accent : c.line }]} /> : null}
              {isToday ? (
                <View testID="journey-today" style={[styles.mark, { backgroundColor: c.card, borderColor: c.goldText }]}>
                  <Pulse colour={c.goldText} size={8} />
                </View>
              ) : (
                <View testID={day.date < now.today ? 'journey-done' : 'journey-ahead'} style={[styles.mark, { backgroundColor: day.date < now.today ? c.accent : c.card, borderColor: day.date < now.today ? c.accent : c.line }]} />
              )}
            </View>
          <View style={[styles.day, { opacity: day.date < now.today ? 0.6 : 1 }]} testID={isToday ? 'plan-today' : undefined}>
            <View style={styles.dayHead}>
              <SectionLabel tone={isToday ? 'accent' : 'muted'}>
                {t.day(day.n).toUpperCase()} · {shortDate(day.date).toUpperCase()} · {day.city}
              </SectionLabel>
              {isToday ? <Badge tone="accent" text={t.tabs.today.toUpperCase()} /> : null}
            </View>
            <Card highlight={isToday} tight>
              {day.gaps.map((g) => (
                <View key={g.text} style={styles.gap}>
                  <GapLine gap={g} />
                </View>
              ))}
              {day.rows.length === 0 && (
                <Txt tone="muted" style={styles.empty}>
                  {t.noPlans}
                </Txt>
              )}
              {day.rows.map((r, i) => (
                <Fragment key={r.type + r.id}>
                  {isToday && i === nowAt ? <NowLine /> : i > 0 ? <Divider /> : null}
                  <PlanRow row={r} now={now} />
                </Fragment>
              ))}
              {isToday && nowAt === day.rows.length && <NowLine />}
            </Card>
          </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  leg: { flexDirection: 'row', gap: 12 },
  rail: { width: 18, alignItems: 'center' },
  line: { position: 'absolute', top: 10, bottom: -26, width: 3, borderRadius: 2 },
  mark: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  day: { flex: 1, gap: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gap: { paddingVertical: 8 },
  empty: { paddingVertical: 14 },
});
