// An invented trip with the same shape as a real one: two hotels, five flights for three people, one appointment.
// Nothing here is a real person, booking or flight.
import type { Item, PlanOptions, Trip } from '../trip-plan';

export const trip: Trip = { name: 'Sample Umrah', depart: '2027-01-09', return: '2027-01-18', zone: 'Asia/Riyadh' };

const A = 'amina', Y = 'yusuf', S = 'sara';
const fl = (id: string, person: string, flightNo: string, from: string, to: string, date: string, end: string, extra: Partial<Item> = {}): Item =>
  ({ id, kind: 'booking', category: 'Flight', person, flightNo, from, to, date, end, title: `${flightNo} · x`, ...extra });

export const items: Item[] = [
  { id: 'h1', kind: 'booking', category: 'Hotel', person: 'all', title: 'Résidence Sample Makkah', place: 'Résidence Sample Makkah', date: '2027-01-09', end: '2027-01-13' },
  { id: 'h2', kind: 'booking', category: 'Hotel', person: 'all', title: 'Sample Garden Madinah', place: 'Sample Garden Madinah', date: '2027-01-13', end: '2027-01-17' },
  fl('f1a', A, 'ZZ 101', 'KHI', 'DOH', '2027-01-09T10:10', '2027-01-09T12:34', { status: 'landed' }),
  fl('f1y', Y, 'ZZ 101', 'KHI', 'DOH', '2027-01-09T10:10', '2027-01-09T12:34', { status: 'landed' }),
  fl('f2s', S, 'QQ 642', 'LHR', 'JED', '2027-01-09T10:21', '2027-01-09T17:21'),
  fl('f3a', A, 'ZZ 102', 'DOH', 'JED', '2027-01-09T15:47', '2027-01-09T17:48'),
  fl('f3y', Y, 'ZZ 102', 'DOH', 'JED', '2027-01-09T15:47', '2027-01-09T17:48'),
  { id: 'a1', kind: 'appt', person: Y, title: 'Umrah confirmation', place: 'Makkah', date: '2027-01-09T22:00' },
  { id: 'r1', kind: 'booking', category: 'Transport', person: Y, title: 'Rawdah', place: 'Madina', date: '2027-01-14T20:00', end: '2027-01-14T22:00' },
  fl('f4a', A, 'ZZ 103', 'JED', 'DOH', '2027-01-17T20:10', '2027-01-18T00:10'),
  fl('f4y', Y, 'ZZ 103', 'JED', 'DOH', '2027-01-17T20:10', '2027-01-18T00:10'),
  fl('f4s', S, 'ZZ 103', 'JED', 'DOH', '2027-01-17T20:10', '2027-01-18T00:10'),
  fl('f5a', A, 'ZZ 104', 'DOH', 'KHI', '2027-01-18T03:10', '2027-01-18T07:20'),
  fl('f5y', Y, 'ZZ 104', 'DOH', 'KHI', '2027-01-18T03:10', '2027-01-18T07:20'),
  fl('f5s', S, 'ZZ 104', 'DOH', 'KHI', '2027-01-18T03:10', '2027-01-18T07:20'),
  { id: 'd1', kind: 'doc', person: 'all', title: 'Makkah Hotel', category: 'Hotel' },
  { id: 't1', kind: 'todo', person: 'all', title: 'Tawaf' },
];

const AIR: Record<string, [string, string]> = { KHI: ['Karachi', 'Asia/Karachi'], DOH: ['Doha', 'Asia/Qatar'], JED: ['Jeddah', 'Asia/Riyadh'], LHR: ['London', 'Europe/London'] };
export const opt: PlanOptions = { zoneOf: (c) => AIR[c || '']?.[1], airportCity: (c) => AIR[c || '']?.[0] };
export const utc = (s: string) => Date.parse(s + 'Z');
