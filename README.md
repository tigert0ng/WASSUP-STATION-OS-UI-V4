# WASSUP - Hệ Thống Quản Lý Tiếp Nhận & Điều Phối Kỹ Thuật Viên (Module 2)

Ứng dụng quản lý trung tâm vận hành trạm rửa xe & detailing chuyên nghiệp **WASSUP**, tập trung vào tối ưu hóa trải nghiệm Tiếp Nhận Xe & Điều Phối Kỹ Thuật Viên (Module 2) theo sát đặc tả PRD v2.3 và cập nhật ngày 16/07/2026.

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Folder Structure)

```text
/
├── .env.example                               # Định nghĩa biến môi trường mẫu
├── .gitignore                                 # Loại bỏ các file build/node_modules khỏi git
├── design.md                                  # Tài liệu tư duy thiết kế hệ thống
├── index.html                                 # Entry-point HTML chính
├── metadata.json                              # Cấu hình siêu dữ liệu applet AI Studio
├── package.json                               # Quản lý thư viện và scripts chạy dự án
├── postcss.config.js                          # Cấu hình PostCSS cho Tailwind
├── tsconfig.json                              # Cấu hình TypeScript compiler
├── vite.config.ts                             # Cấu hình bundler Vite
├── wassup-build-spec-v3.md                    # Bản đặc tả kỹ thuật chi tiết của hệ thống
│
├── src/
│   ├── main.tsx                               # Entrypoint ứng dụng React
│   ├── App.tsx                                # Router và điều hướng module chính
│   ├── index.css                              # Cài đặt styles Tailwind, Google Fonts
│   │
│   ├── components/                            # Thư mục chứa các Component UI/UX
│   │   ├── admin/                             # Phân hệ quản lý Admin Hub
│   │   │   ├── CrmModule.tsx                  # Quản lý khách hàng & lịch sử xe
│   │   │   ├── DashboardModule.tsx            # Báo cáo tổng quan, số liệu thời gian thực
│   │   │   ├── FinanceModule.tsx              # Quản lý doanh thu & dòng tiền
│   │   │   ├── InventoryModule.tsx            # Quản lý kho, vật tư
│   │   │   ├── KtvModule.tsx                  # Quản lý hiệu suất, trạng thái KTV
│   │   │   ├── LoginModule.tsx                # Trang đăng nhập phân quyền (RBAC)
│   │   │   ├── MonitorModule.tsx              # Monitor trạng thái các buồng thi công (Booth)
│   │   │   ├── PosModule.tsx                  # Điểm thanh toán và lập hóa đơn (POS)
│   │   │   ├── ReceptionModule.tsx            # [CORE MODULE 2] Tiếp nhận xe & Bảng Kanban Điều Phối
│   │   │   ├── ServicesModule.tsx             # Quản lý Catalog gói dịch vụ & phụ thu
│   │   │   ├── SettingsModule.tsx             # Cài đặt hệ thống, danh sách Booth
│   │   │   ├── StaffModule.tsx                # Quản lý tài khoản nhân sự
│   │   │   └── inventory/                     # Các module chi tiết quản lý kho
│   │   │       ├── InventoryReports.tsx
│   │   │       ├── PrdHandbook.tsx
│   │   │       └── StockCounting.tsx
│   │   │
│   │   ├── kiosk/                             # Phân hệ Khách tự phục vụ (Self-Service Kiosk)
│   │   │   ├── KioskWelcome.tsx
│   │   │   ├── KioskStepsManager.tsx
│   │   │   └── KioskCheckoutView.tsx
│   │   │
│   │   └── shared/
│   │       └── NotificationManager.tsx        # Trình quản lý thông báo Toast hệ thống
│   │
│   ├── hooks/                                 # Custom Hooks tương tác dữ liệu/mô phỏng
│   │   ├── useDashboardRealtime.ts
│   │   ├── useInventoryAlerts.ts
│   │   ├── useKtvQueue.ts
│   │   ├── useOrderTracking.ts
│   │   └── useRole.ts
│   │
│   ├── lib/                                   # Thư viện dùng chung & Tích hợp API
│   │   ├── rbac/                              # Hệ thống bảo mật phân quyền dựa trên Vai trò (RBAC)
│   │   │   ├── guards.ts
│   │   │   └── permissionMatrix.ts
│   │   ├── supabase/                          # SDK Client tương tác CSDL & Simulation Actions
│   │   │   ├── client.ts                      # Client giả lập/Realtime Database State Engine
│   │   │   ├── realtime.ts
│   │   │   └── server.ts
│   │   ├── telegram/                          # Tích hợp truyền tin tức thời sang Telegram Bot
│   │   │   ├── botClient.ts
│   │   │   └── messageBuilders.ts
│   │   └── services.ts
│   │
│   └── types/                                 # Khai báo kiểu dữ liệu TypeScript (Strict Types)
│       ├── order.types.ts
│       ├── rbac.types.ts
│       ├── voucher.types.ts
│       └── workOrder.types.ts
│
└── supabase/
    └── migrations/                            # Tập tin di chuyển dữ liệu cấu trúc SQL
        └── 20260708000000_wassup_schema.sql
```

---

## 📝 Nhật Ký Thay Đổi Cập Nhật (Changelog)

### [16/07/2026] - Cập nhật UI/UX Module 2 (Tiếp Nhận Xe & Điều Phối KTV)
- **Form Tiếp Nhận Xe S2.1 mới:**
  - Chuyển trường **Biển Số Xe** lên vị trí đầu tiên, kích thước lớn nổi bật nhất, kích hoạt thuộc tính `autoFocus`.
  - Tối ưu hóa chức năng auto-suggest biển số từ CRM: hiển thị gợi ý sau khi gõ **từ 3 ký tự trở lên** (thay vì 2 như trước).
  - Thêm panel cấu hình nhanh **Tình Trạng Xe Vào** tại chỗ gồm các tùy chọn (Sạch sẽ, Bình thường, Bẩn nặng 🌧️, Xước nhẹ ⚡, Xước nặng ⚠️) tích hợp vào Ghi chú tự động.
- **Bảng Điều Phối Kanban S2.3:**
  - Hỗ trợ thao tác chạm linh hoạt bên cạnh cơ chế kéo-thả: nhấp vào thẻ ở cột **Hàng Đợi** sẽ tự động mở Bottom Sheet/Modal Điều Phối lựa chọn Booth và KTV phù hợp (Tap-to-assign tốt cho thiết bị di động).
- **Mô phỏng Telegram Bot KTV (S2.T):**
  - Tích hợp Widget giả lập điện thoại nhận tin nhắn Telegram Bot của KTV, hỗ trợ nhấn **[Đồng Ý]** (để tự động đổi trạng thái xe thành Đang thi công) hoặc **[Báo Bận]** (xe quay lại Hàng Đợi điều phối) giúp đồng bộ Dashboard/TV trong vòng dưới 3 giây.
- **Rating 2 Chiều Độc Lập S2.4 & S2.5:**
  - Tách biệt hoàn toàn đánh giá **Chất lượng xe** (`rating_type=vehicle_quality`) và **Kỹ thuật viên** (`rating_type=ktv_service`).
  - Giao diện Admin S2.4 cho phép nhập độc lập cả 2 loại rating này khi hoàn thành.
  - Cập nhật Module báo cáo hiệu suất KPI KTV chỉ sử dụng điểm đánh giá kỹ thuật viên (`rating_type=ktv_service`), không bị ảnh hưởng bởi lỗi ngoại cảnh hay chất lượng rửa xe chung của trạm.
