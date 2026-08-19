import React, { useState } from "react";
import Drawer, { DrawerFooterButtons } from "../../common/Drawer";
import ConfirmDeleteModal from "../../common/ConfirmDeleteModal";
import {
  Compass,
  Plus,
  Search,
  Users,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  Sparkles,
  Info,
  Calendar,
  DollarSign
} from "lucide-react";
import { Customer, Order } from "../../../types/order.types";
import { Voucher } from "../../../types/voucher.types";
import { CustomerGroup } from "../../../lib/supabase/client";
import { toast } from "../../../lib/toast";

interface CrmCustomerGroupsProps {
  groups: CustomerGroup[];
  customers: Customer[];
  orders: Order[];
  vouchers: Voucher[];
  isMasterAdmin: boolean;
  onSaveGroup: (groupData: Partial<CustomerGroup>, isEdit: boolean) => void;
  onDeleteGroup: (groupId: string) => void;
}

export default function CrmCustomerGroups({
  groups,
  customers,
  orders,
  vouchers,
  isMasterAdmin,
  onSaveGroup,
  onDeleteGroup
}: CrmCustomerGroupsProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<CustomerGroup | null>(null);

  // Form state
  const [gName, setGName] = useState("");
  const [gMode, setGMode] = useState<"static" | "dynamic">("static");
  const [gSelectedCustomers, setGSelectedCustomers] = useState<string[]>([]);
  const [gFilterSpent, setGFilterSpent] = useState("all");
  const [gFilterVisits, setGFilterVisits] = useState("all");
  const [gFilterLastVisit, setGFilterLastVisit] = useState("all");
  const [gFilterDobMonth, setGFilterDobMonth] = useState("all");

  const [searchMemberQuery, setSearchMemberQuery] = useState("");

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Helper to evaluate dynamic group members
  const getGroupMembers = (g: CustomerGroup): Customer[] => {
    if (g.type === "static") {
      const ids = g.customer_ids || [];
      return customers.filter((c) => ids.includes(c.id));
    }

    // Dynamic group filter
    const cond = g.condition || {};
    return customers.filter((c) => {
      const cOrders = orders.filter((o) => o.customerId === c.id || o.customerPhone === c.phone);
      const totalSpent = cOrders
        .filter((o) => o.status === "paid" || o.status === "closed")
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const visits = cOrders.length;

      // Spent
      if (cond.spent === "under_1m" && totalSpent >= 1000000) return false;
      if (cond.spent === "1m_5m" && (totalSpent < 1000000 || totalSpent > 5000000)) return false;
      if (cond.spent === "over_5m" && totalSpent <= 5000000) return false;

      // Visits
      if (cond.visits === "under_3" && visits >= 3) return false;
      if (cond.visits === "3_10" && (visits < 3 || visits > 10)) return false;
      if (cond.visits === "over_10" && visits <= 10) return false;

      // Last visit
      if (cond.lastVisit && cond.lastVisit !== "all") {
        if (cOrders.length === 0) return false;
        const dates = cOrders.map((o) => new Date(o.createdAt).getTime()).filter((t) => !isNaN(t));
        if (dates.length === 0) return false;
        const lastDate = Math.max(...dates);
        const daysAgo = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
        if (cond.lastVisit === "7_days" && daysAgo > 7) return false;
        if (cond.lastVisit === "30_days" && daysAgo > 30) return false;
        if (cond.lastVisit === "over_30" && daysAgo <= 30) return false;
      }

      // DOB month
      if (cond.dobMonth && cond.dobMonth !== "all") {
        if (!c.dob) return false;
        const birthMonth = (new Date(c.dob).getMonth() + 1).toString();
        if (birthMonth !== cond.dobMonth) return false;
      }

      return true;
    });
  };

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setGName("");
    setGMode("static");
    setGSelectedCustomers([]);
    setGFilterSpent("all");
    setGFilterVisits("all");
    setGFilterLastVisit("all");
    setGFilterDobMonth("all");
    setSearchMemberQuery("");
    setShowDrawer(true);
  };

  const handleOpenEdit = (g: CustomerGroup) => {
    setEditingGroup(g);
    setGName(g.name);
    setGMode(g.type);
    setGSelectedCustomers(g.customer_ids || []);
    setGFilterSpent(g.condition?.spent || "all");
    setGFilterVisits(g.condition?.visits || "all");
    setGFilterLastVisit(g.condition?.lastVisit || "all");
    setGFilterDobMonth(g.condition?.dobMonth || "all");
    setSearchMemberQuery("");
    setShowDrawer(true);
  };

  const handleSaveSubmit = () => {
    if (!gName.trim()) {
      toast.error("THIẾU TÊN NHÓM ❌", "Vui lòng nhập tên nhóm khách hàng.");
      return;
    }

    const payload: Partial<CustomerGroup> = {
      id: editingGroup ? editingGroup.id : undefined,
      name: gName.trim(),
      type: gMode,
      customer_ids: gMode === "static" ? gSelectedCustomers : [],
      condition:
        gMode === "dynamic"
          ? {
              spent: gFilterSpent,
              visits: gFilterVisits,
              lastVisit: gFilterLastVisit,
              dobMonth: gFilterDobMonth
            }
          : undefined
    };

    onSaveGroup(payload, !!editingGroup);
    setShowDrawer(false);
  };

  const handleDeleteClick = (g: CustomerGroup) => {
    const isVoucherActive = vouchers.some(
      (v) => v.target_type === "group" && v.target_group_id === g.id && v.status !== "expired"
    );
    if (isVoucherActive) {
      toast.error("KHÔNG THỂ XÓA NHÓM ❌", `Nhóm "${g.name}" đang được gắn với một hoặc nhiều voucher đang hoạt động. Vui lòng dừng hoặc đổi đối tượng voucher trước khi xóa nhóm.`);
      return;
    }
    setGroupToDelete(g);
  };

  // Quick filter members in drawer
  const filteredCustomersInDrawer = customers.filter((c) => {
    if (!searchMemberQuery.trim()) return true;
    const q = searchMemberQuery.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="space-y-4 text-left font-sans" id="crm-groups-container">
      {/* HEADER & CREATE BUTTON */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase text-matte-black font-display tracking-wider flex items-center gap-2">
            <Compass className="h-4 w-4 text-purple-600" />
            PHÂN ĐOÀN & NHÓM KHÁCH HÀNG ({groups.length} nhóm)
          </h3>
          <p className="text-[11px] text-mid-gray font-sans mt-0.5">
            Tạo nhóm tĩnh (chọn tay) hoặc nhóm động (tự lọc theo hành vi chi tiêu/lượt ghé) để gán chiến dịch voucher tự động.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold font-display uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs border-0 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Tạo nhóm mới
        </button>
      </div>

      {/* GROUPS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="groups-grid">
        {groups.length === 0 ? (
          <div className="col-span-2 p-8 bg-white border border-[#e5e5e5] rounded-2xl text-center text-xs text-stone-400 italic">
            Chưa có nhóm khách hàng nào được thiết lập.
          </div>
        ) : (
          groups.map((g) => {
            const members = getGroupMembers(g);
            const isDynamic = g.type === "dynamic";

            return (
              <div
                key={g.id}
                className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs hover:border-purple-300 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                        <Tag className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm font-black font-display text-slate-900 tracking-wide">
                        {g.name}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isDynamic
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-stone-100 text-stone-700 border border-stone-200"
                      }`}
                    >
                      {isDynamic ? "Nhóm động (Auto)" : "Nhóm tĩnh"}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-stone-50 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-mid-gray">Quy mô thành viên:</span>
                      <strong className="text-forest-green font-extrabold">{members.length} hội viên</strong>
                    </div>

                    {isDynamic ? (
                      <div className="text-[11px] text-purple-800 font-medium pt-1 border-t border-stone-200">
                        Điều kiện: {g.condition?.spent !== "all" ? `Chi tiêu (${g.condition?.spent})` : ""}
                        {g.condition?.visits !== "all" ? ` - Ghé (${g.condition?.visits})` : ""}
                        {g.condition?.lastVisit !== "all" ? ` - Lần cuối (${g.condition?.lastVisit})` : ""}
                        {g.condition?.dobMonth !== "all" ? ` - Sinh nhật T${g.condition?.dobMonth}` : ""}
                        {Object.values(g.condition || {}).every((v) => v === "all") ? "Tất cả khách" : ""}
                      </div>
                    ) : (
                      <div className="text-[11px] text-mid-gray pt-1 border-t border-stone-200 flex flex-wrap gap-1">
                        {members.slice(0, 3).map((m) => (
                          <span key={m.id} className="bg-white px-2 py-0.5 rounded text-[10px] text-slate-700 font-bold border border-stone-200">
                            {m.name}
                          </span>
                        ))}
                        {members.length > 3 && (
                          <span className="text-[10px] text-stone-400 self-center">
                            +{members.length - 3} khách khác...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(g)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-mid-gray" /> Sửa nhóm
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteClick(g)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    title="Xóa nhóm"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" /> Xóa
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DRAWER: CREATE / EDIT CUSTOMER GROUP */}
      <Drawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingGroup ? `SỬA NHÓM: ${editingGroup.name}` : "TẠO NHÓM HỘI VIÊN MỚI"}
        subtitle="Cài đặt cơ chế phân nhóm tĩnh (chọn tay) hoặc nhóm động (tự động theo hành vi)"
        icon={Compass}
        widthClass="max-w-xl"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowDrawer(false)}
            cancelLabel="Hủy"
            onSubmit={handleSaveSubmit}
            submitLabel={editingGroup ? "LƯU THAY ĐỔI NHÓM" : "LƯU & KÍCH HOẠT NHÓM"}
            submitVariant="primary"
          />
        }
      >
        <div className="space-y-4 text-left font-sans">
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Tên Nhóm Hội Viên *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Khách Thân Thiết 2026, Sinh Nhật Tháng 8..."
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Cơ chế phân loại
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGMode("static")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  gMode === "static"
                    ? "bg-purple-50 border-purple-500 text-purple-900"
                    : "bg-white border-[#e5e5e5] text-slate-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-extrabold block">Nhóm tĩnh (Static)</span>
                <span className="text-[10px] text-mid-gray block mt-0.5">Chọn tay từng khách hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setGMode("dynamic")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  gMode === "dynamic"
                    ? "bg-purple-50 border-purple-500 text-purple-900"
                    : "bg-white border-[#e5e5e5] text-slate-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-extrabold block">Nhóm động (Dynamic)</span>
                <span className="text-[10px] text-mid-gray block mt-0.5">Tự động lọc theo hành vi</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC CONDITIONS */}
          {gMode === "dynamic" ? (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <span className="text-[10px] font-black text-mid-gray uppercase block">
                Điều kiện lọc tự động (Kết hợp logic AND)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Mức doanh thu lũy kế</label>
                  <select
                    value={gFilterSpent}
                    onChange={(e) => setGFilterSpent(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="all">Tất cả chi tiêu</option>
                    <option value="under_1m">Dưới 1,000,000đ</option>
                    <option value="1m_5m">Từ 1,000,000đ - 5,000,000đ</option>
                    <option value="over_5m">Trên 5,000,000đ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Số lần ghé dịch vụ</label>
                  <select
                    value={gFilterVisits}
                    onChange={(e) => setGFilterVisits(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="all">Tất cả lượt ghé</option>
                    <option value="under_3">Dưới 3 lần</option>
                    <option value="3_10">Từ 3 đến 10 lần</option>
                    <option value="over_10">Trên 10 lần</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Lần ghé gần nhất</label>
                  <select
                    value={gFilterLastVisit}
                    onChange={(e) => setGFilterLastVisit(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="all">Tất cả mốc giờ</option>
                    <option value="7_days">Trong vòng 7 ngày</option>
                    <option value="30_days">Trong vòng 30 ngày</option>
                    <option value="over_30">Đã hơn 30 ngày chưa ghé</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Tháng sinh nhật</label>
                  <select
                    value={gFilterDobMonth}
                    onChange={(e) => setGFilterDobMonth(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-2.5 py-2 text-xs"
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
            </div>
          ) : (
            /* STATIC MEMBERS SELECTION */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-mid-gray uppercase font-extrabold">
                  Chọn thành viên vào nhóm ({gSelectedCustomers.length} đã chọn)
                </span>
                {gSelectedCustomers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setGSelectedCustomers([])}
                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-mid-gray" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc SĐT để chọn..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-[#e5e5e5]">
                {filteredCustomersInDrawer.map((c) => {
                  const isChecked = gSelectedCustomers.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer hover:bg-stone-50 p-1.5 rounded transition"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setGSelectedCustomers(gSelectedCustomers.filter((id) => id !== c.id));
                          } else {
                            setGSelectedCustomers([...gSelectedCustomers, c.id]);
                          }
                        }}
                      />
                      <span className="font-bold">{c.name}</span> - <span className="text-[10px] text-mid-gray font-sans">{c.phone}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* CONFIRM DELETE GROUP MODAL */}
      <ConfirmDeleteModal
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={() => {
          if (groupToDelete) {
            onDeleteGroup(groupToDelete.id);
            setGroupToDelete(null);
          }
        }}
        title="XÓA NHÓM KHÁCH HÀNG"
        itemTypeLabel="nhóm khách hàng"
        itemName={groupToDelete?.name || ""}
        warningDetails="Việc xóa nhóm khách hàng sẽ gỡ bỏ phân loại nhóm này khỏi toàn bộ hồ sơ hội viên liên quan."
        confirmButtonText="Xóa nhóm"
      />
    </div>
  );
}
