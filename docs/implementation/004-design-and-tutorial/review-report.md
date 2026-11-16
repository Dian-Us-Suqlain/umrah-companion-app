# Review: 004 — New look, four tabs, tutorial, rules for every age
17 Nov 2026 · `refs/snapshots/002-before-004` (the reviewed 002 work, uncommitted)..working tree · 41 files (28 changed, 13 new)

| # | Severity | Where | Finding | Status |
|---|---|---|---|---|
| 1 | Major | `src/ui/tutorial.ts` | The "tutorial seen" flag was stored under the `uc.` prefix. Signing out, deleting an account and "Erase data on this phone" remove every `uc.` key on the real backend, so each would have brought the tutorial back on the next launch. The spec says they must not. The in-memory backend used by the screen tests does not clear storage, so no test saw it. | Fixed: the key is now `device.tutorial-seen` (test added on the key). Not yet confirmed on a phone |
| 2 | Major | `src/app/(tabs)/group.tsx`, `src/ui/group-view.tsx` | Switching groups from "Your groups" kept the previous group's half-typed rename, open options and invite code on screen. Saving would have given group B group A's name; Share would have sent A's code under B's name. Found by the built-in review. | Fixed: each group gets its own fresh view (test added, and seen to fail without the fix) |
| 3 | Minor | `src/app/tutorial.tsx` | Opened by a link in replay mode, with nothing to go back to, the last screen's button did nothing. | Fixed: falls back to Profile |
| 4 | Minor | `src/ui/group-view.tsx` (`Invites`) | Members and people with an unconfirmed email asked the server for the invite code although they are never shown it. | Fixed: only asked when the person may invite |
| 5 | Minor | `src/__tests__/app.test.tsx` | Four tests ended before the app had finished starting, printing a React `act(...)` warning. | Fixed in the tests (no assertion changed) |
| 6 | Blocker (spec) | `src/ui/initials.ts` | The spec says each person has an avatar with their initials. The function returns no letters, so every circle shows a person icon. | Fixed after the review, at the owner's request: first and last word's first letters (7 tests) |
| 7 | Note | `specs/004-design-and-tutorial/02-spec.md` criterion 9 | Screenshots of every screen, light and dark, are not attached. | Left: see the test report |
| 8 | Note | `src/ui/strings.ts` (talbiyah) | The reference (Sahih al-Bukhari 1549) is confirmed by search results quoting sunnah.com; the page itself refused an automated read, so the Arabic wording was not compared letter by letter. | Left: please check it against a trusted copy |

**Verdict:** ready for your testing after the fixes above; re-tested (see the test report). Not ready for a pull request until the screenshots are done.

## Checklist
- 1 Matches the spec and plan: #6, #7; eight deliberate differences are recorded with reasons in `specs/004-design-and-tutorial/03-log.md`. The plan was not approved separately before building; the log says so
- 2 Correct on real inputs: #3. First run, a second launch, a reinstall with a restored sign-in, an unreadable flag (treated as not seen) and a bad `step` in a link are covered by tests
- 3 Errors: ok. A failed read or write of the flag is swallowed on purpose: repeating the tutorial is harmless. Every other error path is the 002 code, unchanged
- 4 Concurrency and lifetimes: #2. The start-up cover is removed as soon as the flag and the sign-in state are known
- 5 Builds that differ: the font and the splash colour exist only in a native build. Checked in the bundle and the generated project; on a phone, see the test report
- 6 Secrets and privacy: ok. Nothing new leaves the phone. The one new stored value is a yes/no flag
- 7 Untrusted input: ok. The `step` value in a link is clamped to 1 to 3
- 8 Tests: #5. 83 added (contrast of every colour pair in light and dark, sizes, the tutorial's rules, the Group tab, source scan for hand-written colours and text sizes). Full suite passed
- 9 Performance: ok. One storage read at start-up
- 10 Docs: changelog, README, spec, log, study, plan, and a sheet for watching someone use the app
- 11 Fits in: ok. Screens no longer write a colour or a text size; a test enforces it
- 12 Leftovers: ok. The `step` link is kept on purpose and recorded in the log. No probes or logging

## Built-in code review
Ten findings.
- **Confirmed and fixed:** group state carried between groups, and a stale invite code after a switch (#2); invite fetched by people who cannot see it (#4).
- **Known and left:** `initials()` unfinished (#6).
- **Not reproduced:** "emails are sent untrimmed": the backend cleans them, and an existing test signs up with `'Aisha@Example.com '`.
- **In 002 code this change did not touch:** moved to "Seen nearby".

## Project rules (`CLAUDE.md`)
- Every screen renders offline: ok. The tutorial and the tabs need no network; the flag is on the phone.
- Wording is plain: ok. The tutorial was cut back to promise only what exists today.
- Religious content names a checkable source: the talbiyah's source is on the welcome screen (#8).
- Sends safe against double taps: unchanged; buttons still switch off while busy.
- No real people's data: ok, invented names and codes.
- No paid services: ok. Amiri is free under the SIL Open Font Licence; its licence file is beside it.
- No assistant attribution: nothing committed.

## Seen nearby (not changed)
- `src/ui/session.tsx`: the saved "current group" is one value for the phone, not per account, and reading or saving it has no error handling. Harmless today because a group the person is not in is ignored.
- `src/ui/session.tsx`: if the backend ever reported one person directly after another with no sign-out between, the first person's groups would show for a moment.
- `src/ui/use-sample-plan.ts`: Today and Plan each rebuild the whole sample plan every 30 seconds.
- `src/app/group/join.tsx`: "Send again" for the confirmation email gives no "Sent" message here, unlike on Profile.
- `src/ui/strings.ts`: the "That isn’t allowed" message says "Pull down to refresh", and no screen can be pulled down.
- `src/app/account/sign-in.tsx`: an empty password gives the "don't match an account" message.
- `README.md` says Node 22 or later; this Mac has Node 26. Both work.
