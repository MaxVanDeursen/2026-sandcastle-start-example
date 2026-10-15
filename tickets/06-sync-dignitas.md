# Sync Time Entries to the Dignitas Hour Server

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

Saving a Time Entry (add, edit, delete) Syncs it to the Dignitas Hour Server in the same request, through a small client that takes a `fetch`-compatible function (wired to the in-process app; tests may inject a fake). Sync is a reconcile per Time Entry per Hour Server: wanted and no remote id → create and store the `registrationId`; wanted and a remote id → replace with the full current state; not wanted and a remote id → delete. Mapping: Project → `projectCode`, description → `remark`. The Timesheet keeps a Sync Status per Time Entry for this server and shows a `D` badge (green `synced`).

## Acceptance criteria

- [ ] Add / edit / delete on the Timesheet are reflected on the Dignitas Hour Server Page
- [ ] Reconcile rules covered by unit tests
- [ ] `D` badge shows on every Time Entry

## Blocked by

- #{{02}}
- #{{05}}
