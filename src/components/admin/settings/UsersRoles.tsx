import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Plus, Key, X, Lock, Unlock, CheckCircle2, Trash2, ShieldCheck, KeyRound, AlertTriangle, Copy, Edit3,
  Building2, Filter, Search, Sparkles
} from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import { MODULES } from "../../../lib/rbac/modules";
import { ModuleCode } from "../../../types/rbac.types";

// S0.2-S0.5 — User & Phân quyền (US-0.2, US-0.3, US-0.7, FR-0.2).
// "User" ở Module 0 chỉ gồm các vai trò văn phòng — KTV (Module 8) bị lọc
// khỏi danh sách này (xem KTV_ROLE_NAME bên dưới, PRD làm rõ 20/07/2026).
const KTV_ROLE_NAME = "KTV";

export interface StationOption {
  id: string;
  name: string;
  is_headquarters?: boolean;
}

const DEFAULT_STATIONS: StationOption[] = [
  { id: "st-001", name: "WASSUP Station - Cầu Giấy (Trạm Tổng)", is_headquarters: true },
  { id: "st-002", name: "WASSUP Station - Mỹ Đình", is_headquarters: false },
  { id: "st-003", name: "WASSUP Station - Hà Đông", is_headquarters: false },
];

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
  station_id?: string | null;
  status: "active" | "locked";
}

interface PermRow {
  module_code: ModuleCode;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const DEFAULT_ROLES: RoleRow[] = [
  { id: "master_admin", name: "Master Admin", is_system_default: true, station_scope_all: true },
  { id: "manager", name: "Quản lý Trạm", is_system_default: true, station_scope_all: false },
  { id: "accountant", name: "Kế toán Trưởng", is_system_default: true, station_scope_all: false },
  { id: "receptionist", name: "Lễ tân / Thu ngân", is_system_default: true, station_scope_all: false },
];

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
  const [stations, setStations] = useState<StationOption[]>(DEFAULT_STATIONS);
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>("all");
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>("");

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [newRoleModalOpen, setNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [editRoleName, setEditRoleName] = useState("");

  const [newStaffModalOpen, setNewStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", phone: "", username: "", password: "", role_id: "", station_id: "st-001" });
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

    const handleUpdate = () => {
      void loadAll();
    };
    window.addEventListener("wassup_stations_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("wassup_stations_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedRoleId) void loadPermissions(selectedRoleId);
  }, [selectedRoleId]);

  async function loadAll() {
    setLoading(true);

    // Load Stations first
    let localStations: StationOption[] = DEFAULT_STATIONS;
    const storedStations = localStorage.getItem("wassup_stations");
    if (storedStations) {
      try {
        const parsed = JSON.parse(storedStations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStations = parsed.map((s: any) => ({
            id: s.id,
            name: s.name,
            is_headquarters: s.is_headquarters ?? false,
          }));
        }
      } catch (e) {}
    }

    if (supabase) {
      try {
        const { data: dbSt } = await supabase.from("stations").select("id, name, is_headquarters");
        if (dbSt && dbSt.length > 0) {
          const merged = dbSt.map((d: any) => {
            const loc = localStations.find((l) => l.id === d.id);
            return {
              id: d.id,
              name: loc ? loc.name : d.name,
              is_headquarters: d.is_headquarters ?? false,
            };
          });
          localStations = merged;
        }
      } catch (e) {}
    }
    setStations(localStations);

    const storedRoles = localStorage.getItem("wassup_roles");
    let localRolesList: RoleRow[] | null = null;
    if (storedRoles) {
      try {
        localRolesList = JSON.parse(storedRoles);
      } catch (e) {}
    }

    let roleList: RoleRow[] = localRolesList || DEFAULT_ROLES;
    let staffFiltered: StaffRow[] = [];

    if (supabase) {
      try {
        const [{ data: roleData, error: roleErr }, { data: staffData, error: staffErr }] = await Promise.all([
          supabase
            .from("roles")
            .select("id, name, is_system_default, station_scope_all")
            .order("is_system_default", { ascending: false }),
          supabase
            .from("staff")
            .select("id, name, phone, username, role_id, station_id, status")
            .is("deleted_at", null)
            .order("name"),
        ]);

        if (!roleErr && roleData && roleData.length > 0) {
          const dbRoles = roleData as RoleRow[];
          const existingIds = new Set(dbRoles.map((r) => r.id));
          const extraLocal = (localRolesList || []).filter((r) => !existingIds.has(r.id));
          roleList = [...dbRoles, ...extraLocal];
        }

        if (!staffErr && staffData && staffData.length > 0) {
          const ktvRoleIds = new Set(roleList.filter((r) => r.name === KTV_ROLE_NAME).map((r) => r.id));
          staffFiltered = ((staffData as StaffRow[]) ?? []).filter((s) => !ktvRoleIds.has(s.role_id));
        }
      } catch (e) {
        console.warn("Supabase loadAll warning:", e);
      }
    }

    if (staffFiltered.length === 0) {
      const storedStaff = localStorage.getItem("wassup_staff_list");
      if (storedStaff) {
        try {
          staffFiltered = JSON.parse(storedStaff);
        } catch (e) {}
      } else {
        const defaultStId = localStations[0]?.id || "st-001";
        const secondStId = localStations[1]?.id || defaultStId;
        const thirdStId = localStations[2]?.id || defaultStId;

        staffFiltered = [
          { id: "admin-001", name: "Trần Minh Quân", phone: "0901234567", username: "admin", role_id: "master_admin", station_id: "all", status: "active" },
          { id: "mgr-001", name: "Nguyễn Văn Hùng", phone: "0912345678", username: "quanly.cg", role_id: "manager", station_id: defaultStId, status: "active" },
          { id: "acc-001", name: "Lê Thị Mai", phone: "0923456789", username: "ketoan.cg", role_id: "accountant", station_id: defaultStId, status: "active" },
          { id: "rec-001", name: "Phạm Thu Trang", phone: "0934567890", username: "letan.cg", role_id: "receptionist", station_id: defaultStId, status: "active" },
          { id: "mgr-002", name: "Trần Thị Cúc", phone: "0945678901", username: "quanly.md", role_id: "manager", station_id: secondStId, status: "active" },
          { id: "rec-002", name: "Hoàng Văn Nam", phone: "0956789012", username: "letan.md", role_id: "receptionist", station_id: secondStId, status: "active" },
          { id: "mgr-003", name: "Vũ Hải Đăng", phone: "0967890123", username: "quanly.hd", role_id: "manager", station_id: thirdStId, status: "active" },
        ];
      }
    }

    // Ensure all staff rows have a station_id field
    const defaultStId = localStations[0]?.id || "st-001";
    staffFiltered = staffFiltered.map((s) => ({
      ...s,
      station_id: s.station_id || (s.role_id === "master_admin" ? "all" : defaultStId),
    }));

    setRoles(roleList);
    localStorage.setItem("wassup_roles", JSON.stringify(roleList));
    setStaffList(staffFiltered);
    localStorage.setItem("wassup_staff_list", JSON.stringify(staffFiltered));

    setSelectedRoleId((prev) => {
      if (prev && roleList.some((r) => r.id === prev)) return prev;
      return roleList.length > 0 ? roleList[0].id : null;
    });

    setLoading(false);
  }

  async function loadPermissions(roleId: string) {
    const storedPerms = localStorage.getItem(`wassup_role_perms_${roleId}`);
    let localPerms: PermRow[] | null = null;
    if (storedPerms) {
      try {
        localPerms = JSON.parse(storedPerms);
      } catch (e) {}
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("role_module_permissions")
          .select("module_code, can_create, can_read, can_update, can_delete")
          .eq("role_id", roleId);

        if (!error && data && data.length > 0) {
          const byCode = new Map((data as PermRow[]).map((r) => [r.module_code, r]));
          const merged = MODULES.map(
            (m) =>
              byCode.get(m.code) ?? {
                module_code: m.code,
                can_create: roleId === "master_admin",
                can_read: true,
                can_update: roleId === "master_admin",
                can_delete: roleId === "master_admin",
              }
          );
          setPerms(merged);
          localStorage.setItem(`wassup_role_perms_${roleId}`, JSON.stringify(merged));
          return;
        }
      } catch (e) {
        console.warn("Supabase permissions load warning:", e);
      }
    }

    if (localPerms && localPerms.length > 0) {
      setPerms(localPerms);
      return;
    }

    const isFull = roleId === "master_admin";
    const defaultMatrix: PermRow[] = MODULES.map((m) => ({
      module_code: m.code,
      can_create: isFull || roleId === "manager",
      can_read: true,
      can_update: isFull || roleId === "manager",
      can_delete: isFull,
    }));
    setPerms(defaultMatrix);
    localStorage.setItem(`wassup_role_perms_${roleId}`, JSON.stringify(defaultMatrix));
  }

  async function togglePermission(moduleCode: ModuleCode, action: keyof Omit<PermRow, "module_code">) {
    if (!selectedRoleId || !canWrite || !currentStaff) return;
    const current = perms.find((p) => p.module_code === moduleCode);
    if (!current) return;
    const nextValue = !current[action];
    const updatedPerms = perms.map((p) => (p.module_code === moduleCode ? { ...p, [action]: nextValue } : p));
    setPerms(updatedPerms);
    localStorage.setItem(`wassup_role_perms_${selectedRoleId}`, JSON.stringify(updatedPerms));

    if (supabase) {
      try {
        const { error } = await supabase.from("role_module_permissions").upsert(
          { role_id: selectedRoleId, ...current, [action]: nextValue },
          { onConflict: "role_id,module_code" }
        );
        if (error) {
          console.warn("Supabase permission update warning:", error.message);
        }
      } catch (e) {
        console.warn("Supabase permission update exception:", e);
      }
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
    if (!newRoleName.trim() || !currentStaff) return;
    const name = newRoleName.trim();
    const generatedId = `role-${Date.now()}`;
    const newRole: RoleRow = {
      id: generatedId,
      name,
      is_system_default: false,
      station_scope_all: false,
    };

    let finalRoleId = generatedId;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("roles")
          .insert({ name, is_system_default: false })
          .select("id")
          .single();

        if (!error && data?.id) {
          finalRoleId = data.id;
          newRole.id = finalRoleId;
        } else if (error) {
          console.warn("Supabase role create warning:", error.message);
        }
      } catch (e) {
        console.warn("Supabase role create exception:", e);
      }

      try {
        await supabase.from("role_module_permissions").insert(
          MODULES.map((m) => ({ role_id: finalRoleId, module_code: m.code, can_create: false, can_read: true, can_update: false, can_delete: false }))
        );
      } catch (e) {}
    }

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    localStorage.setItem("wassup_roles", JSON.stringify(updatedRoles));

    const initialPerms: PermRow[] = MODULES.map((m) => ({
      module_code: m.code,
      can_create: false,
      can_read: true,
      can_update: false,
      can_delete: false,
    }));
    localStorage.setItem(`wassup_role_perms_${finalRoleId}`, JSON.stringify(initialPerms));

    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "create_role",
      entity: "roles",
      entityId: finalRoleId,
      after: { name },
    });

    setNewRoleName("");
    setNewRoleModalOpen(false);
    setSelectedRoleId(finalRoleId);
    showToast("success", `Đã tạo vai trò "${name}" thành công.`);
  }

  async function handleUpdateRoleName() {
    if (!editingRole || !editRoleName.trim() || !currentStaff) return;
    const newName = editRoleName.trim();
    const roleId = editingRole.id;

    if (supabase) {
      try {
        const { error } = await supabase
          .from("roles")
          .update({ name: newName })
          .eq("id", roleId);

        if (error) {
          console.warn("Supabase update role name warning:", error.message);
        }
      } catch (e) {
        console.warn("Supabase update role name exception:", e);
      }
    }

    const updatedRoles = roles.map((r) => (r.id === roleId ? { ...r, name: newName } : r));
    setRoles(updatedRoles);
    localStorage.setItem("wassup_roles", JSON.stringify(updatedRoles));

    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "update_role_name",
      entity: "roles",
      entityId: roleId,
      before: { name: editingRole.name },
      after: { name: newName },
    });

    setEditRoleModalOpen(false);
    setEditingRole(null);
    showToast("success", `Đã đổi tên vai trò thành "${newName}".`);
  }

  async function handleDeleteRoleClick(role: RoleRow) {
    if (role.is_system_default || !isMasterAdmin) return;

    if (supabase) {
      try {
        const { count } = await supabase
          .from("staff")
          .select("id", { count: "exact", head: true })
          .eq("role_id", role.id);

        if (count && count > 0) {
          showToast("error", `Không xóa được — còn ${count} nhân sự đang được gán vai trò này.`);
          return;
        }
      } catch (e) {}
    }

    const assignedLocal = staffList.filter((s) => s.role_id === role.id).length;
    if (assignedLocal > 0) {
      showToast("error", `Không xóa được — còn ${assignedLocal} nhân sự đang được gán vai trò này.`);
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
    if (!confirmDelete || !currentStaff || confirmInput !== confirmDelete.matchText) return;
    setDeleting(true);
    try {
      if (confirmDelete.kind === "role") {
        const role = roles.find((r) => r.id === confirmDelete.id);
        if (supabase) {
          try {
            await supabase.from("roles").delete().eq("id", confirmDelete.id);
          } catch (e) {}
        }
        const updatedRoles = roles.filter((r) => r.id !== confirmDelete.id);
        setRoles(updatedRoles);
        localStorage.setItem("wassup_roles", JSON.stringify(updatedRoles));
        localStorage.removeItem(`wassup_role_perms_${confirmDelete.id}`);

        await logAudit({
          actorId: currentStaff.id,
          module: "settings",
          action: "delete_role",
          entity: "roles",
          entityId: confirmDelete.id,
          before: role,
        });

        if (selectedRoleId === confirmDelete.id) {
          setSelectedRoleId(updatedRoles.length > 0 ? updatedRoles[0].id : null);
        }
        showToast("success", `Đã xóa vai trò "${confirmDelete.matchText}".`);
      } else {
        const staffRow = staffList.find((s) => s.id === confirmDelete.id);
        if (supabase) {
          try {
            await supabase.functions.invoke("admin-manage-staff", {
              body: { action: "delete", staff_id: confirmDelete.id },
            });
          } catch (e) {}
        }
        const updatedStaff = staffList.filter((s) => s.id !== confirmDelete.id);
        setStaffList(updatedStaff);
        localStorage.setItem("wassup_staff_list", JSON.stringify(updatedStaff));

        await logAudit({
          actorId: currentStaff.id,
          module: "settings",
          action: "delete_staff",
          entity: "staff",
          entityId: confirmDelete.id,
          before: staffRow,
        });
        showToast("success", `Đã xóa tài khoản "${confirmDelete.matchText}".`);
      }
      setConfirmDelete(null);
      setConfirmInput("");
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword(row: StaffRow) {
    if (!currentStaff) return;
    if (!window.confirm(`Cấp lại mật khẩu cho ${row.name}? Mật khẩu hiện tại sẽ ngừng hoạt động ngay.`)) return;
    setResettingId(row.id);
    try {
      let tempPass = "Wassup@" + Math.floor(100000 + Math.random() * 900000);
      if (supabase) {
        try {
          const { data, error } = await supabase.functions.invoke("admin-manage-staff", {
            body: { action: "reset_password", staff_id: row.id },
          });
          if (!error && data?.temp_password) {
            tempPass = data.temp_password;
          }
        } catch (e) {}
      }

      await logAudit({
        actorId: currentStaff.id,
        module: "settings",
        action: "reset_password",
        entity: "staff",
        entityId: row.id,
        after: { force_password_change: true },
      });
      setTempPasswordReveal({ name: row.name, password: tempPass });
    } finally {
      setResettingId(null);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!currentStaff) return;
    setSavingStaff(true);

    const generatedStaffId = `staff-${Date.now()}`;
    const newStaffObj: StaffRow = {
      id: generatedStaffId,
      name: newStaff.name,
      phone: newStaff.phone || null,
      username: newStaff.username,
      role_id: newStaff.role_id,
      status: "active",
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.functions.invoke("admin-manage-staff", {
          body: { action: "create", ...newStaff },
        });
        if (!error && data?.staff_id) {
          newStaffObj.id = data.staff_id;
        }
      } catch (e) {}
    }

    const updatedStaff = [...staffList, newStaffObj];
    setStaffList(updatedStaff);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updatedStaff));

    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "create_staff",
      entity: "staff",
      entityId: newStaffObj.id,
      after: { name: newStaff.name, username: newStaff.username, role_id: newStaff.role_id },
    });

    setSavingStaff(false);
    setNewStaffModalOpen(false);
    setNewStaff({ name: "", phone: "", username: "", password: "", role_id: "", station_id: "st-001" });
    showToast("success", "Đã tạo tài khoản nhân sự mới.");
  }

  async function handleToggleLock(row: StaffRow) {
    if (!currentStaff) return;
    const action = row.status === "active" ? "lock" : "unlock";
    const newStatus: "active" | "locked" = action === "lock" ? "locked" : "active";

    if (supabase) {
      try {
        await supabase.functions.invoke("admin-manage-staff", {
          body: { action, staff_id: row.id },
        });
      } catch (e) {}
    }

    const updatedStaff = staffList.map((s) => (s.id === row.id ? { ...s, status: newStatus } : s));
    setStaffList(updatedStaff);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updatedStaff));

    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: action === "lock" ? "lock_staff" : "unlock_staff",
      entity: "staff",
      entityId: row.id,
      before: { status: row.status },
      after: { status: newStatus },
    });
    showToast("success", action === "lock" ? `Đã khóa tài khoản ${row.name}.` : `Đã mở khóa tài khoản ${row.name}.`);
  }

  async function handleChangeRole(row: StaffRow, roleId: string) {
    if (!currentStaff || roleId === row.role_id) return;
    if (row.id === currentStaff.id || !isMasterAdmin) return;

    if (supabase) {
      try {
        const { error } = await supabase.from("staff").update({ role_id: roleId }).eq("id", row.id);
        if (error) {
          console.warn("Supabase change staff role warning:", error.message);
        }
      } catch (e) {
        console.warn("Supabase change staff role exception:", e);
      }
    }

    const updatedStaff = staffList.map((s) => (s.id === row.id ? { ...s, role_id: roleId } : s));
    setStaffList(updatedStaff);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updatedStaff));

    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "change_staff_role",
      entity: "staff",
      entityId: row.id,
      before: { role_id: row.role_id },
      after: { role_id: roleId },
    });
    showToast("success", `Đã đổi vai trò của ${row.name}.`);
  }

  async function handleChangeStation(row: StaffRow, stationId: string) {
    if (!currentStaff || stationId === row.station_id) return;
    if (row.id === currentStaff.id || !isMasterAdmin) return;

    if (supabase) {
      try {
        const { error } = await supabase.from("staff").update({ station_id: stationId }).eq("id", row.id);
        if (error) {
          console.warn("Supabase change staff station warning:", error.message);
        }
      } catch (e) {
        console.warn("Supabase change staff station exception:", e);
      }
    }

    const updatedStaff = staffList.map((s) => (s.id === row.id ? { ...s, station_id: stationId } : s));
    setStaffList(updatedStaff);
    localStorage.setItem("wassup_staff_list", JSON.stringify(updatedStaff));

    await logAudit({
      actorId: currentStaff.id,
      module: "settings",
      action: "change_staff_station",
      entity: "staff",
      entityId: row.id,
      before: { station_id: row.station_id },
      after: { station_id: stationId },
    });
    showToast("success", `Đã điều chuyển nhân sự ${row.name} tới trạm làm việc mới.`);
  }

  function getStationName(stationId?: string | null): string {
    if (!stationId || stationId === "all") return "Toàn hệ thống (HQ)";
    const found = stations.find((st) => st.id === stationId);
    return found ? found.name : stationId;
  }

  const displayStaffList = staffList.filter((s) => {
    if (selectedStationFilter !== "all") {
      if (s.station_id && s.station_id !== "all" && s.station_id !== selectedStationFilter) {
        return false;
      }
    }
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      const nameMatch = s.name.toLowerCase().includes(q);
      const userMatch = s.username.toLowerCase().includes(q);
      const phoneMatch = s.phone?.toLowerCase().includes(q) ?? false;
      if (!nameMatch && !userMatch && !phoneMatch) return false;
    }
    return true;
  });

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
            <p className="text-[11px] text-mid-gray font-sans mt-0.5">8 module × 4 quyền (C/R/U/D). Quản lý cấu hình vai trò & phân quyền hệ thống WASSUP OS.</p>
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

        <div className="flex flex-wrap items-center gap-2">
          {roles.map((r) => (
            <div key={r.id} className="inline-flex items-center gap-1">
              <button
                onClick={() => setSelectedRoleId(r.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${
                  selectedRoleId === r.id ? "bg-matte-black text-white shadow-sm" : "bg-gray-100 text-mid-gray hover:bg-gray-200"
                }`}
              >
                {r.name}
                {r.is_system_default && <span className="ml-1.5 text-[9px] opacity-70">(mặc định)</span>}
              </button>
              {canWrite && selectedRoleId === r.id && (
                <button
                  type="button"
                  title="Sửa tên vai trò"
                  onClick={() => {
                    setEditingRole(r);
                    setEditRoleName(r.name);
                    setEditRoleModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition cursor-pointer border border-stone-200"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="border-b border-gray-100 pb-4 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-forest-green" />
              QUẢN LÝ TÀI KHOẢN NHÂN SỰ ({displayStaffList.length}/{staffList.length})
            </h3>
            <p className="text-[11px] text-mid-gray mt-0.5">
              Phân quyền và gán tài khoản nhân sự quản lý/lễ tân/kế toán cho từng trạm vận hành.
            </p>
          </div>

          {canWrite && (
            <button
              onClick={() => {
                setNewStaff({
                  name: "",
                  phone: "",
                  username: "",
                  password: "",
                  role_id: roles[0]?.id || "",
                  station_id: selectedStationFilter !== "all" ? selectedStationFilter : (stations[0]?.id || "st-001"),
                });
                setNewStaffModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-matte-black hover:bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm nhân sự
            </button>
          )}
        </div>

        {/* Thanh lọc theo Trạm & Tìm kiếm */}
        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-purple-600" />
              Lọc theo Trạm:
            </span>

            <button
              onClick={() => setSelectedStationFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                selectedStationFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Tất cả các Trạm ({staffList.length})
            </button>

            {stations.map((st) => {
              const count = staffList.filter((s) => s.station_id === st.id).length;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStationFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    selectedStationFilter === st.id
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  {st.name}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    selectedStationFilter === st.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
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
              placeholder="Tìm theo tên/username..."
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Họ tên Nhân sự</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Username</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">SĐT</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Trạm Vận Hành</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Vai trò</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Trạng thái</th>
                <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {displayStaffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-mid-gray font-sans text-xs">
                    Không tìm thấy tài khoản nhân sự phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                displayStaffList.map((s) => (
                  <tr key={s.id} className="hover:bg-warm-white/30 transition">
                    <td className="p-3 font-extrabold text-matte-black">{s.name}</td>
                    <td className="p-3 font-mono text-mid-gray">{s.username}</td>
                    <td className="p-3 font-mono text-mid-gray">{s.phone || "—"}</td>

                    {/* Cột Trạm làm việc */}
                    <td className="p-3">
                      {canWrite && isMasterAdmin && s.id !== currentStaff?.id ? (
                        <select
                          value={s.station_id || "all"}
                          onChange={(e) => void handleChangeStation(s, e.target.value)}
                          className="bg-stone-50 border border-[#e5e5e5] rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="all">Toàn hệ thống (HQ)</option>
                          {stations.map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg font-bold text-[10px]">
                          <Building2 className="h-3 w-3 text-purple-600" />
                          {getStationName(s.station_id)}
                        </span>
                      )}
                    </td>

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

      {/* ---- Drawer: sửa tên vai trò ---- */}
      <AnimatePresence>
        {editRoleModalOpen && editingRole && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setEditRoleModalOpen(false); setEditingRole(null); }}
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
                  <Edit3 className="h-5 w-5 text-purple-400" />
                  Đổi tên vai trò
                </h3>
                <button
                  type="button"
                  onClick={() => { setEditRoleModalOpen(false); setEditingRole(null); }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Tên vai trò mới</label>
                  <input
                    type="text"
                    autoFocus
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="pt-4 flex gap-3 mt-auto">
                  <button onClick={() => { setEditRoleModalOpen(false); setEditingRole(null); }} className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-stone-500 hover:bg-stone-50 transition text-xs font-extrabold uppercase cursor-pointer">Hủy</button>
                  <button onClick={() => void handleUpdateRoleName()} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer">Lưu tên vai trò</button>
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-stone-500 uppercase font-extrabold block">Trạm làm việc / Phân vùng</label>
                    <select required value={newStaff.station_id} onChange={(e) => setNewStaff({ ...newStaff, station_id: e.target.value })}
                      className="w-full bg-stone-50 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-purple-500">
                      <option value="all">Toàn hệ thống (HQ - Master Admin/Kế toán)</option>
                      {stations.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
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
