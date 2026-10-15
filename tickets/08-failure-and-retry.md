# Failed Sync, Retry and deletion pending

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

When an Hour Server call fails (e.g. it is Offline), the save on the Timesheet still succeeds and that server's Sync Status becomes `failed` (red badge). Rows with a failed status get a Retry button; the toolbar shows **Retry all failed (n)**. Retry runs the same reconcile. A deleted Time Entry whose delete failed somewhere stays on the Timesheet as **deletion pending**: struck through, not editable, only Retry; it disappears once every Hour Server has deleted its record.

## Acceptance criteria

- [ ] Taking a server Offline, adding a Time Entry, going Online and pressing Retry ends in `synced`
- [ ] Retry all failed fixes every failed Time Entry
- [ ] Deletion pending scenario covered by a test, including disappearing after a successful Retry

## Blocked by

- #{{07}}
