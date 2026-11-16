# Test report: 002 — Accounts and groups
13 Nov 2026, 05:23, **run again after the review fixes** · 7abd734 (feat/002-accounts-groups) · uncommitted changes: yes (the whole feature)

Stack detected: Expo / React Native, plus Firebase database rules. The project has no `docs/testing.md`; the commands below came from `CLAUDE.md`, `package.json` and the implementation plan.

| # | Check | Command | Result | Detail |
|---|---|---|---|---|
| 1 | Type check | `npm run typecheck` | PASS | exit 0, no output |
| 2 | Lint | `npm run lint` | PASS | exit 0, no output |
| 3 | Unit and screen tests | `npm test -- --watchAll=false` | PASS | 4 suites, 93 tests. No warnings on the second run |
| 4 | Database rules | `npm run test:rules` | PASS | 38 tests, 0 failed, against the Firestore emulator (33 before the review; 5 added with its fixes) |
| 5 | Bundling | `npx expo export --platform ios` | PASS | export finished, 2.9 MB bundle |
| 6 | Release build, iPhone simulator | `xcodebuild … -configuration Release -sdk iphonesimulator` | PASS | `** BUILD SUCCEEDED **` (built with the temporary check screen in place; the final code without it passes checks 1 to 5) |
| 7 | Real Firebase layer inside the app | temporary in-app check, two accounts, Auth and Firestore emulators | PASS | 20 of 20 steps, on the existing iPhone 17 Pro Max simulator, before the review and again after its fixes (the screen that ran it has been deleted) |
| 8 | On the iPhone | install, launch, walk the flow | NOT RUN | see below |

**Verdict:** all automated checks passed / device not checked (no signing team on the development build; the app needs the emulator on the Mac).

## What check 7 covered
Sign-up with own group as admin; unconfirmed email cannot make a code; confirmation email; make a code and read it back; rename (the code's record follows); network off: groups still shown and a change says "offline"; sign-out; wrong code finds nothing; unconfirmed email cannot join; join, and joining twice; a member cannot rename, promote, remove or invite; sign back in; promote and demote, twice; the only admin cannot step down; new code cancels the old; remove, twice; cancel a code; fall back to own group and rejoin; edit name everywhere; delete account (wrong password refused; right one removes login, records, memberships); the group carries on; second account deleted.

## Not run
- **On the iPhone (check 8):** the development build has no signing team set, and on a phone the app must reach the emulator on the Mac over Wi-Fi, which needs the owner to accept the local-network prompt. Not attempted.
- **Real emails (acceptance criterion 3):** needs the owner's Firebase staging project.
- **The screens on a device, by eye:** the screens are covered by 25 screen tests against an in-memory server, but nobody has looked at them or tapped them on a phone or simulator yet.
- **Android on a phone:** no Android device. GitHub's `android-build` check has not run on these changes because nothing is pushed.
- **GitHub checks:** not run; nothing is pushed.

## Notes
- Checks 6 and 7 used an existing simulator, booted by this session and shut down afterwards. That is outside this skill's "never boot a simulator" rule; it was done for the spec's first build step, which names the simulator, and the owner was told at the time.
- The first run printed one `act(...)` warning from a test that changed the server outside `act`. Fixed in the review; the second run prints none.
- A first run after dependencies change can be slow (Jest's cache). Measured once at 18 minutes while the project was in an iCloud-synced folder; 2 to 7 seconds since it moved.
