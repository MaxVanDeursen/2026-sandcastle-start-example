// Time Entries live in memory. The Timesheet is the single source of truth
// (see CONTEXT.md); each Time Entry has a UUID, a date, a Project, hours and a
// description. Validation lives here so routes and tests share one gate.

import { randomUUID } from "node:crypto";
import { findProject } from "../catalog/catalog";
import type { SyncStatus } from "../sync/dignitas";
import { isDay, isoWeek } from "../week/week";

export type TimeEntry = {
  id: string;
  date: string; // "2026-10-15"
  projectId: string;
  hours: number;
  description: string;
  /** Sync Status for the Dignitas Hour Server (CONTEXT.md), set after each Sync. */
  dignitas?: SyncStatus;
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

export type UpdateResult = AddResult | { ok: false; notFound: true };

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

  /** The Time Entry with the given id, or undefined. */
  find(id: string): TimeEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  /** Validate and, if valid, log a Time Entry. */
  add(input: EntryInput): AddResult {
    const result = this.validate(input);
    if (result.ok) this.entries.push(result.entry);
    return result;
  }

  /** Validate and, if valid, replace an existing Time Entry's fields (its id stays). */
  update(id: string, input: EntryInput): UpdateResult {
    const index = this.entries.findIndex((e) => e.id === id);
    if (index === -1) return { ok: false, notFound: true };
    const result = this.validate(input, id);
    if (!result.ok) return result;
    // Keep the entry's id and its Sync Status (its remote ids) across the edit.
    const entry = { ...result.entry, id, dignitas: this.entries[index]!.dignitas };
    this.entries[index] = entry;
    return { ok: true, entry };
  }

  /** Record a Time Entry's Dignitas Sync Status after a Sync. */
  setDignitasSync(id: string, status: SyncStatus): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) entry.dignitas = status;
  }

  /** Remove the Time Entry with the given id; true if one was removed. */
  remove(id: string): boolean {
    const index = this.entries.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.entries.splice(index, 1);
    return true;
  }

  // `excludeId` leaves an entry out of its date's 24-hour cap so editing it in place
  // is not blocked by its own hours.
  private validate(input: EntryInput, excludeId?: string): AddResult {
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
      .filter((e) => e.date === date && e.id !== excludeId)
      .reduce((sum, e) => sum + e.hours, 0);
    if (dayTotal + hours > MAX_HOURS_PER_DATE) {
      return { ok: false, message: "A date can hold at most 24 hours" };
    }

    return { ok: true, entry: { id: randomUUID(), date, projectId: project.id, hours, description } };
  }
}
