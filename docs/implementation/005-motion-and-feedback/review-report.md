# Review: 005 — Motion, touch feedback and a journey view
17 Nov 2026 · `refs/snapshots/004-before-005`..working tree · 17 files (motion, countdown, tutorial, Today, Plan, group view, components, tests, docs)

| # | Severity | Where | Finding | Status |
|---|---|---|---|---|
| 1 | Major | `src/ui/components.tsx` (`Screen`) | Wrapping each part of a screen so it eases in removed the space between the pieces of any part made of several: on Today the green card, the alert and the list would have touched; the same on Group and Profile. No test saw it: tests do not measure layout. Found by the built-in review. | Fixed: the wrapper keeps the same spacing. **Not seen on a device** |
| 2 | Major | `src/app/(tabs)/index.tsx` | Only the first of two things happening at once was shown as "Happening now"; the second sat under "Still to come" with nothing saying it had started. This came in with 004. | Fixed: a row under way says "Happening now" in its line |
| 3 | Major | `src/app/(tabs)/index.tsx` | The countdown reached zero and vanished, but the card kept saying "Next" for up to 30 seconds, because the plan's clock ticks every 30 seconds. | Fixed: at zero the screen looks at the clock at once (test added) |
| 4 | Minor | `src/app/tutorial.tsx` | A double tap on the tutorial's last buttons could leave twice: two sign-up screens stacked, or one screen too far back. | Fixed: one tap, one exit |
| 5 | Minor | `src/app/tutorial.tsx` | While swiping, the incoming page stayed dim until the pages came to rest, and a slow drag with no flick could leave the marks and buttons on the old step. A link opening on a later screen could show the first page with the later page's buttons. | Fixed: the step follows the pages as they move, and the starting page is set before first draw |
| 6 | Minor | `src/app/(tabs)/index.tsx` | The pulsing dot showed beside "Next" as well as "Happening now", so "live" was signalled when nothing was. | Fixed: it pulses only when something is happening |
| 7 | Minor | `src/ui/group-view.tsx` | Sharing the code had no handler for a failed share; "Code copied" was silent for screen-reader users. | Fixed: failure is ignored quietly; the words are announced |
| 8 | Minor | `src/ui/group-view.tsx` | An empty row left a blank gap above "Make an invite code". | Fixed |
| 9 | Note | `src/ui/motion.tsx` (`useCalm`) | Reduce Motion is read with the phone's own interface instead of the animation library's hook, and is unknown for the first instant. | Left on purpose: the router's test helper replaces the animation library with a stand-in that lacks that hook. With Reduce Motion on, a pulse may start for one frame |
| 10 | Note | several | The same capital-letter label style is written in three files. | Left: tidy-up, no effect |

**Verdict:** ready for your testing after the fixes above; re-tested. Motion, haptics, Reduce Motion and finding 1's fix can only be judged on the phone, and have not been.

## Checklist
- 1 Matches the spec and plan: ok. Qibla, tawaf, NativeWind and React Native Reusables are left out, with reasons in the log
- 2 Correct on real inputs: #2, #3. Countdown at zero, in the past and for a time that is not a number; a day with nothing timed shows no countdown
- 3 Errors: #7. A refused copy claims nothing (tested)
- 4 Concurrency and lifetimes: #3, #4. The one-second timer and the "copied" timer are cleared when their part leaves the screen
- 5 Builds that differ: animations do not run in tests (the library's stand-in puts everything in its final place), so tests prove content and state, never movement. Two new native libraries need a fresh native build: see the test report
- 6 Secrets and privacy: ok. The clipboard receives the invite code only when the admin taps Copy
- 7 Untrusted input: n/a
- 8 Tests: 7 added (countdown wording and ticking, zero, journey marks, swipe and buttons agreeing, copy confirmed and refused). Full suite passed
- 9 Performance: Today redraws once a second while open, for the countdown. Small; noted
- 10 Docs: spec, log, plan, changelog
- 11 Fits in: #10
- 12 Leftovers: ok

## Built-in code review
Ten findings. Seven confirmed and fixed (#1 to #8 above; two were combined). One left on purpose (#9). One tidy-up left (#10). One in 002 code, under "Seen nearby".

## Project rules (`CLAUDE.md`)
- Trip times never use the phone's zone: the countdown compares real instants from the trip plan; no zone is involved.
- Every screen renders offline: ok, nothing new uses the network.
- Sends safe against double taps: #4.
- No paid services: `expo-haptics` and `expo-clipboard` are free parts of Expo.

## Seen nearby (not changed)
- `src/ui/group-view.tsx`: if loading the current invite fails (weak hotel Wi-Fi), the card looks as if there is no code. "Make an invite code" would then cancel a code already shared, with no warning. From 002; worth its own small fix.
