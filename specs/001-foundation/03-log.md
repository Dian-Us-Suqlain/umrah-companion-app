# 001 — Foundation: log

## 11 Oct 2026

- **Owner decisions before this spec:** keep the first app's repository private and untouched; build the new app with Expo (React Native) and TypeScript; new public repository `umrah-companion-app`.
- **Repository set up** with `main` and `staging`, both protected (pull request required, `checks` must pass, no force pushes, rules apply to the owner's account too). Required approvals are 0 because GitHub does not let an account approve its own pull request; the owner's review is the merge.
- **Default branch is `staging`** so new pull requests target it without anyone having to remember. `main` only receives release and hotfix pull requests; a check enforces that.
- **Commits use the owner's GitHub no-reply address** rather than their personal email, because every commit in a public repository is readable by anyone. Reason: avoid publishing the address. Can be changed if the owner prefers.
- **First spec is the foundation only**, with no accounts, server or real data. Reason: it can be built and reviewed without the hard decisions (login service, where documents are stored, hosting), and those decisions deserve their own study.
- **Trip-plan logic is the first thing ported.** Reason: it is the best-tested part of the first app, has no screen code, and exercises the time-zone handling that is most likely to differ on a phone.
- **Hermes time-zone support could not be confirmed from documentation.** Decision: test it on the phone engine as an acceptance criterion instead of assuming.
- Spec written and sent to the owner for approval.
- **Owner decision: no money spent for now.** In their words: "I don't want to spend any money for now, once we get a proper advertisement, some users, then we'll look into buying an account to post the application on play store and app store." Open question 2 (Apple Developer Program) is closed: not enrolling. Consequence recorded in the spec: without an Apple account the iPhone app cannot reach anyone but the owner's own phone, and iPhone push notifications are not possible; Android installs by file and a web version remain free. This spec's scope is unchanged.
