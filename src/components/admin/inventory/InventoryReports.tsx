import React, { useState } from "react";
import { 
  LineChart, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  BarChart, 
  Percent, 
  Users, 
  Layers, 
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: "commercial" | "consumable" | "tool";
  categoryLabel: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  pricePerUnit: number;
  lastUpdated: string;
  purchaseDate?: string;
  usefulLifeMonths?: number;
  originalValue?: number;
  currentValue?: number;
}

interface InventoryReportsProps {
  items: InventoryItem[];
}

export default function InventoryReports({ items }: InventoryReportsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"variance" | "turnover" | "asset">("variance");

  // Calculate ending inventory totals
  const totalCommercialValue = items
    .filter(i => i.category === "commercial")
    .reduce((sum, i) => sum + (i.quantity * i.pricePerUnit), 0);

  const totalConsumableValue = items
    .filter(i => i.category === "consumable")
    .reduce((sum, i) => sum + (i.quantity * i.pricePerUnit), 0);

  const totalToolValue = items
    .filter(i => i.category === "tool")
    .reduce((sum, i) => {
      // Use current book value if available, else original value, else calculated
      const val = i.currentValue ?? i.originalValue ?? (i.quantity * i.pricePerUnit);
      return sum + val;
    }, 0);

  const totalInventoryValue = totalCommercialValue + totalConsumableValue + totalToolValue;

  // Mock data for BOM variance report
  const techVarianceData = [
    { ktv: "KTV-08 Nguyễn Tuấn Anh", standard: 2400, actual: 3100, orders: 12, wastePct: 29.1 },
    { ktv: "KTV-03 Trần Hoàng Hải", standard: 1800, actual: 1850, orders: 9, wastePct: 2.7 },
    { ktv: "KTV-11 Vũ Đức Duy", standard: 3000, actual: 3900, orders: 15, wastePct: 30.0 },
    { ktv: "KTV-05 Lê Minh Tuấn", standard: 1600, actual: 1550, orders: 8, wastePct: -3.1 },
    { ktv: "KTV-09 Hoàng Quốc Việt", standard: 2200, actual: 2450, orders: 11, wastePct: 11.3 }
  ];

  // Mock data for Inventory turnover report
  const turnoverItems = [
    { name: "Gạt mưa Bosch Aerotwin 22 inch", costOfSales: 18200000, avgInv: 3500000, turnover: 5.2, days: 70, speed: "Nhanh", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Dầu bóng lốp xe Sonax Xtreme", costOfSales: 12400000, avgInv: 4100000, turnover: 3.0, days: 121, speed: "Trung bình", style: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "Dung dịch bôi phủ Ceramic Kisho", costOfSales: 45000000, avgInv: 6000000, turnover: 7.5, days: 48, speed: "Nhanh", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Khăn lau xe microfiber chuyên dụng", costOfSales: 3100000, avgInv: 1500000, turnover: 2.1, days: 173, speed: "Chậm", style: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Tinh dầu khử mùi bưởi da xanh", costOfSales: 950000, avgInv: 2500000, turnover: 0.38, days: 960, speed: "Ồn ứ - Giảm nhập", style: "bg-red-50 text-red-700 border-red-200" }
  ];

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="inventory-reports">
      {/* Sub Tabs */}
      <div className="flex gap-2 p-1.5 bg-stone-100 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveSubTab("variance")}
          className={`flex-1 py-2 text-center rounded-lg font-display font-black text-[10px] tracking-wider uppercase transition cursor-pointer ${
            activeSubTab === "variance" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          1. LÃNG PHÍ & BỌC TÁCH BOM
        </button>
        <button
          onClick={() => setActiveSubTab("turnover")}
          className={`flex-1 py-2 text-center rounded-lg font-display font-black text-[10px] tracking-wider uppercase transition cursor-pointer ${
            activeSubTab === "turnover" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          2. HỆ SỐ QUAY VÒNG
        </button>
        <button
          onClick={() => setActiveSubTab("asset")}
          className={`flex-1 py-2 text-center rounded-lg font-display font-black text-[10px] tracking-wider uppercase transition cursor-pointer ${
            activeSubTab === "asset" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          3. GIÁ TRỊ KHO CUỐI KỲ
        </button>
      </div>

      {/* SUB-TAB 1: BOM VARIANCE REPORT */}
      {activeSubTab === "variance" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Variance Explanation & Top KTV Waste (3/5) */}
          <div className="lg:col-span-3 bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-5">
            <div className="border-b border-stone-150 pb-3 flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">
                  BÁO CÁO HAO PHÍ & VƯỢT ĐỊNH MỨC THEO KỸ THUẬT VIÊN
                </h3>
                <p className="text-[10px] text-slate-400">Đối chiếu lượng hóa chất bọt tuyết SOAP lý thuyết định mức so với thực tế xuất kho.</p>
              </div>
              <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center gap-1 text-[9px] font-extrabold uppercase">
                <AlertTriangle className="h-3.5 w-3.5" /> HAO PHÍ TRUNG BÌNH 16.4%
              </span>
            </div>

            {/* Custom Aesthetic Bar Chart with pure Tailwind */}
            <div className="space-y-4 pt-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">LƯỢNG HÓA CHẤT TIÊU DÙNG THEO KỸ THUẬT (MILILIT - ML)</span>
              
              <div className="space-y-3">
                {techVarianceData.map((tech) => {
                  const maxVal = 4500;
                  const stdPercent = (tech.standard / maxVal) * 100;
                  const actPercent = (tech.actual / maxVal) * 100;

                  return (
                    <div key={tech.ktv} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-900">{tech.ktv}</span>
                        <div className="flex gap-2.5 font-sans">
                          <span className="text-slate-400">Định mức: <strong className="text-slate-700">{tech.standard} ml</strong></span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-800">Thực tế: <strong className="text-slate-950 font-bold">{tech.actual} ml</strong></span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Standard Bar (Grey) */}
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden relative">
                          <div 
                            className="bg-slate-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stdPercent}%` }}
                          />
                        </div>
                        {/* Actual Bar (Lime or Red depending on variance) */}
                        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              tech.wastePct > 15 ? "bg-red-500" : tech.wastePct > 0 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${actPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Lệnh thực hiện: {tech.orders} ca xe</span>
                        <span className={`font-black uppercase ${
                          tech.wastePct > 15 ? "text-red-600" : tech.wastePct > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {tech.wastePct > 0 ? `Vượt định mức +${tech.wastePct}%` : `Tiết kiệm ${tech.wastePct}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variance Analytics Dashboard & Actions (2/5) */}
          <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-display font-black text-xs text-matte-black uppercase tracking-wider border-b border-stone-150 pb-2.5">
              PHÂN TÍCH NGUYÊN NHÂN LÃNG PHÍ
            </h4>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1.5">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  ĐẦU VÒNG PHUN BỌT CAO ÁP SẠI ĐỊNH MỨC
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Lượng bọt hao phí cao nhất tập trung vào <strong>KTV-08</strong> và <strong>KTV-11</strong> do sử dụng đầu vòi Tornado tự chế có áp lực phun rộng hơn tiêu chuẩn xưởng. Khuyến nghị kiểm tra súng và thu hồi súng phun tự chế đầu tuần tới.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">KHUYẾN NGHỊ PHÒNG NGỪA (JIT)</span>
                
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Yêu cầu ký nhận xà phòng SOAP theo từng Lệnh RO. Nghiêm cấm hạch toán bù hoặc tự ý mở can mà không ký số.</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 bg-lime-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Đào tạo lại kỹ năng rải bọt chéo giúp tiết kiệm 15% dung dịch mà vẫn đảm bảo độ bóng sạch.</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Khen thưởng <strong>KTV-05 Lê Minh Tuấn</strong> do kiểm soát tốt định lượng đạt độ phủ tối ưu dưới định mức (-3.1%).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVENTORY TURNOVER REPORT */}
      {activeSubTab === "turnover" && (
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-[#e5e5e5] pb-3 flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">
                BÁO CÁO HIỆU SUẤT QUAY VÒNG KHO (TURNOVER RATIO)
              </h3>
              <p className="text-[10px] text-slate-400">Đo lường thời gian lưu kho trung bình của các SKU để tránh đọng vốn lưu động.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-stone-50 text-slate-600 font-black text-[9px] uppercase border-b border-stone-200">
                  <th className="p-3 pl-4">Tên mặt hàng (SKU)</th>
                  <th className="p-3 text-right">Giá trị xuất dùng trong kỳ (COGS)</th>
                  <th className="p-3 text-right">Giá trị tồn trung bình</th>
                  <th className="p-3 text-center">Hệ số quay vòng (Vòng/Năm)</th>
                  <th className="p-3 text-center">Số ngày tồn kho (Days)</th>
                  <th className="p-3 text-right pr-4">Khuyến nghị điều phối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[11.5px] text-slate-600">
                {turnoverItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-4 font-bold text-slate-950">{item.name}</td>
                    <td className="p-3 text-right font-sans">{formatVnd(item.costOfSales)}</td>
                    <td className="p-3 text-right font-sans">{formatVnd(item.avgInv)}</td>
                    <td className="p-3 text-center font-sans font-extrabold text-slate-800">{item.turnover}</td>
                    <td className="p-3 text-center font-sans font-extrabold text-slate-800">{item.days} ngày</td>
                    <td className="p-3 text-right pr-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${item.style}`}>
                        {item.speed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ENDING INVENTORY ASSET VALUE */}
      {activeSubTab === "asset" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-[#A2C62C] font-black uppercase tracking-widest block">TỔNG GIÁ TRỊ TÀI SẢN KHO</span>
              <h4 className="text-2xl font-sans font-black text-white">{formatVnd(totalInventoryValue)}</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal pt-4 border-t border-slate-800/80 mt-4">
              Bao gồm hàng hóa thương mại bán lẻ POS, hóa chất sỉ tiêu hao và công cụ máy móc ròng sau khấu hao.
            </p>
          </div>

          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-3">
            <span className="text-[9px] text-[#a5a5a5] font-black uppercase tracking-widest block">CƠ CẤU PHÂN PHỐI GIÁ TRỊ TÀI SẢN KHO</span>
            
            <div className="space-y-3 pt-1 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-950">Hàng thương mại</span>
                  <span className="font-sans text-slate-500">{formatVnd(totalCommercialValue)} ({((totalCommercialValue / (totalInventoryValue || 1)) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(totalCommercialValue / (totalInventoryValue || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-950">Vật tư tiêu hao</span>
                  <span className="font-sans text-slate-500">{formatVnd(totalConsumableValue)} ({((totalConsumableValue / (totalInventoryValue || 1)) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${(totalConsumableValue / (totalInventoryValue || 1)) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-950">Công cụ dụng cụ ròng</span>
                  <span className="font-sans text-slate-500">{formatVnd(totalToolValue)} ({((totalToolValue / (totalInventoryValue || 1)) * 100).toFixed(1)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${(totalToolValue / (totalInventoryValue || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4 text-xs font-sans flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[9px] text-[#a5a5a5] font-black uppercase tracking-widest block">ĐÁNH GIÁ SỨC KHỎE DÒNG VỐN KHO</span>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <span className="text-[10px] font-black uppercase text-emerald-800 block">KHO ĐẠT CHỈ SỐ AN TOÀN CAO</span>
                <p className="text-[10.5px] text-slate-600 leading-relaxed mt-0.5">
                  Tỷ lệ vốn lưu động chết trong kho dưới <strong>30%</strong> tổng tài xưởng. Tốc độ quay vòng bình quân đạt <strong>4.8 lần/năm</strong>, đảm bảo tính thanh khoản cực cao và rủi ro hết hạn sử dụng hóa chất bằng không.
                </p>
              </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-extrabold uppercase font-display tracking-wider hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#A2C62C]" />
              XUẤT FILE BÁO CÁO TÀI CHÍNH KHO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
