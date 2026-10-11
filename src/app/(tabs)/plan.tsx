import { Fragment } from 'react';
import { View } from 'react-native';

import { shortDate } from '@/core/time';
import { isPast } from '@/core/trip-plan';
import { Card, GapLine, NowLine, PlanRow, SampleBanner, Screen, Txt } from '@/ui/components';
import { t } from '@/ui/strings';
import { useSamplePlan } from '@/ui/use-sample-plan';

export default function PlanScreen() {
  const { plan, now } = useSamplePlan();
  return (
    <Screen>
      <Txt size={28} bold accessibilityRole="header">
        {t.tabs.plan}
      </Txt>
      <SampleBanner />
      {plan.days.map((day) => {
        const isToday = day.date === now.today;
        // the Now line sits before the first thing that has not passed; after everything when the day is over
        const firstAhead = day.rows.findIndex((r) => r.status !== 'cancelled' && !isPast(r, now));
        const nowAt = firstAhead === -1 ? day.rows.length : firstAhead;
        return (
          <View key={day.date} style={{ opacity: day.date < now.today ? 0.55 : 1 }} testID={isToday ? 'plan-today' : undefined}>
            <Card highlight={isToday}>
              <Txt size={14} bold tone={isToday ? 'accent' : 'muted'}>
                {t.day(day.n).toUpperCase()} · {shortDate(day.date).toUpperCase()} · {day.city}
              </Txt>
              {day.gaps.map((g) => (
                <GapLine key={g.text} gap={g} />
              ))}
              {day.rows.length === 0 && <Txt tone="muted">{t.noPlans}</Txt>}
              {day.rows.map((r, i) => (
                <Fragment key={r.type + r.id}>
                  {isToday && i === nowAt && <NowLine />}
                  <PlanRow row={r} now={now} />
                </Fragment>
              ))}
              {isToday && nowAt === day.rows.length && <NowLine />}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}
