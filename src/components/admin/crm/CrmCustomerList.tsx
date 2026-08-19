import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Car,
  Coins,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Phone,
  Calendar,
  X
} from "lucide-react";
import { Customer, Order } from "../../../types/order.types";
import { CustomerGroup } from "../../../lib/supabase/client";
import { toast } from "../../../lib/toast";

interface PointAdjustmentProposal {
  id: string;
  customerId: string;
  customerName: string;
  pointsChanged: number;
  reason: string;
  proposerId: string;
  proposerName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface CrmCustomerListProps {
  customers: Customer[];
  orders: Order[];
  groups: CustomerGroup[];
  isMasterAdmin: boolean;
  proposals: PointAdjustmentProposal[];
  onOpenCustomerModal: (customer?: Customer) => void;
  onSelectCustomer: (customer: Customer) => void;
  onApproveProposal: (proposal: PointAdjustmentProposal) => void;
  onRejectProposal: (proposal: PointAdjustmentProposal) => void;
}

export default function CrmCustomerList({
  customers,
  orders,
  groups,
  isMasterAdmin,
  proposals,
  onOpenCustomerModal,
  onSelectCustomer,
  onApproveProposal,
  onRejectProposal
}: CrmCustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpent, setFilterSpent] = useState("all");
  const [filterVisits, setFilterVisits] = useState("all");
  const [filterLastVisit, setFilterLastVisit] = useState("all");
  const [filterDobMonth, setFilterDobMonth] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Mask phone for Manager (Master Admin gets full phone)
  const maskPhone = (phone: string) => {
    if (isMasterAdmin) return phone;
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, -3) + "***";
  };

  // Helper metrics per customer
  const getCustomerMetrics = (c: Customer) => {
    const cVehicles = (c.vehicles && c.vehicles.length > 0)
      ? c.vehicles
      : (c.licensePlates || (c.licensePlate ? [c.licensePlate] : [])).map(p => ({
          plate: p,
          vehicleClass: "sedan" as const
        }));

    const cOrders = orders.filter(
      (o) =>
        (o.customerId && o.customerId === c.id) ||
        (o.customerPhone && o.customerPhone === c.phone) ||
        cVehicles.some((v) => v.plate.toUpperCase() === (o.licensePlate || "").toUpperCase())
    );

    const totalSpent = cOrders
      .filter((o) => o.status === "paid" || o.status === "closed")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const visitsCount = cOrders.length;

    let lastVisitDate: Date | null = null;
    if (cOrders.length > 0) {
      const dates = cOrders.map(o => new Date(o.createdAt).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        lastVisitDate = new Date(Math.max(...dates));
      }
    }

    return {
      vehicles: cVehicles,
      totalSpent,
      visitsCount,
      lastVisitDate
    };
  };

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const metrics = getCustomerMetrics(c);

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchPlate = metrics.vehicles.some(v => v.plate.toLowerCase().includes(q));
      if (!matchName && !matchPhone && !matchPlate) return false;
    }

    // Filter spent
    if (filterSpent === "under_1m" && metrics.totalSpent >= 1000000) return false;
    if (filterSpent === "1m_5m" && (metrics.totalSpent < 1000000 || metrics.totalSpent > 5000000)) return false;
    if (filterSpent === "over_5m" && metrics.totalSpent <= 5000000) return false;

    // Filter visits
    if (filterVisits === "under_3" && metrics.visitsCount >= 3) return false;
    if (filterVisits === "3_10" && (metrics.visitsCount < 3 || metrics.visitsCount > 10)) return false;
    if (filterVisits === "over_10" && metrics.visitsCount <= 10) return false;

    // Filter last visit
    if (filterLastVisit !== "all") {
      if (!metrics.lastVisitDate) return false;
      const daysAgo = (Date.now() - metrics.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
      if (filterLastVisit === "7_days" && daysAgo > 7) return false;
      if (filterLastVisit === "30_days" && daysAgo > 30) return false;
      if (filterLastVisit === "over_30" && daysAgo <= 30) return false;
    }

    // Filter DOB month
    if (filterDobMonth !== "all") {
      if (!c.dob) return false;
      const birthMonth = (new Date(c.dob).getMonth() + 1).toString();
      if (birthMonth !== filterDobMonth) return false;
    }

    return true;
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["ID", "Họ và tên", "Số điện thoại", "Danh sách biển số xe", "Điểm SUP", "Tổng chi tiêu", "Lượt ghé", "Ngày tham gia"];
    const rows = filteredCustomers.map((c) => {
      const metrics = getCustomerMetrics(c);
      const platesStr = metrics.vehicles.map(v => `${v.plate} (${v.vehicleClass})`).join("; ");
      return [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${maskPhone(c.phone)}"`,
        `"${platesStr}"`,
        c.points || 0,
        metrics.totalSpent,
        metrics.visitsCount,
        new Date(c.createdAt).toLocaleDateString("vi-VN")
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_hoi_vien_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("XUẤT FILE CSV THÀNH CÔNG 📄", `Đã tải xuống danh sách ${filteredCustomers.length} hội viên.`);
  };

  const pendingProposals = proposals.filter((p) => p.status === "pending");

  return (
    <div className="space-y-4 text-left font-sans" id="crm-customer-list-container">
      {/* PENDING PROPOSALS BANNER FOR MASTER ADMIN */}
      {isMasterAdmin && pendingProposals.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-3" id="pending-proposals-card">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black font-display tracking-wider text-amber-900 uppercase flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 animate-pulse" />
              ĐỀ XUẤT ĐIỀU CHỈNH ĐIỂM SUP CHỜ DUYỆT ({pendingProposals.length})
            </h4>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200/50 px-2 py-0.5 rounded-full">
              Quyền Master Admin
            </span>
          </div>

          <div className="border border-amber-200/80 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                  <th className="p-2.5 pl-4">Thời gian</th>
                  <th className="p-2.5">Khách hàng</th>
                  <th className="p-2.5">Người đề xuất</th>
                  <th className="p-2.5 text-center">Điểm đề xuất</th>
                  <th className="p-2.5">Lý do</th>
                  <th className="p-2.5 pr-4 text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pendingProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition">
                    <td className="p-2.5 pl-4 text-stone-500 text-[10px]">
                      {new Date(p.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-2.5 font-bold text-matte-black">{p.customerName}</td>
                    <td className="p-2.5 text-slate-600">{p.proposerName}</td>
                    <td className={`p-2.5 text-center font-black ${p.pointsChanged >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {p.pointsChanged >= 0 ? `+${p.pointsChanged}` : p.pointsChanged} SUP
                    </td>
                    <td className="p-2.5 text-stone-600 max-w-xs truncate" title={p.reason}>{p.reason}</td>
                    <td className="p-2.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApproveProposal(p)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1 border-0"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectProposal(p)}
                          className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1 border-0"
                        >
                          <XCircle className="h-3 w-3" /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOOLBAR: SEARCH, ADVANCED FILTER TOGGLE, EXPORT, REGISTER */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-3 shadow-xs space-y-3" id="crm-table-toolbar">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-mid-gray" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, biển số xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-matte-black focus:outline-none focus:border-forest-green"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-display uppercase transition flex items-center gap-1.5 cursor-pointer border ${
                showAdvancedFilters
                  ? "bg-matte-black text-white border-matte-black"
                  : "bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Bộ lọc nâng cao
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-slate-700 hover:bg-stone-50 text-xs font-bold font-display uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Xuất file CSV danh sách hội viên"
            >
              <Download className="h-3.5 w-3.5 text-forest-green" />
              Xuất CSV
            </button>

            <button
              type="button"
              onClick={() => onOpenCustomerModal()}
              className="px-4 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold font-display uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs border-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Đăng ký hội viên
            </button>
          </div>
        </div>

        {/* ADVANCED FILTER PANEL */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-stone-150 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs" id="crm-advanced-filters">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-mid-gray uppercase block">Chi tiêu tích lũy</label>
              <select
                value={filterSpent}
                onChange={(e) => setFilterSpent(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
              >
                <option value="all">Tất cả mức chi</option>
                <option value="under_1m">Dưới 1,000,000đ</option>
                <option value="1m_5m">Từ 1M - 5M đ</option>
                <option value="over_5m">Trên 5,000,000đ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-mid-gray uppercase block">Số lần ghé dịch vụ</label>
              <select
                value={filterVisits}
                onChange={(e) => setFilterVisits(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
              >
                <option value="all">Tất cả lượt ghé</option>
                <option value="under_3">Dưới 3 lần</option>
                <option value="3_10">Từ 3 đến 10 lần</option>
                <option value="over_10">Trên 10 lần</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-mid-gray uppercase block">Lần ghé gần nhất</label>
              <select
                value={filterLastVisit}
                onChange={(e) => setFilterLastVisit(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="7_days">Trong 7 ngày qua</option>
                <option value="30_days">Trong 30 ngày qua</option>
                <option value="over_30">Hơn 30 ngày chưa ghé</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-mid-gray uppercase block">Tháng sinh nhật</label>
              <select
                value={filterDobMonth}
                onChange={(e) => setFilterDobMonth(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
              >
                <option value="all">Tất cả các tháng</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CUSTOMERS TABLE */}
      <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-xs" id="crm-main-table-card">
        <div className="px-4 py-3 bg-stone-50 border-b border-[#e5e5e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-forest-green" />
            <span className="text-xs font-black uppercase text-matte-black font-display tracking-wider">
              DANH SÁCH HỘI VIÊN ({filteredCustomers.length} hồ sơ)
            </span>
          </div>
          <span className="text-[11px] text-mid-gray">
            Hiển thị tích điểm SUP & phương tiện liên kết
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-stone-50/50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                <th className="p-3 pl-4">Khách hàng</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Phương tiện liên kết</th>
                <th className="p-3 text-center">Điểm SUP</th>
                <th className="p-3 text-right">Chi tiêu lũy kế</th>
                <th className="p-3 pr-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                    Không tìm thấy hội viên nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const metrics = getCustomerMetrics(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCustomer(c)}
                      className="hover:bg-stone-50/80 transition cursor-pointer group"
                    >
                      <td className="p-3 pl-4">
                        <div className="font-bold text-slate-900 group-hover:text-forest-green transition">
                          {c.name}
                        </div>
                        <span className="text-[10px] text-stone-400 block font-normal">
                          Gia nhập: {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-stone-400" />
                          {maskPhone(c.phone)}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {metrics.vehicles.length === 0 ? (
                            <span className="text-[10px] text-stone-400 italic">Chưa có xe</span>
                          ) : (
                            metrics.vehicles.map((v) => (
                              <span
                                key={v.plate}
                                className="px-2 py-0.5 bg-stone-100 text-slate-800 rounded font-sans text-[10px] font-bold border border-stone-200/60"
                              >
                                {v.plate}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center font-black text-slate-800">
                        <span className="inline-flex items-center gap-1 text-forest-green bg-brand-green/15 px-2 py-0.5 rounded-full text-xs">
                          <Coins className="h-3 w-3" /> {c.points || 0} SUP
                        </span>
                      </td>

                      <td className="p-3 text-right font-extrabold text-slate-900">
                        {formatVnd(metrics.totalSpent)}
                      </td>

                      <td className="p-3 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(c)}
                          className="px-3 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Eye className="h-3.5 w-3.5 text-forest-green" /> Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
