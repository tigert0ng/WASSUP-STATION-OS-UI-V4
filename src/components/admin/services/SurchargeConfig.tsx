import React, { useEffect, useState } from "react";
import { Percent, CheckCircle2, Info } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import { VehicleSurchargeConfigRow } from "../../../types/catalog.types";

// S5.4 — Cấu hình phụ thu hạng xe. 1 trường duy nhất: % phụ thu xe 7-9
// chỗ/bán tải, áp dụng nhân lên giá gốc mọi dịch vụ active trừ
// exempt_surcharge=true (FR-5.3). Chỉ Master Admin sửa được.
export default function SurchargeConfig() {
  const { can, staff } = useAuth();
  const canEdit = can("catalog", "update");

  const [config, setConfig] = useState<VehicleSurchargeConfigRow | null>(null);
  const [percentInput, setPercentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const { data } = await supabase.from("vehicle_surcharge_config").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    setConfig(data as VehicleSurchargeConfigRow | null);
    setPercentInput(data ? String(data.percent) : "30");
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!config || !supabase || !staff) return;
    setSaving(true);
    const before = config;
    const { error } = await supabase
      .from("vehicle_surcharge_config")
      .update({ percent: Number(percentInput), updated_by: staff.id })
      .eq("id", config.id);
    setSaving(false);
    if (error) {
      setToast(`Lỗi: ${error.message}`);
      setTimeout(() => setToast(null), 4000);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "update_vehicle_surcharge_config",
      entity: "vehicle_surcharge_config",
      entityId: config.id,
      before,
      after: { percent: Number(percentInput) },
    });
    setToast("Đã cập nhật mức phụ thu hạng xe.");
    setTimeout(() => setToast(null), 4000);
    await load();
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  if (!config) {
    return (
      <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 text-amber-900 text-sm font-sans">
        Chưa có cấu hình phụ thu — chạy lại migration Module 0 (0003_rls_and_seed.sql) để seed dòng mặc định.
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-6 max-w-xl">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 text-brand-green" />
          <span>{toast}</span>
        </div>
      )}

      <div className="border-b border-[#e5e5e5] pb-3">
        <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <Percent className="h-5 w-5 text-forest-green" />
          PHỤ THU HẠNG XE 7-9 CHỖ / BÁN TẢI
        </h3>
        <p className="text-[11px] text-mid-gray font-sans mt-0.5">
          Áp dụng nhân lên giá gốc mọi dịch vụ đang Hoạt động, trừ dịch vụ đánh dấu "Miễn phụ thu" (gói Fleet).
        </p>
      </div>

      <div className="space-y-1.5 text-xs">
        <label className="font-extrabold text-mid-gray uppercase">Mức phụ thu (%)</label>
        <div className="relative max-w-[200px]">
          <input
            type="number"
            required
            min="0"
            max="100"
            step="0.5"
            disabled={!canEdit}
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl px-4 py-2.5 pr-9 font-mono font-black text-lg text-forest-green focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
          />
          <Percent className="absolute right-3.5 top-3.5 text-mid-gray h-4 w-4" />
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 p-3.5 rounded-xl">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-900 leading-snug font-sans">
          Ví dụ: giá gốc 149.000đ, phụ thu {percentInput || 0}% ⇒ +{Math.round((149000 * Number(percentInput || 0)) / 100).toLocaleString("vi-VN")}đ ={" "}
          {(149000 + Math.round((149000 * Number(percentInput || 0)) / 100)).toLocaleString("vi-VN")}đ. Đổi mức phụ thu có hiệu lực ngay cho đơn mới, không hồi tố đơn đã tạo.
        </p>
      </div>

      {canEdit && (
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold text-xs uppercase tracking-wide transition shadow-sm cursor-pointer disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu mức phụ thu"}
          </button>
        </div>
      )}
    </form>
  );
}
