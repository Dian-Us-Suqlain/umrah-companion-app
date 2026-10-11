# 001 — Foundation: review

Self-review on 11 Oct 2026, before the pull request (#4). Reviewed: the full diff against `staging`, each acceptance criterion, and the rules in `CLAUDE.md`.

## Acceptance criteria

| # | Criterion | Result | How it was checked |
|---|---|---|---|
| 1 | Builds and opens on an iPhone simulator; three tabs work | Pass | `npx expo run:ios` on the iPhone 17 simulator (iOS 26.5). Today, Plan and Profile looked at in screenshots, light and dark |
| 2 | Android build of the same code completes | Pass, in CI only | The `android-build` job of the `checks` workflow built a debug app file (run 38099168926, about 20 minutes). Nobody has opened it on an Android phone or emulator |
| 3 | Every trip-plan test of the first app has an equivalent with invented data | Pass | 23 tests ported one for one, plus 2 new (trip zone is the trip's own; self-check cases). The first app's `stays` tests are about server code and were not ported (see the log). Checked the diff for names, hotels, flight numbers and dates from the real trip: none |
| 4 | Self-check passes on the phone engine | Pass | Self-check screen on the simulator: "All 20 checks passed", engine Hermes 250829098.0.17. Not run on Android |
| 5 | Plan and Today unchanged when the phone's zone is far from the trip's | Partly | The Mac and simulator are on Pakistan time, two hours from the sample trip, and the screens showed the trip's day and times. A far-away zone was not set on the simulator, because that means changing the Mac's own time zone. The cases with a Karachi and a New York phone pass in the unit tests and in the on-phone self-check |
| 6 | Development and staging variants install side by side with different names | Pass | Both installed on the same simulator: "Umrah Companion (Dev)" and "Umrah Companion (Staging)", different bundle identifiers, both open |
| 7 | Checks run lint, type check and tests and pass; a broken test fails them | Pass | Run 38099168926 passed. A deliberately failing test was pushed and run 38100397179 failed on it; the test was then removed |
| 8 | `src/core` importing React or Expo fails lint | Pass | A temporary file importing `react` and `expo-constants` gave two `no-restricted-imports` errors; removed |
| 9 | Smoke test passes locally | Pass, with a different tool | Four Jest tests open the real screens through Expo Router's test helper: Today, the cancelled flight, Plan with today and the Now line, Profile and the self-check. Not Maestro, and not on a simulator (see the log) |

Also done, beyond the criteria: a standalone build signed with the owner's free Apple account was installed on the owner's iPhone. It could not be opened from the Mac because the phone was locked, so nobody has seen it running on the phone yet.

## Findings

| Severity | Where | What | Outcome |
|---|---|---|---|
| Medium | `package.json` | Expo Router's test helper does not work with version 14 of the testing library (its `render` became asynchronous), so every screen test failed | Fixed: pinned to version 13 with the matching test renderer |
| Low | `src/app/self-check.tsx` | The Self-check row is hidden in the production variant, but the screen itself still exists and can be reached by a link | Left: it shows nothing private. To remove from production when the first store build is made |
| Low | iPhone home screen | The name under the icon is cut short ("Umrah Compani…"); the full names are too long for a home-screen label | Left: names and icon are placeholders until the design spec |
| Low | `src/ui/components.tsx` | The time column has a fixed width; with the phone's largest text sizes a time range may wrap | Left, and **not tested**: the spec asked for large text to be checked and it was not |
| Low | `src/core/trip-plan.ts` | Words produced by the logic are English inside the logic, not in the string table | Left for the spec that adds Urdu (see the log) |
| Info | dependencies | `npm audit` reports 61 advisories (16 moderate, 45 high) in packages pulled in by Expo and React Native, among them `uuid` and `decode-uri-component`. They were not analysed one by one. `npm audit fix --force` would move Expo off the versions it supports | Left. Worth a look before the first public build |
| Info | `.github/workflows/checks.yml` | The Android job takes about 20 minutes on every pull request and is not a required check | Left: it should not block spec-only pull requests |

## Rules from `CLAUDE.md`

- Trip logic never reads the phone's zone or the clock itself: both are passed in. Checked in `src/core`; the only `Date.now()` is in `src/ui/use-sample-plan.ts`.
- Works with no network: nothing in the app makes a network call. The staging build ran on the simulator with no development server.
- A cancelled flight changes every screen that shows it: Today and Plan both mark it, it is never "now" or "next", and the notification text puts it last. Tested.
- No real people's data: fixtures and the sample trip are invented.
- No assistant attribution, no keys: the signing team was passed on the command line and the `ios/` folder is not committed.
- Sends, group data, religious content: not applicable yet.

## Not tested

- Any real Android device or emulator.
- The app running on the owner's iPhone (installed, not opened).
- Large text sizes.
- A phone time zone far from the trip's, on a device.
- The production variant.
