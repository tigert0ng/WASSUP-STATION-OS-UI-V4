import React, { useEffect, useState } from "react";
import { Bot, Send, Printer, HardDrive, CreditCard, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";

// S0.7 — Tích hợp thiết bị (US-0.5, FR-0.4).
type IntegrationType = "telegram" | "payment_gateway" | "printer" | "backup_storage";

interface IntegrationRow {
  id: string;
  type: IntegrationType;
  config_jsonb: Record<string, string>;
  status: "connected" | "disconnected";
  last_checked_at: string | null;
}

const LABELS: Record<IntegrationType, { title: string; icon: typeof Bot; fields: Array<{ key: string; label: string }> }> = {
  telegram: {
    title: "Telegram Bot",
    icon: Send,
    fields: [
      { key: "bot_token", label: "Bot Token" },
      { key: "webhook_url", label: "Webhook URL" },
    ],
  },
  payment_gateway: {
    title: "Cổng thanh toán Payment Kiosk",
    icon: CreditCard,
    fields: [
      { key: "provider", label: "Nhà cung cấp" },
      { key: "merchant_id", label: "Merchant ID / API Key" },
    ],
  },
  printer: {
    title: "Máy in hóa đơn POS",
    icon: Printer,
    fields: [{ key: "connection_type", label: "Loại kết nối (USB/Bluetooth)" }],
  },
  backup_storage: {
    title: "Backup storage",
    icon: HardDrive,
    fields: [{ key: "destination", label: "Đích lưu trữ (Google Drive/S3...)" }],
  },
};

export default function Integrations() {
  const { can, staff } = useAuth();
  const canEdit = can("settings", "update");
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("integration_settings")
      .select("id, type, config_jsonb, status, last_checked_at")
      .order("type");
    setRows((data as IntegrationRow[]) ?? []);
    setLoading(false);
  }

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 4000);
  };

  async function save(row: IntegrationRow) {
    if (!supabase || !staff) return;
    const { error } = await supabase
      .from("integration_settings")
      .update({ config_jsonb: row.config_jsonb, updated_by: staff.id })
      .eq("id", row.id);
    if (error) {
      showToast(`Lỗi: ${error.message}`);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "settings",
      action: "update_integration",
      entity: "integration_settings",
      entityId: row.id,
      after: { type: row.type, config_jsonb: row.config_jsonb },
    });
    showToast(`Đã lưu ${LABELS[row.type].title}.`);
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}
      {rows.map((row) => {
        const Icon = LABELS[row.type].icon;
        return (
          <div key={row.id} className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                <Icon className="h-5 w-5 text-forest-green" />
                {LABELS[row.type].title}
              </h3>
              <span className={`text-[10px] font-mono font-bold border px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                row.status === "connected" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-gray-100 text-mid-gray border-gray-200"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${row.status === "connected" ? "bg-emerald-500" : "bg-gray-400"}`} />
                {row.status === "connected" ? "Đã kết nối" : "Chưa kết nối"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {LABELS[row.type].fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="font-bold text-mid-gray">{f.label}</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={row.config_jsonb[f.key] ?? ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, config_jsonb: { ...r.config_jsonb, [f.key]: e.target.value } } : r))
                      )
                    }
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-slate-700 disabled:bg-gray-50"
                  />
                </div>
              ))}
            </div>
            {canEdit && (
              <button onClick={() => void save(row)} className="px-4 py-2 bg-matte-black hover:bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg transition cursor-pointer">
                Lưu
              </button>
            )}
          </div>
        );
      })}
      <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-[11px] text-blue-900 font-sans">
        <Bot className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <p>Health-check tự động (cập nhật <code className="font-mono">status</code>/<code className="font-mono">last_checked_at</code> định kỳ) là Edge Function riêng, chưa build ở giai đoạn Module 0 — trạng thái ở trên hiện cập nhật thủ công qua nút "Lưu".</p>
      </div>
    </div>
  );
}
