# Umrah Companion (native app) — working rules

A from-scratch rebuild of a private family web app as a public mobile product. Expo (React Native) + TypeScript, iPhone first, Android from the same code. This repository is public: everything committed here is visible to anyone.

## Never in this repository

- No assistant attribution. No `Co-Authored-By` lines naming an AI assistant, no "Generated with …" lines, in commits, pull requests, release notes, issues or comments. Everything goes out under the owner's git identity. The `checks` workflow fails a pull request that breaks this.
- No real people's data: names, passport or visa numbers, booking references, phone numbers, real trip dates. Fixtures and screenshots use invented data.
- No keys, tokens or signing files. Secrets live in GitHub and EAS secrets.

## No paid services

The owner is spending nothing until the app has an audience: no Apple Developer Program, no Play Console, no paid plans. Use free plans only, state their limits in the domain study, and never sign up for, upgrade or enter payment details on anything. If a feature cannot be done for free, say so in the spec instead of working around it.

## Feature workflow (required for every new feature)

1. **Domain study** — research the problem and constraints before designing. Verify outside facts (religious text, travel rules, platform and store rules, service limits and prices) against trusted sources and cite them.
2. **Spec** — write it in `specs/NNN-feature-name/` (see `specs/README.md`). Log every decision and its reason there.
3. **Approval** — stop and get the owner's approval of the spec. Do not write feature code before that.
4. **Implementation** — build to the approved spec on a feature branch; record deviations in the spec's log.
5. **Review and pull request** — follow the `release` skill: self-review, fix the findings, write `04-review.md`, open the pull request into `staging`.

Small fixes do not need a spec; say so and proceed.

## Branches and releases

- `main` is what is released; `staging` is the next release. Both are protected: no direct pushes, no force pushes, checks must pass.
- Work happens on short branches (`feat/`, `fix/`, `spec/`, `chore/`) and reaches `staging` by pull request.
- A release is a pull request from `staging` into `main`. The owner reviews and merges every pull request. Never merge into `main`; merge into `staging` only when the owner says so.
- The `release` skill has the steps, the commit and release-note format, and the versioning rules.

## Design rules learned from the first app

- Times on items are wall-clock strings with no zone: flights are local to each airport; everything else is local to where the group is. Never use the viewer's phone zone for trip logic.
- Flight status comes from a real source, checked automatically, and a failed or stopped check must be visible to the admin. A cancelled flight changes every screen that mentions it: plan, countdowns, reminders, notifications.
- Travellers are often offline or on hotel Wi-Fi and some are not technical. Every screen renders from stored data with no network; wording is plain.
- Every send (message, SOS, alert) is safe against double taps and retries: one tap, one message.
- The admin can send an alert on demand from any environment that is meant to reach real phones.
- Religious content (guide, duas, prayer times) names a checkable source.
- Each group sees only its own data, enforced on the server, not only in the app.

## Testing

- Logic lives in plain TypeScript modules with unit tests, separate from screens.
- Tests never send notifications to real users and never write to production data. Tests that write clean up after themselves.
- Ask before sending any notification to real users and before changing production data.
