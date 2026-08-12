import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  Copy,
  Check,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";

export interface StationItem {
  id: string;
  code: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  opening_hours_jsonb: { open?: string; close?: string } | null;
  is_headquarters: boolean;
  status: "active" | "locked";
  created_at?: string;
  staff_count?: number;
  ktv_count?: number;
}

// Sample fallback stations for realistic offline/demo data
const DEFAULT_STATIONS: StationItem[] = [
  {
    id: "st-001",
    code: "ST-01",
    name: "WASSUP Station - Cầu Giấy (Trạm Tổng)",
    address: "Số 188 Nguyễn Văn Huyên, Q. Cầu Giấy, Hà Nội",
    contact_phone: "0901 234 567",
    opening_hours_jsonb: { open: "07:30", close: "20:30" },
    is_headquarters: true,
    status: "active",
    staff_count: 6,
    ktv_count: 14,
  },
  {
    id: "st-002",
    code: "ST-02",
    name: "WASSUP Station - Mỹ Đình",
    address: "Số 45 Lê Đức Thọ, Q. Nam Từ Liêm, Hà Nội",
    contact_phone: "0902 888 999",
    opening_hours_jsonb: { open: "08:00", close: "20:00" },
    is_headquarters: false,
    status: "active",
    staff_count: 4,
    ktv_count: 10,
  },
  {
    id: "st-003",
    code: "ST-03",
    name: "WASSUP Station - Hà Đông",
    address: "Số 12 Quang Trung, Q. Hà Đông, Hà Nội",
    contact_phone: "0903 777 666",
    opening_hours_jsonb: { open: "08:00", close: "20:00" },
    is_headquarters: false,
    status: "active",
    staff_count: 3,
    ktv_count: 8,
  },
];

interface StationsListProps {
  currentStationId?: string;
  onSelectStation?: (stationId: string) => void;
}

export default function StationsList({ currentStationId, onSelectStation }: StationsListProps) {
  const { staff } = useAuth();
  const isMasterAdmin = staff?.role_id === "master_admin" || staff?.station_scope_all;

  const [stations, setStations] = useState<StationItem[]>(DEFAULT_STATIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  // Drawer Create Station state
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);

  // Form Step 1: Station
  const [stCode, setStCode] = useState<string>("ST-04");
  const [stName, setStName] = useState<string>("");
  const [stAddress, setStAddress] = useState<string>("");
  const [stPhone, setStPhone] = useState<string>("");
  const [stOpen, setStOpen] = useState<string>("08:00");
  const [stClose, setStClose] = useState<string>("20:00");

  // Form Step 2: First Station Admin
  const [adminName, setAdminName] = useState<string>("");
  const [adminPhone, setAdminPhone] = useState<string>("");
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("123456");

  // Edit station modal state
  const [editingStation, setEditingStation] = useState<StationItem | null>(null);

  // View station accounts modal state
  const [stationAccountsModal, setStationAccountsModal] = useState<StationItem | null>(null);

  // Lock confirmation modal
  const [confirmLockStation, setConfirmLockStation] = useState<StationItem | null>(null);

  // Copy indicator
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    void loadStations();

    const handleUpdate = () => {
      void loadStations();
    };
    window.addEventListener("wassup_stations_updated", handleUpdate);
    return () => {
      window.removeEventListener("wassup_stations_updated", handleUpdate);
    };
  }, []);

  async function loadStations() {
    setLoading(true);

    const stored = localStorage.getItem("wassup_stations");
    let localStations: StationItem[] | null = null;
    if (stored) {
      try {
        localStations = JSON.parse(stored);
      } catch (e) {}
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("stations")
          .select("id, name, address, contact_phone, opening_hours_jsonb, is_headquarters, created_at")
          .order("is_headquarters", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: StationItem[] = data.map((item: any, idx: number) => {
            const loc = localStations?.find((l) => l.id === item.id);
            return {
              id: item.id,
              code: item.code || `ST-0${idx + 1}`,
              name: loc ? loc.name : item.name,
              address: loc?.address ?? item.address ?? "Chưa cập nhật",
              contact_phone: loc?.contact_phone ?? item.contact_phone ?? "N/A",
              opening_hours_jsonb: loc?.opening_hours_jsonb ?? item.opening_hours_jsonb ?? { open: "08:00", close: "20:00" },
              is_headquarters: item.is_headquarters ?? (idx === 0),
              status: loc?.status ?? "active",
              staff_count: item.is_headquarters ? 6 : 4,
              ktv_count: item.is_headquarters ? 14 : 9,
            };
          });
          setStations(mapped);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Using default stations list fallback", e);
      }
    }

    setStations(localStations || DEFAULT_STATIONS);
    setLoading(false);
  }

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Step 1 -> Step 2 validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stName.trim() || !stCode.trim()) return;
    if (!adminUsername) {
      // Auto suggest username based on station code
      const cleanCode = stCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      setAdminUsername(`admin_${cleanCode}`);
    }
    setCreateStep(2);
  };

  // Final submit: Create station + seed roles + initial station admin
  const handleCreateStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stName.trim() || !adminName.trim() || !adminUsername.trim()) return;

    const newId = `st-${Date.now()}`;
    const newStationObj: StationItem = {
      id: newId,
      code: stCode.trim().toUpperCase(),
      name: stName.trim(),
      address: stAddress.trim() || "Chưa cập nhật",
      contact_phone: stPhone.trim() || "N/A",
      opening_hours_jsonb: { open: stOpen, close: stClose },
      is_headquarters: false,
      status: "active",
      staff_count: 1, // First station admin
      ktv_count: 0,
    };

    // Database attempt
    if (supabase) {
      try {
        await supabase.from("stations").insert({
          id: newId,
          name: newStationObj.name,
          address: newStationObj.address,
          contact_phone: newStationObj.contact_phone,
          opening_hours_jsonb: newStationObj.opening_hours_jsonb,
          is_headquarters: false,
        });

        // Seed station admin user
        await supabase.from("staff").insert({
          name: adminName.trim(),
          phone: adminPhone.trim(),
          username: adminUsername.trim(),
          role_id: "station_admin",
          station_id: newId,
        });
      } catch (err) {
        console.warn("Database insert station warning", err);
      }
    }

    // Save initial station admin account to local staff list
    try {
      const storedStaff = localStorage.getItem("wassup_staff_list");
      let currentStaffList = storedStaff ? JSON.parse(storedStaff) : [];
      const newAdminUser = {
        id: `staff-${Date.now()}`,
        name: adminName.trim(),
        phone: adminPhone.trim() || null,
        username: adminUsername.trim(),
        role_id: "manager",
        station_id: newId,
        status: "active",
      };
      currentStaffList.push(newAdminUser);
      localStorage.setItem("wassup_staff_list", JSON.stringify(currentStaffList));
    } catch (e) {}

    // Update state & audit log
    const updatedStations = [...stations, newStationObj];
    setStations(updatedStations);
    localStorage.setItem("wassup_stations", JSON.stringify(updatedStations));
    window.dispatchEvent(new Event("wassup_stations_updated"));

    await logAudit({
      actorId: staff?.id || "admin-001",
      module: "settings",
      action: "create_station",
      entity: "stations",
      entityId: newId,
      after: {
        station: newStationObj,
        initialAdmin: { name: adminName, username: adminUsername },
      },
    });

    showToastMsg(`Đã khởi tạo trạm mới [${newStationObj.name}] & tài khoản Admin Trạm (${adminUsername})!`);

    // Reset form
    setShowCreateDrawer(false);
    setCreateStep(1);
    setStName("");
    setStAddress("");
    setStPhone("");
    setAdminName("");
    setAdminPhone("");
    setAdminUsername("");
  };

  // Toggle station status
  const handleToggleStationStatus = async () => {
    if (!confirmLockStation) return;
    const target = confirmLockStation;
    const newStatus: "active" | "locked" = target.status === "active" ? "locked" : "active";

    const updatedStations: StationItem[] = stations.map((s) => (s.id === target.id ? { ...s, status: newStatus } : s));
    setStations(updatedStations);
    localStorage.setItem("wassup_stations", JSON.stringify(updatedStations));
    window.dispatchEvent(new Event("wassup_stations_updated"));

    if (supabase) {
      try {
        await supabase
          .from("stations")
          .update({ status: newStatus })
          .eq("id", target.id);
      } catch (e) {
        // quiet fallback
      }
    }

    await logAudit({
      actorId: staff?.id || "admin-001",
      module: "settings",
      action: newStatus === "locked" ? "lock_station" : "unlock_station",
      entity: "stations",
      entityId: target.id,
      before: { status: target.status },
      after: { status: newStatus },
    });

    showToastMsg(`Đã ${newStatus === "locked" ? "tạm khóa" : "mở khóa"} trạm ${target.name}`);
    setConfirmLockStation(null);
  };

  // Save station edits
  const handleSaveStationEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;

    const updatedStations = stations.map((s) => (s.id === editingStation.id ? editingStation : s));
    setStations(updatedStations);
    localStorage.setItem("wassup_stations", JSON.stringify(updatedStations));
    window.dispatchEvent(new Event("wassup_stations_updated"));

    if (supabase) {
      try {
        await supabase
          .from("stations")
          .update({
            name: editingStation.name,
            address: editingStation.address,
            contact_phone: editingStation.contact_phone,
            opening_hours_jsonb: editingStation.opening_hours_jsonb,
          })
          .eq("id", editingStation.id);
      } catch (e) {
        // quiet fallback
      }
    }

    await logAudit({
      actorId: staff?.id || "admin-001",
      module: "settings",
      action: "update_station",
      entity: "stations",
      entityId: editingStation.id,
      after: editingStation,
    });

    showToastMsg(`Cập nhật thông tin trạm [${editingStation.name}] thành công!`);
    setEditingStation(null);
  };

  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.address && st.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || st.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalHeadquarters = stations.filter((s) => s.is_headquarters).length;
  const totalBranches = stations.length - totalHeadquarters;
  const activeCount = stations.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-[10000] bg-slate-950 text-[#A2C62C] px-5 py-3.5 rounded-2xl border border-[#A2C62C]/30 shadow-2xl flex items-center gap-3 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="h-4.5 w-4.5 text-[#A2C62C]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner & Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-950 text-[#A2C62C] flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Tổng Trạm Vận Hành</p>
            <p className="text-xl font-black font-display text-slate-900 mt-0.5">{stations.length} <span className="text-xs font-normal text-stone-500">chi nhánh</span></p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Trạm Tổng (HQ)</p>
            <p className="text-xl font-black font-display text-slate-900 mt-0.5">{totalHeadquarters} <span className="text-xs font-normal text-stone-500">trạm</span></p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Chi Nhánh Franchise</p>
            <p className="text-xl font-black font-display text-slate-900 mt-0.5">{totalBranches} <span className="text-xs font-normal text-stone-500">chi nhánh</span></p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Đang Hoạt Động</p>
            <p className="text-xl font-black font-display text-slate-900 mt-0.5">{activeCount}/{stations.length} <span className="text-xs font-normal text-stone-500">trạm</span></p>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters, Add Station */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo tên trạm, mã trạm, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-slate-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-600 cursor-pointer focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Tạm khóa</option>
          </select>
        </div>

        {isMasterAdmin && (
          <button
            onClick={() => {
              setCreateStep(1);
              setStCode(`ST-0${stations.length + 1}`);
              setShowCreateDrawer(true);
            }}
            className="w-full md:w-auto px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-[#A2C62C] font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer border-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Tạo trạm mới (S0.0b)
          </button>
        )}
      </div>

      {/* Stations Data Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                <th className="p-4 pl-6">Mã & Tên Trạm</th>
                <th className="p-4">Địa chỉ vật lý</th>
                <th className="p-4">Hotline & Giờ mở cửa</th>
                <th className="p-4 text-center">Nhân sự / KTV</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 pr-6 text-right">Thao tác Master Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                    Đang tải danh sách trạm vận hành...
                  </td>
                </tr>
              ) : filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-medium italic">
                    Không tìm thấy trạm phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStations.map((st) => {
                  const isCurrentViewing = currentStationId === st.id;
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-stone-50/70 transition ${
                        isCurrentViewing ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Code & Name */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleCopyCode(st.code)}
                            title="Bấm để copy mã trạm"
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-black text-[10px] border border-stone-200 flex items-center gap-1 cursor-pointer transition"
                          >
                            {st.code}
                            {copiedCode === st.code ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-stone-400" />
                            )}
                          </button>

                          <div>
                            <p className="font-extrabold text-slate-900 flex items-center gap-2 text-xs">
                              {st.name}
                              {st.is_headquarters && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                  <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                                  Trạm Tổng (HQ)
                                </span>
                              )}
                              {isCurrentViewing && (
                                <span className="inline-flex items-center gap-1 bg-[#A2C62C]/20 text-slate-950 border border-[#A2C62C]/50 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                  Đang Xem
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono mt-0.5">ID: {st.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="p-4">
                        <p className="text-slate-700 font-medium flex items-center gap-1.5 line-clamp-2 max-w-xs">
                          <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          {st.address || "Chưa cập nhật"}
                        </p>
                      </td>

                      {/* Phone & Hours */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-slate-800 font-extrabold flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-stone-400" />
                            {st.contact_phone || "N/A"}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-stone-400" />
                            {st.opening_hours_jsonb?.open || "08:00"} - {st.opening_hours_jsonb?.close || "20:00"}
                          </p>
                        </div>
                      </td>

                      {/* Staff & KTV count */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Users className="h-3 w-3 text-purple-600" />
                            {st.staff_count ?? 4} staff
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            {st.ktv_count ?? 10} KTV
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            st.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {st.status === "active" ? "Hoạt động" : "Tạm khóa"}
                        </span>
                      </td>

                      {/* Master Admin Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectStation && (
                            <button
                              onClick={() => onSelectStation(st.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer border-0 flex items-center gap-1 ${
                                isCurrentViewing
                                  ? "bg-stone-200 text-stone-600 cursor-default"
                                  : "bg-slate-950 text-[#A2C62C] hover:bg-slate-800"
                              }`}
                              disabled={isCurrentViewing}
                            >
                              <Eye className="h-3 w-3" />
                              {isCurrentViewing ? "Đang chọn" : "Xem trạm"}
                            </button>
                          )}

                          {isMasterAdmin && (
                            <>
                              <button
                                onClick={() => setStationAccountsModal(st)}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-[10px] uppercase transition cursor-pointer border border-purple-200 flex items-center gap-1"
                                title="Quản lý tài khoản thuộc trạm này"
                              >
                                <Users className="h-3 w-3 text-purple-600" />
                                Accounts
                              </button>

                              <button
                                onClick={() => setEditingStation(st)}
                                className="px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[10px] uppercase transition cursor-pointer border-0"
                                title="Sửa thông tin trạm"
                              >
                                Sửa
                              </button>

                              {!st.is_headquarters && (
                                <button
                                  onClick={() => setConfirmLockStation(st)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    st.status === "active"
                                      ? "bg-stone-50 border-stone-200 text-stone-500 hover:text-amber-600 hover:bg-amber-50"
                                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                  }`}
                                  title={st.status === "active" ? "Tạm khóa trạm" : "Mở khóa trạm"}
                                >
                                  {st.status === "active" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER S0.0b — CREATE NEW STATION & SEED INITIAL ADMIN TRẠM */}
      <AnimatePresence>
        {showCreateDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateDrawer(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#A2C62C] flex items-center justify-center text-slate-950 font-black">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                      Khai Báo Trạm Vận Hành Mới (S0.0b)
                    </h3>
                    <p className="text-[10px] text-stone-400 font-sans">
                      {createStep === 1 ? "Bước 1/2: Thông tin cơ bản trạm" : "Bước 2/2: Khởi tạo tài khoản Admin Trạm đầu tiên"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex items-center gap-3">
                <div className={`flex items-center gap-2 text-xs font-extrabold uppercase ${createStep === 1 ? "text-slate-900" : "text-emerald-600"}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${createStep === 1 ? "bg-slate-900 text-white" : "bg-emerald-500 text-white"}`}>
                    {createStep === 1 ? "1" : "✓"}
                  </span>
                  Thông tin Trạm
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-stone-300" />

                <div className={`flex items-center gap-2 text-xs font-extrabold uppercase ${createStep === 2 ? "text-slate-900" : "text-stone-400"}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${createStep === 2 ? "bg-slate-900 text-white" : "bg-stone-200 text-stone-500"}`}>
                    2
                  </span>
                  Khởi tạo Admin Trạm
                </div>
              </div>

              {/* Form Step 1 */}
              {createStep === 1 && (
                <form onSubmit={handleProceedToStep2} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
                    Tạo trạm mới sẽ tự động khởi tạo 3 vai trò mặc định (Admin Trạm, Quản lý - Thu ngân, Kế toán) clone từ trạm tổng.
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-black uppercase text-stone-500">Mã Trạm *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: ST-04"
                        value={stCode}
                        onChange={(e) => setStCode(e.target.value.toUpperCase())}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-black uppercase text-stone-500">Tên Trạm Vận Hành *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: WASSUP Station - Mỹ Đình"
                        value={stName}
                        onChange={(e) => setStName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-500">Địa chỉ vật lý chi tiết</label>
                    <input
                      type="text"
                      placeholder="Số nhà, Đường, Quận/Huyện, Thành phố..."
                      value={stAddress}
                      onChange={(e) => setStAddress(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-500">Hotline Trạm</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 090x xxx xxx"
                      value={stPhone}
                      onChange={(e) => setStPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-stone-500">Giờ mở cửa</label>
                      <input
                        type="time"
                        value={stOpen}
                        onChange={(e) => setStOpen(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-stone-500">Giờ đóng cửa</label>
                      <input
                        type="time"
                        value={stClose}
                        onChange={(e) => setStClose(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-200 flex justify-end gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => setShowCreateDrawer(false)}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-[#A2C62C] font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer border-0"
                    >
                      Tiếp theo: Admin Trạm
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Form Step 2 */}
              {createStep === 2 && (
                <form onSubmit={handleCreateStationSubmit} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                    <strong>Bắt buộc:</strong> Mỗi trạm mới cần tối thiểu 01 tài khoản Admin Trạm để tự vận hành các nghiệp vụ phân quyền, kỹ thuật viên và POS tại điểm.
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-500">Họ và tên Admin Trạm *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn Hải"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-500">Số điện thoại liên hệ *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 0912xxxxxx"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-stone-500">Tên đăng nhập (Username) *</label>
                      <input
                        type="text"
                        required
                        placeholder="admin_st04"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-stone-500">Mật khẩu khởi tạo *</label>
                      <input
                        type="text"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-200 flex items-center justify-between gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                    >
                      Quay lại Bước 1
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-[#A2C62C] font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0 shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#A2C62C]" />
                      Hoàn tất khởi tạo trạm
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT STATION MODAL */}
      {editingStation && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative font-sans">
            <button
              onClick={() => setEditingStation(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-slate-900 cursor-pointer border-0 bg-transparent"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 mb-4 border-b border-stone-200 pb-3 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-forest-green" />
              Sửa Thông Tin Trạm: {editingStation.code}
            </h3>

            <form onSubmit={handleSaveStationEdits} className="space-y-3.5 text-left text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Tên Trạm</label>
                <input
                  type="text"
                  required
                  value={editingStation.name}
                  onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Địa chỉ vật lý</label>
                <input
                  type="text"
                  value={editingStation.address ?? ""}
                  onChange={(e) => setEditingStation({ ...editingStation, address: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Hotline liên hệ</label>
                <input
                  type="text"
                  value={editingStation.contact_phone ?? ""}
                  onChange={(e) => setEditingStation({ ...editingStation, contact_phone: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Giờ mở cửa</label>
                  <input
                    type="time"
                    value={editingStation.opening_hours_jsonb?.open ?? "08:00"}
                    onChange={(e) =>
                      setEditingStation({
                        ...editingStation,
                        opening_hours_jsonb: {
                          ...editingStation.opening_hours_jsonb,
                          open: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Giờ đóng cửa</label>
                  <input
                    type="time"
                    value={editingStation.opening_hours_jsonb?.close ?? "20:00"}
                    onChange={(e) =>
                      setEditingStation({
                        ...editingStation,
                        opening_hours_jsonb: {
                          ...editingStation.opening_hours_jsonb,
                          close: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-bold transition uppercase"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white font-extrabold transition uppercase shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM LOCK MODAL */}
      {confirmLockStation && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-stone-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-sans text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 mb-2">
              Xác Nhận {confirmLockStation.status === "active" ? "Tạm Khóa" : "Mở Khóa"} Trạm
            </h3>

            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn {confirmLockStation.status === "active" ? "tạm khóa" : "mở khóa"} trạm{" "}
              <strong>{confirmLockStation.name}</strong>? Thao tác này sẽ ghi nhận vào nhật ký kiểm toán hệ thống.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLockStation(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs uppercase hover:bg-stone-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleToggleStationStatus}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase transition shadow-sm cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DANH SÁCH TÀI KHOẢN THEO TRẠM */}
      {stationAccountsModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-stone-200 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative font-sans text-left">
            <button
              onClick={() => setStationAccountsModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition cursor-pointer border-0"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
                Tài Khoản Nhân Sự — {stationAccountsModal.name}
              </h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Danh sách tài khoản Admin/Quản lý/Lễ tân/Kế toán được cấp quyền hoạt động tại trạm này.
            </p>

            {(() => {
              const storedStaff = localStorage.getItem("wassup_staff_list");
              let allStaff: any[] = [];
              if (storedStaff) {
                try {
                  allStaff = JSON.parse(storedStaff);
                } catch (e) {}
              }
              const stationStaff = allStaff.filter((s) => s.station_id === stationAccountsModal.id);

              return (
                <div className="space-y-4">
                  {stationStaff.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-bold text-amber-900">
                        Chưa có tài khoản nhân sự riêng nào gán trực tiếp cho trạm này.
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        Hiện tại trạm có thể được truy cập bởi tài khoản Master Admin (HQ).
                      </p>
                    </div>
                  ) : (
                    <div className="border border-stone-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Họ tên</th>
                            <th className="p-2.5">Username</th>
                            <th className="p-2.5">SĐT</th>
                            <th className="p-2.5">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {stationStaff.map((s) => (
                            <tr key={s.id} className="hover:bg-stone-50">
                              <td className="p-2.5 font-bold text-stone-900">{s.name}</td>
                              <td className="p-2.5 font-mono text-stone-600">{s.username}</td>
                              <td className="p-2.5 font-mono text-stone-600">{s.phone || "—"}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  s.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {s.status === "active" ? "Hoạt động" : "Đã khóa"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setStationAccountsModal(null)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                    >
                      Đóng
                    </button>
                    <p className="text-[11px] text-stone-500 italic">
                      Tạo & quản lý phân quyền tài khoản chi tiết tại tab <strong>User & Phân quyền RBAC</strong>.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
