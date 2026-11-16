# Implementation plan: 002 — Accounts and groups

**Status: Draft, awaiting the owner's approval.** No feature code is written until this is approved.
Written 13 Nov 2026. Builds the approved spec: [specs/002-accounts-groups/02-spec.md](../../../specs/002-accounts-groups/02-spec.md).

Where things live: this project keeps specs in `specs/NNN-name/`. It had no place for implementation plans, so they go in `docs/implementation/NNN-name/`.

## What you get at the end

The app still opens as a guest with no network. From Profile a person can create an account, sign in, reset a password, see their group, invite people with a code, join a group, change roles, remove members, leave, sign out and delete their account. Each group's data is private to its members, enforced by the database and proven by tests.

## Before step 1: three things on this Mac

| Item | Why | Needs from you |
|---|---|---|
| **Java** (free, `brew install openjdk`) | Firebase's local database emulator runs on Java; none is installed. Every test in this spec uses the emulator. | Your OK to install it |
| **Firebase command-line tools** (free, added to the project as a development dependency) | Starts the emulator locally and in GitHub's checks | Nothing |
| **Slow tests** | The existing 2 test files take minutes on this Mac instead of seconds (measured 13 Nov). Fix first, or every later step is slow. Tracked as step 0. | Nothing |

Nothing here costs money or signs up for anything.

## Steps

Each step ends with its own tests passing. Work is on the branch `feat/002-accounts-groups`, cut from `staging`.

### Step 0 — Make the tests fast again (small fix, no spec needed)
- Find why Jest takes minutes: measured so far, the core test file alone took 64 seconds with file scanning limited to `src/`; the full run was still going after 2 minutes. Suspects: the 1.1 GB generated `ios/` folder being scanned, and Node 26 on this Mac while GitHub's checks use Node 22.
- Fix the cause in the Jest settings in `package.json`, and record the Node version the project expects.
- Done when: `npm test` finishes in under 30 seconds here, and still passes in GitHub.

### Step 1 — Prove Firebase works here (the spec's "first build step", criterion 0)
- Add the native Firebase libraries (app, authentication, Firestore) and the Expo build setting they need on iPhone.
- Add `firebase.json` and an emulator start script. A script writes a **fake "demo" configuration file** into a git-ignored folder at build time, so the emulator works and no real configuration file is ever in the repository (criterion 13).
- A temporary check screen (development builds only): sign up against the emulator, write a group, turn the network off, read it back.
- Run on the connected iPhone 14 Pro, or an existing simulator if the phone cannot reach the Mac's emulator. No new simulators.
- **Gate:** the result goes in the spec's log. If the libraries do not run on Expo SDK 57, I stop and come back to you with the Supabase fallback, as the spec says.

### Step 2 — The rules as plain code
- New folder `src/core/groups/`: the group and member types; invite codes (8 characters, no look-alike letters, formatting, hashing); who may do what; the last-admin checks; what happens to "current group" when someone is removed.
- Unit tests for every line of the spec's "Rules" section (criterion 12).
- No Firebase in this folder: it is pure logic, so screens and tests use it directly.

### Step 3 — Database rules and their tests
- `firestore.rules`, written from the spec's "Who can do what" table.
- Rules tests (in `rules-tests/`) against the emulator, covering every sentence of criterion 7: not signed in reads nothing; no reading or changing another group; members cannot do admin actions; nobody adds someone else; no joining without a valid unexpired invite; no self-promotion while joining; invites cannot be listed; no change leaves a group with members and no admin.
- New step in `.github/workflows/checks.yml` that starts the emulator and runs these tests on every pull request.

### Step 4 — Talking to Firebase
- `src/data/auth.ts`: sign up, sign in, sign out, reset password, send confirmation again, delete login.
- `src/data/groups.ts`: create the person's own group at sign-up, rename, make and cancel a code, look up a code, join, change role, remove, leave.
- Every change is written so that sending it twice equals sending it once (criterion 8). The own group gets an id derived from the account, so a repeated sign-up step cannot create two.
- Delete account as the spec's resumable sequence: leave joined groups, delete own group, delete user document, delete login; finished on next launch if interrupted (criterion 10).

### Step 5 — Session and current group
- A session provider at the app root: guest, or signed in with a current group. Works offline from Firebase's stored copy (criterion 9).
- Guest state stays on the phone; signing out returns to an empty guest state (criterion 11).

### Step 6 — Screens
- New: sign up, sign in, forgot password, group, join a group, delete account, and the "you need an account for this" sheet.
- Changed: Profile (guest and signed-in versions, exactly as drawn in the spec), `src/app/_layout.tsx` (new routes), `src/ui/strings.ts` (all wording), `src/ui/components.tsx` (text field and button).
- Screen tests with a fake data layer: every error message in the spec, disabled buttons for the same reasons the database would refuse, offline wording.

### Step 7 — Whole-flow test
- One scripted run against the emulator with two test accounts: sign up, invite, join, promote, remove, leave, delete (criteria 2, 4, 5, 6, 10, 11).
- The same flow by hand on the iPhone, plus: network off, wrong phone clock.

### Step 8 — Review, documents, pull request
- `test-feature`, then `review-feature`; fix findings and test again.
- Write `specs/002-accounts-groups/04-review.md`, update `CHANGELOG.md`, `README.md` and the spec's log and status.
- Open the pull request into `staging` for you, following the project's `release` skill. No assistant attribution anywhere.

## One addition for the commercial direction (no extra scope)

A tour operator will later own many groups. The approved design already lets one person be admin of several groups; what is missing is "create another group", which is a later spec. To keep that door open, the code in steps 2 and 4 will never assume a person administers exactly one group. Nothing visible changes in this spec.

## What cannot be finished without you

| Criterion | Blocked on |
|---|---|
| 3 — real confirmation and reset emails arrive | A free Firebase **staging project** created with your Google account (no card), and its two configuration files. Needed only at the end; everything else runs on the emulator. |
| Sign-up "link to the privacy policy" | A privacy page must exist. I can draft it and publish it free on GitHub Pages from this repository; you approve the wording. |
| Android on a real phone | An Android phone, if you have one. Otherwise GitHub's build check is the only Android evidence. |

## How it is verified

| Check | Command or method | Pass |
|---|---|---|
| Unit and screen tests | `npm test` | All pass, under 30 s |
| Rules tests | `npm run test:rules` (new) | All pass against the emulator |
| Types and lint | `npm run typecheck`, `npm run lint` | Clean |
| iPhone | Release build on the connected iPhone 14 Pro; walk the step 7 flow | No crash; flow completes |
| GitHub | `checks` and `android-build` on the pull request | Green |
| Spec | Each of the 14 acceptance criteria ticked in `04-review.md`, with what was and was not tested | 13 of 14 without the staging project; 14 with it |

## Risks

1. **Firebase's native library and Expo SDK 57 may not agree.** That is why step 1 is a gate.
2. **The emulator on a real iPhone** needs the phone and Mac on the same Wi-Fi. Fallback: an existing simulator.
3. **Slow tests** may turn out to be the Mac itself rather than the settings; then the fix is a Node change on this Mac, which I would ask you about first.

## After this spec: the road to a soft launch

Each line is its own study and spec for your approval. Order is a proposal.

1. **Trip, travellers and documents** — a group's real trip replaces the sample one.
2. **Board, alerts and SOS** — with notifications on Android; iPhone push needs Apple's paid programme.
3. **Flights with live status.**
4. **Locations.**
5. **Prayer times, Qibla and the guide.**
6. **Urdu.**
7. **Create more groups, and the operator console.**
8. **Store release and payments.**

A soft launch that people outside your family can install needs at least items 1 and 2. Android users can install from a file for free; iPhone users other than you need the Apple programme (99 USD a year).
