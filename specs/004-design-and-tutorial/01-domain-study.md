# 004 — Design for every age: domain study

Written 17 Nov 2026, after the owner asked that the interface be "easy and clear enough" for people "of all age", and for research on how other people would use the app. Outside facts were read on that date. Each is labelled **Confirmed** (a primary source, or several independent ones), **Reported** (one secondary source, or a summary I did not read in full) or **Not found**.

The market itself (who pays, competitors, prices) is in [003 — Commercial product](../003-commercial-product/01-domain-study.md) and is not repeated here. This study is about the people holding the phone.

## 1. Bottom line

- **A large share of the people on a trip are older, and the organiser is usually not.** Where countries publish ages for Hajj, between about one in six and one in three pilgrims is over 60 or 65. No Umrah-specific figure was found, and Umrah is open all year to families, so expect every age from children to grandparents in one group.
- **So there are two kinds of user in every group.** One person sets things up (the organiser). Everyone else only needs to answer "where do I have to be, and when?". The second kind is the majority, and includes the oldest and least technical people.
- **The research on older adults agrees on a short list:** bigger text and buttons, strong contrast, few choices per screen, navigation that is always visible and labelled in words, forgiving errors, and a short tutorial. It does not agree on exact numbers.
- **What this changes in the design:** five rules, in section 5, that go beyond the first draft of the spec. The biggest: buttons and rows grow from 44 to 48 points, nothing is reachable only by a swipe or an unlabelled icon, and the Today screen is designed for the person who opens nothing else.
- **What this study cannot give:** proof. No source tested an Umrah app with older pilgrims. The honest check is to hand the phone to an older relative and watch (section 7).

## 2. Who is on the trip

| Fact | Figure | Label |
|---|---|---|
| Indonesian Hajj pilgrims aged 65 and over, 2025 | 44,085 of 203,149, about 22% | Reported (health ministry figure via a news agency; the percentage is my arithmetic) |
| Indonesian Hajj pilgrims classed as elderly, 2023 | About 30% of roughly 221,000 | Reported |
| Largest age band of Indonesian Hajj pilgrims, 2022 | 50 to 59 years, 44.5% | Reported |
| Omani Hajj pilgrims over 60, 2024 | 16.8% | Reported |
| Mean age in a survey of 4,721 Hajj pilgrims, Saudi Arabia, 2024 | About 51.7 years | Reported (a research survey, not a census) |
| Age of Umrah pilgrims, any country | — | **Not found** |
| Age of Pakistani pilgrims | — | **Not found** |

Reading: these are Hajj figures, and Hajj skews older because of long waiting lists. Umrah groups are likely younger on average and more mixed, with children and grandparents travelling together. The safe design assumption is that **every group has at least one person over 60 and at least one who rarely uses apps**.

## 3. How different people would use it

Four people, drawn from the family trip the web app was built for and from the operator market in study 003. They are design tools, not research findings.

| Person | Typical age | What they do in the app | What they need from the design |
|---|---|---|---|
| **The organiser** (a son or daughter, or the family's "tech person") | 25 to 50 | Creates the account and group, invites everyone, later enters the trip | Speed, and confidence that everyone else can see the plan |
| **The elder** (a parent or grandparent) | 60 and over | Opens the app and reads Today. May never visit another tab | Large text, one clear answer on the first screen, nothing that can be broken by a wrong tap |
| **The young traveller** | 12 to 25 | Looks at the plan, may help the elder with their phone | Nothing special; must not find it childish or slow |
| **The group leader** (an operator's guide, later) | 30 to 60 | Runs a group of strangers, many older, many with Urdu as first language | Member list that scales, simple invite, later announcements |

What follows from this:
1. **The elder often does not install or sign up alone.** Someone hands them a phone with the app open, or sits beside them. So joining must be possible by reading a short code aloud, and a guest must be able to see something useful with no account. Both are already in spec 002.
2. **The first screen is the whole app for the elder.** Today must be readable at arm's length and must not need scrolling to find "what now".
3. **Roles should not create two different apps.** The same four tabs for everyone; admin actions appear only where they apply.

## 4. What the research says about older adults and phone apps

| Finding | Source | Label |
|---|---|---|
| Simple, linear navigation and clear menu structure reduce mental load; complex navigation and small targets lead to giving up | Systematic review of 132 studies of people aged 60 and over (2025) | Confirmed (read on the publisher's site) |
| Recommends "larger fonts, high-contrast text, and adjustable display settings", "enlarged text and touch targets" and "error-tolerant interfaces". Gives **no numbers** | Same review | Confirmed |
| Tutorials, pop-up hints and basic training improved task completion in several studies | Same review | Confirmed |
| Barriers: failing eyesight and contrast sensitivity, hand tremor, difficulty forming a picture of how an app is organised, low digital confidence, worries about privacy and trust | Same review | Confirmed |
| Older adults point more accurately at large, well-spaced buttons; one earlier review suggests targets of 14 to 17.5 mm | Earlier guideline review (38 guidelines), as summarised | Reported |
| Body text: suggestions range from 16 to 20 points, always with the user able to make it larger | Practitioner guides | Reported; sources disagree |
| A visible bottom bar with three to five worded tabs is preferred to hidden menus and gestures | Practitioner guides | Reported |
| Minimum target sizes: Apple 44 points; Google 48 dp; accessibility standard WCAG 2.2 requires 24 px (AA) and recommends 44 px (AAA) | Secondary summaries of the three documents | Reported (figures are consistent across summaries; primary pages not opened) |
| The Indonesian government's Hajj app was little used because most pilgrims were elderly and found devices difficult; an official called it unsuitable for people who are not technically confident | Exploratory study, Semarang | Reported |
| A study of Hajj pilgrims recommends offline access and more inclusive design | Community study, Pringsewu | Reported |
| A usability test of any Umrah or Hajj app with older pilgrims, with measured results | — | **Not found** |

Reading: the direction is well supported; the exact sizes are judgement. Where sources disagree I have taken the larger size when it costs nothing, and the phone's own text-size setting as the real answer to "how big", because it is the only setting an older person (or their family) has already made.

## 5. What this changes in the design

Rules added to the spec because of this study. Each is checkable.

1. **Bigger targets than the platform minimum.** Every button and row is at least **48 points** tall (the first draft said 44); main buttons 56. About 7.5 mm on an iPhone, between Apple's minimum and the research suggestion; larger would cost a row of content per screen.
2. **Text follows the phone's text-size setting everywhere**, and no screen cuts text off at the largest standard size. The smallest text in the app is 13 points, used only for labels that repeat information shown elsewhere; anything a person must read to act is 16 or more.
3. **Words beside every icon. Nothing by swipe alone.** Tabs always show their label. The tutorial moves with Next and Back buttons. An icon-only button (the "…" beside a person) opens choices written in words.
4. **One main action per screen**, shown as the one filled button. Destructive actions are never the filled button, are red, and ask "are you sure?".
5. **Today answers one question first:** what is happening now, or what is next, in the largest text on the screen, above everything else.
6. **Plain words.** No "sync", "session", "authenticate". Errors say what to do next. (Already a project rule; restated because the research names "clear instructions" as a need.)
7. **Colour is never the only signal.** A cancelled flight is red, and also says "Cancelled" and is struck through.

Deliberately **not** done, with reasons:
- **No separate "simple mode" or "senior mode".** One clear design for everyone is cheaper to keep correct, and nobody has to find a setting or be labelled.
- **No voice control or reading aloud of our own.** The phone's own screen reader works if every control has a label, which the components provide. Building our own is a separate, large piece of work.
- **No in-app text-size control.** The phone's setting is respected instead.
- **Urdu and right-to-left layout** remain their own spec. It matters more for older Pakistani users than anything in this study, so it is moved up the list in the plan (section 6).

## 6. Effect on the order of later work

Study 003 proposed: trip and documents, board and SOS, flights, locations, prayer times and guide, Urdu, operator console, store release.

Proposed change: **move Urdu up to directly after "trip, travellers and documents"**. Reason: for the elder in section 3, language is a bigger barrier than any layout choice, and study 003 found no complete Urdu competitor. Doing it early is also cheaper: every screen added before it must be translated and checked right-to-left afterwards.

## 7. What is still unknown, and the cheap way to find out

- Whether an older person can actually do the three things that matter: open the app and say what is happening today; join a group from a code read to them; find the plan for tomorrow.
- **Proposed check, free:** when the build is on the owner's iPhone, hand it to one older relative and one teenager, give those three tasks, say nothing, and note where each hesitates. Five people find most problems; two are far better than none. This is the owner's to do; I will write a one-page sheet for it at hand-over.

## Sources

- Age-friendly app design, systematic review (2025): https://pmc.ncbi.nlm.nih.gov/articles/PMC12350549/
- Guidelines for seniors, literature summary: https://www.themoonlight.io/review/accessibility-recommendations-for-designing-better-mobile-application-user-interfaces-for-seniors
- Designing mobile experiences with seniors in mind (Bentley University): https://www.bentley.edu/centers/user-experience-center/designing-mobile-experiences-seniors-mind
- A guide to interface design for older adults: https://uxdesign.cc/a-guide-to-interface-design-for-older-adults-31109468d46d
- Target sizes (WCAG 2.2, Apple, Google), summaries: https://tetralogical.com/blog/2022/12/20/foundations-target-size/ and https://dequeuniversity.com/rules/axe/4.6/target-size
- Indonesian Hajj pilgrims by age: https://databoks.katadata.co.id/en/consumer-services/statistics/cc741abe667df0e/this-shows-the-proportion-of-elderly-hajj-pilgrims-in-2023-the-majority-are-under-75-years-old and https://databoks.katadata.co.id/en/consumer-services/statistics/aa5110d2f90e635/indonesian-pilgrims-are-predominantly-aged-50-59-a-five-year-trend-analysis
- Indonesia 2025 figures: https://en.antaranews.com/news/361837/homepage-v2.html
- Omani pilgrims by age: https://timesofoman.com/article/148280-out-of-14000-pilgrims-for-1446-ah-women-will-comprise-499-youth-832
- Survey of 4,721 pilgrims: https://www.asiapharmaceutics.info/index.php/ajp/article/view/6824
- "Haji Pintar" app and elderly pilgrims: https://journal.walisongo.ac.id/index.php/ihya/article/view/22285
- Digital readiness of Indonesian pilgrims: https://www.jurnal.politeknik-kebumen.ac.id/jurpikat/article/view/2959
