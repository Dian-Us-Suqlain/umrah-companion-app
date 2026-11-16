# 004 — A new look, four tabs, a tutorial and rules for every age: review

17 Nov 2026. Reviewed against the finished 002 work, before any commit.

## Findings
Eight: six fixed, two left for the owner. The full table is in [docs/implementation/004-design-and-tutorial/review-report.md](../../docs/implementation/004-design-and-tutorial/review-report.md). The two that mattered most:
- **Signing out, deleting an account or erasing the phone's data would have brought the tutorial back**, because the "seen" flag sat among the keys those actions remove. Fixed: it is stored under a name they do not touch.
- **Switching groups kept the previous group's half-typed rename and invite code on screen**; saving would have renamed the wrong group. Fixed: each group gets a fresh view.

**Left for the owner:** screenshots of every screen (only the first tutorial screen was captured); checking the Arabic of the talbiyah against a trusted copy.

## Acceptance criteria

| # | Criterion | Result | How it was checked |
|---|---|---|---|
| 1 | Fresh install opens the tutorial; "Look around first" lands on Today; next launch goes straight to Today | Pass | Screen test |
| 2 | "Create an account" opens sign-up and lands on Profile, signed in | Pass | Screen test |
| 3 | "Show the tutorial again" shows it; leaving returns to Profile | Pass | Screen test |
| 4 | Four tabs; Group shows the group or the guest explanation | Pass | Screen tests |
| 5 | Screens use only the design system's colours and sizes | Pass | A test scans every screen file |
| 6 | Every text and background pair passes 4.5 to 1, light and dark | Pass | Unit test over all 22 pairs in both modes |
| 7 | Buttons and rows at least 48 points; text scaling never switched off | Pass | Unit test on the components; source scan |
| 8 | Earlier tests pass with wording unchanged | Pass | Tests that looked for the group on Profile now look on the Group tab; no checked sentence reworded |
| 9 | Screenshots of every screen, light and dark | **Not met** | Only tutorial screen 1, light and dark, in `docs/implementation/004-design-and-tutorial/screenshots/` |
| 10 | Launches on the owner's iPhone; owner has walked it | Part | It launches and stays up on the iPhone 14 Pro (17 Nov). The owner's walk is theirs to confirm |
| 11 | Watched an older relative use it | Not done | Sheet written: `docs/implementation/004-design-and-tutorial/watch-someone-use-it.md` |

## What was tested, and how
Type check, lint, unit and screen tests, the 38 database-rules tests, an iPhone bundle, and a signed Release build installed on an iPhone 14 Pro. Details and output: [test-report.md](../../docs/implementation/004-design-and-tutorial/test-report.md).

## What could not be tested
Every screen by eye; the largest text size and a 320-point-wide phone; the tutorial flag surviving sign-out on the real backend (unit-tested only); Android on a phone.
