# 005 — Motion, touch feedback and a journey view: log

## 17 Nov 2026

- **Owner's request:** a better, more interactive UI; asked whether Swift, Flutter, Kotlin or "shadcn" would be better. Answer given: the flatness came from 004's brief ("no animations"), not the stack; the app is already React.
- **Demo first.** An interactive browser sketch was made before any code. Owner: "Looks good, go ahead, build it." Taken as approval of this spec's direction. The spec and plan were written and built in the same sitting; the owner approved the demo, not the written plan.
- **NativeWind and React Native Reusables (the shadcn approach for phones) not adopted now**, although the demo page listed them. Reason: it would rebuild the components finished and tested in 004 with nothing new to see. Reconsider when a feature needs components we lack.
- **Qibla and tawaf counter left out**, although they were in the demo. Reason: new features; the Qibla direction needs a checked calculation and a named source.
- **The tutorial is green on all three screens.** Reason: with swiping, two background colours would show a hard seam mid-swipe.
- **Two libraries added:** `expo-haptics` and `expo-clipboard` (free, part of Expo).
- The state before this work is kept at the local marker `refs/snapshots/004-before-005`.
