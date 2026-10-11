/* Time-zone cases that must give the same answers on the phone's JavaScript engine as in the unit tests.
   Run by the tests on Node and by the Self-check screen on the device. */
import { addDays, shortDate, toInstant, wallAt } from './time';
import { clock } from './trip-plan';

export interface CheckResult {
  name: string;
  expected: string;
  got: string;
  pass: boolean;
}

const utc = (y: number, m: number, d: number, h = 0, mi = 0) => Date.UTC(y, m - 1, d, h, mi);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 16) + 'Z';
const instant = (wall: string, zone: string) => iso(toInstant(wall, zone));

const CASES: [name: string, expected: string, run: () => string][] = [
  ['Riyadh noon is 09:00 UTC', '2027-01-10T09:00Z', () => instant('2027-01-10T12:00', 'Asia/Riyadh')],
  ['Karachi noon is 07:00 UTC', '2027-01-10T07:00Z', () => instant('2027-01-10T12:00', 'Asia/Karachi')],
  ['London noon in winter is 12:00 UTC', '2027-01-10T12:00Z', () => instant('2027-01-10T12:00', 'Europe/London')],
  ['London noon in summer is 11:00 UTC', '2027-07-10T11:00Z', () => instant('2027-07-10T12:00', 'Europe/London')],
  ['London, before the clocks go forward', '2027-03-28T00:30Z', () => instant('2027-03-28T00:30', 'Europe/London')],
  ['London, after the clocks go forward', '2027-03-28T02:30Z', () => instant('2027-03-28T03:30', 'Europe/London')],
  ['London, after the clocks go back', '2027-10-31T12:00Z', () => instant('2027-10-31T12:00', 'Europe/London')],
  ['New York noon in winter is 17:00 UTC', '2027-01-10T17:00Z', () => instant('2027-01-10T12:00', 'America/New_York')],
  ['New York noon in summer is 16:00 UTC', '2027-07-10T16:00Z', () => instant('2027-07-10T12:00', 'America/New_York')],
  ['New York, before the clocks go forward', '2027-03-14T06:30Z', () => instant('2027-03-14T01:30', 'America/New_York')],
  ['New York, after the clocks go forward', '2027-03-14T07:30Z', () => instant('2027-03-14T03:30', 'America/New_York')],
  ['21:30 UTC is half past midnight in Riyadh', '2027-01-11T00:30', () => wallAt(utc(2027, 1, 10, 21, 30), 'Asia/Riyadh')],
  ['Midnight is written 00:00, not 24:00', '2027-01-11T00:00', () => wallAt(utc(2027, 1, 10, 21, 0), 'Asia/Riyadh')],
  ['21:30 UTC is 02:30 in Karachi', '2027-01-11T02:30', () => wallAt(utc(2027, 1, 10, 21, 30), 'Asia/Karachi')],
  ['New York is a day behind Riyadh at 02:00 UTC', '2027-01-10T21:00', () => wallAt(utc(2027, 1, 11, 2, 0), 'America/New_York')],
  ['The day after 31 December', '2027-01-01', () => addDays('2026-12-31', 1)],
  ['The day after 28 February 2027', '2027-03-01', () => addDays('2027-02-28', 1)],
  ['Short date', 'Wed 13 Jan', () => shortDate('2027-01-13')],
  [
    'During the trip, today follows the trip, not a Karachi phone',
    '2027-01-10 Asia/Riyadh',
    () => {
      const c = clock({ depart: '2027-01-09', return: '2027-01-18', zone: 'Asia/Riyadh' }, utc(2027, 1, 10, 19, 30), 'Asia/Karachi');
      return `${c.today} ${c.zone}`;
    },
  ],
  [
    'During the trip, today follows the trip, not a New York phone',
    '2027-01-11 Asia/Riyadh',
    () => {
      const c = clock({ depart: '2027-01-09', return: '2027-01-18', zone: 'Asia/Riyadh' }, utc(2027, 1, 10, 22, 0), 'America/New_York');
      return `${c.today} ${c.zone}`;
    },
  ],
];

export function runSelfCheck(): CheckResult[] {
  return CASES.map(([name, expected, run]) => {
    let got: string;
    try {
      got = run();
    } catch (e) {
      got = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
    return { name, expected, got, pass: got === expected };
  });
}
