import React, { useState } from "react";
import {
  ChevronLeft,
  UserCheck,
  Phone,
  Calendar,
  MapPin,
  Car,
  Plus,
  Edit2,
  Trash2,
  Gift,
  Coins,
  History,
  AlertTriangle,
  Shield,
  Tag,
  CheckCircle2,
  Clock,
  Briefcase,
  TrendingUp,
  Sparkles,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { Customer, Order } from "../../../types/order.types";
import { Voucher } from "../../../types/voucher.types";
import { CustomerGroup } from "../../../lib/supabase/client";
import ConfirmDeleteModal from "../../common/ConfirmDeleteModal";
import { toast } from "../../../lib/toast";

export interface SupLedgerEntry {
  id: string;
  customerId: string;
  customerName?: string;
  pointsChanged: number;
  balanceAfter: number;
  reason: string;
  date?: string;
  createdAt?: string;
  performedBy?: string;
  orderId?: string;
  type?: string;
  typeLabel?: string;
}

interface CrmCustomerDetailProps {
  customer: Customer;
  orders: Order[];
  vouchers: Voucher[];
  groups: CustomerGroup[];
  ledger?: SupLedgerEntry[];
  isMasterAdmin: boolean;
  onBack: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onOpenVehicleModal: (vehicle: { plate: string; vehicleClass: "sedan" | "suv" | "truck"; car_brand?: string; car_model?: string } | null) => void;
  onDeleteVehicle: (plate: string) => void;
  onOpenPointsModal: (customer: Customer) => void;
  onOpenProposalModal: (customer: Customer) => void;
  onOpenPointsHistory: (customer: Customer) => void;
  onOpenEmergencyCompensation: (customer: Customer) => void;
  onOpenManualGrantVoucher: (customer: Customer) => void;
  onToggleStaticGroup: (groupId: string, customerId: string, isMember: boolean) => void;
}

type DetailTab = "overview" | "vehicles_history" | "sup_ledger" | "vouchers" | "emergency";

export default function CrmCustomerDetail({
  customer,
  orders,
  vouchers,
  groups,
  ledger = [],
  isMasterAdmin,
  onBack,
  onEditCustomer,
  onDeleteCustomer,
  onOpenVehicleModal,
  onDeleteVehicle,
  onOpenPointsModal,
  onOpenProposalModal,
  onOpenPointsHistory,
  onOpenEmergencyCompensation,
  onOpenManualGrantVoucher,
  onToggleStaticGroup
}: CrmCustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [activeVehicleTab, setActiveVehicleTab] = useState<string>("all");
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(false);

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Normalize customer vehicles
  const vehicles = (Array.isArray(customer?.vehicles) && customer.vehicles.length > 0)
    ? customer.vehicles.filter(v => Boolean(v?.plate))
    : (Array.isArray(customer?.licensePlates) ? customer.licensePlates : (customer?.licensePlate ? [customer.licensePlate] : [])).map((p) => ({
        plate: p || "",
        vehicleClass: "sedan" as const
      })).filter(v => Boolean(v.plate));

  // Customer orders
  const safeOrders = Array.isArray(orders) ? orders : [];
  const customerOrders = safeOrders.filter(
    (o) =>
      (o?.customerId && o.customerId === customer?.id) ||
      (o?.customerPhone && customer?.phone && o.customerPhone === customer.phone) ||
      (o?.licensePlate && vehicles.some((v) => v?.plate && v.plate.toUpperCase() === (o.licensePlate || "").toUpperCase()))
  );

  const totalSpent = customerOrders
    .filter((o) => o && (o.status === "paid" || o.status === "closed"))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Filtered orders for active vehicle tab
  const displayedOrders =
    activeVehicleTab === "all"
      ? customerOrders
      : customerOrders.filter(
          (o) => o?.licensePlate && o.licensePlate.toUpperCase() === activeVehicleTab.toUpperCase()
        );

  // Customer active vouchers
  const safeVouchers = Array.isArray(vouchers) ? vouchers : [];
  const safeGroups = Array.isArray(groups) ? groups : [];
  const customerVouchers = safeVouchers.filter(
    (v) =>
      v &&
      (v.customerId === customer?.id ||
      v.target_type === "all_customers" ||
      (v.target_type === "specific_customers" && v.target_specific_customers?.includes(customer?.id || "")) ||
      (v.target_type === "group" &&
        safeGroups.some(
          (g) =>
            g.id === v.target_group_id &&
            (g.customer_ids?.includes(customer?.id || "") || g.type === "dynamic")
        )))
  );

  // Static groups for membership management
  const staticGroups = groups.filter((g) => g.type === "static");

  // Customer ledger items (sorted by timestamp descending)
  const customerLedger = ledger
    .filter((l) => l.customerId === customer.id)
    .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());

  const handleDeleteVehicleClick = (vPlate: string) => {
    const hasHistory = orders.some(
      (o) => o.licensePlate && o.licensePlate.toUpperCase() === vPlate.toUpperCase()
    );
    if (hasHistory) {
      toast.error(
        "KHÔNG THỂ XÓA XE ❌",
        `Xe biển số ${vPlate} đã phát sinh lịch sử dịch vụ trong hệ thống. Để bảo toàn kiểm toán doanh thu, không được xóa xe này.`
      );
      return;
    }
    setVehicleToDelete(vPlate);
  };

  const navItems: { id: DetailTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: "overview", label: "Tổng quan & Thông tin", icon: UserCheck },
    {
      id: "vehicles_history",
      label: "Danh sách xe & Lịch sử",
      icon: Car,
      badge: `${vehicles.length} xe`
    },
    {
      id: "sup_ledger",
      label: "Điểm SUP & Nhật ký",
      icon: Coins,
      badge: `${customer.points || 0} SUP`
    },
    {
      id: "vouchers",
      label: "Voucher & Khuyến mãi",
      icon: Gift,
      badge: customerVouchers.length > 0 ? `${customerVouchers.length}` : undefined
    },
    { id: "emergency", label: "Bồi hoàn khẩn cấp", icon: AlertTriangle }
  ];

  return (
    <div className="space-y-4 text-left font-sans" id="crm-customer-detail-page">
      {/* 1. TOP HEADER & BREADCRUMB WITH BACK BUTTON */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 hover:bg-stone-100 rounded-xl transition text-stone-700 border border-stone-200 bg-white shadow-3xs flex items-center gap-1.5 text-xs font-bold font-sans cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-stone-600" />
            <span>Quay lại</span>
          </button>

          <div className="h-6 w-px bg-stone-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider text-forest-green uppercase block font-sans">
                CRM & HỘI VIÊN • HỒ SƠ CHI TIẾT
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-green/20 text-forest-green font-bold uppercase">
                {customer.points >= 300 ? "VIP MEMBER" : customer.points >= 100 ? "LOYAL MEMBER" : "REGULAR MEMBER"}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black font-display text-matte-black uppercase tracking-tight mt-0.5">
              {customer.name}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            onClick={() => onEditCustomer(customer)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-slate-700 bg-white hover:bg-stone-50 transition text-xs font-bold font-display uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
          >
            <Edit2 className="h-3.5 w-3.5 text-stone-500" />
            <span>Sửa thông tin</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenManualGrantVoucher(customer)}
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-slate-700 bg-white hover:bg-stone-50 transition text-xs font-bold font-display uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
          >
            <Gift className="h-3.5 w-3.5 text-[#A2C62C]" />
            <span>Cấp Voucher</span>
          </button>

          {isMasterAdmin && onDeleteCustomer && (
            <button
              type="button"
              onClick={() => setShowDeleteCustomerConfirm(true)}
              className="px-3 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100/60 transition text-xs font-bold font-display uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa hội viên</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenEmergencyCompensation(customer)}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-xs font-bold font-display uppercase cursor-pointer flex items-center gap-1.5 shadow-xs border-0"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Bồi hoàn</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN VIEW LAYOUT (MATCHING MODULE 8 STANDARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT SIDEBAR (col-span-4 or 3) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Overview Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-matte-black to-stone-800 text-white flex items-center justify-center font-display font-black text-xl shadow-xs shrink-0">
                {customer.name ? customer.name.slice(0, 1).toUpperCase() : "C"}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-matte-black truncate uppercase">{customer.name}</h3>
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-forest-green" /> {customer.phone}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Tham gia: {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Quick Metrics Pills */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-black text-mid-gray uppercase block">Lũy kế chi tiêu</span>
                <span className="font-extrabold text-forest-green text-sm block mt-0.5">
                  {formatVnd(totalSpent)}
                </span>
                <span className="text-[10px] text-stone-400 block">{customerOrders.length} đơn hoàn tất</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-[10px] font-black text-mid-gray uppercase block">Điểm tích lũy SUP</span>
                <span className="font-extrabold text-[#A2C62C] text-sm block mt-0.5 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" /> {customer.points || 0}
                </span>
                <span className="text-[10px] text-stone-400 block">Sẵn sàng đổi quà</span>
              </div>
            </div>

            {/* Static Group membership pills */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
                  Nhóm khách hàng (Tĩnh)
                </span>
                <span className="text-[10px] text-stone-400">Click để thêm/gỡ</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {staticGroups.length === 0 ? (
                  <span className="text-[11px] text-stone-400 italic">Chưa có nhóm tĩnh nào</span>
                ) : (
                  staticGroups.map((g) => {
                    const isMember = (g.customer_ids || []).includes(customer.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onToggleStaticGroup(g.id, customer.id, !isMember)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                          isMember
                            ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            : "bg-white text-stone-500 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        <Tag className="h-3 w-3" />
                        <span>{g.name}</span>
                        {isMember ? (
                          <CheckCircle2 className="h-3 w-3 text-purple-600" />
                        ) : (
                          <Plus className="h-3 w-3 text-stone-400" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Vertical Navigation Menu */}
          <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    isActive
                      ? "bg-matte-black text-white shadow-xs"
                      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-[#A2C62C]" : "text-stone-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isActive
                          ? "bg-stone-800 text-[#A2C62C]"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT DETAIL CONTENT (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs min-h-[500px]">
          {/* TAB 1: OVERVIEW & PERSONAL INFO */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-forest-green" />
                  THÔNG TIN ĐỊNH DANH & LIÊN HỆ
                </h3>
                <p className="text-[11px] text-mid-gray font-sans mt-0.5">
                  Dữ liệu khách hàng chính xác được đồng bộ và bảo mật trong toàn hệ thống Station OS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-black text-stone-400 uppercase">Họ và tên</span>
                  <span className="font-black text-sm text-matte-black block">{customer.name}</span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-black text-stone-400 uppercase">Số điện thoại (ID định danh)</span>
                  <span className="font-extrabold text-sm text-forest-green flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {customer.phone}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-black text-stone-400 uppercase">Ngày sinh (DOB)</span>
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-mid-gray" />
                    {customer.dob ? new Date(customer.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật ngày sinh"}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-black text-stone-400 uppercase">Địa chỉ liên hệ</span>
                  <span className="font-medium text-xs text-slate-800 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-mid-gray shrink-0" />
                    {customer.address || "Chưa có địa chỉ thường trú"}
                  </span>
                </div>
              </div>

              {/* Quick Vehicle Summary in Overview */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-matte-black uppercase flex items-center gap-2">
                    <Car className="h-4 w-4 text-forest-green" />
                    Phương tiện liên kết ({vehicles.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenVehicleModal(null)}
                    className="text-xs font-bold text-forest-green hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Thêm xe
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicles.length === 0 ? (
                    <div className="col-span-2 p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-400 italic">
                      Chưa có xe nào được đăng ký.
                    </div>
                  ) : (
                    vehicles.map((v) => (
                      <div
                        key={v.plate}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-matte-black text-[#A2C62C] font-black text-xs rounded uppercase font-sans">
                              {v.plate}
                            </span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase bg-white px-1.5 py-0.5 rounded border border-stone-200">
                              {v.vehicleClass.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-600 block">
                            {v.car_brand || "Hãng xe"} {v.car_model ? `- ${v.car_model}` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenVehicleModal(v)}
                            className="p-1.5 text-stone-500 hover:text-forest-green hover:bg-stone-200/60 rounded-lg transition cursor-pointer"
                            title="Sửa xe"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLES & SERVICE CARE HISTORY */}
          {activeTab === "vehicles_history" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                    <Car className="h-4 w-4 text-forest-green" />
                    DANH SÁCH XE & LỊCH SỬ THI CÔNG DỊCH VỤ
                  </h3>
                  <p className="text-[11px] text-mid-gray font-sans mt-0.5">
                    Toàn bộ lịch sử các lượt rửa xe, gói dịch vụ và add-on đã thực hiện.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenVehicleModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs border-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm xe mới
                </button>
              </div>

              {/* Vehicle cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {vehicles.length === 0 ? (
                  <div className="col-span-3 p-4 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-center text-xs text-mid-gray">
                    Hội viên chưa có xe nào. Bấm "Thêm xe mới" để liên kết.
                  </div>
                ) : (
                  vehicles.map((v) => {
                    const vehicleOrdersCount = orders.filter(
                      (o) => o.licensePlate && o.licensePlate.toUpperCase() === v.plate.toUpperCase()
                    ).length;

                    return (
                      <div
                        key={v.plate}
                        className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex flex-col justify-between space-y-2 hover:border-forest-green/60 transition shadow-3xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs font-sans px-2 py-0.5 bg-matte-black text-[#A2C62C] rounded uppercase tracking-wide">
                              {v.plate}
                            </span>
                            <span className="text-[10px] font-bold text-stone-600 uppercase bg-white px-1.5 py-0.5 rounded border border-stone-200">
                              {v.vehicleClass.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs font-bold text-slate-900 block">
                              {v.car_brand || "Chưa rõ hãng"} {v.car_model ? `- ${v.car_model}` : ""}
                            </span>
                            <span className="text-[10px] text-mid-gray block">
                              {vehicleOrdersCount} lượt dịch vụ đã hoàn tất
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-200/70">
                          <button
                            type="button"
                            onClick={() => onOpenVehicleModal(v)}
                            className="p-1 text-slate-600 hover:text-forest-green hover:bg-stone-200 rounded transition cursor-pointer"
                            title="Sửa xe"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicleClick(v.plate)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Xóa xe"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Service History Filter & Table */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1.5 border-b border-stone-200 pb-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveVehicleTab("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeVehicleTab === "all"
                        ? "bg-matte-black text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    Tất cả xe ({customerOrders.length})
                  </button>
                  {vehicles.map((v) => (
                    <button
                      key={v.plate}
                      type="button"
                      onClick={() => setActiveVehicleTab(v.plate)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        activeVehicleTab === v.plate
                          ? "bg-forest-green text-white"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      {v.plate} (
                      {orders.filter((o) => o.licensePlate?.toUpperCase() === v.plate.toUpperCase()).length}
                      )
                    </button>
                  ))}
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                        <th className="p-2.5 pl-4">Mã đơn</th>
                        <th className="p-2.5">Thời gian</th>
                        <th className="p-2.5">Biển số</th>
                        <th className="p-2.5">Gói dịch vụ</th>
                        <th className="p-2.5 text-right">Tổng tiền</th>
                        <th className="p-2.5 pr-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {displayedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                            Chưa có lịch sử dịch vụ nào cho bộ lọc này.
                          </td>
                        </tr>
                      ) : (
                        displayedOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-stone-50/70 transition">
                            <td className="p-2.5 pl-4 font-bold text-matte-black">{o.id}</td>
                            <td className="p-2.5 text-slate-500 text-[11px]">
                              {new Date(o.createdAt).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short"
                              })}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">{o.licensePlate}</td>
                            <td className="p-2.5 font-medium text-slate-700">{o.packageCode || "Dịch vụ"}</td>
                            <td className="p-2.5 text-right font-extrabold text-forest-green">
                              {formatVnd(o.total)}
                            </td>
                            <td className="p-2.5 pr-4 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  o.status === "paid" || o.status === "closed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : o.status === "cancelled"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUP POINTS LEDGER & AUDIT */}
          {activeTab === "sup_ledger" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-matte-black text-white p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    Số dư điểm thưởng hiện tại
                  </span>
                  <div className="text-2xl font-black text-[#A2C62C] font-display flex items-center gap-2 mt-0.5">
                    <Coins className="h-6 w-6" /> {customer.points || 0} SUP
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Áp dụng tỷ lệ tích 5% giá trị hóa đơn, đổi voucher 1:1 theo chính sách trạm.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isMasterAdmin ? (
                    <button
                      type="button"
                      onClick={() => onOpenPointsModal(customer)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer border-0 shadow-xs"
                    >
                      <Shield className="h-3.5 w-3.5" /> Điều chỉnh điểm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenProposalModal(customer)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer border-0 shadow-xs"
                    >
                      <Clock className="h-3.5 w-3.5" /> Đề xuất duyệt điểm
                    </button>
                  )}
                </div>
              </div>

              {/* Points Ledger Entries */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-matte-black uppercase flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-forest-green" />
                    TOÀN BỘ NHẬT KÝ BIẾN ĐỘNG ĐIỂM ({customerLedger.length} bản ghi)
                  </h4>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Cuộn dọc để xem toàn bộ lịch sử
                  </span>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-3xs flex flex-col h-[calc(100vh-280px)] min-h-[380px]">
                  <div className="overflow-y-auto flex-1 scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-stone-100/95 backdrop-blur-xs shadow-2xs">
                        <tr className="text-slate-600 font-extrabold text-[10px] uppercase border-b border-stone-200">
                          <th className="p-3 pl-4">Thời gian</th>
                          <th className="p-3">Loại giao dịch / Lý do</th>
                          <th className="p-3 text-center">Biến động</th>
                          <th className="p-3 text-right">Số dư sau</th>
                          <th className="p-3 pr-4 text-right">Người thực hiện</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {customerLedger.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-stone-400 italic">
                              Chưa có bản ghi biến động điểm nào trong sổ cái.
                            </td>
                          </tr>
                        ) : (
                          customerLedger.map((row) => (
                            <tr key={row.id} className="hover:bg-stone-50/80 transition">
                              <td className="p-3 pl-4 text-stone-600 text-[11px] font-medium whitespace-nowrap">
                                {new Date(row.date || row.createdAt || Date.now()).toLocaleString("vi-VN")}
                              </td>
                              <td className="p-3 font-bold text-slate-800">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{row.reason}</span>
                                  {row.orderId && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                      #{row.orderId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs ${
                                    row.pointsChanged > 0
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                                  }`}
                                >
                                  {row.pointsChanged > 0 ? (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <ArrowDownLeft className="h-3.5 w-3.5 text-red-600" />
                                  )}
                                  {row.pointsChanged > 0 ? `+${row.pointsChanged}` : row.pointsChanged} SUP
                                </span>
                              </td>
                              <td className="p-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                {row.balanceAfter} SUP
                              </td>
                              <td className="p-3 pr-4 text-right text-stone-500 text-[11px] whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium border border-stone-200">
                                  {row.performedBy || row.typeLabel || "Hệ thống"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VOUCHERS & PROMOTIONS */}
          {activeTab === "vouchers" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#A2C62C]" />
                    VOUCHER & QUYỀN LỢI ƯU ĐÃI ({customerVouchers.length})
                  </h3>
                  <p className="text-[11px] text-mid-gray font-sans mt-0.5">
                    Các chiến dịch khuyến mãi hội viên, voucher cá nhân và mã ưu đãi khả dụng.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenManualGrantVoucher(customer)}
                  className="px-3.5 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs border-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Cấp voucher riêng
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {customerVouchers.length === 0 ? (
                  <div className="col-span-2 p-8 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-center text-xs text-mid-gray">
                    Hội viên hiện chưa có mã voucher ưu đãi nào. Bấm <strong>"Cấp voucher riêng"</strong> để tặng ưu đãi đặc cách.
                  </div>
                ) : (
                  customerVouchers.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-start justify-between shadow-3xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-matte-black text-[#A2C62C] font-black text-xs rounded uppercase font-sans tracking-wider">
                            {v.code}
                          </span>
                          <span className="text-xs font-black text-forest-green">
                            {v.type === "percent"
                              ? `Giảm ${v.value}%`
                              : v.type === "free_service"
                              ? "Miễn phí dịch vụ"
                              : `Giảm ${formatVnd(v.value)}`}
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-900 mt-1.5">{v.name || "Voucher ưu đãi"}</p>
                        <span className="text-[11px] text-stone-500 block">
                          Hạn dùng: {new Date(v.validTo).toLocaleDateString("vi-VN")}
                        </span>
                        {v.applicable_vehicle_classes && v.applicable_vehicle_classes.length > 0 && (
                          <span className="text-[10px] text-purple-700 font-bold block">
                            Áp dụng: {v.applicable_vehicle_classes.map((vc) => vc.toUpperCase()).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: EMERGENCY COMPENSATION & INCIDENT RESOLUTION */}
          {activeTab === "emergency" && (
            <div className="space-y-6">
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-red-900 uppercase flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  BÀN BỒI HOÀN KHẨN CẤP / XỬ LÝ KHIẾU NẠI DỊCH VỤ
                </h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Công cụ hỗ trợ quản lý giải quyết khiếu nại chất lượng rửa/chăm sóc xe tức thời bằng cách phát hành điểm thưởng SUP đền bù hoặc cấp Voucher đặc cách trực tiếp vào ví hội viên.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenEmergencyCompensation(customer)}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs border-0 flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" /> Mở bàn bồi hoàn khẩn cấp
                  </button>
                </div>
              </div>

              {/* Policy notes */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
                <span className="font-extrabold text-stone-800 uppercase block">Quy chuẩn xử lý sự cố (SLA Station):</span>
                <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                  <li>Sự cố nhẹ (chờ quá 15 phút, vết bẩn nhỏ): Bồi hoàn 50 – 100 điểm SUP hoặc Voucher 10%.</li>
                  <li>Sự cố trung bình (lỗi dịch vụ cần rửa lại): Bồi hoàn 100 – 300 điểm SUP hoặc Voucher rửa miễn phí lần sau.</li>
                  <li>Mọi giao dịch bồi hoàn đều được ghi nhận vào nhật ký kiểm toán với lý do bắt buộc.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM DELETE VEHICLE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={() => {
          if (vehicleToDelete) {
            onDeleteVehicle(vehicleToDelete);
            setVehicleToDelete(null);
          }
        }}
        title="XÓA PHƯƠNG TIỆN LIÊN KẾT"
        itemTypeLabel="biển số xe"
        itemName={vehicleToDelete || ""}
        warningDetails={`Phương tiện sẽ bị gỡ vĩnh viễn khỏi hồ sơ hội viên ${customer.name}.`}
        confirmButtonText="Xóa phương tiện"
      />

      {/* CONFIRM DELETE CUSTOMER MODAL */}
      <ConfirmDeleteModal
        isOpen={showDeleteCustomerConfirm}
        onClose={() => setShowDeleteCustomerConfirm(false)}
        onConfirm={() => {
          setShowDeleteCustomerConfirm(false);
          if (onDeleteCustomer) {
            onDeleteCustomer(customer.id);
          }
        }}
        title="XÓA HỒ SƠ HỘI VIÊN"
        itemTypeLabel="hội viên"
        itemName={customer.name}
        warningDetails={`Hồ sơ hội viên ${customer.name} (${customer.phone}) cùng các thiết lập liên quan sẽ bị xóa khỏi hệ thống.`}
        confirmButtonText="Xóa hội viên"
      />
    </div>
  );
}
