// Per-day comparison for the Hour Server Pages: the server's own per-day total
// next to the Timesheet's, in the server's unit. Rows where the two differ are
// highlighted, so the Consultant can check the Timesheet is reflected.
import { weekDays } from "../week/week";

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** One calendar day of the shown week: both totals and whether they differ. */
export type ComparisonRow = {
  day: string;
  label: string;
  server: number;
  timesheet: number;
  differs: boolean;
};

/** A dated amount in the server's unit (Dignitas hours, Acme minutes). */
export type DatedAmount = { date: string; amount: number };

function sumByDay(items: readonly DatedAmount[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const { date, amount } of items) totals.set(date, (totals.get(date) ?? 0) + amount);
  return totals;
}

/** One row per day of `week`, pairing the server and Timesheet totals. */
export function perDayComparison(
  week: string,
  serverAmounts: readonly DatedAmount[],
  timesheetAmounts: readonly DatedAmount[],
): ComparisonRow[] {
  const server = sumByDay(serverAmounts);
  const timesheet = sumByDay(timesheetAmounts);
  return weekDays(week).map((day, i) => {
    const s = server.get(day) ?? 0;
    const t = timesheet.get(day) ?? 0;
    return { day, label: WEEKDAY_NAMES[i]!, server: s, timesheet: t, differs: s !== t };
  });
}

/** Renders the comparison as a table; differing rows get `class="diff"`. */
export function DayComparison(props: {
  rows: readonly ComparisonRow[];
  unit: string;
  format?: (amount: number) => string;
}) {
  const format = props.format ?? String;
  return (
    <table class="comparison">
      <thead>
        <tr>
          <th>Day</th>
          <th>Server ({props.unit})</th>
          <th>Timesheet ({props.unit})</th>
        </tr>
      </thead>
      <tbody>
        {props.rows.map((r) => (
          <tr class={r.differs ? "diff" : undefined}>
            <td>
              {r.label} {r.day}
            </td>
            <td>{format(r.server)}</td>
            <td>{format(r.timesheet)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
