import React, { useState, useEffect } from "react";
import {
  Building2,
  ChevronLeft,
  Users,
  ShieldCheck,
  Phone,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Plus,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
  ArrowRightLeft,
  UserPlus,
  Sliders,
  Award
} from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { supabase } from "../../../lib/supabase/client";
import type { StationItem } from "./StationsList";

export interface StaffUserRow {
  id: string;
  name: string;
  phone: string | null;
  username: string;
  role_id: string;
  station_id?: string;
  status: "active" | "locked" | string;
  created_at?: string;
}

interface RoleOption {
  id: string;
  name: string;
  is_system_default?: boolean;
}

interface StationDetailOverviewProps {
  station: StationItem;
  allStations: StationItem[];
  onBack: () => void;
  onEditStation: (st: StationItem) => void;
  onSelectStationContext?: (stationId: string) => void;
  onStationStatusChange?: (st: StationItem, newStatus: "active" | "locked") => void;
}

const DEFAULT_ROLES: RoleOption[] = [
  { id: "manager", name: "Quản lý Trạm (Admin Trạm)", is_system_default: true },
  { id: "accountant", name: "Kế toán Trưởng", is_system_default: true },
  { id: "receptionist", name: "Lễ tân / Thu ngân", is_system_default: true },
  { id: "technician", name: "Kỹ thuật viên (KTV)", is_system_default: true },
];

export default function StationDetailOverview({
  station,
  allStations,
  onBack,
  onEditStation,
  onSelectStationContext,
  onStationStatusChange,
}: StationDetailOverviewProps) {
  const { staff: currentStaff } = useAuth();
  const isMasterAdmin = currentStaff?.role_id === "master_admin" || currentStaff?.station_scope_all;

  const [staffList, setStaffList] = useState<StaffUserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>(DEFAULT_ROLES);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Modals inside overview
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [tempPasswordReveal, setTempPasswordReveal] = useState<{ name: string; password: string } | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffUserRow | null>(null);

  // Form new staff
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
    role_id: "receptionist",
  });

  // Selected staff to transfer
  const [transferStaffId, setTransferStaffId] = useState<string>("");

  const showToast = (kind: "success" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStationData = () => {
    // Load staff list from local storage
    const storedStaff = localStorage.getItem("wassup_staff_list");
    let allStaff: StaffUserRow[] = [];
    if (storedStaff) {
      try {
        allStaff = JSON.parse(storedStaff);
      } catch (e) {
        allStaff = [];
      }
    }
    if (allStaff.length === 0) {
      allStaff = [
        { id: "admin-001", name: "Trần Minh Quân", phone: "0901234567", username: "admin", role_id: "master_admin", station_id: "all", status: "active" },
        { id: "mgr-001", name: "Nguyễn Văn Hùng", phone: "0912345678", username: "quanly.cg", role_id: "manager", station_id: "st-001", status: "active" },
        { id: "acc-001", name: "Lê Thị Mai", phone: "0923456789", username: "ketoan.cg", role_id: "accountant", station_id: "st-001", status: "active" },
        { id: "rec-001", name: "Phạm Thu Trang", phone: "0934567890", username: "letan.cg", role_id: "receptionist", station_id: "st-001", status: "active" },
        { id: "mgr-002", name: "Trần Thị Cúc", phone: "0945678901", username: "quanly.md", role_id: "manager", station_id: "st-002", status: "active" },
        { id: "rec-002", name: "Hoàng Văn Nam", phone: "0956789012", username: "letan.md", role_id: "receptionist", station_id: "st-002", status: "active" },
        { id: "mgr-003", name: "Vũ Hải Đăng", phone: "0967890123", username: "quanly.hd", role_id: "manager", station_id: "st-003", status: "active" },
      ];
      localStorage.setItem("wassup_staff_list", JSON.stringify(allStaff));
    }

    // Load roles
    const storedRoles = localStorage.getItem("wassup_roles");
    if (storedRoles) {
      try {
        const parsedRoles = JSON.parse(storedRoles);
        // Exclude master_admin from station roles
        setRoles(parsedRoles.filter((r: RoleOption) => r.id !== "master_admin"));
      } catch (e) {}
    }

    // Set full staff list (we'll filter station-specific users)
    setStaffList(allStaff);
  };

  useEffect(() => {
    loadStationData();

    const handleUpdate = () => {
      loadStationData();
    };
    window.addEventListener("wassup_stations_updated", handleUpdate);
    window.addEventListener("wassup_staff_updated", handleUpdate);
    return () => {
      window.removeEventListener("wassup_stations_updated", handleUpdate);
      window.removeEventListener("wassup_staff_updated", handleUpdate);
    };
  }, [station.id]);

  // STRICT RULE: Exclude Master Admin accounts from station users list!
  // Master Admin belongs to Corporate HQ, never listed as a station subordinate!
  const stationUsers = staffList.filter((s) => {
    if (s.role_id === "master_admin" || s.username === "admin" || (s as any).is_master_admin) {
      return false; // NEVER show Master Admin in station list!
    }
    return s.station_id === station.id;
  });

  // Identify who the Station Admin is
  // A station admin is someone assigned to this station with role "manager" (or role name containing "quản lý" / "admin")
  const stationAdmin = stationUsers.find(
    (s) => s.role_id === "manager" || s.role_id === "station_admin"
  ) || null;

  // Other station users (non-admin)
  const otherUsers = stationUsers.filter((s) => s.id !== stationAdmin?.id);

  // Filtered station users based on user search & role tab
  const filteredUsers = stationUsers.filter((s) => {
    if (roleFilter !== "all" && s.role_id !== roleFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchUser = s.username.toLowerCase().includes(q);
      const matchPhone = s.phone?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchUser && !matchPhone) return false;
    }
    return true;
  });

  // Other staff from other stations (eligible for transfer to this station)
  const otherStationsStaff = staffList.filter(
    (s) =>
      s.station_id !== station.id &&
      s.role_id !== "master_admin" &&
      s.username !== "admin"
  );

  const getRoleName = (roleId: string) => {
    const found = roles.find((r) => r.id === roleId);
    if (found) return found.name;
    switch (roleId) {
      case "manager":
        return "Quản lý Trạm (Admin Trạm)";
      case "receptionist":
        return "Lễ tân / Thu ngân";
      case "accountant":
        return "Kế toán";
      case "technician":
        return "Kỹ thuật viên";
      default:
        return roleId;
    }
  };

  const getRoleBadgeColor = (roleId: string) => {
    switch (roleId) {
      case "manager":
        return "bg-purple-100 text-purple-900 border-purple-200";
      case "accountant":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "receptionist":
        return "bg-emerald-100 text-emerald-900 border-emerald-200";
      case "technician":
        return "bg-amber-100 text-amber-900 border-amber-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  // Toggle user lock
  const handleToggleLockUser = (user: StaffUserRow) => {
    // STRICT SECURITY RULE: Nobody can lock Master Admin!
    if (user.role_id === "master_admin" || user.username === "admin" || (user as any).is_master_admin) {
      showToast("error", "Tài khoản Master Admin được hệ thống bảo vệ tối cao, không thể bị khóa.");
      return;
    }

    const newStatus = user.status === "active" ? "locked" : "active";
    const updated = staffList.map((s) => (s.id === user.id ? { ...s, status: newStatus } : s));
    setStaffList(updated);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("wassup_staff_updated"));

    showToast(
      "success",
      newStatus === "locked" ? `Đã khóa tài khoản ${user.name}.` : `Đã mở khóa tài khoản ${user.name}.`
    );
  };

  // Reset password / PIN
  const handleResetPassword = (user: StaffUserRow) => {
    const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
    const updated = staffList.map((s) => (s.id === user.id ? { ...s, password: tempPin, pin: tempPin } : s));
    setStaffList(updated);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("wassup_staff_updated"));

    setTempPasswordReveal({ name: user.name, password: tempPin });
    showToast("success", `Đã cấp mật khẩu / PIN tạm cho ${user.name}.`);
  };

  // Delete user
  const handleDeleteUser = (user: StaffUserRow) => {
    // STRICT SECURITY RULE: Nobody can delete Master Admin!
    if (user.role_id === "master_admin" || user.username === "admin" || (user as any).is_master_admin) {
      showToast("error", "Tài khoản Master Admin được hệ thống bảo vệ tối cao, không thể bị xóa.");
      setDeleteConfirmStaff(null);
      return;
    }

    const updated = staffList.filter((s) => s.id !== user.id);
    setStaffList(updated);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("wassup_staff_updated"));

    setDeleteConfirmStaff(null);
    showToast("success", `Đã xóa tài khoản ${user.name} khỏi hệ thống.`);
  };

  // Add new staff directly into this station
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.username.trim()) {
      showToast("error", "Vui lòng nhập họ tên và tên đăng nhập.");
      return;
    }

    const newId = `staff-${Date.now()}`;
    const newStaff: StaffUserRow = {
      id: newId,
      name: newStaffForm.name.trim(),
      phone: newStaffForm.phone.trim() || null,
      username: newStaffForm.username.trim(),
      role_id: newStaffForm.role_id,
      station_id: station.id,
      status: "active",
    };

    const updated = [...staffList, newStaff];
    setStaffList(updated);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("wassup_staff_updated"));

    setShowAddStaffModal(false);
    setNewStaffForm({
      name: "",
      phone: "",
      username: "",
      password: "",
      role_id: "receptionist",
    });
    showToast("success", `Đã thêm nhân sự ${newStaff.name} vào trạm ${station.name}.`);
  };

  // Transfer staff from another station
  const handleTransferStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStaffId) return;

    const targetUser = staffList.find((s) => s.id === transferStaffId);
    if (!targetUser) return;

    const updated = staffList.map((s) => {
      if (s.id === transferStaffId) {
        return { ...s, station_id: station.id };
      }
      return s;
    });

    setStaffList(updated);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("wassup_staff_updated"));

    setShowTransferModal(false);
    setTransferStaffId("");
    showToast("success", `Đã điều chuyển nhân sự ${targetUser.name} tới trạm ${station.name}.`);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn" id="station-detail-overview-root">
      {/* Toast alert */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 font-sans text-xs font-bold ${
            toast.kind === "success"
              ? "bg-matte-black text-brand-green border-brand-green/30"
              : "bg-red-600 text-white border-red-500"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* TOP NAVIGATION & STATION HERO BANNER */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              id="btn-back-to-stations-list"
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer border-0 flex items-center gap-1.5 text-xs font-bold"
              title="Quay lại danh sách tất cả trạm"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
              <span>Quay lại</span>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-[#A2C62C] font-bold text-xs">
                  {station.code}
                </span>
                <h2 className="text-xl font-black font-display text-matte-black uppercase tracking-tight">
                  {station.name}
                </h2>
                {station.is_headquarters ? (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                    <Sparkles className="h-3 w-3 text-amber-600" />
                    Trạm Tổng (HQ)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                    <Building2 className="h-3 w-3 text-blue-600" />
                    Chi nhánh Franchise
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    station.status === "active"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      : "bg-red-100 text-red-900 border border-red-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${station.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                  {station.status === "active" ? "Đang vận hành" : "Tạm khóa"}
                </span>
              </div>
              <p className="text-xs text-mid-gray mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span>{station.address || "Chưa cập nhật địa chỉ"}</span>
                <span className="text-stone-300">·</span>
                <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span>{station.contact_phone || "Hotline N/A"}</span>
              </p>
            </div>
          </div>

          {/* Master Admin Actions on Station */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {onSelectStationContext && (
              <button
                onClick={() => onSelectStationContext(station.id)}
                id="btn-switch-station-context"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#A2C62C] text-xs font-bold uppercase tracking-wider transition cursor-pointer border-0 flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Chuyển góc nhìn trạm này</span>
              </button>
            )}

            {isMasterAdmin && (
              <>
                <button
                  onClick={() => onEditStation(station)}
                  id="btn-edit-station-info"
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer border-0 flex items-center gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Sửa thông tin</span>
                </button>

                {!station.is_headquarters && onStationStatusChange && (
                  <button
                    onClick={() => onStationStatusChange(station, station.status === "active" ? "locked" : "active")}
                    id="btn-toggle-station-lock"
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer border flex items-center gap-1.5 ${
                      station.status === "active"
                        ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {station.status === "active" ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Tạm khóa trạm</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Mở khóa trạm</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 4 VITAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: Station Admin */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Trưởng Trạm Phụ Trách</p>
              {stationAdmin ? (
                <div>
                  <p className="text-sm font-black text-slate-900 truncate">{stationAdmin.name}</p>
                  <p className="text-[10px] text-purple-700 font-bold font-sans">@{stationAdmin.username}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-stone-700">Trạm tổng điều phối</p>
                  <p className="text-[10px] text-stone-400">Tài khoản theo trạm</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Booth scale */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-green/20 text-forest-green flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Quy Mô Buồng Thi Công</p>
              <p className="text-sm font-black text-slate-900">4 buồng rửa tiêu chuẩn</p>
              <p className="text-[10px] text-stone-500">Áp lực cao & Nano bóng</p>
            </div>
          </div>

          {/* Card 3: Total Team Scale */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Đội Ngũ Nhân Sự Trạm</p>
              <p className="text-sm font-black text-slate-900">
                {stationUsers.length} <span className="text-xs font-normal text-stone-500">văn phòng</span> · {station.ktv_count ?? 10} <span className="text-xs font-normal text-stone-500">KTV</span>
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">100% tài khoản đã định danh</p>
            </div>
          </div>

          {/* Card 4: Operating Hours & Hotline */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Khung Giờ Mở Cửa</p>
              <p className="text-sm font-black text-slate-900">
                {station.opening_hours_jsonb?.open || "08:00"} — {station.opening_hours_jsonb?.close || "20:00"}
              </p>
              <p className="text-[10px] text-stone-500">Hoạt động tất cả các ngày</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: STATION ADMIN SPOTLIGHT (TRƯỞNG TRẠM PHỤ TRÁCH) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4" id="station-admin-spotlight-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-sm font-black font-display uppercase tracking-wider text-matte-black flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-purple-600" />
              QUẢN TRỊ VIÊN / TRƯỞNG TRẠM (STATION ADMIN)
            </h3>
            <p className="text-xs text-mid-gray mt-0.5">
              Cá nhân chịu trách nhiệm điều phối cao nhất, duyệt ca làm việc, xử lý tài chính và chất lượng tại trạm này.
            </p>
          </div>
        </div>

        {stationAdmin ? (
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-display font-black text-2xl shadow-md ring-4 ring-[#A2C62C]/40 shrink-0">
                {stationAdmin.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-black font-display text-white tracking-tight">{stationAdmin.name}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#A2C62C] text-matte-black text-[9px] font-black uppercase tracking-wider">
                    Trưởng Trạm
                  </span>
                  {stationAdmin.status === "locked" ? (
                    <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Đã khóa
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Unlock className="h-2.5 w-2.5" /> Đang hoạt động
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-300 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="text-stone-400 font-bold">Username:</span>
                    <strong className="text-white font-sans">{stationAdmin.username}</strong>
                  </span>
                  {stationAdmin.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#A2C62C]" />
                      <strong className="text-white font-sans">{stationAdmin.phone}</strong>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-purple-400" />
                    <span>Quyền quản trị phạm vi Trạm {station.code}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Master Admin controls for Station Admin */}
            {isMasterAdmin && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => handleResetPassword(stationAdmin)}
                  id="btn-reset-pw-admin"
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Cấp lại mật khẩu / PIN tạm thời cho Trưởng trạm"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Cấp lại MK / PIN</span>
                </button>

                <button
                  onClick={() => handleToggleLockUser(stationAdmin)}
                  id="btn-lock-admin"
                  className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    stationAdmin.status === "locked"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {stationAdmin.status === "locked" ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Mở khóa tài khoản</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Khóa tài khoản</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center space-y-2">
            <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Trạm đang do Master Admin và hệ thống tổng điều phối
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Tài khoản Trưởng Trạm được khởi tạo tự động cùng lúc khi tạo trạm vận hành trong hệ thống.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: STATION USERS & STAFF LIST (DANH SÁCH NHÂN SỰ CỦA TRẠM) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5" id="station-users-list-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-sm font-black font-display uppercase tracking-wider text-matte-black flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-forest-green" />
              TÀI KHOẢN & ĐỘI NGŨ NHÂN SỰ TRỰC THUỘC TRẠM ({stationUsers.length})
            </h3>
            <p className="text-xs text-mid-gray mt-0.5">
              Danh sách nhân sự văn phòng, thu ngân, lễ tân, kế toán làm việc tại trạm. (Tài khoản Master Admin được ẩn an toàn).
            </p>
          </div>

          {isMasterAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowTransferModal(true)}
                id="btn-transfer-staff"
                className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                title="Điều chuyển nhân sự từ trạm khác sang trạm này"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Điều chuyển nhân sự</span>
              </button>

              <button
                onClick={() => setShowAddStaffModal(true)}
                id="btn-add-staff-to-station"
                className="px-3.5 py-2 rounded-xl bg-matte-black hover:bg-gray-900 text-[#A2C62C] text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Thêm nhân sự trạm</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter bar: Role chips & search */}
        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Lọc vai trò:</span>
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                roleFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Tất cả ({stationUsers.length})
            </button>

            {roles.map((r) => {
              const count = stationUsers.filter((s) => s.role_id === r.id).length;
              return (
                <button
                  key={r.id}
                  onClick={() => setRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    roleFilter === r.id
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span>{r.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    roleFilter === r.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên/username/SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-500 border-b border-stone-200">
                <th className="p-3.5 pl-4 uppercase tracking-wider text-[10px] font-black">Họ tên Nhân sự</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px] font-black">Username</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px] font-black">SĐT Liên hệ</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px] font-black">Vai trò chuyên trách</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px] font-black text-center">Trạng thái</th>
                <th className="p-3.5 pr-4 uppercase tracking-wider text-[10px] font-black text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-sans text-xs italic">
                    Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, uIdx) => {
                  const isAdminOfStation = user.id === stationAdmin?.id;
                  return (
                    <tr
                      key={user.id ? `${user.id}-${uIdx}` : `u-${uIdx}`}
                      className={`hover:bg-stone-50/80 transition ${isAdminOfStation ? "bg-purple-50/30" : ""}`}
                    >
                      {/* Name & Avatar */}
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdminOfStation ? "bg-purple-600 text-white" : "bg-stone-200 text-stone-700"
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isAdminOfStation && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                                  Trưởng Trạm
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone-400">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-3.5 font-sans font-bold text-stone-600">
                        @{user.username}
                      </td>

                      {/* Phone */}
                      <td className="p-3.5 font-sans font-medium text-stone-700">
                        {user.phone || "—"}
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getRoleBadgeColor(user.role_id)}`}>
                          {getRoleName(user.role_id)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {user.status === "locked" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-extrabold text-[9px] uppercase tracking-wider">
                            <Lock className="h-3 w-3" /> Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[9px] uppercase tracking-wider">
                            <Unlock className="h-3 w-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isMasterAdmin && (
                            <>
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                title="Cấp lại mật khẩu / PIN tạm thời"
                              >
                                <KeyRound className="h-3 w-3 inline -mt-0.5 mr-0.5" />
                                MK
                              </button>

                              <button
                                onClick={() => handleToggleLockUser(user)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border ${
                                  user.status === "locked"
                                    ? "bg-white text-emerald-700 border-stone-200 hover:bg-emerald-50"
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                {user.status === "locked" ? "Mở khóa" : "Khóa"}
                              </button>

                              <button
                                onClick={() => setDeleteConfirmStaff(user)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer border-0"
                                title="Xóa tài khoản nhân sự"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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

      {/* SECTION 3: BOOTH INFRASTRUCTURE STATUS */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4" id="station-booths-overview">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black font-display uppercase tracking-wider text-matte-black flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-brand-green" />
            HẠ TẦNG BUỒNG THI CÔNG & THIẾT BỊ TRẠM ({station.code})
          </h3>
          <span className="text-[11px] text-stone-500">4 buồng công suất tiêu chuẩn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((boothNum) => (
            <div key={boothNum} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-sm text-slate-900">Buồng #{boothNum}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                  Sẵn sàng
                </span>
              </div>
              <p className="text-[11px] text-stone-600">Áp lực nước 150 bar · Bọt tuyết Nano</p>
              <div className="pt-2 border-t border-stone-200 text-[10px] text-stone-400 flex items-center justify-between">
                <span>Camera AI: <strong>Online</strong></span>
                <span>Cảm biến: <strong>Tốt</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD STAFF TO THIS STATION */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-matte-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                <h4 className="text-sm font-black font-display uppercase text-slate-900">
                  Thêm Nhân Sự Mới — {station.name}
                </h4>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  Họ và tên nhân sự *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Thu Hà"
                  value={newStaffForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewStaffForm((prev) => ({
                      ...prev,
                      name,
                      username: prev.username || name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10),
                    }));
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="thuha.cg"
                  value={newStaffForm.username}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans text-slate-800 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  Vai trò chuyên trách *
                </label>
                <select
                  value={newStaffForm.role_id}
                  onChange={(e) => setNewStaffForm((prev) => ({ ...prev, role_id: e.target.value }))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-500">
                Mật khẩu & mã PIN ban đầu mặc định là: <strong>123456</strong> (Yêu cầu đổi khi đăng nhập lần đầu).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-matte-black hover:bg-gray-900 text-[#A2C62C] rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border-0"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER STAFF FROM ANOTHER STATION */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-matte-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                <h4 className="text-sm font-black font-display uppercase text-slate-900">
                  Điều chuyển Nhân Sự Đến — {station.name}
                </h4>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 transition cursor-pointer border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferStaff} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-600 mb-1">
                  Chọn nhân sự từ trạm khác:
                </label>
                {otherStationsStaff.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">
                    Không có nhân sự nào từ trạm khác khả dụng để điều chuyển.
                  </p>
                ) : (
                  <select
                    value={transferStaffId}
                    onChange={(e) => setTransferStaffId(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="">-- Chọn nhân sự muốn điều chuyển --</option>
                    {otherStationsStaff.map((s) => {
                      const fromSt = allStations.find((st) => st.id === s.station_id);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} (@{s.username}) — Từ trạm: {fromSt?.name || s.station_id || "Khác"}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <p className="text-[11px] text-stone-500">
                Sau khi điều chuyển, nhân sự này sẽ được gán quyền làm việc và quản lý dữ liệu tại trạm <strong>{station.name}</strong>.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!transferStaffId}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border-0"
                >
                  Xác nhận điều chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEMP PASSWORD REVEAL */}
      {tempPasswordReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-matte-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-brand-green/20 text-forest-green flex items-center justify-center mx-auto">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black font-display uppercase text-slate-900">
                Cấp Lại Mật Khẩu Thành Công
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Mật khẩu / PIN tạm thời đã tạo cho <strong>{tempPasswordReveal.name}</strong>:
              </p>
            </div>

            <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 font-mono text-xl font-black text-slate-900 tracking-wider">
              {tempPasswordReveal.password}
            </div>

            <p className="text-[10px] text-stone-400">
              Vui lòng chuyển mã này cho nhân sự. Nhân sự cần đổi lại mật khẩu khi đăng nhập.
            </p>

            <button
              type="button"
              onClick={() => setTempPasswordReveal(null)}
              className="w-full py-2.5 bg-matte-black hover:bg-gray-900 text-[#A2C62C] font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm border-0"
            >
              Đã sao chép & Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-matte-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <h4 className="text-sm font-black font-display uppercase">Xóa tài khoản nhân sự?</h4>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteConfirmStaff.name}</strong> (@{deleteConfirmStaff.username}) khỏi trạm {station.name}? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteConfirmStaff)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border-0"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
