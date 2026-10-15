import type { Child } from "hono/jsx";

export type NavKey = "timesheet" | "dignitas" | "acme";

const navItems: { key: NavKey; href: string; label: string }[] = [
  { key: "timesheet", href: "/", label: "Timesheet" },
  { key: "dignitas", href: "/dignitas", label: "Dignitas Hour Server" },
  { key: "acme", href: "/acme", label: "Client Hour Server (Acme)" },
];

const css = `
  body { font: 14px system-ui, sans-serif; margin: 0; color: #222; }
  nav { background: #1f3a5f; padding: .6rem 1rem; }
  nav a { color: #fff; margin-right: 1.2rem; text-decoration: none; }
  nav a[aria-current="page"] { font-weight: bold; text-decoration: underline; }
  main { padding: 1rem 2rem; }
  h1 { font-size: 1.3rem; }
  table { border-collapse: collapse; width: 100%; max-width: 900px; }
  td, th { border-bottom: 1px solid #ddd; padding: .3rem .5rem; text-align: left; }
  nav.weeknav { background: none; padding: 0; display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
  nav.weeknav a { color: #1f3a5f; }
  form { display: flex; flex-wrap: wrap; gap: .8rem; align-items: end; max-width: 900px; margin-bottom: 1.5rem; }
  form label { display: flex; flex-direction: column; gap: .2rem; font-size: .85rem; }
  .error { color: #a00; font-weight: bold; flex-basis: 100%; margin: 0; }
  .day h2 { font-size: 1rem; margin: 1rem 0 .3rem; }
  .empty { color: #888; margin: .2rem 0; }
  .weektotal { margin-top: 1.5rem; }
  .rowactions { display: flex; gap: .6rem; align-items: center; }
  .rowactions form { display: inline; margin: 0; }
  .rowactions button { background: none; border: none; color: #a00; cursor: pointer; padding: 0; font: inherit; }
  table.comparison { margin-bottom: 1.5rem; }
  table.comparison tr.diff { background: #fff3cd; }
  table.comparison tr.diff td { font-weight: bold; }
`;

/** Page shell shared by every page: title, stylesheet and the top nav. */
export function Layout(props: { title: string; active: NavKey; children?: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>{`${props.title} · Urenbrug`}</title>
        <style>{css}</style>
      </head>
      <body>
        <nav>
          {navItems.map((item) => (
            <a href={item.href} aria-current={item.key === props.active ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <main>
          <h1>{props.title}</h1>
          {props.children}
        </main>
      </body>
    </html>
  );
}
