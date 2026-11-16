# Umrah Companion

A mobile app for groups travelling for Umrah: the trip plan day by day, flights with live status, hotels, each traveller's documents, family locations, an SOS board, prayer times and Qibla, and a guide to the rites.

**Status: early.** The app opens and shows an invented sample trip (Today, Plan, Group, Profile, after a short first-run tutorial), and has accounts and groups (sign up, sign in, invite and join with a code). There is no real trip data yet; see [`specs/`](specs/README.md) for what is built and what is next.

## Run it

Needs a Mac with Xcode and Node 22 or later.

```bash
npm install
npm run ios        # builds and opens the app on an iPhone simulator
npm test           # unit and screen tests
npm run test:rules # database privacy rules, against Firebase's local emulator (needs Java)
npm run lint
npm run typecheck
```

Every pull request also builds the Android app; the app file is attached to the pull request's "Checks" run.

## Firebase while developing

A development build talks to Firebase's local emulator, never to a real project. No Firebase configuration file is in this repository.

```bash
npm run firebase:demo-config   # writes made-up files into .firebase/ (git-ignored)
npm run emulators              # login and database emulators on this Mac
npm run ios
```

Staging and production builds need real files: set `GOOGLE_SERVICES_PLIST` and `GOOGLE_SERVICES_JSON` to their paths.

## Stack

- Expo (React Native) and TypeScript: one codebase for iPhone and Android. iPhone first.
- Firebase (login and shared data) from spec 002 on.

## How work happens here

1. Every feature starts as a spec in [`specs/`](specs/README.md): domain study, spec, owner approval, then code.
2. Feature branches open pull requests into `staging`.
3. A release is a pull request from `staging` into `main`, with a version and release notes in [`CHANGELOG.md`](CHANGELOG.md).
4. Checks run on every pull request. `main` and `staging` are protected; nothing is pushed to them directly.

## Branches

| Branch | Meaning |
|---|---|
| `main` | What is released. Each merge is a tagged version. |
| `staging` | What goes into the next release. Test builds come from here. |
| `feat/…`, `fix/…`, `spec/…`, `chore/…` | Short-lived work, merged into `staging` by pull request. |
| `hotfix/…` | Urgent fix to a released version, merged into `main` by pull request and then back into `staging`. |
