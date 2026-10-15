import { Layout } from "./layout";

// Empty pages; the tickets fill them in.

export function TimesheetPage() {
  return <Layout title="Timesheet" active="timesheet" />;
}

export function DignitasHourServerPage() {
  return <Layout title="Dignitas Hour Server" active="dignitas" />;
}

// The Client Hour Server Page lives in src/fake/acme/page.tsx (ticket 03).
