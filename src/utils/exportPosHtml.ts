import { OrderStatusView } from "../types/workOrder.types";

interface ExportPosData {
  orders: OrderStatusView[];
  activeShift: {
    cashierName: string;
    shiftType: string;
    openTime: string;
    openCash: number;
    sales: any[];
  };
  phieuThuList: any[];
  phieuChiList: any[];
  auditLogs: any[];
  shiftHistory: any[];
}

export function exportPosModuleToHtml(data: ExportPosData) {
  const exportTime = new Date().toLocaleString("vi-VN");

  const totalSalesRevenue = data.orders.reduce((sum, o) => {
    return sum + (o.commerceStatus === "paid" ? (o.total || 0) : 0);
  }, 0);

  const totalPhieuThu = data.phieuThuList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPhieuChi = data.phieuChiList.reduce((sum, p) => sum + (p.amount || 0), 0);

  const ordersHtml = data.orders
    .map(
      (o, idx) => `
    <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
      <td class="py-2.5 px-3 font-semibold text-gray-500">${idx + 1}</td>
      <td class="py-2.5 px-3 font-mono font-bold text-gray-800">${o.orderId || o.id}</td>
      <td class="py-2.5 px-3 font-bold text-slate-900">${o.licensePlate || "N/A"}</td>
      <td class="py-2.5 px-3">${o.customerName || "Khách vãng vãng"}</td>
      <td class="py-2.5 px-3 uppercase font-semibold text-gray-700">${o.packageCode || "Gói Dịch Vụ"}</td>
      <td class="py-2.5 px-3 font-bold text-right text-emerald-700">${(o.total || 0).toLocaleString("vi-VN")} đ</td>
      <td class="py-2.5 px-3 text-center">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          o.commerceStatus === "paid"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800"
        }">
          ${o.commerceStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
        </span>
      </td>
      <td class="py-2.5 px-3 text-center uppercase text-[11px] font-semibold text-gray-600">
        QR Chuyển Khoản / Tiền Mặt
      </td>
    </tr>
  `
    )
    .join("");

  const phieuThuHtml = data.phieuThuList
    .map(
      (pt) => `
    <tr class="border-b border-gray-100 text-xs">
      <td class="py-2 px-3 font-mono font-bold text-emerald-700">${pt.id}</td>
      <td class="py-2 px-3">${new Date(pt.timestamp).toLocaleString("vi-VN")}</td>
      <td class="py-2 px-3 font-medium">${pt.customerName}</td>
      <td class="py-2 px-3 font-bold">${pt.licensePlate || "N/A"}</td>
      <td class="py-2 px-3 text-right font-bold text-emerald-600">${pt.amount.toLocaleString("vi-VN")} đ</td>
      <td class="py-2 px-3 uppercase text-[10px] font-bold text-gray-500">${pt.paymentMethod}</td>
    </tr>
  `
    )
    .join("");

  const phieuChiHtml = data.phieuChiList
    .map(
      (pc) => `
    <tr class="border-b border-gray-100 text-xs">
      <td class="py-2 px-3 font-mono font-bold text-rose-700">${pc.id}</td>
      <td class="py-2 px-3">${new Date(pc.timestamp).toLocaleString("vi-VN")}</td>
      <td class="py-2 px-3 font-medium">${pc.recipient}</td>
      <td class="py-2 px-3 text-gray-600">${pc.notes}</td>
      <td class="py-2 px-3 text-right font-bold text-rose-600">-${pc.amount.toLocaleString("vi-VN")} đ</td>
      <td class="py-2 px-3 font-bold text-stone-700">${pc.approvedBy}</td>
    </tr>
  `
    )
    .join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Module 3: POS Thu Ngân - Wassup Car Service</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; padding: 0 !important; }
      .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 p-4 md:p-8 min-h-screen">
  <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
    
    <!-- HEADER BAR -->
    <div class="bg-slate-950 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-1 bg-lime-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded">WASSUP CAR SERVICE</span>
          <span class="text-xs text-slate-400 font-mono">EXPORT MODULE 3 (M3 POS)</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">BÁO CÁO POS THU NGÂN & CA KÍP</h1>
        <p class="text-xs text-slate-400 mt-1">Xuất dữ liệu hệ thống bán hàng, sổ quỹ thu chi & biên bản bàn giao ca trực</p>
      </div>
      
      <div class="text-right no-print flex flex-col items-end gap-2">
        <button onclick="window.print()" class="px-4 py-2 bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-2 shadow">
          🖨️ In / Tải PDF
        </button>
        <span class="text-[11px] text-slate-400">Thời gian xuất: ${exportTime}</span>
      </div>
    </div>

    <!-- SUMMARY METRICS -->
    <div class="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
      <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">TỔNG QUAN DÒNG TIỀN TRONG CA</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-[11px] font-bold text-slate-400 uppercase">Thu Ngân Ca Trực</p>
          <p class="text-lg font-black text-slate-900 mt-1">${data.activeShift.cashierName}</p>
          <span class="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">${data.activeShift.shiftType}</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-[11px] font-bold text-slate-400 uppercase">Tổng Doanh Thu Đơn Hàng</p>
          <p class="text-xl font-black text-emerald-600 mt-1">${totalSalesRevenue.toLocaleString("vi-VN")} đ</p>
          <p class="text-[10px] text-slate-500 mt-1">${data.orders.length} đơn dịch vụ đã ghi nhận</p>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-[11px] font-bold text-slate-400 uppercase">Quỹ Thu Khác (Phiếu Thu)</p>
          <p class="text-xl font-black text-blue-600 mt-1">+${totalPhieuThu.toLocaleString("vi-VN")} đ</p>
          <p class="text-[10px] text-slate-500 mt-1">${data.phieuThuList.length} phiếu thu ngoài POS</p>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-[11px] font-bold text-slate-400 uppercase">Quỹ Chi Tiền (Phiếu Chi)</p>
          <p class="text-xl font-black text-rose-600 mt-1">-${totalPhieuChi.toLocaleString("vi-VN")} đ</p>
          <p class="text-[10px] text-slate-500 mt-1">${data.phieuChiList.length} phiếu chi duyệt tiền mặt</p>
        </div>

      </div>
    </div>

    <!-- MAIN ORDERS TABLE -->
    <div class="p-6 md:p-8 space-y-8">
      <div>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            📊 DANH SÁCH ĐƠN HÀNG & HÓA ĐƠN POS (${data.orders.length})
          </h2>
        </div>
        
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th class="py-3 px-3">#</th>
                <th class="py-3 px-3">Mã Đơn</th>
                <th class="py-3 px-3">Biển Số Xe</th>
                <th class="py-3 px-3">Khách Hàng</th>
                <th class="py-3 px-3">Gói Dịch Vụ</th>
                <th class="py-3 px-3 text-right">Thành Tiền</th>
                <th class="py-3 px-3 text-center">Trạng Thái</th>
                <th class="py-3 px-3 text-center">P.Thức Thanh Toán</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${ordersHtml || '<tr><td colspan="8" class="text-center py-6 text-slate-400 text-xs">Không có dữ liệu đơn hàng</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- PHIẾU THU & PHIẾU CHI SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- PHIẾU THU -->
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2">
            🟢 SỔ CÁI PHIẾU THU TĂNG QUỸ
          </h3>
          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-emerald-900 text-white text-[10px] font-bold uppercase">
                  <th class="py-2.5 px-3">Mã PT</th>
                  <th class="py-2.5 px-3">Thời Gian</th>
                  <th class="py-2.5 px-3">Nộp Tiền</th>
                  <th class="py-2.5 px-3">Biển Số</th>
                  <th class="py-2.5 px-3 text-right">Số Tiền</th>
                  <th class="py-2.5 px-3">Hình Thức</th>
                </tr>
              </thead>
              <tbody>
                ${phieuThuHtml || '<tr><td colspan="6" class="text-center py-4 text-slate-400 text-xs">Chưa phát sinh phiếu thu</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- PHIẾU CHI -->
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider text-rose-800 mb-3 flex items-center gap-2">
            🔴 SỔ CÁI PHIẾU CHI TẢI QUỸ
          </h3>
          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-rose-950 text-white text-[10px] font-bold uppercase">
                  <th class="py-2.5 px-3">Mã PC</th>
                  <th class="py-2.5 px-3">Thời Gian</th>
                  <th class="py-2.5 px-3">Người Nhận</th>
                  <th class="py-2.5 px-3">Lý Do Chi</th>
                  <th class="py-2.5 px-3 text-right">Số Tiền</th>
                  <th class="py-2.5 px-3">Người Duyệt</th>
                </tr>
              </thead>
              <tbody>
                ${phieuChiHtml || '<tr><td colspan="6" class="text-center py-4 text-slate-400 text-xs">Chưa phát sinh phiếu chi</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- SIGNATURE SECTION FOR ACCOUNTING PRINTING -->
      <div class="pt-8 border-t border-slate-200 grid grid-cols-3 text-center text-xs text-slate-600">
        <div>
          <p class="font-bold text-slate-900 uppercase">Người Lập Báo Cáo</p>
          <p class="text-[10px] text-slate-400 italic mt-1">(Ký & ghi rõ họ tên)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-800">${data.activeShift.cashierName}</p>
        </div>
        <div>
          <p class="font-bold text-slate-900 uppercase">Thu Ngân Ca Trực</p>
          <p class="text-[10px] text-slate-400 italic mt-1">(Ký & xác nhận tiền mặt)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-800">${data.activeShift.cashierName}</p>
        </div>
        <div>
          <p class="font-bold text-slate-900 uppercase">Kế Toán / Quản Lý Trạm</p>
          <p class="text-[10px] text-slate-400 italic mt-1">(Ký & đóng dấu duyệt sổ)</p>
          <div class="h-16"></div>
          <p class="font-semibold text-slate-800">Đã Kiểm Duyệt</p>
        </div>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="bg-slate-900 text-slate-400 text-center py-4 text-[11px] border-t border-slate-800">
      M3 POS Module Report • Wassup Car Service Operational System • File generated automatically
    </div>

  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `M3_POS_Module_Export_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
