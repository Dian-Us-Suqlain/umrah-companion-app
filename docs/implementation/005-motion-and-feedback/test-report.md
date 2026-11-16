# Test report: 005 — Motion, touch feedback and a journey view
17 Nov 2026, **run after the review fixes** · 7abd734 (feat/002-accounts-groups) · uncommitted changes: yes (002, 004 and 005)

Stack detected: Expo / React Native, plus Firebase database rules. No `docs/testing.md`; commands from `CLAUDE.md`, `package.json` and the plan.

| # | Check | Command | Result | Detail |
|---|---|---|---|---|
| 1 | Type check | `npm run typecheck` | PASS | exit 0 |
| 2 | Lint | `npm run lint` | PASS | no findings |
| 3 | Unit and screen tests | `npm test -- --watchAll=false` | PASS | 7 suites, 189 passed (182 before this work) |
| 4 | Database rules | `npm run test:rules` | PASS | 38 passed, 0 failed (run before the review fixes, which did not touch the rules) |
| 5 | Bundling | `npx expo export --platform ios` | PASS | finished (run before the review fixes; check 6 bundles again after them) |
| 6 | Release build for the iPhone, signed | `xcodebuild … -configuration Release` | PASS | `** BUILD SUCCEEDED **` after the fixes; the bundle contains the new wording |
| 7 | Install on the iPhone 14 Pro | `xcrun devicectl device install app` | PASS | installed |
| 8 | Launch on the iPhone | `xcrun devicectl device process launch` | PASS | launched; the process was still running 6 seconds later |
| 9 | How it looks, moves and feels | — | NOT RUN | see below |

**Verdict:** all automated checks passed, and the app launches and stays up on the iPhone / nobody has looked at it yet.

## Not run
- **Looking at it.** No screen of this version has been seen by anyone. In particular the spacing fix (review finding 1) is in a place no test measures: on Today, check there is space between the green card, the red alert and the list.
- **Motion, haptics, swiping:** animations do not run in the test runner, so tests prove what is on screen and in what state, never that anything moves.
- **Reduce Motion** (spec criterion 5): Settings › Accessibility › Motion › Reduce Motion, then reopen the app. Not checked.
- **Signed-in screens on the phone** (Group with the code and Copy): need `npm run emulators` on the Mac and the same Wi-Fi.
- **Android, GitHub checks:** nothing is pushed.

## Notes
- `npx expo prebuild --platform ios` was run again for the two new native libraries.
- No simulator was used in this run.
