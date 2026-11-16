# 005 — Motion, touch feedback and a journey view: review

17 Nov 2026. Reviewed against the finished 004 work, before any commit.

## Findings
Ten: eight fixed, two left on purpose. The full table is in [docs/implementation/005-motion-and-feedback/review-report.md](../../docs/implementation/005-motion-and-feedback/review-report.md). The three that mattered most:
- **Making each part of a screen ease in removed the space between pieces of a part**, so cards would have touched on Today, Group and Profile. Fixed in the wrapper. No test measures layout, so this needs eyes on a phone.
- **The card kept saying "Next" for up to 30 seconds after the countdown reached zero.** Fixed: at zero the screen looks at the clock at once.
- **A second thing happening at the same time was not marked as under way.** Fixed.

**Left on purpose:** Reduce Motion is read from the phone directly and is unknown for the first instant, so a pulse may start for one frame; one label style is repeated in three files.

## Acceptance criteria

| # | Criterion | Result | How it was checked |
|---|---|---|---|
| 1 | Today shows a countdown that matches the next item and ticks | Pass | Screen tests, including reaching zero |
| 2 | Plan shows the journey line with today distinct | Pass | Screen test counts the three kinds of mark |
| 3 | Tutorial moves by swipe and by buttons, ending in the same state | Pass | Screen test sends a swipe, then presses Back |
| 4 | Copying the code shows "Code copied" | Pass | Screen test, including a refused copy claiming nothing |
| 5 | With Reduce Motion on, every screen is complete and still | **Not checked** | Needs a phone and a person |
| 6 | Earlier tests pass unchanged, apart from the tutorial's | Pass | 189 tests |
| 7 | The owner has felt it on the iPhone | Theirs to confirm | The app launches and stays up on the iPhone 14 Pro |

## What was tested, and how
Type check, lint, unit and screen tests, the 38 database-rules tests, an iPhone bundle, and a signed Release build installed and launched on an iPhone 14 Pro. Details: [test-report.md](../../docs/implementation/005-motion-and-feedback/test-report.md).

## What could not be tested
Anything that moves: animations do not run in the test runner, so tests prove content and state only. Haptics, Reduce Motion and the spacing fix above have not been seen on a device. Android on a phone.
