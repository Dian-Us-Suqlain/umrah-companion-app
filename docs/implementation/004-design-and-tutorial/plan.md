# Implementation plan: 004 — New look, four tabs, tutorial, rules for every age

Written 17 Nov 2026. Builds [specs/004-design-and-tutorial/02-spec.md](../../../specs/004-design-and-tutorial/02-spec.md).
**Status:** built in the same sitting as it was written, on the owner's instruction to "continue with the plan, work on the UI". The owner did not approve this file separately; that is recorded in the spec's log.

## What you get at the end

A first launch opens a three-screen tutorial. After it, four tabs: Today, Plan, Group, Profile, in the paper, green and gold look of the mock-ups, in light and dark. Every button and row is at least 48 points tall and all text follows the phone's text size. Accounts, groups, the database rules and the trip logic are untouched.

## Steps

| # | Step | Files | Done when |
|---|---|---|---|
| 1 | Colours and sizes | `src/ui/theme.ts`, new `src/ui/contrast.ts` | A unit test computes contrast for every text and background pair, light and dark, and all pass 4.5 to 1 |
| 2 | Components | `src/ui/components.tsx`, new `src/ui/initials.ts` | Screen, Title, Card, HeroCard, Row, Avatar, Button, IconButton, Field, Notice, Badge, SectionLabel; unit test for minimum heights |
| 3 | Navigation | `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, new `src/app/(tabs)/group.tsx` | Four tabs; headers and tab bar in the new colours |
| 4 | Tutorial | new `src/app/tutorial.tsx`, new `src/ui/tutorial.ts` (the "seen" flag and when to show) | First launch shows it; Skip, Back, Next; both exits; replay from Profile |
| 5 | Today and Plan | `src/app/(tabs)/index.tsx`, `plan.tsx` | Hero card with what is happening now; same wording as before |
| 6 | Group | new `src/ui/group-view.tsx`, `src/app/group/[id].tsx`, `join.tsx` | Group tab for guest and signed in; invite code in a hero card; per-person options written in words |
| 7 | Profile and account screens | `src/app/(tabs)/profile.tsx`, `src/app/account/*.tsx`, `self-check.tsx` | As the mock-ups; groups no longer listed on Profile |
| 8 | Wording | `src/ui/strings.ts` | New words added; no existing sentence changed |
| 9 | Arabic font | `assets/fonts/Amiri-Regular.ttf` (SIL Open Font Licence, free), `app.config.ts` | The talbiyah is set in Amiri on a device |
| 10 | Tests | `src/__tests__/app.test.tsx`, `accounts.test.tsx`, new `design.test.tsx`, `src/ui/__tests__/*.test.ts` | See below |
| 11 | Test, review, screenshots | `test-feature`, `review-feature` | Reports beside this file; screenshots light and dark |

## Tests to add or change

- **New, logic:** contrast of every token pair; initials; when the tutorial shows.
- **New, screens:** first launch shows the tutorial; Skip; Back; both exits; never shown twice; replay; signed-in people are not shown it; the Group tab as guest and signed in; minimum heights of Button, Row, IconButton, Field.
- **Changed:** tests that looked for groups on Profile now look on the Group tab; tests that pressed Make admin or Remove first open that person's options. No sentence the tests check is reworded.
- **Unchanged:** the 38 database-rules tests and the 39 group-logic tests.

## How it is verified

| Check | Command | Pass |
|---|---|---|
| Types, lint | `npm run typecheck`, `npm run lint` | Clean |
| Unit and screen tests | `npm test` | All pass |
| Database rules | `npm run test:rules` | 38 pass (nothing changed; run to prove it) |
| Bundle | `npx expo export --platform ios` | Finishes |
| By eye | Screenshots of every screen, light and dark, from an existing simulator | Attached for the owner |
| Owner's iPhone | Development build on the iPhone 14 Pro | Owner walks the tutorial and tabs |

## Risks

1. **A native font needs a fresh native build.** Amiri is embedded at build time, so the app on the owner's phone must be rebuilt, not just reloaded. If the font is missing the phone's own Arabic font is used; nothing breaks.
2. **Two features in one working tree.** 002 is not committed. The marker `refs/snapshots/002-before-004` keeps them separable.
3. **Screenshots of signed-in screens need the local emulator running.**

## What needs the owner

- Look at the screenshots and walk the app on the iPhone (criteria 9 and 10).
- Check the Arabic of the talbiyah against a trusted copy.
- "commit" or "commit and push" for 002, then for 004.
- Still open from 002: the privacy page, and the free Firebase staging project for real emails.
