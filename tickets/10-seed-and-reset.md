# Seed demo data and Reset

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

On start-up the current week is seeded with about five Time Entries over both Clients, Synced to both Hour Servers, so every page has something to show. A **Reset demo data** button on the Timesheet clears the Timesheet and both Hour Servers, sets both Online and reseeds.

## Acceptance criteria

- [ ] Fresh start shows seeded Time Entries on the Timesheet and the matching records on both Hour Server Pages
- [ ] Reset restores exactly the seeded state, also after a server was set Offline

## Blocked by

- #{{07}}
