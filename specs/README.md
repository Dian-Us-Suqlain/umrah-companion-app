# Specs

One folder per feature: `NNN-short-name/`, numbered in the order work started.

| File | Purpose | Written |
|---|---|---|
| `01-domain-study.md` | What the problem really is: users, real-world facts (with sources), constraints, risks | First |
| `02-spec.md` | What will be built: goals, non-goals, screens, data, server, edge cases, acceptance criteria, test plan, open questions. Starts with a **Status** line | After the study |
| `03-log.md` | Running log: decisions with reasons, owner feedback, approval, deviations during the build | Throughout |
| `04-review.md` | Result of the self-review before the pull request: findings, fixes, what was tested and what was not | After the build |

## Status values (first line of `02-spec.md`)

`Draft` → `Awaiting approval` → `Approved (date)` → `Built (pull request)` → `Released (version)`

A spec can also end as `Shelved (date)`: studied and written, but deliberately not built. The log says why, so the work can be picked up later.

No feature code is written while the status is `Draft` or `Awaiting approval`.

A spec reaches the owner as a pull request from a `spec/NNN-short-name` branch into `staging`. Merging that pull request is the approval.

## Index

| # | Feature | Status |
|---|---|---|
| 001 | [Foundation: a running app shell, the trip-plan logic, tests and builds](001-foundation/02-spec.md) | Awaiting approval |
