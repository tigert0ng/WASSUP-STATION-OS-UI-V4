import { ServiceRow, ServiceBomRow } from "../../types/catalog.types";

const LOCAL_SERVICES_KEY = "wassup_local_services_override";
const LOCAL_BOM_KEY = "wassup_local_bom_override";

// -------------------------------------------------------------------
// DEFAULT PACKAGES (W0 - W5) - 100% Đồng bộ Kiosk & Station OS
// -------------------------------------------------------------------
export const DEFAULT_PACKAGES: ServiceRow[] = [
  {
    id: "w0",
    station_id: "sta-01",
    code: "W0",
    name: "Express",
    type: "package",
    price: 59000,
    duration_min: 10,
    duration_max: 15,
    checklist_jsonb: [
      "Rửa nhanh tự động bằng máy rửa WashNOW (ngoại thất)",
      "Xịt gầm áp lực cao",
      "Sấy khô contour tốc độ cao"
    ],
    description_bullets_jsonb: [
      "Rửa nhanh tự động bằng máy rửa WashNOW (ngoại thất)",
      "Xịt gầm áp lực cao",
      "Sấy khô contour tốc độ cao"
    ],
    image_url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=600",
    exempt_surcharge: false,
    standalone: true,
    addon_category: null,
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "w1",
    station_id: "sta-01",
    code: "W1",
    name: "Basic Clean",
    type: "package",
    price: 159000,
    duration_min: 15,
    duration_max: 25,
    checklist_jsonb: [
      "Rửa nhanh tự động (ngoại thất)",
      "Xịt gầm áp lực cao",
      "Hút bụi cơ bản sàn xe & thảm chân",
      "Lau kính nội thất sạch bóng"
    ],
    description_bullets_jsonb: [
      "Rửa nhanh tự động (ngoại thất)",
      "Xịt gầm áp lực cao",
      "Hút bụi cơ bản sàn xe & thảm chân",
      "Lau kính nội thất sạch bóng"
    ],
    image_url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=600",
    exempt_surcharge: false,
    standalone: true,
    addon_category: null,
    highlight_type: "best_seller",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "w2",
    station_id: "sta-01",
    code: "W2",
    name: "Full Clean",
    type: "package",
    price: 299000,
    duration_min: 25,
    duration_max: 35,
    checklist_jsonb: [
      "Bao gồm toàn bộ gói W1",
      "Giặt sấy thảm lót chân chuyên dụng",
      "Wax bóng bảo vệ bề mặt sơn",
      "Vệ sinh mâm & vệ sinh chi tiết khe kẽ"
    ],
    description_bullets_jsonb: [
      "Bao gồm toàn bộ gói W1",
      "Giặt sấy thảm lót chân chuyên dụng",
      "Wax bóng bảo vệ bề mặt sơn",
      "Vệ sinh mâm & vệ sinh chi tiết khe kẽ"
    ],
    image_url: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=600",
    exempt_surcharge: false,
    standalone: true,
    addon_category: null,
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "w3",
    station_id: "sta-01",
    code: "W3",
    name: "Super Shine",
    type: "package",
    price: 649000,
    duration_min: 35,
    duration_max: 50,
    checklist_jsonb: [
      "Bao gồm toàn bộ gói W2",
      "Dưỡng taplo chống lão hóa tia UV",
      "Dưỡng phục hồi nhựa nội ngoại thất",
      "Dưỡng da ghế cao cấp chống nứt nẻ"
    ],
    description_bullets_jsonb: [
      "Bao gồm toàn bộ gói W2",
      "Dưỡng taplo chống lão hóa tia UV",
      "Dưỡng phục hồi nhựa nội ngoại thất",
      "Dưỡng da ghế cao cấp chống nứt nẻ"
    ],
    image_url: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=600",
    exempt_surcharge: false,
    standalone: true,
    addon_category: null,
    highlight_type: "best_seller",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "w4",
    station_id: "sta-01",
    code: "W4",
    name: "Detail Care",
    type: "package",
    price: 1699000,
    duration_min: 50,
    duration_max: 70,
    checklist_jsonb: [
      "Bao gồm toàn bộ gói W3",
      "Rửa xe chi tiết tỉ mỉ từng ngóc ngách",
      "Tẩy nhựa đường + Tẩy bụi sơn + Tẩy ố chrome",
      "Dưỡng taplo + dưỡng nhựa + dưỡng da ghế",
      "Phục hồi nhựa ngoại thất & Wax bóng ngoại thất"
    ],
    description_bullets_jsonb: [
      "Bao gồm toàn bộ gói W3",
      "Rửa xe chi tiết tỉ mỉ từng ngóc ngách",
      "Tẩy nhựa đường + Tẩy bụi sơn + Tẩy ố chrome",
      "Dưỡng taplo + dưỡng nhựa + dưỡng da ghế",
      "Phục hồi nhựa ngoại thất & Wax bóng ngoại thất"
    ],
    image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600",
    exempt_surcharge: false,
    standalone: true,
    addon_category: null,
    highlight_type: "vip",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "w5",
    station_id: "sta-01",
    code: "W5",
    name: "WASSUP PRIME",
    type: "package",
    price: 3399000,
    duration_min: 70,
    duration_max: 90,
    checklist_jsonb: [
      "Bao gồm toàn bộ gói W4",
      "Gói dưỡng toàn diện cao cấp",
      "Diệt khuẩn khử mùi ion âm",
      "Phủ bóng bảo vệ sơn Ceramic"
    ],
    description_bullets_jsonb: [
      "Bao gồm toàn bộ gói W4",
      "Gói dưỡng toàn diện cao cấp",
      "Diệt khuẩn khử mùi ion âm",
      "Phủ bóng bảo vệ sơn Ceramic"
    ],
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600",
    exempt_surcharge: false,
    standalone: true,
    addon_category: null,
    highlight_type: "custom",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

// -------------------------------------------------------------------
// DEFAULT ADD-ONS (DỊCH VỤ LẺ)
// -------------------------------------------------------------------
export const DEFAULT_ADDONS: ServiceRow[] = [
  {
    id: "add01",
    station_id: "sta-01",
    code: "ADD01",
    name: "Hút bụi sâu & vệ sinh khe kẽ nội thất",
    type: "addon",
    price: 99000,
    duration_min: 10,
    duration_max: 15,
    checklist_jsonb: ["Hút bụi sâu các hộc cửa, rãnh ghế", "Xịt khí nén làm sạch khe gió điều hòa"],
    description_bullets_jsonb: ["Hút bụi sâu các hộc cửa, rãnh ghế và khe kẽ taplo", "Thổi bụi bẩn bằng vòi khí nén áp lực cao"],
    image_url: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "noi_that_co_ban",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add02",
    station_id: "sta-01",
    code: "ADD02",
    name: "Xông khử khuẩn Nano Bạc khoang xe",
    type: "addon",
    price: 499000,
    duration_min: 15,
    duration_max: 20,
    checklist_jsonb: ["Xông khói sinh học diệt 99.9% vi khuẩn", "Khử mùi hôi thuốc lá, thức ăn, ẩm mốc"],
    description_bullets_jsonb: ["Công nghệ sương mù Nano Bạc diệt khuẩn giàn lạnh", "Khử mùi điều hòa mang lại không khí tươi mát"],
    image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "noi_that_nang_cao",
    highlight_type: "best_seller",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add03",
    station_id: "sta-01",
    code: "ADD03",
    name: "Dưỡng da ghế cao cấp chống nứt nẻ",
    type: "addon",
    price: 249000,
    duration_min: 15,
    duration_max: 20,
    checklist_jsonb: ["Lau sạch bề mặt da chuyên dụng", "Thoa kem dưỡng da 3M/Sonax làm mềm và bảo vệ da"],
    description_bullets_jsonb: ["Chống lão hóa da ghế dưới ánh nắng gắt", "Dưỡng bóng tự nhiên, không gây nhờn rít"],
    image_url: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "noi_that_nang_cao",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add04",
    station_id: "sta-01",
    code: "ADD04",
    name: "Tẩy ố kính lái & gương chiếu hậu 3M",
    type: "addon",
    price: 499000,
    duration_min: 20,
    duration_max: 30,
    checklist_jsonb: ["Tẩy cặn canxi, ố mốc vảy cá trên kính", "Phủ lớp bảo vệ kính chống đọng sương"],
    description_bullets_jsonb: ["Xóa sạch vệt ố nước mưa, cặn canxi cứng đầu", "Cải thiện tầm nhìn lái xe an toàn ban đêm và trời mưa"],
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "ngoai_that_nang_cao",
    highlight_type: "vip",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add05",
    station_id: "sta-01",
    code: "ADD05",
    name: "Tẩy nhựa đường & mạt sắt bám thân xe",
    type: "addon",
    price: 399000,
    duration_min: 20,
    duration_max: 30,
    checklist_jsonb: ["Sử dụng dung dịch chuyên dụng rã nhựa đường", "Rửa sạch và lau khô bảo vệ sơn xe"],
    description_bullets_jsonb: ["Đánh bay các đốm nhựa đường đen bám sườn xe", "Xử lý mạt sắt gỉ li ti bảo vệ lớp sơn bóng"],
    image_url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "ngoai_that_nang_cao",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add06",
    station_id: "sta-01",
    code: "ADD06",
    name: "Phủ Rain Repellent kính lái (Hiệu ứng lá sen)",
    type: "addon",
    price: 50000,
    duration_min: 10,
    duration_max: 15,
    checklist_jsonb: ["Vệ sinh sạch bề mặt kính", "Phủ dung dịch tạo hiệu ứng lá sen trôi nước"],
    description_bullets_jsonb: ["Nước mưa tự trôi cuộn tròn khi xe chạy trên 50km/h", "Hạn chế bám bụi bẩn và ố kính"],
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "ngoai_that_nang_cao",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add07",
    station_id: "sta-01",
    code: "ADD07",
    name: "Khử mùi sinh học ion bạc",
    type: "addon",
    price: 80000,
    duration_min: 15,
    duration_max: 20,
    checklist_jsonb: ["Xông tinh dầu bạc hà diệt khuẩn", "Làm sạch bộ lọc điều hòa"],
    description_bullets_jsonb: ["Xông tinh dầu thảo mộc thiên nhiên diệt vi khuẩn nấm mốc", "Khử mùi hôi nội thất nhanh chóng"],
    image_url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "noi_that_co_ban",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add08",
    station_id: "sta-01",
    code: "ADD08",
    name: "Kiểm tra áp suất lốp & chẩn đoán ắc quy",
    type: "addon",
    price: 50000,
    duration_min: 10,
    duration_max: 15,
    checklist_jsonb: ["Đo áp suất 4 lốp xe và bơm bù chuẩn áp", "Đo điện áp và sức khỏe bình ắc quy xe"],
    description_bullets_jsonb: ["Kiểm tra áp suất 4 lốp xe và bơm khí chuẩn an toàn", "Đo điện áp bình ắc quy xe bằng máy đo chuyên dụng"],
    image_url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "kiem_tra",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "add09",
    station_id: "sta-01",
    code: "ADD09",
    name: "Bảo dưỡng roăng cao su & chốt khóa cửa",
    type: "addon",
    price: 120000,
    duration_min: 15,
    duration_max: 20,
    checklist_jsonb: ["Lau sạch các roăng cao su cánh cửa và cốp", "Thoa sáp bảo dưỡng cao su chống chai cứng, chống ồn"],
    description_bullets_jsonb: ["Dưỡng roăng cao su mềm dẻo, ngăn nước và giảm ồn khoang lái", "Bôi trơn chốt bản lề cửa hoạt động êm ái"],
    image_url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=400",
    exempt_surcharge: true,
    standalone: true,
    addon_category: "bao_duong_ky_thuat",
    highlight_type: "none",
    active: true,
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  }
];

// -------------------------------------------------------------------
// DEFAULT BOM (Định mức vật tư)
// -------------------------------------------------------------------
export const DEFAULT_BOM_MAP: Record<string, ServiceBomRow[]> = {
  w0: [
    { id: "bom-w0-1", service_id: "w0", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 100, unit: "ml" },
    { id: "bom-w0-2", service_id: "w0", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 150, unit: "ml" },
    { id: "bom-w0-3", service_id: "w0", vehicle_class: "4_5_cho", inventory_item_id: "inv-04", qty_per_unit: 1, unit: "Bộ máy" },
    { id: "bom-w0-4", service_id: "w0", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-04", qty_per_unit: 1, unit: "Bộ máy" }
  ],
  w1: [
    { id: "bom-w1-1", service_id: "w1", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 150, unit: "ml" },
    { id: "bom-w1-2", service_id: "w1", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 200, unit: "ml" },
    { id: "bom-w1-3", service_id: "w1", vehicle_class: "4_5_cho", inventory_item_id: "inv-01", qty_per_unit: 30, unit: "Chai 500ml" },
    { id: "bom-w1-4", service_id: "w1", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-01", qty_per_unit: 50, unit: "Chai 500ml" }
  ],
  w2: [
    { id: "bom-w2-1", service_id: "w2", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 200, unit: "ml" },
    { id: "bom-w2-2", service_id: "w2", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 250, unit: "ml" },
    { id: "bom-w2-3", service_id: "w2", vehicle_class: "4_5_cho", inventory_item_id: "inv-01", qty_per_unit: 50, unit: "Chai 500ml" },
    { id: "bom-w2-4", service_id: "w2", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-01", qty_per_unit: 70, unit: "Chai 500ml" }
  ],
  w3: [
    { id: "bom-w3-1", service_id: "w3", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 200, unit: "ml" },
    { id: "bom-w3-2", service_id: "w3", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 300, unit: "ml" },
    { id: "bom-w3-3", service_id: "w3", vehicle_class: "4_5_cho", inventory_item_id: "inv-01", qty_per_unit: 60, unit: "Chai 500ml" },
    { id: "bom-w3-4", service_id: "w3", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-01", qty_per_unit: 80, unit: "Chai 500ml" },
    { id: "bom-w3-5", service_id: "w3", vehicle_class: "4_5_cho", inventory_item_id: "inv-03", qty_per_unit: 50, unit: "Cục 200g" },
    { id: "bom-w3-6", service_id: "w3", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-03", qty_per_unit: 70, unit: "Cục 200g" }
  ],
  w4: [
    { id: "bom-w4-1", service_id: "w4", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 250, unit: "ml" },
    { id: "bom-w4-2", service_id: "w4", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 350, unit: "ml" },
    { id: "bom-w4-3", service_id: "w4", vehicle_class: "4_5_cho", inventory_item_id: "inv-01", qty_per_unit: 80, unit: "Chai 500ml" },
    { id: "bom-w4-4", service_id: "w4", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-01", qty_per_unit: 100, unit: "Chai 500ml" },
    { id: "bom-w4-5", service_id: "w4", vehicle_class: "4_5_cho", inventory_item_id: "inv-03", qty_per_unit: 100, unit: "Cục 200g" },
    { id: "bom-w4-6", service_id: "w4", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-03", qty_per_unit: 150, unit: "Cục 200g" },
    { id: "bom-w4-7", service_id: "w4", vehicle_class: "4_5_cho", inventory_item_id: "inv-05", qty_per_unit: 1, unit: "Máy" },
    { id: "bom-w4-8", service_id: "w4", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-05", qty_per_unit: 1, unit: "Máy" }
  ],
  w5: [
    { id: "bom-w5-1", service_id: "w5", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 300, unit: "ml" },
    { id: "bom-w5-2", service_id: "w5", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 400, unit: "ml" },
    { id: "bom-w5-3", service_id: "w5", vehicle_class: "4_5_cho", inventory_item_id: "inv-01", qty_per_unit: 100, unit: "Chai 500ml" },
    { id: "bom-w5-4", service_id: "w5", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-01", qty_per_unit: 120, unit: "Chai 500ml" },
    { id: "bom-w5-5", service_id: "w5", vehicle_class: "4_5_cho", inventory_item_id: "inv-03", qty_per_unit: 150, unit: "Cục 200g" },
    { id: "bom-w5-6", service_id: "w5", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-03", qty_per_unit: 200, unit: "Cục 200g" },
    { id: "bom-w5-7", service_id: "w5", vehicle_class: "4_5_cho", inventory_item_id: "inv-05", qty_per_unit: 1, unit: "Máy" },
    { id: "bom-w5-8", service_id: "w5", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-05", qty_per_unit: 1, unit: "Máy" }
  ],
  add01: [
    { id: "bom-add01-1", service_id: "add01", vehicle_class: "4_5_cho", inventory_item_id: "inv-04", qty_per_unit: 1, unit: "Bộ máy" },
    { id: "bom-add01-2", service_id: "add01", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-04", qty_per_unit: 1, unit: "Bộ máy" }
  ],
  add02: [
    { id: "bom-add02-1", service_id: "add02", vehicle_class: "4_5_cho", inventory_item_id: "inv-02", qty_per_unit: 50, unit: "ml" },
    { id: "bom-add02-2", service_id: "add02", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-02", qty_per_unit: 80, unit: "ml" }
  ],
  add03: [
    { id: "bom-add03-1", service_id: "add03", vehicle_class: "4_5_cho", inventory_item_id: "inv-01", qty_per_unit: 40, unit: "Chai 500ml" },
    { id: "bom-add03-2", service_id: "add03", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-01", qty_per_unit: 60, unit: "Chai 500ml" }
  ],
  add04: [
    { id: "bom-add04-1", service_id: "add04", vehicle_class: "4_5_cho", inventory_item_id: "inv-03", qty_per_unit: 30, unit: "Cục 200g" },
    { id: "bom-add04-2", service_id: "add04", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-03", qty_per_unit: 50, unit: "Cục 200g" }
  ],
  add05: [
    { id: "bom-add05-1", service_id: "add05", vehicle_class: "4_5_cho", inventory_item_id: "inv-03", qty_per_unit: 50, unit: "Cục 200g" },
    { id: "bom-add05-2", service_id: "add05", vehicle_class: "7_9_cho_bantai", inventory_item_id: "inv-03", qty_per_unit: 80, unit: "Cục 200g" }
  ]
};

interface ServiceOverrideStore {
  created: ServiceRow[];
  updated: Record<string, Partial<ServiceRow>>;
  deleted: string[];
}

export function getLocalServiceStore(): ServiceOverrideStore {
  if (typeof window === "undefined") return { created: [], updated: {}, deleted: [] };
  try {
    const raw = localStorage.getItem(LOCAL_SERVICES_KEY);
    if (!raw) return { created: [], updated: {}, deleted: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { created: [], updated: {}, deleted: [] };
  }
}

export function saveLocalServiceStore(store: ServiceOverrideStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("wassup_services_updated"));
}

export function applyLocalOverridesToServices(dbServices: ServiceRow[], type: "package" | "addon"): ServiceRow[] {
  const store = getLocalServiceStore();
  const deletedSet = new Set(store.deleted);

  // If dbServices is empty, use the authoritative defaults
  const baseList = dbServices.length > 0 ? dbServices : (type === "package" ? DEFAULT_PACKAGES : DEFAULT_ADDONS);

  // Filter out deleted and apply updates
  const updatedDb = baseList
    .filter((s) => !deletedSet.has(s.id))
    .map((s) => {
      const patch = store.updated[s.id];
      return patch ? { ...s, ...patch } : s;
    });

  // Add newly created services that match the type and are not deleted
  const createdForType = store.created.filter((s) => s.type === type && !deletedSet.has(s.id));

  // Merge created and updatedDb, deduplicating by id
  const idMap = new Map<string, ServiceRow>();
  for (const item of [...updatedDb, ...createdForType]) {
    idMap.set(item.id, item);
  }
  return Array.from(idMap.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function createLocalService(newService: ServiceRow) {
  const store = getLocalServiceStore();
  store.created.push(newService);
  saveLocalServiceStore(store);
}

export function updateLocalService(id: string, patch: Partial<ServiceRow>) {
  const store = getLocalServiceStore();
  const createdIdx = store.created.findIndex((s) => s.id === id);
  if (createdIdx >= 0) {
    store.created[createdIdx] = { ...store.created[createdIdx], ...patch };
  } else {
    store.updated[id] = { ...(store.updated[id] || {}), ...patch };
  }
  saveLocalServiceStore(store);
}

export function deleteLocalService(id: string) {
  const store = getLocalServiceStore();
  store.created = store.created.filter((s) => s.id !== id);
  delete store.updated[id];
  if (!store.deleted.includes(id)) {
    store.deleted.push(id);
  }
  saveLocalServiceStore(store);
}

export function getLocalBomForService(serviceId: string): ServiceBomRow[] | null {
  if (typeof window === "undefined") return DEFAULT_BOM_MAP[serviceId] ?? null;
  try {
    const raw = localStorage.getItem(`${LOCAL_BOM_KEY}_${serviceId}`);
    if (raw) return JSON.parse(raw);
    return DEFAULT_BOM_MAP[serviceId] ?? null;
  } catch (e) {
    return DEFAULT_BOM_MAP[serviceId] ?? null;
  }
}

export function saveLocalBomForService(serviceId: string, bomLines: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LOCAL_BOM_KEY}_${serviceId}`, JSON.stringify(bomLines));
  window.dispatchEvent(new CustomEvent("wassup_bom_updated", { detail: { serviceId } }));
}

export function getBomLinesCountForService(serviceId: string): number {
  const bom = getLocalBomForService(serviceId);
  return bom ? bom.length : 0;
}

