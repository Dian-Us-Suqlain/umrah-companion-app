/* The new look's promises: the tutorial, four tabs, and the rules for every age (spec 004). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render } from '@testing-library/react-native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { getBackend } from '@/data/default-backend';
import type { MemoryBackend } from '@/data/memory-backend';
import { Button, Field, IconButton, Row, Txt } from '@/ui/components';
import { MAIN_BUTTON, MIN_TARGET } from '@/ui/theme';
import { TUTORIAL_SEEN_KEY } from '@/ui/tutorial';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);

// Reading the source files, for the test that screens take colours and sizes from the theme.
type Files = { readdirSync(dir: string): string[]; statSync(path: string): { isDirectory(): boolean }; readFileSync(path: string, encoding: 'utf8'): string };
const { readdirSync, readFileSync, statSync } = jest.requireActual<Files>('fs');
const join = (a: string, b: string) => `${a}/${b}`;

const resetBackend = (jest.requireMock('@/data/default-backend') as { resetBackend(): void }).resetBackend;
const press = (id: string) => fireEvent.press(screen.getByTestId(id));
const type = (id: string, text: string) => fireEvent.changeText(screen.getByTestId(id), text);
const seen = () => AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
const started = () => waitFor(() => expect(screen.queryByTestId('starting')).toBeNull());

beforeEach(() => resetBackend());

describe('the tutorial', () => {
  beforeEach(() => AsyncStorage.removeItem(TUTORIAL_SEEN_KEY)); // a fresh install
  afterAll(() => AsyncStorage.setItem(TUTORIAL_SEEN_KEY, '1'));

  test('a first launch opens it; Next, Back and Skip move through the three screens', async () => {
    renderRouter('./src/app');
    expect(await screen.findByTestId('tutorial-1')).toBeTruthy();
    expect(screen.getByText('Your whole Umrah trip in one place')).toBeTruthy();
    expect(screen.getByText('The talbiyah · Sahih al-Bukhari 1549')).toBeTruthy(); // religious text names its source
    expect(screen.queryByTestId('tutorial-back')).toBeNull();
    press('tutorial-next');
    expect(screen.getByTestId('tutorial-2')).toBeTruthy();
    press('tutorial-back');
    expect(screen.getByTestId('tutorial-1')).toBeTruthy();
    press('tutorial-skip');
    expect(screen.getByTestId('tutorial-3')).toBeTruthy();
    expect(screen.queryByTestId('tutorial-skip')).toBeNull();
  });

  test('"Look around first" lands on Today with the sample trip, and the next launch opens straight on Today', async () => {
    const first = renderRouter('./src/app');
    await screen.findByTestId('tutorial-1');
    press('tutorial-skip');
    press('tutorial-look');
    expect(await screen.findByTestId('today-card')).toBeTruthy();
    expect(screen.getByText('Sample trip')).toBeTruthy();
    expect(await seen()).toBe('1');
    first.unmount();

    renderRouter('./src/app');
    await started();
    expect(screen.getByTestId('today-card')).toBeTruthy();
    expect(screen.queryByTestId('tutorial-1')).toBeNull();
  });

  test('"Create an account" opens sign-up, and signing up lands on Profile, signed in', async () => {
    renderRouter('./src/app');
    await screen.findByTestId('tutorial-1');
    press('tutorial-skip');
    press('tutorial-create');
    await screen.findByTestId('name');
    type('name', 'Aisha Khan');
    type('email', 'aisha@example.com');
    type('password', 'password-1');
    press('submit');
    expect((await screen.findByTestId('profile-name')).props.children).toBe('Aisha Khan');
  });

  test('closed half-way, it starts again on the next launch', async () => {
    const first = renderRouter('./src/app');
    await screen.findByTestId('tutorial-1');
    press('tutorial-next');
    first.unmount();
    expect(await seen()).toBeNull();
    renderRouter('./src/app');
    expect(await screen.findByTestId('tutorial-1')).toBeTruthy();
  });

  test('someone already signed in is not shown it, now or after signing out', async () => {
    await (getBackend() as MemoryBackend).signUp('Aisha Khan', 'aisha@example.com', 'password-1');
    renderRouter('./src/app');
    await started();
    expect(screen.getByTestId('today-card')).toBeTruthy();
    expect(screen.queryByTestId('tutorial-1')).toBeNull();
    await waitFor(async () => expect(await seen()).toBe('1'));
  });

  test('Profile shows it again; leaving returns to Profile', async () => {
    await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    renderRouter('./src/app', { initialUrl: '/profile' });
    await started();
    press('show-tutorial');
    expect(await screen.findByTestId('tutorial-1')).toBeTruthy();
    press('tutorial-skip');
    press('tutorial-look');
    expect(await screen.findByText('You’re using Umrah Companion as a guest.')).toBeTruthy();
    expect(screen.queryByTestId('tutorial-3')).toBeNull();
  });
});

describe('four tabs', () => {
  test('Today, Plan, Group and Profile, each with its word', async () => {
    renderRouter('./src/app');
    await started();
    for (const tab of ['today', 'plan', 'group', 'profile']) expect(screen.getByTestId(`tab-${tab}`)).toBeTruthy();
    for (const word of ['Plan', 'Group', 'Profile']) expect(screen.getAllByText(word).length).toBeGreaterThan(0);
  });

  test('a guest on the Group tab is told what groups are for, and why a code needs an account', async () => {
    renderRouter('./src/app', { initialUrl: '/group' });
    expect(await screen.findByText('Travel as a group')).toBeTruthy();
    expect(screen.getByTestId('group-create')).toBeTruthy();
    expect(screen.getByTestId('group-sign-in')).toBeTruthy();
    press('group-have-code');
    expect(await screen.findByText(/each person needs their own account/)).toBeTruthy();
  });

  test('a signed-in person sees their group on the Group tab, not on Profile', async () => {
    await (getBackend() as MemoryBackend).signUp('Aisha Khan', 'aisha@example.com', 'password-1');
    renderRouter('./src/app', { initialUrl: '/group' });
    expect((await screen.findByTestId('group-title')).props.children).toBe('My group');
    expect(screen.getByTestId('member-' + (getBackend() as MemoryBackend).groups()[0].createdBy)).toBeTruthy();
  });
});

test('switching groups starts the other group’s view afresh: a half-typed rename does not follow', async () => {
  const server = getBackend() as MemoryBackend;
  await server.signUp('Aisha Khan', 'aisha@example.com', 'password-1');
  server.confirmEmail('aisha@example.com');
  const a = server.groups()[0];
  const { code } = await server.createInvite(a, a.createdBy);
  server.actAs(null);
  await server.signUp('Bilal Ahmed', 'bilal@example.com', 'password-1');
  server.confirmEmail('bilal@example.com');
  const bId = server.groups().find((g) => g.id !== a.id)!.createdBy;
  await server.join(code!, (await server.lookupInvite(code!))!, { id: bId, name: 'Bilal Ahmed', email: 'bilal@example.com', emailConfirmed: true });

  renderRouter('./src/app', { initialUrl: '/group' });
  await screen.findByTestId('group-title'); // Bilal's own group, which he may rename
  press('rename');
  expect(screen.getByTestId('group-name')).toBeTruthy();
  press(`switch-${a.id}`); // Aisha's group, where he is a member
  await waitFor(() => expect(screen.getByText('2 people')).toBeTruthy());
  expect(screen.queryByTestId('group-name')).toBeNull();
  expect(screen.queryByTestId('rename')).toBeNull();
});

describe('rules for every age', () => {
  const heightOf = (id: string) => {
    const s = StyleSheet.flatten(screen.getByTestId(id).props.style);
    return Number(s.minHeight ?? s.height);
  };

  test('everything that can be tapped is at least 48 points tall; the main button 56', () => {
    render(
      <>
        <Button testID="main" title="Go" onPress={() => {}} />
        <Button testID="outline" kind="outline" title="Go" onPress={() => {}} />
        <Button testID="plain" kind="plain" title="Go" onPress={() => {}} />
        <Button testID="danger" kind="danger" title="Go" onPress={() => {}} />
        <IconButton testID="icon" icon="ellipsis-horizontal" label="Options" onPress={() => {}} />
        <Row testID="row" label="A row" onPress={() => {}} />
        <Field testID="field" label="Name" />
      </>,
    );
    expect(MIN_TARGET).toBe(48);
    expect(heightOf('main')).toBe(MAIN_BUTTON);
    for (const id of ['outline', 'plain', 'danger', 'icon', 'row', 'field']) expect(heightOf(id)).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  test('an icon-only button says what it does, and buttons report when they are switched off', () => {
    render(
      <>
        <IconButton testID="icon" icon="ellipsis-horizontal" label="Options for Bilal Ahmed" open={false} onPress={() => {}} />
        <Button testID="off" title="Go" disabled onPress={() => {}} />
      </>,
    );
    expect(screen.getByLabelText('Options for Bilal Ahmed')).toBeTruthy();
    expect(screen.getByTestId('icon').props.accessibilityState).toEqual({ expanded: false });
    expect(screen.getByTestId('off').props.accessibilityState.disabled).toBe(true);
  });

  test('text follows the phone’s text-size setting', () => {
    render(<Txt testID="words">Hello</Txt>);
    expect(screen.getByTestId('words').props.allowFontScaling).not.toBe(false);
  });

  // Every file that draws a screen. Colours and sizes come from the theme, so light and dark cannot drift apart.
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : f.endsWith('.tsx') ? [join(dir, f)] : []));
  const screens = [...files('src/app'), 'src/ui/group-view.tsx', 'src/ui/components.tsx'];
  test.each(screens)('%s: no colour or text size of its own, and never switches text scaling off', (file) => {
    const code = readFileSync(file, 'utf8');
    expect(code).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/); // a colour written by hand
    expect(code).not.toMatch(/<Txt[^>]*\bsize=\{\d/); // a text size written by hand (icon sizes are not text)
    expect(code).not.toMatch(/fontSize:\s*\d/);
    expect(code).not.toMatch(/allowFontScaling=\{false\}/);
  });
});

test('the app survives the tutorial flag being unreadable', async () => {
  const broken = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage'));
  renderRouter('./src/app');
  expect(await screen.findByTestId('tutorial-1')).toBeTruthy(); // treated as not seen: the tutorial is harmless to repeat
  broken.mockRestore();
  await act(async () => {});
});
