**Status: Approved 17 Nov 2026** (the owner tried the interactive demo, said "Looks good, go ahead, build it"). Depends on [004](../004-design-and-tutorial/02-spec.md), built but not yet merged.

# 005 — Motion, touch feedback and a journey view

## Why

After 004 the app is clean but still. The owner: "many apps have so much amazing and interactive visuals and UI features, our app has none." Spec 004 had ruled out animation to stay small. This spec adds it, on the screens that already exist.

Demo the owner approved: https://claude.ai/artifact/98roJQfmj9s23YLicDtML9 (private to the owner).

## Background

- **No change of stack.** The app is already React (React Native through Expo). The animation and gesture libraries, Reanimated and Gesture Handler, were installed and unused. shadcn/ui runs only in browsers; its phone counterpart (NativeWind with React Native Reusables) would mean rebuilding the components finished in 004 for no visible gain, so it is **not adopted now** and is reconsidered when a feature needs components we do not have (sheets, date pickers).
- **Every age** ([004's study](../004-design-and-tutorial/01-domain-study.md)): motion must never be the only way to do or learn something, and must respect the phone's Reduce Motion setting.

## Goals

1. **Screens arrive, they do not appear:** the parts of Today, Plan, Group and Profile ease up into place in order.
2. **Today is alive:** a pulse beside "Happening now" or "Next", a countdown to the next thing (or to the end of the current one), the day bar fills, and a quiet skyline in the green card.
3. **Plan is a journey:** one line down the screen with a mark per day: filled for days passed, a pulsing gold mark for today, hollow for days to come.
4. **The tutorial can be swiped**, with its pictures moving in and its dots following. Next, Back and Skip stay.
5. **Touch answers back:** buttons and rows press in; a light tap is felt on the main button; a success tap and the words "Code copied" when the invite code is copied.

## Non-goals

- **Qibla compass and tawaf counter** (in the demo's Tools tab). Each is a new feature with its own spec: the Qibla direction is religious content that needs a checked calculation and source, and reads the phone's compass.
- No new tab. No new illustrations files (Rive, Lottie), no drawing library (Skia): nothing here needs them yet.
- No change to wording that tests check, to accounts, groups, rules or trip logic.

## Rules

- **Reduce Motion on:** nothing moves, pulses or slides; everything is simply in its final place. The countdown still counts (it is information, not decoration).
- **Nothing by swipe alone** (004, rule 3): the tutorial's buttons do everything the swipe does.
- **Haptics are a bonus:** a phone without them, or with them switched off, loses nothing.
- **Copy:** the code goes to the clipboard; "Code copied" shows for about two seconds; if copying fails nothing is claimed.
- **Countdown:** hours, minutes and seconds to the start of the next item today; when something is happening now, to its end; nothing when today has no timed item ahead. It uses the trip's clock, like every other time in the app.

## Acceptance criteria

1. Today shows a countdown that matches the next item's start, and it ticks.
2. Plan shows the journey line with today's mark distinct from past and future days.
3. The tutorial moves by swipe and by buttons, and both leave the dots and buttons in the same state.
4. Copying the code shows "Code copied".
5. With Reduce Motion on, every screen is complete and still.
6. All earlier tests pass unchanged, apart from the tutorial's (its three screens now exist side by side).
7. The owner has felt it on the iPhone.

## Test plan

- Unit: the countdown's wording at edges (seconds, exactly on the hour, past zero).
- Screens: countdown on Today; journey marks on Plan; tutorial by buttons and by a swipe event; copy confirmation.
- By hand on the iPhone: the feel, haptics, Reduce Motion (criteria 5 and 7). Not automatable here.
