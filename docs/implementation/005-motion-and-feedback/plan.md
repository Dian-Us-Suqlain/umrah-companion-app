# Implementation plan: 005 — Motion, touch feedback and a journey view

Written 17 Nov 2026. Builds [specs/005-motion-and-feedback/02-spec.md](../../../specs/005-motion-and-feedback/02-spec.md). Built in the same sitting on the owner's "go ahead, build it"; see the spec's log.

| # | Step | Files | Done when |
|---|---|---|---|
| 1 | Motion parts | new `src/ui/motion.tsx` (Rise, Pulse, Fill, Appear, haptic helpers), new `src/ui/countdown.ts` | Unit test for the countdown text |
| 2 | Touch feedback | `src/ui/components.tsx` (Button, Row press in; light tap on the main button) | Existing tests pass |
| 3 | Today | `src/app/(tabs)/index.tsx` | Pulse, countdown, filling bar, skyline; test for the countdown |
| 4 | Plan | `src/app/(tabs)/plan.tsx` | Journey line; test for the marks |
| 5 | Tutorial | `src/app/tutorial.tsx` | Swipe and buttons agree; tests |
| 6 | Group | `src/ui/group-view.tsx` | Copy with "Code copied"; test |
| 7 | Arrival | Today, Plan, Group, Profile | Parts ease in, in order |
| 8 | Test, review, phone | `test-feature`, `review-feature` | Reports beside this file |

**Verification:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:rules`, `npx expo export --platform ios`, a signed Release build on the iPhone 14 Pro. Feel, haptics and Reduce Motion can only be judged by hand on the phone.

**Risks:** the animation library inside the test runner (it must be given its test set-up); two new native libraries need a fresh native build.
