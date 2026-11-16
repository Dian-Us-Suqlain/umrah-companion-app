# Hand-off: 004 — New look, four tabs, tutorial (17 Nov 2026)

## Where things stand
- **Built, tested and reviewed**, not committed. Branch `feat/002-accounts-groups` holds two uncommitted features: 002 (accounts and groups) and 004 (this one) on top.
- The 002-only state is kept at the local marker `refs/snapshots/002-before-004` (not a branch, not pushed), so the two can be committed separately: commit that tree first, then the rest.
- A signed Release build with everything is **installed on the iPhone 14 Pro** but was refused at launch: the developer profile must be trusted on the phone (Settings › General › VPN & Device Management).

## Decisions made
- Spec 004 treated as approved ("looks fine", 13 Nov) and built on "continue with the plan, work on the UI" (17 Nov). The plan was not approved separately.
- Seven "rules for every age" added to the spec from `specs/004-design-and-tutorial/01-domain-study.md` (48-point targets, words with every icon, no swipe-only navigation, one filled button per screen).
- Eight differences from the mock-ups, with reasons, in `specs/004-design-and-tutorial/03-log.md`.

## Reports
- `test-report.md`: 176 tests, 38 rules tests, types, lint, bundle and the phone build pass; launch on the phone failed (trust); only the first screen was looked at on a simulator.
- `review-report.md`: eight findings, five fixed; three left for the owner.

## Waiting on the owner
1. (Done 17 Nov: initials are written and tested.)
2. Trust the profile on the iPhone, walk the tutorial and the four tabs, light and dark.
3. `watch-someone-use-it.md` with an older relative.
4. Check the Arabic of the talbiyah against a trusted copy.
5. "commit" or "commit and push", for 002 and then 004. The project's `CLAUDE.md` forbids assistant attribution in commits.
6. Still open from 002: the privacy page; the free Firebase staging project for real emails.

## Next steps
- After 1 and 2: rerun `test-feature`, write `specs/004-design-and-tutorial/04-review.md`, pull request into `staging`.
- Next feature, proposed order (each its own study and spec): trip, travellers and documents · **Urdu (moved up)** · board, alerts and SOS · flights with live status · locations · prayer times, Qibla and the guide · operator console · store release and payments.

## Kept on this Mac
- `/private/tmp/claude-501/-Users-dianussuqlain-Desktop-Projects/22f885a7-ab5a-4074-9145-562b8c53b524/scratchpad/ddr` (4.2 GB): the signed Release build, kept for the rerun. Safe to delete.
