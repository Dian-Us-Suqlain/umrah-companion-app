# Review: 002 — Accounts and groups
13 Nov 2026 · 7abd734 (staging)..working tree · 12 changed files and 20 new ones, excluding `specs/003-commercial-product/` and its index row, which are not part of this change

| # | Severity | Where | Finding | Status |
|---|---|---|---|---|
| 1 | Blocker | `src/data/firebase-backend.ts` (resume of an interrupted deletion) | The saved deletion plan was not tied to an account. If account A's deletion was interrupted and account B then signed in on the same phone, B's account would have been deleted. | Fixed: the plan stores the account it belongs to; anyone else signing in discards it |
| 2 | Major | `firestore.rules` (`adminChange`) | Once a group's owner had left (their account deleted while others remained), no admin could rename it, change roles or remove anyone: the group was frozen. Found by both passes. | Fixed (2 rules tests added; confirmed in the app: step 19) |
| 3 | Major | `src/data/firebase-backend.ts` (`finishDeleting`) | Resuming an interrupted deletion repeated steps already done; the database refuses those, so the resume failed on every launch and the account was never deleted. | Fixed: a refusal of an already-done step counts as done (rules test added for the refusals) |
| 4 | Major | `src/data/firebase-backend.ts` (`signIn`) | A sign-up cut off after the login was created but before the name was saved left an account that could never get its own group (an empty name is refused). | Fixed: sign-in repairs the name (falls back to the part of the email before the @) and creates the group |
| 5 | Minor | `firestore.rules` (`adminChange`) | An admin could rewrite another member's entry: change their name, or attach arbitrary data to it. | Fixed: an admin may change only their own entry and remove others (rules test added) |
| 6 | Minor | `firestore.rules`, `firebase-backend.ts` (`join`) | The record of the code someone joined with stayed on the server for good, including after their account was deleted. | Fixed: deleted straight after the join (rules test added; confirmed in the app: step 11) |
| 7 | Minor | `firebase-backend.ts` (`renameGroup`) | Renaming and updating the code's lookup record were one batch, so a missing lookup record would have failed the whole rename. | Fixed: the rename first, the lookup record after, best effort |
| 8 | Minor | `firebase-backend.ts` (`setName`) | An admin changing their name left the old name on their active invite ("Admin: old name"). | Fixed (confirmed in the app: step 6) |
| 9 | Minor | `firebase-backend.ts` (`onGroups`) | Any passing error on the groups listener emptied the list, so Profile would show no groups until restart. | Fixed: an error keeps what is shown |
| 10 | Minor | `src/ui/session.tsx` | A stored "current group" loading late could override a switch the person had just made. | Fixed |
| 11 | Minor | `app.config.ts` | Setting only one of the two real Firebase file variables mixed a real project on one platform with the made-up files on the other, without an error. | Fixed: both or neither, otherwise the build stops with a message (checked with `expo config`) |
| 12 | Minor | `src/__tests__/accounts.test.tsx` | One test changed the server outside `act(...)`, printing a React warning. | Fixed in the test (no assertion changed) |
| 13 | Plausible | `firebase-backend.ts` (`forgetAccount`) | The built-in review expected sign-in after sign-out to fail, because the database object is shut down on sign-out and reused. | Not reproduced: the in-app check signs out and back in four times and passes, and after sign-out the group is no longer readable from the phone's stored copy. Left as is |
| 14 | Blocker (spec) | `src/app/account/sign-up.tsx` | The spec says sign-up links to the privacy policy. There is no privacy page yet, so the screen has a sentence but no link. | Left: needs your decision (I draft the page and publish it on GitHub Pages, you approve the wording) |

**Verdict:** ready for your testing after the fixes above; re-tested (see the test report). Not ready to release until finding 14 and the real-email check are done.

## Checklist
- 1 Matches the spec and plan: #14; six deliberate differences are recorded with reasons in `specs/002-accounts-groups/03-log.md`
- 2 Correct on real inputs: ok (empty and over-long names, mistyped codes, lower-case codes, repeated requests; no earlier version to upgrade from)
- 3 Errors: #3, #4, #9; otherwise ok (every request maps to a plain message; no connection is detected before a change is queued)
- 4 Concurrency and lifetimes: #1, #10; listeners are unsubscribed on sign-out and unmount; one request at a time per button
- 5 Builds that differ: ok. Release build on the simulator; development builds may only use the emulator, enforced in `app.config.ts`. Not run on a real phone
- 6 Secrets and privacy: #6. No configuration file or key in the repository (`.firebase/` is git-ignored; the made-up key is built from a repeated letter). A person's user record is readable only by them
- 7 Untrusted input: ok. Everything typed is cleaned and length-checked in the app and again by the database rules
- 8 Tests: ok. 39 rule tests for the core logic, 25 screen tests, 38 database-rules tests. Five rules were deliberately broken one at a time and each was caught
- 9 Performance: ok. One extra server read before each change (to detect no connection)
- 10 Docs: changelog, README, spec log and `04-review.md` updated
- 11 Fits in: ok
- 12 Leftovers: ok. The two temporary check screens and their launch switch are deleted; searched for

## Built-in code review
Ten findings. Seven confirmed and fixed (#1, #2, #3, #5, #6, #7, #8 above, plus #9, #10 and #11 from its combined items). One not reproduced (#13).

## Project rules (`CLAUDE.md`)
- Trip times never use the phone's zone: n/a (no trip logic changed). Invite expiry uses the database's clock, not the phone's.
- Every screen renders offline: Profile and the group screen read from the session's stored copy; proven for the data layer in the app (step 7), not looked at on a device.
- Sends safe against double taps: ok, tested.
- Group data enforced on the server: ok, 38 rules tests.
- No real people's data: ok, invented names and `example.com` addresses only.
- No assistant attribution, no paid services: ok. Java, the Firebase tools and the libraries are free; nothing was signed up for.

## Seen nearby (not changed)
- `README.md` says Node 22 or later; this Mac has only Node 26. Both work.
- Profile still shows "Privacy policy: Coming later" and "Sources: Coming later" from spec 001.
