import React, { useEffect, useState } from "react";
import { Sliders, DollarSign, Sparkles, Shield, Boxes, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import GeneralInfo from "./GeneralInfo";

interface ThresholdRow {
  id: string;
  red_max: number;
  yellow_max: number;
}

interface SurchargeRow {
  id: string;
  percent: number;
}

interface ConfigOverviewProps {
  currentStationId?: string;
  onSelectStation?: (id: string) => void;
}

export default function ConfigOverview({ currentStationId, onSelectStation }: ConfigOverviewProps = {}) {
  const { can, staff } = useAuth();
  const canEdit = can("settings", "update");

  const [threshold, setThreshold] = useState<ThresholdRow | null>(null);
  const [surcharge, setSurcharge] = useState<SurchargeRow | null>(null);
  const [expenseLimitCount, setExpenseLimitCount] = useState(0);
  const [inventoryItemCount, setInventoryItemCount] = useState(0);
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
    const [{ data: th }, { data: sc }, expCount, invCount] = await Promise.all([
      supabase.from("revenue_thresholds").select("id, red_max, yellow_max").eq("period", "day").limit(1).maybeSingle(),
      supabase.from("vehicle_surcharge_config").select("id, percent").limit(1).maybeSingle(),
      supabase.from("expense_approval_limits").select("id", { count: "exact", head: true }),
      supabase.from("inventory_items").select("id", { count: "exact", head: true }),
    ]);
    setThreshold(th as ThresholdRow | null);
    setSurcharge(sc as SurchargeRow | null);
    setExpenseLimitCount(expCount.count ?? 0);
    setInventoryItemCount(invCount.count ?? 0);
    setLoading(false);
  }

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 4000);
  };

  async function saveThreshold() {
    if (!threshold || !supabase || !staff) return;
    const { error } = await supabase
      .from("revenue_thresholds")
      .update({ red_max: threshold.red_max, yellow_max: threshold.yellow_max, updated_by: staff.id })
      .eq("id", threshold.id);
    if (error) {
      showToast(`Lỗi: ${error.message}`);
      return;
    }
    await logAudit({ actorId: staff.id, module: "settings", action: "update_revenue_thresholds", entity: "revenue_thresholds", entityId: threshold.id, after: threshold });
    showToast("Đã lưu ngưỡng doanh thu.");
  }

  async function saveSurcharge() {
    if (!surcharge || !supabase || !staff) return;
    const { error } = await supabase
      .from("vehicle_surcharge_config")
      .update({ percent: surcharge.percent, updated_by: staff.id })
      .eq("id", surcharge.id);
    if (error) {
      showToast(`Lỗi: ${error.message}`);
      return;
    }
    await logAudit({ actorId: staff.id, module: "settings", action: "update_vehicle_surcharge", entity: "vehicle_surcharge_config", entityId: surcharge.id, after: surcharge });
    showToast("Đã lưu % phụ thu.");
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* SECTION 1: Cấu hình Thông tin chung Trạm Vận Hành (Gom từ Thông tin chung) */}
      <GeneralInfo currentStationId={currentStationId} onSelectStation={onSelectStation} />

      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
          <DollarSign className="h-5 w-5 text-forest-green" />
          Ngưỡng báo đỏ/vàng/xanh doanh thu
        </h3>
        <p className="text-[11px] text-mid-gray font-sans -mt-2">Gốc tại Module 1 — Dashboard Tổng Quan (chưa build).</p>
        {threshold ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-mid-gray uppercase">Ngưỡng đỏ tối đa (đồng/ngày)</label>
              <input type="number" disabled={!canEdit} value={threshold.red_max}
                onChange={(e) => setThreshold({ ...threshold, red_max: Number(e.target.value) })}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono font-bold text-red-600 disabled:bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="font-extrabold text-mid-gray uppercase">Ngưỡng vàng tối đa (đồng/ngày)</label>
              <input type="number" disabled={!canEdit} value={threshold.yellow_max}
                onChange={(e) => setThreshold({ ...threshold, yellow_max: Number(e.target.value) })}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono font-bold text-amber-600 disabled:bg-gray-50" />
            </div>
          </div>
        ) : (
          <p className="text-xs text-mid-gray font-sans">Chưa có dữ liệu — chạy migration seed.</p>
        )}
        {canEdit && threshold && (
          <button onClick={saveThreshold} className="px-4 py-2 bg-matte-black hover:bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg transition cursor-pointer">Lưu</button>
        )}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
          <Sparkles className="h-5 w-5 text-amber-500" />
          % phụ thu hạng xe 7-9 chỗ / bán tải
        </h3>
        <p className="text-[11px] text-mid-gray font-sans -mt-2">Gốc tại Module 5 — Gói Dịch Vụ & Giá (chưa build).</p>
        {surcharge ? (
          <div className="max-w-xs space-y-1.5 text-xs">
            <label className="font-extrabold text-mid-gray uppercase">% phụ thu</label>
            <input type="number" disabled={!canEdit} value={surcharge.percent}
              onChange={(e) => setSurcharge({ ...surcharge, percent: Number(e.target.value) })}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono font-bold disabled:bg-gray-50" />
          </div>
        ) : (
          <p className="text-xs text-mid-gray font-sans">Chưa có dữ liệu — chạy migration seed.</p>
        )}
        {canEdit && surcharge && (
          <button onClick={saveSurcharge} className="px-4 py-2 bg-matte-black hover:bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg transition cursor-pointer">Lưu</button>
        )}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-2">
        <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
          <Shield className="h-5 w-5 text-purple-600" />
          Hạn mức duyệt chi theo vai trò
        </h3>
        <p className="text-xs text-mid-gray font-sans">
          {expenseLimitCount} vai trò đã cấu hình hạn mức. Sửa chi tiết từng vai trò sẽ mở ở Module 3 — POS Thu Ngân khi build (Sprint 2).
        </p>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-2">
        <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
          <Boxes className="h-5 w-5 text-forest-green" />
          Ngưỡng cảnh báo tồn kho
        </h3>
        <p className="text-xs text-mid-gray font-sans">
          {inventoryItemCount} vật tư đã khai báo. Cấu hình ngưỡng từng vật tư sẽ mở ở Module 6 — Kho Vật Tư khi build (Sprint 4).
        </p>
      </div>
    </div>
  );
}
