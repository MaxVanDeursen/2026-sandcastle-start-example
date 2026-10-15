import { Hono } from "hono";
import type { DignitasRecord } from "./fake/dignitas";
import { createDignitasServer } from "./fake/dignitas";
import { ClientHourServerPage, DignitasHourServerPage, TimesheetPage } from "./pages/pages";
import { currentWeek } from "./week/week";

/** Builds the whole app. Tests call routes in-process with `app.request()`. */
export function createApp() {
  const app = new Hono();

  app.route("/fake/dignitas", createDignitasServer());

  app.get("/", (c) => c.html(<TimesheetPage />));

  app.get("/dignitas", async (c) => {
    const week = c.req.query("week") ?? currentWeek();
    const res = await app.request(`/fake/dignitas/_inspect?week=${week}`);
    const { online, records } = (await res.json()) as { online: boolean; records: DignitasRecord[] };
    return c.html(<DignitasHourServerPage week={week} online={online} records={records} />);
  });

  // Online/Offline toggle on the Dignitas Hour Server Page, via the control route.
  app.post("/dignitas/toggle", async (c) => {
    const body = await c.req.parseBody();
    const online = body.online === "true";
    const week = typeof body.week === "string" ? body.week : currentWeek();
    await app.request("/fake/dignitas/control", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ online }),
    });
    return c.redirect(`/dignitas?week=${week}`);
  });

  app.get("/acme", (c) => c.html(<ClientHourServerPage />));

  return app;
}
