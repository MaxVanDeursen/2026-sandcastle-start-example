// ISO weeks ("2026-W42", Monday to Sunday) and calendar days ("2026-10-15").
// All calculations in UTC so the host time zone never shifts a day.

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_PATTERN = /^(\d{4})-W(\d{2})$/;

function parseDay(day: string): Date {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== day) {
    throw new Error(`Invalid date: ${day}`);
  }
  return d;
}

function formatDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday */
function weekdayIndex(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

function mondayOfWeekOne(year: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  return new Date(jan4.getTime() - weekdayIndex(jan4) * DAY_MS);
}

/** The ISO week a calendar day falls in, e.g. "2026-10-15" → "2026-W42". */
export function isoWeek(day: string): string {
  const d = parseDay(day);
  const thursday = new Date(d.getTime() + (3 - weekdayIndex(d)) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = 1 + Math.round((thursday.getTime() - mondayOfWeekOne(year).getTime() - 3 * DAY_MS) / (7 * DAY_MS));
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** True for a well-formed ISO week that exists (some years have 53 weeks). */
export function isIsoWeek(week: string): boolean {
  const m = WEEK_PATTERN.exec(week);
  if (!m) return false;
  const n = Number(m[2]);
  return n >= 1 && n <= 53 && isoWeek(weekDays(week)[3]!) === week;
}

/** The seven calendar days of an ISO week, Monday first. */
export function weekDays(week: string): string[] {
  const m = WEEK_PATTERN.exec(week);
  if (!m) throw new Error(`Invalid ISO week: ${week}`);
  const monday = mondayOfWeekOne(Number(m[1])).getTime() + (Number(m[2]) - 1) * 7 * DAY_MS;
  return Array.from({ length: 7 }, (_, i) => formatDay(new Date(monday + i * DAY_MS)));
}

/** The ISO week `offset` weeks after `week` (negative for earlier). */
export function shiftWeek(week: string, offset: number): string {
  const monday = parseDay(weekDays(week)[0]!);
  return isoWeek(formatDay(new Date(monday.getTime() + offset * 7 * DAY_MS)));
}

/** The ISO week of `now`, in UTC. */
export function currentWeek(now: Date = new Date()): string {
  return isoWeek(formatDay(now));
}
