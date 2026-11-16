# Changelog

What changed in each release, newest first. The release workflow publishes the top versioned section as the GitHub release notes when a release PR is merged to `main`.

## Unreleased

- Repository set up: branches, automatic checks, pull request template, spec workflow.
- The app opens on iPhone with three tabs: Today, Plan and Profile, showing an invented sample trip.
- The trip plan follows the trip's own time zone, whatever the phone is set to, and a cancelled flight shows as cancelled on every screen.
- Accounts: create an account with a name, email and password, sign in, reset a forgotten password, sign out and delete the account. The app still opens as a guest with nothing asked.
- Groups: every account has its own group. Invite people with a code, join with a code, make someone an admin, remove someone, or leave. A group always keeps at least one admin.
- Each group's data is visible only to its members, enforced by the database and checked by tests on every pull request.
- A new look: warm paper, deep green and gold, in light and dark, with a green card at the top of each screen for the one thing to look at first.
- A tutorial on first launch: three short screens, skippable, and available again from Profile.
- Four tabs: the group now has its own tab instead of sitting inside Profile.
- Easier for every age: larger buttons and rows, all text follows the phone's text size, every icon you can tap has words with it, and nothing needs a swipe.
