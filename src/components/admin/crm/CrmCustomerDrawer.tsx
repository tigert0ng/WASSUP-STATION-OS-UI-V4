import React, { useState } from "react";
import Drawer from "../../common/Drawer";
import ConfirmDeleteModal from "../../common/ConfirmDeleteModal";
import {
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
  Send,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Clock,
  Wrench,
  CheckCircle2,
  Tag
} from "lucide-react";
import { Customer, Order } from "../../../types/order.types";
import { Voucher } from "../../../types/voucher.types";
import { CustomerGroup } from "../../../lib/supabase/client";
import { toast } from "../../../lib/toast";

interface CrmCustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  orders: Order[];
  vouchers: Voucher[];
  groups: CustomerGroup[];
  isMasterAdmin: boolean;
  onEditCustomer: (customer: Customer) => void;
  onOpenVehicleModal: (vehicle: { plate: string; vehicleClass: "sedan" | "suv" | "truck"; car_brand?: string; car_model?: string } | null) => void;
  onDeleteVehicle: (plate: string) => void;
  onOpenPointsModal: (customer: Customer) => void;
  onOpenProposalModal: (customer: Customer) => void;
  onOpenPointsHistory: (customer: Customer) => void;
  onOpenEmergencyCompensation: (customer: Customer) => void;
  onOpenManualGrantVoucher: (customer: Customer) => void;
  onToggleStaticGroup: (groupId: string, customerId: string, isMember: boolean) => void;
}

export default function CrmCustomerDrawer({
  open,
  onClose,
  customer,
  orders,
  vouchers,
  groups,
  isMasterAdmin,
  onEditCustomer,
  onOpenVehicleModal,
  onDeleteVehicle,
  onOpenPointsModal,
  onOpenProposalModal,
  onOpenPointsHistory,
  onOpenEmergencyCompensation,
  onOpenManualGrantVoucher,
  onToggleStaticGroup
}: CrmCustomerDrawerProps) {
  if (!customer) return null;

  const [activeVehicleTab, setActiveVehicleTab] = useState<string>("all");
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Normalize customer vehicles
  const vehicles = (customer.vehicles && customer.vehicles.length > 0)
    ? customer.vehicles
    : (customer.licensePlates || (customer.licensePlate ? [customer.licensePlate] : [])).map(p => ({
        plate: p,
        vehicleClass: "sedan" as const
      }));

  // Customer orders
  const customerOrders = orders.filter(
    (o) =>
      (o.customerId && o.customerId === customer.id) ||
      (o.customerPhone && o.customerPhone === customer.phone) ||
      vehicles.some((v) => v.plate.toUpperCase() === (o.licensePlate || "").toUpperCase())
  );

  const totalSpent = customerOrders
    .filter((o) => o.status === "paid" || o.status === "closed")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Filtered orders for active vehicle tab
  const displayedOrders = activeVehicleTab === "all"
    ? customerOrders
    : customerOrders.filter(o => o.licensePlate && o.licensePlate.toUpperCase() === activeVehicleTab.toUpperCase());

  // Customer active vouchers
  const customerVouchers = vouchers.filter(
    (v) =>
      v.customerId === customer.id ||
      v.target_type === "all_customers" ||
      (v.target_type === "specific_customers" && v.target_specific_customers?.includes(customer.id)) ||
      (v.target_type === "group" && groups.some(g => g.id === v.target_group_id && (g.customer_ids?.includes(customer.id) || g.type === "dynamic")))
  );

  // Static groups for membership management (US-4.11 / FR-4.5b)
  const staticGroups = groups.filter(g => g.type === "static");

  const handleDeleteVehicleClick = (vPlate: string) => {
    const hasHistory = orders.some(o => o.licensePlate && o.licensePlate.toUpperCase() === vPlate.toUpperCase());
    if (hasHistory) {
      toast.error("KHÔNG THỂ XÓA XE ❌", `Xe biển số ${vPlate} đã phát sinh lịch sử dịch vụ trong hệ thống. Để bảo toàn kiểm toán doanh thu, không được xóa xe này.`);
      return;
    }
    setVehicleToDelete(vPlate);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={customer.name}
      subtitle={`Hồ sơ định danh SĐT: ${customer.phone}`}
      icon={UserCheck}
      widthClass="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-mid-gray font-sans">
            Ngày đăng ký: <strong className="text-matte-black">{new Date(customer.createdAt).toLocaleDateString("vi-VN")}</strong>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEditCustomer(customer)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-slate-700 bg-white hover:bg-stone-100 transition text-xs font-bold font-display uppercase cursor-pointer flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5 text-mid-gray" />
              Sửa hồ sơ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-matte-black text-white hover:bg-stone-800 transition text-xs font-bold font-display uppercase cursor-pointer"
            >
              Đóng hồ sơ
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-left font-sans" id={`customer-drawer-content-${customer.id}`}>
        {/* SECTION 1: PROFILE SUMMARY & METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Box 1: Core details */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider">Thông tin cá nhân</span>
              <span className="text-[10px] bg-brand-green/20 text-forest-green px-2 py-0.5 rounded-full font-bold">
                {vehicles.length} Phương tiện
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-stone-400 text-[10px] block">Số điện thoại</span>
                <span className="font-extrabold text-matte-black flex items-center gap-1">
                  <Phone className="h-3 w-3 text-forest-green" /> {customer.phone}
                </span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] block">Ngày sinh (DOB)</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-mid-gray" /> {customer.dob ? new Date(customer.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 text-[10px] block">Địa chỉ liên hệ</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-mid-gray shrink-0" /> {customer.address || "Chưa có địa chỉ thường trú"}
                </span>
              </div>
            </div>

            {/* Static Group membership (US-4.11 / FR-4.5b) */}
            <div className="pt-2 border-t border-stone-200">
              <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block mb-1.5">
                Nhóm khách hàng (Tĩnh)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {staticGroups.length === 0 ? (
                  <span className="text-[11px] text-stone-400 italic">Chưa có nhóm tĩnh nào được tạo</span>
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
                        title={isMember ? "Bấm để gỡ khỏi nhóm này" : "Bấm để thêm vào nhóm này"}
                      >
                        <Tag className="h-3 w-3" />
                        {g.name}
                        {isMember ? (
                          <CheckCircle2 className="h-3 w-3 text-purple-600 ml-0.5" />
                        ) : (
                          <Plus className="h-3 w-3 text-stone-400 ml-0.5" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Box 2: Spent & SUP Points */}
          <div className="p-4 bg-matte-black text-white rounded-2xl flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Doanh thu lũy kế</span>
              <div className="text-lg font-black text-[#A2C62C] font-display mt-0.5">
                {formatVnd(totalSpent)}
              </div>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                {customerOrders.length} lượt ghé trạm
              </span>
            </div>

            <div className="pt-3 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Điểm SUP hiện có</span>
                <span className="text-xs font-black text-[#A2C62C] flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" /> {customer.points || 0} SUP
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => onOpenPointsHistory(customer)}
                  className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer border-0"
                >
                  <History className="h-3 w-3 text-[#A2C62C]" /> Lịch sử
                </button>
                {isMasterAdmin ? (
                  <button
                    type="button"
                    onClick={() => onOpenPointsModal(customer)}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer border-0"
                  >
                    <Shield className="h-3 w-3" /> Chỉnh điểm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenProposalModal(customer)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer border-0"
                  >
                    <Clock className="h-3 w-3" /> Đề xuất
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: VEHICLE MANAGEMENT & CARE HISTORY (S4.3) */}
        <div className="space-y-3" id="customer-vehicles-section">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                <Car className="h-4 w-4 text-forest-green" />
                DANH SÁCH XE & LỊCH SỬ CHĂM SÓC
              </h4>
              <p className="text-[10px] text-mid-gray font-sans mt-0.5">
                Quản lý các phương tiện thuộc sở hữu của hội viên, tra cứu lịch sử thi công theo từng biển số.
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

          {/* Vehicle cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {vehicles.length === 0 ? (
              <div className="col-span-3 p-4 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-center text-xs text-mid-gray">
                Hội viên chưa đăng ký phương tiện nào. Bấm <strong>"Thêm xe mới"</strong> để liên kết xe đầu tiên.
              </div>
            ) : (
              vehicles.map((v) => {
                const vehicleOrdersCount = orders.filter(
                  (o) => o.licensePlate && o.licensePlate.toUpperCase() === v.plate.toUpperCase()
                ).length;

                return (
                  <div
                    key={v.plate}
                    className="p-3 bg-white border border-[#e5e5e5] rounded-xl hover:border-forest-green/60 transition shadow-xs flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs font-sans px-2 py-0.5 bg-slate-900 text-[#A2C62C] rounded tracking-wide uppercase">
                          {v.plate}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500 uppercase bg-stone-100 px-1.5 py-0.5 rounded">
                          {v.vehicleClass.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-xs font-bold text-slate-800 block">
                          {v.car_brand || "Chưa rõ hãng"} {v.car_model ? `- ${v.car_model}` : ""}
                        </span>
                        <span className="text-[10px] text-mid-gray block">
                          {vehicleOrdersCount} lượt dịch vụ đã thực hiện
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => onOpenVehicleModal(v)}
                        className="p-1 text-slate-600 hover:text-forest-green hover:bg-stone-100 rounded transition cursor-pointer"
                        title="Sửa thông tin xe"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicleClick(v.plate)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Xóa xe khỏi hồ sơ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Vehicle History Tab Selector */}
          {vehicles.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 border-b border-stone-200 pb-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveVehicleTab("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    activeVehicleTab === "all"
                      ? "bg-matte-black text-white"
                      : "text-mid-gray hover:text-matte-black hover:bg-stone-100"
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
                        : "text-mid-gray hover:text-matte-black hover:bg-stone-100"
                    }`}
                  >
                    {v.plate} ({orders.filter(o => o.licensePlate?.toUpperCase() === v.plate.toUpperCase()).length})
                  </button>
                ))}
              </div>

              {/* Orders Table for Selected Vehicle */}
              <div className="mt-2 border border-stone-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                      <th className="p-2.5 pl-4">Mã đơn</th>
                      <th className="p-2.5">Thời gian</th>
                      <th className="p-2.5">Biển số xe</th>
                      <th className="p-2.5">Gói dịch vụ</th>
                      <th className="p-2.5 text-right">Tổng tiền</th>
                      <th className="p-2.5 pr-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {displayedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-stone-400 italic">
                          Chưa có lịch sử chăm sóc xe nào cho bộ lọc này.
                        </td>
                      </tr>
                    ) : (
                      displayedOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50/60 transition">
                          <td className="p-2.5 pl-4 font-bold text-matte-black font-sans text-xs">
                            {o.id}
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">
                            {new Date(o.createdAt).toLocaleString("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short"
                            })}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">
                            {o.licensePlate}
                          </td>
                          <td className="p-2.5 font-medium text-slate-700">
                            {o.packageCode || "Dịch vụ"}
                          </td>
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
          )}
        </div>

        {/* SECTION 3: VOUCHERS & KHUYẾN MÃI CÁ NHÂN */}
        <div className="space-y-3 pt-2 border-t border-stone-200" id="customer-vouchers-section">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#A2C62C]" />
                VOUCHER & ƯU ĐÃI KHẢ DỤNG ({customerVouchers.length})
              </h4>
              <p className="text-[10px] text-mid-gray font-sans mt-0.5">
                Các mã khuyến mãi, voucher chiến dịch và quyền lợi hội viên có thể áp dụng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenManualGrantVoucher(customer)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-slate-800 bg-white hover:bg-stone-50 text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 text-forest-green" /> Cấp voucher riêng
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {customerVouchers.length === 0 ? (
              <div className="col-span-2 p-4 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-center text-xs text-mid-gray">
                Hội viên hiện chưa có mã voucher ưu đãi nào.
              </div>
            ) : (
              customerVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-matte-black text-[#A2C62C] font-black text-xs rounded tracking-wider uppercase font-sans">
                        {v.code}
                      </span>
                      <span className="text-[10px] font-bold text-forest-green">
                        {v.type === "percent"
                          ? `Giảm ${v.value}%`
                          : v.type === "free_service"
                          ? "Miễn phí dịch vụ"
                          : `Giảm ${formatVnd(v.value)}`}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {v.name || "Voucher ưu đãi"}
                    </p>
                    <span className="text-[10px] text-mid-gray block mt-0.5">
                      Hạn dùng: {new Date(v.validTo).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 4: BỒI HOÀN KHẨN CẤP */}
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between" id="customer-emergency-compensation">
          <div className="space-y-0.5">
            <h5 className="text-xs font-black text-red-900 uppercase flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" /> BỒI HOÀN KHẨN CẤP / XỬ LÝ KHIẾU NẠI
            </h5>
            <p className="text-[11px] text-red-800 leading-tight">
              Phát hành điểm SUP đền bù hoặc voucher đặc cách trực tiếp cho khách hàng khi có sự cố dịch vụ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenEmergencyCompensation(customer)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs shrink-0 border-0"
          >
            Mở bàn bồi hoàn
          </button>
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
    </Drawer>
  );
}
