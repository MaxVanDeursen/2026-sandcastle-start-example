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
