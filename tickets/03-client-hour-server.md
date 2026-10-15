# Fake Client Hour Server (Acme) with its Hour Server Page

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

A fake Client Hour Server for Acme Logistics mounted at `/fake/acme`: a JSON API with its own in-memory store and its own record shape (`entryNo` integer, `workDate`, `workOrder`, `minutes` integer, `summary` max 80 characters). Operations: create (returns `entryNo`), replace and delete by `entryNo`, list by date range (`from`, `to`, inclusive). Unknown work orders are rejected. Same Online/Offline control and inspect route as the Dignitas fake. The Client Hour Server Page (`/acme?week=…`) shows the week's records in Acme's shape, with week navigation and an Online/Offline toggle.

## Acceptance criteria

- [ ] API operations covered by tests through HTTP requests, including rejection of an unknown `workOrder` and a `summary` over 80 characters
- [ ] Offline: API returns 503, inspect route and page still work
- [ ] Page shows records created through the API, in Acme's own fields

## Blocked by

None (can start immediately)
