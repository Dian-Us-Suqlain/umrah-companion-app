// Proves firestore.rules against the local emulator: acceptance criterion 7 of spec 002, sentence by sentence.
// Run with `npm run test:rules`. Invented people only: A owns a group, B is a member of it, X is outside it.
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch, deleteField, arrayUnion, arrayRemove, serverTimestamp, Timestamp } = require('firebase/firestore');
const { readFileSync } = require('node:fs');
const { after, before, beforeEach, describe, test } = require('node:test');

const HASH = 'a'.repeat(64);
const OTHER_HASH = 'b'.repeat(64);
const DAY = 864e5;
let env;

const db = (uid, confirmed = true) => env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: confirmed }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const group = (owner, members = {}, admins = [owner]) => ({
  name: 'Khan family',
  createdBy: owner,
  members: { [owner]: { name: owner.toUpperCase() }, ...members },
  memberIds: [owner, ...Object.keys(members)],
  admins,
});
/** A stored invite made `ageMs` ago (seeded with the rules off). */
const invite = (by, ageMs = DAY) => ({ hash: HASH, createdAt: Timestamp.fromMillis(Date.now() - ageMs), createdBy: by });
/** An invite as an admin's phone writes it: stamped by the database. */
const fresh = (by, hash = HASH) => ({ hash, createdAt: serverTimestamp(), createdBy: by });
const lookup = (by, createdAt = serverTimestamp()) => ({ groupId: 'own_a', groupName: 'Khan family', adminName: 'A', createdBy: by, createdAt });

/** Sets up data with the rules switched off. */
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
const seedFamily = (extra = {}) =>
  seed(async (d) => {
    await setDoc(doc(d, 'groups/own_a'), group('a', { b: { name: 'B' }, ...extra.members }, extra.admins ?? ['a']));
    await setDoc(doc(d, 'groups/own_a/admin/invite'), extra.invite ?? invite('a'));
    await setDoc(doc(d, `invites/${HASH}`), lookup('a', Timestamp.fromMillis(Date.now() - DAY)));
    await setDoc(doc(d, 'groups/own_y'), group('y'));
    await setDoc(doc(d, 'users/a'), { name: 'A' });
  });

/** The join as the app does it: the code's hash and the membership in one batch. */
const join = (d, uid, gid = 'own_a', hash = HASH, entry = { name: uid.toUpperCase() }) => {
  const b = writeBatch(d);
  b.set(doc(d, `groups/${gid}/joins/${uid}`), { hash });
  b.update(doc(d, `groups/${gid}`), { [`members.${uid}`]: entry, memberIds: arrayUnion(uid) });
  return b.commit();
};

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-umrah-companion', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
after(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seedFamily();
});

describe('someone not signed in reads nothing', () => {
  test('no group, invite, user or admin record', async () => {
    for (const path of ['groups/own_a', `invites/${HASH}`, 'users/a', 'groups/own_a/admin/invite']) await assertFails(getDoc(doc(anon(), path)));
  });
  test('and writes nothing', async () => {
    await assertFails(setDoc(doc(anon(), 'groups/own_z'), group('z')));
    await assertFails(updateDoc(doc(anon(), 'groups/own_a'), { name: 'Taken' }));
  });
});

describe('a member of one group cannot read or change another group', () => {
  test('members read their own group; outsiders do not', async () => {
    await assertSucceeds(getDoc(doc(db('a'), 'groups/own_a')));
    await assertSucceeds(getDoc(doc(db('b'), 'groups/own_a')));
    await assertFails(getDoc(doc(db('y'), 'groups/own_a')));
    await assertFails(getDoc(doc(db('b'), 'groups/own_y')));
  });
  test('a person can list the groups they are in, and only those', async () => {
    await assertSucceeds(getDocs(query(collection(db('b'), 'groups'), where('memberIds', 'array-contains', 'b'))));
    await assertFails(getDocs(collection(db('b'), 'groups')));
    await assertFails(getDocs(query(collection(db('b'), 'groups'), where('memberIds', 'array-contains', 'y'))));
  });
  test('an admin of one group cannot change another', async () => {
    await assertFails(updateDoc(doc(db('y'), 'groups/own_a'), { name: 'Taken' }));
    await assertFails(updateDoc(doc(db('y'), 'groups/own_a'), { 'members.b': deleteField(), memberIds: arrayRemove('b') }));
    await assertFails(getDoc(doc(db('y'), 'groups/own_a/admin/invite')));
    await assertFails(setDoc(doc(db('y'), 'groups/own_a/admin/invite'), fresh('y')));
  });
});

describe('a member cannot do any admin action', () => {
  test('rename, promote, remove someone, make or read or cancel the invite', async () => {
    await seed((d) => updateDoc(doc(d, 'groups/own_a'), { 'members.c': { name: 'C' }, memberIds: arrayUnion('c') }));
    const b = db('b');
    await assertFails(updateDoc(doc(b, 'groups/own_a'), { name: 'Renamed' }));
    await assertFails(updateDoc(doc(b, 'groups/own_a'), { admins: arrayUnion('b') }));
    await assertFails(updateDoc(doc(b, 'groups/own_a'), { 'members.c': deleteField(), memberIds: arrayRemove('c') }));
    await assertFails(getDoc(doc(b, 'groups/own_a/admin/invite')));
    await assertFails(setDoc(doc(b, 'groups/own_a/admin/invite'), fresh('b')));
    await assertFails(deleteDoc(doc(b, 'groups/own_a/admin/invite')));
    await assertFails(deleteDoc(doc(b, `invites/${HASH}`)));
  });
  test('an admin can do each of them', async () => {
    const a = db('a');
    await assertSucceeds(updateDoc(doc(a, 'groups/own_a'), { name: 'Renamed' }));
    await assertSucceeds(updateDoc(doc(a, 'groups/own_a'), { admins: arrayUnion('b') }));
    await assertSucceeds(updateDoc(doc(a, 'groups/own_a'), { admins: arrayRemove('b') }));
    await assertSucceeds(updateDoc(doc(a, 'groups/own_a'), { 'members.b': deleteField(), memberIds: arrayRemove('b') }));
    await assertSucceeds(getDoc(doc(a, 'groups/own_a/admin/invite')));
  });
  test('an admin corrects their own name but cannot rewrite anyone else\'s entry', async () => {
    const a = db('a');
    await assertSucceeds(updateDoc(doc(a, 'groups/own_a'), { 'members.a': { name: 'Aisha' } }));
    await assertFails(updateDoc(doc(a, 'groups/own_a'), { 'members.b': { name: 'Changed by admin' } }));
    await assertFails(updateDoc(doc(a, 'groups/own_a'), { 'members.b': { name: 'B', extra: 'x'.repeat(5000) } }));
    await assertFails(updateDoc(doc(a, 'groups/own_a'), { 'members.a': { name: 'x'.repeat(61) } }));
  });
  test('a member can leave, and can correct their own name, and nothing else', async () => {
    const b = db('b');
    await assertSucceeds(updateDoc(doc(b, 'groups/own_a'), { 'members.b': { name: 'Bilal' } }));
    await assertFails(updateDoc(doc(b, 'groups/own_a'), { 'members.a': { name: 'Changed' } }));
    await assertFails(updateDoc(doc(b, 'groups/own_a'), { 'members.b': { name: 'Bilal', role: 'admin' } }));
    await assertSucceeds(updateDoc(doc(b, 'groups/own_a'), { 'members.b': deleteField(), memberIds: arrayRemove('b') }));
  });
});

describe('nobody can add someone else to a group', () => {
  test('not an admin', async () => {
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), { 'members.x': { name: 'X' }, memberIds: arrayUnion('x') }));
  });
  test('not a member, and not an outsider adding a friend along with themselves', async () => {
    await assertFails(updateDoc(doc(db('b'), 'groups/own_a'), { 'members.x': { name: 'X' }, memberIds: arrayUnion('x') }));
    const x = db('x');
    const batch = writeBatch(x);
    batch.set(doc(x, 'groups/own_a/joins/x'), { hash: HASH });
    batch.update(doc(x, 'groups/own_a'), { 'members.x': { name: 'X' }, 'members.z': { name: 'Z' }, memberIds: arrayUnion('x', 'z') });
    await assertFails(batch.commit());
  });
});

describe('joining needs a valid invite and gives no admin role', () => {
  test('with the current code and a confirmed email, a person adds themselves', async () => {
    await assertSucceeds(join(db('x'), 'x'));
    await assertSucceeds(getDoc(doc(db('x'), 'groups/own_a')));
  });
  test('not without a code, with a wrong code, or with another group\'s code', async () => {
    const x = db('x');
    await assertFails(updateDoc(doc(x, 'groups/own_a'), { 'members.x': { name: 'X' }, memberIds: arrayUnion('x') }));
    await assertFails(join(x, 'x', 'own_a', OTHER_HASH));
    await assertFails(join(x, 'x', 'own_y', HASH));
  });
  test('not with an expired code', async () => {
    await seed((d) => setDoc(doc(d, 'groups/own_a/admin/invite'), invite('a', 7 * DAY + 1000)));
    await assertFails(join(db('x'), 'x'));
  });
  test('not with a cancelled code, or an old code after a new one was made', async () => {
    await seed((d) => deleteDoc(doc(d, 'groups/own_a/admin/invite')));
    await assertFails(join(db('x'), 'x'));
    await seed((d) => setDoc(doc(d, 'groups/own_a/admin/invite'), { ...invite('a'), hash: OTHER_HASH }));
    await assertFails(join(db('x'), 'x'));
    await assertSucceeds(join(db('x'), 'x', 'own_a', OTHER_HASH));
  });
  test('not with an unconfirmed email', async () => {
    await assertFails(join(db('x', false), 'x'));
  });
  test('nobody makes themselves admin while joining', async () => {
    const x = db('x');
    const batch = writeBatch(x);
    batch.set(doc(x, 'groups/own_a/joins/x'), { hash: HASH });
    batch.update(doc(x, 'groups/own_a'), { 'members.x': { name: 'X' }, memberIds: arrayUnion('x'), admins: arrayUnion('x') });
    await assertFails(batch.commit());
    await assertFails(join(x, 'x', 'own_a', HASH, { name: 'X', role: 'admin' }));
  });
  test('after joining, the person removes the record of the code they used', async () => {
    await join(db('x'), 'x');
    await assertSucceeds(deleteDoc(doc(db('x'), 'groups/own_a/joins/x')));
    await assertSucceeds(getDoc(doc(db('x'), 'groups/own_a'))); // still a member
    await assertFails(deleteDoc(doc(db('a'), 'groups/own_a/joins/zz')));
  });
  test('the code a person joined with is readable only by them', async () => {
    await join(db('x'), 'x');
    await assertSucceeds(getDoc(doc(db('x'), 'groups/own_a/joins/x')));
    await assertFails(getDoc(doc(db('a'), 'groups/own_a/joins/x')));
    await assertFails(getDoc(doc(db('b'), 'groups/own_a/joins/x')));
  });
});

describe('invites cannot be listed', () => {
  test('one invite can be looked up by its exact hash by anyone signed in', async () => {
    await assertSucceeds(getDoc(doc(db('x'), `invites/${HASH}`)));
  });
  test('but never listed or searched, even by the admin who made it', async () => {
    await assertFails(getDocs(collection(db('x'), 'invites')));
    await assertFails(getDocs(query(collection(db('a'), 'invites'), where('groupId', '==', 'own_a'))));
  });
  test('an admin with a confirmed email makes a new code; the lookup record must match it', async () => {
    const make = (d, by, hash) => {
      const batch = writeBatch(d);
      batch.set(doc(d, 'groups/own_a/admin/invite'), fresh(by, hash));
      batch.set(doc(d, `invites/${hash}`), lookup(by));
      return batch.commit();
    };
    await assertSucceeds(make(db('a'), 'a', OTHER_HASH));
    await assertFails(make(db('a', false), 'a', 'c'.repeat(64)));
    await assertFails(make(db('b'), 'b', 'c'.repeat(64)));
    // A lookup record for a code that is not the group's current one is refused.
    await assertFails(setDoc(doc(db('a'), `invites/${'d'.repeat(64)}`), lookup('a')));
  });
  test('an admin can correct the names shown before joining, and nothing else about a code', async () => {
    await assertSucceeds(updateDoc(doc(db('a'), `invites/${HASH}`), { groupName: 'Renamed' }));
    await assertFails(updateDoc(doc(db('a'), `invites/${HASH}`), { groupId: 'own_y' }));
    await assertFails(updateDoc(doc(db('a'), `invites/${HASH}`), { createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db('b'), `invites/${HASH}`), { groupName: 'Renamed' }));
    await assertFails(updateDoc(doc(db('x'), `invites/${HASH}`), { groupName: 'Renamed' }));
  });
  test('a code is stamped by the database, so a phone cannot make one that lasts longer than 7 days', async () => {
    await assertSucceeds(setDoc(doc(db('a'), 'groups/own_a/admin/invite'), fresh('a')));
    await assertFails(setDoc(doc(db('a'), 'groups/own_a/admin/invite'), invite('a', -30 * DAY)));
    await assertFails(setDoc(doc(db('a'), 'groups/own_a/admin/invite'), invite('a', DAY)));
  });
  test('a code works until 7 days after it was made', async () => {
    await seed((d) => setDoc(doc(d, 'groups/own_a/admin/invite'), invite('a', 7 * DAY - 60000)));
    await assertSucceeds(join(db('x'), 'x'));
  });
});

describe('no write can leave a group with members and no admin', () => {
  test('the only admin cannot step down or leave while others remain', async () => {
    const a = db('a');
    await assertFails(updateDoc(doc(a, 'groups/own_a'), { admins: arrayRemove('a') }));
    await assertFails(updateDoc(doc(a, 'groups/own_a'), { admins: [] }));
    await assertFails(updateDoc(doc(a, 'groups/own_a'), { 'members.a': deleteField(), memberIds: arrayRemove('a'), admins: arrayRemove('a') }));
  });
  test('with two admins, one can step down; the group still has an admin', async () => {
    await seed((d) => updateDoc(doc(d, 'groups/own_a'), { admins: ['a', 'b'] }));
    await assertSucceeds(updateDoc(doc(db('b'), 'groups/own_a'), { admins: arrayRemove('b') }));
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), { admins: arrayRemove('a') }));
  });
  test('an admin list naming someone who is not a member is refused', async () => {
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), { admins: ['a', 'ghost'] }));
  });
  test('the member list and the members must always agree', async () => {
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), { memberIds: ['a'] }));
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), { 'members.b': deleteField() }));
  });
});

describe('own groups', () => {
  test('a person creates only their own group, with only themselves in it', async () => {
    await assertSucceeds(setDoc(doc(db('z'), 'groups/own_z'), { ...group('z'), name: 'My group' }));
    await assertFails(setDoc(doc(db('w'), 'groups/own_q'), group('w')));
    await assertFails(setDoc(doc(db('w'), 'groups/anything'), group('w')));
    await assertFails(setDoc(doc(db('w'), 'groups/own_w'), group('w', { v: { name: 'V' } })));
  });
  test('a person can see that their own group does not exist yet, and nothing about anyone else\'s', async () => {
    await assertSucceeds(getDoc(doc(db('z'), 'groups/own_z')));
    await assertFails(getDoc(doc(db('z'), 'groups/own_q')));
    await assertFails(getDoc(doc(db('z'), 'groups/own_a')));
  });
  test('another admin cannot remove the owner from their own group', async () => {
    await seed((d) => updateDoc(doc(d, 'groups/own_a'), { admins: ['a', 'b'] }));
    await assertFails(updateDoc(doc(db('b'), 'groups/own_a'), { 'members.a': deleteField(), memberIds: arrayRemove('a'), admins: arrayRemove('a') }));
  });
  test('after the owner has left, the remaining admin still manages the group', async () => {
    await seed((d) => setDoc(doc(d, 'groups/own_gone'), { name: 'Trip', createdBy: 'gone', members: { b: { name: 'B' }, c: { name: 'C' } }, memberIds: ['b', 'c'], admins: ['b'] }));
    await assertSucceeds(updateDoc(doc(db('b'), 'groups/own_gone'), { name: 'Renamed' }));
    await assertSucceeds(updateDoc(doc(db('b'), 'groups/own_gone'), { admins: arrayUnion('c') }));
    await assertSucceeds(updateDoc(doc(db('b'), 'groups/own_gone'), { 'members.c': deleteField(), memberIds: arrayRemove('c'), admins: arrayRemove('c') }));
  });
  test('the owner leaves their own group only when another admin stays', async () => {
    const leave = { 'members.a': deleteField(), memberIds: arrayRemove('a'), admins: arrayRemove('a') };
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), leave));
    await seed((d) => updateDoc(doc(d, 'groups/own_a'), { admins: ['a', 'b'] }));
    await assertSucceeds(updateDoc(doc(db('a'), 'groups/own_a'), leave));
  });
  test('repeating a step of account deletion is refused, never half-applied', async () => {
    await assertFails(updateDoc(doc(db('x'), 'groups/own_a'), { 'members.x': deleteField(), memberIds: arrayRemove('x'), admins: arrayRemove('x') }));
    await assertFails(deleteDoc(doc(db('x'), 'groups/own_x')));
  });
  test('the owner deletes it only once nobody else is in it', async () => {
    await assertFails(deleteDoc(doc(db('a'), 'groups/own_a')));
    await assertFails(deleteDoc(doc(db('b'), 'groups/own_a')));
    await assertSucceeds(deleteDoc(doc(db('y'), 'groups/own_y')));
  });
  test('who created a group never changes', async () => {
    await assertFails(updateDoc(doc(db('a'), 'groups/own_a'), { createdBy: 'b' }));
  });
});

describe('users', () => {
  test('a person reads and edits only their own name', async () => {
    await assertSucceeds(getDoc(doc(db('a'), 'users/a')));
    await assertSucceeds(setDoc(doc(db('a'), 'users/a'), { name: 'Aisha' }));
    await assertFails(getDoc(doc(db('b'), 'users/a')));
    await assertFails(setDoc(doc(db('b'), 'users/a'), { name: 'Changed' }));
    await assertFails(setDoc(doc(db('a'), 'users/a'), { name: '' }));
    await assertFails(setDoc(doc(db('a'), 'users/a'), { name: 'Aisha', admin: true }));
  });
});
