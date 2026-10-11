**Status: Approved (11 Oct 2026)** — the owner merged the spec pull request (#2). Depends on [001 — Foundation](../001-foundation/02-spec.md) being merged first.

# 002 — Accounts and groups

Background and sources: [01-domain-study.md](01-domain-study.md).

## Goals

1. The app opens straight into use as a guest. No sign-up wall, no network needed.
2. Sign-up and sign-in screens, reached from Profile, and offered at the moment a guest tries something that needs an account.
3. Every account has a group it is the admin of. Alone, that is a group of one. Inviting people makes it a real group.
4. A group admin can invite, remove and promote members. Members can leave.
5. Each group's data is visible only to its members, enforced in the database and tested.
6. Sign out and delete account, inside the app.

## Non-goals

- No trip, documents, flights, board or locations for groups yet. This spec builds the people and permissions those features will sit on; the sample trip from 001 stays as it is.
- No Google sign-in and no Sign in with Apple in this version (see "Sign-in methods").
- No sign-in by phone number (text messages are billed).
- No travellers without a phone (children, elders whose documents someone else holds). They belong with the trip and documents spec.
- No push notifications, no profile photos, no Urdu.
- Nothing paid.

## What the user sees

### Guest

The app works as in 001. Profile shows:

```
You're using Umrah Companion as a guest.
Everything stays on this phone.

[ Create an account ]    [ Sign in ]

Why create one? To travel as a group, and to keep
your trip if you change phones.
```

Nothing else in the app nags. A guest is asked to sign up only when they tap something that needs an account ("Create a group", "Join a group"); the sheet says why, and "Not now" returns them where they were.

Profile also has **Erase data on this phone** for guests.

### Sign up

Fields: name, email, password. Button: **Create account**. Link to the privacy policy. After sign-up the app sends a confirmation email and Profile shows "Check your email to confirm your address" with **Send again**. Plain errors: "That email already has an account. Sign in instead?", "Password needs at least 8 characters", "No connection. Try again when you're online."

### Sign in

Fields: email, password. Button: **Sign in**. **Forgot password?** asks for the email and sends a reset link; the screen says the same thing whether or not the address has an account.

### Profile, signed in

```
Aisha Khan                         [ Edit name ]
aisha@example.com

MY GROUP
Khan family · 4 people · You are the admin     >

[ Join another group with a code ]

Sign out
Delete account
```

### Group screen

- Group name (admin can rename).
- Members, each with name and "Admin" where it applies.
- Admin only: **Invite people** shows a code such as `K7MQ-2XWP` with **Share** (opens the phone's share sheet with a short message) and its expiry; **New code** cancels the old one. On a member: **Make admin**, **Remove from group**.
- Everyone: **Leave group**.

A person who is alone sees the same screen with one member, themselves, and "Invite people to travel with you".

### Join a group

Enter the code. The app shows the group's name and admin's name and asks "Join Khan family?" before joining. Wrong, expired or cancelled codes all give one message: "That code isn't valid. Ask the group admin for a new one."

### Delete account

Explains what is deleted, asks for the password again, then deletes. If the person is the only admin of a group that has other members, they must first make someone else admin; the screen says so and links to the group.

## Rules

- **Roles:** `admin` and `member`. A group can have more than one admin. A group always has at least one: the last admin cannot leave, be removed or be demoted while other members remain.
- **Own group:** created with the account, named "My group" until renamed, the person is its admin.
- **More than one group:** a person can belong to several (their own and ones they joined). The app shows one **current group** at a time; Profile lists the others and switches between them.
- **Leaving:** a member can leave any group they joined. Their own group lasts as long as their account does.
- **Removing:** an admin can remove any member, and another admin, but not the last admin.
- **Invites:** one active code per group. 8 characters from letters and digits that are hard to confuse (no 0/O, 1/I/L). Expires after 7 days. Only its hash is stored. Using a code does not use it up; cancelling it or expiry ends it.
- **Joining** is immediate, with no approval step. An admin who sees someone unexpected removes them and makes a new code.
- **Confirmed email:** creating an invite and joining a group need a confirmed email address. Everything else works before confirming.
- **Guess protection:** codes cannot be listed or searched, only looked up exactly. With 8 characters from 31 there are about 850 billion codes, and each expires in 7 days. There is no lockout after wrong tries: that needs server code, which the free plan does not have. Recorded as a known limit.
- **Double taps:** creating an account, joining, creating a code, removing and leaving all give the same result if sent twice.
- **Guest to account:** whatever the guest has on the phone is kept and attached to the new account's own group. In this spec that is only settings; the rule is set now so later features follow it.
- **Signing out** keeps nothing of the account on the phone and returns to guest with a fresh, empty state.

## Sign-in methods

**Email and password only.** Firebase sends the confirmation and password-reset emails itself, free, up to 1,000 confirmations and 150 resets a day.

Google sign-in is left out on purpose. Apple's rule 4.8 says an app that offers a third-party login such as Google must also offer Sign in with Apple, which needs the paid Apple programme. An app that only uses its own email-and-password accounts is exempt. Leaving Google out keeps the app acceptable to the App Store later without that cost; it can be added in a later spec together with Sign in with Apple.

## Server

- **Service:** Firebase free plan: Authentication for login, Cloud Firestore for group data. No server code of our own in this spec.
- **Environments:** development and all automated tests run against Firebase's local emulator on the developer's Mac and in GitHub; one Firebase project for staging; the production project is created at the first release.
- **Configuration files:** each Firebase project gives the app a configuration file per platform. They identify the project rather than unlock it, but they are still kept out of this public repository: on the developer's Mac and in GitHub secrets.
- **First build step:** prove that the native Firebase library runs on Expo SDK 57 on the simulator, signs a user in against the emulator, and shows saved group data with the network off. If it does not, stop and return to the owner with the Supabase fallback (see `docs/tech-stack.md`).

### Data

| Collection | Holds |
|---|---|
| `users/{userId}` | Name. Readable by the person and by members of their groups |
| `groups/{groupId}` | Name, who created it, and the members with their roles and names, in the one document |
| `invites/{codeHash}` | Group, group name, admin's name, who made it, expiry. Looked up by the exact hash of the code |

Members and roles live inside the group document so that "a group always has at least one admin" can be checked by the database on every single change, in one place.

### Who can do what (enforced by Firestore security rules)

| | Not signed in | Signed in, not a member | Member | Admin |
|---|---|---|---|---|
| Read a group and its members | No | No | Own groups only | Own groups only |
| Rename the group | No | No | No | Yes |
| Create or cancel an invite | No | No | No | Yes, with a confirmed email |
| Look up one invite by its exact code | No | Yes | Yes | Yes |
| List or search invites | No | No | No | No |
| Add themselves to a group | No | Only as a plain member, only with a valid unexpired invite for that group, with a confirmed email | — | — |
| Change roles, remove members | No | No | No | Yes |
| Remove themselves | — | — | Yes | Yes |
| Any change that leaves a group with members but no admin | Refused | Refused | Refused | Refused |
| Edit a user's name | No | Own only | Own only | Own only |

**Delete account** is done from the phone, in this order: remove the person from every group they joined, delete their own group, delete their user document, delete the login. If it is interrupted, opening the app again finishes it. The rules above already stop a last admin with members from getting past the first step.

## On the phone

- `src/core/groups/` holds the rules above as plain TypeScript (who may do what, code format, last-admin checks) with unit tests, so screens can disable buttons for the same reasons the server would refuse.
- Firebase keeps the session and a copy of the person's groups on the phone, so Profile and the group screen show with no network. Anything that changes the server needs a connection and says so plainly when there is none.
- The server is never trusted to be reachable at launch: a signed-in person offline sees their last known group; a guest is unaffected.

## Edge cases

- Sign-up with an email that already has an account: offered sign-in instead, no second account.
- Email not confirmed yet: the app works; "Invite people" and "Join a group" explain that the address must be confirmed first and offer to send the email again.
- Joining a group you are already in: "You're already in Khan family", no error.
- Admin makes a new code while someone is typing the old one: the old one fails with the standard message.
- Two admins remove each other at the same moment: the database refuses whichever would leave the group with no admin.
- Removed from a group while offline: on next connection the group disappears from the phone and the current group falls back to the person's own.
- Deleting an account that is a plain member elsewhere: removed from those groups; the groups carry on.
- Deleting an account whose own group has no one else: the group goes with it.
- Phone clock wrong: invite expiry is checked by the database against its own time.
- Sign-in on a second phone: same account, same groups; nothing from the first phone's guest period is expected to appear.

## Acceptance criteria

0. The first build step above passes on the iPhone simulator, and its result is written in the log before anything else is built.
1. A fresh install with the network off opens to the app as a guest; all 001 screens work.
2. From Profile, a guest can create an account with name, email and password and lands back on Profile, signed in, with a group of one that they are the admin of.
3. Against the staging project, the confirmation email and the password-reset email arrive at a real address that is not the owner's, and both links work.
4. Person A makes a code; person B joins with it after seeing the group's and admin's names; both see each other in the members list.
5. A can make B an admin, remove B, and cannot leave while B is a plain member and A is the only admin. B can leave.
6. An expired and a cancelled code give the same message as a wrong one. An account with an unconfirmed email cannot join or invite and is told why.
7. Automated rules tests, run on every pull request against the emulator, show that: someone not signed in reads nothing; a member of group X cannot read or change anything of group Y; a member cannot do any admin action; nobody can add someone else to a group; nobody can join without a valid invite or make themselves admin while joining; invites cannot be listed; no write can leave a group with members and no admin.
8. Tapping any action twice quickly, or repeating the request, has the effect of doing it once.
9. Signed in and offline, Profile and the group screen show the last known data, and actions that need the server say "No connection".
10. Delete account removes the login, user document, memberships and own group, confirmed by reading the database afterwards, and the app returns to guest. It is blocked with a clear message for a last admin with members.
11. Sign out returns to an empty guest state; signing back in restores the groups.
12. The unit tests for `src/core/groups` cover every rule in "Rules".
13. No Firebase configuration file or key is in the repository.

## Test plan

- Unit tests for the group rules.
- Security-rules tests against the Firebase emulator, locally and in the `checks` workflow.
- End-to-end flow on the simulator with two test accounts against the emulator: sign up, invite, join, promote, remove, leave, delete.
- Against staging, once: real emails (criterion 3).
- Manual: offline behaviour, wrong phone clock, two simulators side by side, the owner's iPhone.
- Tests create and delete their own accounts and groups; nothing is left behind in the staging project.
- Not testable yet: iPhones other than the owner's, Android on a real phone unless one is available.

## Decided

- **Firebase**, not Supabase (owner, 11 Oct 2026).

## Open questions for the owner

1. **Guest on the phone only?** Proposed: yes. A guest can use everything that needs no server; creating or joining a group needs an account.
2. **Email and password only, no Google button for now?** Proposed: yes, for the App Store reason under "Sign-in methods".
3. **Firebase project.** You would need to create a free Firebase project for staging with your Google account (no card) and download its two configuration files for me to use; I will not sign up for anything. It is not needed until criterion 3; everything before that runs on the emulator.
4. **Several admins per group?** Proposed: yes.
5. **Join straight away with a code, or wait for the admin to approve?** Proposed: straight away; the admin can remove anyone and make a new code.
6. **What sign-up asks for.** Proposed: name, email, password, nothing else.
