# Sync Acme Time Entries to the Client Hour Server

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

Extend Sync to the Client Hour Server. Only Time Entries on Acme Logistics Projects are wanted there; others get Sync Status `not applicable` (grey `A` badge). Mapping: Project → `workOrder`, hours → `minutes` (× 60), description → `summary` truncated to 80 characters ending in `…`. Moving a Time Entry to an Acme Project creates it there; moving it away deletes it there.

## Acceptance criteria

- [ ] Add / edit / delete of Acme Time Entries are reflected on the Client Hour Server Page
- [ ] Moving a Time Entry between Clients creates / deletes the Acme record
- [ ] Truncation and minute conversion unit tested; `A` badge green or grey as appropriate

## Blocked by

- #{{03}}
- #{{06}}
