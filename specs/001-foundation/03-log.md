# 001 — Foundation: log

## 11 Oct 2026

- **Owner decisions before this spec:** keep the first app's repository private and untouched; build the new app with Expo (React Native) and TypeScript; new public repository `umrah-companion-app`.
- **Repository set up** with `main` and `staging`, both protected (pull request required, `checks` must pass, no force pushes, rules apply to the owner's account too). Required approvals are 0 because GitHub does not let an account approve its own pull request; the owner's review is the merge.
- **Default branch is `staging`** so new pull requests target it without anyone having to remember. `main` only receives release and hotfix pull requests; a check enforces that.
- **Commits use the owner's GitHub no-reply address** rather than their personal email, because every commit in a public repository is readable by anyone. Reason: avoid publishing the address. Can be changed if the owner prefers.
- **First spec is the foundation only**, with no accounts, server or real data. Reason: it can be built and reviewed without the hard decisions (login service, where documents are stored, hosting), and those decisions deserve their own study.
- **Trip-plan logic is the first thing ported.** Reason: it is the best-tested part of the first app, has no screen code, and exercises the time-zone handling that is most likely to differ on a phone.
- **Hermes time-zone support could not be confirmed from documentation.** Decision: test it on the phone engine as an acceptance criterion instead of assuming.
- Spec written and sent to the owner for approval.
- **Owner decision: no money spent for now.** In their words: "I don't want to spend any money for now, once we get a proper advertisement, some users, then we'll look into buying an account to post the application on play store and app store." Open question 2 (Apple Developer Program) is closed: not enrolling. Consequence recorded in the spec: without an Apple account the iPhone app cannot reach anyone but the owner's own phone, and iPhone push notifications are not possible; Android installs by file and a web version remain free. This spec's scope is unchanged.
- **Owner decisions:** the restrictions of working without store accounts are accepted. English only for now, Urdu later. Spec 002 is accounts and groups, in the owner's words: "accounts, groups, an admin account for groups, for single individuals, a simple account would work that would technically act as an admin in itself. I need the signup/signin screens, start with a guest account, users can be prompted to sign up or sign in later through their profile settings."
- **Effect on this spec:** the third tab is called "Profile" rather than "More", since that is where sign-up and sign-in will be reached from in 002. Nothing else changes; there are still no accounts here.
- Still open: bundle identifier and licence (owner asked what they mean; explained, awaiting a choice).
- **Owner decision:** bundle identifier is `com.dianussuqlain.umrahcompanion`. The only question left is the licence; the repository stays without one until the owner chooses, which does not block the build.
- **Approved by the owner, 11 Oct 2026**, in the conversation: "go ahead with firebase, start building the application, I have already connected my iphone as well and xcode is ready too." Firebase is for spec 002; it does not change this spec. Building starts on `feat/001-foundation`. The owner's own iPhone is connected, so criterion 1 is also tried on a real phone through Xcode's free signing.

## 11 Oct 2026 — build

- **Screens live in `src/app/`, not `app/`.** Reason: it is where the current Expo template puts them, with the `@/` import alias pointing at `src/`. Everything else in the spec's structure is as written.
- **`shortDate` is written by hand** ("Wed 13 Jan") instead of using the phone's date formatting. Reason: different engines format dates differently, and this text ends up in notifications.
- **The first app's `stays` tests were not ported.** They test the server code that detects hotel check-ins from locations, which is not part of the trip-plan logic. How the plan uses a detected stay is ported and tested.
- **Words produced by the trip-plan logic are still English inside `src/core`** ("No transport saved for…", "Check-in", "lands 00:10 next day"). Screen text is in the string table. Moving the logic's words out is left for the spec that adds Urdu.
- **Tap-through test: Jest with Expo Router's test helper, not Maestro.** Reason: Maestro needs Java, which is not on the owner's Mac, and installing it was not asked for. The Jest tests open the real screens, visit every tab and the self-check, and run in the `checks` workflow on every pull request, which a local-only Maestro flow would not have. Cost: they do not run on a real simulator.
- **Android is built in the `checks` workflow, not on the Mac.** Reason: the Mac has no Android SDK or Java. The workflow keeps the app file for 14 days so it can be installed on an Android phone.
- **The time-zone risk is closed.** The self-check ran on the iPhone simulator's Hermes engine (250829098.0.17): all 20 cases passed, including named zones and daylight-saving changes. No fallback needed.
- **Testing library pinned to version 13.** Version 14 changed `render` to be asynchronous and Expo Router's test helper for SDK 57 does not support it yet.
