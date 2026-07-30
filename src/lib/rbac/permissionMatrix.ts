import { Role, ModuleKey, PermissionLevel } from "../../types/rbac.types";

export const PERMISSIONS: Record<ModuleKey, Record<Role, PermissionLevel>> = {
  dashboard: {
    master_admin: "crud",
    manager: "crud",
    technician: "read_own",
    accountant: "read"
  },
  tiep_nhan: {
    master_admin: "crud",
    manager: "crud",
    technician: "read_own",
    accountant: "read"
  },
  ktv_web_view: {
    master_admin: "read",
    manager: "read",
    technician: "crud",
    accountant: "none"
  },
  pos: {
    master_admin: "crud",
    manager: "crud",
    technician: "none",
    accountant: "read"
  },
  crm: {
    master_admin: "crud",
    manager: "read",
    technician: "none",
    accountant: "read"
  },
  dich_vu_gia: {
    master_admin: "crud",
    manager: "read",
    technician: "read",
    accountant: "read"
  },
  kho: {
    master_admin: "crud",
    manager: "crud",
    technician: "read_own",
    accountant: "read"
  },
  monitor: {
    master_admin: "crud",
    manager: "read",
    technician: "none",
    accountant: "none"
  },
};

export function hasPermission(role: Role, module: ModuleKey, required: "crud" | "read"): boolean {
  const level = PERMISSIONS[module][role];
  if (level === "none") return false;
  if (required === "read") return true; // crud, read, read_own all satisfy read
  return level === "crud";
}
