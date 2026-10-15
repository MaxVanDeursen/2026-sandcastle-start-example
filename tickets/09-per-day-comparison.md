# Per-day comparison on the Hour Server Pages

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

Each Hour Server Page gets a per-day table for the shown week: the server's total next to the Timesheet's total, in the server's unit (Dignitas: hours, all Time Entries; Acme: minutes, Acme Projects only). Rows where they differ are highlighted. This is how the Consultant checks the Timesheet is reflected.

## Acceptance criteria

- [ ] Matching days unhighlighted, differing days highlighted (tests assert on the HTML)
- [ ] Acme comparison ignores non-Acme Time Entries and uses minutes

## Blocked by

- #{{02}}
- #{{03}}
- #{{04}}
