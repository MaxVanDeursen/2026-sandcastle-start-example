import { Hono } from "hono";
import { ClientHourServerPage, DignitasHourServerPage, TimesheetPage } from "./pages/pages";

/** Builds the whole app. Tests call routes in-process with `app.request()`. */
export function createApp() {
  const app = new Hono();

  app.get("/", (c) => c.html(<TimesheetPage />));
  app.get("/dignitas", (c) => c.html(<DignitasHourServerPage />));
  app.get("/acme", (c) => c.html(<ClientHourServerPage />));

  return app;
}
