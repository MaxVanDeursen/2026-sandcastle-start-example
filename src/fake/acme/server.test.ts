import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { AcmeStore } from "./store";
import { createAcmeServer } from "./server";

/** A fresh app with the Acme fake mounted where the real app mounts it. */
function appWithAcme() {
  const store = new AcmeStore();
  const app = new Hono();
  app.route("/fake/acme", createAcmeServer(store));
  return { app, store };
}

const valid = { workDate: "2026-10-15", workOrder: "WO-1042", minutes: 90, summary: "Portal work" };

async function create(app: Hono, body: unknown = valid) {
  return app.request("/fake/acme/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Acme fake API", () => {
  it("creates a record and returns its entryNo", async () => {
    const { app } = appWithAcme();
    const res = await create(app);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ entryNo: 1 });
  });

  it("assigns entryNo counting up", async () => {
    const { app } = appWithAcme();
    expect(await (await create(app)).json()).toEqual({ entryNo: 1 });
    expect(await (await create(app)).json()).toEqual({ entryNo: 2 });
  });

  it("replaces a record by entryNo", async () => {
    const { app } = appWithAcme();
    await create(app);
    const res = await app.request("/fake/acme/entries/1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...valid, minutes: 120, summary: "Updated" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ entryNo: 1, minutes: 120, summary: "Updated" });
  });

  it("404s replacing an unknown entryNo", async () => {
    const { app } = appWithAcme();
    const res = await app.request("/fake/acme/entries/99", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(valid),
    });
    expect(res.status).toBe(404);
  });

  it("deletes a record by entryNo", async () => {
    const { app } = appWithAcme();
    await create(app);
    expect((await app.request("/fake/acme/entries/1", { method: "DELETE" })).status).toBe(204);
    expect((await app.request("/fake/acme/entries/1", { method: "DELETE" })).status).toBe(404);
  });

  it("lists by inclusive date range", async () => {
    const { app } = appWithAcme();
    await create(app, { ...valid, workDate: "2026-10-12" });
    await create(app, { ...valid, workDate: "2026-10-15" });
    await create(app, { ...valid, workDate: "2026-10-20" });
    const res = await app.request("/fake/acme/entries?from=2026-10-12&to=2026-10-15");
    const records = (await res.json()) as { workDate: string }[];
    expect(records.map((r) => r.workDate)).toEqual(["2026-10-12", "2026-10-15"]);
  });

  it("rejects an unknown workOrder", async () => {
    const { app } = appWithAcme();
    const res = await create(app, { ...valid, workOrder: "WO-9999" });
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: expect.stringContaining("workOrder") });
  });

  it("rejects a summary over 80 characters", async () => {
    const { app } = appWithAcme();
    const res = await create(app, { ...valid, summary: "x".repeat(81) });
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: expect.stringContaining("80") });
  });

  it("accepts a summary of exactly 80 characters", async () => {
    const { app } = appWithAcme();
    expect((await create(app, { ...valid, summary: "x".repeat(80) })).status).toBe(201);
  });
});

describe("Acme fake Online/Offline", () => {
  it("answers 503 on the API while Offline", async () => {
    const { app, store } = appWithAcme();
    store.online = false;
    expect((await create(app)).status).toBe(503);
    expect((await app.request("/fake/acme/entries?from=2026-10-01&to=2026-10-31")).status).toBe(503);
    expect((await app.request("/fake/acme/entries/1", { method: "DELETE" })).status).toBe(503);
  });

  it("keeps the inspect route working while Offline", async () => {
    const { app, store } = appWithAcme();
    await create(app);
    store.online = false;
    const res = await app.request("/fake/acme/_inspect");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { online: boolean; records: unknown[] };
    expect(body.online).toBe(false);
    expect(body.records).toHaveLength(1);
  });

  it("toggles state through the control route", async () => {
    const { app, store } = appWithAcme();
    const res = await app.request("/fake/acme/control", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ online: false }),
    });
    expect(res.status).toBe(200);
    expect(store.online).toBe(false);
  });

  it("redirects back when the page toggle form posts", async () => {
    const { app, store } = appWithAcme();
    const res = await app.request("/fake/acme/control", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "online=false&return=/acme?week=2026-W42",
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/acme?week=2026-W42");
    expect(store.online).toBe(false);
  });
});
