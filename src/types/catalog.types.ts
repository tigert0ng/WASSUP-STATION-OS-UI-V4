export type ServiceType = "package" | "addon";
export type VehicleClass = "4_5_cho" | "7_9_cho_bantai";
export type HighlightType = "none" | "best_seller" | "vip" | "custom";

export type AddonCategory =
  | "noi_that_co_ban"
  | "noi_that_nang_cao"
  | "ngoai_that_nang_cao"
  | "kiem_tra"
  | "bao_duong_ky_thuat";

export const ADDON_CATEGORY_LABELS: Record<AddonCategory, string> = {
  noi_that_co_ban: "Nội thất cơ bản",
  noi_that_nang_cao: "Nội thất nâng cao",
  ngoai_that_nang_cao: "Ngoại thất nâng cao",
  kiem_tra: "Kiểm tra & Chẩn đoán",
  bao_duong_ky_thuat: "Bảo dưỡng kỹ thuật",
};

export interface ServiceRow {
  id: string;
  station_id: string;
  code: string;
  name: string;
  type: ServiceType;
  price: number;
  duration_min: number;
  duration_max: number;
  checklist_jsonb: string[];
  description_bullets_jsonb: string[];
  image_url: string | null;
  exempt_surcharge: boolean;
  standalone: boolean;
  addon_category: AddonCategory | null;
  highlight_type: HighlightType;
  active: boolean;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceBomRow {
  id: string;
  service_id: string;
  vehicle_class: VehicleClass;
  inventory_item_id: string;
  qty_per_unit: number;
  unit: string;
  created_at?: string;
}

export interface InventoryItemPickerRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_stock?: number;
}

export interface PriceChangeRequestRow {
  id: string;
  service_id: string;
  proposed_price: number;
  reason: string;
  requested_by: string;
  decided_by: string | null;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
  updated_at?: string;
}

export interface VehicleSurchargeConfigRow {
  id: string;
  percent: number;
  updated_by: string | null;
  created_at?: string;
  updated_at?: string;
}
