/* Trip-plan logic. Pure: data in, data out — no React, no device APIs, and the time is always passed in.
   Ported from the first app's itinerary-core.js; see specs/001-foundation. */
import { AIRPORTS } from './airports';
import { addDays, dateOf, shortDate, timeOf, toInstant, wallAt } from './time';

export interface Trip {
  name?: string;
  /** First and last day of the trip, "YYYY-MM-DD". Empty: the days run from the first to the last entry. */
  depart?: string;
  return?: string;
  /** Where the group is: everything except flights is on this zone's wall clock. */
  zone: string;
}

export interface Item {
  id: string;
  kind: 'booking' | 'appt' | 'doc' | 'todo';
  category?: string;
  person: string;
  title: string;
  place?: string;
  date?: string;
  end?: string;
  flightNo?: string;
  from?: string;
  to?: string;
  /** Live flight status; 'cancelled' changes every screen that shows the flight. */
  status?: string;
  due?: string;
  dueDone?: boolean;
}

/** A person seen at a hotel: first and last sighting, and when they were first seen away from it. */
export interface Stay {
  booking: string;
  user: string;
  first: string;
  last: string;
  away: string | null;
}

export type RowType = 'checkin' | 'checkout' | 'flight' | 'arrive' | 'transport' | 'appt' | 'booking' | 'due';

export interface Row {
  type: RowType;
  date: string;
  time: string;
  endTime?: string;
  /** Start and end as real instants, when the row has a clock time. */
  at: number | null;
  until?: number | null;
  title: string;
  note?: string;
  status?: string;
  who: string[];
  id: string;
  from?: string;
  done?: boolean;
  seenAt?: string;
  rank: number;
}

export interface Gap {
  kind: 'transport' | 'hotel';
  text: string;
  title?: string;
}

export interface Day {
  date: string;
  n: number;
  city: string;
  rows: Row[];
  gaps: Gap[];
}

export interface Plan {
  days: Day[];
  before: Row[];
  after: Row[];
  undated: Item[];
}

export interface Clock {
  zone: string | undefined;
  now: string;
  today: string;
  inTrip: boolean;
  nowMs: number;
}

export interface PlanOptions {
  stays?: Stay[];
  /** Override the airport table (tests). */
  zoneOf?: (code?: string) => string | undefined;
  airportCity?: (code?: string) => string | undefined;
}

/** The one clock all trip logic uses: the trip's zone during the trip, the device's own zone before and after. */
export function clock(trip: Trip | null | undefined, nowMs: number, phoneZone?: string): Clock {
  const zone = trip?.zone;
  const there = wallAt(nowMs, zone);
  const d = there.slice(0, 10);
  const inTrip = !!(trip && trip.depart && d >= trip.depart && (!trip.return || d <= trip.return));
  const now = inTrip ? there : wallAt(nowMs, phoneZone);
  return { zone: inTrip ? zone : phoneZone, now, today: now.slice(0, 10), inTrip, nowMs };
}

/** Matches names by their start, ignoring accents, spaces and punctuation. */
export const nameKey = (s?: string): string =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 14);

const CITIES: [RegExp, string][] = [
  [/mak+ah|mecca/i, 'Makkah'],
  [/madin|medina/i, 'Madinah'],
  [/jed+ah|jidda/i, 'Jeddah'],
];
export const cityOf = (text?: string): string => CITIES.find(([re]) => re.test(text || ''))?.[1] ?? '';
const sameCity = (a: string, b: string) => nameKey(a) === nameKey(b);

interface Hotel {
  it: Item;
  start: string;
  end: string;
  city: string;
}

/** Items → the trip, day by day. */
export function buildDays(items: Item[], trip: Trip, opt: PlanOptions = {}): Plan {
  const zoneOf = opt.zoneOf || ((c?: string) => AIRPORTS[c || '']?.[1]);
  const airportCity = opt.airportCity || ((c?: string) => AIRPORTS[c || '']?.[0] || c || '');
  const stays = opt.stays || [];
  const tripZone = trip.zone;
  const rows: Row[] = [];
  const undated: Item[] = [];
  const dated = (items || []).filter((i) => i.kind === 'booking' || i.kind === 'appt');

  // hotels: the nights they cover, plus a check-in and a check-out row
  const hotels: Hotel[] = dated
    .filter((i) => i.kind === 'booking' && i.category === 'Hotel' && i.date)
    .map((i) => ({
      it: i,
      start: dateOf(i.date),
      end: dateOf(i.end || i.date),
      city: cityOf(`${i.place || ''} ${i.title || ''}`) || i.title || 'Hotel',
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
  for (const [n, h] of hotels.entries()) {
    const mine = stays.filter((s) => s.booking === h.it.id);
    const ms = (v: string) => new Date(v).getTime();
    const first = mine.length ? Math.min(...mine.map((s) => ms(s.first))) : null;
    const last = mine.length ? Math.max(...mine.map((s) => ms(s.last))) : null;
    const laterSeen = hotels.slice(n + 1).some((x) => stays.some((s) => s.booking === x.it.id));
    const left = mine.length > 0 && (mine.some((s) => s.away) || laterSeen);
    const inWall = first != null ? wallAt(first, tripZone) : '';
    const outWall = left && last != null ? wallAt(last, tripZone) : '';
    rows.push({
      type: 'checkin',
      date: h.start,
      time: inWall && dateOf(inWall) === h.start ? timeOf(inWall) : '',
      at: first,
      done: first != null,
      seenAt: inWall,
      title: h.it.title,
      who: first != null ? mine.map((s) => s.user) : [h.it.person],
      id: h.it.id,
      rank: 3,
    });
    if (h.end !== h.start) {
      rows.push({
        type: 'checkout',
        date: h.end,
        time: outWall && dateOf(outWall) === h.end ? timeOf(outWall) : '',
        at: left ? last : null,
        done: left,
        seenAt: outWall,
        title: h.it.title,
        who: [h.it.person],
        id: h.it.id,
        rank: 1,
      });
    }
  }

  // flights: one row per flight with everyone on it; a landing on a later date gets its own row
  const flights = new Map<string, { it: Item; who: string[] }>();
  for (const i of dated) {
    if (!(i.kind === 'booking' && i.category === 'Flight' && i.date)) continue;
    const key = [i.flightNo || i.title, i.date, i.from, i.to].join('|');
    const g = flights.get(key) || { it: i, who: [] };
    if (!g.who.includes(i.person)) g.who.push(i.person);
    flights.set(key, g);
  }
  for (const { it, who } of flights.values()) {
    const date = it.date as string;
    const no = it.flightNo || it.title;
    const route = `${airportCity(it.from) || '?'} → ${airportCity(it.to) || '?'}`;
    const dep = toInstant(date, zoneOf(it.from) || tripZone);
    const arr = it.end ? toInstant(it.end, zoneOf(it.to) || tripZone) : null;
    const overnight = !!it.end && dateOf(it.end) !== dateOf(date);
    rows.push({
      type: 'flight',
      date: dateOf(date),
      time: timeOf(date),
      endTime: it.end && !overnight ? timeOf(it.end) : '',
      at: dep,
      until: arr,
      title: `${no} · ${route}`,
      note: overnight ? `lands ${timeOf(it.end)} next day` : '',
      status: it.status || '',
      who,
      id: it.id,
      from: it.from,
      rank: 2,
    });
    if (overnight) {
      rows.push({
        type: 'arrive',
        date: dateOf(it.end),
        time: timeOf(it.end),
        at: arr,
        title: `${no} lands in ${airportCity(it.to) || it.to || '?'}`,
        status: it.status || '',
        who,
        id: it.id,
        rank: 2,
      });
    }
  }

  // everything else: transport, other bookings, appointments
  const isHotelOrFlight = (i: Item) => i.kind === 'booking' && (i.category === 'Hotel' || i.category === 'Flight');
  for (const i of dated) {
    if (isHotelOrFlight(i)) continue;
    if (!i.date) {
      undated.push(i);
      continue;
    }
    rows.push({
      type: i.kind === 'appt' ? 'appt' : i.category === 'Transport' ? 'transport' : 'booking',
      date: dateOf(i.date),
      time: timeOf(i.date),
      endTime: i.end && dateOf(i.end) === dateOf(i.date) ? timeOf(i.end) : '',
      at: timeOf(i.date) ? toInstant(i.date, tripZone) : null,
      until: i.end && timeOf(i.end) ? toInstant(i.end, tripZone) : null,
      title: i.title,
      note: i.place || '',
      who: [i.person],
      id: i.id,
      rank: 2,
    });
  }
  for (const i of dated) if (isHotelOrFlight(i) && !i.date) undated.push(i);

  // open "action needed by" deadlines
  for (const i of dated) {
    if (!i.due || i.dueDone) continue;
    rows.push({
      type: 'due',
      date: dateOf(i.due),
      time: timeOf(i.due),
      at: timeOf(i.due) ? toInstant(i.due, tripZone) : null,
      title: i.title,
      who: [i.person],
      id: i.id,
      rank: 0,
    });
  }

  // order within a day: by time; without a time, deadlines, check-out and then other entries come first (a transfer with no
  // time yet belongs before the flight it leads to), and check-in comes last
  const sortKey = (r: Row) => (r.time || (r.rank === 3 ? '99:99' : '00:00')) + r.rank;

  // the days themselves
  const all = rows.map((r) => r.date).sort();
  const from = trip.depart ? trip.depart : all[0];
  const to = trip.return ? trip.return : all[all.length - 1];
  const days: Day[] = [];
  if (from && to && to >= from) {
    const cover = (d: string) => hotels.find((h) => h.start <= d && d < h.end);
    const ending = (d: string) => hotels.find((h) => h.end === d && h.end !== h.start);
    const starting = (d: string) => hotels.find((h) => h.start === d);
    const firstNight = hotels.length ? hotels[0].start : null;
    const lastNight = hotels.length ? hotels.reduce((m, h) => (h.end > m ? h.end : m), hotels[0].end) : null;
    for (let d = from, n = 1; d <= to && n <= 400; d = addDays(d, 1), n++) {
      const e = ending(d);
      const s = starting(d);
      const c = cover(d);
      const city =
        e && s && !sameCity(e.city, s.city) ? `${e.city} → ${s.city}` : c ? c.city : e ? `${e.city} · leaving` : 'Travelling';
      const list = rows.filter((r) => r.date === d).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      const moved = list.some((r) => r.type === 'transport');
      const gaps: Gap[] = [];
      if (e && s && !sameCity(e.city, s.city) && !moved) {
        gaps.push({ kind: 'transport', text: `No transport saved for ${e.city} → ${s.city}`, title: `${e.city} → ${s.city}` });
      }
      const morning = e || (c && c.start < d ? c : null);
      for (const f of list.filter((r) => r.type === 'flight' && r.status !== 'cancelled')) {
        const ac = airportCity(f.from);
        if (morning && ac && !sameCity(morning.city, ac) && !moved && !gaps.some((g) => g.kind === 'transport')) {
          gaps.push({
            kind: 'transport',
            text: `No transport saved from ${morning.city} to ${ac} airport`,
            title: `${morning.city} → ${ac} airport`,
          });
        }
      }
      if (firstNight && lastNight && d >= firstNight && d < lastNight && !c) {
        gaps.push({ kind: 'hotel', text: 'No hotel saved for this night' });
      }
      days.push({ date: d, n, city, rows: list, gaps });
    }
  }
  const inRange = (d: string) => !!from && !!to && d >= from && d <= to;
  return {
    days,
    before: rows.filter((r) => !inRange(r.date) && !!from && r.date < from),
    after: rows.filter((r) => !inRange(r.date) && !!to && r.date > to),
    undated,
  };
}

/** Has this row passed, on the trip clock? Timed rows use real instants (flights in their airport's zone); the rest go by date. */
export const isPast = (row: Row, c: Clock): boolean =>
  row.at != null
    ? (row.until || row.at) < c.nowMs
    : row.type === 'checkin' || row.type === 'checkout'
      ? !!row.done || row.date < c.today
      : row.date < c.today;

export const isNow = (row: Row, c: Clock): boolean =>
  row.status !== 'cancelled' && row.at != null && row.until != null && row.at <= c.nowMs && c.nowMs < row.until;

export interface Summary {
  day: Day | null;
  ahead: Row[];
  tomorrow: Row | null;
  later: { day: Day; row: Row } | null;
}

/** What matters right now: today's day, what is still ahead today, and the first thing tomorrow. */
export function summary(plan: Plan, c: Clock): Summary {
  const day = plan.days.find((d) => d.date === c.today) || null;
  const next = plan.days.find((d) => d.date === addDays(c.today, 1)) || null;
  const later = plan.days.find((d) => d.date > c.today && d.rows.length) || null; // the next day that has anything on it
  return {
    day,
    ahead: day ? day.rows.filter((r) => !isPast(r, c)) : [],
    tomorrow: next && next.rows.length ? next.rows.find((r) => r.status !== 'cancelled') || next.rows[0] : null,
    later: later && later !== next ? { day: later, row: later.rows[0] } : null,
  };
}

const LABEL: Record<RowType, string> = {
  checkin: 'Check-in',
  checkout: 'Check-out',
  due: 'Action needed',
  arrive: '',
  flight: '',
  transport: '',
  appt: '',
  booking: '',
};

/** One short line for a row, as used in the morning notification. */
export const rowLine = (r: Row): string =>
  [
    r.status === 'cancelled' ? 'CANCELLED:' : '',
    r.time,
    LABEL[r.type],
    r.type === 'flight' ? r.title.split(' · ')[0] + ' ' + r.title.split(' · ')[1] : r.title,
  ]
    .filter(Boolean)
    .join(' ');

/** The morning notification for one person's plan. Null outside the trip. */
export function digest(plan: Plan, c: Clock): { title: string; body: string } | null {
  const s = summary(plan, c);
  if (!s.day) return null;
  const todays = s.day.rows.filter((r) => !(r.done && (r.type === 'checkin' || r.type === 'checkout')));
  // room for four: what is happening first
  const lines = [...todays.filter((r) => r.status !== 'cancelled'), ...todays.filter((r) => r.status === 'cancelled')]
    .slice(0, 4)
    .map(rowLine);
  const body =
    (lines.length ? lines.join(' · ') : 'No fixed plans today.') +
    (s.tomorrow
      ? `\nTomorrow: ${rowLine(s.tomorrow)}`
      : s.later
        ? `\nNext, ${shortDate(s.later.day.date)}: ${rowLine(s.later.row)}`
        : '');
  return { title: `Today · Day ${s.day.n} · ${s.day.city}`, body: body.slice(0, 300) };
}
