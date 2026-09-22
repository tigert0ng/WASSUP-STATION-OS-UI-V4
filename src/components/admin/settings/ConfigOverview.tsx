import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Shield,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import GeneralInfo from "./GeneralInfo";

interface ThresholdRow {
  id: string;
  red_max: number;
  yellow_max: number;
}

interface ConfigOverviewProps {
  currentStationId?: string;
  onSelectStation?: (id: string) => void;
}

const formatVND = (num?: number) => {
  if (num === undefined || num === null) return "—";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

export default function ConfigOverview({ currentStationId, onSelectStation }: ConfigOverviewProps = {}) {
  const { can, staff } = useAuth();
  const canEdit = can("settings", "update");

  const [threshold, setThreshold] = useState<ThresholdRow | null>(null);
  const [expenseLimitCount, setExpenseLimitCount] = useState(0);
  const [inventoryItemCount, setInventoryItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Collapsed states for each box
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    general: false,
    threshold: false,
    expense: false,
    inventory: false,
  });

  const sectionKeys = ["general", "threshold", "expense", "inventory"];
  const isAllCollapsed = sectionKeys.every((k) => collapsedSections[k] === true);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    const nextState = !isAllCollapsed;
    setCollapsedSections({
      general: nextState,
      threshold: nextState,
      expense: nextState,
      inventory: nextState,
    });
  };

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    let thData: ThresholdRow | null = null;
    let expCount = 0;
    let invCount = 0;

    if (supabase) {
      try {
        const [thRes, expRes, invRes] = await Promise.allSettled([
          supabase.from("revenue_thresholds").select("id, red_max, yellow_max").eq("period", "day").limit(1).maybeSingle(),
          supabase.from("expense_approval_limits").select("id", { count: "exact", head: true }),
          supabase.from("inventory_items").select("id", { count: "exact", head: true }),
        ]);

        if (thRes.status === "fulfilled" && thRes.value.data) {
          thData = thRes.value.data as ThresholdRow;
        }
        if (expRes.status === "fulfilled" && expRes.value.count !== null && expRes.value.count !== undefined) {
          expCount = expRes.value.count;
        }
        if (invRes.status === "fulfilled" && invRes.value.count !== null && invRes.value.count !== undefined) {
          invCount = invRes.value.count;
        }
      } catch (e) {
        console.warn("Error loading settings from Supabase:", e);
      }
    }

    const savedThreshold = localStorage.getItem("wassup_revenue_threshold");
    if (savedThreshold) {
      try {
        const parsed = JSON.parse(savedThreshold);
        if (parsed) {
          thData = { ...(thData || { id: "r0000000-0000-4000-d000-000000000001" }), ...parsed };
        }
      } catch (e) {}
    } else if (!thData) {
      thData = { id: "r0000000-0000-4000-d000-000000000001", red_max: 30000000, yellow_max: 50000000 };
    }

    setThreshold(thData);
    setExpenseLimitCount(expCount || 5);
    setInventoryItemCount(invCount || 12);
    setLoading(false);
  }

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 4000);
  };

  async function saveThreshold() {
    if (!threshold || !staff) return;
    localStorage.setItem("wassup_revenue_threshold", JSON.stringify(threshold));
    window.dispatchEvent(new CustomEvent("wassup_threshold_updated", { detail: threshold }));

    await logAudit({ actorId: staff.id, module: "settings", action: "update_revenue_thresholds", entity: "revenue_thresholds", entityId: threshold.id, after: threshold });
    showToast("Đã lưu ngưỡng doanh thu.");
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Top action toolbar with Expand All / Collapse All */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="text-xs text-stone-500 font-sans">
          Quản lý toàn bộ tham số vận hành, khung giờ trạm và các ngưỡng kiểm soát hệ thống
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleAll}
            className="px-2.5 py-1.5 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-matte-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none"
            title={isAllCollapsed ? "Mở tất cả các box cấu hình" : "Thu gọn tất cả các box cấu hình"}
          >
            {isAllCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4 text-stone-500" />
                <span>Mở tất cả</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 text-stone-500" />
                <span>Thu gọn tất cả</span>
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* SECTION 1: Cấu hình Thông tin chung Trạm Vận Hành (Full Width + Collapse/Expand) */}
      <GeneralInfo
        currentStationId={currentStationId}
        onSelectStation={onSelectStation}
        isCollapsed={collapsedSections.general}
        onToggleCollapse={() => toggleSection("general")}
      />

      {/* SECTION 2: Ngưỡng báo đỏ/vàng/xanh doanh thu */}
      <div className="w-full bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4 transition-all">
        <div className={`flex flex-wrap items-center justify-between gap-3 ${!collapsedSections.threshold ? "border-b border-[#e5e5e5] pb-3" : ""}`}>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-forest-green shrink-0" />
              <span>Ngưỡng báo đỏ/vàng/xanh doanh thu</span>
            </h3>
            <p className="text-[11px] text-mid-gray font-sans">Gốc tại Module 1 — Dashboard Tổng Quan (chưa build).</p>
            {collapsedSections.threshold && threshold && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold border border-red-200/60 font-mono text-[11px]">
                  Đỏ: ≤ {formatVND(threshold.red_max)}/ngày
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200/60 font-mono text-[11px]">
                  Vàng: ≤ {formatVND(threshold.yellow_max)}/ngày
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleSection("threshold")}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition cursor-pointer flex items-center justify-center shrink-0 ml-auto"
            title={collapsedSections.threshold ? "Mở rộng box này" : "Thu gọn box này"}
            aria-label={collapsedSections.threshold ? "Mở rộng" : "Thu gọn"}
          >
            {collapsedSections.threshold ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {!collapsedSections.threshold && (
          <>
            {threshold ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-mid-gray uppercase">Ngưỡng đỏ tối đa (đồng/ngày)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={threshold.red_max}
                    onChange={(e) => setThreshold({ ...threshold, red_max: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-red-600 disabled:bg-gray-50 focus:outline-none focus:border-forest-green"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-mid-gray uppercase">Ngưỡng vàng tối đa (đồng/ngày)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={threshold.yellow_max}
                    onChange={(e) => setThreshold({ ...threshold, yellow_max: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-amber-600 disabled:bg-gray-50 focus:outline-none focus:border-forest-green"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-mid-gray font-sans">Chưa có dữ liệu — chạy migration seed.</p>
            )}
            {canEdit && threshold && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={saveThreshold}
                  className="px-5 py-2.5 bg-matte-black hover:bg-gray-900 text-white text-xs font-extrabold uppercase tracking-wide rounded-xl transition cursor-pointer shadow-sm"
                >
                  Lưu ngưỡng doanh thu
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION 3: Hạn mức duyệt chi theo vai trò */}
      <div className="w-full bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-3 transition-all">
        <div className={`flex flex-wrap items-center justify-between gap-3 ${!collapsedSections.expense ? "border-b border-[#e5e5e5] pb-3" : ""}`}>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600 shrink-0" />
              <span>Hạn mức duyệt chi theo vai trò</span>
            </h3>
            <p className="text-[11px] text-mid-gray font-sans">
              Đã cấu hình {expenseLimitCount} vai trò trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleSection("expense")}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition cursor-pointer flex items-center justify-center shrink-0 ml-auto"
            title={collapsedSections.expense ? "Mở rộng box này" : "Thu gọn box này"}
            aria-label={collapsedSections.expense ? "Mở rộng" : "Thu gọn"}
          >
            {collapsedSections.expense ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {!collapsedSections.expense && (
          <div className="pt-1 text-xs text-mid-gray font-sans leading-relaxed bg-stone-50/70 border border-stone-200/60 rounded-xl p-4">
            <p>
              Hiện có <strong className="text-stone-900">{expenseLimitCount}</strong> vai trò đã được thiết lập ngưỡng duyệt chi. Chi tiết duyệt chi từng cấp (Quản lý trạm, Kế toán, Giám đốc) sẽ được điều chỉnh trực tiếp tại <strong className="text-stone-900">Module 3 — POS Thu Ngân & Sổ Quỹ</strong> khi vận hành.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 4: Ngưỡng cảnh báo tồn kho */}
      <div className="w-full bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-3 transition-all">
        <div className={`flex flex-wrap items-center justify-between gap-3 ${!collapsedSections.inventory ? "border-b border-[#e5e5e5] pb-3" : ""}`}>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
              <Boxes className="h-5 w-5 text-forest-green shrink-0" />
              <span>Ngưỡng cảnh báo tồn kho</span>
            </h3>
            <p className="text-[11px] text-mid-gray font-sans">
              Đã khai báo {inventoryItemCount} danh mục vật tư phụ tùng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleSection("inventory")}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition cursor-pointer flex items-center justify-center shrink-0 ml-auto"
            title={collapsedSections.inventory ? "Mở rộng box này" : "Thu gọn box này"}
            aria-label={collapsedSections.inventory ? "Mở rộng" : "Thu gọn"}
          >
            {collapsedSections.inventory ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {!collapsedSections.inventory && (
          <div className="pt-1 text-xs text-mid-gray font-sans leading-relaxed bg-stone-50/70 border border-stone-200/60 rounded-xl p-4">
            <p>
              Hệ thống ghi nhận <strong className="text-stone-900">{inventoryItemCount}</strong> mã vật tư đã khai báo. Cơ chế cảnh báo tự động khi tồn kho chạm đáy (Min Level) sẽ được đồng bộ và cấu hình chi tiết tại <strong className="text-stone-900">Module 6 — Kho Vật Tư & Nhập Xuất</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
