import { describe, expect, it } from "vitest";
import { currentWeek, isDay, isIsoWeek, isoWeek, shiftWeek, weekDays } from "./week";

describe("isoWeek", () => {
  it("finds the week of a day", () => {
    expect(isoWeek("2026-10-15")).toBe("2026-W42");
    expect(isoWeek("2026-10-12")).toBe("2026-W42"); // Monday
    expect(isoWeek("2026-10-18")).toBe("2026-W42"); // Sunday
  });

  it("handles year boundaries", () => {
    expect(isoWeek("2026-01-01")).toBe("2026-W01"); // Thursday
    expect(isoWeek("2027-01-01")).toBe("2026-W53"); // Friday, in the last week of 2026
    expect(isoWeek("2024-12-30")).toBe("2025-W01"); // Monday, in the first week of 2025
  });

  it("rejects invalid days", () => {
    expect(() => isoWeek("2026-02-30")).toThrow();
    expect(() => isoWeek("15-10-2026")).toThrow();
  });
});

describe("weekDays", () => {
  it("lists Monday to Sunday", () => {
    expect(weekDays("2026-W42")).toEqual([
      "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18",
    ]);
  });

  it("crosses year boundaries", () => {
    expect(weekDays("2025-W01")[0]).toBe("2024-12-30");
    expect(weekDays("2026-W53")[6]).toBe("2027-01-03");
  });
});

describe("shiftWeek", () => {
  it("moves to the previous and next week, across years", () => {
    expect(shiftWeek("2026-W42", -1)).toBe("2026-W41");
    expect(shiftWeek("2026-W42", 1)).toBe("2026-W43");
    expect(shiftWeek("2026-W53", 1)).toBe("2027-W01");
    expect(shiftWeek("2026-W01", -1)).toBe("2025-W52");
  });
});

describe("isIsoWeek", () => {
  it("accepts existing weeks only", () => {
    expect(isIsoWeek("2026-W42")).toBe(true);
    expect(isIsoWeek("2026-W53")).toBe(true);
    expect(isIsoWeek("2025-W53")).toBe(false);
    expect(isIsoWeek("2026-W00")).toBe(false);
    expect(isIsoWeek("2026-42")).toBe(false);
  });
});

describe("isDay", () => {
  it("accepts real calendar days only", () => {
    expect(isDay("2026-10-15")).toBe(true);
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("15-10-2026")).toBe(false);
    expect(isDay("2026-13-01")).toBe(false);
    expect(isDay("")).toBe(false);
  });
});

describe("currentWeek", () => {
  it("uses the given moment, in UTC", () => {
    expect(currentWeek(new Date("2026-10-15T12:00:00Z"))).toBe("2026-W42");
  });
});
