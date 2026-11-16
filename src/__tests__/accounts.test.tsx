/* Accounts and groups through the real screens, against the in-memory server. Invented people only. */
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { getBackend } from '@/data/default-backend';
import type { MemoryBackend } from '@/data/memory-backend';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);

const resetBackend = (jest.requireMock('@/data/default-backend') as { resetBackend(): void }).resetBackend;
let server: MemoryBackend;

beforeEach(() => {
  resetBackend();
  server = getBackend() as MemoryBackend;
  // Every "are you sure?" is answered yes.
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => buttons?.[buttons.length - 1]?.onPress?.());
});
afterEach(() => jest.restoreAllMocks());

const open = (path = '/profile') => renderRouter('./src/app', { initialUrl: path });
const go = (path: string) => act(() => router.push(path as never));
const type = (id: string, text: string) => fireEvent.changeText(screen.getByTestId(id), text);
const press = (id: string) => fireEvent.press(screen.getByTestId(id));
const see = (text: string | RegExp) => screen.findByText(text);

/** Makes an account straight on the server, as if on another phone. */
async function account(name: string, email: string, confirmed = true) {
  await server.signUp(name, email, 'password-1');
  if (confirmed) server.confirmEmail(email);
  const id = server.groups().find((g) => g.members[g.createdBy].name === name)!.createdBy;
  server.actAs(null);
  return { id, email };
}
async function signUpOnScreen(name = 'Aisha Khan', email = 'aisha@example.com') {
  press('guest-create');
  type('name', name);
  type('email', email);
  type('password', 'password-1');
  press('submit');
  await screen.findByTestId('profile-name');
}

describe('guest', () => {
  test('the app opens as a guest, with nothing asked', async () => {
    open('/');
    expect(await see('Sample trip')).toBeTruthy();
    go('/profile');
    expect(await see('You’re using Umrah Companion as a guest.')).toBeTruthy();
    expect(screen.getByText('Everything stays on this phone.')).toBeTruthy();
  });

  test('joining a group as a guest explains why an account is needed; "Not now" goes back', async () => {
    open();
    press('guest-join');
    expect(await see(/each person needs their own account/)).toBeTruthy();
    press('not-now');
    expect(await see('You’re using Umrah Companion as a guest.')).toBeTruthy();
    expect(server.accounts()).toEqual([]);
  });

  test('a guest can erase what is on the phone', async () => {
    open();
    press('erase-local');
    expect(await see('Data on this phone erased.')).toBeTruthy();
  });
});

describe('sign up', () => {
  test('name, email and password make an account with a group of one that the person is the admin of', async () => {
    open();
    await signUpOnScreen();
    expect(screen.getByTestId('profile-name').props.children).toBe('Aisha Khan');
    expect(screen.getByText('aisha@example.com')).toBeTruthy();
    expect(screen.getByText('Check your email to confirm your address')).toBeTruthy();
    go('/group'); // the group lives on its own tab
    expect((await screen.findByTestId('group-title')).props.children).toBe('My group');
    expect(screen.getByText('1 person · You are the admin')).toBeTruthy();
    expect(server.sent).toEqual([{ to: 'aisha@example.com', kind: 'confirm' }]);
  });

  test('tapping "Create account" twice makes one account', async () => {
    open();
    press('guest-create');
    type('name', 'Aisha Khan');
    type('email', 'aisha@example.com');
    type('password', 'password-1');
    press('submit');
    press('submit');
    await screen.findByTestId('profile-name');
    expect(server.accounts()).toEqual(['aisha@example.com']);
    expect(server.groups().length).toBe(1);
  });

  test('an email that already has an account offers sign-in, and makes no second account', async () => {
    await account('Aisha Khan', 'aisha@example.com');
    open();
    press('guest-create');
    type('name', 'Someone Else');
    type('email', 'Aisha@Example.com ');
    type('password', 'password-2');
    press('submit');
    expect(await see('That email already has an account. Sign in instead?')).toBeTruthy();
    expect(server.accounts().length).toBe(1);
    press('to-sign-in');
    expect(await screen.findByTestId('forgot')).toBeTruthy();
  });

  test('plain errors: short password, missing name, no connection', async () => {
    open();
    press('guest-create');
    type('email', 'aisha@example.com');
    type('password', 'short');
    press('submit');
    expect(await see('Enter your name.')).toBeTruthy();
    type('name', 'Aisha Khan');
    press('submit');
    expect(await see('Password needs at least 8 characters')).toBeTruthy();
    type('password', 'password-1');
    server.online = false;
    press('submit');
    expect(await see('No connection. Try again when you’re online.')).toBeTruthy();
    expect(server.accounts()).toEqual([]);
  });
});

describe('sign in, sign out, reset', () => {
  test('signing out returns to a guest; signing back in restores the groups', async () => {
    open();
    await signUpOnScreen();
    press('sign-out');
    expect(await see('You’re using Umrah Companion as a guest.')).toBeTruthy();
    go('/group');
    expect(await screen.findByTestId('group-guest-note')).toBeTruthy(); // a guest has no group
    expect(screen.queryByTestId('group-title')).toBeNull();
    go('/profile');
    press('guest-sign-in');
    type('email', 'aisha@example.com');
    type('password', 'password-1');
    press('submit');
    await screen.findByTestId('profile-name');
    go('/group');
    expect((await screen.findByTestId('group-title')).props.children).toBe('My group');
  });

  test('a wrong password gives one message that does not say which part was wrong', async () => {
    await account('Aisha Khan', 'aisha@example.com');
    open();
    press('guest-sign-in');
    type('email', 'aisha@example.com');
    type('password', 'wrong-password');
    press('submit');
    expect(await see('That email and password don’t match an account.')).toBeTruthy();
    type('email', 'nobody@example.com');
    press('submit');
    expect(await see('That email and password don’t match an account.')).toBeTruthy();
  });

  test('the reset screen says the same thing whether or not the address has an account', async () => {
    await account('Aisha Khan', 'aisha@example.com');
    open('/account/forgot');
    const said = 'If that address has an account, a reset link is on its way. Check your email.';
    type('email', 'aisha@example.com');
    press('submit');
    expect(await see(said)).toBeTruthy();
    type('email', 'nobody@example.com');
    press('submit');
    await waitFor(() => expect(screen.getByText(said)).toBeTruthy());
    expect(server.sent.filter((m) => m.kind === 'reset')).toEqual([{ to: 'aisha@example.com', kind: 'reset' }]);
  });
});

describe('inviting and joining', () => {
  test('an unconfirmed email cannot invite or join, and is told why', async () => {
    open();
    await signUpOnScreen();
    const own = server.groups()[0];
    go(`/group/${own.id}`);
    expect(await screen.findByTestId('invite-needs-email')).toBeTruthy();
    expect(screen.queryByTestId('new-code')).toBeNull();
    go('/group/join');
    expect(await screen.findByTestId('join-needs-email')).toBeTruthy();
  });

  test('A makes a code; B sees the group and admin names, joins, and both are in the members list', async () => {
    const a = await account('Aisha Khan', 'aisha@example.com');
    const b = await account('Bilal Ahmed', 'bilal@example.com');
    server.actAs(a.email);
    open(`/group/own_${a.id}`);
    expect(await see('Invite people to travel with you')).toBeTruthy();
    press('new-code');
    const shown = String((await screen.findByTestId('invite-code')).props.children);
    expect(shown).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    act(() => server.actAs(b.email));
    go('/group/join');
    type('code', shown.toLowerCase());
    press('find');
    expect(await see('Join My group?')).toBeTruthy();
    expect(screen.getByText('Admin: Aisha Khan')).toBeTruthy();
    press('join');
    expect(await see('2 people')).toBeTruthy(); // on the Group tab, the joined group is now showing
    expect(screen.getByText('2 people · Showing')).toBeTruthy(); // and marked in the list of the person's groups

    go(`/group/own_${a.id}`);
    expect(await screen.findByTestId(`member-${a.id}`)).toBeTruthy();
    expect(screen.getByTestId(`member-${b.id}`)).toBeTruthy();
    expect(screen.queryByTestId('new-code')).toBeNull(); // a member sees no invite controls
    expect(screen.queryByTestId(`remove-${a.id}`)).toBeNull();
  });

  test('wrong, cancelled and expired codes all give the same message', async () => {
    const a = await account('Aisha Khan', 'aisha@example.com');
    const b = await account('Bilal Ahmed', 'bilal@example.com');
    server.actAs(a.email);
    const g = server.groups().find((x) => x.createdBy === a.id)!;
    const { code } = await server.createInvite(g, a.id);
    await server.cancelInvite(g.id);
    server.actAs(b.email);
    open('/group/join');
    const said = 'That code isn’t valid. Ask the group admin for a new one.';
    type('code', 'ZZZZ-ZZZZ');
    press('find');
    expect(await see(said)).toBeTruthy();
    type('code', code!);
    press('find');
    expect(await see(said)).toBeTruthy();
    type('code', 'not a code');
    press('find');
    expect(await see(said)).toBeTruthy();
  });

  test('joining a group you are already in says so, without an error', async () => {
    const a = await account('Aisha Khan', 'aisha@example.com');
    server.actAs(a.email);
    const g = server.groups()[0];
    const { code } = await server.createInvite(g, a.id);
    open('/group/join');
    type('code', code!);
    press('find');
    expect(await see('You’re already in My group')).toBeTruthy();
  });

  test('a new code replaces the old one, and a code made on another phone cannot be shown', async () => {
    const a = await account('Aisha Khan', 'aisha@example.com');
    server.actAs(a.email);
    const g = server.groups()[0];
    const first = await server.createInvite(g, a.id);
    await server.eraseLocal(); // as if this were a different phone
    open(`/group/${g.id}`);
    expect(await screen.findByTestId('code-elsewhere')).toBeTruthy();
    press('new-code');
    const second = String((await screen.findByTestId('invite-code')).props.children).replace('-', '');
    expect(second).not.toBe(first.code);
    expect(await server.lookupInvite(first.code!)).toBeNull();
  });
});

describe('admins and members', () => {
  async function family() {
    const a = await account('Aisha Khan', 'aisha@example.com');
    const b = await account('Bilal Ahmed', 'bilal@example.com');
    server.actAs(a.email);
    const g = server.groups().find((x) => x.createdBy === a.id)!;
    const { code } = await server.createInvite(g, a.id);
    server.actAs(b.email);
    await server.join(code!, (await server.lookupInvite(code!))!, { id: b.id, name: 'Bilal Ahmed', email: b.email, emailConfirmed: true });
    return { a, b, gid: g.id };
  }
  const role = (gid: string, uid: string) => server.groups().find((g) => g.id === gid)!.members[uid]?.role;

  test('an admin can make a member an admin, and remove them', async () => {
    const { a, b, gid } = await family();
    server.actAs(a.email);
    open(`/group/${gid}`);
    expect(screen.queryByTestId(`promote-${b.id}`)).toBeNull(); // the choices are closed until asked for
    press(`options-${b.id}`);
    press(`promote-${b.id}`);
    await screen.findByTestId(`demote-${b.id}`);
    expect(role(gid, b.id)).toBe('admin');
    press(`remove-${b.id}`);
    await waitFor(() => expect(screen.queryByTestId(`member-${b.id}`)).toBeNull());
    expect(role(gid, b.id)).toBeUndefined();
  });

  test('a member can leave a group they joined, and lands back on their own group', async () => {
    const { b, gid } = await family();
    server.actAs(b.email);
    open(`/group/${gid}`);
    press('leave');
    expect(await see('1 person · You are the admin')).toBeTruthy(); // the Group tab, back on their own group
    expect(role(gid, b.id)).toBeUndefined();
  });

  test('the only admin of a joined group cannot leave while others remain, and is told what to do', async () => {
    const { a, b, gid } = await family();
    server.actAs(a.email);
    await server.setRole(gid, b.id, 'admin');
    await server.setRole(gid, a.id, 'member');
    server.actAs(b.email); // B is now the only admin of a group that is not B's own
    open(`/group/${gid}`);
    expect(await screen.findByTestId('last-admin-note')).toBeTruthy();
    expect(screen.getByTestId('leave').props.accessibilityState.disabled).toBe(true);
    press('leave');
    expect(role(gid, b.id)).toBe('admin');
  });

  test('a person cannot leave their own group', async () => {
    const { a, gid } = await family();
    server.actAs(a.email);
    open(`/group/${gid}`);
    expect(await screen.findByTestId('own-group-note')).toBeTruthy();
    expect(screen.queryByTestId('leave')).toBeNull();
  });

  test('removed while away: the group disappears and the app falls back to the own group', async () => {
    const { a, b, gid } = await family();
    server.actAs(b.email);
    open(`/group/${gid}`);
    await screen.findByTestId('group-title');
    await act(async () => {
      server.actAs(a.email); // A, on another phone, removes B
      await server.removeMember(gid, b.id);
      server.actAs(b.email);
    });
    expect(await screen.findByTestId('group-gone')).toBeTruthy();
    go('/group');
    expect(await see('1 person · You are the admin')).toBeTruthy();
  });

  test('an admin renames the group; with no connection the app says so and nothing changes', async () => {
    const { a, gid } = await family();
    server.actAs(a.email);
    open(`/group/${gid}`);
    press('rename');
    type('group-name', 'Khan family');
    server.online = false;
    press('save-name');
    expect(await see('No connection. Try again when you’re online.')).toBeTruthy();
    server.online = true;
    press('save-name');
    expect(await see('Khan family')).toBeTruthy();
    expect(server.groups().find((g) => g.id === gid)!.name).toBe('Khan family');
  });
});

describe('deleting an account', () => {
  test('removes the login and the own group, and returns to a guest', async () => {
    open();
    await signUpOnScreen();
    press('delete-account');
    type('password', 'password-1');
    press('submit');
    expect(await see('You’re using Umrah Companion as a guest.')).toBeTruthy();
    expect(server.accounts()).toEqual([]);
    expect(server.groups()).toEqual([]);
  });

  test('needs the password again', async () => {
    open();
    await signUpOnScreen();
    press('delete-account');
    type('password', 'wrong-password');
    press('submit');
    expect(await see('That email and password don’t match an account.')).toBeTruthy();
    expect(server.accounts()).toEqual(['aisha@example.com']);
  });

  test('is blocked for the only admin of a group that still has other people', async () => {
    const a = await account('Aisha Khan', 'aisha@example.com');
    const b = await account('Bilal Ahmed', 'bilal@example.com');
    server.actAs(a.email);
    const g = server.groups().find((x) => x.createdBy === a.id)!;
    const { code } = await server.createInvite(g, a.id);
    server.actAs(b.email);
    await server.join(code!, (await server.lookupInvite(code!))!, { id: b.id, name: 'Bilal Ahmed', email: b.email, emailConfirmed: true });
    server.actAs(a.email);
    open('/account/delete');
    expect((await screen.findByTestId('delete-blocked')).props.children).toBe('You’re the only admin of My group. Make someone else an admin first.');
    expect(screen.queryByTestId('submit')).toBeNull();
  });

  test('a plain member elsewhere is removed from those groups, which carry on', async () => {
    const a = await account('Aisha Khan', 'aisha@example.com');
    const b = await account('Bilal Ahmed', 'bilal@example.com');
    server.actAs(a.email);
    const g = server.groups().find((x) => x.createdBy === a.id)!;
    const { code } = await server.createInvite(g, a.id);
    server.actAs(b.email);
    await server.join(code!, (await server.lookupInvite(code!))!, { id: b.id, name: 'Bilal Ahmed', email: b.email, emailConfirmed: true });
    open('/account/delete');
    type('password', 'password-1');
    press('submit');
    expect(await see('You’re using Umrah Companion as a guest.')).toBeTruthy();
    expect(server.accounts()).toEqual(['aisha@example.com']);
    expect(server.groups().map((x) => [x.id, Object.keys(x.members)])).toEqual([[g.id, [a.id]]]);
  });
});
