// Sync a Time Entry to the Dignitas Hour Server (see CONTEXT.md). The Timesheet
// is the single source of truth; Sync pushes each Time Entry's current state
// (create, replace, delete) to the server through a `fetch`-compatible function
// so it can be wired to the in-process app (ADR 0001) or faked in tests.

import { findProject } from "../catalog/catalog";
import type { TimeEntry } from "../timesheet/timesheet";

/** A `fetch`-compatible function scoped to the app; paths are absolute. */
export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

/** A Time Entry's Sync Status for one Hour Server (CONTEXT.md). */
export type SyncStatus = {
  /** The server's own id for the record, once created. */
  registrationId?: string;
  state: "synced" | "failed" | "not applicable";
};

/** The Dignitas Hour Server's record fields, derived from a Time Entry. */
export type DignitasPayload = {
  date: string;
  projectCode: string;
  hours: number;
  remark: string;
};

const BASE = "/fake/dignitas/registrations";
const JSON_HEADERS = { "content-type": "application/json" };

/** Map a Time Entry to the Dignitas record fields: Project → projectCode, description → remark. */
export function toDignitasPayload(entry: TimeEntry): DignitasPayload {
  return {
    date: entry.date,
    projectCode: findProject(entry.projectId)?.projectCode ?? entry.projectId,
    hours: entry.hours,
    remark: entry.description,
  };
}

/** What a Time Entry should look like on the server right now. */
export type ReconcileArgs =
  | { wanted: true; registrationId?: string; payload: DignitasPayload }
  | { wanted: false; registrationId?: string };

/**
 * Reconcile one Time Entry against the Dignitas Hour Server and return its new
 * Sync Status:
 * - wanted and no remote id → create, store the `registrationId`
 * - wanted and a remote id → replace with the full current state
 * - not wanted and a remote id → delete
 */
export async function reconcileDignitas(fetcher: Fetcher, args: ReconcileArgs): Promise<SyncStatus> {
  if (args.wanted) {
    if (!args.registrationId) {
      const res = await fetcher(BASE, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(args.payload),
      });
      if (!res.ok) return { state: "failed" };
      const { registrationId } = (await res.json()) as { registrationId: string };
      return { registrationId, state: "synced" };
    }
    const res = await fetcher(`${BASE}/${args.registrationId}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(args.payload),
    });
    if (!res.ok) return { registrationId: args.registrationId, state: "failed" };
    return { registrationId: args.registrationId, state: "synced" };
  }

  if (args.registrationId) {
    const res = await fetcher(`${BASE}/${args.registrationId}`, { method: "DELETE" });
    if (!res.ok) return { registrationId: args.registrationId, state: "failed" };
  }
  return { state: "not applicable" };
}
