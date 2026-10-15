# Hono, server-rendered pages, fake Hour Servers in the same process

Urenbrug is built by AFK agents in Sandcastle sandboxes: Node 22, no browsers, no published ports, and every change must pass `npm run typecheck` and `npm run test`. So everything must be verifiable without a browser or a network.

We use one Hono app. Pages are server-rendered with `hono/jsx` and plain HTML forms; tests call routes with `app.request()` and assert on the HTML. The Dignitas and Client Hour Servers are Hono sub-apps mounted at `/fake/dignitas` and `/fake/acme`, each with its own in-memory store. Sync reaches them through a client that takes a `fetch`-compatible function, wired to the in-process app.

## Considered options

- **React/Vite SPA**: needs a bundler and a browser to verify the UI. Rejected: agents can't check it in the sandbox.
- **Fake Hour Servers as separate processes**: closer to reality, but needs ports and process management in tests. Rejected; the HTTP sub-apps keep the "remote API" shape without that.
- **Fake Hour Servers as plain function calls**: simplest, but hides the API boundary the exercise is about. Rejected.
