# Fake Dignitas Hour Server with its Hour Server Page

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

A fake Dignitas Hour Server mounted at `/fake/dignitas`: a JSON API with its own in-memory store and its own record shape (`registrationId`, `date`, `projectCode`, `hours`, `remark`). Operations: create (returns `registrationId`), replace and delete by `registrationId`, list by ISO week. A control route switches it Online/Offline; while Offline every API call answers `503`. A fake-only inspect route lists records regardless of Offline. The Dignitas Hour Server Page (`/dignitas?week=…`) shows the week's records in the server's own shape via the inspect route, with week navigation and an Online/Offline toggle.

## Acceptance criteria

- [ ] API operations covered by tests through HTTP requests
- [ ] Offline: API returns 503, inspect route and page still work; toggle on the page switches state
- [ ] Page shows records created through the API, in the server's own fields

## Blocked by

- #{{01}}
