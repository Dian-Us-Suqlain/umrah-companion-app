**Status: Awaiting approval** (written 11 Oct 2026)

# 001 — Foundation: a running app shell, the trip-plan logic, tests and builds

Background and sources: [01-domain-study.md](01-domain-study.md).

## Goals

1. An app that opens on an iPhone simulator, and builds for Android from the same code.
2. The trip-plan logic from the first app, ported to TypeScript with its tests, and shown on screen with an invented sample trip.
3. Proof that the time-zone logic gives the same answers on the phone as in the tests.
4. Three versions of the app that can sit side by side: development, staging, production.
5. Lint, type check and tests running on every pull request.

## Non-goals

- No accounts, login, groups or server. No network calls at all.
- No real trip data. No documents, flights status, locations, SOS, notifications, prayer times or guide.
- No TestFlight, App Store or Play Store build. No cloud builds (so no Expo account and no Apple Developer Program needed yet).
- No final visual design. Colours, icon and wording are placeholders, kept plain.
- No translation. Text goes through one string table so languages can be added later, but only English exists.

## What the owner sees

Three tabs.

**Today.** A card for "today" in the sample trip: day number, date, city, and the next things happening with their times. A line under the title says "Sample trip" so nobody mistakes it for real data.

**Plan.** The sample trip day by day:

```
DAY 3 · MON 5 JAN · Makkah
  05:40   Flight XY 123 lands · Jeddah            Everyone
  Check-in day   Sample Hotel Makkah              Everyone

DAY 4 · TUE 6 JAN · Makkah
  No fixed plans
```

Today is highlighted, a "Now" line separates past from next, past days are dimmed. A cancelled flight in the sample shows as cancelled here and on the Today card.

**Profile.** The app version, which variant it is (development / staging / production), and placeholders for "Privacy policy", "Sources" and "Delete account" marked "Coming later". In the development and staging variants only, a **Self-check** row (see below).

Because there is no real clock-linked trip, the sample trip is placed around the current date each time the app opens (it starts two days before today), so the Today card and the Now line always have something to show.

## Self-check screen (development and staging only)

Runs the time-zone test cases inside the app, on the phone's own JavaScript engine, and shows a pass or fail line for each: converting wall-clock times to instants and back for Riyadh, Karachi, London and New York, including dates on both sides of a daylight-saving change, and a trip clock when the phone is set to a different zone from the trip.

If any case fails on a phone, the fallback is to stop relying on the phone's built-in time-zone support and bundle time-zone data with the app. That would be recorded in the log as a deviation and re-tested the same way.

## Structure

```
app/                 screens and navigation (Expo Router), thin: no logic
src/core/            plain TypeScript, no React, no device APIs: trip plan, trip clock, time helpers
src/core/__tests__/  unit tests and the invented fixture trip
src/data/            the sample trip
src/ui/              shared components and the string table
app.config.ts        name, bundle identifier and icon per variant
eas.json             build profiles: development, staging, production, plus simulator
```

Rules the code follows:

- `src/core` never imports from React, Expo or `app/`. A lint rule enforces it.
- Trip logic never reads the phone's time zone or the current time itself; both are passed in.
- The trip's time zone is a field on the trip, not fixed to Saudi time as in the first app.
- TypeScript in strict mode.

## Versions and tools

- Expo SDK 57 (latest 57.0.x), React Native 0.86, Expo Router, TypeScript.
- Jest with the Expo preset for unit tests. ESLint with the Expo config.
- One end-to-end smoke test (opens the app, visits each tab, checks the Plan shows today's day) that runs locally on the simulator. Tool proposed: Maestro; confirmed during the build, with the choice logged.
- `npm run lint`, `npm run typecheck`, `npm test` are what the existing `checks` workflow calls.

## Variants

| Variant | Name on the phone | Bundle identifier |
|---|---|---|
| development | Umrah Companion (Dev) | `<base>.dev` |
| staging | Umrah Companion (Staging) | `<base>.staging` |
| production | Umrah Companion | `<base>` |

`<base>` is open question 1.

## Working without paid accounts

The owner's decision (11 Oct 2026): spend nothing until the app has an audience. Everything in this spec already fits that. What it means beyond this spec:

| Without paying | Possible? |
|---|---|
| Build and run on the iPhone simulator | Yes |
| Run on the owner's own iPhone | Yes, through Xcode, on up to 3 devices; the app stops opening after 7 days and has to be installed again |
| Give the iPhone app to anyone else (TestFlight, App Store) | No |
| Push notifications on iPhone | No |
| Build an Android app file and send it to people to install directly | Yes |
| Push notifications on Android | To be confirmed in the spec that adds notifications |
| Play Store | No (one-off fee) |

So until an Apple account exists, real people can only use the app on Android, or as a website built from the same code. Which of those is the way to reach the first users is a question for spec 002, not this one.

Every later spec's domain study must show its services fit a free plan, and say what the limit is.

## Edge cases

- Phone set to a zone other than the trip's: plan, Today and Now follow the trip's zone.
- Sample trip spans a month or year boundary when placed around today: day numbers and dates stay right.
- A day with nothing saved shows "No fixed plans"; a trip with no hotels shows "Travelling" as the city.
- Cancelled flight: marked cancelled on Plan and Today, never shown as "next".
- Large text size and dark mode set on the phone: screens stay readable.
- No network: nothing changes, since nothing uses it.

## Acceptance criteria

1. `npx expo run:ios` builds and opens the app on an iPhone simulator on the owner's Mac; the three tabs work.
2. An Android build of the same code completes (`npx expo prebuild` plus a Gradle build, or an emulator run). If no Android tools are installed, this is recorded as not tested rather than skipped silently.
3. Every test of the first app's trip-plan logic has an equivalent here, using invented data, and passes. No family names, hotels, flight numbers or dates appear anywhere in the repository.
4. The Self-check screen shows every case passing on the iPhone simulator (and on Android if criterion 2 ran on an emulator).
5. With the Mac's and simulator's time zone changed to one far from the sample trip's, Plan and Today are unchanged.
6. Development and staging variants install side by side on the simulator with different names.
7. The `checks` workflow runs lint, type check and tests on the pull request and passes; a deliberately broken test makes it fail (shown once, then removed).
8. `src/core` importing React or Expo fails lint.
9. The smoke test passes locally.

## Test plan

- Unit tests on Node 22 in CI and locally.
- Self-check on the simulator for the phone engine.
- Manual walk of the three tabs in light and dark mode, large text, and with the time zone changed.
- Not testable in this spec: real iPhones through TestFlight, push notifications, anything needing a server.

## Open questions for the owner

1. **Bundle identifier.** It is permanent once the app is in the store. Proposed: `com.dianussuqlain.umrahcompanion`. If there is a domain or company name the app should live under, use that instead.
2. ~~Apple Developer Program.~~ **Decided 11 Oct 2026: no paid accounts or services for now.** Store accounts are bought only once the app has an audience. See "Working without paid accounts" below.
3. **Licence.** The repository is public with no licence, which means others may read the code but not reuse it. Proposed: leave it that way while this is heading towards a product.
4. ~~Languages.~~ **Decided 11 Oct 2026: English only for now; Urdu is added later.** Text stays in one string table so that is possible.
5. ~~Next spec.~~ **Decided 11 Oct 2026: 002 is accounts and groups.** The app starts as a guest with no sign-up; sign-up and sign-in screens are reached later from profile settings. A group has an admin account; a person travelling alone has a simple account that acts as its own admin.
