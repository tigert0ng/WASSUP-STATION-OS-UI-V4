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

export default function GeneralInfo() {
  const { can, staff } = useAuth();
  const canEdit = can("settings", "update");

  const [station, setStation] = useState<StationRow | null>(null);
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
    // Pilot: 1 trạm duy nhất — lấy dòng đầu tiên. Khi nhân rộng franchise,
    // màn hình này chuyển sang chọn trạm theo station_id của user đăng nhập.
    const { data } = await supabase
      .from("stations")
      .select("id, name, address, contact_phone, opening_hours_jsonb")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setStation(data as StationRow | null);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!station || !supabase || !staff) return;
    setSaving(true);

    const before = station;
    const { error } = await supabase
      .from("stations")
      .update({
        name: station.name,
        address: station.address,
        contact_phone: station.contact_phone,
        opening_hours_jsonb: station.opening_hours_jsonb,
      })
      .eq("id", station.id);

    setSaving(false);
    if (error) {
      setToast(`Lỗi: ${error.message}`);
      return;
    }

    await logAudit({
      actorId: staff.id,
      module: "settings",
      action: "update_station",
      entity: "stations",
      entityId: station.id,
      before,
      after: station,
    });

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

      <div className="border-b border-[#e5e5e5] pb-3">
        <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <Building2 className="h-5 w-5 text-forest-green" />
          THÔNG TIN VÀ KHUNG GIỜ VẬN HÀNH TRẠM
        </h3>
        <p className="text-[11px] text-mid-gray font-sans mt-0.5">Mã trạm: {station.id}</p>
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
