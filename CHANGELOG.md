# Changelog

What changed in each release, newest first. The release workflow publishes the top versioned section as the GitHub release notes when a release PR is merged to `main`.

## Unreleased

- Repository set up: branches, automatic checks, pull request template, spec workflow.
- The app opens on iPhone with three tabs: Today, Plan and Profile, showing an invented sample trip.
- The trip plan follows the trip's own time zone, whatever the phone is set to, and a cancelled flight shows as cancelled on every screen.
- Accounts: create an account with a name, email and password, sign in, reset a forgotten password, sign out and delete the account. The app still opens as a guest with nothing asked.
- Groups: every account has its own group. Invite people with a code, join with a code, make someone an admin, remove someone, or leave. A group always keeps at least one admin.
- Each group's data is visible only to its members, enforced by the database and checked by tests on every pull request.
