import React, { useEffect, useState } from "react";
import { Building2, MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
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
}

export default function GeneralInfo({ currentStationId, onSelectStation }: GeneralInfoProps = {}) {
  const { can, staff } = useAuth();
  const canEdit = can("settings", "update");

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!station) return;
    setSaving(true);

    const updatedAll = allStations.map((s) => (s.id === station.id ? station : s));
    setAllStations(updatedAll);
    localStorage.setItem("wassup_stations", JSON.stringify(updatedAll));
    window.dispatchEvent(new Event("wassup_stations_updated"));

    if (supabase) {
      try {
        const { error } = await supabase
          .from("stations")
          .update({
            name: station.name,
            address: station.address,
            contact_phone: station.contact_phone,
            opening_hours_jsonb: station.opening_hours_jsonb,
          })
          .eq("id", station.id);

        if (error) {
          console.warn("Supabase update error:", error.message);
        }
      } catch (err) {
        console.warn("Supabase update error:", err);
      }
    }

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
    <form onSubmit={handleSave} className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-brand-green" />
          <span>{toast}</span>
        </div>
      )}

      <div className="border-b border-[#e5e5e5] pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
            <Building2 className="h-5 w-5 text-forest-green" />
            THÔNG TIN VÀ KHUNG GIỜ VẬN HÀNH TRẠM
          </h3>
          <p className="text-[11px] text-mid-gray font-sans mt-0.5">Mã trạm: <span className="font-mono font-bold text-slate-800">{station.id}</span></p>
        </div>

        {allStations.length > 1 && (
          <div className="flex items-center gap-2">
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
      </div>

      <div className="space-y-1.5 text-xs">
        <label className="font-extrabold text-mid-gray uppercase">Tên Chi Nhánh / Trạm Vận Hành</label>
        <input
          type="text"
          required
          disabled={!canEdit}
          value={station.name}
          onChange={(e) => setStation({ ...station, name: e.target.value })}
          className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 font-sans font-semibold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
        />
      </div>

      <div className="space-y-1.5 text-xs">
        <label className="font-extrabold text-mid-gray uppercase">Địa chỉ vật lý</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3 text-mid-gray h-4 w-4" />
          <input
            type="text"
            disabled={!canEdit}
            value={station.address ?? ""}
            onChange={(e) => setStation({ ...station, address: e.target.value })}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-10 pr-4 py-2.5 text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
          />
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <label className="font-extrabold text-mid-gray uppercase">Hotline chăm sóc khách hàng</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-3 text-mid-gray h-4 w-4" />
          <input
            type="text"
            disabled={!canEdit}
            value={station.contact_phone ?? ""}
            onChange={(e) => setStation({ ...station, contact_phone: e.target.value })}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-10 pr-4 py-2.5 text-matte-black focus:outline-none focus:border-forest-green disabled:bg-gray-50 disabled:text-mid-gray"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 text-xs">
        <span className="font-bold text-matte-black block mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-4.5 w-4.5 text-amber-500" />
          Khung giờ hoạt động của trạm (dùng làm mặc định cho cron job Kiosk/TV — chưa build)
        </span>
        <div className="grid grid-cols-2 gap-6">
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
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold text-xs uppercase tracking-wide transition shadow-sm cursor-pointer disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình chung"}
          </button>
        </div>
      )}
    </form>
  );
}
