import { Hono } from "hono";
import { DignitasHourServerPage, TimesheetPage } from "./pages/pages";
import { AcmeStore } from "./fake/acme/store";
import { createAcmeServer } from "./fake/acme/server";
import { AcmeHourServerPage } from "./fake/acme/page";
import { currentWeek, isIsoWeek, weekDays } from "./week/week";

/** Builds the whole app. Tests call routes in-process with `app.request()`. */
export function createApp() {
  const app = new Hono();

  // Fake Client Hour Server (Acme): its own in-memory store, API sub-app and page.
  const acme = new AcmeStore();
  app.route("/fake/acme", createAcmeServer(acme));

  app.get("/", (c) => c.html(<TimesheetPage />));
  app.get("/dignitas", (c) => c.html(<DignitasHourServerPage />));

  app.get("/acme", (c) => {
    const requested = c.req.query("week");
    const week = requested && isIsoWeek(requested) ? requested : currentWeek();
    const days = weekDays(week);
    const records = acme.listByDateRange(days[0]!, days[6]!);
    return c.html(<AcmeHourServerPage week={week} online={acme.online} records={records} />);
  });

  return app;
}
