import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("pages", () => {
  const app = createApp();

  it.each([
    ["/", "Timesheet"],
    ["/dignitas", "Dignitas Hour Server"],
    ["/acme", "Client Hour Server (Acme Logistics)"],
  ])("%s renders its heading and the nav", async (path, heading) => {
    const res = await app.request(path);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<h1>${heading}</h1>`);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/dignitas"');
    expect(html).toContain('href="/acme"');
  });

  it("marks the current page in the nav", async () => {
    const html = await (await app.request("/acme")).text();
    expect(html).toMatch(/<a href="\/acme" aria-current="page">/);
  });

  it("answers 404 for unknown routes", async () => {
    expect((await app.request("/nope")).status).toBe(404);
  });
});
