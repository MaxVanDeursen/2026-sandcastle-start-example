// The fake Client Hour Server (Acme) as a Hono sub-app mounted at /fake/acme.
// A JSON API over an AcmeStore, an Online/Offline control route, and a
// fake-only inspect route that works even while Offline.
import { Hono } from "hono";
import { AcmeStore, validateInput } from "./store";

/** Builds the sub-app over `store`; the page reads the same store directly. */
export function createAcmeServer(store: AcmeStore) {
  const api = new Hono();

  // Offline: every API call (not inspect or control) answers 503.
  const guardOffline = (c: { json: (b: unknown, s: 503) => Response }) =>
    store.online ? undefined : c.json({ error: "offline" }, 503);

  // Create: returns the assigned entryNo.
  api.post("/entries", async (c) => {
    const off = guardOffline(c);
    if (off) return off;
    const input = validateInput(await c.req.json().catch(() => null));
    if (typeof input === "string") return c.json({ error: input }, 400);
    const record = store.create(input);
    return c.json({ entryNo: record.entryNo }, 201);
  });

  // Replace by entryNo.
  api.put("/entries/:entryNo", async (c) => {
    const off = guardOffline(c);
    if (off) return off;
    const entryNo = Number(c.req.param("entryNo"));
    const input = validateInput(await c.req.json().catch(() => null));
    if (typeof input === "string") return c.json({ error: input }, 400);
    const record = store.replace(entryNo, input);
    if (!record) return c.json({ error: "not found" }, 404);
    return c.json(record, 200);
  });

  // Delete by entryNo.
  api.delete("/entries/:entryNo", (c) => {
    const off = guardOffline(c);
    if (off) return off;
    const entryNo = Number(c.req.param("entryNo"));
    if (!store.delete(entryNo)) return c.json({ error: "not found" }, 404);
    return c.body(null, 204);
  });

  // List by inclusive date range.
  api.get("/entries", (c) => {
    const off = guardOffline(c);
    if (off) return off;
    const from = c.req.query("from");
    const to = c.req.query("to");
    if (!from || !to) return c.json({ error: "from and to are required" }, 400);
    return c.json(store.listByDateRange(from, to), 200);
  });

  // Fake-only inspect: all records and the Online flag, even while Offline.
  api.get("/_inspect", (c) => c.json({ online: store.online, records: store.all() }));

  // Control: switch Online/Offline. JSON for callers, form (with `return`) for
  // the page toggle, which gets redirected back.
  api.post("/control", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    if (contentType.includes("form")) {
      const form = await c.req.parseBody();
      store.online = form.online === "true";
      const back = typeof form.return === "string" ? form.return : "/acme";
      return c.redirect(back, 303);
    }
    const body = (await c.req.json().catch(() => ({}))) as { online?: unknown };
    store.online = body.online === true;
    return c.json({ online: store.online }, 200);
  });

  return api;
}
