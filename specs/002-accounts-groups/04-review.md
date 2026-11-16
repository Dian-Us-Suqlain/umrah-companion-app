# 002 — Accounts and groups: review

13 Nov 2026. Reviewed the whole change against `staging` (7abd734), before any commit.

## Findings
Fourteen: twelve fixed, one not reproduced, one left for the owner. The full table, with file, what went wrong and the fix, is in [docs/implementation/002-accounts-groups/review-report.md](../../docs/implementation/002-accounts-groups/review-report.md). The two that mattered most:
- **An interrupted account deletion could have deleted a different account** that later signed in on the same phone. Fixed: the saved plan belongs to one account.
- **A group whose owner had left could no longer be managed** by its remaining admins. Fixed in the database rules.

**Left for the owner:** sign-up has no link to a privacy policy, because no privacy page exists yet.

## Acceptance criteria

| # | Criterion | Result | How it was checked |
|---|---|---|---|
| 0 | Firebase runs here; result logged first | Passed | Release build, existing simulator, 6 of 6; in the log |
| 1 | Fresh install, network off, opens as guest | Passed in tests only | Screen tests. Not tried on a device with the network off |
| 2 | Guest creates an account, lands on Profile with a group of one as admin | Passed | Screen test; real Firebase layer in the app (step 1) |
| 3 | Real confirmation and reset emails arrive | **Not tested** | Needs the owner's Firebase staging project |
| 4 | A makes a code, B sees names and joins, both listed | Passed | Screen test; in the app (steps 4, 9, 11) |
| 5 | Promote, remove, last admin cannot leave, member can leave | Passed | Screen tests; rules tests; in the app (steps 14, 16) |
| 6 | Expired, cancelled and wrong codes give one message; unconfirmed email cannot join or invite | Passed | Screen tests; rules tests; in the app (steps 2, 10, 15, 16). Expiry is proven in the rules tests only |
| 7 | Rules tests on every pull request | Passed locally | 38 tests; step added to `checks.yml`, which has not yet run on GitHub |
| 8 | Any action twice equals once | Passed | Screen test (double tap on sign-up); in the app (join, promote, remove, each sent twice) |
| 9 | Signed in and offline: last known data shown, changes say "No connection" | Passed for the data layer | In the app (step 7); screen test for the message. Not looked at on a device |
| 10 | Delete account removes everything and returns to guest; blocked for a last admin with members | Passed | Screen tests; in the app (steps 18, 20). The login's removal is proven by a refused sign-in; the user record and own group were not read back one by one |
| 11 | Sign out returns to an empty guest; sign in restores the groups | Passed | Screen test; in the app (steps 8, 13), including that the stored copy is gone after sign-out |
| 12 | Unit tests cover every rule | Passed | 39 tests in `src/core/groups` |
| 13 | No Firebase configuration file or key in the repository | Passed | `.firebase/` is git-ignored; `git status` shows none |

## What was tested, and how
- `npm run typecheck`, `npm run lint`: clean.
- `npm test`: 93 tests in 4 files.
- `npm run test:rules`: 38 tests against the Firestore emulator. Five rules were broken on purpose, one at a time; each time a test failed.
- `npx expo export --platform ios`: bundles.
- Release build for the iPhone simulator: succeeds.
- A temporary screen inside the app ran a 20-step, two-person flow through the real Firebase code against the emulators, on the existing iPhone 17 Pro Max simulator: 20 of 20, run again after the review fixes. The screen was then deleted.

## What was not tested
- **The screens, by eye or by hand, on any device.** Nobody has yet seen or tapped the new screens.
- A real iPhone or Android phone.
- Real emails (criterion 3).
- GitHub's checks and the Android build: nothing has been pushed.
- Two phones side by side, and a wrong phone clock (the database's clock is used for expiry, proven in the rules tests).
