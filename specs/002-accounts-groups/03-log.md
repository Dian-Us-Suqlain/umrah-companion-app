# 002 — Accounts and groups: log

## 11 Oct 2026

- **Owner's request**, in their words: "accounts, groups, an admin account for groups, for single individuals, a simple account would work that would technically act as an admin in itself. I need the signup/signin screens, start with a guest account, users can be prompted to sign up or sign in later through their profile settings."
- **Owner's constraint:** nothing paid until the app has an audience.
- **One model for individuals and groups.** Every account gets its own group of one and is its admin. Reason: it is what the owner described, and it avoids a separate "individual" path and an "upgrade to group" step.
- **Guest proposed as phone-only**, not a server account. Reason: works at first launch with no network, no junk accounts or CAPTCHA, nothing to delete on a server. Cost: a guest cannot join a group without signing up. Awaiting the owner's answer.
- **Supabase proposed** for login, database and per-group rules. Reason: one free service on Postgres covering all three. Other services were not compared in depth; said so in the study.
- **Finding: email cannot reach real users for free.** Supabase's built-in sender only delivers to the project's own team. Proposal: Google sign-in is the public method for now; email and password are built and tested but off in production until an email sender exists. Awaiting the owner's answer.
- **Sign in with Apple is deliberately out.** It needs the paid Apple programme. It becomes mandatory when the app goes to the App Store with Google sign-in (guideline 4.8). Recorded so it is not forgotten.
- **Travellers without a phone are out of this spec.** Reason: they are people in a trip, not accounts; they belong with the trip and documents spec.
- **This spec was written before 001 is approved or built**, to keep moving while 001 waits on the bundle identifier. It depends on 001 and no code for it starts before 001 is merged.
- Spec sent to the owner for approval.
- **Backend choice reopened.** The owner asked for a full scan of what can be had for free (`docs/tech-stack.md`, pull request #3). It found that on free plans Firebase sends sign-up and reset emails to real users and does not pause when unused, which removes the two biggest problems recorded above. New recommendation: Firebase. This spec is not to be approved as written until the owner chooses; if Firebase is chosen, "Sign-in methods" and "Server" are rewritten and the screens and group rules stay.
- **Owner decision: Firebase.** "Great, go ahead with firebase." Spec rewritten: email and password sign-up (Firebase sends the emails), Firestore with security rules in place of Postgres tables and row rules, no server code.
- **Google sign-in dropped from this version.** Reason: with email working it is no longer needed, and offering it would oblige the app to add Sign in with Apple (paid) before an App Store release. My proposal; awaiting the owner's answer.
- **Lockout after wrong invite codes dropped.** Reason: it needs server code, which the free plan lacks. Codes cannot be listed, there are about 850 billion of them, and they expire in 7 days.
- **Members and roles kept inside the group document.** Reason: lets the database check "at least one admin" on every change without server code.
- **Joining and inviting need a confirmed email.** Reason: keeps mistyped and throwaway addresses out of groups at no cost.
- **Firebase configuration files stay out of the public repository.**
- Spec back to "Awaiting approval".
- **Approved by the owner, 11 Oct 2026**, by merging pull request #2. That settles the open questions as proposed: guest on the phone only; email and password only; several admins per group; joining with a code is immediate; sign-up asks for name, email and password. Still needed from the owner later: a free Firebase project for the real-email test.

## 13 Nov 2026

- **Owner approved the implementation plan** (`docs/implementation/002-accounts-groups/plan.md`) and the installation of Java for the emulator.
- **First build step: passed (criterion 0).** Release build on the iPhone 17 Pro Max simulator against the local emulator, Expo SDK 57, React Native 0.86, `@react-native-firebase` 27.1.1. Result, 6 of 6: signed up; saved `groups/own_<id>`; read it online; network off; read it again from the phone's copy (`fromCache: true`); network on. Firebase stays; the Supabase fallback is not needed.
- **iPhone linking is dynamic, not static.** Reason: this Firebase version arrives as Swift packages and refuses static linking at install time. Set in `app.config.ts`.
- **Roles are stored as a list of admins on the group**, not as a role on each member. Reason: the database rules cannot loop over members, so "a group always has an admin" can only be checked as a size check on a list. Members stay in the same document; the app still shows a role per person.
- **A join is two writes in one batch:** the hash of the code into `groups/{id}/joins/{person}` (readable only by that person) and the person into the group. The group's one active code lives in `groups/{id}/admin/invite` (admins only). Reason: the rules can then check that the code is the group's current, unexpired one without the hash ever being visible to other members.
- **A person's user document is readable only by them.** The spec said "and by members of their groups". Reason: the rules cannot tell whether two people share a group; members already see each other's names in the group itself.
- **The owner of a group cannot be removed from it by another admin.** The spec was silent. Reason: otherwise a promoted admin could leave someone without their own group.
- **Deleting an account whose own group still has other people** (after another admin was appointed): the person leaves and the group carries on. The spec only covered the empty case.
- **The code is shown only on the phone that made it.** Reason: only its hash is stored, as the spec requires, so another admin cannot read it back; they make a new code, which cancels the old one.
- **Tests were slow because the project sat in a folder synced by iCloud Drive.** Moved to `~/Projects/umrah-companion-app` on the owner's instruction. Jest now scans only `src/`.
- **Built on `feat/002-accounts-groups`**, tested and reviewed: `docs/implementation/002-accounts-groups/test-report.md`, `review-report.md`, and `04-review.md` here. Not committed or pushed yet.
- **Review: fourteen findings, twelve fixed.** The serious two: an interrupted account deletion could have deleted a different account that signed in later on the same phone; and a group whose owner had left could not be managed by its remaining admins.
- **Not met, waiting on the owner:** sign-up does not link to a privacy policy (no page exists yet); real emails (criterion 3) need the Firebase staging project.
- **An admin can change only their own entry in a group**, and remove others. Reason: the rules cannot check every entry, so letting admins rewrite entries would let them attach anything to another person.
- **The record of the code used to join is deleted straight after joining.** Reason: nothing about a code should stay on the server once it has done its job.
