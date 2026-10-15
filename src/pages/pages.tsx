import { Layout } from "./layout";

// Empty pages; the tickets fill them in.

export function TimesheetPage() {
  return <Layout title="Timesheet" active="timesheet" />;
}

export function DignitasHourServerPage() {
  return <Layout title="Dignitas Hour Server" active="dignitas" />;
}

export function ClientHourServerPage() {
  return <Layout title="Client Hour Server (Acme Logistics)" active="acme" />;
}
