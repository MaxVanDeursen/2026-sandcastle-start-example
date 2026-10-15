// The Client Hour Server Page (/acme?week=…): Acme's own records for one week,
// week navigation and an Online/Offline toggle. Reads the store via inspect.
import { Layout } from "../../pages/layout";
import { shiftWeek, weekDays } from "../../week/week";
import { DayComparison, type ComparisonRow } from "../../comparison/comparison";
import type { AcmeRecord } from "./store";

export function AcmeHourServerPage(props: {
  week: string;
  online: boolean;
  records: AcmeRecord[];
  comparison: ComparisonRow[];
}) {
  const { week, online, records, comparison } = props;
  const days = weekDays(week);
  const range = `${days[0]} – ${days[6]}`;
  const prev = shiftWeek(week, -1);
  const next = shiftWeek(week, 1);

  return (
    <Layout title="Client Hour Server (Acme Logistics)" active="acme">
      <form method="post" action="/fake/acme/control">
        <input type="hidden" name="online" value={online ? "false" : "true"} />
        <input type="hidden" name="return" value={`/acme?week=${week}`} />
        <p>
          Status: <strong>{online ? "Online" : "Offline"}</strong>{" "}
          <button type="submit">Switch {online ? "Offline" : "Online"}</button>
        </p>
      </form>

      <p>
        <a href={`/acme?week=${prev}`}>← Previous</a>{" "}
        <strong>
          {week} ({range})
        </strong>{" "}
        <a href={`/acme?week=${next}`}>Next →</a>
      </p>

      <h2>Per-day comparison</h2>
      <DayComparison rows={comparison} unit="min" />

      {records.length === 0 ? (
        <p>No records this week.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>entryNo</th>
              <th>workDate</th>
              <th>workOrder</th>
              <th>minutes</th>
              <th>summary</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr>
                <td>{r.entryNo}</td>
                <td>{r.workDate}</td>
                <td>{r.workOrder}</td>
                <td>{r.minutes}</td>
                <td>{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
