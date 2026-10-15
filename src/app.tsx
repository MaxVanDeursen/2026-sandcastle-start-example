import { Hono } from "hono";
import type { DignitasRecord } from "./fake/dignitas";
import { createDignitasServer } from "./fake/dignitas";
import { DignitasHourServerPage, TimesheetPage } from "./pages/pages";
import { AcmeStore } from "./fake/acme/store";
import { createAcmeServer } from "./fake/acme/server";
import { AcmeHourServerPage } from "./fake/acme/page";
import { Timesheet, type EntryInput } from "./timesheet/timesheet";
import { currentWeek, isIsoWeek, isoWeek, weekDays } from "./week/week";

/** Builds the whole app. Tests call routes in-process with `app.request()`. */
export function createApp() {
  const app = new Hono();
  const timesheet = new Timesheet();

  /** The week to show: a valid `?week=` query, else the current week. */
  const weekParam = (raw: string | undefined): string =>
    raw && isIsoWeek(raw) ? raw : currentWeek();

  app.get("/", (c) => {
    const week = weekParam(c.req.query("week"));
    return c.html(<TimesheetPage week={week} entries={timesheet.forWeek(week)} />);
  });

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const input: EntryInput = {
      date: String(body.date ?? ""),
      projectId: String(body.projectId ?? ""),
      hours: String(body.hours ?? ""),
      description: String(body.description ?? ""),
    };
    const result = timesheet.add(input);
    if (result.ok) {
      // Land on the week of the entered date so the new Time Entry is visible.
      return c.redirect(`/?week=${isoWeek(result.entry.date)}`, 303);
    }
    const week = weekParam(c.req.query("week"));
    return c.html(
      <TimesheetPage week={week} entries={timesheet.forWeek(week)} form={{ values: input, message: result.message }} />,
      422,
    );
  });

  app.route("/fake/dignitas", createDignitasServer());

  // Fake Client Hour Server (Acme): its own in-memory store, API sub-app and page.
  const acme = new AcmeStore();
  app.route("/fake/acme", createAcmeServer(acme));

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

  app.get("/acme", (c) => {
    const requested = c.req.query("week");
    const week = requested && isIsoWeek(requested) ? requested : currentWeek();
    const days = weekDays(week);
    const records = acme.listByDateRange(days[0]!, days[6]!);
    return c.html(<AcmeHourServerPage week={week} online={acme.online} records={records} />);
  });

  return app;
}
