import {
  CODE_ALPHABET,
  INVITE_LIFETIME_MS,
  canJoin,
  formatCode,
  generateCode,
  isCodeShape,
  newInvite,
  normaliseCode,
} from '../invites';
import {
  DEFAULT_GROUP_NAME,
  canInvite,
  canLeave,
  canRemove,
  canRename,
  canSetRole,
  cleanEmail,
  cleanName,
  deletionBlockers,
  deletionSteps,
  hasAdminIfMembers,
  newOwnGroup,
  ownGroupId,
  resolveCurrentGroup,
  validEmail,
  validName,
  validPassword,
  withMember,
  withName,
  withRole,
  withoutMember,
  type Group,
} from '../rules';

// Invented people. A owns the group; B and C joined it.
const own = newOwnGroup('a', 'Aisha');
const family = withMember(withMember(own, 'b', 'Bilal'), 'c', 'Sara');
const twoAdmins = withRole(family, 'b', 'admin');
const why = (v: { ok: boolean; why?: string }) => (v.ok ? 'ok' : v.why);

describe('own group', () => {
  test('is created with the account: named "My group", the person is its admin', () => {
    expect(own).toEqual({ id: 'own_a', name: DEFAULT_GROUP_NAME, createdBy: 'a', members: { a: { role: 'admin', name: 'Aisha' } } });
  });
  test('has an id derived from the account, so creating it twice gives the same group', () => {
    expect(newOwnGroup('a', 'Aisha')).toEqual(own);
    expect(ownGroupId('a')).toBe('own_a');
  });
  test('lasts as long as the account: its owner cannot leave it or be removed from it', () => {
    expect(why(canLeave(own, 'a'))).toBe('own-group');
    expect(why(canLeave(twoAdmins, 'a'))).toBe('own-group');
    expect(why(canRemove(twoAdmins, 'b', 'a'))).toBe('own-group');
  });
});

describe('roles', () => {
  test('a group can have more than one admin', () => {
    expect(why(canSetRole(family, 'a', 'b', 'admin'))).toBe('ok');
    expect(twoAdmins.members.b.role).toBe('admin');
  });
  test('only an admin renames, invites, changes roles and removes', () => {
    expect(why(canRename(family, 'a'))).toBe('ok');
    for (const v of [canRename(family, 'b'), canInvite(family, 'b', true), canSetRole(family, 'b', 'c', 'admin'), canRemove(family, 'b', 'c')]) {
      expect(why(v)).toBe('not-admin');
    }
  });
  test('someone outside the group can do nothing', () => {
    for (const v of [canRename(family, 'x'), canInvite(family, 'x', true), canSetRole(family, 'x', 'b', 'admin'), canRemove(family, 'x', 'b'), canLeave(family, 'x')]) {
      expect(why(v)).toBe('not-member');
    }
  });
  test('acting on someone who is not in the group is refused', () => {
    expect(why(canSetRole(family, 'a', 'x', 'admin'))).toBe('target-not-member');
    expect(why(canRemove(family, 'a', 'x'))).toBe('target-not-member');
  });
});

describe('a group always has at least one admin', () => {
  // A group B owns, where B is the only admin and A is a plain member.
  const bs = withMember(newOwnGroup('b', 'Bilal'), 'a', 'Aisha');
  const joined: Group = { id: 'g1', name: 'Trip', createdBy: 'z', members: { a: { role: 'admin', name: 'Aisha' }, b: { role: 'member', name: 'Bilal' } } };

  test('the last admin cannot leave while others remain', () => {
    expect(why(canLeave(joined, 'a'))).toBe('last-admin');
  });
  test('the last admin cannot be demoted while others remain', () => {
    expect(why(canSetRole(joined, 'a', 'a', 'member'))).toBe('last-admin');
    expect(why(canSetRole(bs, 'b', 'b', 'member'))).toBe('last-admin');
  });
  test('with a second admin, either can step down or leave', () => {
    const two = withRole(joined, 'b', 'admin');
    expect(why(canSetRole(two, 'a', 'a', 'member'))).toBe('ok');
    expect(why(canLeave(two, 'a'))).toBe('ok');
  });
  test('an admin can remove a member and another admin', () => {
    expect(why(canRemove(family, 'a', 'b'))).toBe('ok');
    expect(why(canRemove(twoAdmins, 'a', 'b'))).toBe('ok');
  });
  test('a plain member can leave a group they joined', () => {
    expect(why(canLeave(family, 'b'))).toBe('ok');
    expect(hasAdminIfMembers(withoutMember(family, 'b'))).toBe(true);
  });
  test('removing yourself follows the leaving rules', () => {
    expect(why(canRemove(joined, 'a', 'a'))).toBe('last-admin');
    expect(why(canRemove(family, 'b', 'b'))).toBe('ok');
  });
  test('the invariant itself: members with no admin is never valid; an empty group is', () => {
    expect(hasAdminIfMembers(family)).toBe(true);
    expect(hasAdminIfMembers(withRole(family, 'a', 'member'))).toBe(false);
    expect(hasAdminIfMembers({ ...own, members: {} })).toBe(true);
  });
});

describe('changes are safe to repeat', () => {
  test('joining twice adds the person once and keeps their role', () => {
    expect(withMember(family, 'b', 'Bilal')).toBe(family);
    expect(withMember(twoAdmins, 'b', 'Bilal').members.b.role).toBe('admin');
  });
  test('removing twice, promoting twice and renaming twice equal doing it once', () => {
    const once = withoutMember(family, 'b');
    expect(withoutMember(once, 'b')).toEqual(once);
    expect(withRole(twoAdmins, 'b', 'admin')).toEqual(twoAdmins);
    expect(withName(withName(family, 'Khan family'), 'Khan family').name).toBe('Khan family');
  });
  test('changing the role of someone not in the group changes nothing', () => {
    expect(withRole(family, 'x', 'admin')).toBe(family);
  });
});

describe('invite codes', () => {
  const bytes = (seed: number) => (n: number) => Uint8Array.from({ length: n }, (_, i) => (seed + i * 37) % 256);

  test('8 characters, none of them easy to confuse', () => {
    expect(CODE_ALPHABET.length).toBe(31);
    for (const ch of '0O1IL') expect(CODE_ALPHABET.includes(ch)).toBe(false);
    for (let s = 0; s < 50; s++) expect(isCodeShape(generateCode(bytes(s)))).toBe(true);
  });
  test('bytes that would favour some characters are skipped', () => {
    // 248 to 255 are above the last full run of 31, so they must never be used.
    let calls = 0;
    const code = generateCode((n) => (calls++ === 0 ? new Uint8Array(n).fill(255) : new Uint8Array(n).fill(0)));
    expect(code).toBe('AAAAAAAA');
    expect(calls).toBe(2);
  });
  test('shown with a dash; typed with spaces, dashes or lower case still matches', () => {
    expect(formatCode('K7MQ2XWP')).toBe('K7MQ-2XWP');
    expect(normaliseCode(' k7mq-2xwp ')).toBe('K7MQ2XWP');
    expect(isCodeShape(normaliseCode('k7mq 2xwp'))).toBe(true);
  });
  test('wrong length or a confusable character is not a code', () => {
    expect(isCodeShape('K7MQ2XW')).toBe(false);
    expect(isCodeShape('K7MQ2XW0')).toBe(false);
    expect(isCodeShape('')).toBe(false);
  });
  test('an invite names the group and the admin and expires after 7 days', () => {
    const inv = newInvite(withName(family, 'Khan family'), 'a', 1000);
    expect(inv).toEqual({ groupId: 'own_a', groupName: 'Khan family', adminName: 'Aisha', createdBy: 'a', expiresAt: 1000 + INVITE_LIFETIME_MS });
  });
  test('only an admin with a confirmed email can make one', () => {
    expect(why(canInvite(family, 'a', true))).toBe('ok');
    expect(why(canInvite(family, 'a', false))).toBe('email-unconfirmed');
  });
});

describe('joining', () => {
  const inv = newInvite(family, 'a', 0);

  test('a valid code lets someone with a confirmed email join', () => {
    expect(why(canJoin(inv, family, 'x', true, 1))).toBe('ok');
  });
  test('wrong, cancelled and expired codes give the same answer', () => {
    expect(why(canJoin(null, null, 'x', true, 1))).toBe('invalid');
    expect(why(canJoin(inv, family, 'x', true, INVITE_LIFETIME_MS))).toBe('invalid');
    expect(why(canJoin(inv, family, 'x', true, INVITE_LIFETIME_MS - 1))).toBe('ok');
  });
  test('an invalid code is reported as invalid even to someone with an unconfirmed email', () => {
    expect(why(canJoin(null, null, 'x', false, 1))).toBe('invalid');
  });
  test('joining a group you are already in is not an error to fix, just a fact', () => {
    expect(why(canJoin(inv, family, 'b', true, 1))).toBe('already-member');
  });
  test('an unconfirmed email cannot join', () => {
    expect(why(canJoin(inv, family, 'x', false, 1))).toBe('email-unconfirmed');
  });
  test('joining makes a plain member, never an admin', () => {
    expect(withMember(family, 'x', 'Zain').members.x).toEqual({ role: 'member', name: 'Zain' });
  });
});

describe('current group', () => {
  test('stays as chosen while the person is still in it', () => {
    expect(resolveCurrentGroup('g1', ['own_b', 'g1'], 'b')).toBe('g1');
  });
  test('falls back to the own group when removed, or when nothing was chosen', () => {
    expect(resolveCurrentGroup('g1', ['own_b'], 'b')).toBe('own_b');
    expect(resolveCurrentGroup(null, ['own_b', 'g1'], 'b')).toBe('own_b');
  });
});

describe('deleting an account', () => {
  const other: Group = { id: 'g1', name: 'Trip', createdBy: 'z', members: { z: { role: 'admin', name: 'Zain' }, a: { role: 'member', name: 'Aisha' } } };

  test('is blocked while the person is the only admin of a group with other members', () => {
    expect(deletionBlockers([family, other], 'a').map((g) => g.id)).toEqual(['own_a']);
  });
  test('is not blocked when alone in the own group, or when another admin exists', () => {
    expect(deletionBlockers([own, other], 'a')).toEqual([]);
    expect(deletionBlockers([twoAdmins], 'a')).toEqual([]);
  });
  test('leaves joined groups first, then deletes the own group', () => {
    expect(deletionSteps([own, other], 'a')).toEqual({ leave: ['g1'], deleteOwn: 'own_a' });
  });
  test('an own group that others are still in carries on without the person', () => {
    expect(deletionSteps([twoAdmins, other], 'a')).toEqual({ leave: ['own_a', 'g1'], deleteOwn: null });
  });
  test('run again after an interruption, it continues with what is left', () => {
    expect(deletionSteps([own], 'a')).toEqual({ leave: [], deleteOwn: 'own_a' });
    expect(deletionSteps([], 'a')).toEqual({ leave: [], deleteOwn: null });
  });
});

describe('what people type', () => {
  test('names are trimmed, single-spaced and must not be empty', () => {
    expect(cleanName('  Aisha   Khan ')).toBe('Aisha Khan');
    expect(validName('   ')).toBe(false);
    expect(cleanName('x'.repeat(80)).length).toBe(60);
  });
  test('emails are trimmed and lower-cased', () => {
    expect(cleanEmail(' Aisha@Example.com ')).toBe('aisha@example.com');
    expect(validEmail('aisha@example.com')).toBe(true);
    expect(validEmail('aisha@example')).toBe(false);
    expect(validEmail('aisha example@x.com')).toBe(false);
  });
  test('passwords need at least 8 characters', () => {
    expect(validPassword('1234567')).toBe(false);
    expect(validPassword('12345678')).toBe(true);
  });
});
