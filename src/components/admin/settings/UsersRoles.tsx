import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Plus, Key, X, Lock, Unlock, CheckCircle2, Trash2, ShieldCheck, KeyRound, AlertTriangle, Copy
} from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import { MODULES } from "../../../lib/rbac/modules";
import { ModuleCode } from "../../../types/rbac.types";

// S0.2-S0.5 — User & Phân quyền (US-0.2, US-0.3, US-0.7, FR-0.2).
// "User" ở Module 0 chỉ gồm 3 vai trò văn phòng — KTV (Module 8) bị lọc
// khỏi danh sách này (xem KTV_ROLE_NAME bên dưới, PRD làm rõ 20/07/2026).
const KTV_ROLE_NAME = "KTV";

interface RoleRow {
  id: string;
  name: string;
  is_system_default: boolean;
  station_scope_all: boolean;
}

interface StaffRow {
  id: string;
  name: string;
  phone: string | null;
  username: string;
  role_id: string;
  status: "active" | "locked";
}

interface PermRow {
  module_code: ModuleCode;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const ACTIONS: Array<{ key: keyof Omit<PermRow, "module_code">; label: string }> = [
  { key: "can_create", label: "C" },
  { key: "can_read", label: "R" },
  { key: "can_update", label: "U" },
  { key: "can_delete", label: "D" },
];

export default function UsersRoles() {
  const { can, staff: currentStaff } = useAuth();
  const canWrite = can("settings", "update") || can("settings", "create");
  const isMasterAdmin = currentStaff?.station_scope_all === true;

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [newRoleModalOpen, setNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [newStaffModalOpen, setNewStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", phone: "", username: "", password: "", role_id: "" });
  const [savingStaff, setSavingStaff] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<
    { kind: "user" | "role"; id: string; matchText: string } | null
  >(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [tempPasswordReveal, setTempPasswordReveal] = useState<{ name: string; password: string } | null>(null);

  const showToast = (kind: "success" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (selectedRoleId) void loadPermissions(selectedRoleId);
  }, [selectedRoleId]);

  async function loadAll() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: roleData, error: roleErr }, { data: staffData, error: staffErr }] = await Promise.all([
      supabase
        .from("roles")
        .select("id, name, is_system_default, station_scope_all")
        .order("is_system_default", { ascending: false }),
      supabase
        .from("staff")
        .select("id, name, phone, username, role_id, status")
        .is("deleted_at", null)
        .order("name"),
    ]);
    if (roleErr) showToast("error", roleErr.message);
    if (staffErr) showToast("error", staffErr.message);
    const roleList = (roleData as RoleRow[]) ?? [];
    // S0.2 chỉ gồm 3 vai trò văn phòng — KTV (Module 8) không phải User của
    // Module 0 (PRD làm rõ 20/07/2026), dù vẫn dùng chung bảng staff hôm nay.
    const ktvRoleIds = new Set(roleList.filter((r) => r.name === KTV_ROLE_NAME).map((r) => r.id));
    const staffFiltered = ((staffData as StaffRow[]) ?? []).filter((s) => !ktvRoleIds.has(s.role_id));
    setRoles(roleList);
    setStaffList(staffFiltered);
    setSelectedRoleId((prev) => prev ?? (roleList.length > 0 ? roleList[0].id : null));
    setLoading(false);
  }

  async function loadPermissions(roleId: string) {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("role_module_permissions")
      .select("module_code, can_create, can_read, can_update, can_delete")
      .eq("role_id", roleId);
    if (error) {
      showToast("error", error.message);
      return;
    }
    const byCode = new Map((data as PermRow[]).map((r) => [r.module_code, r]));
    setPerms(
      MODULES.map(
        (m) =>
          byCode.get(m.code) ?? {
            module_code: m.code,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
          }
      )
    );
  }

  async function togglePermission(moduleCode: ModuleCode, action: keyof Omit<PermRow, "module_code">) {
    if (!selectedRoleId || !canWrite || !supabase || !currentStaff) return;
    const current = perms.find((p) => p.module_code === moduleCode);
    if (!current) return;
    const nextValue = !current[action];
    setPerms((prev) => prev.map((p) => (p.module_code === moduleCode ? { ...p, [action]: nextValue } : p)));

    const { error } = await supabase.from("role_module_permissions").upsert(
      { role_id: selectedRoleId, ...current, [action]: nextValue },
      { onConflict: "role_id,module_code" }
    );
    if (error) {
      showToast("error", error.message);
      return;
    }
    const roleName = roles.find((r) => r.id === selectedRoleId)?.name ?? selectedRoleId;
    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "toggle_permission",
      entity: "role_module_permissions",
      entityId: selectedRoleId,
      before: { [action]: current[action] },
      after: { role: roleName, module: moduleCode, [action]: nextValue },
    });
  }

  async function handleCreateRole() {
    if (!newRoleName.trim() || !supabase || !currentStaff) return;
    const { data, error } = await supabase
      .from("roles")
      .insert({ name: newRoleName.trim(), is_system_default: false, created_by: currentStaff.id })
      .select("id")
      .single();
    if (error) {
      showToast("error", error.message);
      return;
    }
    await supabase.from("role_module_permissions").insert(
      MODULES.map((m) => ({ role_id: data.id, module_code: m.code, can_create: false, can_read: false, can_update: false, can_delete: false }))
    );
    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "create_role",
      entity: "roles",
      entityId: data.id,
      after: { name: newRoleName.trim() },
    });
    setNewRoleName("");
    setNewRoleModalOpen(false);
    await loadAll();
    setSelectedRoleId(data.id);
    showToast("success", `Đã tạo vai trò "${newRoleName.trim()}".`);
  }

  async function handleDeleteRoleClick(role: RoleRow) {
    if (role.is_system_default || !isMasterAdmin || !supabase) return;
    // Đếm TOÀN BỘ staff từng gán role này, kể cả đã xóa mềm — staff.role_id
    // là "on delete restrict" và staff đã xóa vẫn giữ nguyên role_id (lịch
    // sử không đổi), nên chỉ đếm staffList (đã lọc deleted_at is null) có
    // thể báo "0 người" trong khi DELETE thật vẫn vỡ FK.
    const { count, error: countError } = await supabase
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("role_id", role.id);
    if (countError) {
      showToast("error", countError.message);
      return;
    }
    if (count && count > 0) {
      showToast("error", `Không xóa được — còn ${count} nhân sự (kể cả đã xóa) từng gán vai trò này.`);
      return;
    }
    setConfirmDelete({ kind: "role", id: role.id, matchText: role.name });
    setConfirmInput("");
  }

  async function handleDeleteUserClick(row: StaffRow) {
    if (!isMasterAdmin || row.id === currentStaff?.id) return;
    setConfirmDelete({ kind: "user", id: row.id, matchText: row.username });
    setConfirmInput("");
  }

  async function handleConfirmDelete() {
    if (!confirmDelete || !supabase || !currentStaff || confirmInput !== confirmDelete.matchText) return;
    setDeleting(true);
    try {
      if (confirmDelete.kind === "role") {
        const role = roles.find((r) => r.id === confirmDelete.id);
        const { error } = await supabase.from("roles").delete().eq("id", confirmDelete.id);
        if (error) {
          showToast("error", error.message);
          return;
        }
        await logAudit({
          actorId: currentStaff.id,
          module: "settings",
          action: "delete_role",
          entity: "roles",
          entityId: confirmDelete.id,
          before: role,
        });
        if (selectedRoleId === confirmDelete.id) setSelectedRoleId(null);
        await loadAll();
        showToast("success", `Đã xóa vai trò "${confirmDelete.matchText}".`);
      } else {
        const staffRow = staffList.find((s) => s.id === confirmDelete.id);
        const { data, error } = await supabase.functions.invoke("admin-manage-staff", {
          body: { action: "delete", staff_id: confirmDelete.id },
        });
        if (error || (data && data.error)) {
          showToast("error", (data && data.error) || error?.message || "Xóa tài khoản thất bại.");
          return;
        }
        await logAudit({
          actorId: currentStaff.id,
          module: "settings",
          action: "delete_staff",
          entity: "staff",
          entityId: confirmDelete.id,
          before: staffRow,
        });
        await loadAll();
        showToast("success", `Đã xóa tài khoản "${confirmDelete.matchText}".`);
      }
      setConfirmDelete(null);
      setConfirmInput("");
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword(row: StaffRow) {
    if (!supabase || !currentStaff) return;
    if (!window.confirm(`Cấp lại mật khẩu cho ${row.name}? Mật khẩu hiện tại sẽ ngừng hoạt động ngay.`)) return;
    setResettingId(row.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-staff", {
        body: { action: "reset_password", staff_id: row.id },
      });
      if (error || (data && data.error)) {
        showToast("error", (data && data.error) || error?.message || "Cấp lại mật khẩu thất bại.");
        return;
      }
      await logAudit({
        actorId: currentStaff.id,
        module: "settings",
        action: "reset_password",
        entity: "staff",
        entityId: row.id,
        after: { force_password_change: true },
      });
      setTempPasswordReveal({ name: row.name, password: data.temp_password });
    } finally {
      setResettingId(null);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !currentStaff) return;
    setSavingStaff(true);
    const { data, error } = await supabase.functions.invoke("admin-manage-staff", {
      body: { action: "create", ...newStaff },
    });
    setSavingStaff(false);
    if (error || (data && data.error)) {
      showToast("error", (data && data.error) || error?.message || "Tạo tài khoản thất bại.");
      return;
    }
    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "create_staff",
      entity: "staff",
      entityId: data?.staff_id,
      after: { name: newStaff.name, username: newStaff.username, role_id: newStaff.role_id },
    });
    setNewStaffModalOpen(false);
    setNewStaff({ name: "", phone: "", username: "", password: "", role_id: "" });
    await loadAll();
    showToast("success", "Đã tạo tài khoản nhân sự mới.");
  }

  async function handleToggleLock(row: StaffRow) {
    if (!supabase || !currentStaff) return;
    const action = row.status === "active" ? "lock" : "unlock";
    const { error } = await supabase.functions.invoke("admin-manage-staff", {
      body: { action, staff_id: row.id },
    });
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: action === "lock" ? "lock_staff" : "unlock_staff",
      entity: "staff",
      entityId: row.id,
      before: { status: row.status },
      after: { status: action === "lock" ? "locked" : "active" },
    });
    await loadAll();
    showToast("success", action === "lock" ? `Đã khóa tài khoản ${row.name}.` : `Đã mở khóa tài khoản ${row.name}.`);
  }

  async function handleChangeRole(row: StaffRow, roleId: string) {
    if (!supabase || !currentStaff || roleId === row.role_id) return;
    if (row.id === currentStaff.id || !isMasterAdmin) return;
    const { error } = await supabase.from("staff").update({ role_id: roleId }).eq("id", row.id);
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "change_staff_role",
      entity: "staff",
      entityId: row.id,
      before: { role_id: row.role_id },
      after: { role_id: roleId },
    });
    await loadAll();
    showToast("success", `Đã đổi vai trò của ${row.name}.`);
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  return (
    <div className="space-y-6">
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

      {/* ---- Vai trò & ma trận quyền ---- */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-purple-600" />
              VAI TRÒ & MA TRẬN PHÂN QUYỀN
            </h3>
            <p className="text-[11px] text-mid-gray font-sans mt-0.5">8 module × 4 quyền (C/R/U/D). 4 vai trò mặc định không xóa được, nhưng sửa được từng ô.</p>
          </div>
          {canWrite && (
            <button
              onClick={() => setNewRoleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo vai trò mới
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoleId(r.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${
                selectedRoleId === r.id ? "bg-matte-black text-white" : "bg-gray-100 text-mid-gray hover:bg-gray-200"
              }`}
            >
              {r.name}
              {r.is_system_default && <span className="ml-1.5 text-[9px] opacity-70">(mặc định)</span>}
            </button>
          ))}
        </div>

        {selectedRoleId && (
          <div className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-gray-50 text-mid-gray font-bold text-[10px] uppercase border-b border-gray-200">
                    <th className="p-3">Module (8 phân hệ)</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="p-3 text-center">{a.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MODULES.map((m) => {
                    const row = perms.find((p) => p.module_code === m.code);
                    return (
                      <tr key={m.code} className="hover:bg-gray-50/50 transition">
                        <td className="p-3 font-semibold text-matte-black text-xs">{m.order}. {m.name}</td>
                        {ACTIONS.map((a) => {
                          const hasPerm = row?.[a.key] ?? false;
                          return (
                            <td key={a.key} className="p-3 text-center">
                              <button
                                type="button"
                                disabled={!canWrite}
                                onClick={() => togglePermission(m.code, a.key)}
                                className={`h-6 w-9 rounded-md border font-black text-[10px] inline-flex items-center justify-center transition-all ${
                                  hasPerm
                                    ? "bg-purple-600 text-white border-purple-600"
                                    : "bg-white text-gray-300 border-gray-250 hover:bg-gray-100"
                                } ${!canWrite ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                              >
                                {hasPerm ? a.label : "—"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {canWrite && isMasterAdmin && !roles.find((r) => r.id === selectedRoleId)?.is_system_default && (
              <button
                onClick={() => {
                  const role = roles.find((r) => r.id === selectedRoleId);
                  if (role) void handleDeleteRoleClick(role);
                }}
                className="mt-4 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa vai trò này
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---- Danh sách nhân sự ---- */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3 flex justify-between items-center flex-wrap gap-3">
          <h3 className="text-sm font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-forest-green" />
            NHÂN SỰ ({staffList.length})
          </h3>
          {canWrite && (
            <button
              onClick={() => setNewStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-matte-black hover:bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm nhân sự
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Tên</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Username</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">SĐT</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Vai trò</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Trạng thái</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-mid-gray font-sans text-xs">Chưa có nhân sự nào.</td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-warm-white/30 transition">
                    <td className="p-3 font-extrabold text-matte-black">{s.name}</td>
                    <td className="p-3 font-mono text-mid-gray">{s.username}</td>
                    <td className="p-3 font-mono text-mid-gray">{s.phone || "—"}</td>
                    <td className="p-3">
                      {canWrite && isMasterAdmin && s.id !== currentStaff?.id ? (
                        <select
                          value={s.role_id}
                          onChange={(e) => void handleChangeRole(s, e.target.value)}
                          className="bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-forest-green"
                        >
                          {roles.filter((r) => r.name !== KTV_ROLE_NAME).map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        roles.find((r) => r.id === s.role_id)?.name ?? "—"
                      )}
                    </td>
                    <td className="p-3">
                      {s.status === "locked" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-extrabold text-[9px] uppercase tracking-wider">
                          <Lock className="h-3 w-3" /> Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 font-extrabold text-[9px] uppercase tracking-wider">
                          <Unlock className="h-3 w-3" /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {canWrite && (
                          <button
                            onClick={() => void handleResetPassword(s)}
                            disabled={resettingId === s.id}
                            title="Cấp lại mật khẩu"
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer shadow-sm border bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 disabled:opacity-60"
                          >
                            <KeyRound className="h-3.5 w-3.5 inline -mt-0.5" /> {resettingId === s.id ? "..." : "Cấp lại MK"}
                          </button>
                        )}
                        {canWrite && s.id !== currentStaff?.id && (
                          <button
                            onClick={() => void handleToggleLock(s)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer shadow-sm border ${
                              s.status === "locked"
                                ? "bg-white text-green-700 border-[#e5e5e5] hover:bg-green-50 hover:border-green-200"
                                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {s.status === "locked" ? "Mở khóa" : "Khóa"}
                          </button>
                        )}
                        {isMasterAdmin && s.id !== currentStaff?.id && (
                          <button
                            onClick={() => void handleDeleteUserClick(s)}
                            title="Xóa vĩnh viễn"
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer shadow-sm border bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5 inline -mt-0.5" /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Drawer: tạo vai trò ---- */}
      <AnimatePresence>
        {newRoleModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewRoleModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-[#e5e5e5] text-slate-800 font-sans"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                  Tạo vai trò mới
                </h3>
                <button
                  type="button"
                  onClick={() => setNewRoleModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Tên vai trò</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ví dụ: Thủ kho"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="pt-4 flex gap-3 mt-auto">
                  <button onClick={() => setNewRoleModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-stone-500 hover:bg-stone-50 transition text-xs font-extrabold uppercase cursor-pointer">Hủy</button>
                  <button onClick={() => void handleCreateRole()} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer">Tạo</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---- Drawer: thêm nhân sự ---- */}
      <AnimatePresence>
        {newStaffModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewStaffModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-[#e5e5e5] text-slate-800 font-sans"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  Thêm nhân sự
                </h3>
                <button
                  type="button"
                  onClick={() => setNewStaffModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-6 flex-1 overflow-y-auto space-y-3.5 text-left flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Họ tên</label>
                    <input type="text" required value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">SĐT</label>
                    <input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Username</label>
                    <input type="text" required value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                      className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Mật khẩu khởi tạo</label>
                    <input type="password" required minLength={6} value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Vai trò</label>
                    <select required value={newStaff.role_id} onChange={(e) => setNewStaff({ ...newStaff, role_id: e.target.value })}
                      className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-purple-500">
                      <option value="">Chọn vai trò...</option>
                      {roles.filter((r) => r.name !== KTV_ROLE_NAME).map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setNewStaffModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-stone-500 hover:bg-stone-50 transition text-xs font-extrabold uppercase cursor-pointer">Hủy</button>
                  <button type="submit" disabled={savingStaff} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer disabled:opacity-60">
                    {savingStaff ? "Đang tạo..." : "Tạo tài khoản"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---- Modal: gõ tên xác nhận xóa (dùng chung user/role, US-0.7) ---- */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => { setConfirmDelete(null); setConfirmInput(""); }}
              className="absolute top-4 right-4 text-mid-gray hover:text-matte-black cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-black font-display uppercase mb-3 flex items-center gap-2 border-b border-[#e5e5e5] pb-3 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Xóa vĩnh viễn — không hoàn tác
            </h3>
            <p className="text-xs font-sans text-mid-gray mb-4">
              {confirmDelete.kind === "user"
                ? "Tài khoản sẽ ngừng đăng nhập ngay lập tức và biến mất khỏi danh sách nhân sự."
                : "Vai trò và toàn bộ ma trận quyền của vai trò này sẽ bị xóa vĩnh viễn."}
              {" "}Gõ chính xác{" "}
              <span className="font-mono font-extrabold text-matte-black">"{confirmDelete.matchText}"</span>{" "}
              để xác nhận (phân biệt hoa/thường).
            </p>
            <input
              type="text"
              autoFocus
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={confirmDelete.matchText}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono text-matte-black focus:outline-none focus:border-red-500"
            />
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => { setConfirmDelete(null); setConfirmInput(""); }}
                className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold uppercase cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleConfirmDelete()}
                disabled={confirmInput !== confirmDelete.matchText || deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal: hiện mật khẩu tạm 1 lần (US-0.2) ---- */}
      {tempPasswordReveal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-black font-display uppercase mb-3 flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
              <KeyRound className="h-5 w-5 text-blue-600" /> Mật khẩu tạm — {tempPasswordReveal.name}
            </h3>
            <p className="text-xs font-sans text-mid-gray mb-3">
              Mật khẩu này CHỈ hiển thị 1 lần — hãy sao chép và gửi ngay cho nhân sự qua kênh ngoài hệ thống. Nhân sự bắt buộc phải đổi mật khẩu ở lần đăng nhập kế tiếp.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 bg-warm-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm font-mono text-matte-black tracking-wider select-all">
                {tempPasswordReveal.password}
              </code>
              <button
                type="button"
                title="Sao chép"
                onClick={() => void navigator.clipboard.writeText(tempPasswordReveal.password)}
                className="p-2.5 rounded-xl border border-[#e5e5e5] hover:bg-warm-white transition cursor-pointer"
              >
                <Copy className="h-4 w-4 text-mid-gray" />
              </button>
            </div>
            <button
              onClick={() => setTempPasswordReveal(null)}
              className="w-full py-2.5 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer"
            >
              Đã sao chép — Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
