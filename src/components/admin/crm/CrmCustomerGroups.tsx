import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Check,
  X,
  Filter,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Phone,
  Car,
  ChevronRight,
  UserPlus,
  UserMinus,
  RefreshCw,
  Award,
  Clock,
  ArrowUpRight,
  Lock
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
  onSelectCustomer?: (customer: Customer) => void;
}

export default function CrmCustomerGroups({
  groups,
  customers,
  orders,
  vouchers,
  isMasterAdmin,
  onSaveGroup,
  onDeleteGroup,
  onSelectCustomer
}: CrmCustomerGroupsProps) {
  // Selected active group ID
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return groups.length > 0 ? groups[0].id : "";
  });

  // Keep selected group in sync if groups change
  useEffect(() => {
    if (groups.length > 0) {
      const exists = groups.some((g) => g.id === selectedGroupId);
      if (!exists) {
        setSelectedGroupId(groups[0].id);
      }
    } else {
      setSelectedGroupId("");
    }
  }, [groups, selectedGroupId]);

  // Left column group filter & search
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupTypeFilter, setGroupTypeFilter] = useState<"all" | "static" | "dynamic">("all");

  // Inline editing state for group name in right column
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState("");
  const editNameInputRef = useRef<HTMLInputElement>(null);

  // Search within selected group's members table
  const [memberTableSearch, setMemberTableSearch] = useState("");

  // Search input to add a new customer to static group
  const [addCustomerQuery, setAddCustomerQuery] = useState("");
  const [showAddCustomerDropdown, setShowAddCustomerDropdown] = useState(false);

  // Drawer for creating a new group
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"static" | "dynamic">("static");
  const [newGroupSelectedCustomers, setNewGroupSelectedCustomers] = useState<string[]>([]);
  const [newGroupFilterSpent, setNewGroupFilterSpent] = useState("all");
  const [newGroupFilterVisits, setNewGroupFilterVisits] = useState("all");
  const [newGroupFilterLastVisit, setNewGroupFilterLastVisit] = useState("all");
  const [newGroupFilterDobMonth, setNewGroupFilterDobMonth] = useState("all");
  const [newGroupMemberSearch, setNewGroupMemberSearch] = useState("");

  // Delete modal state
  const [groupToDelete, setGroupToDelete] = useState<CustomerGroup | null>(null);

  // Find currently selected group
  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Sync editing name when selected group changes
  useEffect(() => {
    if (selectedGroup) {
      setEditingNameValue(selectedGroup.name);
      setIsEditingName(false);
    }
  }, [selectedGroup?.id, selectedGroup?.name]);

  useEffect(() => {
    if (isEditingName) {
      editNameInputRef.current?.focus();
      editNameInputRef.current?.select();
    }
  }, [isEditingName]);

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Customer statistics helper
  const getCustomerStats = (c: Customer) => {
    if (!c) return { totalSpent: 0, visits: 0, lastVisitDate: null };
    const safeOrders = Array.isArray(orders) ? orders : [];
    const cOrders = safeOrders.filter((o) => (o?.customerId && o.customerId === c.id) || (o?.customerPhone && c.phone && o.customerPhone === c.phone));
    const totalSpent = cOrders
      .filter((o) => o && (o.status === "paid" || o.status === "closed"))
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const visits = cOrders.length;
    let lastVisitDate: number | null = null;
    if (cOrders.length > 0) {
      const dates = cOrders.map((o) => o?.createdAt ? new Date(o.createdAt).getTime() : NaN).filter((t) => !isNaN(t));
      if (dates.length > 0) {
        lastVisitDate = Math.max(...dates);
      }
    }
    return { totalSpent, visits, lastVisitDate };
  };

  // Helper to evaluate dynamic group members
  const getGroupMembers = (g: CustomerGroup): Customer[] => {
    if (!g) return [];
    const safeCustomers = Array.isArray(customers) ? customers : [];
    if (g.type === "static") {
      const ids = Array.isArray(g.customer_ids) ? g.customer_ids : (Array.isArray(g.customerIds) ? g.customerIds : []);
      return safeCustomers.filter((c) => c && ids.includes(c.id));
    }

    // Dynamic group condition evaluation
    const cond = g.condition || g.filterCriteria || {};
    return safeCustomers.filter((c) => {
      if (!c) return false;
      const { totalSpent, visits, lastVisitDate } = getCustomerStats(c);

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
        if (!lastVisitDate) return false;
        const daysAgo = (Date.now() - lastVisitDate) / (1000 * 60 * 60 * 24);
        if (cond.lastVisit === "7_days" && daysAgo > 7) return false;
        if (cond.lastVisit === "30_days" && daysAgo > 30) return false;
        if (cond.lastVisit === "over_30" && daysAgo <= 30) return false;
      }

      // DOB month
      if (cond.dobMonth && cond.dobMonth !== "all") {
        if (!c.dob) return false;
        const birthDate = new Date(c.dob);
        if (isNaN(birthDate.getTime())) return false;
        const birthMonth = (birthDate.getMonth() + 1).toString();
        if (birthMonth !== cond.dobMonth) return false;
      }

      return true;
    });
  };

  // Filtered groups in left list
  const safeGroups = Array.isArray(groups) ? groups : [];
  const filteredGroups = useMemo(() => {
    return safeGroups.filter((g) => {
      if (!g) return false;
      if (groupTypeFilter !== "all" && g.type !== groupTypeFilter) {
        return false;
      }
      if (groupSearchQuery.trim()) {
        const q = groupSearchQuery.toLowerCase().trim();
        return (g.name || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [safeGroups, groupTypeFilter, groupSearchQuery]);

  // Members of currently selected group
  const currentGroupMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return getGroupMembers(selectedGroup);
  }, [selectedGroup, customers, orders]);

  // Filtered members in table search
  const filteredTableMembers = useMemo(() => {
    if (!memberTableSearch.trim()) return currentGroupMembers;
    const q = memberTableSearch.toLowerCase().trim();
    return currentGroupMembers.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.licensePlate && c.licensePlate.toLowerCase().includes(q)) ||
        (c.vehicles && c.vehicles.some((v) => v.plate.toLowerCase().includes(q)))
      );
    });
  }, [currentGroupMembers, memberTableSearch]);

  // Customers available to add to static group (excluding existing members)
  const availableCustomersToAdd = useMemo(() => {
    if (!selectedGroup || selectedGroup.type !== "static") return [];
    const currentMemberIds = new Set(selectedGroup.customer_ids || selectedGroup.customerIds || []);
    const notInGroup = customers.filter((c) => !currentMemberIds.has(c.id));
    if (!addCustomerQuery.trim()) return notInGroup.slice(0, 10);
    const q = addCustomerQuery.toLowerCase().trim();
    return notInGroup.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.licensePlate && c.licensePlate.toLowerCase().includes(q)) ||
        (c.vehicles && c.vehicles.some((v) => v.plate.toLowerCase().includes(q)))
    ).slice(0, 15);
  }, [selectedGroup, customers, addCustomerQuery]);

  // Actions for selected group
  const handleSaveInlineName = () => {
    if (!selectedGroup) return;
    const trimmed = editingNameValue.trim();
    if (!trimmed) {
      toast.error("TÊN NHÓM KHÔNG HỢP LỆ ❌", "Tên nhóm không được để trống.");
      setEditingNameValue(selectedGroup.name);
      setIsEditingName(false);
      return;
    }
    if (trimmed !== selectedGroup.name) {
      onSaveGroup({ id: selectedGroup.id, name: trimmed }, true);
    }
    setIsEditingName(false);
  };

  const handleUpdateDynamicCondition = (key: string, value: string) => {
    if (!selectedGroup || selectedGroup.type !== "dynamic") return;
    const currentCond = selectedGroup.condition || {};
    const updatedCond = { ...currentCond, [key]: value };
    onSaveGroup(
      {
        id: selectedGroup.id,
        condition: updatedCond
      },
      true
    );
  };

  const handleAddMemberToStatic = (customer: Customer) => {
    if (!selectedGroup || selectedGroup.type !== "static") return;
    const currentIds = selectedGroup.customer_ids || selectedGroup.customerIds || [];
    if (currentIds.includes(customer.id)) return;
    const updatedIds = [...currentIds, customer.id];
    onSaveGroup({ id: selectedGroup.id, customer_ids: updatedIds }, true);
    toast.success("ĐÃ THÊM THÀNH VIÊN 👤", `Đã thêm ${customer.name} vào nhóm "${selectedGroup.name}".`);
    setAddCustomerQuery("");
  };

  const handleRemoveMemberFromStatic = (customerId: string, customerName: string) => {
    if (!selectedGroup || selectedGroup.type !== "static") return;
    const currentIds = selectedGroup.customer_ids || selectedGroup.customerIds || [];
    const updatedIds = currentIds.filter((id) => id !== customerId);
    onSaveGroup({ id: selectedGroup.id, customer_ids: updatedIds }, true);
    toast.info("ĐÃ GỠ THÀNH VIÊN 👤", `Đã xóa ${customerName} khỏi nhóm "${selectedGroup.name}".`);
  };

  const handleDeleteGroupClick = (g: CustomerGroup) => {
    const isVoucherActive = vouchers.some(
      (v) => v.target_type === "group" && v.target_group_id === g.id && v.status !== "expired"
    );
    if (isVoucherActive) {
      toast.error(
        "KHÔNG THỂ XÓA NHÓM ❌",
        `Nhóm "${g.name}" đang được gắn với một hoặc nhiều voucher đang hoạt động. Vui lòng dừng hoặc đổi đối tượng voucher trước khi xóa nhóm.`
      );
      return;
    }
    setGroupToDelete(g);
  };

  // Create new group handler
  const handleOpenCreateDrawer = () => {
    setNewGroupName("");
    setNewGroupType("static");
    setNewGroupSelectedCustomers([]);
    setNewGroupFilterSpent("all");
    setNewGroupFilterVisits("all");
    setNewGroupFilterLastVisit("all");
    setNewGroupFilterDobMonth("all");
    setNewGroupMemberSearch("");
    setShowCreateDrawer(true);
  };

  const handleSaveNewGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("THIẾU TÊN NHÓM ❌", "Vui lòng nhập tên nhóm khách hàng.");
      return;
    }

    const payload: Partial<CustomerGroup> = {
      name: newGroupName.trim(),
      type: newGroupType,
      customer_ids: newGroupType === "static" ? newGroupSelectedCustomers : [],
      condition:
        newGroupType === "dynamic"
          ? {
              spent: newGroupFilterSpent,
              visits: newGroupFilterVisits,
              lastVisit: newGroupFilterLastVisit,
              dobMonth: newGroupFilterDobMonth
            }
          : undefined
    };

    onSaveGroup(payload, false);
    setShowCreateDrawer(false);
  };

  return (
    <div className="space-y-4 text-left font-sans" id="crm-groups-page">
      {/* MAIN 2-COLUMN LAYOUT (RATIO 4:8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT COLUMN (4 SPAN): GROUP LIST & SEARCH */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3 flex-1 flex flex-col">
            {/* Header */}

{/* PRIMARY CREATE BUTTON AT TOP OF COLUMN */}
          <button
            type="button"
            id="btn-create-customer-group"
            onClick={handleOpenCreateDrawer}
            className="w-full py-2.5 px-4 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-black font-display uppercase tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-xs border-0 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Tạo nhóm mới
          </button>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
          
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm nhóm hội viên..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-sans text-matte-black placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-purple-600 transition"
                />
                {groupSearchQuery && (
                  <button
                    onClick={() => setGroupSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Group Cards List */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[360px] pr-0.5 scrollbar-thin">
              {filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 italic bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  {groups.length === 0
                    ? "Chưa có nhóm nào. Bấm 'Tạo nhóm mới' để bắt đầu."
                    : "Không tìm thấy nhóm phù hợp."}
                </div>
              ) : (
                filteredGroups.map((g) => {
                  const isSelected = selectedGroupId === g.id;
                  const members = getGroupMembers(g);
                  const isDynamic = g.type === "dynamic";

                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? "bg-purple-50/60 border-purple-500 shadow-xs ring-1 ring-purple-400/30"
                          : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`p-1 rounded-md text-[10px] ${
                                isDynamic
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-stone-200 text-stone-700"
                              }`}
                            >
                              <Tag className="h-3 w-3" />
                            </span>
                            <h4 className="text-xs font-black font-display text-matte-black uppercase truncate">
                              {g.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isDynamic
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-stone-100 text-stone-700 border border-stone-200"
                              }`}
                            >
                              {isDynamic ? "⚡ Động (Auto)" : "📌 Tĩnh (Manual)"}
                            </span>
                            <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                              <Users className="h-3 w-3 text-forest-green" />
                              <strong className="text-matte-black font-extrabold">{members.length}</strong> TV
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isSelected ? "text-purple-600 translate-x-0.5" : "text-stone-300"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 SPAN): GROUP DETAIL VIEW - 1 UNIFIED WHITE CARD WITH DIVIDERS */}
        <div className="lg:col-span-8">
          {!selectedGroup ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[420px]">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl mb-3">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-black font-display text-matte-black uppercase">
                Chưa chọn nhóm khách hàng
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm font-sans">
                Vui lòng chọn một nhóm từ danh sách bên trái hoặc tạo nhóm mới để quản lý thành viên và cấu hình tiêu chí.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateDrawer}
                className="mt-4 px-4 py-2 bg-forest-green text-white text-xs font-bold font-display uppercase rounded-xl shadow-xs hover:bg-forest-green/90 transition flex items-center gap-1.5 cursor-pointer border-0"
              >
                <Plus className="h-3.5 w-3.5" /> Tạo nhóm mới
              </button>
            </div>
          ) : (
            /* 1 UNIFIED WHITE BOX WITH DIVIDERS */
            <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden divide-y divide-stone-200" id="crm-group-detail-card">
              {/* SECTION 1: DETAIL HEADER & IMMUTABLE TYPE BADGE */}
              <div className="p-5 space-y-4 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* TÊN NHÓM (CLICK TO EDIT) */}
                  <div className="min-w-0 flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mt-1 max-w-md">
                        <input
                          ref={editNameInputRef}
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveInlineName();
                            if (e.key === "Escape") {
                              setEditingNameValue(selectedGroup.name);
                              setIsEditingName(false);
                            }
                          }}
                          onBlur={handleSaveInlineName}
                          className="w-full text-base sm:text-lg font-black font-display uppercase text-matte-black bg-stone-50 border border-purple-500 rounded-xl px-3 py-1.5 focus:outline-none focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleSaveInlineName}
                          className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer border-0"
                          title="Lưu tên"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNameValue(selectedGroup.name);
                            setIsEditingName(false);
                          }}
                          className="p-2 bg-stone-200 text-stone-700 rounded-xl hover:bg-stone-300 transition cursor-pointer border-0"
                          title="Hủy"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingName(true)}
                        className="group flex items-center gap-2.5 mt-0.5 cursor-pointer inline-flex max-w-full"
                        title="Bấm để đổi tên nhóm"
                      >
                        <h1 className="text-lg sm:text-xl font-black font-display text-matte-black uppercase tracking-tight truncate hover:text-purple-700 transition">
                          {selectedGroup.name}
                        </h1>
                        <span className="p-1 rounded-md text-stone-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition shrink-0">
                          <Edit2 className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[10px] text-stone-400 font-sans italic opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                          (Click để sửa)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* NÚT XÓA NHÓM */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteGroupClick(selectedGroup)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 transition text-xs font-bold font-display uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      <span>Xóa nhóm</span>
                    </button>
                  </div>
                </div>

                {/* LOẠI NHÓM: READ-ONLY IMMUTABLE BADGE */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-stone-500 font-sans">Loại nhóm:</span>
                    <div className="inline-flex items-center gap-2">
                      {selectedGroup.type === "dynamic" ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-black font-display uppercase bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1.5 shadow-3xs">
                          <Sparkles className="h-3.5 w-3.5 text-purple-700" />
                          <span>Nhóm động (Dynamic)</span>
                          <Lock className="h-3 w-3 text-purple-400 ml-1" />
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-black font-display uppercase bg-stone-100 text-stone-800 border border-stone-300 flex items-center gap-1.5 shadow-3xs">
                          <Tag className="h-3.5 w-3.5 text-stone-600" />
                          <span>Nhóm tĩnh (Static)</span>
                          <Lock className="h-3 w-3 text-stone-400 ml-1" />
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 font-sans italic hidden md:inline">
                        (Cố định sau khi tạo, không thể đổi loại)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 font-sans flex items-center gap-2">
                    <span>Quy mô hiện tại:</span>
                    <span className="px-2.5 py-0.5 bg-forest-green/10 text-forest-green rounded-full font-black text-xs font-sans">
                      {currentGroupMembers.length} thành viên
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONFIGURATION SECTION - STRICTLY CONDITIONAL FOR CURRENT GROUP TYPE */}
              {selectedGroup.type === "dynamic" ? (
                /* DYNAMIC CONDITIONS CONFIGURATOR */
                <div className="p-5 space-y-4 bg-purple-50/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Spent condition */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-stone-600 uppercase flex items-center gap-1 font-sans">
                        <DollarSign className="h-3 w-3 text-forest-green" /> Doanh thu lũy kế
                      </label>
                      <select
                        value={selectedGroup.condition?.spent || "all"}
                        onChange={(e) => handleUpdateDynamicCondition("spent", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-sans text-matte-black focus:bg-white focus:outline-none focus:border-purple-500 transition"
                      >
                        <option value="all">Tất cả chi tiêu</option>
                        <option value="under_1m">Dưới 1.000.000đ</option>
                        <option value="1m_5m">1.000.000đ - 5.000.000đ</option>
                        <option value="over_5m">Trên 5.000.000đ</option>
                      </select>
                    </div>

                    {/* Visits condition */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-stone-600 uppercase flex items-center gap-1 font-sans">
                        <RefreshCw className="h-3 w-3 text-blue-600" /> Số lần ghé trạm
                      </label>
                      <select
                        value={selectedGroup.condition?.visits || "all"}
                        onChange={(e) => handleUpdateDynamicCondition("visits", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-sans text-matte-black focus:bg-white focus:outline-none focus:border-purple-500 transition"
                      >
                        <option value="all">Tất cả lượt ghé</option>
                        <option value="under_3">Dưới 3 lần</option>
                        <option value="3_10">Từ 3 đến 10 lần</option>
                        <option value="over_10">Trên 10 lần</option>
                      </select>
                    </div>

                    {/* Last visit condition */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-stone-600 uppercase flex items-center gap-1 font-sans">
                        <Clock className="h-3 w-3 text-amber-600" /> Lần ghé gần nhất
                      </label>
                      <select
                        value={selectedGroup.condition?.lastVisit || "all"}
                        onChange={(e) => handleUpdateDynamicCondition("lastVisit", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-sans text-matte-black focus:bg-white focus:outline-none focus:border-purple-500 transition"
                      >
                        <option value="all">Tất cả mốc giờ</option>
                        <option value="7_days">Trong vòng 7 ngày</option>
                        <option value="30_days">Trong vòng 30 ngày</option>
                        <option value="over_30">Đã hơn 30 ngày chưa ghé</option>
                      </select>
                    </div>

                    {/* DOB Month condition */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-stone-600 uppercase flex items-center gap-1 font-sans">
                        <Calendar className="h-3 w-3 text-purple-600" /> Tháng sinh nhật
                      </label>
                      <select
                        value={selectedGroup.condition?.dobMonth || "all"}
                        onChange={(e) => handleUpdateDynamicCondition("dobMonth", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-sans text-matte-black focus:bg-white focus:outline-none focus:border-purple-500 transition"
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
                /* STATIC SEARCH & ADD CUSTOMERS */
                <div className="p-5 space-y-3 bg-stone-50/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black font-display uppercase text-matte-black flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-forest-green" />
                      TÌM & THÊM HỘI VIÊN VÀO NHÓM
                    </h3>
                    <span className="text-[10px] text-stone-400 font-sans">
                      Gõ tên hoặc số điện thoại để tìm kiếm
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Tìm khách hàng theo Tên, SĐT, Biển số xe để thêm vào nhóm..."
                      value={addCustomerQuery}
                      onChange={(e) => {
                        setAddCustomerQuery(e.target.value);
                        setShowAddCustomerDropdown(true);
                      }}
                      onFocus={() => setShowAddCustomerDropdown(true)}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-sans text-matte-black placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-forest-green transition"
                    />
                    {addCustomerQuery && (
                      <button
                        onClick={() => {
                          setAddCustomerQuery("");
                          setShowAddCustomerDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs border-0 bg-transparent cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Customer search dropdown results */}
                    {showAddCustomerDropdown && addCustomerQuery.trim() && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto divide-y divide-stone-100">
                        {availableCustomersToAdd.length === 0 ? (
                          <div className="p-3 text-center text-xs text-stone-400 italic font-sans">
                            Không tìm thấy khách hàng nào chưa có trong nhóm.
                          </div>
                        ) : (
                          availableCustomersToAdd.map((c) => {
                            const { totalSpent, visits } = getCustomerStats(c);
                            return (
                              <div
                                key={c.id}
                                className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-stone-50 transition"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-matte-black uppercase font-display">
                                      {c.name}
                                    </span>
                                    <span className="text-[11px] text-stone-500 font-sans font-bold">
                                      • {c.phone}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-2 font-sans">
                                    <span>Chi tiêu: {formatVnd(totalSpent)}</span>
                                    <span>• {visits} lượt ghé</span>
                                    <span>• {c.points} SUP</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddMemberToStatic(c)}
                                  className="px-2.5 py-1 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white text-xs font-bold uppercase transition flex items-center gap-1 shrink-0 cursor-pointer shadow-3xs border-0"
                                >
                                  <Plus className="h-3 w-3" /> Thêm
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 3: MEMBERS LIST TABLE */}
              <div className="p-5 space-y-3 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black font-display uppercase text-matte-black flex items-center gap-2">
                      <Users className="h-4 w-4 text-forest-green" />
                      DANH SÁCH HỘI VIÊN TRONG NHÓM ({currentGroupMembers.length} KHÁCH HÀNG)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5 font-sans">
                      {selectedGroup.type === "dynamic"
                        ? "Hội viên tự động được lọc theo tiêu chí trên. Bấm tên để xem Hồ sơ chi tiết."
                        : "Bấm vào tên khách hàng để chuyển trực tiếp sang trang Hồ sơ chi tiết."}
                    </p>
                  </div>

                  {/* Filter inside table */}
                  <div className="relative sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Lọc danh sách hội viên..."
                      value={memberTableSearch}
                      onChange={(e) => setMemberTableSearch(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-sans text-matte-black placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-forest-green transition"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-3xs">
                  <div className="overflow-x-auto max-h-[calc(100vh-340px)] min-h-[260px] scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-stone-100/95 backdrop-blur-xs">
                        <tr className="text-slate-600 font-extrabold text-[10px] uppercase border-b border-stone-200 font-display">
                          <th className="p-3 pl-4">Hội viên</th>
                          <th className="p-3">Số điện thoại / Xe</th>
                          <th className="p-3 text-right">Tổng chi tiêu</th>
                          <th className="p-3 text-center">Lượt ghé / Lần cuối</th>
                          <th className="p-3 text-right">Điểm SUP</th>
                          {selectedGroup.type === "static" && (
                            <th className="p-3 pr-4 text-center">Gỡ</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-sans">
                        {filteredTableMembers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={selectedGroup.type === "static" ? 6 : 5}
                              className="p-12 text-center text-stone-400 italic font-sans"
                            >
                              {currentGroupMembers.length === 0
                                ? selectedGroup.type === "dynamic"
                                  ? "Chưa có hội viên nào thỏa mãn tiêu chí lọc trên."
                                  : "Nhóm chưa có thành viên. Hãy tìm và thêm khách hàng vào nhóm."
                                : "Không tìm thấy khách hàng nào khớp với từ khóa tìm kiếm."}
                            </td>
                          </tr>
                        ) : (
                          filteredTableMembers.map((c) => {
                            const { totalSpent, visits, lastVisitDate } = getCustomerStats(c);
                            const vehicleCount = c.vehicles?.length || (c.licensePlate ? 1 : 0);

                            return (
                              <tr
                                key={c.id}
                                className="hover:bg-stone-50/80 transition group"
                              >
                                {/* Customer Name (CLICK TO OPEN DETAIL) */}
                                <td className="p-3 pl-4">
                                  <button
                                    type="button"
                                    onClick={() => onSelectCustomer && onSelectCustomer(c)}
                                    className="text-left font-bold text-slate-900 group-hover:text-forest-green transition flex items-center gap-2 cursor-pointer border-0 bg-transparent p-0"
                                    title="Bấm để xem Hồ sơ chi tiết"
                                  >
                                    <div className="h-7 w-7 rounded-lg bg-stone-100 group-hover:bg-brand-green/20 text-slate-800 flex items-center justify-center font-display font-black text-xs shrink-0 transition">
                                      {c.name ? c.name.slice(0, 1).toUpperCase() : "C"}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-black font-display uppercase tracking-tight text-xs block hover:underline">
                                        {c.name}
                                      </span>
                                      <span className="text-[10px] text-stone-400 font-sans">
                                        {c.points >= 300
                                          ? "VIP"
                                          : c.points >= 100
                                          ? "LOYAL"
                                          : "MEMBER"}
                                      </span>
                                    </div>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-forest-green transition shrink-0" />
                                  </button>
                                </td>

                                {/* Phone & Vehicle */}
                                <td className="p-3 text-stone-600">
                                  <div className="flex items-center gap-1 font-bold font-sans text-[11px]">
                                    <Phone className="h-3 w-3 text-stone-400" />
                                    {c.phone}
                                  </div>
                                  <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5 font-sans">
                                    <Car className="h-3 w-3 text-stone-400" />
                                    {vehicleCount > 0 ? (
                                      <span>
                                        {c.vehicles?.[0]?.plate || c.licensePlate}
                                        {vehicleCount > 1 && ` (+${vehicleCount - 1})`}
                                      </span>
                                    ) : (
                                      "Chưa có xe"
                                    )}
                                  </div>
                                </td>

                                {/* Total Spent */}
                                <td className="p-3 text-right font-extrabold text-slate-900 whitespace-nowrap font-sans">
                                  {formatVnd(totalSpent)}
                                </td>

                                {/* Visits & Last visit */}
                                <td className="p-3 text-center text-stone-600 whitespace-nowrap font-sans">
                                  <span className="font-bold text-slate-800">{visits} lần</span>
                                  <span className="text-[10px] text-stone-400 block mt-0.5">
                                    {lastVisitDate
                                      ? new Date(lastVisitDate).toLocaleDateString("vi-VN")
                                      : "Chưa ghé"}
                                  </span>
                                </td>

                                {/* SUP Points */}
                                <td className="p-3 text-right whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-full font-black text-xs bg-brand-green/20 text-forest-green font-sans">
                                    {c.points} SUP
                                  </span>
                                </td>

                                {/* Action: Remove from static group */}
                                {selectedGroup.type === "static" && (
                                  <td className="p-3 pr-4 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMemberFromStatic(c.id, c.name)}
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer border-0"
                                      title="Gỡ khỏi nhóm"
                                    >
                                      <UserMinus className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DRAWER: CREATE NEW CUSTOMER GROUP */}
      <Drawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="TẠO NHÓM HỘI VIÊN MỚI"
        subtitle="Cài đặt cơ chế phân nhóm tĩnh (chọn tay) hoặc nhóm động (tự động theo hành vi)"
        icon={Compass}
        widthClass="max-w-xl"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowCreateDrawer(false)}
            cancelLabel="Hủy"
            onSubmit={handleSaveNewGroup}
            submitLabel="LƯU & KÍCH HOẠT NHÓM"
            submitVariant="primary"
          />
        }
      >
        <div className="space-y-4 text-left font-sans">
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-stone-600 uppercase font-extrabold block">
              Tên Nhóm Hội Viên *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Khách Thân Thiết 2026, Sinh Nhật Tháng 8, Khách Chăm Rửa..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-stone-600 uppercase font-extrabold block">
              Cơ chế phân loại
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewGroupType("static")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  newGroupType === "static"
                    ? "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-400"
                    : "bg-white border-stone-200 text-slate-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-extrabold block">Nhóm tĩnh (Static)</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Chọn tay từng khách hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setNewGroupType("dynamic")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  newGroupType === "dynamic"
                    ? "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-400"
                    : "bg-white border-stone-200 text-slate-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-extrabold block">Nhóm động (Dynamic)</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Tự động lọc theo hành vi</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC CONDITIONS */}
          {newGroupType === "dynamic" ? (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <span className="text-[10px] font-black text-stone-500 uppercase block">
                Điều kiện lọc tự động (Kết hợp logic AND)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Mức doanh thu lũy kế</label>
                  <select
                    value={newGroupFilterSpent}
                    onChange={(e) => setNewGroupFilterSpent(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="all">Tất cả chi tiêu</option>
                    <option value="under_1m">Dưới 1.000.000đ</option>
                    <option value="1m_5m">Từ 1.000.000đ - 5.000.000đ</option>
                    <option value="over_5m">Trên 5.000.000đ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Số lần ghé dịch vụ</label>
                  <select
                    value={newGroupFilterVisits}
                    onChange={(e) => setNewGroupFilterVisits(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs"
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
                    value={newGroupFilterLastVisit}
                    onChange={(e) => setNewGroupFilterLastVisit(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs"
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
                    value={newGroupFilterDobMonth}
                    onChange={(e) => setNewGroupFilterDobMonth(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs"
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
                <span className="text-xs font-sans text-stone-600 uppercase font-extrabold">
                  Chọn thành viên vào nhóm ({newGroupSelectedCustomers.length} đã chọn)
                </span>
                {newGroupSelectedCustomers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewGroupSelectedCustomers([])}
                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Lọc khách hàng theo tên hoặc số điện thoại..."
                  value={newGroupMemberSearch}
                  onChange={(e) => setNewGroupMemberSearch(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>

              {/* Selection list */}
              <div className="max-h-56 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 bg-white">
                {customers
                  .filter((c) => {
                    if (!newGroupMemberSearch.trim()) return true;
                    const q = newGroupMemberSearch.toLowerCase().trim();
                    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
                  })
                  .map((c) => {
                    const isSelected = newGroupSelectedCustomers.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`p-2.5 px-3 flex items-center justify-between hover:bg-stone-50 cursor-pointer text-xs ${
                          isSelected ? "bg-purple-50/60" : ""
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-slate-800">{c.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{c.phone}</div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewGroupSelectedCustomers([...newGroupSelectedCustomers, c.id]);
                            } else {
                              setNewGroupSelectedCustomers(
                                newGroupSelectedCustomers.filter((id) => id !== c.id)
                              );
                            }
                          }}
                          className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-stone-300"
                        />
                      </label>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* CONFIRM DELETE MODAL */}
      {groupToDelete && (
        <ConfirmDeleteModal
          isOpen={!!groupToDelete}
          onClose={() => setGroupToDelete(null)}
          onConfirm={() => {
            if (groupToDelete) {
              onDeleteGroup(groupToDelete.id);
              setGroupToDelete(null);
            }
          }}
          title="XÁC NHẬN XÓA NHÓM HỘI VIÊN"
          itemTypeLabel="nhóm khách hàng"
          itemName={groupToDelete.name}
          warningDetails="Xóa nhóm này sẽ gỡ bỏ phân loại của các khách hàng trong nhóm. Dữ liệu tài khoản của từng khách hàng vẫn được giữ nguyên."
          confirmButtonText="Xác nhận xóa nhóm"
        />
      )}
    </div>
  );
}
