import type { DignitasRecord } from "../fake/dignitas";
import { shiftWeek } from "../week/week";
import { Layout } from "./layout";

// Empty pages; the tickets fill them in.

export function TimesheetPage() {
  return <Layout title="Timesheet" active="timesheet" />;
}

export function DignitasHourServerPage(props: { week: string; online: boolean; records: DignitasRecord[] }) {
  const { week, online, records } = props;
  return (
    <Layout title="Dignitas Hour Server" active="dignitas">
      <p>
        <a href={`/dignitas?week=${shiftWeek(week, -1)}`}>← previous</a>{" "}
        <strong>{week}</strong>{" "}
        <a href={`/dignitas?week=${shiftWeek(week, 1)}`}>next →</a>
      </p>

      <form method="post" action="/dignitas/toggle">
        <input type="hidden" name="week" value={week} />
        <input type="hidden" name="online" value={online ? "false" : "true"} />
        <p>
          Status: <strong>{online ? "Online" : "Offline"}</strong>{" "}
          <button type="submit">Switch {online ? "Offline" : "Online"}</button>
        </p>
      </form>

      {records.length === 0 ? (
        <p>No records for {week}.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>registrationId</th>
              <th>date</th>
              <th>projectCode</th>
              <th>hours</th>
              <th>remark</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr>
                <td>{r.registrationId}</td>
                <td>{r.date}</td>
                <td>{r.projectCode}</td>
                <td>{r.hours}</td>
                <td>{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

export function ClientHourServerPage() {
  return <Layout title="Client Hour Server (Acme Logistics)" active="acme" />;
}
