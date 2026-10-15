import { Hono } from "hono";
import type { Context } from "hono";
import type { DignitasRecord } from "./fake/dignitas";
import { createDignitasServer } from "./fake/dignitas";
import { DignitasHourServerPage, EditEntryPage, TimesheetPage } from "./pages/pages";
import { AcmeStore } from "./fake/acme/store";
import { createAcmeServer } from "./fake/acme/server";
import { AcmeHourServerPage } from "./fake/acme/page";
import { Timesheet, type EntryInput } from "./timesheet/timesheet";
import { reconcileDignitas, toDignitasPayload, type Fetcher } from "./sync/dignitas";
import { ACME_CLIENT_ID, findProject } from "./catalog/catalog";
import { perDayComparison } from "./comparison/comparison";
import { currentWeek, isIsoWeek, isoWeek, weekDays } from "./week/week";

/** Builds the whole app. Tests call routes in-process with `app.request()`. */
export function createApp() {
  const app = new Hono();
  const timesheet = new Timesheet();

  // Sync reaches the in-process Dignitas Hour Server through the app itself.
  const fetcher: Fetcher = async (input, init) => app.request(input, init);

  /** The week to show: a valid `?week=` query, else the current week. */
  const weekParam = (raw: string | undefined): string =>
    raw && isIsoWeek(raw) ? raw : currentWeek();

  /** Read the add/edit form body into an EntryInput. */
  const readEntryInput = async (c: Context): Promise<EntryInput> => {
    const body = await c.req.parseBody();
    return {
      date: String(body.date ?? ""),
      projectId: String(body.projectId ?? ""),
      hours: String(body.hours ?? ""),
      description: String(body.description ?? ""),
    };
  };

  app.get("/", (c) => {
    const week = weekParam(c.req.query("week"));
    return c.html(<TimesheetPage week={week} entries={timesheet.forWeek(week)} />);
  });

  app.post("/", async (c) => {
    const input = await readEntryInput(c);
    const result = timesheet.add(input);
    if (result.ok) {
      // Sync the new Time Entry to the Dignitas Hour Server in this request.
      const status = await reconcileDignitas(fetcher, { wanted: true, payload: toDignitasPayload(result.entry) });
      timesheet.setDignitasSync(result.entry.id, status);
      // Land on the week of the entered date so the new Time Entry is visible.
      return c.redirect(`/?week=${isoWeek(result.entry.date)}`, 303);
    }
    const week = weekParam(c.req.query("week"));
    return c.html(
      <TimesheetPage week={week} entries={timesheet.forWeek(week)} form={{ values: input, message: result.message }} />,
      422,
    );
  });

  app.get("/entries/:id/edit", (c) => {
    const entry = timesheet.find(c.req.param("id"));
    if (!entry) return c.notFound();
    const week = weekParam(c.req.query("week"));
    return c.html(<EditEntryPage id={entry.id} week={week} entry={entry} />);
  });

  app.post("/entries/:id", async (c) => {
    const id = c.req.param("id");
    const entry = timesheet.find(id);
    if (!entry) return c.notFound();
    const input = await readEntryInput(c);
    const result = timesheet.update(id, input);
    if (result.ok) {
      // Replace the entry on the Dignitas Hour Server with its full current state.
      const status = await reconcileDignitas(fetcher, {
        wanted: true,
        registrationId: result.entry.dignitas?.registrationId,
        payload: toDignitasPayload(result.entry),
      });
      timesheet.setDignitasSync(result.entry.id, status);
      // Return to the Timesheet week of the (possibly changed) date.
      return c.redirect(`/?week=${isoWeek(result.entry.date)}`, 303);
    }
    if ("notFound" in result) return c.notFound();
    const week = weekParam(c.req.query("week"));
    return c.html(<EditEntryPage id={id} week={week} entry={entry} form={{ values: input, message: result.message }} />, 422);
  });

  app.post("/entries/:id/delete", async (c) => {
    const id = c.req.param("id");
    const entry = timesheet.find(id);
    if (!entry) return c.notFound();
    // Delete the entry from the Dignitas Hour Server before dropping it locally.
    await reconcileDignitas(fetcher, { wanted: false, registrationId: entry.dignitas?.registrationId });
    timesheet.remove(id);
    const week = weekParam(c.req.query("week"));
    return c.redirect(`/?week=${week}`, 303);
  });

  app.route("/fake/dignitas", createDignitasServer());

  // Fake Client Hour Server (Acme): its own in-memory store, API sub-app and page.
  const acme = new AcmeStore();
  app.route("/fake/acme", createAcmeServer(acme));

  app.get("/dignitas", async (c) => {
    const week = weekParam(c.req.query("week"));
    const res = await app.request(`/fake/dignitas/_inspect?week=${week}`);
    const { online, records } = (await res.json()) as { online: boolean; records: DignitasRecord[] };
    // Dignitas receives every Time Entry, compared in hours.
    const comparison = perDayComparison(
      week,
      records.map((r) => ({ date: r.date, amount: r.hours })),
      timesheet.forWeek(week).map((e) => ({ date: e.date, amount: e.hours })),
    );
    return c.html(<DignitasHourServerPage week={week} online={online} records={records} comparison={comparison} />);
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
    const week = weekParam(c.req.query("week"));
    const days = weekDays(week);
    const records = acme.listByDateRange(days[0]!, days[6]!);
    // Acme receives only Acme Projects' Time Entries, compared in minutes.
    const acmeEntries = timesheet
      .forWeek(week)
      .filter((e) => findProject(e.projectId)?.clientId === ACME_CLIENT_ID);
    const comparison = perDayComparison(
      week,
      records.map((r) => ({ date: r.workDate, amount: r.minutes })),
      acmeEntries.map((e) => ({ date: e.date, amount: Math.round(e.hours * 60) })),
    );
    return c.html(<AcmeHourServerPage week={week} online={acme.online} records={records} comparison={comparison} />);
  });

  return app;
}
