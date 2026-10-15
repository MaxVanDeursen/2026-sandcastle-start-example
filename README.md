# Urenbrug: Sandcastle starting point

A ready-made result of the *Idea → Spec* exercise, to run the *Sandcastle* exercise on without doing the planning yourself.

**Urenbrug**: log your hours once on the Timesheet; they Sync to two fake hour servers (Dignitas and the client, Acme Logistics), each with a page to check the hours arrived.

- How it was planned: the [wayfinder map](https://github.com/RRMoelker/2026-sandcastle-start-example/issues/1) and its closed decision tickets.
- Glossary: `CONTEXT.md`. Stack decision: `docs/adr/`.
- Implementation tickets: `tickets/`. No code yet; that is Sandcastle's job.

## Start

1. Fork this repo and clone it. Uncheck **Copy the `main` branch only**: the `research/…` and `prototype/…` branches hold the assets the decision tickets link to. (Or *Use this template* → **Include all branches** for a private copy.)
2. Forks have Issues switched off: Settings → General → Features → Issues.
3. Create the tickets as issues in **your** repo: `npm run tickets`. Needs `gh`; uses `GH_TOKEN` from the environment, else from `.sandcastle/.env`, else your `gh` login.
4. Continue with the Sandcastle exercise setup.
