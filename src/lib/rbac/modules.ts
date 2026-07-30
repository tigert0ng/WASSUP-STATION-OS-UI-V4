import { ModuleCode } from "../../types/rbac.types";

export interface ModuleDef {
  code: ModuleCode;
  order: number;
  name: string;
}

export const MODULES: ModuleDef[] = [
  { code: "settings", order: 0, name: "Cài đặt hệ thống & Trạm" },
  { code: "dashboard", order: 1, name: "Dashboard điều phối" },
  { code: "reception", order: 2, name: "Tiếp nhận & Kiosk" },
  { code: "ktv", order: 3, name: "Buồng rửa KTV" },
  { code: "pos", order: 4, name: "POS & Hóa đơn" },
  { code: "crm", order: 4.5, name: "Khách hàng & CRM" },
  { code: "finance", order: 4.6, name: "Sổ cái Tài chính" },
  { code: "services", order: 5, name: "Gói dịch vụ & BOM" },
  { code: "inventory", order: 6, name: "Kho & Hao phí" },
  { code: "monitor", order: 7, name: "IoT Monitor Giám Sát" },
  { code: "staff", order: 7.5, name: "Nhân sự & Audit log" },
  { code: "hr", order: 8, name: "Carer Performance" },
];
