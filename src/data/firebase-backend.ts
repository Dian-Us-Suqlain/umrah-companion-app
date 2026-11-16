/* The real server: Firebase Authentication and Cloud Firestore. The database rules in `firestore.rules` are the
   guard; this file only shapes requests so that sending one twice equals sending it once. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getIdToken,
  onIdTokenChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  clearIndexedDbPersistence,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';

import { INVITE_LIFETIME_MS, generateCode, isCodeShape, normaliseCode, type Invite } from '@/core/groups/invites';
import { cleanEmail, cleanName, newOwnGroup, ownGroupId, type Group, type Role } from '@/core/groups/rules';

import { AppError, type ActiveInvite, type Backend, type Problem, type User } from './backend';
import { firebase, forgetConnection } from './firebase';

const KEYS = { invite: (groupId: string) => `uc.invite.${groupId}`, deleting: 'uc.deleting', prefix: 'uc.' };

const PROBLEMS: Record<string, Problem> = {
  'auth/email-already-in-use': 'email-in-use',
  'auth/invalid-credential': 'wrong-credentials',
  'auth/wrong-password': 'wrong-credentials',
  'auth/user-not-found': 'wrong-credentials',
  'auth/weak-password': 'weak-password',
  'auth/invalid-email': 'invalid-email',
  'auth/network-request-failed': 'offline',
  'auth/too-many-requests': 'too-many-tries',
  'firestore/unavailable': 'offline',
  'firestore/permission-denied': 'not-allowed',
};
const fail = (e: unknown): never => {
  if (e instanceof AppError) throw e;
  const code = String((e as { code?: string })?.code ?? '');
  throw new AppError(PROBLEMS[code] ?? 'unknown', `${code} ${(e as Error)?.message ?? e}`);
};
/** Runs a request and turns Firebase's errors into the app's own. */
const attempt = <T>(fn: () => Promise<T>): Promise<T> => fn().catch(fail);

const toUser = (u: FirebaseUser): User => ({ id: u.uid, name: u.displayName ?? '', email: u.email ?? '', emailConfirmed: u.emailVerified });

type StoredGroup = { name: string; createdBy: string; members: Record<string, { name: string }>; memberIds: string[]; admins: string[] };
const toGroup = (id: string, d: StoredGroup): Group => ({
  id,
  name: d.name,
  createdBy: d.createdBy,
  members: Object.fromEntries(Object.entries(d.members).map(([uid, m]) => [uid, { name: m.name, role: d.admins.includes(uid) ? ('admin' as Role) : ('member' as Role) }])),
});
const toStored = (g: Group): StoredGroup => ({
  name: g.name,
  createdBy: g.createdBy,
  members: Object.fromEntries(Object.entries(g.members).map(([uid, m]) => [uid, { name: m.name }])),
  memberIds: Object.keys(g.members),
  admins: Object.keys(g.members).filter((uid) => g.members[uid].role === 'admin'),
});

const hashOf = (code: string): Promise<string> => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, normaliseCode(code));
const millis = (stamp: unknown): number => (stamp && typeof (stamp as { toMillis?: unknown }).toMillis === 'function' ? (stamp as { toMillis(): number }).toMillis() : Date.now());

export function firebaseBackend(): Backend {
  const { auth, db } = firebase();
  const me = (): FirebaseUser => auth.currentUser ?? fail(new AppError('not-allowed', 'not signed in'));
  const groupRef = (id: string) => doc(db, 'groups', id);
  const inviteRef = (id: string) => doc(db, 'groups', id, 'admin', 'invite');
  let tellUser: ((u: User | null) => void) | null = null;
  let deleting = false;

  /** Writes wait silently when there is no network. Asking the server first makes them fail plainly instead. */
  const online = async () => {
    await getDocFromServer(doc(db, 'users', me().uid));
  };

  /** The user record and the own group, created once. Safe to run on every sign-in. */
  const ensureAccount = async (u: FirebaseUser, name: string) => {
    await setDoc(doc(db, 'users', u.uid), { name });
    const own = groupRef(ownGroupId(u.uid));
    if (!(await getDocFromServer(own)).exists()) await setDoc(own, toStored(newOwnGroup(u.uid, name)));
  };

  /** Keeps the names shown before joining up to date. Best effort: the code still works if this fails. */
  const syncInvite = async (groupId: string, names: { groupName?: string; adminName?: string }, onlyMadeBy?: string) => {
    try {
      const invite = await getDoc(inviteRef(groupId));
      if (!invite.exists() || (onlyMadeBy && invite.data()?.createdBy !== onlyMadeBy)) return;
      await updateDoc(doc(db, 'invites', String(invite.data()?.hash)), names);
    } catch {
      // Not an admin of this group, or the record is gone.
    }
  };

  const leaveOrRemove = (groupId: string, userId: string) =>
    updateDoc(groupRef(groupId), { [`members.${userId}`]: deleteField(), memberIds: arrayRemove(userId), admins: arrayRemove(userId) });

  const dropInvite = async (groupId: string) => {
    const current = await getDoc(inviteRef(groupId));
    const batch = writeBatch(db);
    if (current.exists()) batch.delete(doc(db, 'invites', String(current.data()?.hash)));
    batch.delete(inviteRef(groupId));
    await batch.commit();
    await AsyncStorage.removeItem(KEYS.invite(groupId));
  };

  const finishDeleting = async (plan: { leave: string[]; deleteOwn: string | null }) => {
    if (deleting) return;
    deleting = true;
    try {
      const u = me();
      await AsyncStorage.setItem(KEYS.deleting, JSON.stringify({ uid: u.uid, plan }));
      // Run again after an interruption, a step that is already done is refused by the database
      // ("you are not in that group", "that group is gone"). That refusal means done, so carry on.
      const done = (e: unknown) => {
        if ((e as { code?: string })?.code !== 'firestore/permission-denied') throw e;
      };
      for (const id of plan.leave) await leaveOrRemove(id, u.uid).catch(done);
      if (plan.deleteOwn) {
        await dropInvite(plan.deleteOwn).catch(done);
        await deleteDoc(groupRef(plan.deleteOwn)).catch(done);
      }
      await deleteDoc(doc(db, 'users', u.uid));
      await deleteUser(u);
      await forgetAccount();
    } finally {
      deleting = false;
    }
  };

  /** Nothing of the account stays on the phone. */
  const forgetAccount = async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(KEYS.prefix));
    await AsyncStorage.multiRemove(keys);
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch {
      // The stored copy could not be cleared now; it is unreadable without the account's sign-in.
    }
    forgetConnection();
  };

  return {
    onUser(cb) {
      tellUser = cb;
      return onIdTokenChanged(auth, (u) => {
        cb(u ? toUser(u) : null);
        // An account deletion that was interrupted carries on when the app next opens.
        if (u) {
          void AsyncStorage.getItem(KEYS.deleting).then((stored) => {
            if (!stored) return;
            const kept = JSON.parse(stored) as { uid?: string; plan?: { leave: string[]; deleteOwn: string | null } };
            // The plan belongs to one account. Anyone else signing in on this phone must never inherit it.
            if (kept.uid === u.uid && kept.plan) finishDeleting(kept.plan).catch(() => {});
            else void AsyncStorage.removeItem(KEYS.deleting);
          });
        }
      });
    },

    onGroups(userId, cb) {
      return onSnapshot(
        query(collection(db, 'groups'), where('memberIds', 'array-contains', userId)),
        (snap) => cb(snap.docs.map((d) => toGroup(d.id, d.data() as StoredGroup))),
        () => {}, // a passing error keeps what is already shown; signing out clears it
      );
    },

    signUp: (name, email, password) =>
      attempt(async () => {
        const { user } = await createUserWithEmailAndPassword(auth, cleanEmail(email), password);
        await updateProfile(user, { displayName: cleanName(name) });
        await ensureAccount(user, cleanName(name));
        await sendEmailVerification(user).catch(() => {}); // "Send again" is on Profile
        tellUser?.(toUser(me()));
      }),

    signIn: (email, password) =>
      attempt(async () => {
        const { user } = await signInWithEmailAndPassword(auth, cleanEmail(email), password);
        // Repairs a sign-up that was cut short before the name or the own group was saved.
        const name = cleanName(user.displayName ?? '') || cleanEmail(email).split('@')[0];
        if (!user.displayName) await updateProfile(user, { displayName: name }).catch(() => {});
        await ensureAccount(user, name).catch(() => {});
        tellUser?.(toUser(me()));
      }),

    signOut: () =>
      attempt(async () => {
        await signOut(auth);
        await forgetAccount();
      }),

    sendPasswordReset: (email) =>
      attempt(() => sendPasswordResetEmail(auth, cleanEmail(email))).catch((e) => {
        if (e instanceof AppError && e.problem === 'wrong-credentials') return; // never say whether the address exists
        throw e;
      }),

    sendConfirmation: () => attempt(() => sendEmailVerification(me())),

    refreshUser: () =>
      attempt(async () => {
        await reload(me());
        await getIdToken(me(), true); // the database reads "confirmed" from this token
        tellUser?.(toUser(me()));
      }),

    setName: (name, groupIds) =>
      attempt(async () => {
        const u = me();
        const clean = cleanName(name);
        await online();
        await updateProfile(u, { displayName: clean });
        await setDoc(doc(db, 'users', u.uid), { name: clean });
        for (const id of groupIds) {
          await updateDoc(groupRef(id), { [`members.${u.uid}`]: { name: clean } });
          await syncInvite(id, { adminName: clean }, u.uid);
        }
        tellUser?.(toUser(me()));
      }),

    deleteAccount: (password, plan) =>
      attempt(async () => {
        const u = me();
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email ?? '', password));
        await finishDeleting(plan);
      }),

    renameGroup: (groupId, name) =>
      attempt(async () => {
        await online();
        await updateDoc(groupRef(groupId), { name: cleanName(name) });
        // People about to join see the group's name, so an active code's record follows the rename.
        await syncInvite(groupId, { groupName: cleanName(name) });
      }),

    setRole: (groupId, userId, role) =>
      attempt(async () => (await online(), updateDoc(groupRef(groupId), { admins: role === 'admin' ? arrayUnion(userId) : arrayRemove(userId) }))),

    removeMember: (groupId, userId) => attempt(async () => (await online(), leaveOrRemove(groupId, userId))),

    activeInvite: (groupId) =>
      attempt(async (): Promise<ActiveInvite | null> => {
        const snap = await getDoc(inviteRef(groupId));
        if (!snap.exists()) return null;
        const expiresAt = millis(snap.data()?.createdAt) + INVITE_LIFETIME_MS;
        if (expiresAt <= Date.now()) return null;
        const kept = JSON.parse((await AsyncStorage.getItem(KEYS.invite(groupId))) ?? 'null') as { code: string; hash: string } | null;
        return { code: kept && kept.hash === snap.data()?.hash ? kept.code : null, expiresAt };
      }),

    createInvite: (group, adminId) =>
      attempt(async (): Promise<ActiveInvite> => {
        await online();
        const code = generateCode((n) => Crypto.getRandomBytes(n));
        const hash = await hashOf(code);
        const old = await getDoc(inviteRef(group.id));
        const batch = writeBatch(db);
        if (old.exists() && old.data()?.hash !== hash) batch.delete(doc(db, 'invites', String(old.data()?.hash)));
        batch.set(inviteRef(group.id), { hash, createdAt: serverTimestamp(), createdBy: adminId });
        batch.set(doc(db, 'invites', hash), {
          groupId: group.id,
          groupName: group.name,
          adminName: group.members[adminId]?.name ?? '',
          createdBy: adminId,
          createdAt: serverTimestamp(),
        });
        await batch.commit();
        await AsyncStorage.setItem(KEYS.invite(group.id), JSON.stringify({ code, hash }));
        return { code, expiresAt: Date.now() + INVITE_LIFETIME_MS };
      }),

    cancelInvite: (groupId) => attempt(async () => (await online(), dropInvite(groupId))),

    lookupInvite: (code) =>
      attempt(async (): Promise<Invite | null> => {
        if (!isCodeShape(normaliseCode(code))) return null;
        const snap = await getDocFromServer(doc(db, 'invites', await hashOf(code)));
        const d = snap.data();
        if (!snap.exists() || !d) return null;
        const expiresAt = millis(d.createdAt) + INVITE_LIFETIME_MS;
        return expiresAt <= Date.now() ? null : { groupId: d.groupId, groupName: d.groupName, adminName: d.adminName, createdBy: d.createdBy, expiresAt };
      }),

    join: (code, invite, user) =>
      attempt(async () => {
        await online();
        // Already in the group (a second tap, or a retry): nothing to do. Outsiders cannot read it, which is expected.
        const mine = await getDoc(groupRef(invite.groupId)).catch(() => null);
        if (mine?.exists() && user.id in ((mine.data() as StoredGroup).members ?? {})) return;
        const batch = writeBatch(db);
        batch.set(doc(db, 'groups', invite.groupId, 'joins', user.id), { hash: await hashOf(code) });
        batch.update(groupRef(invite.groupId), { [`members.${user.id}`]: { name: user.name }, memberIds: arrayUnion(user.id) });
        await batch.commit();
        // The hash was only needed for the database to check the join; nothing of the code stays behind.
        await deleteDoc(doc(db, 'groups', invite.groupId, 'joins', user.id)).catch(() => {});
      }).catch((e) => {
        // The database refuses a wrong, expired or cancelled code the same way.
        throw e instanceof AppError && e.problem === 'not-allowed' ? new AppError('invalid-code') : e;
      }),

    eraseLocal: () => forgetAccount(),
  };
}
