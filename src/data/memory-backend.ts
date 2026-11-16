/* A server that lives in memory, for screen tests. It refuses what the database rules refuse, by using the
   same rules in `src/core/groups`, so a screen that works against it is asking for allowed things. */
import { INVITE_LIFETIME_MS, generateCode, isCodeShape, normaliseCode, type Invite } from '@/core/groups/invites';
import {
  canInvite,
  canLeave,
  canRemove,
  canRename,
  canSetRole,
  cleanEmail,
  cleanName,
  isMember,
  newOwnGroup,
  validPassword,
  withMember,
  withName,
  withRole,
  withoutMember,
  type Group,
  type Verdict,
} from '@/core/groups/rules';

import { AppError, type Backend, type User } from './backend';

type Account = User & { password: string };
type Options = { now?: () => number };

export type MemoryBackend = Backend & {
  /** Test controls. */
  online: boolean;
  confirmEmail(email: string): void;
  groups(): Group[];
  accounts(): string[];
  sent: { to: string; kind: 'confirm' | 'reset' }[];
  /** Signs the phone in as someone else without going through the screens. */
  actAs(email: string | null): void;
};

export function memoryBackend({ now = Date.now }: Options = {}): MemoryBackend {
  const accounts = new Map<string, Account>(); // by email
  let groups = new Map<string, Group>();
  const invites = new Map<string, { code: string; invite: Invite }>(); // by group id
  const madeHere = new Set<string>(); // group ids whose code this phone made
  let current: Account | null = null;
  let userCb: ((u: User | null) => void) | null = null;
  const groupCbs = new Map<string, (g: Group[]) => void>();
  let seq = 0;

  const pub = (a: Account | null): User | null => (a ? { id: a.id, name: a.name, email: a.email, emailConfirmed: a.emailConfirmed } : null);
  const tell = () => {
    userCb?.(pub(current));
    for (const [uid, cb] of groupCbs) cb([...groups.values()].filter((g) => isMember(g, uid)));
  };
  const me = (): Account => {
    if (!current) throw new AppError('not-allowed');
    return current;
  };
  const allowed = (v: Verdict) => {
    if (!v.ok) throw new AppError('not-allowed', v.why);
  };
  const group = (id: string): Group => groups.get(id) ?? (() => { throw new AppError('not-allowed'); })();
  const put = (g: Group) => {
    groups = new Map(groups).set(g.id, g);
    tell();
  };

  const self: MemoryBackend = {
    online: true,
    sent: [],
    confirmEmail(email) {
      const a = accounts.get(cleanEmail(email));
      if (a) a.emailConfirmed = true;
    },
    groups: () => [...groups.values()],
    accounts: () => [...accounts.keys()],
    actAs(email) {
      current = email ? (accounts.get(cleanEmail(email)) ?? null) : null;
      tell();
    },

    onUser(cb) {
      userCb = cb;
      cb(pub(current));
      return () => (userCb = null);
    },
    onGroups(userId, cb) {
      groupCbs.set(userId, cb);
      cb([...groups.values()].filter((g) => isMember(g, userId)));
      return () => void groupCbs.delete(userId);
    },

    async signUp(name, email, password) {
      net();
      const key = cleanEmail(email);
      if (accounts.has(key)) throw new AppError('email-in-use');
      if (!validPassword(password)) throw new AppError('weak-password');
      const a: Account = { id: `u${++seq}`, name: cleanName(name), email: key, emailConfirmed: false, password };
      accounts.set(key, a);
      groups.set(`own_${a.id}`, newOwnGroup(a.id, a.name));
      self.sent.push({ to: key, kind: 'confirm' });
      current = a;
      tell();
    },
    async signIn(email, password) {
      net();
      const a = accounts.get(cleanEmail(email));
      if (!a || a.password !== password) throw new AppError('wrong-credentials');
      current = a;
      tell();
    },
    async signOut() {
      current = null;
      madeHere.clear();
      tell();
    },
    async sendPasswordReset(email) {
      net();
      if (accounts.has(cleanEmail(email))) self.sent.push({ to: cleanEmail(email), kind: 'reset' });
    },
    async sendConfirmation() {
      net();
      self.sent.push({ to: me().email, kind: 'confirm' });
    },
    async refreshUser() {
      net();
      tell();
    },
    async setName(name, groupIds) {
      net();
      const a = me();
      a.name = cleanName(name);
      for (const id of groupIds) {
        const g = group(id);
        groups.set(id, { ...g, members: { ...g.members, [a.id]: { ...g.members[a.id], name: a.name } } });
      }
      tell();
    },
    async deleteAccount(password, plan) {
      net();
      const a = me();
      if (a.password !== password) throw new AppError('wrong-credentials');
      for (const id of plan.leave) groups.set(id, withoutMember(group(id), a.id));
      if (plan.deleteOwn) groups.delete(plan.deleteOwn);
      accounts.delete(a.email);
      current = null;
      tell();
    },

    async renameGroup(groupId, name) {
      net();
      allowed(canRename(group(groupId), me().id));
      put(withName(group(groupId), name));
    },
    async setRole(groupId, userId, role) {
      net();
      allowed(canSetRole(group(groupId), me().id, userId, role));
      put(withRole(group(groupId), userId, role));
    },
    async removeMember(groupId, userId) {
      net();
      const g = group(groupId);
      if (!isMember(g, userId)) return;
      allowed(userId === me().id ? canLeave(g, userId) : canRemove(g, me().id, userId));
      put(withoutMember(g, userId));
    },

    async activeInvite(groupId) {
      const found = invites.get(groupId);
      if (!found || found.invite.expiresAt <= now()) return null;
      return { code: madeHere.has(groupId) ? found.code : null, expiresAt: found.invite.expiresAt };
    },
    async createInvite(g, adminId) {
      net();
      allowed(canInvite(group(g.id), adminId, me().emailConfirmed));
      const code = generateCode((n) => Uint8Array.from({ length: n }, () => Math.floor(Math.random() * 256)));
      const invite: Invite = { groupId: g.id, groupName: g.name, adminName: g.members[adminId]?.name ?? '', createdBy: adminId, expiresAt: now() + INVITE_LIFETIME_MS };
      invites.set(g.id, { code, invite });
      madeHere.add(g.id);
      return { code, expiresAt: invite.expiresAt };
    },
    async cancelInvite(groupId) {
      net();
      allowed(canRename(group(groupId), me().id));
      invites.delete(groupId);
    },
    async lookupInvite(code) {
      net();
      const clean = normaliseCode(code);
      if (!isCodeShape(clean)) return null;
      const found = [...invites.values()].find((i) => i.code === clean && i.invite.expiresAt > now());
      return found ? { ...found.invite, groupName: group(found.invite.groupId).name } : null;
    },
    async join(code, invite, user) {
      net();
      const found = invites.get(invite.groupId);
      if (!found || found.code !== normaliseCode(code) || found.invite.expiresAt <= now() || !me().emailConfirmed) throw new AppError('invalid-code');
      put(withMember(group(invite.groupId), user.id, user.name));
    },

    async eraseLocal() {
      madeHere.clear();
    },
  };
  function net() {
    if (!self.online) throw new AppError('offline');
  }
  return self;
}
