import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("pages", () => {
  const app = createApp();

  it.each([
    ["/", "Timesheet"],
    ["/dignitas", "Dignitas Hour Server"],
    ["/acme", "Client Hour Server (Acme Logistics)"],
  ])("%s renders its heading and the nav", async (path, heading) => {
    const res = await app.request(path);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<h1>${heading}</h1>`);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/dignitas"');
    expect(html).toContain('href="/acme"');
  });

  it("marks the current page in the nav", async () => {
    const html = await (await app.request("/acme")).text();
    expect(html).toMatch(/<a href="\/acme" aria-current="page">/);
  });

  it("answers 404 for unknown routes", async () => {
    expect((await app.request("/nope")).status).toBe(404);
  });
});

describe("Dignitas Hour Server Page", () => {
  const json = { "content-type": "application/json" };
  const form = { "content-type": "application/x-www-form-urlencoded" };

  function createRecord(app: ReturnType<typeof createApp>, over: Record<string, unknown> = {}) {
    return app.request("/fake/dignitas/registrations", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ date: "2026-10-15", projectCode: "DIG-TRN", hours: 2, remark: "Workshop", ...over }),
    });
  }

  it("shows the week's records created through the API, in the server's own fields", async () => {
    const app = createApp();
    await createRecord(app, { date: "2026-10-15" }); // W42
    await createRecord(app, { date: "2026-10-05", projectCode: "DIG-INT", remark: "Other week" }); // W41
    const html = await (await app.request("/dignitas?week=2026-W42")).text();
    expect(html).toContain("DIG-TRN");
    expect(html).toContain("Workshop");
    expect(html).toContain("2026-10-15");
    expect(html).not.toContain("Other week");
  });

  it("offers week navigation", async () => {
    const app = createApp();
    const html = await (await app.request("/dignitas?week=2026-W42")).text();
    expect(html).toContain("/dignitas?week=2026-W41");
    expect(html).toContain("/dignitas?week=2026-W43");
  });

  it("toggles Online/Offline from the page, and the page keeps working while Offline", async () => {
    const app = createApp();
    expect((await createRecord(app)).status).toBe(201); // Online: API works

    await app.request("/dignitas/toggle", { method: "POST", headers: form, body: "online=false&week=2026-W42" });
    expect((await createRecord(app)).status).toBe(503); // Offline: API 503s

    const offlineHtml = await (await app.request("/dignitas?week=2026-W42")).text();
    expect(offlineHtml).toContain("DIG-TRN"); // inspect route keeps the page working
    expect(offlineHtml).toContain("Offline");

    await app.request("/dignitas/toggle", { method: "POST", headers: form, body: "online=true&week=2026-W42" });
    expect((await createRecord(app)).status).toBe(201); // back Online
  });

  it("compares the server's per-day total against the Timesheet, in hours", async () => {
    const app = createApp();
    // Timesheet: 2h on Monday (any Project; Dignitas gets every Time Entry).
    // Logging it Syncs it to the server, so Monday: server 2 == Timesheet 2.
    await app.request("/", {
      method: "POST",
      headers: form,
      body: "date=2026-10-12&projectId=dig-trn&hours=2&description=Workshop",
    });
    await createRecord(app, { date: "2026-10-13", hours: 3 }); // Tuesday: server 3, Timesheet 0

    const html = await (await app.request("/dignitas?week=2026-W42")).text();
    expect(html).toContain("Server (h)");
    expect(html).toContain("Timesheet (h)");
    // Matching Monday is not highlighted; differing Tuesday is.
    expect(html).toMatch(/<tr><td>\s*Monday 2026-10-12\s*<\/td>/);
    expect(html).toMatch(/<tr class="diff"><td>\s*Tuesday 2026-10-13\s*<\/td>/);
  });
});
