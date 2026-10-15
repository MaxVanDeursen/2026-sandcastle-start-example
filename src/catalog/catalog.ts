// The fixed list of Clients and Projects (see CONTEXT.md). No CRUD: edit here.

export type Client = { id: string; name: string };

export type Project = {
  id: string;
  clientId: string;
  name: string;
  /** Code on the Dignitas Hour Server. */
  projectCode: string;
  /** Work order on the Client Hour Server; only Acme Logistics Projects have one. */
  workOrder?: string;
};

export const ACME_CLIENT_ID = "acme";

export const clients: readonly Client[] = [
  { id: ACME_CLIENT_ID, name: "Acme Logistics" },
  { id: "dignitas", name: "Dignitas" },
];

export const projects: readonly Project[] = [
  { id: "acme-wp", clientId: ACME_CLIENT_ID, name: "Warehouse Portal", projectCode: "ACME-WP", workOrder: "WO-1042" },
  { id: "acme-sup", clientId: ACME_CLIENT_ID, name: "Support", projectCode: "ACME-SUP", workOrder: "WO-1077" },
  { id: "dig-trn", clientId: "dignitas", name: "Training", projectCode: "DIG-TRN" },
  { id: "dig-int", clientId: "dignitas", name: "Internal", projectCode: "DIG-INT" },
];

export function findProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function findClient(id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}

/** "Client · Project", as shown in the Project select. */
export function projectLabel(project: Project): string {
  return `${findClient(project.clientId)?.name ?? project.clientId} · ${project.name}`;
}
