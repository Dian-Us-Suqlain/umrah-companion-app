/* The sample trip shown until real trips exist. Invented, and placed around today each time so there is always a "now". */
import { addDays, wallAt } from '@/core/time';
import type { Item, Trip } from '@/core/trip-plan';

const ZONE = 'Asia/Riyadh';
const ALL = 'Everyone';

/** Today's date where the sample trip is. */
export const sampleToday = (nowMs: number): string => wallAt(nowMs, ZONE).slice(0, 10);

/** The sample trip with `today` as its third day. */
export function sampleTrip(today: string): { trip: Trip; items: Item[] } {
  const start = addDays(today, -2);
  const d = (n: number, time?: string) => addDays(start, n) + (time ? `T${time}` : '');
  const flight = (id: string, person: string, flightNo: string, from: string, to: string, date: string, end: string, status?: string): Item =>
    ({ id, kind: 'booking', category: 'Flight', person, flightNo, from, to, date, end, title: flightNo, status });

  const items: Item[] = [
    { id: 'h1', kind: 'booking', category: 'Hotel', person: ALL, title: 'Sample Towers Makkah', place: 'Sample Towers Makkah', date: d(0), end: d(3) },
    { id: 'h2', kind: 'booking', category: 'Hotel', person: ALL, title: 'Sample Garden Madinah', place: 'Sample Garden Madinah', date: d(3), end: d(6) },
    flight('f1a', 'Amina', 'ZZ 201', 'KHI', 'JED', d(0, '09:30'), d(0, '12:05'), 'landed'),
    flight('f1y', 'Yusuf', 'ZZ 201', 'KHI', 'JED', d(0, '09:30'), d(0, '12:05'), 'landed'),
    { id: 'a1', kind: 'appt', person: ALL, title: 'Umrah', place: 'Masjid al-Haram', date: d(0, '21:00') },
    { id: 'a2', kind: 'appt', person: ALL, title: 'Group breakfast', place: 'Hotel restaurant', date: d(2, '08:00'), end: d(2, '09:00') },
    { id: 'a3', kind: 'appt', person: ALL, title: 'Ziyarah tour', place: 'Meet in the lobby', date: d(2, '16:00'), end: d(2, '18:30') },
    flight('f2a', 'Amina', 'ZZ 310', 'JED', 'MED', d(2, '21:40'), d(2, '22:45'), 'cancelled'),
    flight('f2y', 'Yusuf', 'ZZ 310', 'JED', 'MED', d(2, '21:40'), d(2, '22:45'), 'cancelled'),
    { id: 't1', kind: 'booking', category: 'Transport', person: ALL, title: 'Train to Madinah', place: 'Makkah station', date: d(3, '14:00'), end: d(3, '16:30') },
    { id: 'b1', kind: 'booking', category: 'Visit', person: 'Amina', title: 'Rawdah visit', place: 'Masjid an-Nabawi', date: d(4, '20:00'), end: d(4, '21:00') },
    flight('f3a', 'Amina', 'ZZ 202', 'JED', 'KHI', d(6, '18:20'), d(6, '22:10')),
    flight('f3y', 'Yusuf', 'ZZ 202', 'JED', 'KHI', d(6, '18:20'), d(6, '22:10')),
  ];
  return { trip: { name: 'Sample trip', depart: d(0), return: d(6), zone: ZONE }, items };
}
