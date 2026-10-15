// Acme Logistics' fake Client Hour Server store: its own record shape and an
// in-memory list. Work orders are validated against the Project catalog.
import { projects } from "../../catalog/catalog";

/** A record in Acme's own shape (not Urenbrug's Time Entry). */
export type AcmeRecord = {
  /** Server-assigned id, counting up from 1. */
  entryNo: number;
  /** Calendar day, "2026-10-15". */
  workDate: string;
  /** Acme work order, e.g. "WO-1042"; must be a known one. */
  workOrder: string;
  minutes: number;
  /** Free text, at most 80 characters. */
  summary: string;
};

/** The fields a caller supplies; `entryNo` is assigned by the server. */
export type AcmeInput = Omit<AcmeRecord, "entryNo">;

export const SUMMARY_MAX = 80;

/** Work orders Acme knows about, taken from the Project catalog. */
export const knownWorkOrders: ReadonlySet<string> = new Set(
  projects.map((p) => p.workOrder).filter((w): w is string => Boolean(w)),
);

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDay(day: unknown): day is string {
  if (typeof day !== "string" || !DAY_PATTERN.test(day)) return false;
  const d = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === day;
}

/** Why an input was rejected, for a `400` body. */
export type ValidationError = string;

/** Validates and normalises caller input into an `AcmeInput`, or returns why not. */
export function validateInput(body: unknown): AcmeInput | ValidationError {
  if (typeof body !== "object" || body === null) return "body must be a JSON object";
  const { workDate, workOrder, minutes, summary } = body as Record<string, unknown>;

  if (!isValidDay(workDate)) return "workDate must be a calendar day (YYYY-MM-DD)";
  if (typeof workOrder !== "string" || !knownWorkOrders.has(workOrder)) {
    return `unknown workOrder: ${String(workOrder)}`;
  }
  if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 0) {
    return "minutes must be a non-negative integer";
  }
  if (typeof summary !== "string") return "summary must be a string";
  if (summary.length > SUMMARY_MAX) return `summary must be at most ${SUMMARY_MAX} characters`;

  return { workDate, workOrder, minutes, summary };
}

/** Acme's in-memory store plus its Online/Offline flag. */
export class AcmeStore {
  private records = new Map<number, AcmeRecord>();
  private nextNo = 1;
  /** When false, the API answers every call with 503; inspect still works. */
  online = true;

  create(input: AcmeInput): AcmeRecord {
    const record: AcmeRecord = { entryNo: this.nextNo++, ...input };
    this.records.set(record.entryNo, record);
    return record;
  }

  /** Replaces the record with this `entryNo`; undefined if it does not exist. */
  replace(entryNo: number, input: AcmeInput): AcmeRecord | undefined {
    if (!this.records.has(entryNo)) return undefined;
    const record: AcmeRecord = { entryNo, ...input };
    this.records.set(entryNo, record);
    return record;
  }

  /** Deletes the record; false if there was none. */
  delete(entryNo: number): boolean {
    return this.records.delete(entryNo);
  }

  /** Records with `from <= workDate <= to`, sorted by date then entryNo. */
  listByDateRange(from: string, to: string): AcmeRecord[] {
    return this.all().filter((r) => r.workDate >= from && r.workDate <= to);
  }

  /** Every record, sorted by date then entryNo. Used by the inspect route. */
  all(): AcmeRecord[] {
    return [...this.records.values()].sort(
      (a, b) => a.workDate.localeCompare(b.workDate) || a.entryNo - b.entryNo,
    );
  }
}
