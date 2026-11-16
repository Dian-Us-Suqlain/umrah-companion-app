/* Invite codes: 8 characters from letters and digits that are hard to confuse, shown as "K7MQ-2XWP".
   Only a hash of the code is stored; the hashing itself lives with the data layer because it needs the phone. */

import type { Group } from './rules';

/** 31 characters: A to Z and 2 to 9 without O, I and L (and no 0 or 1). */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;
export const INVITE_LIFETIME_MS = 7 * 864e5;

export type Invite = { groupId: string; groupName: string; adminName: string; createdBy: string; expiresAt: number };

/** A new code from random bytes. Bytes that would favour some characters are skipped, so every code is equally likely. */
export function generateCode(randomBytes: (n: number) => Uint8Array): string {
  const limit = 256 - (256 % CODE_ALPHABET.length);
  let out = '';
  while (out.length < CODE_LENGTH) {
    for (const b of randomBytes(CODE_LENGTH * 2)) {
      if (b < limit && out.length < CODE_LENGTH) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
    }
  }
  return out;
}

/** What the person typed, without spaces, dashes or lower case. */
export const normaliseCode = (typed: string): string => typed.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isCodeShape = (code: string): boolean =>
  code.length === CODE_LENGTH && [...code].every((ch) => CODE_ALPHABET.includes(ch));

export const formatCode = (code: string): string => `${code.slice(0, 4)}-${code.slice(4)}`;

export const newInvite = (g: Group, adminId: string, nowMs: number): Invite => ({
  groupId: g.id,
  groupName: g.name,
  adminName: g.members[adminId]?.name ?? '',
  createdBy: adminId,
  expiresAt: nowMs + INVITE_LIFETIME_MS,
});

export type JoinVerdict = { ok: true } | { ok: false; why: 'invalid' | 'already-member' | 'email-unconfirmed' };

/** Whether this person can join with this invite. Wrong, expired and cancelled codes are all "invalid":
    the app gives one message for the three, so a guesser learns nothing. The database checks the time itself;
    `nowMs` here only decides what the phone shows first. */
export function canJoin(
  invite: Invite | null,
  group: Pick<Group, 'members'> | null,
  userId: string,
  emailConfirmed: boolean,
  nowMs: number,
): JoinVerdict {
  if (!invite || invite.expiresAt <= nowMs) return { ok: false, why: 'invalid' };
  if (group && userId in group.members) return { ok: false, why: 'already-member' };
  if (!emailConfirmed) return { ok: false, why: 'email-unconfirmed' };
  return { ok: true };
}
