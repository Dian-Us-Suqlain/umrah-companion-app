**Status: Approved 13 Nov 2026** (the owner looked at the mock-ups and said "looks fine", then asked for it to be built on 17 Nov 2026). Revised 17 Nov 2026 after the [all-ages study](01-domain-study.md); the revisions are marked "(all ages)". Depends on [002 — Accounts and groups](../002-accounts-groups/02-spec.md), which is built but not yet merged.

# 004 — A new look, clearer navigation and a first-run tutorial

## Why

The owner tried the development build on an iPhone on 13 Nov 2026 and rejected how it looks. Everything works, but every screen is a stack of plain white cards with outlined buttons, there is no welcome, and groups are buried inside Profile. The original family web app (`umrah-companion`) has a look the family already used and liked. This spec brings that look to the native app and adds a tutorial.

Mock-ups of six screens, drawn before any code: https://claude.ai/artifact/MYMNMfvYEfjVFCqw9pdteE (private to the owner).

## Background: what was studied

- **The web app's design** (`public/css/styles.css` and `docs/designs/` in the web app's repository): warm paper background, deep green, a gold accent, large rounded cards with a soft shadow, a green "hero" card at the top of a screen, Amiri for Arabic text, light and dark versions of every colour.
- **The native app today:** `src/ui/theme.ts` (11 colours), `src/ui/components.tsx` (card, text, button, field), 3 tabs.
- **Who holds the phone** ([01-domain-study.md](01-domain-study.md)): every group is likely to include someone over 60 and someone who rarely uses apps; most people in a group only read Today.
- **Apple's guidance** that controls be at least 44 points tall, Google's of 48, and the accessibility rule that text contrast be at least 4.5 to 1. The gold of the web app fails that on the paper background as text, so gold is used for decoration and on green only; a darker gold is used for text.

## Goals

1. **One design system**, taken from the web app, in `src/ui/`: colours (light and dark), type sizes, spacing, corner sizes, and a small set of components every screen uses.
2. **Every existing screen restyled** with it: Today, Plan, Profile, sign up, sign in, reset password, edit name, delete account, group, join a group, self-check.
3. **Navigation with four tabs:** Today, Plan, **Group**, Profile. The group gets its own tab instead of living inside Profile.
4. **A tutorial on first launch:** three screens, skippable, never shown again unless asked for.
5. Nothing that works today stops working: the same rules, the same server code, the same tests still pass.

## Non-goals

- **No new features.** Documents, flights with live status, hotels, the family board and SOS, locations, prayer times, the guide, weather and currency all exist in the web app and are not in the native app yet. Each is its own spec (the order is in `docs/implementation/002-accounts-groups/plan.md`). This spec only makes room for them in the navigation and the look.
- No Urdu yet. No animations beyond the system's own screen transitions. No custom illustrations or photographs.
- No change to accounts, groups, the database rules or the trip-plan logic.

## The design system

| Token | Light | Dark | Used for |
|---|---|---|---|
| Background | `#F5F2EB` | `#0D1211` | Every screen |
| Card | `#FFFEFB` | `#151B19` | Cards, the tab bar, text boxes |
| Ink | `#1A211F` | `#F3F2EE` | Text |
| Muted | `#5C645F` | `#A5ADA8` | Secondary text (darker than the web app's, to pass contrast) |
| Line | `#DED8CE` | `#28322F` | Borders and dividers |
| Green | `#163A34` | `#8DB4A5` | Main buttons, the hero card, the active tab |
| Green soft | `#F0ECE4` | `#1B2421` | Icon backgrounds, quiet panels |
| Gold | `#E6D3AE` on green, `#5E4514` as text | `#D2AE73` | Accents on the hero card, small labels |
| Gold soft | `#F4EAD6` | `#2E2713` | Badges |
| Danger | `#8C1D18` on `#FBE4E1` | `#FF8A80` on `#3A1F1C` | Cancelled flights, destructive actions |

- **Type:** the phone's own font (San Francisco on iPhone, Roboto on Android), sizes 30 (screen title), 22, 17, 16, 14, 12. Amiri for Arabic phrases, bundled with the app so it works offline.
- **Shape:** cards 22 to 26 points round; buttons 16 to 18; everything tappable at least **48** points tall (all ages; the first draft said 44); main buttons 56.
- **Components** (`src/ui/components.tsx`): Screen, Title, Card, HeroCard, Row (icon, label, chevron), Avatar (initials), Button (filled, outlined, plain, danger), Field, Notice, Badge, SectionLabel, TabBar icons.
- **Icons:** the Ionicons set already in the app. No emoji.

## Rules for every age (all ages)

From the study, section 5. Each applies to every screen in this spec and to every later one.

1. Every button and row is at least 48 points tall; main buttons 56.
2. All text follows the phone's text-size setting. Anything a person must read to act is 16 points or more; 13 is the smallest size, for labels only.
3. Every icon that can be tapped has words beside it, or opens choices written in words. Nothing is reachable only by a swipe: the tutorial has Next and Back buttons.
4. One filled button per screen: the main action. Destructive actions are red, never filled, and ask first.
5. Today shows what is happening now (or next) in the largest text on the screen, above everything else.
6. Colour is never the only signal: a cancelled flight is red, says "Cancelled", and is struck through.
7. No separate "simple mode": one design for everyone.

## Screens

### Tutorial (new)
Three screens, as in the mock-ups:
1. **Welcome** (green): "Your whole Umrah trip in one place", with the talbiyah in Arabic above it.
2. **Travel as a group:** a small picture of a group and an invite code.
3. **Ready when you are:** three reassurances (works without internet, private to your group, no account needed to look around) and two buttons: **Create an account** and **Look around first**.

Rules:
- Shown on the first launch only. "Skip" on screens 1 and 2 jumps to screen 3. Leaving by either button on screen 3 marks it seen.
- "Seen" is stored on the phone. **Erase data on this phone** and deleting an account do not bring it back; reinstalling does.
- **Show the tutorial again** is a row on Profile.
- It needs no network and no account. Someone already signed in (after a reinstall with a restored sign-in) is not shown it.

### Today and Plan
The same content as now, restyled: a green hero card for the day ("Day 3 of 10 · Makkah") with what is happening now, a red panel for a cancelled flight, the rest of the day as rows in one card. The "Sample trip" label becomes a small gold badge.

### Group (new tab)
- Signed in: the current group's screen from spec 002, restyled. The invite code sits in a green hero card with Share and New code. Each person has an avatar with their initials; an admin reaches Make admin and Remove through a "…" button on the row instead of two full-width buttons per person. The "…" opens the choices, written in words, directly under that person (all ages: no hidden menu, no long-press).
- A person with more than one group switches between them from the title of this tab.
- Guest: a short explanation and the two buttons, Create an account and Sign in, plus "Join a group with a code" (which explains that an account is needed).

### Profile
- Guest: one card (You're a guest; Create an account; Sign in), then rows: Join a group with a code, Show the tutorial again, Privacy policy; then Erase data on this phone.
- Signed in: name and email with an avatar, the "confirm your email" panel when needed, rows for Edit name, Show the tutorial again, Privacy policy, Sign out, Delete account.
- Version and app type move to small text at the bottom. The self-check row stays, for non-production builds only.

### Account screens
Sign up, sign in, reset password, edit name, delete account, join a group: the same fields, wording and rules as spec 002, with the new fields and buttons.

## Edge cases

- Dark mode: every screen, from the phone's setting. Checked in both.
- Larger text sizes set on the phone: text grows; rows grow with it; nothing is cut off at the largest standard size.
- Small phones (iPhone SE width, 320 points): the tutorial's text and buttons still fit without scrolling past the buttons; other screens scroll.
- The tutorial is closed with the app's switcher half-way through: it starts again next launch.
- A long group or person name: one line, shortened with "…" in rows; shown in full on its own screen.
- Initials for a one-word name, a name in Urdu or Arabic script, or an empty name: first letter(s) of what there is; a person icon when there is nothing.

## Acceptance criteria

1. A fresh install opens on the tutorial; "Look around first" lands on Today with the sample trip; the next launch opens straight on Today.
2. "Create an account" on the tutorial opens sign-up, and after signing up the person lands on Profile, signed in.
3. "Show the tutorial again" on Profile shows it, and leaving it returns to Profile.
4. Four tabs: Today, Plan, Group, Profile. The Group tab shows the current group for a signed-in person and the guest explanation otherwise.
5. Every screen listed under Goals 2 uses only the components and colours of the design system: no colour or font size written directly in a screen file.
6. Every text and background pair in the token table passes 4.5 to 1 contrast in light and dark (computed in a unit test).
7. Every button and row is at least 48 points tall (checked in a unit test on the components), and no component switches off the phone's text-size setting (all ages).
8. All existing tests still pass with wording unchanged (93 unit and screen tests, 38 database-rules tests), apart from tests that looked for layout that this spec moves (the group inside Profile).
9. Screenshots of every screen, light and dark, taken from a build on a device or simulator, are attached to the review for the owner to look at before the pull request.
10. The app launches on the owner's iPhone (iOS 27) and the owner has walked the tutorial and the tabs.
11. (all ages) The owner has handed the phone to one older relative and watched the three tasks in the study, section 7. Not a gate for the pull request; its findings become fixes or a later spec.

## Test plan

- Unit tests: contrast of every token pair; minimum sizes; initials.
- Screen tests: first launch shows the tutorial; skip; both exits; replay; the Group tab as guest and signed in; the existing account and group flows through the new layout.
- By eye: screenshots, light and dark (criterion 9). This is the check that was missing in spec 002.
- On the owner's iPhone: criterion 10.

## Open questions for the owner (answered)

Answered on 13 and 17 Nov 2026; see the log. 1: yes. 2: this spec stays the look, navigation and tutorial; the other features follow one at a time. 3: four tabs. 4: kept, sourced to Sahih al-Bukhari 1549. 5: as drawn.

The questions as asked:

1. **Is this the direction?** Look at the mock-ups. Say what to change before anything is built: colours, the green welcome screen, the wording, the order of the tutorial.
2. **"Other features":** your message asked to rebuild "the UI and other features". I have kept this spec to the look, navigation and tutorial, and left documents, flights, the board and the rest as their own specs, one at a time. Is that right, or do you want one of them pulled into this piece of work? If so, which first?
3. **Four tabs with Group as its own tab**, or keep three?
4. **The Arabic talbiyah on the welcome screen:** keep it? If yes I will take the text from a named source, as the project rules require for religious content.
5. **The tutorial's second button:** "Look around first" (opens the sample trip), or should a guest go straight to making their own trip once that exists?
