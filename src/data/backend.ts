/* What the app needs from a server, with no server named. The real one is Firebase (`firebase-backend.ts`);
   screen tests use the in-memory one (`memory-backend.ts`). Both obey the rules in `src/core/groups`. */
import type { Invite } from '@/core/groups/invites';
import type { Group, Role } from '@/core/groups/rules';

export type User = { id: string; name: string; email: string; emailConfirmed: boolean };

export type Problem =
  | 'email-in-use'
  | 'wrong-credentials'
  | 'weak-password'
  | 'invalid-email'
  | 'offline'
  | 'too-many-tries'
  | 'invalid-code'
  | 'not-allowed'
  | 'unknown';

export class AppError extends Error {
  constructor(
    public problem: Problem,
    detail?: string,
  ) {
    super(detail ?? problem);
  }
}
export const problemOf = (e: unknown): Problem => (e instanceof AppError ? e.problem : 'unknown');

/** The group's current code. `code` is null on a phone that did not make it: only its hash is stored. */
export type ActiveInvite = { code: string | null; expiresAt: number };

export interface Backend {
  /** Calls back now and on every change: the signed-in person, or null for a guest. */
  onUser(cb: (user: User | null) => void): () => void;
  /** Calls back with the person's groups, from the phone's copy when there is no network. */
  onGroups(userId: string, cb: (groups: Group[]) => void): () => void;

  signUp(name: string, email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Resolves the same way whether or not the address has an account. */
  sendPasswordReset(email: string): Promise<void>;
  sendConfirmation(): Promise<void>;
  /** Asks the server again whether the email has been confirmed. */
  refreshUser(): Promise<void>;
  setName(name: string, groupIds: string[]): Promise<void>;
  /** Checks the password again, then removes memberships, the own group, the user record and the login. */
  deleteAccount(password: string, plan: { leave: string[]; deleteOwn: string | null }): Promise<void>;

  renameGroup(groupId: string, name: string): Promise<void>;
  setRole(groupId: string, userId: string, role: Role): Promise<void>;
  /** Removing someone else, or leaving when `userId` is the person themselves. */
  removeMember(groupId: string, userId: string): Promise<void>;

  activeInvite(groupId: string): Promise<ActiveInvite | null>;
  /** Makes a new code and cancels the old one. */
  createInvite(group: Group, adminId: string): Promise<ActiveInvite>;
  cancelInvite(groupId: string): Promise<void>;
  /** What the code leads to, or null. Wrong, expired and cancelled codes are all null. */
  lookupInvite(code: string): Promise<Invite | null>;
  join(code: string, invite: Invite, user: User): Promise<void>;

  /** Guest: forget everything this app keeps on the phone. */
  eraseLocal(): Promise<void>;
}
