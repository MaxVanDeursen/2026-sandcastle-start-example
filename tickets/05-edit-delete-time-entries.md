# Edit and delete Time Entries

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

Each Time Entry row on the Timesheet has Edit and Delete. Edit opens `/entries/:id/edit` with the same form and validation as adding; saving returns to the Timesheet week of the entry. Delete removes it. No Sync yet.

## Acceptance criteria

- [ ] Editing changes date, Project, hours and description, with the same validation as adding
- [ ] Delete removes the Time Entry and updates the week total
- [ ] Unknown ids give a 404

## Blocked by

- #{{04}}
