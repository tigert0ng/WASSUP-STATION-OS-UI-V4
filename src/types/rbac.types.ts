export type Role = "master_admin" | "manager" | "technician" | "accountant";

export interface UserSession {
  userId: string;
  name: string;
  role: Role;
  phone: string;
}

export type PermissionLevel = "crud" | "read" | "read_own" | "none";

export type ModuleKey = 
  | "dashboard"
  | "tiep_nhan"
  | "ktv_web_view"
  | "pos"
  | "crm"
  | "dich_vu_gia"
  | "kho"
  | "monitor";

export type ModuleCode = 
  | "settings"
  | "dashboard"
  | "reception"
  | "ktv"
  | "pos"
  | "crm"
  | "finance"
  | "services"
  | "inventory"
  | "monitor"
  | "staff"
  | "hr";

