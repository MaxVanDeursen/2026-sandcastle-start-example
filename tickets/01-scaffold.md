# App skeleton with nav and empty pages

## Parent

[Urenbrug wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1). Domain terms: `CONTEXT.md`; stack: `docs/adr/`.

## What to build

A running Urenbrug app with the agreed stack (ADR 0001): TypeScript, Hono with `hono/jsx` server-rendered pages, Vitest. The top nav links the Timesheet (`/`), the Dignitas Hour Server Page (`/dignitas`) and the Client Hour Server Page (`/acme`); each page renders its heading. Includes the fixed Project catalog: Clients, Projects, and each Project's Dignitas `projectCode` and Acme `workOrder` (see the mapping table in the map's decisions), plus ISO-week helpers (current week, previous/next, days of a week).

## Acceptance criteria

- [ ] `npm run dev` serves the app on port 3000; `npm run test` (`vitest run`) and `npm run typecheck` (`tsc --noEmit`) pass
- [ ] Route tests via `app.request()` show each page renders with the nav
- [ ] Catalog lists 4 Projects over 2 Clients with the agreed codes; week helpers are unit tested (including year boundaries)

## Blocked by

None (can start immediately)
