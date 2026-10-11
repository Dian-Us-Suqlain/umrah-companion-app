import { router } from 'expo-router';
import { act, renderRouter, screen, within } from 'expo-router/testing-library';

// Icons load their font asynchronously, which is noise here.
jest.mock('@expo/vector-icons/Ionicons', () => () => null);

// Noon in Makkah. The sample trip is placed around "today", so this is its third day.
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2027-01-11T09:00:00Z'));
});
afterEach(() => {
  jest.useRealTimers();
});

const go = (path: '/' | '/plan' | '/profile' | '/self-check') => act(() => router.push(path));

test('the app opens on Today and shows the sample trip’s third day', () => {
  renderRouter('./src/app');
  const card = screen.getByTestId('today-card');
  expect(within(card).getByText('DAY 3 · MON 11 JAN')).toBeTruthy();
  expect(within(card).getByText('Makkah')).toBeTruthy();
  expect(screen.getByText('Sample trip')).toBeTruthy();
});

test('a cancelled flight is marked cancelled on Today and never listed as the next thing', () => {
  renderRouter('./src/app');
  expect(screen.getByText('Cancelled')).toBeTruthy();
  expect(screen.getByText('ZZ 310 · Jeddah → Madinah')).toBeTruthy();
  expect(screen.getByText('Tomorrow')).toBeTruthy();
  expect(screen.getByText('Check-out day')).toBeTruthy(); // tomorrow starts with leaving the Makkah hotel
});

test('Plan shows every day, with today marked and the Now line in it', () => {
  renderRouter('./src/app');
  go('/plan');
  const today = screen.getByTestId('plan-today');
  expect(within(today).getByText('DAY 3 · MON 11 JAN · Makkah')).toBeTruthy();
  expect(within(today).getByText('NOW')).toBeTruthy();
  expect(within(today).getByText('Cancelled')).toBeTruthy();
  expect(screen.getByText('DAY 1 · SAT 9 JAN · Makkah')).toBeTruthy();
  expect(screen.getByText('DAY 7 · FRI 15 JAN · Madinah · leaving')).toBeTruthy();
  expect(screen.getAllByText('No fixed plans').length).toBe(2); // days 2 and 6
  expect(screen.getByText('Train to Madinah')).toBeTruthy();
  expect(screen.getByText('No transport saved from Madinah to Jeddah airport')).toBeTruthy();
});

test('Profile shows the version and app type, and opens the self-check, which passes', () => {
  renderRouter('./src/app');
  go('/profile');
  expect(within(screen.getByTestId('variant')).getByText('Development')).toBeTruthy();
  expect(screen.getAllByText('Coming later').length).toBe(3);
  go('/self-check');
  expect(screen.getByTestId('self-check-result').props.children).toMatch(/^All \d+ checks passed/);
});
