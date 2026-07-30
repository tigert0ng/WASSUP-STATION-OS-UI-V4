# Design & UX Guidelines Áp Dụng Toàn Dự Án

*Cập nhật: 19/07/2026 (2 đợt) · Viết lại toàn bộ, thay thế bản cũ (nguồn §15 PRD gốc v2.3, chỉ có 1 bộ token light theme dùng chung). Đợt 2 cùng ngày: audit Module 5, bỏ font `font-mono`/JetBrains Mono khỏi dự án (còn 2 font Lexend + Inter), thêm kiểu nút "Solid Dark", làm rõ màu thẻ gói do Master Admin chọn tay tự do, siết chặt §8.2 (component Markdown dùng chung bắt buộc, cấm chèn HTML tùy ý).*

> **Nguồn thiết kế chính thức:** `/Users/tigertong/VScode/google-studio-ui-wassup-wip` — repo React/Vite/Tailwind v4 riêng, là **bản thiết kế cập nhật mới nhất** (theo xác nhận trực tiếp của Tiger 19/07/2026), thay thế mọi mô tả UI/UX rời rạc trước đó (kể cả bản archive PRD v1.2 đã nén trong `prd/draft.zip`). Tài liệu này tổng hợp lại 2 nguồn trong repo đó: `design.md` (design system chính thức) và `src/index.css` (token Tailwind `@theme` thực thi được), đối chiếu với code thực tế đã build (`src/App.tsx`, `src/components/`) để đảm bảo tài liệu khớp với những gì đã dựng, không chỉ mô tả ý định. *(`wassup-build-spec-v3.md` — tài liệu đặc tả Module 2 cũ trong cùng repo — đã lỗi thời, không dùng làm nguồn tham chiếu ở đây, xem ghi chú 19/07/2026 trong sync log CLAUDE.md.)*
>
> Khi cần xem/chỉnh trực tiếp code hoặc token gốc, mở repo đó. File này là **bản dịch/PRD hóa** phục vụ đội phát triển Station OS (Admin Hub + Kiosk + TV) trong `WASSUP-BRAND/prd/`, không phải bản sao code.

---

## 1. Tinh Thần Thiết Kế

Định danh thẩm mỹ: **"Cyber-Organic Premium"** — tông màu đất/hữu cơ cổ điển (rêu, vàng đồng, nâu gỗ, be cát) phối cùng xanh chanh neon độ tương phản cao để hút mắt vào đúng điểm cần chú ý. Nguyên tắc tương phản: bề mặt Kiosk sáng, thoáng, tối đa hoá khả năng đọc cho khách đứng ngoài trời; bề mặt vận hành (khung sườn Admin Hub — header/sidebar) tối màu để giảm mỏi mắt ca đêm; nội dung nghiệp vụ (bảng dữ liệu, card) trong Admin Hub và TV hiện đang dùng nền sáng (xem ghi chú "Hiện Trạng Build" ở §4.1).

---

## 2. Design Tokens — Màu Sắc

Khai báo tại `src/index.css` dưới directive `@theme` của Tailwind v4 — có sẵn dưới dạng class tiện ích toàn cục (`bg-brand-green`, `text-matte-black`...). Đây là **bộ token duy nhất dùng chung cho cả 3 màn hình** (Admin Hub, Kiosk, TV) — không tạo token riêng lẻ theo màn hình.

| Token | Hex | Class Tailwind | Vai trò |
|---|---|---|---|
| Brand Green (Volt) | `#A2C62C` | `bg-brand-green` / `text-brand-green` | Accent chính, CTA, trạng thái tốt/đạt mục tiêu |
| Brand Green Hover | `#8fb124` | `bg-brand-green-hover` | Hover cho phần tử brand-green |
| Brand Green Light | `#f0f7d4` | `bg-brand-green-light` | Nền mềm cho item được chọn, voucher, khối thông báo |
| Matte Black | `#1A1A1A` | `bg-matte-black` / `text-matte-black` | Header/sidebar Admin Hub, chữ chính trên nền sáng |
| Warm White | `#FAFAFA` | `bg-warm-white` | Nền chính Kiosk, nền canvas sáng |
| Forest Green | `#59743E` | `text-forest-green` | Sub-branding, badge thành công, icon môi trường/kỹ thuật |
| Warm Gold | `#AC9653` | `text-warm-gold` | Gói cao cấp (W4–W5), hạng VIP, đánh giá sao |
| Earth Brown | `#594026` | `text-earth-brown` | Đường viền hữu cơ tinh tế, khung cao cấp |
| Sand Beige | `#BCBC8F` | `text-sand-beige` | Viền mềm, dòng bước chưa active, nền card cao cấp |
| Mid Gray | `#6B7280` | `text-mid-gray` | Chữ phụ, mô tả, placeholder |

**Màu trạng thái (status) — dùng nhất quán mọi bảng/badge:**

| Trạng thái | Class | Dùng cho |
|---|---|---|
| Success / Active / Đạt | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` (nền tối) hoặc `bg-brand-green text-matte-black` (nền sáng) | Hoàn thành, đạt target, KTV đã kết nối |
| Warning / Pending / Đang xử lý | `bg-amber-500/10 text-amber-400 border-amber-500/20` | Chờ duyệt, gần ngưỡng, QC check |
| Danger / Cancelled / Lỗi | `bg-red-500/10 text-red-400 border-red-500/20` | Hủy đơn, rework, cảnh báo tồn kho đỏ |
| Info / Idle | `bg-blue-500/10 text-blue-400 border-blue-500/20` | Buồng trống, chưa gán |

**Màu thẻ gói dịch vụ (Module 5) — xác nhận 19/07/2026:** Master Admin **chọn tay tự do** 1 trong 4 kiểu màu cho mỗi gói/dịch vụ khi cấu hình, không bị khóa cứng theo tier W0–W5: `normal` (trắng, viền `#e5e5e5`, mặc định), `primary` (nền `brand-green` đặc), `gold` (nền `warm-gold` đặc), `custom` (nền `matte-black` đặc, chữ `brand-green`). Đây là quyết định nghiệp vụ có chủ đích (giữ nguyên, không coi là lỗi) — Master Admin có thể gán màu `gold` cho gói W0 hoặc để W5 màu `normal` tùy chiến lược trưng bày, không bắt buộc ánh xạ 1-1 giữa màu và cấp bậc gói. 4 màu trên là toàn bộ tập hợp hợp lệ — không tự chế thêm màu thứ 5.

---

## 3. Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
```

| Font | Class | Vai trò | Đặc điểm |
|---|---|---|---|
| **Lexend** | `font-display` | Tiêu đề đậm, tên thương hiệu, giá tiền, số liệu chính, nhãn điều hướng viết hoa | Cấu trúc hình học rõ, dễ đọc ở tốc độ cao — phù hợp cho Kiosk và TV nhìn từ xa |
| **Inter** | `font-sans` (mặc định) | Nội dung chính, bảng, hồ sơ, mô tả, form nhập liệu, nhãn cấu trúc, mã đơn, biển số xe, timestamp, số tiền | Trung tính, dễ đọc, khoảng cách dòng tốt |

**Quy tắc bắt buộc (sửa 19/07/2026 — bỏ font thứ 3):** dự án chỉ dùng **2 font: Lexend + Inter**, không còn JetBrains Mono/`font-mono`. Biển số xe, mã đơn hàng (`ORD-xxxxx`), timestamp, số tiền trong bảng dữ liệu dùng `font-sans font-bold` (hoặc `font-display` nếu là số liệu nổi bật cần nhấn mạnh, ví dụ giá tiền trên card, đồng hồ đếm ngược ETA) — không dùng `font-mono` ở bất kỳ đâu trong dự án. Tiêu đề màn hình/section luôn `font-display` + uppercase + tracking rộng.

---

## 4. Ba Kiến Trúc Màn Hình

Hệ thống chia 3 viewport độc lập, mỗi viewport có nguyên tắc bố cục riêng nhưng dùng chung token màu/font ở §2–§3.

### 4.1 Admin Operator Hub (`/admin/*`)

*Nhân viên vận hành dùng — Master Admin, Quản lý-Thu ngân, KTV (web view), Kế toán.*

- **Khung sườn (chrome):** Header (`bg-matte-black`, sticky top, logo + router 3 màn hình + trạng thái realtime + user session) và Sidebar (`w-64`, `bg-matte-black text-white`, menu phân nhóm **QUẢN TRỊ VẬN HÀNH / DỮ LIỆU & DANH MỤC / HỆ THỐNG TRẠM**) luôn nền tối để phân biệt rõ vùng điều hướng khỏi vùng nội dung.
- **Vùng nội dung (workspace):** nền sáng `bg-warm-white`, card `bg-white border border-[#e5e5e5] rounded-2xl shadow-sm`, bảng dữ liệu nền trắng viền `#e5e5e5`. **Đây là hiện trạng đã build** (không phải "dark mode toàn bộ" như một số mô tả cũ) — giữ nguyên hướng sáng cho vùng nội dung vì dễ đọc số liệu/bảng dài trong ca làm việc ban ngày; khung sườn tối chỉ áp dụng cho header/sidebar.
- **Mobile-first cho Module 1–3** (Dashboard, Tiếp nhận, KTV Mobile) — nhân viên thao tác chủ yếu bằng điện thoại/tablet tại quầy hoặc buồng rửa. Module 4 trở đi (CRM, Dịch vụ, Kho, Hệ thống) ưu tiên desktop/tablet nhưng vẫn phải dùng được trên màn hình nhỏ.
- **Bảng dữ liệu** (Module 2/3/4/6) chuyển sang dạng card-list trên mobile thay vì bảng ngang khó cuộn.
- **Card số liệu lớn** (Dashboard §1): tiêu đề nhỏ uppercase `text-mid-gray`, icon token trong khối `bg-brand-green-light`, số liệu chính `font-display text-3xl font-extrabold`, dải tiến độ có mốc cảnh báo (marker) rõ ràng — mẫu chuẩn xem `DashboardModule.tsx` khối 4 card đầu trang.
- **Sidebar tối (`bg-matte-black`) dùng riêng cho khối thông tin kỹ thuật/hệ thống** (VD panel "Dual-Channel Telegram Integration") để tách bạch trực quan giữa dữ liệu nghiệp vụ (nền sáng) và dữ liệu hệ thống/tích hợp (nền tối).
- Mọi hành động phá hủy/nhạy cảm (hủy đơn, xóa vật tư, đổi giá, thu hồi liên kết Telegram) → modal xác nhận rõ ràng, hiển thị hậu quả trước khi xác nhận (`bg-matte-black/50 backdrop-blur-sm`, card modal `bg-white rounded-2xl shadow-2xl`).
- Nút bấm chính luôn có 3 trạng thái rõ ràng: Loading / Thành công / Lỗi — không để người dùng bấm 2 lần vì tưởng chưa phản hồi (đặc biệt cho giao dịch tiền và điều phối KTV).
- Nút Dừng Khẩn Cấp (Module 7) dùng nền đỏ đặc (`bg-red-600`/`state-error`), kích thước tối thiểu 64×64px, vị trí cố định (sticky), không lẫn với nút khác — xuất hiện ở cả Dashboard và Module 7.

### 4.2 Payment Kiosk — Touchscreen (`/kiosk`)

*Khách hàng tự thao tác, đứng thẳng trước màn hình cảm ứng dọc 9:16. Nguyên tắc bắt buộc: **mọi thứ to, rõ, đơn giản nhất** — khách đa dạng độ tuổi/độ rành công nghệ, thao tác 1 tay, ngoài trời/ánh nắng.*

**Kích thước tối thiểu (bắt buộc, không thương lượng):**

| Phần tử | Tối thiểu | Ghi chú |
|---|---|---|
| Nút CTA chính (thanh toán, tiếp tục, xác nhận) | **64×64px**, khuyến nghị cao ≥72px | Luôn là phần tử nổi bật nhất màn hình, nền `brand-green` đặc |
| Nút phụ / điều hướng (quay lại, hủy, phím numpad) | 44×44px | Theo chuẩn touch-target tối thiểu |
| Card lựa chọn dịch vụ/gói | cao ≥190px | Đủ chỗ hiển thị đầy đủ ảnh + tên + giá + mô tả, không rút gọn nội dung |
| Cỡ chữ nội dung chính | ≥18px | Giá tiền, tên gói dùng `font-display` cỡ lớn hơn (24–32px) |
| Cỡ chữ phụ/ghi chú | ≥14px | Không nhỏ hơn — người lớn tuổi vẫn phải đọc được |
| Đồng hồ đếm ngược ETA (K11) | ≥40px, `font-display font-black` | Phần tử được nhìn lâu nhất trên màn hình, phải nổi bật |

**Nguyên tắc bố cục:**
- Container chính `max-w-4xl mx-auto px-6 py-8` để giữ cấu trúc thị giác, tránh dàn trải hết chiều rộng màn hình dọc.
- Mỗi màn hình chỉ tập trung **1 quyết định chính** — không dồn nhiều lựa chọn cùng lúc (đúng nguyên tắc "đơn giản nhất").
- Thanh tiến trình (progress bar) hiển thị xuyên suốt luồng K2→K9 để khách biết đang ở bước nào/còn bao nhiêu bước.
- Luôn có nút "Quay lại" và "Hủy" cố định vị trí, dễ thấy (trừ sau khi thanh toán xong).
- **Sticky Footer Bar** (component dùng chung K6–K8): cố định đáy màn hình, bên trái tổng tạm tính realtime, bên phải 1 nút CTA đổi nhãn theo màn hình — không phải 3 component riêng biệt.
- Card gói dịch vụ/add-on **không được tự ý rút gọn nội dung** so với dữ liệu Module 5 (ảnh, tên, giá, toàn bộ gạch đầu dòng mô tả, badge thời lượng) — dài thì cho scroll trong card, không cắt bớt.
- Bàn phím số/PIN dạng lưới `grid-cols-3`, phím vuông bo góc lớn (`rounded-xl`), phản hồi `active:scale-95` khi chạm.
- Nền sáng `bg-warm-white`/trắng, card `bg-white border border-stone-200/80 rounded-2xl shadow-sm` — độ tương phản cao để đọc được ngoài trời/dưới ánh nắng.

### 4.3 TV / Live View — Màn Hình Lớn (`/tv`, và chế độ Liveview dọc tại Kiosk `K1L`)

*Không tương tác (trừ Kiosk Liveview — chạm để thoát). Xem từ khoảng cách 5–10 mét trong khu vực chờ khách. Nguyên tắc bắt buộc: **mọi thứ to, rõ, đơn giản nhất**, và layout phải **responsive cả 2 hướng — ngang (landscape, TV treo tường tiêu chuẩn 16:9) và dọc (portrait, TV hẹp hoặc Kiosk Liveview 9:16)**.*

> **⚠️ Ghi chú hiện trạng build cần lưu ý khi phát triển tiếp:** bản dựng hiện tại (`TvQueueDisplayView` trong `src/App.tsx`) đang dùng cỡ chữ rất nhỏ (`text-[9px]`–`text-sm`) và bố cục 3 cột cố định — **chưa đạt** yêu cầu "to rõ, đơn giản nhất" để xem từ xa. Bảng kích thước tối thiểu dưới đây là **yêu cầu bắt buộc phải áp dụng khi build/refactor TV**, không phải mô tả những gì đã có sẵn.

**Kích thước tối thiểu theo khoảng cách xem 5–10m (bắt buộc):**

| Phần tử | Tối thiểu | Ghi chú |
|---|---|---|
| Biển số xe / dữ liệu chính mỗi thẻ | ≥40px, `font-sans font-black` | Phần tử quan trọng nhất mỗi card, phải đọc được từ xa nhất |
| Tên gói dịch vụ / trạng thái | ≥24px, `font-display` | |
| Nhãn phụ (label, timestamp) | ≥16px | Không dùng cỡ chữ dưới 16px ở bất kỳ đâu trên TV — khác hẳn Admin Hub |
| Đồng hồ giờ hệ thống (nếu có) | ≥48px | Đặt góc header, cùng khối với thời tiết/trạng thái kết nối |
| Khoảng cách/padding giữa các khối | rộng rãi, tối thiểu `p-6`–`p-8` | Tránh dồn ứ thông tin — 1 màn hình chỉ nên hiển thị 1 lượng thẻ vừa đủ, dùng auto-rotate/pagination nếu vượt quá 8–10 thẻ thay vì thu nhỏ chữ |

**Bố cục theo hướng màn hình:**
- **Ngang (landscape, mặc định cho TV lounge):** bố cục "bento grid" chia vùng — 1 cột "Hàng Đợi Tiếp Nhận" (hẹp hơn) + khối lớn "Trạng Thái Buồng Sản Xuất" dạng lưới 2×N card. Header ngang trên cùng: logo, tiêu đề, đồng hồ/trạng thái kết nối realtime.
- **Dọc (portrait — TV hẹp hoặc Kiosk Liveview K1L):** 3 vùng xếp chồng theo chiều dọc (stack) thay vì cột ngang — **Đang xử lý / Hàng chờ / Xong – mời nhận xe** — cùng nguồn dữ liệu `work_orders`, cùng token màu, chỉ đổi CSS layout (`flex-col` thay `grid-cols-*`). Đây là cách Kiosk K1L tái sử dụng đúng dữ liệu/thiết kế TV mà không tạo pipeline riêng (xem `kiosk-payment/prd.md` §9.7).
- Áp dụng cùng 1 breakpoint logic cho cả 2 hướng: khi `aspect-ratio` màn hình < 1 (dọc) → tự chuyển layout stack; ≥ 1 (ngang) → bento grid. Không cần 2 codebase riêng, chỉ đổi class Tailwind theo breakpoint/orientation.
- **Màu trạng thái buồng rửa** theo tiến trình (nhất quán với `WoStatus`): Xanh dương/Info = đang xử lý bước đầu (xịt bọt/sấy), Vàng = QC/gần xong, Xanh lá `brand-green` = xong/mời nhận xe, Xám `mid-gray` = trống/chờ. Badge trạng thái luôn kèm chữ, không chỉ dựa vào màu (khách mù màu vẫn đọc được).
- Card buồng "trống" (idle) dùng viền nét đứt (`border-dashed`), card "đang xử lý" có viền đặc `border-brand-green` + hiệu ứng pulse nhẹ để dễ phân biệt từ xa.
- Không có phần tử tương tác nào trên TV thường (không `cursor-pointer`, không nút) — trừ Kiosk Liveview: chạm bất kỳ đâu → thoát về màn hình đăng nhập kiosk.

---

## 5. Component Specs

### 5.1 Nút Bấm (Buttons)

| Loại | Class mẫu |
|---|---|
| **Primary (Brand Green / Volt)** | `bg-brand-green hover:bg-brand-green-hover text-matte-black font-display font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 shadow-md shadow-brand-green/10 border-0 cursor-pointer` |
| **Destructive (Đỏ)** | `bg-red-500 hover:bg-red-600 text-white font-display font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 border-0 cursor-pointer` |
| **Secondary/Neutral** | `bg-[#262626] text-gray-400 hover:text-white hover:bg-[#333333] font-display font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 border border-[#3a3a3a] cursor-pointer` (trên nền tối) hoặc viền `border-stone-300` chữ `text-slate-800` trên nền sáng (Kiosk) |
| **Solid Dark (Tertiary)** *(bổ sung 19/07/2026, đã dùng thực tế ở `ServicesModule.tsx` — "ĐỀ XUẤT ĐỔI GIÁ")* | `bg-matte-black text-white hover:bg-gray-900 font-display font-extrabold text-xs uppercase tracking-wide px-5 py-3 rounded-xl transition shadow-md cursor-pointer` — dùng cho hành động phụ nổi bật hơn Secondary nhưng không phải hành động chính của màn hình (VD: mở form đề xuất, hành động quản trị thứ cấp) trên nền sáng của Admin Hub |

Trên Kiosk, mọi nút primary phải đạt tối thiểu 64px cao (xem §4.2) — override padding mặc định ở trên khi dùng trong Kiosk.

### 5.2 Data Card

- **Card nền tối (Admin — panel hệ thống/tích hợp):** `bg-matte-black/55 border border-[#2d2d2d] p-5 rounded-2xl shadow-lg relative overflow-hidden backdrop-blur-md`
- **Card nền sáng (Admin nội dung nghiệp vụ / Kiosk):** `bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300`

### 5.3 Status Badge

Luôn dùng cặp bán trong suốt + viền cùng tông màu (xem bảng §2), kèm chữ rõ nghĩa, không chỉ icon/màu đơn thuần.

### 5.4 CRM Utility Action Link (Matte Black)

Link hành động quản trị/CRM trong sheet chi tiết (VD "Đăng ký thêm xe", "Cấp voucher thủ công") dùng chữ matte-black tương phản cao thay vì brand-green để tránh loãng màu thương hiệu:
`text-[#1a1a1a] hover:text-[#1a1a1a]/80 font-extrabold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition font-sans`

### 5.5 Icon

Toàn bộ icon **bắt buộc** import từ `lucide-react`. Không tự vẽ SVG inline, không dùng bộ icon font khác.

---

## 6. Motion & Interaction

Chuyển động phải tinh tế, có chủ đích, không gây phân tâm — dùng **Framer Motion** (`motion/react`).

- **Chuyển màn hình/module:** fade-in so le, offset `y: 15` → `y: 0`, `duration: 0.3, ease: "easeInOut"`.
- **Hover vi tương tác:** mọi nút/item danh sách có `transition-all duration-300`, kèm transform nhẹ khi phù hợp (`hover:scale-[1.02] hover:-translate-y-0.5`).
- **Nhịp đang hoạt động (pulse):** trạng thái realtime dùng chấm tròn `animate-pulse bg-brand-green h-2 w-2 rounded-full shadow-[0_0_12px_#A2C62C]`.
- TV/Kiosk Liveview: card chuyển trạng thái dùng `layout` transition (Framer Motion `layoutId`) để card "trượt" mượt giữa các vùng (Hàng chờ → Đang xử lý → Xong) thay vì giật cục.

---

## 7. Nguyên Tắc Phát Triển (Dev Guidelines)

1. **Icon:** chỉ dùng `lucide-react` (xem §5.5).
2. **Không lộ chi tiết hạ tầng:** không hiển thị port, container ID, hay trạng thái nội bộ hệ thống (VD "PORT: 3000") ra giao diện khách hàng/vận hành trừ khi được yêu cầu rõ ràng cho mục đích debug nội bộ.
3. **Lưu cục bộ có fallback:** dữ liệu phiên quan trọng (quyền hạn vai trò, phiên đăng nhập, cache catalog) dùng `localStorage`/`IndexedDB` có schema fallback để ứng dụng vẫn chạy được khi cache bị xóa — áp dụng cùng nguyên tắc offline resilience đã nêu ở `shared/nfr.md` cho giao dịch tiền mặt POS.
4. **Không dồn thông tin thừa ("anti-clutter"):** thiết kế nhãn rõ ràng, trung thực; không hiển thị telemetry kỹ thuật thô cho khách hàng.
5. **Không nút/link chết:** áp dụng xuyên suốt — tính năng chưa build phải hiển thị trạng thái "Sắp ra mắt" rõ ràng (đã nêu ở `00_master_prd.md` mục 4).

---

## 8. Nguyên Tắc Chung Toàn Dự Án (Logic Áp Dụng Mọi Module)

*Bổ sung 19/07/2026 theo yêu cầu Tiger — áp dụng cho **toàn bộ** Admin Hub, Kiosk, TV, không riêng module nào.*

### 8.1 Định Dạng Số & Tiền Tệ

Mọi số tiền, số lượng nhiều chữ số hiển thị cho người dùng **bắt buộc dùng dấu chấm `.` làm dấu phân cách hàng nghìn** (chuẩn Việt Nam: `1.234.567đ`, không dùng dấu phẩy `,`). Cách triển khai chuẩn (đã dùng đúng ở `DashboardModule.tsx`, nhân rộng cho mọi module hiển thị số):

```ts
new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
// hoặc cho số thường (không phải tiền):
new Intl.NumberFormat("vi-VN").format(number);
```

Áp dụng cho: giá dịch vụ, tổng đơn hàng, số dư quỹ, số lượng tồn kho lớn, điểm SUP, mọi bảng báo cáo tài chính (Module 3/6), Dashboard, Kiosk (K6–K8), TV. Không tự viết hàm format số riêng lẻ theo từng module.

### 8.2 Text Editor — Markdown Với Quick Toolbar

Mọi trường nhập liệu dạng "mô tả dài"/"ghi chú" trong toàn hệ thống (VD: mô tả kỹ năng `skill_catalog.description_md` — Module 8; mô tả gói dịch vụ/add-on `services.description_md` — Module 5; ghi chú vận hành dài; nội dung voucher...) **bắt buộc** dùng **1 component dùng chung duy nhất**, không viết riêng từng module — tên chuẩn: `MarkdownEditor` (component thực tế đặt tại `src/components/admin/shared/MarkdownEditor.tsx` trong `google-studio-ui-wassup-wip`).

- **Quick toolbar cố định phía trên vùng nhập:** đúng và chỉ 4 nút — **Đậm (Bold)**, **Nghiêng (Italic)**, **Gạch chân (Underline)**, **Danh sách (Bullet list)**. **Không thêm nút chèn màu chữ/HTML tùy ý** (VD nút "chữ xanh"/"chữ vàng" chèn thẳng `<span class="...">`) — đây là lỗi đã phát hiện và sửa 19/07/2026 ở `ServicesModule.tsx`, vi phạm nguyên tắc "không lưu HTML tự do" bên dưới. Có thể mở rộng thêm nút khác (heading, link...) chỉ khi nút đó vẫn xuất ra cú pháp Markdown chuẩn (không sinh ra thẻ HTML/class CSS tùy ý).
- **Áp dụng cho MỌI textarea mô tả dài, không có ngoại lệ** — kể cả ở form/modal "tạo mới" lẫn form "sửa". Một trường mô tả chỉ có toolbar ở màn hình sửa nhưng lại là `<textarea>` trơn ở màn hình tạo mới là **sai**, phải đồng bộ cả 2 nơi.
- Lưu dữ liệu dạng Markdown thuần (cột `*_md` trong DB, VD `description_md`) — **không** lưu HTML render sẵn.
- Vì Markdown chuẩn không có cú pháp gạch chân, dự án dùng quy ước mở rộng: gạch chân biểu diễn bằng thẻ inline `<u>...</u>` được phép trong nội dung Markdown (render qua cùng 1 parser dùng chung toàn dự án, sanitize để **chỉ cho phép `<u>`, không cho HTML tự do nào khác** — kể cả `<span>` có class CSS).
- Hiển thị lại (read view): render Markdown → HTML an toàn (sanitized), không hiển thị cú pháp thô (`**`, `*`, `- `) cho người dùng cuối.
- **Hiển thị đầy đủ, không cắt bớt:** mọi nơi render nội dung Markdown này ra cho khách hàng (đặc biệt card gói dịch vụ tại Kiosk K6/K7 — xem `kiosk-payment/prd.md` US-K2.2) phải hiển thị **toàn bộ** nội dung, bao gồm toàn bộ dòng gạch đầu dòng (`- ...`) — không được rút gọn/cắt bớt bullet nào. Nếu nội dung dài hơn không gian card, dùng scroll trong card thay vì cắt.
- Ví dụ tham chiếu đã áp dụng: `prd/modules/module-8-quan-ly-ktv/prd.md` S8.10 (Form Thêm/Sửa Kỹ Năng), `prd/modules/module-5-dich-vu-gia/prd.md` S5.2 (Form sửa gói dịch vụ).

### 8.3 Các chữ viết tắt 

- "Kỹ thuật viên" / "kĩ thuật viên" viết tắt thống nhất là **KTV** trong toàn bộ tài liệu PRD, giao diện, thông báo Telegram, báo cáo — không dùng biến thể khác ("KTV." có dấu chấm, "kỹthuậtviên" viết liền, v.v.).

---

## 9. Quan Hệ Với Tài Liệu Khác

- **Kiosk:** đặc tả đầy đủ tại [`kiosk-payment/prd.md`](../kiosk-payment/prd.md) §11 tham chiếu ngược lại file này cho token/màu/font; các con số kích thước tối thiểu ở §4.2 trên đây là nguồn tham chiếu chính thức (thay thế ghi chú "2 token còn thiếu" cũ trong file đó — đã đủ trong bảng §2).
- **TV:** xem [`kiosk-tv-appendix.md`](kiosk-tv-appendix.md) — TV chưa có PRD màn hình riêng đầy đủ (chỉ có bố cục kỹ thuật trong `google-studio-ui-wassup-wip/src/App.tsx` hàm `TvQueueDisplayView`); §4.3 ở trên là **yêu cầu bắt buộc** khi build/refactor, không phải mô tả nguyên trạng.
- **Toàn hệ thống:** `00_master_prd.md` mục 4 (Nguyên Tắc Bắt Buộc Toàn Hệ Thống) trỏ tới mục 8 của file này cho 3 quy tắc chung (số, Markdown editor, KTV).
