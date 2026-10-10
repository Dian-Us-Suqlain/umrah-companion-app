# Umrah Companion

A mobile app for groups travelling for Umrah: the trip plan day by day, flights with live status, hotels, each traveller's documents, family locations, an SOS board, prayer times and Qibla, and a guide to the rites.

**Status: not built yet.** This repository holds the process and the specs. App code starts after the first spec is approved.

## Stack

- Expo (React Native) and TypeScript: one codebase for iPhone and Android. iPhone first.
- Backend to be decided in the specs.

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
