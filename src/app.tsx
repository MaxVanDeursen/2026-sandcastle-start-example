import { Hono } from "hono";
import { ClientHourServerPage, DignitasHourServerPage, TimesheetPage } from "./pages/pages";
import { Timesheet, type EntryInput } from "./timesheet/timesheet";
import { currentWeek, isIsoWeek, isoWeek } from "./week/week";

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

  app.get("/dignitas", (c) => c.html(<DignitasHourServerPage />));
  app.get("/acme", (c) => c.html(<ClientHourServerPage />));

  return app;
}
