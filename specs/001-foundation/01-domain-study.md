# 001 — Foundation: domain study

Written 11 Oct 2026. Facts were checked on that date; prices and limits change, so re-check before relying on them later.

## What this feature is for

There is no app yet. Before any real feature (accounts, documents, flights, SOS) can be built and reviewed, the project needs a skeleton that runs on a phone, a place for logic with tests, separate development / staging / production builds, and checks that run on every pull request. This spec covers only that. It deliberately contains no accounts, no server and no real data, so it can be built and reviewed without any of the hard product decisions (login service, where documents live, hosting).

## Who uses the result

- The owner: installs a build, sees the app open and show a sample trip plan, and reviews pull requests against something that runs.
- Future feature work: every later spec builds on this structure.
- Nobody else yet. Nothing here is released to travellers.

## Facts checked

### The stack today

| Fact | Source |
|---|---|
| The current Expo SDK is 57 (npm `expo@57.0.27`). It uses React Native 0.86 and React 19.2. | [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57), `npm view expo version` on 11 Oct 2026 |
| SDK 57 needs iOS 16.4 or later on the phone, Android 7 or later, Xcode 26.4 or later and Node.js 22.13.x. | [Expo SDK reference](https://docs.expo.dev/versions/latest/) |
| The owner's Mac has Xcode 27.0, eight iPhone simulators and Node 26.5. Xcode is new enough. Node is newer than the documented 22.13.x; the automatic checks will run on Node 22 so the documented version is the one that is tested. | Checked on the machine |
| Early SDK 57 releases had a memory problem in the JavaScript engine (Hermes), fixed from `expo@57.0.9`, and a slow-start problem fixed from `expo@57.0.17`. Start from the latest 57.0.x. | [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57) |

### Building and installing

| Fact | Source |
|---|---|
| A build for the iPhone simulator needs no Apple developer account. | [Expo: build for iOS simulators](https://docs.expo.dev/build-reference/simulators/) |
| Without the paid programme, an app can be put on a personal iPhone through Xcode, but only on up to 3 devices and it stops working after 7 days. | [Apple: compare memberships](https://developer.apple.com/support/compare-memberships/) |
| The Apple Developer Program costs 99 USD per year. It is what gives access to App Store Connect, which is where TestFlight and App Store distribution are managed, and to push notifications. | [Apple Developer Program: what's included](https://developer.apple.com/programs/whats-included/), [compare memberships](https://developer.apple.com/support/compare-memberships/) |
| Expo's build service (EAS) has a free plan: 15 iPhone and 15 Android builds, over-the-air updates for up to 1,000 monthly users, up to 60 minutes of its own CI. The paid Starter plan is 19 USD a month plus usage. Free accounts are never charged for going over; builds stop until the quota resets. | [Expo pricing](https://expo.dev/pricing), [Expo billing plans](https://docs.expo.dev/billing/plans/) |
| Development, staging and production versions can be installed side by side if each has its own bundle identifier, chosen from an `APP_VARIANT` setting in `app.config`. | [Expo: install app variants on the same device](https://docs.expo.dev/build-reference/variants/) |

### Store rules that shape the structure from day one

| Fact | Source |
|---|---|
| Every app needs a privacy policy linked in the store listing and inside the app. | [App Store Review Guidelines 5.1.1(i)](https://developer.apple.com/app-store/review/guidelines/) |
| An app that lets people create an account must let them delete it inside the app. | Guidelines 5.1.1(v), same page |
| TestFlight builds must already follow the review guidelines. | Guidelines 2.2, same page |
| "Inaccurate or misleading quotations of religious texts" are grounds for rejection. This backs the rule that guide and dua content names a checkable source. | Guidelines 1.1.5, same page |

None of these need work in this spec (no accounts, no religious content yet), but they are why the shell has a "More" area where the privacy policy, account deletion and content sources will live.

## What carries over from the first app

The first app's trip-plan builder is one 160-line file of plain JavaScript with no screen or network code: it turns saved flights, hotels and bookings into a day-by-day plan, works out "now" on the trip's clock, and writes the morning notification text. It has unit tests. It is the most tested part of the old app and the part that had the hardest bugs (time zones, cancelled flights), so it is the right first thing to port.

Two things about it must change:

1. It assumes the trip is always on Saudi time (`Asia/Riyadh` is fixed in the code). A public product needs the trip's zone to be part of the trip.
2. Its test data is the family's real trip. This repository is public, so the tests need an invented trip.

## Risks

1. **Time-zone code may behave differently on the phone than in tests.** The trip clock relies on the JavaScript `Intl.DateTimeFormat` feature with a named time zone and `formatToParts`. Unit tests run on Node, which supports this fully. Phones run a different engine, Hermes. Its documentation lists `Intl.DateTimeFormat` as supported with a few missing options (`numberingSystem`, `formatMatcher` on iPhone; `dayPeriod`, `fractionalSecondDigits`, `formatMatcher` on Android), none of which this code uses, but it does not explicitly confirm `formatToParts` or named time zones ([Hermes Intl documentation](https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md)). I could not confirm this from a source, so the spec makes it something that is tested on the phone engine itself, with a fallback if it fails.
2. **Real-phone testing is limited without the Apple programme.** Until the owner enrols, the app can be reviewed on the simulator, or on the owner's own iPhone for 7 days at a time. Push notifications and TestFlight are not possible. That is acceptable for this spec and blocks the next ones.
3. **Android cannot be fully checked on this Mac yet.** Whether Android Studio and an emulator are installed is not known. The spec treats Android as "must build from the same code; tested on an emulator if one is available, otherwise recorded as not tested".
4. **Choosing structure before the product decisions.** Folder layout and navigation chosen now may not fit once accounts and groups exist. Mitigation: keep the shell small (three tabs with placeholders) and keep all logic outside screens.
