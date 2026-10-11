**Status: Draft** (written 11 Oct 2026; backend choice reopened by the tech stack scan, see the log). Depends on [001 — Foundation](../001-foundation/02-spec.md) being built first.

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
- No Sign in with Apple (needs the paid Apple programme; required before an App Store release, see the study).
- No email sent to real users (see "Sign-in methods").
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

Fields: name, email, password. Buttons: **Create account**, **Continue with Google**. Link to the privacy policy. Plain errors: "That email already has an account. Sign in instead?", "Password needs at least 8 characters", "No connection. Try again when you're online."

### Sign in

Fields: email, password. Buttons: **Sign in**, **Continue with Google**. **Forgot password?** (see below).

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

Explains what is deleted, asks for the password again (or Google confirmation), then deletes. If the person is the only admin of a group that has other members, they must first make someone else admin; the screen says so and links to the group.

## Rules

- **Roles:** `admin` and `member`. A group can have more than one admin. A group always has at least one: the last admin cannot leave, be removed or be demoted while other members remain.
- **Own group:** created with the account, named "My group" until renamed, the person is its admin.
- **More than one group:** a person can belong to several (their own and ones they joined). The app shows one **current group** at a time; Profile lists the others and switches between them.
- **Leaving:** a member can leave any group they joined. Their own group lasts as long as their account does.
- **Removing:** an admin can remove any member, and another admin, but not the last admin.
- **Invites:** one active code per group. 8 characters from letters and digits that are hard to confuse (no 0/O, 1/I/L). Expires after 7 days. Only its hash is stored. Using a code does not use it up; cancelling it or expiry ends it.
- **Joining** is immediate, with no approval step. An admin who sees someone unexpected removes them and makes a new code.
- **Guess protection:** 5 wrong codes from one account locks joining for that account for 15 minutes.
- **Double taps:** creating an account, joining, creating a code, removing and leaving all give the same result if sent twice.
- **Guest to account:** whatever the guest has on the phone is kept and attached to the new account's own group. In this spec that is only settings; the rule is set now so later features follow it.
- **Signing out** keeps nothing of the account on the phone and returns to guest with a fresh, empty state.

## Sign-in methods

Because email cannot be sent to real users for free (see the study):

| Method | Development and staging | Production |
|---|---|---|
| Continue with Google | On | On |
| Email and password | On, for testing the screens end to end (confirmation and reset emails reach only the owner's address) | **Off until an email sender exists.** The fields are hidden and only Google is offered |

This is open question 2. The screens above are built in full either way.

## Server

- **Service:** Supabase free plan. Login service, Postgres database, row-level rules.
- **Environments:** development runs on the developer's Mac (Supabase local stack in Docker); one hosted project for staging; the production project is created at the first release.
- **Keys:** the app carries only the public key. The service key lives in server functions and GitHub secrets only.

### Data

| Table | Holds |
|---|---|
| `profiles` | One row per account: id (the login service's user id), name |
| `groups` | id, name, who created it |
| `memberships` | group, person, role, when they joined. One row per person per group |
| `invites` | group, code hash, who made it, expiry, cancelled-at |
| `join_attempts` | person, time, for the lockout |

### Who can do what (enforced in the database)

| | Not signed in | Member | Admin |
|---|---|---|---|
| See a group, its members and their names | No | Own groups only | Own groups only |
| Rename the group | No | No | Yes |
| Create or cancel an invite | No | No | Yes |
| Change roles, remove members | No | No | Yes, never the last admin |
| Leave | — | Yes | Yes, unless last admin with members left |
| Edit a profile | No | Own only | Own only |

Three operations run as database functions rather than direct table writes, because they need to check things the caller is not allowed to see: **join with a code**, **preview a code** (returns only group name and admin name), and **create account's own group**. **Delete account** runs as a server function with the service key, after confirming who is asking.

Every table has row-level rules on. There is no rule that lets one group's member read another group's rows.

## On the phone

- `src/core/groups/` holds the rules above as plain TypeScript (who may do what, code format, last-admin checks) with unit tests, so screens can disable buttons for the same reasons the server would refuse.
- The session is stored encrypted on the phone. Profile and current group are stored too, so they show with no network. Anything that changes the server needs a connection and says so plainly when there is none.
- The server is never trusted to be reachable at launch: a signed-in person offline sees their last known group; a guest is unaffected.

## Edge cases

- Sign-up with an email that already has a Google account, and the reverse: one account, both ways in, never two accounts.
- Joining a group you are already in: "You're already in Khan family", no error.
- Admin makes a new code while someone is typing the old one: the old one fails with the standard message.
- Two admins remove each other at the same moment: the database refuses whichever would leave the group with no admin.
- Removed from a group while offline: on next connection the group disappears from the phone and the current group falls back to the person's own.
- Deleting an account that is a plain member elsewhere: removed from those groups; the groups carry on.
- Deleting an account whose own group has no one else: the group goes with it.
- Phone clock wrong: expiry and lockouts use the server's time.
- Sign-in on a second phone: same account, same groups; nothing from the first phone's guest period is expected to appear.

## Acceptance criteria

1. A fresh install with the network off opens to the app as a guest; all 001 screens work.
2. From Profile, a guest can create an account with Google on the iPhone simulator and lands back on Profile, signed in, with a group of one that they are the admin of.
3. In development, sign-up, sign-in and password reset by email work end to end with the owner's address. In a production-variant build the email fields are not shown.
4. Person A makes a code; person B joins with it after seeing the group's and admin's names; both see each other in the members list.
5. A can make B an admin, remove B, and cannot leave while B is a plain member and A is the only admin. B can leave.
6. A wrong code five times locks joining for 15 minutes; an expired and a cancelled code give the same message as a wrong one.
7. Automated database tests, run on every pull request, show that: someone not signed in reads nothing; a member of group X cannot read or change anything of group Y; a member cannot do any admin action; no direct table write can leave a group without an admin; the service key appears nowhere in the app bundle.
8. Tapping any action twice quickly, or repeating the request, has the effect of doing it once.
9. Signed in and offline, Profile and the group screen show the last known data, and actions that need the server say "No connection".
10. Delete account removes the login, profile, memberships and own group, confirmed by a query afterwards, and the app returns to guest. It is blocked with a clear message for a last admin with members.
11. Sign out returns to an empty guest state; signing back in restores the groups.
12. The unit tests for `src/core/groups` cover every rule in "Rules".

## Test plan

- Unit tests for the group rules.
- Database tests against the local Supabase stack, locally and in the `checks` workflow.
- End-to-end flow on the simulator with two test accounts: sign up, invite, join, promote, remove, leave, delete.
- Manual: offline behaviour, wrong phone clock, two simulators side by side.
- Tests create and delete their own accounts and groups; nothing is left behind in the staging project.
- Not testable yet: real iPhones beyond the owner's own, Sign in with Apple, email to real users.

## Open questions for the owner

1. **Guest on the phone only?** Proposed: yes. A guest can use everything that needs no server; creating or joining a group needs an account. The alternative, guests as server accounts, needs a connection at first launch and invites junk accounts (see the study).
2. **Sign-in with no email sender.** Proposed: Google is the only method the public sees for now; email and password are built and tested but switched off in production until there is an email sender, which most likely means buying a domain. If you would rather not depend on Google alone, that domain is the first cost to accept.
3. **Supabase.** Proposed: yes. You would need to create the free account and a staging project yourself and give me its address and public key; I will not sign up for anything. Development and all automated tests run on your Mac and in GitHub without it.
4. **Several admins per group?** Proposed: yes, so a tour leader can share the job and a group survives one admin leaving.
5. **Join straight away with a code, or wait for the admin to approve?** Proposed: straight away. Approval adds a step for people who are often not technical, and the admin can remove anyone.
6. **What sign-up asks for.** Proposed: name, email, password, nothing else. No phone number, no date of birth.
