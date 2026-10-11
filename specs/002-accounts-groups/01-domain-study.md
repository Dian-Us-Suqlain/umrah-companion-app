# 002 — Accounts and groups: domain study

Written 11 Oct 2026. Facts were checked on that date; free-plan limits change, so re-check before relying on them later.

## What the owner asked for

> "accounts, groups, an admin account for groups, for single individuals, a simple account would work that would technically act as an admin in itself. I need the signup/signin screens, start with a guest account, users can be prompted to sign up or sign in later through their profile settings."

Standing constraint: nothing paid (see `CLAUDE.md`, "No paid services").

## Who uses this

- **A person travelling alone.** Wants to open the app and use it. May never want an account.
- **A group organiser** (a family member or a tour leader). Sets up the group, invites the others, is responsible for what the group sees. In the first app this was the one "admin".
- **Group members.** Often not technical, often older, often on hotel Wi-Fi or offline. For them, joining has to be one short step. In the first app the admin handed out logins personally; in a public app the organiser needs a way to invite without the developer being involved.

## Lessons from the first app that apply here

- It assumed one family, one trip, one admin, and login was written by hand. A public product needs groups as a first-class idea and a login service that is maintained by someone else.
- "Each member sees only their own and shared items" was enforced in application code. It should be enforced in the database, so a mistake in a screen cannot leak another group's data.
- A message was once posted eight times from double taps on a slow connection. Joining a group, creating a group and sending an invite must be safe to tap twice.
- A spec for guest accounts by invitation was written for the first app and shelved. The need was real (people outside the family wanting limited access); the answer here is ordinary membership with roles.

## Facts checked

### A free service that provides login, a database and per-group rules

Supabase is a hosted Postgres database with a login service and row-level rules built in. It matches the earlier recommendation (keep Postgres, use a managed login, enforce group isolation in the database) in one free service.

| Fact | Source |
|---|---|
| Free plan: 50,000 monthly active users, 500 MB database, 1 GB file storage, 5 GB data transfer. Guest ("anonymous") sign-ins and social logins are included. | [Supabase pricing](https://supabase.com/pricing) |
| Free plan allows 2 active projects, and a free project is paused after 1 week with no activity. The paid plan starts at 25 USD a month. | [Supabase pricing](https://supabase.com/pricing) |
| Row-level rules must be switched on for every table the app can reach; a table without them is readable and writable by anyone with access. Rules use the signed-in user's id. The "service" key ignores all rules and must never be in the app. | [Supabase: row level security](https://supabase.com/docs/guides/database/postgres/row-level-security) |
| Membership checks ("is this user in this group?") should go through a database function rather than being repeated in every rule, for speed and to avoid rules that refer to each other in a loop. | Same page |

Alternatives (Firebase, Clerk, staying on Neon with a separate login service) were **not** studied in the same depth. Supabase was checked first because it is the only one I know of that gives all three pieces in one free plan on Postgres. If the owner wants a comparison before committing, that is extra study, not done here.

### Email is the catch

| Fact | Source |
|---|---|
| Supabase's built-in email sender only delivers to the project's own team members, at 2 emails an hour, and is "not meant for production use". | [Supabase: custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) |
| To email real users (confirm an address, reset a password) the project needs its own email-sending service. Supabase recommends a sending domain with the usual anti-spam records for deliverability. | Same page |

So with no money spent and no domain, **sign-up by email cannot confirm addresses or reset passwords for real users.** Email and password still work for the owner in development, because the owner is a team member. Whether a free email service can send reliably without a purchased domain was not confirmed.

### Google sign-in needs no email sending

| Fact | Source |
|---|---|
| The documented way in an Expo app is native Google sign-in: Google gives the app a token, the app passes it to Supabase. It needs free Google Cloud credentials per platform: the bundle identifier for iPhone, the signing fingerprint for Android. | [Supabase: login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) |

The page does not state a cost or an Apple developer account requirement. It works with a custom native module, so it needs a development build rather than Expo Go; spec 001 already uses development builds.

### Guest accounts

| Fact | Source |
|---|---|
| Supabase can create a guest user on the server with no email. It can later be turned into a full account by attaching an email or Google identity. The page implies but does not state that the user's id stays the same. | [Supabase: anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous) |
| A guest who signs out, loses the phone or reinstalls cannot get that guest account back. | Same page |
| Guest users are rows in the database, so Supabase strongly recommends a CAPTCHA to stop abuse; creation is limited to 30 an hour per network address by default; old guests are not cleaned up automatically. | Same page, [rate limits](https://supabase.com/docs/guides/auth/rate-limits) |

Two things matter for this app: pilgrims in one hotel share a network address, so a per-address limit can hit real people; and server-side guests need a network connection at the very first launch, which is exactly when a traveller may not have one.

### Store rules (for later, but they shape the design now)

| Fact | Source |
|---|---|
| If the app has no significant account-based features, people must be able to use it without logging in. | [App Store Review Guidelines 5.1.1(v)](https://developer.apple.com/app-store/review/guidelines/) |
| An app that supports account creation must offer deletion inside the app, easy to find, deleting the whole account and its data. Deactivating is not enough. Guest accounts created automatically must be deletable too. | [Apple: offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/) |
| An app that offers a third-party login such as Google must also offer an equivalent login that limits data to name and email and lets people hide their email. In practice this means Sign in with Apple. | Guidelines 4.8, same page as above |

Sign in with Apple needs the paid Apple programme, so it cannot be built now. It becomes a requirement on the day the app goes to the App Store with Google sign-in in it. That is consistent with the owner's plan (store accounts come later) but must not be forgotten.

## Two ways to do "guest"

| | Guest lives only on the phone | Guest is a server account |
|---|---|---|
| Works at first launch with no network | Yes | No |
| Junk accounts, CAPTCHA, shared hotel network limits | None of it applies | All of it applies |
| Deleting a guest's data | Uninstall, or "Erase data on this phone" | Needs a server deletion flow |
| A guest can join a group | No, must create an account first | Possible, but then a lost phone means a lost member nobody can recover |
| Moving to a real account | The phone uploads what it has after sign-up | Automatic on the server |

Recommended: **guest lives only on the phone.** A guest gets everything that needs no server; anything shared with other people needs an account. It fits offline-first, costs nothing, and removes a whole class of abuse.

## What "single person" and "group" should be

The owner's description, "a simple account would work that would technically act as an admin in itself", maps onto one model rather than two: **every account gets its own group of one, and is its admin.** Inviting someone makes it a group of two. There is no "upgrade from individual to group" step and no second code path to test.

## Risks

1. **Email cannot reach real users for free.** The only sign-in that fully works for the public without spending is Google. People without a Google account (rare on Android, less rare on iPhone) cannot sign up until an email sender exists.
2. **Free projects pause after a week of no use.** A paused staging project is a nuisance; a paused production project would be an outage. It only matters once there are real users, and real users are activity.
3. **Only two free projects.** Development can run on the developer's Mac (the Supabase local stack runs in Docker; Docker is installed on the owner's Mac but was not running when checked), leaving one hosted project for staging and one for production.
4. **Rules in the database are easy to get subtly wrong.** A missing rule exposes a table. They need their own automated tests, run on every pull request, that try to read and write as the wrong user.
5. **The last admin.** If the only admin deletes their account or leaves, a group is orphaned. The design must make that impossible.
6. **Invite codes can be guessed or forwarded.** Codes must expire, be revocable, and joining must be rate-limited.
7. **Not verified:** that a guest-to-account id stays the same on Supabase (not needed if guests are phone-only); that Google sign-in on the iPhone simulator works without any Apple account. Both are checked during the build.

## Addendum, 11 Oct 2026: Firebase

After the wider scan in `docs/tech-stack.md` the owner chose Firebase. What changes from the study above:

| Fact | Source |
|---|---|
| Firebase's free plan needs no payment method and includes Authentication for 50,000 monthly users. | [Firebase pricing](https://firebase.google.com/pricing) |
| It sends its own emails: 1,000 address confirmations and 150 password resets a day on the free plan. | [Firebase Authentication limits](https://firebase.google.com/docs/auth/limits) |
| New accounts are limited to 100 an hour per network address, which a hotel full of pilgrims signing up at once could reach. | Same page |
| Cloud Firestore free quota: 1 GiB stored, 50,000 reads, 20,000 writes and 20,000 deletes a day, one free database per project. | [Firestore quotas](https://firebase.google.com/docs/firestore/quotas) |
| Cloud Functions and Cloud Storage are not on the free plan. | [Firebase pricing](https://firebase.google.com/pricing) |
| An app that uses only its own account system is exempt from the rule that requires Sign in with Apple. | [App Store Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/) |

Consequences for the design:

- Email sign-up now works for real users, so risk 1 above no longer applies. Google sign-in is dropped from this version, which also removes the Sign in with Apple obligation.
- Risks 2 and 3 (pausing, two projects) no longer apply.
- With no server code, joining by code and the "at least one admin" rule are enforced by Firestore security rules instead of database functions, and the lockout after wrong codes is dropped.
- **Not confirmed from documentation:** that the native Firebase library works on Expo SDK 57 with offline data, that the local emulator covers everything the tests need, and that a signed-in user can delete their own login from the app. All three are checked in the first build step.
