import { describe, expect, it } from "vitest";
import { ACME_CLIENT_ID, clients, findProject, projectLabel, projects } from "./catalog";

describe("catalog", () => {
  it("has 4 Projects over 2 Clients", () => {
    expect(clients).toHaveLength(2);
    expect(projects).toHaveLength(4);
    for (const p of projects) expect(clients.map((c) => c.id)).toContain(p.clientId);
  });

  it("maps every Project to a Dignitas projectCode", () => {
    expect(projects.map((p) => p.projectCode)).toEqual(["ACME-WP", "ACME-SUP", "DIG-TRN", "DIG-INT"]);
  });

  it("gives only Acme Logistics Projects a work order", () => {
    const withWorkOrder = projects.filter((p) => p.workOrder);
    expect(withWorkOrder.map((p) => p.workOrder)).toEqual(["WO-1042", "WO-1077"]);
    expect(withWorkOrder.every((p) => p.clientId === ACME_CLIENT_ID)).toBe(true);
  });

  it("finds Projects and labels them with their Client", () => {
    const project = findProject("acme-wp");
    expect(project && projectLabel(project)).toBe("Acme Logistics · Warehouse Portal");
    expect(findProject("nope")).toBeUndefined();
  });
});
