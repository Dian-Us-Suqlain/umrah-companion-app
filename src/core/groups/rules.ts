/* Who may do what in a group. Plain logic with no server in it: screens use it to disable a button for the
   same reason the database would refuse the change. The database rules remain the real guard. */

export type Role = 'admin' | 'member';
export type Member = { role: Role; name: string };
export type Group = { id: string; name: string; createdBy: string; members: Record<string, Member> };

export type Refusal =
  | 'not-member' // the person acting is not in the group
  | 'not-admin' // the action needs an admin
  | 'target-not-member' // the person acted on is not in the group
  | 'last-admin' // it would leave a group that has members with no admin
  | 'own-group' // a person's own group lasts as long as their account
  | 'email-unconfirmed'; // inviting and joining need a confirmed address

export type Verdict = { ok: true } | { ok: false; why: Refusal };
const yes: Verdict = { ok: true };
const no = (why: Refusal): Verdict => ({ ok: false, why });

export const DEFAULT_GROUP_NAME = 'My group';
export const MAX_NAME_LENGTH = 60;

/** The id of the group created with an account. Derived, so creating it twice creates it once. */
export const ownGroupId = (userId: string): string => `own_${userId}`;
export const isOwnGroup = (group: Pick<Group, 'id'>, userId: string): boolean => group.id === ownGroupId(userId);

export const newOwnGroup = (userId: string, userName: string): Group => ({
  id: ownGroupId(userId),
  name: DEFAULT_GROUP_NAME,
  createdBy: userId,
  members: { [userId]: { role: 'admin', name: userName } },
});

export const memberIds = (g: Group): string[] => Object.keys(g.members);
export const adminIds = (g: Group): string[] => memberIds(g).filter((id) => g.members[id].role === 'admin');
export const isMember = (g: Group, userId: string): boolean => userId in g.members;
export const isAdmin = (g: Group, userId: string): boolean => g.members[userId]?.role === 'admin';

/** The rule the database checks on every change: a group with members always has an admin. */
export const hasAdminIfMembers = (g: Group): boolean => memberIds(g).length === 0 || adminIds(g).length > 0;

const isLastAdmin = (g: Group, userId: string): boolean => isAdmin(g, userId) && adminIds(g).length === 1;
const hasOthers = (g: Group, userId: string): boolean => memberIds(g).some((id) => id !== userId);

function asAdmin(g: Group, actor: string): Verdict {
  if (!isMember(g, actor)) return no('not-member');
  return isAdmin(g, actor) ? yes : no('not-admin');
}

export const canRename = (g: Group, actor: string): Verdict => asAdmin(g, actor);

/** Making or cancelling an invite code. */
export function canInvite(g: Group, actor: string, emailConfirmed: boolean): Verdict {
  const admin = asAdmin(g, actor);
  if (!admin.ok) return admin;
  return emailConfirmed ? yes : no('email-unconfirmed');
}

export function canSetRole(g: Group, actor: string, target: string, role: Role): Verdict {
  const admin = asAdmin(g, actor);
  if (!admin.ok) return admin;
  if (!isMember(g, target)) return no('target-not-member');
  if (role === 'member' && isLastAdmin(g, target) && hasOthers(g, target)) return no('last-admin');
  return yes;
}

/** An admin removing someone else. Leaving is `canLeave`. */
export function canRemove(g: Group, actor: string, target: string): Verdict {
  if (actor === target) return canLeave(g, actor);
  const admin = asAdmin(g, actor);
  if (!admin.ok) return admin;
  if (!isMember(g, target)) return no('target-not-member');
  if (isOwnGroup(g, target)) return no('own-group');
  return yes; // the actor is an admin and stays, so an admin remains
}

export function canLeave(g: Group, actor: string): Verdict {
  if (!isMember(g, actor)) return no('not-member');
  if (isOwnGroup(g, actor)) return no('own-group');
  if (isLastAdmin(g, actor) && hasOthers(g, actor)) return no('last-admin');
  return yes;
}

/* The same changes as new values, for tests and for showing a change before the server confirms it. */
export const withName = (g: Group, name: string): Group => ({ ...g, name: cleanName(name) });
export const withMember = (g: Group, userId: string, name: string): Group =>
  isMember(g, userId) ? g : { ...g, members: { ...g.members, [userId]: { role: 'member', name } } };
export const withRole = (g: Group, userId: string, role: Role): Group =>
  isMember(g, userId) ? { ...g, members: { ...g.members, [userId]: { ...g.members[userId], role } } } : g;
export function withoutMember(g: Group, userId: string): Group {
  const { [userId]: _gone, ...rest } = g.members;
  return { ...g, members: rest };
}

/** Which group the app shows. Falls back to the person's own group when the chosen one is gone
    (for example, they were removed while offline). */
export function resolveCurrentGroup(chosen: string | null | undefined, groupIds: string[], userId: string): string {
  return chosen && groupIds.includes(chosen) ? chosen : ownGroupId(userId);
}

/** Groups that stop an account being deleted: the person is the only admin and others are still in it. */
export const deletionBlockers = (groups: Group[], userId: string): Group[] =>
  groups.filter((g) => isLastAdmin(g, userId) && hasOthers(g, userId));

/** What deleting an account does to the person's groups, in the order it is done. The own group goes with the
    account when nobody else is in it; when others are (and so another admin exists), it carries on without them. */
export function deletionSteps(groups: Group[], userId: string): { leave: string[]; deleteOwn: string | null } {
  const mine = groups.filter((g) => isMember(g, userId));
  const own = mine.find((g) => isOwnGroup(g, userId));
  const ownCarriesOn = !!own && hasOthers(own, userId);
  return {
    leave: mine.filter((g) => !isOwnGroup(g, userId) || ownCarriesOn).map((g) => g.id),
    deleteOwn: own && !ownCarriesOn ? own.id : null,
  };
}

/* What people type. */
export const cleanName = (s: string): string => s.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
export const validName = (s: string): boolean => cleanName(s).length > 0;
export const cleanEmail = (s: string): string => s.trim().toLowerCase();
export const validEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(s));
export const MIN_PASSWORD_LENGTH = 8;
export const validPassword = (s: string): boolean => s.length >= MIN_PASSWORD_LENGTH;
