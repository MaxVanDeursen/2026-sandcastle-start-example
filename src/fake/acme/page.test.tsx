import { describe, expect, it } from "vitest";
import { createApp } from "../../app";

const valid = { workDate: "2026-10-15", workOrder: "WO-1042", minutes: 90, summary: "Portal work" };

async function create(app: ReturnType<typeof createApp>, body: unknown = valid) {
  return app.request("/fake/acme/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Acme Hour Server Page", () => {
  it("shows records created through the API in Acme's own fields", async () => {
    const app = createApp();
    await create(app);
    const html = await (await app.request("/acme?week=2026-W42")).text();
    expect(html).toContain("<th>entryNo</th>");
    expect(html).toContain("<th>workOrder</th>");
    expect(html).toContain("WO-1042");
    expect(html).toContain("Portal work");
    expect(html).toContain("90");
  });

  it("only shows the requested week's records", async () => {
    const app = createApp();
    await create(app, { ...valid, workDate: "2026-10-15", summary: "In week 42" });
    await create(app, { ...valid, workDate: "2026-10-22", summary: "In week 43" });
    const html = await (await app.request("/acme?week=2026-W42")).text();
    expect(html).toContain("In week 42");
    expect(html).not.toContain("In week 43");
  });

  it("has previous and next week navigation", async () => {
    const app = createApp();
    const html = await (await app.request("/acme?week=2026-W42")).text();
    expect(html).toContain('href="/acme?week=2026-W41"');
    expect(html).toContain('href="/acme?week=2026-W43"');
  });

  it("shows the Online status and an Offline toggle, and the page still works Offline", async () => {
    const app = createApp();
    let html = await (await app.request("/acme?week=2026-W42")).text();
    expect(html).toContain("Online");
    expect(html).toContain('action="/fake/acme/control"');

    await app.request("/fake/acme/control", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ online: false }),
    });
    const res = await app.request("/acme?week=2026-W42");
    expect(res.status).toBe(200);
    html = await res.text();
    expect(html).toContain("Offline");
  });

  it("falls back to the current week for a bad week param", async () => {
    const app = createApp();
    expect((await app.request("/acme?week=nonsense")).status).toBe(200);
  });
});
