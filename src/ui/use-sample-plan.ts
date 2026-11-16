import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { buildDays, clock, summary } from '@/core/trip-plan';
import { sampleToday, sampleTrip } from '@/data/sample-trip';

/** The sample trip as a day-by-day plan, with a clock that keeps up while the app is open. */
export function useSamplePlan() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  /** Look at the clock now, without waiting for the next tick: used when a countdown reaches zero. */
  const refresh = useCallback(() => setNowMs(Date.now()), []);
  useEffect(() => {
    const tick = refresh;
    const timer = setInterval(tick, 30_000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && tick());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  const { trip, items } = sampleTrip(sampleToday(nowMs));
  const plan = buildDays(items, trip);
  const phoneZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = clock(trip, nowMs, phoneZone);
  return { trip, plan, now, summary: summary(plan, now), refresh };
}
