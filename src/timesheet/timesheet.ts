// Time Entries live in memory. The Timesheet is the single source of truth
// (see CONTEXT.md); each Time Entry has a UUID, a date, a Project, hours and a
// description. Validation lives here so routes and tests share one gate.

import { randomUUID } from "node:crypto";
import { findProject } from "../catalog/catalog";
import { isDay, isoWeek } from "../week/week";

export type TimeEntry = {
  id: string;
  date: string; // "2026-10-15"
  projectId: string;
  hours: number;
  description: string;
};

/** Raw form values, before validation. */
export type EntryInput = {
  date: string;
  projectId: string;
  hours: string;
  description: string;
};

export type AddResult =
  | { ok: true; entry: TimeEntry }
  | { ok: false; message: string };

export const HOURS_STEP = 0.25;
export const MAX_HOURS_PER_DATE = 24;
export const MAX_DESCRIPTION = 200;

function isMultipleOfStep(hours: number): boolean {
  const steps = hours / HOURS_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/** The Timesheet's in-memory store of Time Entries. */
export class Timesheet {
  private entries: TimeEntry[] = [];

  /** Every Time Entry, in the order they were logged. */
  all(): readonly TimeEntry[] {
    return this.entries;
  }

  /** The Time Entries whose date falls in the given ISO week. */
  forWeek(week: string): TimeEntry[] {
    return this.entries.filter((e) => isoWeek(e.date) === week);
  }

  /** Validate and, if valid, log a Time Entry. */
  add(input: EntryInput): AddResult {
    const result = this.validate(input);
    if (result.ok) this.entries.push(result.entry);
    return result;
  }

  private validate(input: EntryInput): AddResult {
    const date = input.date.trim();
    if (!isDay(date)) return { ok: false, message: "Enter a valid date" };

    const project = findProject(input.projectId.trim());
    if (!project) return { ok: false, message: "Project must exist" };

    const hours = Number(input.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      return { ok: false, message: "Hours must be more than 0" };
    }
    if (!isMultipleOfStep(hours)) {
      return { ok: false, message: "Hours must be in steps of 0.25" };
    }
    if (hours > 24) return { ok: false, message: "Hours can be at most 24" };

    const description = input.description.trim();
    if (description.length === 0) return { ok: false, message: "Description is required" };
    if (description.length > MAX_DESCRIPTION) {
      return { ok: false, message: "Description can be at most 200 characters" };
    }

    const dayTotal = this.entries
      .filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.hours, 0);
    if (dayTotal + hours > MAX_HOURS_PER_DATE) {
      return { ok: false, message: "A date can hold at most 24 hours" };
    }

    return { ok: true, entry: { id: randomUUID(), date, projectId: project.id, hours, description } };
  }
}
