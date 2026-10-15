import { describe, expect, it } from "vitest";
import { createApp } from "../app";

/** POST form-encoded body to a path, following no redirect. */
function post(app: ReturnType<typeof createApp>, path: string, fields: Record<string, string>) {
  return app.request(path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}

const validEntry = { date: "2026-10-15", projectId: "acme-wp", hours: "1.5", description: "Portal work" };

describe("Timesheet add form", () => {
  it("renders the add form and week navigation", async () => {
    const html = await (await createApp().request("/?week=2026-W42")).text();
    expect(html).toContain('action="/?week=2026-W42"');
    expect(html).toContain('name="date"');
    expect(html).toContain('name="projectId"');
    expect(html).toContain('name="hours"');
    expect(html).toContain('name="description"');
    expect(html).toContain("Acme Logistics · Warehouse Portal");
    expect(html).toContain('href="/?week=2026-W41"'); // previous
    expect(html).toContain('href="/?week=2026-W43"'); // next
  });

  it("redirects back and shows a valid Time Entry under its day with an updated week total", async () => {
    const app = createApp();
    const res = await post(app, "/?week=2026-W42", validEntry);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?week=2026-W42");

    const html = await (await app.request("/?week=2026-W42")).text();
    expect(html).toMatch(/Thursday 2026-10-15[\s\S]*Portal work/);
    expect(html).toContain("Acme Logistics · Warehouse Portal");
    expect(html).toContain("Week total: 1.5h");
  });

  it("sums several Time Entries on the same day into the day and week totals", async () => {
    const app = createApp();
    await post(app, "/?week=2026-W42", { ...validEntry, hours: "1.5" });
    await post(app, "/?week=2026-W42", { ...validEntry, hours: "2", description: "More work" });
    const html = await (await app.request("/?week=2026-W42")).text();
    expect(html).toContain("Thursday 2026-10-15 — 3.5h");
    expect(html).toContain("Week total: 3.5h");
  });

  it("shows only the viewed week's Time Entries as navigation moves", async () => {
    const app = createApp();
    await post(app, "/?week=2026-W42", { ...validEntry, date: "2026-10-15", description: "Week 42 work" });
    await post(app, "/?week=2026-W43", { ...validEntry, date: "2026-10-19", description: "Week 43 work" });

    const w42 = await (await app.request("/?week=2026-W42")).text();
    expect(w42).toContain("Week 42 work");
    expect(w42).not.toContain("Week 43 work");

    const w43 = await (await app.request("/?week=2026-W43")).text();
    expect(w43).toContain("Week 43 work");
    expect(w43).not.toContain("Week 42 work");
  });

  it.each([
    ["an unknown date", { date: "2026-02-30" }, "Enter a valid date"],
    ["an unknown Project", { projectId: "nope" }, "Project must exist"],
    ["zero hours", { hours: "0" }, "Hours must be more than 0"],
    ["hours off the 0.25 step", { hours: "1.1" }, "Hours must be in steps of 0.25"],
    ["more than 24 hours", { hours: "25" }, "Hours can be at most 24"],
    ["an empty description", { description: "" }, "Description is required"],
    ["an over-long description", { description: "x".repeat(201) }, "Description can be at most 200 characters"],
  ])("rejects %s, re-rendering the form with the message and kept values", async (_label, override, message) => {
    const app = createApp();
    const fields = { ...validEntry, ...override };
    const res = await post(app, "/?week=2026-W42", fields);
    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain(message);
    // Kept values: whatever the Consultant typed is still in the form.
    expect(html).toContain(`value="${fields.date}"`);
    expect(html).toContain(`value="${fields.hours}"`);
    expect(html).toContain(`value="${fields.description}"`);
    // Nothing was logged.
    expect(html).not.toMatch(/<table>/);
  });

  it("rejects a 25th hour on a date that is already full", async () => {
    const app = createApp();
    await post(app, "/?week=2026-W42", { ...validEntry, hours: "20" });
    const res = await post(app, "/?week=2026-W42", { ...validEntry, hours: "5", description: "Overflow" });
    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("A date can hold at most 24 hours");
    expect(html).toContain('value="Overflow"');
  });
});

/** Add one Time Entry and return its id, read from its Edit link. */
async function addAndGetId(app: ReturnType<typeof createApp>, fields = validEntry): Promise<string> {
  await post(app, "/?week=2026-W42", fields);
  const html = await (await app.request("/?week=2026-W42")).text();
  const id = html.match(/\/entries\/([0-9a-f-]{36})\/edit/)?.[1];
  if (!id) throw new Error("no entry id found on the Timesheet");
  return id;
}

describe("Timesheet edit and delete", () => {
  it("shows Edit and Delete controls on each Time Entry row", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    const html = await (await app.request("/?week=2026-W42")).text();
    expect(html).toContain(`/entries/${id}/edit?week=2026-W42`);
    expect(html).toContain(`action="/entries/${id}/delete?week=2026-W42"`);
  });

  it("opens the edit form pre-filled with the entry's values", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    const html = await (await app.request(`/entries/${id}/edit?week=2026-W42`)).text();
    expect(html).toContain(`action="/entries/${id}?week=2026-W42"`);
    expect(html).toContain('value="2026-10-15"');
    expect(html).toContain('value="1.5"');
    expect(html).toContain('value="Portal work"');
    expect(html).toContain("Save Time Entry");
  });

  it("saves edited date, Project, hours and description and returns to the entry's week", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    const res = await post(app, `/entries/${id}?week=2026-W42`, {
      date: "2026-10-19",
      projectId: "dig-trn",
      hours: "3",
      description: "Edited work",
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?week=2026-W43");

    const w43 = await (await app.request("/?week=2026-W43")).text();
    expect(w43).toContain("Edited work");
    expect(w43).toContain("Dignitas · Training");
    expect(w43).toContain("Week total: 3h");

    // The old week no longer shows the entry.
    const w42 = await (await app.request("/?week=2026-W42")).text();
    expect(w42).not.toContain("Edited work");
    expect(w42).toContain("Week total: 0h");
  });

  it("re-renders the edit form with the message on invalid input", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    const res = await post(app, `/entries/${id}?week=2026-W42`, { ...validEntry, hours: "1.1" });
    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("Hours must be in steps of 0.25");
    expect(html).toContain('value="1.1"');
    // Nothing changed: the original is still logged.
    const w42 = await (await app.request("/?week=2026-W42")).text();
    expect(w42).toContain("Week total: 1.5h");
  });

  it("deletes a Time Entry and updates the week total", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    const res = await post(app, `/entries/${id}/delete?week=2026-W42`, {});
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?week=2026-W42");

    const w42 = await (await app.request("/?week=2026-W42")).text();
    expect(w42).not.toContain("Portal work");
    expect(w42).toContain("Week total: 0h");
  });

  it("404s for an unknown id on edit, save and delete", async () => {
    const app = createApp();
    const unknown = "00000000-0000-0000-0000-000000000000";
    expect((await app.request(`/entries/${unknown}/edit`)).status).toBe(404);
    expect((await post(app, `/entries/${unknown}`, validEntry)).status).toBe(404);
    expect((await post(app, `/entries/${unknown}/delete`, {})).status).toBe(404);
  });
});

/** The Dignitas Hour Server's records for a week, via its inspect route. */
async function dignitasRecords(app: ReturnType<typeof createApp>, week = "2026-W42") {
  const res = await app.request(`/fake/dignitas/_inspect?week=${week}`);
  return (await res.json()).records as Array<{ projectCode: string; hours: number; remark: string }>;
}

describe("Sync to the Dignitas Hour Server", () => {
  it("shows a green D badge on every Time Entry after it Syncs", async () => {
    const app = createApp();
    await post(app, "/?week=2026-W42", validEntry);
    const html = await (await app.request("/?week=2026-W42")).text();
    expect(html).toMatch(/<span class="badge badge-synced"[^>]*>\s*D\s*<\/span>/);
  });

  it("reflects an added Time Entry on the Dignitas Hour Server", async () => {
    const app = createApp();
    await post(app, "/?week=2026-W42", validEntry);
    const records = await dignitasRecords(app);
    expect(records).toHaveLength(1);
    // Project → projectCode, description → remark.
    expect(records[0]).toMatchObject({ projectCode: "ACME-WP", hours: 1.5, remark: "Portal work" });
  });

  it("replaces the same record when a Time Entry is edited (no duplicate)", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    await post(app, `/entries/${id}?week=2026-W42`, {
      date: "2026-10-15",
      projectId: "dig-trn",
      hours: "3",
      description: "Edited work",
    });
    const records = await dignitasRecords(app);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ projectCode: "DIG-TRN", hours: 3, remark: "Edited work" });
  });

  it("deletes the record when a Time Entry is deleted", async () => {
    const app = createApp();
    const id = await addAndGetId(app);
    expect(await dignitasRecords(app)).toHaveLength(1);
    await post(app, `/entries/${id}/delete?week=2026-W42`, {});
    expect(await dignitasRecords(app)).toHaveLength(0);
  });
});
