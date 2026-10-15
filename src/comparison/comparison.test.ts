import { describe, expect, it } from "vitest";
import { perDayComparison } from "./comparison";

describe("perDayComparison", () => {
  it("has one row per day, Monday first, summing amounts per day", () => {
    const rows = perDayComparison(
      "2026-W42",
      [
        { date: "2026-10-12", amount: 2 },
        { date: "2026-10-12", amount: 1 },
      ],
      [],
    );
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({ day: "2026-10-12", label: "Monday", server: 3, timesheet: 0 });
  });

  it("marks a day as differing only when the totals are unequal", () => {
    const rows = perDayComparison(
      "2026-W42",
      [{ date: "2026-10-12", amount: 3 }],
      [
        { date: "2026-10-12", amount: 3 }, // Monday: match
        { date: "2026-10-13", amount: 5 }, // Tuesday: server 0, differs
      ],
    );
    const byDay = Object.fromEntries(rows.map((r) => [r.day, r]));
    expect(byDay["2026-10-12"]!.differs).toBe(false);
    expect(byDay["2026-10-13"]).toMatchObject({ server: 0, timesheet: 5, differs: true });
  });
});
