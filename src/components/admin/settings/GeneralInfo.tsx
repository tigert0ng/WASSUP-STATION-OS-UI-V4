import React, { useEffect, useState } from "react";
import { Building2, MapPin, Phone, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";

// S0.1 — Thông tin chung (US-0.1, FR-0.1).
interface StationRow {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  opening_hours_jsonb: { open?: string; close?: string } | null;
}

interface GeneralInfoProps {
  currentStationId?: string;
  onSelectStation?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function GeneralInfo({
  currentStationId,
  onSelectStation,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: GeneralInfoProps = {}) {
  const { can, staff } = useAuth();
  const canEdit = can("settings", "update");

  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setLocalCollapsed((prev) => !prev));

  const [station, setStation] = useState<StationRow | null>(null);
  const [allStations, setAllStations] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void load();

    const handleUpdate = () => {
      void load();
    };
    window.addEventListener("wassup_stations_updated", handleUpdate);
    return () => {
      window.removeEventListener("wassup_stations_updated", handleUpdate);
    };
  }, [currentStationId]);

  async function load() {
    setLoading(true);

    const stored = localStorage.getItem("wassup_stations");
    let localData: StationRow[] | null = null;
    if (stored) {
      try {
        localData = JSON.parse(stored);
      } catch (e) {}
    }

    if (supabase) {
      try {
        const { data: stationsData, error } = await supabase
          .from("stations")
          .select("id, name, address, contact_phone, opening_hours_jsonb")
          .order("created_at", { ascending: true });

        if (!error && stationsData && stationsData.length > 0) {
          const merged = (stationsData as StationRow[]).map((st) => {
            const loc = localData?.find((l) => l.id === st.id);
            return loc ? { ...st, name: loc.name, address: loc.address, contact_phone: loc.contact_phone, opening_hours_jsonb: loc.opening_hours_jsonb } : st;
          });
          setAllStations(merged);
          const matched = currentStationId
            ? merged.find((s) => s.id === currentStationId)
            : merged[0];
          setStation(matched || merged[0]);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Supabase fetch failed", e);
      }
    }

    // Demo fallback for Multi-Station
    const demoStations: StationRow[] = localData || [
      {
        id: "st-001",
        name: "WASSUP Station - Cầu Giấy (Trạm Tổng)",
        address: "Số 188 Nguyễn Văn Huyên, Q. Cầu Giấy, Hà Nội",
        contact_phone: "0901 234 567",
        opening_hours_jsonb: { open: "07:30", close: "20:30" },
      },
      {
        id: "st-002",
        name: "WASSUP Station - Mỹ Đình",
        address: "Số 45 Lê Đức Thọ, Q. Nam Từ Liêm, Hà Nội",
        contact_phone: "0902 888 999",
        opening_hours_jsonb: { open: "08:00", close: "20:00" },
      },
      {
        id: "st-003",
        name: "WASSUP Station - Hà Đông",
        address: "Số 12 Quang Trung, Q. Hà Đông, Hà Nội",
        contact_phone: "0903 777 666",
        opening_hours_jsonb: { open: "08:00", close: "20:00" },
      },
    ];

    setAllStations(demoStations);
    const matchedDemo = currentStationId
      ? demoStations.find((s) => s.id === currentStationId)
      : demoStations[0];
    setStation(matchedDemo || demoStations[0]);
    setLoading(false);
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!station) return;
    if (!station.name?.trim()) {
      setToast("Tên chi nhánh / trạm vận hành không được để trống!");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSaving(true);

    const updatedAll = allStations.map((s) => (s.id === station.id ? station : s));
    setAllStations(updatedAll);
    localStorage.setItem("wassup_stations", JSON.stringify(updatedAll));
    window.dispatchEvent(new Event("wassup_stations_updated"));

    if (staff) {
      await logAudit({
        actorId: staff.id,
        module: "settings",
        action: "update_station",
        entity: "stations",
        entityId: station.id,
        after: station,
      });
    }

    setSaving(false);
    setToast("Đã lưu thông tin cấu hình trạm thành công!");
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  if (!station) {
    return (
      <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 text-amber-900 text-sm font-sans">
        Chưa có trạm nào trong hệ thống. Chạy migration seed (
        <code className="font-mono text-xs">0003_rls_and_seed.sql</code>) để tạo trạm pilot đầu tiên.
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-5 transition-all">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-brand-green" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header with Title and Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${!isCollapsed ? "border-b border-[#e5e5e5] pb-4" : ""}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-forest-green shrink-0" />
            <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase">
              THÔNG TIN VÀ KHUNG GIỜ VẬN HÀNH TRẠM
            </h3>
          </div>
          <p className="text-[11px] text-mid-gray font-sans">
            Mã trạm: <span className="font-mono font-bold text-slate-800">{station.id}</span>
            {station.name && (
              <>
                <span className="mx-2 text-stone-300">•</span>
                <span className="font-semibold text-stone-700">{station.name}</span>
              </>
            )}
          </p>

          {/* Quick info badges shown when collapsed */}
          {isCollapsed && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-600">
              {station.contact_phone && (
                <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md font-mono text-stone-700">
                  <Phone className="h-3 w-3 text-stone-500" />
                  {station.contact_phone}
                </span>
              )}
              {station.address && (
                <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-stone-700">
                  <MapPin className="h-3 w-3 text-stone-500" />
                  <span className="truncate max-w-xs">{station.address}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-amber-800 font-bold font-mono">
                <Clock className="h-3 w-3 text-amber-600" />
                {station.opening_hours_jsonb?.open || "07:30"} - {station.opening_hours_jsonb?.close || "20:30"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {allStations.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-stone-400">Chọn Trạm:</span>
              <select
                value={station.id}
                onChange={(e) => {
                  const sel = allStations.find((s) => s.id === e.target.value);
                  if (sel) {
                    setStation(sel);
                    if (onSelectStation) onSelectStation(sel.id);
                  }
                }}
                className="bg-stone-50 border border-stone-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                {allStations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collapse / Expand toggle button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition cursor-pointer flex items-center justify-center"
            title={isCollapsed ? "Mở rộng box này" : "Thu gọn box này"}
            aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Body content - visible only when not collapsed */}
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-mid-gray uppercase">Tên Chi Nhánh / Trạm Vận Hành</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={station.name}
                onChange={(e) => setStation({ ...station, name: e.target.value })}
                placeholder="VD: WASSUP Station - Cầu Giấy"
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 font-sans font-semibold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-mid-gray uppercase">Hotline chăm sóc khách hàng</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 text-mid-gray h-4 w-4" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={station.contact_phone ?? ""}
                  onChange={(e) => setStation({ ...station, contact_phone: e.target.value })}
                  placeholder="VD: 0901 234 567"
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-10 pr-4 py-2.5 text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-extrabold text-mid-gray uppercase">Địa chỉ vật lý</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 text-mid-gray h-4 w-4" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={station.address ?? ""}
                  onChange={(e) => setStation({ ...station, address: e.target.value })}
                  placeholder="VD: Số 188 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội"
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-10 pr-4 py-2.5 text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 text-xs">
            <span className="font-bold text-matte-black block mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-amber-500" />
              Khung giờ hoạt động của trạm (dùng làm mặc định cho cron job Kiosk/TV — chưa build)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-extrabold text-mid-gray uppercase">Giờ mở cửa</label>
                <input
                  type="time"
                  disabled={!canEdit}
                  value={station.opening_hours_jsonb?.open ?? ""}
                  onChange={(e) =>
                    setStation({ ...station, opening_hours_jsonb: { ...station.opening_hours_jsonb, open: e.target.value } })
                  }
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-4 py-2.5 font-mono font-bold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold text-mid-gray uppercase">Giờ đóng cửa</label>
                <input
                  type="time"
                  disabled={!canEdit}
                  value={station.opening_hours_jsonb?.close ?? ""}
                  onChange={(e) =>
                    setStation({ ...station, opening_hours_jsonb: { ...station.opening_hours_jsonb, close: e.target.value } })
                  }
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-4 py-2.5 font-mono font-bold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="pt-3 flex justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold text-xs uppercase tracking-wide transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình chung"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
