import React, { useState } from "react";
import { 
  BookOpen, 
  ArrowRight, 
  Layers, 
  UserCheck, 
  Settings, 
  CheckCircle2, 
  Sparkles,
  ClipboardList,
  Flame,
  LineChart
} from "lucide-react";

export default function PrdHandbook() {
  const [activeSec, setActiveSec] = useState<"overview" | "categories" | "flow" | "rules">("overview");

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden font-sans text-xs text-slate-700 animate-fadeIn" id="prd-handbook">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BookOpen className="h-24 w-24" />
        </div>
        <div className="flex items-center gap-2 text-forest-green font-extrabold tracking-widest text-[9px] uppercase mb-1.5">
          <Sparkles className="h-3 w-3 text-[#A2C62C]" />
          <span>SỐ HÓA KHO VẬT TƯ CAR CARE</span>
        </div>
        <h2 className="text-lg font-black font-display uppercase tracking-tight text-white">
          SỔ TAY CẨM NANG PRD & QUY TRÌNH KHO CHUẨN
        </h2>
        <p className="text-slate-400 text-[10px] mt-1 max-w-xl">
          Tài liệu yêu cầu sản phẩm (PRD) chính thức điều hướng hoạt động xuất, nhập, tồn, và kiểm đếm tại hệ thống Detailing WASSUP.
        </p>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
        <button
          onClick={() => setActiveSec("overview")}
          className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSec === "overview" 
              ? "border-[#A2C62C] text-slate-900 bg-white" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> 1. Mục Tiêu Dự Án
        </button>
        <button
          onClick={() => setActiveSec("categories")}
          className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSec === "categories" 
              ? "border-[#A2C62C] text-slate-900 bg-white" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> 2. Phân Nhóm Vật Tư
        </button>
        <button
          onClick={() => setActiveSec("flow")}
          className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSec === "flow" 
              ? "border-[#A2C62C] text-slate-900 bg-white" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ArrowRight className="h-3.5 w-3.5" /> 3. Luồng Nghiệp Vụ
        </button>
        <button
          onClick={() => setActiveSec("rules")}
          className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeSec === "rules" 
              ? "border-[#A2C62C] text-slate-900 bg-white" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Settings className="h-3.5 w-3.5" /> 4. Định Mức & Kiểm Đếm
        </button>
      </div>

      {/* Sections Content */}
      <div className="p-6 space-y-6">
        {activeSec === "overview" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight">
                1. TỔNG QUAN & MỤC TIÊU CHIẾN LƯỢC
              </h3>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                Mô hình kinh doanh Car Care & Detailing kết hợp bán lẻ phụ kiện có đặc thù quản lý kho rất phức tạp do tồn tại song song hai nhóm hàng hóa: <strong>Sản phẩm thương mại</strong> (bán đứt) và <strong>Vật tư tiêu hao kỹ thuật</strong> (chiết xuất theo định mức dịch vụ). 
                Hệ thống số hóa kho nhằm mục tiêu triệt tiêu thất thoát, tối ưu hóa dòng vốn lưu động và tự động hóa quy trình vận hành xưởng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-lime-500/5 border border-lime-500/10 rounded-xl space-y-1.5">
                <LineChart className="h-5 w-5 text-lime-600" />
                <h4 className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wider">Chính xác hóa COGS</h4>
                <p className="text-[10px] text-slate-600 leading-normal">
                  Tự động bóc tách và ghi nhận chi phí vật tư tiêu hao thực xuất vào từng lệnh dịch vụ (Repair Order - RO) cụ thể để tính lợi nhuận gộp từng ca xe.
                </p>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5">
                <Flame className="h-5 w-5 text-emerald-600" />
                <h4 className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wider">Triệt tiêu Thất Thoát</h4>
                <p className="text-[10px] text-slate-600 leading-normal">
                  Kiểm soát mức hao hụt vật tư sấy, dung dịch ủ hóa chất dưới ngưỡng <strong>1.5%</strong> thông qua cơ chế phê duyệt chéo và kiểm đếm định kỳ ngẫu nhiên.
                </p>
              </div>

              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1.5">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <h4 className="font-extrabold text-slate-950 uppercase text-[10px] tracking-wider">Chuỗi cung ứng JIT</h4>
                <p className="text-[10px] text-slate-600 leading-normal">
                  Cảnh báo thông minh tức thời (Real-time alert) khi hàng chạm điểm an toàn để lên phương án đặt hàng bổ sung nhà phân phối tự động.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSec === "categories" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight">
                2. PHÂN LOẠI CẤU TRÚC VẬT TƯ TIÊU HAO CHUẨN KHO CAR CARE
              </h3>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                Hàng hóa lưu kho tại garage được chia làm 3 phân hệ chính với cơ chế tính khấu hao, định lượng và quản lý số lượng hoàn toàn khác biệt:
              </p>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-slate-600 font-black text-[9px] uppercase border-b border-stone-200">
                    <th className="p-3">Thuộc tính</th>
                    <th className="p-3">Sản phẩm thương mại (Retail)</th>
                    <th className="p-3">Vật tư tiêu hao kỹ thuật (BOM)</th>
                    <th className="p-3">Công cụ dụng cụ (Assets/Tools)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[11px] text-slate-600">
                  <tr>
                    <td className="p-3 font-extrabold text-slate-900">Mặt hàng điển hình</td>
                    <td className="p-3">Gạt mưa Bosch, tinh dầu khử mùi, bọc vô lăng, sáp thơm...</td>
                    <td className="p-3">Dung dịch phủ Ceramic, bát đánh bóng 3M, xi bóng, xà bông Sonax...</td>
                    <td className="p-3">Cầu nâng cắt kéo, máy đánh bóng lệch tâm Rupes, máy hút bụi...</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-slate-900">UOM lưu kho</td>
                    <td className="p-3">Cái, Bộ, Chai nguyên bản (bán đứt)</td>
                    <td className="p-3">Can (20L), Chai (1L), Bộ (Kit)</td>
                    <td className="p-3">Bộ, Máy, Chiếc, Cặp</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-slate-900">Đơn vị tại xưởng</td>
                    <td className="p-3">Không có (1 xuất = 1 tiêu thụ)</td>
                    <td className="p-3">ml (Millilit), Miếng, Giọt</td>
                    <td className="p-3">Chiếc sử dụng luân phiên</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-slate-900">Cơ chế trừ kho</td>
                    <td className="p-3">Trừ trực tiếp khi hóa đơn bán hàng POS hoàn thành</td>
                    <td className="p-3">Trừ theo <strong>Định mức dịch vụ (BOM)</strong> khi chốt Lệnh (RO)</td>
                    <td className="p-3">Trích khấu hao thẳng hàng tháng (Straight-line Depreciation)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSec === "flow" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight">
                3. LUỒNG QUY TRÌNH NGHIỆP VỤ NHẬP - XUẤT SỐ HÓA
              </h3>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                Quy trình xử lý luân chuyển dòng vật tư cần tuân thủ nghiêm ngặt các bước để tránh sai lệch dữ liệu sổ thẻ kho:
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative border-l-2 border-lime-500 pl-4 space-y-1 text-[11px]">
                <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-lime-500 flex items-center justify-center text-[7px] text-white font-bold">1</div>
                <strong className="text-slate-950 uppercase tracking-wider">Quy trình Nhập kho (Inbound Logistics)</strong>
                <p className="text-slate-600">
                  Lập phiếu Nhập kho dự thảo dựa trên PO đã duyệt → Thủ kho đếm thực tế và kiểm tra chất lượng hóa chất, nhập liệu số lượng thực nhận → Hệ thống cập nhật <strong>Giá vốn bình quân gia quyền</strong> và ghi nhận công nợ.
                </p>
              </div>

              <div className="relative border-l-2 border-blue-500 pl-4 space-y-1 text-[11px]">
                <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white font-bold">2</div>
                <strong className="text-slate-950 uppercase tracking-wider">Quy trình Xuất kho thi công xưởng (Internal Outbound)</strong>
                <p className="text-slate-600">
                  Cố vấn dịch vụ tạo Lệnh (Repair Order - RO) → Hệ thống tự động bốc tách định mức hóa chất yêu cầu (BOM) theo phân khúc xe → Kỹ thuật viên ký biên bản nhận đúng số định lượng → Nếu vượt hạn mức phải có phê duyệt chéo từ Cửa hàng trưởng.
                </p>
              </div>

              <div className="relative border-l-2 border-purple-500 pl-4 space-y-1 text-[11px]">
                <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-purple-50 flex items-center justify-center border border-purple-500 text-[7px] text-purple-700 font-bold">3</div>
                <strong className="text-slate-950 uppercase tracking-wider">Hạch toán Khấu hao Định kỳ (Month-end Depreciation)</strong>
                <p className="text-slate-600">
                  Chốt giá trị tài sản ròng cuối tháng → Chạy lệnh phân bổ chi phí khấu hao đồng loạt cho các thiết bị bãi bọt theo tỷ lệ vòng đời hữu ích (Months) → Hạch toán chi phí khấu hao vào kết quả kinh doanh.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSec === "rules" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight">
                4. CƠ CHẾ KIỂM ĐẾM ĐỊNH KỲ & ĐỊNH MỨC KỸ THUẬT (BOM)
              </h3>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                Công tác quản trị kiểm kê và xây dựng BOM định mức vật tư tiêu hao giúp loại bỏ hao hụt cơ học:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-[#A2C62C]" />
                  KIỂM KHO ĐỊNH KỲ (PHYSICAL AUDIT)
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-normal">
                  <li><strong>Kiểm tuần (Cycle Count):</strong> Quét nhanh các SKU có giá trị lớn (như bát ceramic) để khớp kho cuốn chiếu hàng tuần.</li>
                  <li><strong>Kiểm tháng (Physical Count):</strong> Khóa sổ sách cuối tháng, quét đếm thực tế trên toàn bộ danh mục, auto đối lưu sai lệch, sinh phiếu điều chỉnh kho sau khi Admin duyệt duyệt.</li>
                </ul>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-[#A2C62C]" />
                  CẤU HÌNH ĐỊNH MỨC BOM (DỊCH VỤ)
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-normal">
                  <li>BOM tiêu chuẩn cho dịch vụ rửa xe: <strong>200ml xà bông bọt tuyết / xe</strong>. Can 20L sử dụng được cho 100 lượt xe.</li>
                  <li>BOM tiêu chuẩn cho gói Ceramic: <strong>30ml dung dịch Ceramic base + 15ml topcoat + 2 khăn lau mịn</strong>.</li>
                  <li>Mọi lượng dùng phát sinh ngoài BOM sẽ được báo cáo "Lãng phí & Vượt định mức" quy trách nhiệm nhân sự.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-stone-50 border-t border-stone-150 text-slate-500 font-sans text-[10px] flex justify-between items-center">
        <span>Tài liệu số hiệu: <strong>PRD-WASSUP-INV-2026-V1</strong></span>
        <span>Phê duyệt bởi: <strong>Master Admin - Nguyễn Văn Hùng</strong></span>
      </div>
    </div>
  );
}
