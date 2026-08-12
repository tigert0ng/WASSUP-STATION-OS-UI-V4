import React, { useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { MODULES } from "../../../lib/rbac/modules";

// S0.8 — Audit Log Viewer (US-0.6, FR-0.5). Read-only, không có hành động ghi.
interface AuditRow {
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

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    void load();
  }, [moduleFilter, entityFilter]);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("audit_log")
      .select("id, actor_id, module, action, entity, entity_id, before, after, at")
      .order("at", { ascending: false })
      .limit(200);
    if (moduleFilter) query = query.eq("module", moduleFilter);
    if (entityFilter) query = query.ilike("entity", `%${entityFilter}%`);
    const { data } = await query;
    const list = (data as AuditRow[]) ?? [];
    setRows(list);

    const actorIds = Array.from(new Set(list.map((r) => r.actor_id).filter((id): id is string => !!id)));
    if (actorIds.length > 0) {
      const { data: staffRows } = await supabase.from("staff").select("id, name").in("id", actorIds);
      const map: Record<string, string> = {};
      for (const s of staffRows ?? []) map[s.id] = s.name;
      setActorNames(map);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
        <History className="h-4.5 w-4.5 text-purple-600" />
        NHẬT KÝ HOẠT ĐỘNG (AUDIT LOG)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-forest-green"
        >
          <option value="">Tất cả module</option>
          {MODULES.map((m) => (
            <option key={m.code} value={m.code}>{m.order}. {m.name}</option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mid-gray" />
          <input
            type="text"
            placeholder="Tìm theo tên bảng/đối tượng (vd: staff, roles...)"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-9 pr-3 py-2 text-xs font-sans focus:outline-none focus:border-forest-green"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-mid-gray font-sans text-sm">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Lúc</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Ai</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Hành động</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Đối tượng</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Trước/Sau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-mid-gray font-sans text-xs">Chưa có nhật ký nào khớp bộ lọc.</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.id || 'row'}-${idx}`} className="hover:bg-warm-white/30 transition align-top">
                    <td className="p-3 font-mono text-[10px] text-mid-gray whitespace-nowrap">{new Date(r.at).toLocaleString("vi-VN")}</td>
                    <td className="p-3 font-bold text-matte-black">{r.actor_id ? actorNames[r.actor_id] ?? r.actor_id : "—"}</td>
                    <td className="p-3">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-black text-[9px] uppercase">{r.action}</span>
                    </td>
                    <td className="p-3 font-mono text-mid-gray">{r.entity}{r.entity_id ? ` #${r.entity_id.slice(0, 8)}` : ""}</td>
                    <td className="p-3 font-mono text-[10px] text-mid-gray max-w-xs truncate" title={JSON.stringify({ before: r.before, after: r.after })}>
                      {r.before ? `${JSON.stringify(r.before).slice(0, 40)}… → ` : ""}{r.after ? JSON.stringify(r.after).slice(0, 40) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
