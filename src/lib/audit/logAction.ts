import { supabase } from "../supabase/client";

export interface LogAuditParams {
  actorId: string;
  module: string;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

export async function logAudit(params: LogAuditParams) {
  if (!supabase) return;
  try {
    await supabase.from("audit_log").insert({
      actor_id: params.actorId,
      module: params.module,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log audit action:", err);
  }
}
