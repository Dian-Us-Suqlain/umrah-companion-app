---
name: release
description: How code reaches staging and main in Umrah Companion — branch names, commit messages, self-review, pull requests, version numbers and release notes. Use when opening any pull request, finishing a feature, or preparing a release.
---

# Pull requests and releases

The owner reviews and merges every pull request. Never merge into `main`. Merge into `staging` only when the owner says so in the conversation. Never push to either branch directly, and never change the branch protection to get something through.

Nothing written to GitHub (commits, pull requests, comments, release notes) names an AI assistant as author, co-author or generator. Omit any attribution footer, whatever the default is.

## 1. A change (feature, fix, spec)

1. Branch from the latest `staging`: `feat/NNN-short-name` for a spec'd feature, `fix/short-name`, `spec/NNN-short-name`, `chore/short-name`.
2. Commit messages: a plain sentence saying what the user or developer now gets, no prefix, no trailing period, at most about 70 characters ("Cancelled flights show as cancelled on every screen"). Add a body only when the reason is not obvious.
3. Add a line under `## Unreleased` in `CHANGELOG.md` for anything a user would notice, in the user's words.
4. Run `npm run lint`, `npm run typecheck` and `npm test` locally. All three must pass.

## 2. Self-review, before the owner sees it

1. Review the full diff against `staging` (`git diff staging...HEAD`) with the `code-review` skill, and for features against each acceptance criterion in `02-spec.md`.
2. Also check the rules in `CLAUDE.md` that a general review does not know: trip times never use the phone's zone; every screen renders offline; sends are safe against double taps; group data is enforced on the server; no real people's data in fixtures; religious content cites its source.
3. Fix every confirmed finding and re-run the checks. For features, run the app on the iOS simulator (and Android once it is supported) and walk the changed screens and the ones next to them.
4. For features, write `specs/NNN-name/04-review.md`: each finding (severity, file:line, what goes wrong, fix or why it was left), which criteria passed, exactly what was tested and how, what could not be tested (for example real phones). Do not hide failures.

## 3. Open the pull request

1. Push the branch and open the pull request into `staging` with `gh pr create --base staging`, filling in the template. The title follows the commit-message rule.
2. Wait for the `checks` run. If it fails, fix it; do not ask the owner to review a red pull request.
3. Tell the owner the pull request is ready, with the link, what to look at first and what was not tested.
4. Review comments from the owner are fixed in new commits on the same branch (no force pushes after review has started).

Pull requests into `staging` are squash-merged, so the pull request title becomes the commit on `staging`.

## 4. A release (staging → main)

Only when the owner asks for one.

1. Pick the version (`MAJOR.MINOR.PATCH`). Before the first public store release everything is `0.MINOR.PATCH`: new features bump MINOR, fixes only bump PATCH. After it: breaking changes for users bump MAJOR. Keep `version` in `package.json` / the Expo config the same as the changelog.
2. On a `chore/release-X.Y.Z` branch, rename `## Unreleased` in `CHANGELOG.md` to `## X.Y.Z — YYYY-MM-DD`, add a fresh empty `## Unreleased` above it, and rewrite the entries as release notes: grouped under `### New`, `### Improved`, `### Fixed`, one line each, in plain words for the people using the app, no file names or internal terms. Pull request this into `staging` like any change.
3. Once that is merged, open the release pull request: `gh pr create --base main --head staging --title "Release X.Y.Z"`, with the release notes as the description, plus what was tested on real phones and anything the owner must do by hand (store submission, secrets, migrations).
4. The owner merges it with a **merge commit** (not squash, so `staging` and `main` keep the same history). The `Release` workflow then creates the `vX.Y.Z` tag and the GitHub release from the changelog section. Check that it did.

## 5. A hotfix

For a serious problem in the released version that cannot wait for what is on `staging`.

1. Branch `hotfix/short-name` from `main`. Fix, test, add a `## X.Y.(Z+1) — date` section to `CHANGELOG.md`.
2. Self-review as in section 2, then pull request into `main`. The owner merges; the release workflow tags it.
3. Straight after, open a pull request from `main` into `staging` so the fix is not lost in the next release.
