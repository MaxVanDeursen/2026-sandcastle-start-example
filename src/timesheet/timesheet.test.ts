import { describe, expect, it } from "vitest";
import { Timesheet, type EntryInput } from "./timesheet";

function valid(overrides: Partial<EntryInput> = {}): EntryInput {
  return { date: "2026-10-15", projectId: "acme-wp", hours: "1.5", description: "Portal work", ...overrides };
}

describe("Timesheet.add", () => {
  it("logs a valid Time Entry with a UUID", () => {
    const sheet = new Timesheet();
    const result = sheet.add(valid());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).toMatchObject({ date: "2026-10-15", projectId: "acme-wp", hours: 1.5, description: "Portal work" });
    expect(result.entry.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(sheet.all()).toHaveLength(1);
  });

  it.each([
    ["an unknown date", valid({ date: "2026-02-30" }), "Enter a valid date"],
    ["an unknown Project", valid({ projectId: "nope" }), "Project must exist"],
    ["zero hours", valid({ hours: "0" }), "Hours must be more than 0"],
    ["negative hours", valid({ hours: "-2" }), "Hours must be more than 0"],
    ["non-numeric hours", valid({ hours: "abc" }), "Hours must be more than 0"],
    ["hours off the 0.25 step", valid({ hours: "1.1" }), "Hours must be in steps of 0.25"],
    ["more than 24 hours", valid({ hours: "25" }), "Hours can be at most 24"],
    ["an empty description", valid({ description: "   " }), "Description is required"],
    ["an over-long description", valid({ description: "x".repeat(201) }), "Description can be at most 200 characters"],
  ])("rejects %s", (_label, input, message) => {
    const sheet = new Timesheet();
    const result = sheet.add(input);
    expect(result).toEqual({ ok: false, message });
    expect(sheet.all()).toHaveLength(0);
  });

  it("rejects a date that would exceed 24 hours in total", () => {
    const sheet = new Timesheet();
    expect(sheet.add(valid({ hours: "20" })).ok).toBe(true);
    const result = sheet.add(valid({ hours: "5" }));
    expect(result).toEqual({ ok: false, message: "A date can hold at most 24 hours" });
    expect(sheet.all()).toHaveLength(1);
  });

  it("allows filling a date to exactly 24 hours", () => {
    const sheet = new Timesheet();
    expect(sheet.add(valid({ hours: "20" })).ok).toBe(true);
    expect(sheet.add(valid({ hours: "4" })).ok).toBe(true);
    expect(sheet.all()).toHaveLength(2);
  });
});

describe("Timesheet.find", () => {
  it("returns the Time Entry with the given id, or undefined", () => {
    const sheet = new Timesheet();
    const added = sheet.add(valid());
    if (!added.ok) throw new Error("expected add to succeed");
    expect(sheet.find(added.entry.id)).toBe(added.entry);
    expect(sheet.find("nope")).toBeUndefined();
  });
});

describe("Timesheet.update", () => {
  it("changes date, Project, hours and description, keeping the id", () => {
    const sheet = new Timesheet();
    const added = sheet.add(valid());
    if (!added.ok) throw new Error("expected add to succeed");
    const result = sheet.update(added.entry.id, valid({ date: "2026-10-16", projectId: "dig-trn", hours: "3", description: "Changed" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry).toMatchObject({ id: added.entry.id, date: "2026-10-16", projectId: "dig-trn", hours: 3, description: "Changed" });
    expect(sheet.all()).toHaveLength(1);
    expect(sheet.find(added.entry.id)).toMatchObject({ description: "Changed" });
  });

  it("validates with the same gate as adding", () => {
    const sheet = new Timesheet();
    const added = sheet.add(valid());
    if (!added.ok) throw new Error("expected add to succeed");
    const result = sheet.update(added.entry.id, valid({ hours: "1.1" }));
    expect(result).toEqual({ ok: false, message: "Hours must be in steps of 0.25" });
    // The original value is untouched.
    expect(sheet.find(added.entry.id)).toMatchObject({ hours: 1.5 });
  });

  it("excludes the edited entry from its date's 24-hour cap", () => {
    const sheet = new Timesheet();
    const added = sheet.add(valid({ hours: "20" }));
    if (!added.ok) throw new Error("expected add to succeed");
    // Growing the same entry to 24 is fine even though 20 already exist.
    const result = sheet.update(added.entry.id, valid({ hours: "24" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.hours).toBe(24);
  });

  it("returns not-found for an unknown id", () => {
    const sheet = new Timesheet();
    expect(sheet.update("nope", valid())).toEqual({ ok: false, notFound: true });
  });
});

describe("Timesheet.remove", () => {
  it("removes the Time Entry and reports success", () => {
    const sheet = new Timesheet();
    const added = sheet.add(valid());
    if (!added.ok) throw new Error("expected add to succeed");
    expect(sheet.remove(added.entry.id)).toBe(true);
    expect(sheet.all()).toHaveLength(0);
    expect(sheet.find(added.entry.id)).toBeUndefined();
  });

  it("reports failure for an unknown id", () => {
    const sheet = new Timesheet();
    expect(sheet.remove("nope")).toBe(false);
  });
});

describe("Timesheet.forWeek", () => {
  it("keeps only the Time Entries whose date falls in the week", () => {
    const sheet = new Timesheet();
    sheet.add(valid({ date: "2026-10-15" })); // W42
    sheet.add(valid({ date: "2026-10-12" })); // W42 Monday
    sheet.add(valid({ date: "2026-10-19" })); // W43 Monday
    expect(sheet.forWeek("2026-W42").map((e) => e.date)).toEqual(["2026-10-15", "2026-10-12"]);
    expect(sheet.forWeek("2026-W43").map((e) => e.date)).toEqual(["2026-10-19"]);
  });
});
