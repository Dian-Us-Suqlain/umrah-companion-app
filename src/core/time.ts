/* Wall-clock helpers. Times on items are strings with no zone ("YYYY-MM-DDTHH:MM"); the zone is always passed in. */

export const DAY_MS = 864e5;

/** Instant → "YYYY-MM-DDTHH:MM" on the wall clock of `zone` (the device's zone when omitted). */
export function wallAt(ms: number, zone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone || undefined,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** A wall-clock string read as if it were UTC. Only for arithmetic on dates, never as a real instant. */
export function naive(wall: string): number {
  const [d, t = '00:00'] = wall.split('T');
  const [y, m, dd] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return Date.UTC(y, m - 1, dd, h, mi);
}

/** Wall-clock string in `zone` → instant (ms). */
export function toInstant(wall: string, zone: string): number {
  const guess = naive(wall);
  const offset = (ms: number) => naive(wallAt(ms, zone)) - Math.floor(ms / 60000) * 60000;
  return guess - offset(guess - offset(guess));
}

export const addDays = (date: string, n: number): string =>
  new Date(naive(date) + n * DAY_MS).toISOString().slice(0, 10);

export const dayDiff = (a: string, b: string): number => Math.round((naive(a) - naive(b)) / DAY_MS);

export const dateOf = (s?: string | null): string => String(s || '').slice(0, 10);

export const timeOf = (s?: string | null): string => (String(s || '').length > 10 ? String(s).slice(11, 16) : '');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Wed 7 Oct" for a date string. Spelled out by hand so every phone formats it the same way. */
export function shortDate(date: string): string {
  const d = new Date(naive(dateOf(date)));
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
