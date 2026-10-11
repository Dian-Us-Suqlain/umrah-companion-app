# Tech stack scan: what can be built for free

Written 11 Oct 2026 for the owner's requirement: "a free of cost application with maximum support I can add". Every limit below was read from the linked page on that date unless marked **not confirmed**. Free plans change; re-check a row before building on it.

"Free" here means no payment and no payment card on file.

## Summary

| Layer | Pick | Costs nothing because |
|---|---|---|
| App | Expo SDK 57, React Native, TypeScript, Expo Router | Open source |
| Login, shared data, sync | **Firebase** (Authentication + Cloud Firestore) — changed from Supabase, see below | Free "Spark" plan, no card |
| Data on the phone | SQLite on the device for the person's own trip; Firestore's own offline copy for group data | Part of the app |
| Reminders and the morning notification | Notifications scheduled on the phone itself | No server, no Apple account |
| Push from a server (SOS, admin alerts) | Android: Firebase Cloud Messaging. iPhone: not possible yet | FCM is free; Apple needs the paid programme |
| Scheduled server jobs (flight checks) | A scheduled GitHub Actions workflow to start; a Cloudflare Worker if timing needs to be tighter | Free for public repositories |
| Maps | Apple Maps on iPhone; open-source MapLibre with OpenFreeMap on Android; "open in Maps" links everywhere | No key, no billing account |
| Prayer times and Qibla | Calculated on the phone (adhan library, phone compass) | No service involved |
| Flight status | FlightAware AeroAPI free tier, called only from the server and cached | 500 lookups a month |
| Weather | Open-Meteo | Free for non-commercial use |
| Builds and checks | GitHub Actions, including Mac machines for iPhone builds; builds on the owner's Mac | Free and unlimited for public repositories |
| Getting the app to people | Android app file on GitHub Releases; web version and privacy page on GitHub Pages | Free for public repositories |
| Updates without reinstalling | EAS Update | Free up to 1,000 monthly users |
| Crash reports | Firebase Crashlytics | No-cost product |
| Tests | Jest for logic, Maestro for tap-through tests | Open source |

## What cannot be free

| Thing | Cost | What it blocks until paid |
|---|---|---|
| Apple Developer Program | 99 USD a year | iPhone app for anyone but the owner; push notifications on iPhone; Sign in with Apple |
| Google Play Console | About 25 USD once (**not confirmed** today) | Play Store listing. Android installs by file work without it |
| A domain name | Roughly 10 to 15 USD a year (**not confirmed**) | A custom web address; emails "from" the app's own name |
| Flight data beyond the free tier | FlightAware's next tier is 25 USD a month for 2,500 lookups | More than about 16 flight checks a day across all users |
| Server code inside Firebase, shared file storage | Firebase's pay-as-you-go plan (needs a card; small use may still cost nothing) | Cloud Functions and Cloud Storage. Worked around below |
| Text-message login | Billed per message | Signing in with a phone number |

## The main decision: Firebase or Supabase

Spec 002 proposed Supabase. This scan changes my recommendation to Firebase, for two reasons that only matter because nothing can be paid for.

| | Firebase (free plan) | Supabase (free plan) |
|---|---|---|
| Email sign-up for real users | **Works.** 1,000 address-verification and 150 password-reset emails a day | **Does not work.** Built-in email reaches only the project's own team, 2 an hour; real use needs your own sender |
| Goes to sleep when unused | No | **Paused after 7 quiet days**; restored by hand from the dashboard (possible for up to a year) |
| Users | 50,000 a month | 50,000 a month |
| Data | 1 GiB; 50,000 reads and 20,000 writes a day | 500 MB; no per-day read or write cap |
| Works offline with automatic sync | Built into the native Firestore library (**not confirmed** today with Expo SDK 57) | Not built in; needs an extra sync layer or hand-written code |
| Live updates | Built in | 200 connections at once, 2 million messages a month |
| Push notifications | Included (FCM) | Not included |
| Crash reports, basic analytics | Included | Not included |
| Server code and scheduled jobs | **Not on the free plan** | Included: 500,000 function calls, scheduled jobs |
| File storage | **Not on the free plan** | 1 GB |
| Kind of database | Documents (NoSQL), rules written in Firebase's own language | Postgres (SQL), row-level rules |
| Free projects | Not limited to two | Two |
| Leaving later | Harder: data and rules are in Google's format | Easier: it is standard Postgres |

Sources: [Firebase pricing](https://firebase.google.com/pricing), [Firebase Authentication limits](https://firebase.google.com/docs/auth/limits), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [Supabase pricing](https://supabase.com/pricing), [Supabase billing quotas](https://supabase.com/docs/guides/platform/billing-on-supabase), [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Supabase Cron](https://supabase.com/docs/guides/cron).

**Why Firebase wins here.** The owner asked for sign-up and sign-in screens. On Supabase with no money, those screens cannot confirm an email or reset a password for a real person, and the service sleeps whenever the app is quiet, which is exactly the stage this app will be in. Firebase has neither problem and adds offline sync, push and crash reports.

**What Firebase costs us.**

1. No server code inside Firebase. The few jobs that need a trusted server (flight checks, alerts sent by an admin, cleaning up after a deleted account) run somewhere else: a scheduled GitHub Actions workflow or a Cloudflare Worker, using a Firebase service key kept as a secret.
2. No shared file storage. Documents (passports, visas, tickets) stay on the phone, encrypted, which was already the privacy recommendation. Sharing a document with the group would need storage later.
3. A document database fits "groups and members" less naturally than SQL, and the access rules are in Firebase's own language. They can still be tested automatically with Firebase's free local emulator (**not confirmed** today).
4. Lock-in. Moving off Firebase later is real work.
5. A daily ceiling: 50,000 reads a day is comfortable for hundreds of active users if screens are written carefully, and becomes the first limit to watch after that.

**A mix was considered and rejected.** Firebase login in front of a Supabase database is supported, but every user needs a role stamped on their account by a Firebase server function, which is not on the free plan ([Supabase: Firebase Auth](https://supabase.com/docs/guides/auth/third-party/firebase-auth)).

**Also looked at, less deeply.** Appwrite: free plan has 2 projects and now only 2 functions per project; other numbers came from third-party pages and conflicted ([Appwrite changelog](https://appwrite.io/changelog/entry/2026-01-08.md)). Convex: generous free numbers per third-party pages, but its own FAQ says the free plan is for personal projects and prototypes, and offline support was **not confirmed** ([Convex pricing FAQ](https://www.convex.dev/pricing/faq)). Cloudflare Workers with its D1 database: 100,000 requests a day and 5 GB free, but no login service, so login would be hand-written again ([Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)).

If the owner would rather stay on Postgres and accept Google-only sign-in, Supabase remains workable and spec 002 stands as written.

## Layer by layer

### App framework

Expo SDK 57 (React Native 0.86, React 19.2), iPhone 16.4 or later, Android 7 or later ([Expo SDK reference](https://docs.expo.dev/versions/latest/)). Already decided; nothing here changes it. One code base also produces a website, which matters because the web is one of the two free ways to reach iPhone users.

### Notifications

| Kind | iPhone | Android | Source |
|---|---|---|---|
| Scheduled on the phone (morning plan, "leave for the airport", prayer times) | Free | Free | **Not confirmed** today that this needs no Apple membership; to be proven first thing in the notifications spec |
| Sent from a server (SOS, admin alert, "flight cancelled") | Needs the paid Apple programme: "A paid Apple Developer Account is required to generate credentials" | Free through Firebase Cloud Messaging | [Expo: push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) |

Expo's own push service is free, up to 600 notifications a second, best-effort delivery ([Expo push FAQ](https://docs.expo.dev/push-notifications/faq/)).

Consequence: until there is an Apple account, an iPhone only learns about an SOS or a cancelled flight when the app is opened and online. Android gets real alerts. This is the largest gap the no-spend rule creates, and it should be stated in the app rather than hidden.

### Scheduled server jobs

- GitHub Actions on a public repository is free and unlimited on standard machines ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)). Scheduled runs can start late, so it suits "check flights every 15 minutes or so", not "at exactly 06:00".
- Cloudflare Workers free plan: 100,000 requests a day, 10 ms of processor time per request ([pricing](https://developers.cloudflare.com/workers/platform/pricing/)). Whether timed triggers are on the free plan was **not confirmed**.
- Exact-time notifications are done on the phone instead, so the server's timing matters less.

### Flight status

| Service | Free allowance | Catch |
|---|---|---|
| FlightAware AeroAPI | 500 requests a month, 5 a minute, no card ([pricing](https://www.flightaware.com/commercial/aeroapi/v3/pricing.rvt)) | Whether commercial use is allowed on the free tier is not stated |
| AviationStack | 100 requests a month | Non-commercial use only (per search results, **not confirmed** on its own page) |
| AeroDataBox | About 600 units a month (**not confirmed**) | Terms not checked |

500 a month is about 16 a day in total. That covers a handful of groups if the server checks each flight only near its departure and shares one answer with everyone on that flight. It does not cover a public launch. Flight status is the first feature that will need money as the app grows; the fallback is letting the admin set a flight's status by hand, which the first app taught us is needed anyway.

### Maps

- iPhone: Apple Maps through the standard map component, no key ([Expo MapView](https://docs.expo.dev/versions/latest/sdk/map-view/)).
- Android: the same component uses Google Maps and needs a Google Cloud key; whether that requires a billing account was **not confirmed**. The free route is the open-source MapLibre map with OpenFreeMap tiles: no key, no registration, no request limits, donation-funded, attribution required ([OpenFreeMap](https://openfreemap.org)). How well MapLibre fits Expo SDK 57 was **not confirmed**.
- OpenFreeMap has no place search or directions. Handing off to the phone's own maps app covers directions for free.

### Prayer times, Qibla

The `adhan` library (MIT licence) calculates prayer times on the phone from position and date with no network ([adhan-js](https://github.com/batoulapps/adhan-js)). Whether it includes the Umm al-Qura method used in Saudi Arabia was **not confirmed** today and is the first thing to check in that spec, against an official timetable. Qibla is a calculation plus the phone's compass.

### Weather and currency

- Open-Meteo: 10,000 calls a day, no key, attribution required, **non-commercial use only** ([pricing](https://open-meteo.com/en/pricing)). Fine now; needs a paid plan or another source if the app ever earns money.
- Currency: Frankfurter is the candidate; **not confirmed**.

### Email

Solved by choosing Firebase, which sends its own verification and reset emails. If Supabase is kept: Resend's free plan is 3,000 emails a month, 100 a day ([pricing](https://resend.com/pricing)); Brevo's is 300 a day ([Brevo](https://www.brevo.com/free-smtp-server/)). Whether either sends to the public without a domain you own was **not confirmed**, and sources disagreed.

### Builds, checks, releases

- GitHub Actions is free for this public repository, including standard Mac machines for iPhone builds ([GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)). Checks, Android app files and simulator builds can all be produced there at no cost.
- Expo's cloud build service is optional: 15 iPhone and 15 Android builds free, updates for 1,000 monthly users, 60 minutes of its own CI ([Expo pricing](https://expo.dev/pricing)). Over-the-air updates are the part worth using.
- The Android app file is attached to each GitHub release for people to install directly.

### Web version and required pages

The store rules need a public privacy policy and an account-deletion page. GitHub Pages can host both, and the web build of the app, for free on a `github.io` address (**not confirmed** today; long-standing GitHub feature). Expo's own hosting also exists; its free allowance was not stated on the page read ([EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)).

### Crash reports and usage numbers

- Firebase Crashlytics and Analytics are no-cost products ([Firebase pricing](https://firebase.google.com/pricing)).
- Alternatives: PostHog, 1 million events and 2,500 mobile session recordings a month free ([pricing](https://posthog.com/pricing)); Sentry, 5,000 errors a month for one user (third-party figure, **not confirmed**).
- Recommendation: crash reports only at first. Every tracker added has to be declared in the privacy policy and the store listing, and this app handles sensitive data.

## What "maximum support for free" looks like in practice

| Feature from the first app | Free on Android | Free on iPhone (owner's phone or web only) |
|---|---|---|
| Guest use, trip plan, Today | Yes | Yes |
| Accounts with email or Google, groups, admins | Yes | Yes |
| Documents kept on the phone | Yes | Yes |
| Morning notification and reminders | Yes | Yes, if on-phone scheduling is confirmed |
| Prayer times, Qibla, guide | Yes | Yes |
| Family board and SOS | Yes, with a real alert | Seen when the app is opened; no alert |
| Live flight status | Yes, for a small number of flights | Same, shown in the app; no alert |
| Maps, hotels, shared locations while the app is open | Yes | Yes |
| Location sharing in the background | To be studied | To be studied |
| Weather, currency | Yes | Yes |
| Documents shared across the group | Not yet (no free shared storage with Firebase) | Not yet |

## What this changes

1. **Spec 002** would be rewritten for Firebase: email sign-up becomes fully usable, the database section changes from tables and row rules to collections and security rules, and the account-deletion job moves to a scheduled workflow. Screens and group rules stay the same.
2. **First build step of 002** becomes a short proof that the native Firebase library works on Expo SDK 57 with offline data on the simulator. If it does not, fall back to Supabase with Google sign-in.
3. **A later "notifications" spec** starts by proving on-phone scheduled notifications on an iPhone without the paid programme.
