import { describe, expect, it } from "vitest";
import type { Fetcher } from "./dignitas";
import { reconcileDignitas, toDignitasPayload } from "./dignitas";
import type { TimeEntry } from "../timesheet/timesheet";

/** A fetcher that records its calls and returns canned responses. */
function recorder(responses: Array<{ status: number; body?: unknown }>) {
  const calls: Array<{ input: string; init?: RequestInit }> = [];
  let i = 0;
  const fetcher: Fetcher = async (input, init) => {
    calls.push({ input, init });
    const r = responses[i++] ?? { status: 200 };
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  };
  return { fetcher, calls };
}

const payload = { date: "2026-10-15", projectCode: "DIG-TRN", hours: 2, remark: "Workshop" };

describe("toDignitasPayload", () => {
  it("maps a Time Entry to the Dignitas record fields (Project → projectCode, description → remark)", () => {
    const entry: TimeEntry = { id: "x", date: "2026-10-15", projectId: "dig-trn", hours: 2, description: "Workshop" };
    expect(toDignitasPayload(entry)).toEqual(payload);
  });
});

describe("reconcileDignitas", () => {
  it("wanted and no remote id → creates and stores the registrationId", async () => {
    const { fetcher, calls } = recorder([{ status: 201, body: { registrationId: "dig-7" } }]);
    const status = await reconcileDignitas(fetcher, { wanted: true, payload });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input).toBe("/fake/dignitas/registrations");
    expect(calls[0]!.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual(payload);
    expect(status).toEqual({ registrationId: "dig-7", state: "synced" });
  });

  it("wanted and a remote id → replaces with the full current state, keeping the id", async () => {
    const { fetcher, calls } = recorder([{ status: 200, body: { registrationId: "dig-7" } }]);
    const status = await reconcileDignitas(fetcher, { wanted: true, registrationId: "dig-7", payload });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input).toBe("/fake/dignitas/registrations/dig-7");
    expect(calls[0]!.init?.method).toBe("PUT");
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual(payload);
    expect(status).toEqual({ registrationId: "dig-7", state: "synced" });
  });

  it("not wanted and a remote id → deletes it", async () => {
    const { fetcher, calls } = recorder([{ status: 204 }]);
    const status = await reconcileDignitas(fetcher, { wanted: false, registrationId: "dig-7" });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input).toBe("/fake/dignitas/registrations/dig-7");
    expect(calls[0]!.init?.method).toBe("DELETE");
    expect(status).toEqual({ state: "not applicable" });
  });

  it("not wanted and no remote id → does nothing", async () => {
    const { fetcher, calls } = recorder([]);
    const status = await reconcileDignitas(fetcher, { wanted: false });
    expect(calls).toHaveLength(0);
    expect(status).toEqual({ state: "not applicable" });
  });

  it("marks the Sync Status failed when the server rejects the call", async () => {
    const { fetcher } = recorder([{ status: 503, body: { error: "Offline" } }]);
    const status = await reconcileDignitas(fetcher, { wanted: true, registrationId: "dig-7", payload });
    expect(status).toEqual({ registrationId: "dig-7", state: "failed" });
  });
});
