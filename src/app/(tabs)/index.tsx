import { View } from 'react-native';

import { shortDate } from '@/core/time';
import { isNow } from '@/core/trip-plan';
import { Card, GapLine, PlanRow, SampleBanner, Screen, Txt } from '@/ui/components';
import { t } from '@/ui/strings';
import { useSamplePlan } from '@/ui/use-sample-plan';

export default function TodayScreen() {
  const { now, summary } = useSamplePlan();
  const { day, ahead, tomorrow, later } = summary;
  const current = ahead.filter((r) => isNow(r, now));
  const next = ahead.filter((r) => !isNow(r, now));

  return (
    <Screen>
      <Txt size={28} bold accessibilityRole="header">
        {t.tabs.today}
      </Txt>
      <SampleBanner />
      {!day ? (
        <Card>
          <Txt tone="muted">{t.today.notInTrip}</Txt>
        </Card>
      ) : (
        <Card highlight>
          <View testID="today-card">
            <Txt size={14} bold tone="accent">
              {t.day(day.n).toUpperCase()} · {shortDate(day.date).toUpperCase()}
            </Txt>
            <Txt size={22} bold>
              {day.city}
            </Txt>
          </View>
          {day.gaps.map((g) => (
            <GapLine key={g.text} gap={g} />
          ))}
          {current.length > 0 && (
            <>
              <Txt size={14} bold tone="muted">
                {t.today.happeningNow}
              </Txt>
              {current.map((r) => (
                <PlanRow key={r.type + r.id} row={r} now={now} />
              ))}
            </>
          )}
          <Txt size={14} bold tone="muted">
            {t.today.next}
          </Txt>
          {next.length === 0 ? <Txt tone="muted">{t.today.nothingLeft}</Txt> : next.map((r) => <PlanRow key={r.type + r.id} row={r} now={now} />)}
        </Card>
      )}
      {tomorrow ? (
        <Card>
          <Txt size={14} bold tone="muted">
            {t.today.tomorrow}
          </Txt>
          <PlanRow row={tomorrow} now={now} />
        </Card>
      ) : later ? (
        <Card>
          <Txt size={14} bold tone="muted">
            {t.today.later(shortDate(later.day.date))}
          </Txt>
          <PlanRow row={later.row} now={now} />
        </Card>
      ) : null}
    </Screen>
  );
}
