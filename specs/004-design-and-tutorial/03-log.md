# 004 — A new look, navigation and tutorial: log

## 13 Nov 2026

- **Owner's request**, in their words: "rebuid the UI and other features. The Umrah Companion App (Dev) is disguting. I want a clean UI/UX with a tutorial screen as well."
- **The look is taken from the family web app** (`umrah-companion`): paper background, deep green, gold accent, rounded cards, a green hero card. Reason: the family already used and liked it.
- **Mock-ups before code.** Eighteen screens drawn for the owner (link in the spec). Reason: spec 002 was built without anyone looking at a screen, which is how the plain version reached the owner's phone.
- **Owner on the mock-ups:** "lokks fine, add all screens". Taken as approval of the direction and of the answers proposed to the spec's open questions: four tabs, the talbiyah kept, the tutorial's two buttons as drawn.
- **Scope kept to look, navigation and tutorial.** The five future-feature screens on the canvas (documents, flights, board and SOS, prayer times, guide) are drawings only; each is built under its own spec.

## 17 Nov 2026

- **Owner's request:** "continue with the plan, work on the UI, build the remaining screens and features, do your research and market analysis along the way on how other people can use this, of all age, the interface should be easy and clear enough." Taken as the go-ahead to build this spec. The implementation plan (`docs/implementation/004-design-and-tutorial/plan.md`) was written first and built in the same sitting; the owner had not read it separately. Recorded here because the usual stop for plan approval was not made.
- **Domain study added** (`01-domain-study.md`): who holds the phone, and what research says about older adults and apps. The spec had none.
- **Seven "rules for every age" added to the spec.** The ones that changed the design: targets 48 points instead of 44; words beside every tappable icon; one filled button per screen; no swipe-only navigation.
- **No "senior mode".** Reason: one clear design is cheaper to keep correct, and nobody has to find a setting.
- **Talbiyah source:** Sahih al-Bukhari 1549 (Book of Hajj, chapter "The Talbiya", narrated by Abdullah bin Umar). The reference was confirmed by search results that quote sunnah.com; the page itself refused an automated read, so the Arabic wording should be checked by the owner against a printed or trusted copy before release. The source is named on the welcome screen.
- **Work started on top of the uncommitted 002 changes**, on the branch `feat/002-accounts-groups`. The exact 002 state is kept at the local marker `refs/snapshots/002-before-004` (not a branch, not pushed) so the two can be committed separately.
- **Built**, on top of 002. Differences from the spec and mock-ups, each with its reason:
  - **The tutorial promises only what exists today.** The mock-ups said "everyone's documents", "sees the same plan" and "plan your own". Documents and shared trips are not built, so those words were removed; they return with the features.
  - **Switching groups is a visible list** ("Your groups") at the foot of the Group tab, not a tap on the title. Reason: all-ages rule 3, nothing hidden behind an unlabelled control.
  - **Rename is a button with the word "Rename"**, not a pencil alone. Same reason.
  - **The Plan filter chips** (All days, Makkah, Madinah) in the mock-up are not built. Reason: a new feature; this spec changes the look only.
  - **The green card in dark mode is a deeper green (`#1F4A42`) with white text**, not the light green of the token table. Reason: a pale card on a near-black screen glares, and white on it fails nothing.
  - **Existing sentences were kept word for word** where the mock-ups paraphrased them ("You're a guest" stays "You’re using Umrah Companion as a guest."). Reason: criterion 8.
  - **Screen titles for pushed screens stay in the system header**, with its worded Back button, instead of a large title in the page.
  - **A link can open the tutorial on a given screen** (`/tutorial?step=2`). Added for screenshots; nothing in the app uses it.
- **Avatar initials: first letter of the first word and of the last word**; one word gives one letter; Urdu and Arabic names keep their own letters. Reason: many members share a first name such as Muhammad, so the family name tells them apart. First offered to the owner to write; the owner asked for it to be finished (17 Nov 2026).
- **Amiri** (SIL Open Font Licence) is built into the app for Arabic phrases, 431 KB. `expo-font` became a direct dependency for this.
- **Tests:** 174 unit and screen tests (93 before), 38 database-rules tests unchanged. Tests that looked for the group on Profile now look on the Group tab; tests of Make admin and Remove first open that person's options. No checked sentence was reworded.
