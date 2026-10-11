# 002 — Accounts and groups: log

## 11 Oct 2026

- **Owner's request**, in their words: "accounts, groups, an admin account for groups, for single individuals, a simple account would work that would technically act as an admin in itself. I need the signup/signin screens, start with a guest account, users can be prompted to sign up or sign in later through their profile settings."
- **Owner's constraint:** nothing paid until the app has an audience.
- **One model for individuals and groups.** Every account gets its own group of one and is its admin. Reason: it is what the owner described, and it avoids a separate "individual" path and an "upgrade to group" step.
- **Guest proposed as phone-only**, not a server account. Reason: works at first launch with no network, no junk accounts or CAPTCHA, nothing to delete on a server. Cost: a guest cannot join a group without signing up. Awaiting the owner's answer.
- **Supabase proposed** for login, database and per-group rules. Reason: one free service on Postgres covering all three. Other services were not compared in depth; said so in the study.
- **Finding: email cannot reach real users for free.** Supabase's built-in sender only delivers to the project's own team. Proposal: Google sign-in is the public method for now; email and password are built and tested but off in production until an email sender exists. Awaiting the owner's answer.
- **Sign in with Apple is deliberately out.** It needs the paid Apple programme. It becomes mandatory when the app goes to the App Store with Google sign-in (guideline 4.8). Recorded so it is not forgotten.
- **Travellers without a phone are out of this spec.** Reason: they are people in a trip, not accounts; they belong with the trip and documents spec.
- **This spec was written before 001 is approved or built**, to keep moving while 001 waits on the bundle identifier. It depends on 001 and no code for it starts before 001 is merged.
- Spec sent to the owner for approval.
- **Backend choice reopened.** The owner asked for a full scan of what can be had for free (`docs/tech-stack.md`, pull request #3). It found that on free plans Firebase sends sign-up and reset emails to real users and does not pause when unused, which removes the two biggest problems recorded above. New recommendation: Firebase. This spec is not to be approved as written until the owner chooses; if Firebase is chosen, "Sign-in methods" and "Server" are rewritten and the screens and group rules stay.
