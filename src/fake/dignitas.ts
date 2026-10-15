// Fake Dignitas Hour Server: a Hono sub-app with its own in-memory store and
// its own record shape. Mounted at /fake/dignitas (see ADR 0001). The business
// API (create/replace/delete/list) answers 503 while Offline; the control and
// inspect routes stay reachable so you can recover from and observe Offline.

import { Hono } from "hono";
import { isoWeek } from "../week/week";

/** A recorded hour registration, in the Dignitas Hour Server's own fields. */
export type DignitasRecord = {
  registrationId: string;
  date: string;
  projectCode: string;
  hours: number;
  remark: string;
};

export type DignitasInput = Omit<DignitasRecord, "registrationId">;

function normalise(input: Partial<DignitasInput>): DignitasInput {
  return {
    date: String(input.date ?? ""),
    projectCode: String(input.projectCode ?? ""),
    hours: Number(input.hours ?? 0),
    remark: String(input.remark ?? ""),
  };
}

export function createDignitasServer() {
  const records = new Map<string, DignitasRecord>();
  let online = true;
  let seq = 0;

  function listByWeek(week?: string): DignitasRecord[] {
    const all = [...records.values()];
    const scoped = week ? all.filter((r) => isoWeek(r.date) === week) : all;
    return scoped.sort((a, b) => a.date.localeCompare(b.date) || a.projectCode.localeCompare(b.projectCode));
  }

  const app = new Hono();

  // Offline guard for the business API only.
  app.on(["GET", "POST", "PUT", "DELETE"], ["/registrations", "/registrations/*"], async (c, next) => {
    if (!online) return c.json({ error: "Offline" }, 503);
    await next();
  });

  app.post("/registrations", async (c) => {
    const registrationId = `dig-${++seq}`;
    records.set(registrationId, { registrationId, ...normalise(await c.req.json()) });
    return c.json({ registrationId }, 201);
  });

  app.put("/registrations/:id", async (c) => {
    const id = c.req.param("id");
    if (!records.has(id)) return c.json({ error: "Not found" }, 404);
    records.set(id, { registrationId: id, ...normalise(await c.req.json()) });
    return c.json({ registrationId: id });
  });

  app.delete("/registrations/:id", (c) => {
    if (!records.delete(c.req.param("id"))) return c.json({ error: "Not found" }, 404);
    return c.body(null, 204);
  });

  app.get("/registrations", (c) => c.json(listByWeek(c.req.query("week"))));

  // Control route: switch Online/Offline. Exempt from the Offline guard.
  app.post("/control", async (c) => {
    online = Boolean((await c.req.json()).online);
    return c.json({ online });
  });

  // Fake-only inspect route: lists records regardless of Offline.
  app.get("/_inspect", (c) => c.json({ online, records: listByWeek(c.req.query("week")) }));

  return app;
}
