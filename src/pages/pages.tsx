import type { DignitasRecord } from "../fake/dignitas";
import { projectLabel, projects } from "../catalog/catalog";
import type { EntryInput, TimeEntry } from "../timesheet/timesheet";
import { shiftWeek, weekDays } from "../week/week";
import { DayComparison, type ComparisonRow } from "../comparison/comparison";
import { Layout } from "./layout";

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Trim trailing zeros so 1.5 → "1.5", 8 → "8", 0.25 → "0.25". */
function formatHours(hours: number): string {
  return String(Number(hours.toFixed(2)));
}

function projectName(projectId: string): string {
  const project = projects.find((p) => p.id === projectId);
  return project ? projectLabel(project) : projectId;
}

/** The Timesheet: an add form above the week's Time Entries, listed per day. */
export function TimesheetPage(props: {
  week: string;
  entries: readonly TimeEntry[];
  form?: { values: EntryInput; message: string };
}) {
  const { week, entries, form } = props;
  const values = form?.values;
  const weekTotal = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <Layout title="Timesheet" active="timesheet">
      <nav class="weeknav">
        <a href={`/?week=${shiftWeek(week, -1)}`}>← Previous week</a>
        <strong>{week}</strong>
        <a href={`/?week=${shiftWeek(week, 1)}`}>Next week →</a>
      </nav>

      <form method="post" action={`/?week=${week}`}>
        {form ? <p class="error">{form.message}</p> : null}
        <label>
          Date <input type="date" name="date" value={values?.date ?? ""} required />
        </label>
        <label>
          Project{" "}
          <select name="projectId" required>
            <option value="" disabled selected={!values?.projectId}>
              Client · Project
            </option>
            {projects.map((p) => (
              <option value={p.id} selected={values?.projectId === p.id}>
                {projectLabel(p)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hours{" "}
          <input type="number" name="hours" step="0.25" min="0.25" max="24" value={values?.hours ?? ""} required />
        </label>
        <label>
          Description{" "}
          <input type="text" name="description" maxlength={200} value={values?.description ?? ""} required />
        </label>
        <button type="submit">Add Time Entry</button>
      </form>

      <section class="entries">
        {weekDays(week).map((day, i) => {
          const dayEntries = entries.filter((e) => e.date === day);
          const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);
          return (
            <div class="day">
              <h2>
                {WEEKDAY_NAMES[i]} {day} — {formatHours(dayTotal)}h
              </h2>
              {dayEntries.length === 0 ? (
                <p class="empty">No Time Entries.</p>
              ) : (
                <table>
                  <tbody>
                    {dayEntries.map((e) => (
                      <tr>
                        <td>{projectName(e.projectId)}</td>
                        <td>{formatHours(e.hours)}h</td>
                        <td>{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </section>

      <p class="weektotal">
        <strong>Week total: {formatHours(weekTotal)}h</strong>
      </p>
    </Layout>
  );
}

export function DignitasHourServerPage(props: {
  week: string;
  online: boolean;
  records: DignitasRecord[];
  comparison: ComparisonRow[];
}) {
  const { week, online, records, comparison } = props;
  return (
    <Layout title="Dignitas Hour Server" active="dignitas">
      <p>
        <a href={`/dignitas?week=${shiftWeek(week, -1)}`}>← previous</a>{" "}
        <strong>{week}</strong>{" "}
        <a href={`/dignitas?week=${shiftWeek(week, 1)}`}>next →</a>
      </p>

      <h2>Per-day comparison</h2>
      <DayComparison rows={comparison} unit="h" format={formatHours} />

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

// The Client Hour Server Page lives in src/fake/acme/page.tsx (ticket 03).
