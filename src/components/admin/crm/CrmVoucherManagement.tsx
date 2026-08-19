import React, { useState } from "react";
import Drawer, { DrawerFooterButtons } from "../../common/Drawer";
import ConfirmDeleteModal from "../../common/ConfirmDeleteModal";
import {
  Gift,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit2,
  Eye,
  AlertCircle,
  Tag,
  Calendar,
  Users,
  Car,
  ChevronDown
} from "lucide-react";
import { Voucher, VoucherType } from "../../../types/voucher.types";
import { Customer, Order } from "../../../types/order.types";
import { CustomerGroup, VoucherRedemption } from "../../../lib/supabase/client";
import { toast } from "../../../lib/toast";

interface CrmVoucherManagementProps {
  vouchers: Voucher[];
  customers: Customer[];
  orders: Order[];
  groups: CustomerGroup[];
  redemptions: VoucherRedemption[];
  isMasterAdmin: boolean;
  onSaveVoucher: (voucherData: Partial<Voucher>, isEdit: boolean) => void;
  onToggleVoucherStatus: (voucher: Voucher) => void;
  onDeleteVoucher: (voucherId: string) => void;
}

export default function CrmVoucherManagement({
  vouchers,
  customers,
  orders,
  groups,
  redemptions,
  isMasterAdmin,
  onSaveVoucher,
  onToggleVoucherStatus,
  onDeleteVoucher
}: CrmVoucherManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");

  // Drawer states
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  // Form states
  const [vCode, setVCode] = useState("");
  const [vName, setVName] = useState("");
  const [vType, setVType] = useState<VoucherType>("percent");
  const [vValue, setVValue] = useState("");
  const [vMaxDiscount, setVMaxDiscount] = useState("");
  const [vMinOrder, setVMinOrder] = useState("");
  const [vValidFrom, setVValidFrom] = useState("");
  const [vValidTo, setVValidTo] = useState("");
  const [vLimitTotal, setVLimitTotal] = useState("");
  const [vLimitPerCustomer, setVLimitPerCustomer] = useState("1");
  const [vTargetType, setVTargetType] = useState<"all_customers" | "group" | "specific_customers">("all_customers");
  const [vTargetGroupId, setVTargetGroupId] = useState("");
  const [vTargetSpecificCustomers, setVTargetSpecificCustomers] = useState<string[]>([]);
  const [vVehicleClasses, setVVehicleClasses] = useState<("sedan" | "suv" | "truck")[]>(["sedan", "suv", "truck"]);
  const [vHasTimeRestriction, setVHasTimeRestriction] = useState(false);
  const [vDaysOfWeek, setVDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [vTimeFrom, setVTimeFrom] = useState("08:00");
  const [vTimeTo, setVTimeTo] = useState("18:00");

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Calculate runtime status
  const getVoucherRuntimeStatus = (v: Voucher): "active" | "paused" | "expired" => {
    if (v.status === "paused") return "paused";
    const now = new Date().toISOString().slice(0, 10);
    if (v.validTo && v.validTo < now) return "expired";
    return "active";
  };

  // --- S4.11 WIDGET THỐNG KÊ HIỆU SUẤT VOUCHER ---
  const activeVouchersCount = vouchers.filter((v) => getVoucherRuntimeStatus(v) === "active").length;

  const nowTime = new Date();
  const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nowDateStr = nowTime.toISOString().slice(0, 10);
  const expiringSoonCount = vouchers.filter((v) => {
    const st = getVoucherRuntimeStatus(v);
    return st === "active" && v.validTo >= nowDateStr && v.validTo <= next7Days;
  }).length;

  // Doanh thu quy về từ voucher (S4.11): Tổng doanh thu từ các đơn hàng có sử dụng voucher
  const voucherOrderIds = new Set(redemptions.map((r) => r.orderId));
  const revenueFromVoucherOrders = orders
    .filter((o) => (o.status === "paid" || o.status === "closed") && (voucherOrderIds.has(o.id) || (o.discount && o.discount > 0)))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Top voucher used
  const redemptionCounts: Record<string, number> = {};
  redemptions.forEach((r) => {
    redemptionCounts[r.voucherId] = (redemptionCounts[r.voucherId] || 0) + 1;
  });
  let topVoucherCode = "Chưa có";
  let topVoucherUsage = 0;
  Object.entries(redemptionCounts).forEach(([vId, count]) => {
    if (count > topVoucherUsage) {
      topVoucherUsage = count;
      const found = vouchers.find((x) => x.id === vId);
      if (found) topVoucherCode = found.code;
    }
  });

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const rStatus = getVoucherRuntimeStatus(v);
    if (statusFilter !== "all" && rStatus !== statusFilter) return false;
    if (targetFilter !== "all" && v.target_type !== targetFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = v.code.toLowerCase().includes(q);
      const matchName = (v.name || "").toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }
    return true;
  });

  // Open create / edit
  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setVCode("");
    setVName("");
    setVType("percent");
    setVValue("");
    setVMaxDiscount("");
    setVMinOrder("");
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setVValidFrom(today);
    setVValidTo(nextMonth);
    setVLimitTotal("");
    setVLimitPerCustomer("1");
    setVTargetType("all_customers");
    setVTargetGroupId("");
    setVTargetSpecificCustomers([]);
    setVVehicleClasses(["sedan", "suv", "truck"]);
    setVHasTimeRestriction(false);
    setVDaysOfWeek([1, 2, 3, 4, 5, 6, 7]);
    setVTimeFrom("08:00");
    setVTimeTo("18:00");
    setShowDrawer(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setVCode(v.code);
    setVName(v.name || "");
    setVType(v.type);
    setVValue(v.value ? v.value.toString() : "");
    setVMaxDiscount(v.maxDiscount ? v.maxDiscount.toString() : "");
    setVMinOrder(v.minOrderValue ? v.minOrderValue.toString() : "");
    setVValidFrom(v.validFrom || "");
    setVValidTo(v.validTo || "");
    setVLimitTotal(v.usage_limit_total ? v.usage_limit_total.toString() : "");
    setVLimitPerCustomer(v.usage_limit_per_customer ? v.usage_limit_per_customer.toString() : "1");
    setVTargetType(v.target_type || "all_customers");
    setVTargetGroupId(v.target_group_id || "");
    setVTargetSpecificCustomers(v.target_specific_customers || []);
    setVVehicleClasses(
      v.applicable_vehicle_classes !== undefined
        ? v.applicable_vehicle_classes
        : ["sedan", "suv", "truck"]
    );
    setVHasTimeRestriction(!!v.schedule_restriction);
    setVDaysOfWeek(v.schedule_restriction?.daysOfWeek || [1, 2, 3, 4, 5, 6, 7]);
    setVTimeFrom(v.schedule_restriction?.timeFrom || "08:00");
    setVTimeTo(v.schedule_restriction?.timeTo || "18:00");
    setShowDrawer(true);
  };

  const handleSaveSubmit = () => {
    const code = vCode.toUpperCase().trim();
    if (!code) {
      toast.error("THIẾU MÃ VOUCHER ❌", "Vui lòng nhập mã voucher (code).");
      return;
    }
    if (!vName.trim()) {
      toast.error("THIẾU TÊN CHIẾN DỊCH ❌", "Vui lòng nhập tên chiến dịch khuyến mãi.");
      return;
    }
    if (!vValidFrom || !vValidTo) {
      toast.error("THIẾU HẠN DÙNG ❌", "Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }

    const payload: Partial<Voucher> = {
      id: editingVoucher ? editingVoucher.id : undefined,
      code,
      name: vName.trim(),
      type: vType,
      value: Number(vValue) || 0,
      maxDiscount: vMaxDiscount ? Number(vMaxDiscount) : undefined,
      minOrderValue: Number(vMinOrder) || 0,
      validFrom: vValidFrom,
      validTo: vValidTo,
      usage_limit_total: vLimitTotal ? Number(vLimitTotal) : undefined,
      usage_limit_per_customer: Number(vLimitPerCustomer) || 1,
      target_type: vTargetType,
      target_group_id: vTargetType === "group" ? vTargetGroupId : undefined,
      target_specific_customers: vTargetType === "specific_customers" ? vTargetSpecificCustomers : undefined,
      applicable_vehicle_classes: vVehicleClasses,
      schedule_restriction: vHasTimeRestriction
        ? {
            daysOfWeek: vDaysOfWeek,
            timeFrom: vTimeFrom,
            timeTo: vTimeTo
          }
        : undefined
    };

    onSaveVoucher(payload, !!editingVoucher);
    setShowDrawer(false);
  };

  const handleDeleteClick = (v: Voucher) => {
    const redCount = redemptions.filter((r) => r.voucherId === v.id).length;
    if (redCount > 0) {
      toast.error("KHÔNG THỂ XÓA VOUCHER ❌", `Mã ${v.code} đã được áp dụng trong ${redCount} đơn hàng. Để bảo toàn lịch sử kế toán, bạn chỉ có thể Tạm dừng mã này.`);
      return;
    }
    setVoucherToDelete(v);
  };

  return (
    <div className="space-y-4 text-left font-sans" id="crm-vouchers-container">
      {/* S4.11 PERFORMANCE METRICS WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3" id="voucher-metrics-grid">
        <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
            Voucher đang hoạt động
          </span>
          <div className="text-2xl font-black font-display text-matte-black mt-1">
            {activeVouchersCount} <span className="text-xs font-normal text-stone-400">chiến dịch</span>
          </div>
          <span className="text-[10px] text-forest-green font-bold block mt-0.5">
            Sẵn sàng áp dụng tại quầy POS
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
            Sắp hết hạn (trong 7 ngày)
          </span>
          <div className="text-2xl font-black font-display text-amber-600 mt-1">
            {expiringSoonCount} <span className="text-xs font-normal text-stone-400">mã</span>
          </div>
          <span className="text-[10px] text-mid-gray font-medium block mt-0.5">
            Cần rà soát gia hạn chiến dịch
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
            Top voucher dùng nhiều nhất
          </span>
          <div className="text-lg font-black font-display text-matte-black mt-1 truncate">
            {topVoucherCode}
          </div>
          <span className="text-[10px] text-forest-green font-bold block mt-0.5">
            {topVoucherUsage} lượt sử dụng thành công
          </span>
        </div>

        <div className="p-4 bg-matte-black text-white rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
            Doanh thu quy về từ voucher
          </span>
          <div className="text-xl font-black font-display text-[#A2C62C] mt-1">
            {formatVnd(revenueFromVoucherOrders)}
          </div>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            Doanh thu các đơn có áp dụng ưu đãi
          </span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-3 shadow-xs space-y-2.5" id="voucher-table-toolbar">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-mid-gray" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-matte-black focus:outline-none focus:border-forest-green"
              >
              </input>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-forest-green"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="paused">Tạm dừng</option>
              <option value="expired">Hết hạn</option>
            </select>

            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-forest-green"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value="all_customers">Toàn bộ khách</option>
              <option value="group">Theo nhóm</option>
              <option value="specific_customers">Chỉ định</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold font-display uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Tạo voucher mới
          </button>
        </div>
      </div>

      {/* VOUCHERS TABLE */}
      <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-xs" id="vouchers-table-card">
        <div className="px-4 py-3 bg-stone-50 border-b border-[#e5e5e5] flex items-center justify-between">
          <span className="text-xs font-black uppercase text-matte-black font-display tracking-wider flex items-center gap-2">
            <Gift className="h-4 w-4 text-forest-green" />
            DANH SÁCH CHIẾN DỊCH VOUCHER ({filteredVouchers.length})
          </span>
          <span className="text-[11px] text-mid-gray">
            Tự động kiểm tra điều kiện dòng xe & khung giờ khi áp dụng tại POS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-stone-50/50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                <th className="p-3 pl-4">Mã Voucher / Tên chiến dịch</th>
                <th className="p-3">Loại ưu đãi</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3">Hạn hiệu lực</th>
                <th className="p-3 text-center">Lượt dùng</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 pr-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                    Không tìm thấy chiến dịch voucher nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const rStatus = getVoucherRuntimeStatus(v);
                  const vRedCount = redemptions.filter((r) => r.voucherId === v.id).length;

                  return (
                    <tr key={v.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-matte-black text-[#A2C62C] font-black text-xs rounded tracking-wider uppercase font-sans">
                            {v.code}
                          </span>
                          <span className="font-bold text-slate-900">{v.name || "Chiến dịch ưu đãi"}</span>
                        </div>
                        {v.applicable_vehicle_classes && v.applicable_vehicle_classes.length === 3 ? (
                          <span className="text-[10px] text-forest-green font-bold block mt-1">
                            Áp dụng: Tất cả các dòng xe (3/3)
                          </span>
                        ) : v.applicable_vehicle_classes && v.applicable_vehicle_classes.length > 0 ? (
                          <span className="text-[10px] text-forest-green font-bold block mt-1">
                            Áp dụng: {v.applicable_vehicle_classes.map(vc => vc.toUpperCase()).join(", ")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold block mt-1">
                            ⚠️ Không áp dụng xe nào
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-extrabold text-slate-800">
                        {v.type === "percent"
                          ? `Giảm ${v.value}%`
                          : v.type === "free_service"
                          ? "Miễn phí dịch vụ"
                          : `Giảm ${formatVnd(v.value)}`}
                        {v.maxDiscount ? (
                          <span className="block text-[10px] text-mid-gray font-normal">
                            Trần giảm: {formatVnd(v.maxDiscount)}
                          </span>
                        ) : null}
                      </td>

                      <td className="p-3 text-slate-600">
                        <span className="capitalize text-xs font-semibold block">
                          {v.target_type === "all_customers"
                            ? "Tất cả khách"
                            : v.target_type === "group"
                            ? `Nhóm: ${groups.find((g) => g.id === v.target_group_id)?.name || "Đã chọn"}`
                            : `${(v.target_specific_customers || []).length} Khách chỉ định`}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(v.validFrom).toLocaleDateString("vi-VN")} - {new Date(v.validTo).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="p-3 text-center font-bold text-slate-800">
                        {vRedCount} / {v.usage_limit_total || "∞"}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            rStatus === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rStatus === "paused"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {rStatus === "active" ? "Đang chạy" : rStatus === "paused" ? "Tạm dừng" : "Hết hạn"}
                        </span>
                      </td>

                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingVoucher(v)}
                            className="p-1.5 text-slate-600 hover:text-forest-green hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết & lịch sử dùng"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleVoucherStatus(v)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title={rStatus === "paused" ? "Tiếp tục chạy" : "Tạm dừng mã"}
                          >
                            {rStatus === "paused" ? (
                              <PlayCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <PauseCircle className="h-4 w-4 text-amber-600" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-slate-600 hover:text-forest-green hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title="Sửa chiến dịch"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(v)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa voucher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER: CREATE / EDIT EXTENDED VOUCHER */}
      <Drawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingVoucher ? `CẬP NHẬT VOUCHER: ${editingVoucher.code}` : "TẠO VOUCHER CHIẾN DỊCH MỚI"}
        subtitle="Thiết lập điều kiện, dòng xe áp dụng, hạn dùng và đối tượng áp dụng"
        icon={Gift}
        widthClass="max-w-2xl"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowDrawer(false)}
            cancelLabel="Hủy"
            onSubmit={handleSaveSubmit}
            submitLabel={editingVoucher ? "LƯU THAY ĐỔI VOUCHER" : "KÍCH HOẠT VOUCHER"}
            submitVariant="primary"
          />
        }
      >
        <div className="space-y-4 text-left font-sans" id="voucher-form-fields">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Mã Voucher (Code) *
              </label>
              <input
                type="text"
                required
                disabled={!!editingVoucher}
                placeholder="Ví dụ: SUP2026, VIP100K..."
                value={vCode}
                onChange={(e) => setVCode(e.target.value.toUpperCase())}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-stone-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Tên chiến dịch *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Tri ân khách hàng tháng 8..."
                value={vName}
                onChange={(e) => setVName(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Loại ưu đãi
              </label>
              <select
                value={vType}
                onChange={(e) => setVType(e.target.value as any)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-forest-green"
              >
                <option value="percent">Giảm phần trăm (%)</option>
                <option value="fixed_amount">Giảm tiền mặt (đ)</option>
                <option value="free_service">Miễn phí dịch vụ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Giá trị giảm *
              </label>
              <input
                type="number"
                disabled={vType === "free_service"}
                placeholder={vType === "percent" ? "Ví dụ: 10 (%)" : "Ví dụ: 50000 (đ)"}
                value={vType === "free_service" ? "" : vValue}
                onChange={(e) => setVValue(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-stone-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Trần giảm tối đa (đ)
              </label>
              <input
                type="number"
                placeholder="Không giới hạn..."
                value={vMaxDiscount}
                onChange={(e) => setVMaxDiscount(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Đơn hàng tối thiểu (đ)
              </label>
              <input
                type="number"
                placeholder="0 = Không giới hạn"
                value={vMinOrder}
                onChange={(e) => setVMinOrder(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Hiệu lực từ ngày *
              </label>
              <input
                type="date"
                required
                value={vValidFrom}
                onChange={(e) => setVValidFrom(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Đến hết ngày *
              </label>
              <input
                type="date"
                required
                value={vValidTo}
                onChange={(e) => setVValidTo(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Lượt dùng tối đa / 1 khách hàng *
              </label>
              <input
                type="number"
                min="1"
                value={vLimitPerCustomer}
                onChange={(e) => setVLimitPerCustomer(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Tổng ngân sách lượt dùng toàn hệ thống
              </label>
              <input
                type="number"
                placeholder="Không giới hạn..."
                value={vLimitTotal}
                onChange={(e) => setVLimitTotal(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
              />
            </div>
          </div>

          {/* DÒNG XE ÁP DỤNG (S4.8) */}
          <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans text-mid-gray uppercase font-black block">
                Phân hạng xe áp dụng (Vehicle Classes)
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${vVehicleClasses.length === 3 ? "text-forest-green" : vVehicleClasses.length > 0 ? "text-blue-600" : "text-red-500"}`}>
                  {vVehicleClasses.length === 3
                    ? "✓ Đang chọn tất cả (3/3 xe)"
                    : vVehicleClasses.length > 0
                    ? `Đang chọn ${vVehicleClasses.length}/3 xe`
                    : "⚠️ Chưa chọn xe nào"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (vVehicleClasses.length === 3) {
                      setVVehicleClasses([]);
                    } else {
                      setVVehicleClasses(["sedan", "suv", "truck"]);
                    }
                  }}
                  className="text-[10px] font-bold text-slate-700 hover:text-forest-green underline cursor-pointer bg-white px-2 py-0.5 rounded border border-stone-200"
                >
                  {vVehicleClasses.length === 3 ? "Bỏ chọn hết" : "Chọn tất cả"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Chọn = áp dụng, không chọn = không áp dụng. (Mặc định chọn tất cả = áp dụng hết)
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { id: "sedan", label: "Sedan (4-5 chỗ)" },
                { id: "suv", label: "SUV / CUV (5-7 chỗ)" },
                { id: "truck", label: "Bán tải / Xe tải" }
              ].map((vc) => {
                const isSelected = vVehicleClasses.includes(vc.id as any);
                return (
                  <label key={vc.id} className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setVVehicleClasses(vVehicleClasses.filter((x) => x !== vc.id));
                        } else {
                          setVVehicleClasses([...vVehicleClasses, vc.id as any]);
                        }
                      }}
                      className="rounded border-stone-300 text-forest-green focus:ring-forest-green h-4 w-4 cursor-pointer"
                    />
                    {vc.label}
                  </label>
                );
              })}
            </div>
            {vVehicleClasses.length === 0 && (
              <div className="text-[11px] text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-200 mt-1">
                ⚠️ Bạn đang không chọn phân hạng xe nào: Voucher này sẽ không thể áp dụng cho bất kỳ xe nào.
              </div>
            )}
          </div>

          {/* ĐỐI TƯỢNG ÁP DỤNG */}
          <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <label className="text-xs font-sans text-mid-gray uppercase font-black block">
              Đối tượng khách hàng áp dụng *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="vTargetType"
                  value="all_customers"
                  checked={vTargetType === "all_customers"}
                  onChange={() => setVTargetType("all_customers")}
                />
                Tất cả hội viên
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="vTargetType"
                  value="group"
                  checked={vTargetType === "group"}
                  onChange={() => setVTargetType("group")}
                />
                Theo nhóm hội viên
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="vTargetType"
                  value="specific_customers"
                  checked={vTargetType === "specific_customers"}
                  onChange={() => setVTargetType("specific_customers")}
                />
                Chỉ định thủ công
              </label>
            </div>

            {vTargetType === "group" && (
              <div className="pt-2">
                <select
                  value={vTargetGroupId}
                  onChange={(e) => setVTargetGroupId(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                >
                  <option value="">-- Chọn nhóm khách hàng --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.type === "static" ? `${g.customer_ids?.length || 0} khách` : "Nhóm động"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {vTargetType === "specific_customers" && (
              <div className="pt-2 max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-stone-200">
                <span className="text-[10px] font-black text-mid-gray uppercase block">
                  Đã chọn {vTargetSpecificCustomers.length} khách:
                </span>
                {customers.map((c) => {
                  const isChecked = vTargetSpecificCustomers.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer hover:bg-stone-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setVTargetSpecificCustomers(vTargetSpecificCustomers.filter((id) => id !== c.id));
                          } else {
                            setVTargetSpecificCustomers([...vTargetSpecificCustomers, c.id]);
                          }
                        }}
                      />
                      <span className="font-bold">{c.name}</span> - <span className="text-[10px] text-mid-gray">{c.phone}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* DRAWER: CHI TIẾT & NHẬT KÝ SỬ DỤNG (REDEMPTIONS AUDIT LOG) */}
      {viewingVoucher && (
        <Drawer
          open={!!viewingVoucher}
          onClose={() => setViewingVoucher(null)}
          title={`CHI TIẾT VOUCHER: ${viewingVoucher.code}`}
          subtitle={viewingVoucher.name || "Chiến dịch ưu đãi"}
          icon={Gift}
          widthClass="max-w-2xl"
          footer={
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                className="px-6 py-2.5 rounded-xl bg-matte-black text-white font-extrabold text-xs uppercase cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          }
        >
          {(() => {
            const vRed = redemptions.filter((r) => r.voucherId === viewingVoucher.id);
            const rStatus = getVoucherRuntimeStatus(viewingVoucher);

            return (
              <div className="space-y-4 text-left font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs">
                    <span className="text-[10px] font-black text-mid-gray uppercase block">Thông tin ưu đãi</span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {viewingVoucher.type === "percent"
                        ? `Giảm ${viewingVoucher.value}%`
                        : viewingVoucher.type === "free_service"
                        ? "Miễn phí dịch vụ"
                        : `Giảm ${formatVnd(viewingVoucher.value)}`}
                    </p>
                    <p className="text-slate-600">
                      Hiệu lực: {new Date(viewingVoucher.validFrom).toLocaleDateString("vi-VN")} - {new Date(viewingVoucher.validTo).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-slate-600">
                      Đơn tối thiểu: {viewingVoucher.minOrderValue ? formatVnd(viewingVoucher.minOrderValue) : "Không yêu cầu"}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs">
                    <span className="text-[10px] font-black text-mid-gray uppercase block">Hiệu suất sử dụng</span>
                    <p className="font-extrabold text-forest-green text-sm">
                      {vRed.length} lượt đã áp dụng
                    </p>
                    <p className="text-slate-600">
                      Giới hạn hệ thống: {viewingVoucher.usage_limit_total || "Không giới hạn"}
                    </p>
                    <p className="text-slate-600">
                      Giới hạn mỗi khách: {viewingVoucher.usage_limit_per_customer || 1} lần
                    </p>
                  </div>
                </div>

                {/* REDEMPTION LOG TABLE */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-matte-black tracking-wide block">
                    Nhật ký áp dụng thực tế ({vRed.length} bản ghi kiểm toán)
                  </span>

                  <div className="border border-[#e5e5e5] rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                          <th className="p-2.5 pl-4">Thời gian</th>
                          <th className="p-2.5">Khách hàng</th>
                          <th className="p-2.5">Mã đơn hàng</th>
                          <th className="p-2.5 text-right pr-4">Số tiền giảm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {vRed.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-stone-400 italic">
                              Chưa có lượt áp dụng nào cho voucher này.
                            </td>
                          </tr>
                        ) : (
                          vRed.map((r) => {
                            const c = customers.find((x) => x.id === r.customerId);
                            return (
                              <tr key={r.id} className="hover:bg-stone-50 transition">
                                <td className="p-2.5 pl-4 text-stone-500 text-[10px]">
                                  {new Date(r.redeemedAt).toLocaleString("vi-VN")}
                                </td>
                                <td className="p-2.5 font-bold text-slate-800">
                                  {c ? c.name : "Khách vãng lai"}
                                </td>
                                <td className="p-2.5 font-sans text-slate-600">{r.orderId}</td>
                                <td className="p-2.5 text-right pr-4 font-black text-forest-green">
                                  -{formatVnd(r.discountApplied)}
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
          })()}
        </Drawer>
      )}

      {/* CONFIRM DELETE VOUCHER MODAL */}
      <ConfirmDeleteModal
        isOpen={!!voucherToDelete}
        onClose={() => setVoucherToDelete(null)}
        onConfirm={() => {
          if (voucherToDelete) {
            onDeleteVoucher(voucherToDelete.id);
            setVoucherToDelete(null);
          }
        }}
        title="XÓA CHIẾN DỊCH VOUCHER"
        itemTypeLabel="mã voucher"
        itemName={voucherToDelete?.code || ""}
        warningDetails="Toàn bộ cấu hình giảm giá và liên kết của chiến dịch này sẽ bị xóa khỏi hệ thống. Khách hàng sẽ không còn áp dụng được mã này."
        confirmButtonText="Xóa voucher"
      />
    </div>
  );
}
