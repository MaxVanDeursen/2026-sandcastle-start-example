import { describe, expect, it } from "vitest";
import { createDignitasServer } from "./dignitas";

const json = { "content-type": "application/json" };

function makeInput(over: Record<string, unknown> = {}) {
  return { date: "2026-10-15", projectCode: "DIG-TRN", hours: 2, remark: "Workshop", ...over };
}

function create(app: ReturnType<typeof createDignitasServer>, input = makeInput()) {
  return app.request("/registrations", { method: "POST", headers: json, body: JSON.stringify(input) });
}

function listWeek(app: ReturnType<typeof createDignitasServer>, week = "2026-W42") {
  return app.request(`/registrations?week=${week}`);
}

function setOnline(app: ReturnType<typeof createDignitasServer>, online: boolean) {
  return app.request("/control", { method: "POST", headers: json, body: JSON.stringify({ online }) });
}

describe("Dignitas Hour Server API", () => {
  it("creates a record and returns a registrationId", async () => {
    const app = createDignitasServer();
    const res = await create(app);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.registrationId).toBeTruthy();
  });

  it("lists records by ISO week in the server's own shape", async () => {
    const app = createDignitasServer();
    await create(app, makeInput({ date: "2026-10-15" })); // W42
    await create(app, makeInput({ date: "2026-10-05" })); // W41
    const list = await (await listWeek(app)).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ date: "2026-10-15", projectCode: "DIG-TRN", hours: 2, remark: "Workshop" });
    expect(list[0].registrationId).toBeTruthy();
  });

  it("replaces a record by registrationId", async () => {
    const app = createDignitasServer();
    const { registrationId } = await (await create(app)).json();
    const res = await app.request(`/registrations/${registrationId}`, {
      method: "PUT",
      headers: json,
      body: JSON.stringify(makeInput({ hours: 4, remark: "Longer" })),
    });
    expect(res.status).toBe(200);
    const list = await (await listWeek(app)).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ registrationId, hours: 4, remark: "Longer" });
  });

  it("deletes a record by registrationId", async () => {
    const app = createDignitasServer();
    const { registrationId } = await (await create(app)).json();
    const del = await app.request(`/registrations/${registrationId}`, { method: "DELETE" });
    expect(del.status).toBe(204);
    expect(await (await listWeek(app)).json()).toHaveLength(0);
  });

  it("404s replacing or deleting an unknown registrationId", async () => {
    const app = createDignitasServer();
    expect((await app.request("/registrations/nope", { method: "DELETE" })).status).toBe(404);
    const put = await app.request("/registrations/nope", { method: "PUT", headers: json, body: JSON.stringify(makeInput()) });
    expect(put.status).toBe(404);
  });

  describe("Offline", () => {
    it("answers 503 to every API call while Offline", async () => {
      const app = createDignitasServer();
      await setOnline(app, false);
      expect((await create(app)).status).toBe(503);
      expect((await listWeek(app)).status).toBe(503);
      expect((await app.request("/registrations/x", { method: "DELETE" })).status).toBe(503);
    });

    it("still serves the inspect route while Offline", async () => {
      const app = createDignitasServer();
      await create(app);
      await setOnline(app, false);
      const res = await app.request("/_inspect?week=2026-W42");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.online).toBe(false);
      expect(body.records).toHaveLength(1);
    });

    it("comes back Online via the control route", async () => {
      const app = createDignitasServer();
      await setOnline(app, false);
      await setOnline(app, true);
      expect((await create(app)).status).toBe(201);
    });
  });
});
