import { runSelfCheck } from '../self-check';
import { buildDays, clock, digest, isNow, isPast, summary, type Item, type Plan, type PlanOptions, type Stay, type Trip } from '../trip-plan';
import { items, opt, trip, utc } from './fixture-trip';

const plan = (its: Item[] = items, o: PlanOptions = opt, t: Trip = trip) => buildDays(its, t, o);
const day = (p: Plan, d: string) => p.days.find((x) => x.date === d)!;

test('one section per day of the trip, numbered from the departure date', () => {
  const p = plan();
  expect(p.days.length).toBe(10);
  expect(p.days[0]).toMatchObject({ date: '2027-01-09', n: 1 });
  expect(p.days[9]).toMatchObject({ date: '2027-01-18', n: 10 });
});

test('every dated booking and appointment appears exactly once, flights grouped', () => {
  const p = plan(), all = p.days.flatMap((d) => d.rows);
  expect(all.filter((r) => r.type === 'flight').length).toBe(5); // 11 legs → 5 flights
  expect(all.find((r) => r.title.startsWith('ZZ 103'))!.who.sort()).toEqual(['amina', 'sara', 'yusuf']);
  expect(all.filter((r) => r.type === 'appt').length).toBe(1);
  expect(all.filter((r) => r.type === 'transport').length).toBe(1); // Rawdah is filed as Transport
  expect(all.filter((r) => r.type === 'checkin').length).toBe(2);
  expect(all.filter((r) => r.type === 'checkout').length).toBe(2);
  expect(p.undated.length).toBe(0);
  expect(p.before.length + p.after.length).toBe(0);
  expect(all.some((r) => r.id === 'd1' || r.id === 't1')).toBe(false); // documents and to-dos are not plans
});

test('rows are on the right day and in time order', () => {
  const d1 = day(plan(), '2027-01-09');
  expect(d1.rows.map((r) => r.time || r.type)).toEqual(['10:10', '10:21', '15:47', '22:00', 'checkin']);
  expect(d1.rows[0].endTime).toBe('12:34');
});

test('an overnight flight departs on one day and lands on the next', () => {
  const p = plan();
  const dep = day(p, '2027-01-17').rows.find((r) => r.type === 'flight')!;
  const arr = day(p, '2027-01-18').rows.find((r) => r.type === 'arrive')!;
  expect(dep.time).toBe('20:10');
  expect(dep.endTime).toBe('');
  expect(dep.note).toMatch(/lands 00:10 next day/);
  expect(arr.time).toBe('00:10');
  expect(arr.title).toMatch(/ZZ 103 lands in Doha/);
  expect(day(p, '2027-01-18').rows.map((r) => r.time)).toEqual(['00:10', '03:10']);
});

test('cities come from the hotel of each night', () => {
  const p = plan();
  expect(day(p, '2027-01-09').city).toBe('Makkah');
  expect(day(p, '2027-01-11').city).toBe('Makkah');
  expect(day(p, '2027-01-13').city).toBe('Makkah → Madinah');
  expect(day(p, '2027-01-15').city).toBe('Madinah');
  expect(day(p, '2027-01-17').city).toBe('Madinah · leaving');
  expect(day(p, '2027-01-18').city).toBe('Travelling');
});

test('hotel rows carry no invented clock time; check-out leads and check-in closes a moving day', () => {
  expect(day(plan(), '2027-01-13').rows.map((r) => [r.type, r.time])).toEqual([['checkout', ''], ['checkin', '']]);
});

test('this trip has exactly two gaps: the moving day and the day of the flight home', () => {
  const g = plan().days.filter((d) => d.gaps.length).map((d) => [d.date, d.gaps.map((x) => x.text)]);
  expect(g).toEqual([
    ['2027-01-13', ['No transport saved for Makkah → Madinah']],
    ['2027-01-17', ['No transport saved from Madinah to Jeddah airport']],
  ]);
});

test('a transport booking on the day closes its gap', () => {
  const its: Item[] = [...items, { id: 'tr', kind: 'booking', category: 'Transport', person: 'all', title: 'Driver: Makkah → Madinah', date: '2027-01-13' }];
  const p = plan(its);
  expect(day(p, '2027-01-13').gaps.length).toBe(0);
  expect(day(p, '2027-01-13').rows.map((r) => r.type)).toEqual(['checkout', 'transport', 'checkin']);
  expect(day(p, '2027-01-17').gaps.length).toBe(1);
});

test('a transfer without a time sits after check-out and before the flight it leads to', () => {
  const its: Item[] = [...items, { id: 'tr2', kind: 'booking', category: 'Transport', person: 'all', title: 'Driver: Madinah → Jeddah airport', date: '2027-01-17' }];
  const d = day(plan(its), '2027-01-17');
  expect(d.rows.map((r) => r.type)).toEqual(['checkout', 'transport', 'flight']);
  expect(d.gaps.length).toBe(0);
});

test('a night without a hotel is reported', () => {
  const its = items.map((i) => (i.id === 'h2' ? { ...i, date: '2027-01-14' } : i));
  expect(day(plan(its), '2027-01-13').gaps.map((g) => g.kind)).toEqual(['hotel']);
});

test('the trip clock follows the trip’s zone during the trip, whatever the phone', () => {
  const c = clock(trip, utc('2027-01-10T21:30'), 'Asia/Karachi'); // 00:30 on 11 Jan in Makkah, 02:30 in Karachi
  expect(c).toMatchObject({ inTrip: true, today: '2027-01-11', now: '2027-01-11T00:30', zone: 'Asia/Riyadh' });
  const late = clock(trip, utc('2027-01-10T19:30'), 'Asia/Karachi'); // 22:30 on 10 Jan in Makkah, already 11 Jan in Karachi
  expect(late.today).toBe('2027-01-10');
});

test('the trip’s zone is the trip’s own, not fixed to Saudi time', () => {
  const t: Trip = { depart: '2027-01-09', return: '2027-01-18', zone: 'Asia/Kuala_Lumpur' };
  const c = clock(t, utc('2027-01-10T17:00'), 'Asia/Karachi'); // 01:00 on 11 Jan in Kuala Lumpur
  expect(c).toMatchObject({ today: '2027-01-11', zone: 'Asia/Kuala_Lumpur' });
  const its: Item[] = [{ id: 'x', kind: 'appt', person: 'all', title: 'Meet', date: '2027-01-11T09:00' }];
  expect(buildDays(its, t).days[2].rows[0].at).toBe(utc('2027-01-11T01:00'));
});

test('before and after the trip the clock is the phone’s own', () => {
  const b = clock(trip, utc('2026-12-27T20:00'), 'Asia/Karachi');
  expect(b).toMatchObject({ inTrip: false, now: '2026-12-28T01:00' });
  const a = clock(trip, utc('2027-01-26T20:00'), 'Europe/Brussels');
  expect(a).toMatchObject({ inTrip: false, now: '2027-01-26T21:00' });
});

test('an entry at 23:00 trip time is not past at 22:30 trip time, even on a Karachi phone', () => {
  const its: Item[] = [...items, { id: 'x', kind: 'appt', person: 'all', title: 'Late', date: '2027-01-10T23:00' }];
  const row = day(plan(its), '2027-01-10').rows.find((r) => r.id === 'x')!;
  expect(isPast(row, clock(trip, utc('2027-01-10T19:30'), 'Asia/Karachi'))).toBe(false); // 22:30 Makkah
  expect(isPast(row, clock(trip, utc('2027-01-10T20:30'), 'Asia/Karachi'))).toBe(true); // 23:30 Makkah
});

test('flights use their airport’s zone for past/now', () => {
  const row = day(plan(), '2027-01-09').rows.find((r) => r.title.startsWith('QQ 642'))!; // London 10:21 (UTC+0) → Jeddah 17:21 (UTC+3)
  expect(row.at).toBe(utc('2027-01-09T10:21'));
  expect(row.until).toBe(utc('2027-01-09T14:21'));
  expect(isNow(row, clock(trip, utc('2027-01-09T12:00')))).toBe(true);
  expect(isPast(row, clock(trip, utc('2027-01-09T15:00')))).toBe(true);
});

test('stays turn hotel rows into detected check-in and check-out', () => {
  const stays: Stay[] = [{ booking: 'h1', user: 'amina', first: '2027-01-09T19:07:51Z', last: '2027-01-13T08:42:00Z', away: null }];
  let p = plan(items, { ...opt, stays });
  const ci = day(p, '2027-01-09').rows.find((r) => r.type === 'checkin')!;
  let co = day(p, '2027-01-13').rows.find((r) => r.type === 'checkout')!;
  expect(ci).toMatchObject({ done: true, time: '22:07', who: ['amina'] });
  expect(co).toMatchObject({ done: false, time: '' });
  stays[0].away = '2027-01-13T13:00:00Z';
  co = day(plan(items, { ...opt, stays }), '2027-01-13').rows.find((r) => r.type === 'checkout')!;
  expect(co).toMatchObject({ done: true, time: '11:42' }); // last seen at the hotel, trip time
  const moved: Stay[] = [
    { booking: 'h1', user: 'amina', first: '2027-01-09T19:07:51Z', last: '2027-01-13T08:42:00Z', away: null },
    { booking: 'h2', user: 'amina', first: '2027-01-13T15:00:00Z', last: '2027-01-13T15:00:00Z', away: null },
  ];
  p = plan(items, { ...opt, stays: moved });
  expect(day(p, '2027-01-13').rows.find((r) => r.type === 'checkout')!.done).toBe(true); // seen at the next hotel
  expect(day(p, '2027-01-13').rows.find((r) => r.type === 'checkin')!.time).toBe('18:00');
});

test('an open deadline is a row on its date and goes away when done', () => {
  const due = items.map((i) => (i.id === 'r1' ? { ...i, due: '2027-01-12T20:00' } : i));
  expect(day(plan(due), '2027-01-12').rows.map((x) => [x.type, x.time, x.title])).toEqual([['due', '20:00', 'Rawdah']]);
  expect(day(plan(due.map((i) => (i.id === 'r1' ? { ...i, dueDone: true } : i))), '2027-01-12').rows.length).toBe(0);
});

test('summary: what is ahead today and the first thing tomorrow', () => {
  const s = summary(plan(), clock(trip, utc('2027-01-13T06:00'), 'Asia/Karachi'));
  expect(s.day!.n).toBe(5);
  expect(s.ahead.map((r) => r.type)).toEqual(['checkout', 'checkin']);
  expect(s.tomorrow!.title).toBe('Rawdah');
  expect(s.later).toBeNull(); // tomorrow already has something
  const free = summary(plan(), clock(trip, utc('2027-01-10T06:00')));
  expect(free.tomorrow).toBeNull();
  expect(free.later!.day.date).toBe('2027-01-13');
  expect(free.later!.row.type).toBe('checkout');
  expect(summary(plan(), clock(trip, utc('2026-12-08T06:00'))).day).toBeNull();
});

test('morning notification text', () => {
  const d = digest(plan(), clock(trip, utc('2027-01-13T03:10')))!;
  expect(d.title).toBe('Today · Day 5 · Makkah → Madinah');
  expect(d.body).toBe('Check-out Résidence Sample Makkah · Check-in Sample Garden Madinah\nTomorrow: 20:00 Rawdah');
  expect(digest(plan(), clock(trip, utc('2027-01-11T03:10')))!.body).toBe('No fixed plans today.\nNext, Wed 13 Jan: Check-out Résidence Sample Makkah');
  expect(digest(plan(), clock(trip, utc('2027-01-18T03:10')))!.body).toBe('00:10 ZZ 103 lands in Doha · 03:10 ZZ 104 Doha → Karachi');
  expect(digest(plan(), clock(trip, utc('2027-02-11T03:10')))).toBeNull();
});

test('no trip dates: days run from the first to the last entry', () => {
  const p = plan(items, opt, { name: 'x', depart: '', return: '', zone: 'Asia/Riyadh' });
  expect(p.days[0].date).toBe('2027-01-09');
  expect(p.days.at(-1)!.date).toBe('2027-01-18');
});

test('entries outside the trip dates and without a date are kept apart', () => {
  const its: Item[] = [
    ...items,
    { id: 'e', kind: 'appt', person: 'all', title: 'Early', date: '2027-01-06T10:00' },
    { id: 'l', kind: 'appt', person: 'all', title: 'Later', date: '2027-01-26' },
    { id: 'u', kind: 'appt', person: 'all', title: 'Sometime' },
  ];
  const p = plan(its);
  expect([p.before.length, p.after.length, p.undated.length]).toEqual([1, 1, 1]);
});

test('without options the shared airport table gives city names and zones', () => {
  const p = buildDays(items, trip), row = day(p, '2027-01-17').rows.find((r) => r.type === 'flight')!;
  expect(row.title).toBe('ZZ 103 · Jeddah → Doha');
  expect(row.at).toBe(utc('2027-01-17T17:10'));
  expect(digest(p, clock(trip, utc('2027-01-18T03:10')))!.body).toBe('00:10 ZZ 103 lands in Doha · 03:10 ZZ 104 Doha → Karachi');
  expect(day(p, '2027-01-17').gaps[0].text).toBe('No transport saved from Madinah to Jeddah airport');
});

test('empty data does not break', () => {
  expect(buildDays([], { depart: '', return: '', zone: 'Asia/Riyadh' }).days).toEqual([]);
});

test('a cancelled flight says so in the plan and the morning notification, and is never "now"', () => {
  const its = items.map((i) => (i.flightNo === 'ZZ 103' ? { ...i, status: 'cancelled' } : i)), p = plan(its);
  const dep = day(p, '2027-01-17').rows.find((r) => r.type === 'flight')!;
  const arr = day(p, '2027-01-18').rows.find((r) => r.type === 'arrive')!;
  expect(dep.status).toBe('cancelled');
  expect(arr.status).toBe('cancelled');
  expect(isNow(dep, clock(trip, utc('2027-01-17T18:00')))).toBe(false); // 21:00 in Jeddah, mid-flight had it flown
  const d = digest(p, clock(trip, utc('2027-01-17T03:10')))!;
  expect(d.body).toMatch(/CANCELLED: 20:10 ZZ 103 Jeddah → Doha/);
  expect(d.body).toMatch(/Tomorrow: 03:10 ZZ 104 Doha → Karachi/); // tomorrow is the first thing still happening
  expect(digest(p, clock(trip, utc('2027-01-18T03:10')))!.body).toBe('03:10 ZZ 104 Doha → Karachi · CANCELLED: 00:10 ZZ 103 lands in Doha'); // what is happening comes first
  expect(day(buildDays(its.filter((i) => i.category !== 'Transport' || i.id === 'r1'), trip, opt), '2027-01-17').gaps.length).toBe(0); // no transfer needed to a cancelled flight
});

test('every self-check case passes on this engine', () => {
  expect(runSelfCheck().filter((c) => !c.pass)).toEqual([]);
});
