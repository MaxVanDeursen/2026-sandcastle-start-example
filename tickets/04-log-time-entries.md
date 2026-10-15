# Log Time Entries on the Timesheet

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

The Consultant logs Time Entries on the Timesheet (`/?week=…`): an add form (date, `Client · Project` select, hours in steps of 0.25, description) above the week's Time Entries listed per day with a week total, and previous/next week links. Time Entries live in memory with a UUID. Validation: hours > 0, a multiple of 0.25, at most 24; at most 24 hours per date; description required, at most 200 characters; Project must exist. Invalid input re-renders the form with the message and the entered values. No Sync yet.

## Acceptance criteria

- [ ] Adding a valid Time Entry redirects back and shows it under its day; week total updates
- [ ] Each validation rule has a test showing the message and kept values
- [ ] Week navigation shows only that week's Time Entries

## Blocked by

None (can start immediately)
