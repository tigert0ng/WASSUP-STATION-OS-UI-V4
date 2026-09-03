export interface LogAuditParams {
  actorId: string;
  module: string;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  module: string;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  at: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    const entry: AuditEntry = {
      id: "audit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      actor_id: params.actorId,
      module: params.module,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
      at: new Date().toISOString(),
    };

    const stored = localStorage.getItem("wassup_local_audit_logs");
    let list: AuditEntry[] = [];
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch (e) {}
    }
    list.unshift(entry);
    if (list.length > 500) list = list.slice(0, 500);
    localStorage.setItem("wassup_local_audit_logs", JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("wassup_audit_logged", { detail: entry }));
  } catch (err) {
    console.warn("Audit log local save note:", err);
  }
}
