import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  User,
  Phone,
  Gift,
  Award,
  History,
  Tag,
  Plus,
  Compass,
  ArrowRight,
  Sparkles,
  Percent,
  Check,
  AlertCircle,
  X,
  Edit,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  Settings,
  Calendar,
  MapPin,
  Car,
  PlusCircle,
  ClipboardList,
  DollarSign
} from "lucide-react";
import { Customer } from "../../types/order.types";
import { Voucher } from "../../types/voucher.types";
import { simActions } from "../../lib/supabase/client";
import { toast } from "./shared/NotificationManager";
import { MarkdownTextarea, MarkdownRenderer } from "./shared/Markdown";

interface CrmModuleProps {
  customers: Customer[];
  vouchers: Voucher[];
  orders?: any[];
}

interface SupLedgerRow {
  id: string;
  customerId: string;
  date: string;
  type: "auto_gain" | "redeem" | "manual_adjust" | "compensation";
  typeLabel: string;
  pointsChanged: number;
  balanceAfter: number;
  reason: string;
}

interface PointProposal {
  id: string;
  customerId: string;
  customerName: string;
  pointsChanged: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  managerName: string;
}

const DEFAULT_LEDGER: SupLedgerRow[] = [
  {
    id: "sl-001",
    customerId: "c1",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    type: "auto_gain",
    typeLabel: "Tích điểm tự động",
    pointsChanged: 25,
    balanceAfter: 125,
    reason: "Tích 10% điểm cho đơn rửa xe cao cấp W2"
  },
  {
    id: "sl-002",
    customerId: "c1",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: "redeem",
    typeLabel: "Đổi Voucher WASSUPNEW",
    pointsChanged: -25,
    balanceAfter: 100,
    reason: "Đổi 25 điểm lấy voucher giảm giá 10%"
  },
  {
    id: "sl-003",
    customerId: "c1",
    date: new Date(Date.now() - 600000).toISOString(),
    type: "auto_gain",
    typeLabel: "Tích điểm tự động",
    pointsChanged: 50,
    balanceAfter: 150,
    reason: "Tích điểm tự động cho đơn rửa xe cao cấp"
  },
  {
    id: "sl-004",
    customerId: "c2",
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    type: "manual_adjust",
    typeLabel: "Điều chỉnh thủ công",
    pointsChanged: 40,
    balanceAfter: 40,
    reason: "Tạo tài khoản mới tặng điểm chào mừng"
  },
  {
    id: "sl-005",
    customerId: "c3",
    date: new Date(Date.now() - 86400000).toISOString(),
    type: "compensation",
    typeLabel: "Điểm thưởng đền bù khiếu nại",
    pointsChanged: 100,
    balanceAfter: 300,
    reason: "Đền bù thời gian chờ thi công bay kéo dài quá ETA"
  }
];

export default function CrmModule({ customers, vouchers, orders = [] }: CrmModuleProps) {
  // Role switcher: 'master_admin' | 'manager'
  const [role, setRole] = useState<"master_admin" | "manager">("master_admin");

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"customers" | "vouchers" | "groups">("customers");

  // Local synced lists
  const [customersList, setCustomersList] = useState<Customer[]>(() => simActions.getCustomers());
  const [vouchersList, setVouchersList] = useState<Voucher[]>(() => simActions.getVouchers());
  const [groups, setGroups] = useState<any[]>(() => simActions.getCustomerGroups());
  const [redemptions, setRedemptions] = useState<any[]>(() => simActions.getVoucherRedemptions());

  const syncGroupsAndRedemptions = () => {
    setGroups([...simActions.getCustomerGroups()]);
    setRedemptions([...simActions.getVoucherRedemptions()]);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals visibility
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerFormMode, setCustomerFormMode] = useState<"add" | "edit">("add");
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  // Voucher advanced fields
  const [vFormMode, setVFormMode] = useState<"add" | "edit">("add");
  const [editingVoucherId, setEditingVoucherId] = useState<string>("");
  const [vName, setVName] = useState("");
  const [vValidFrom, setVValidFrom] = useState(() => new Date().toISOString().substring(0, 10));
  const [vValidTo, setVValidTo] = useState(() => new Date(Date.now() + 86400000 * 30).toISOString().substring(0, 10));
  const [vLimitPerCustomer, setVLimitPerCustomer] = useState("1");
  const [vLimitTotal, setVLimitTotal] = useState("");
  const [vTargetType, setVTargetType] = useState<"all_customers" | "group" | "specific_customers">("all_customers");
  const [vTargetGroupId, setVTargetGroupId] = useState("");
  const [vTargetSpecificCustomers, setVTargetSpecificCustomers] = useState<string[]>([]);
  const [vStatus, setVStatus] = useState<"draft" | "active" | "paused" | "expired">("active");
  const [vSource, setVSource] = useState<"manual" | "birthday" | "upgrade">("manual");
  
  // Voucher filtering states (S4.5 / S4.8)
  const [vFilterStatus, setVFilterStatus] = useState("all");
  const [vFilterTarget, setVFilterTarget] = useState("all");

  // Detailed view of 1 voucher (S4.10)
  const [viewingVoucherId, setViewingVoucherId] = useState<string | null>(null);
  const [viewVoucherTab, setViewVoucherTab] = useState<"target" | "redemptions">("target");

  // Groups modal state (S4.9)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupFormMode, setGroupFormMode] = useState<"add" | "edit">("add");
  const [editingGroupId, setEditingGroupId] = useState("");
  const [gName, setGName] = useState("");
  const [gMode, setGMode] = useState<"static" | "dynamic">("static");
  const [gFilterSpent, setGFilterSpent] = useState("all");
  const [gFilterVisits, setGFilterVisits] = useState("all");
  const [gFilterLastVisit, setGFilterLastVisit] = useState("all");
  const [gFilterVouchers, setGFilterVouchers] = useState("all");
  const [gFilterDobMonth, setGFilterDobMonth] = useState("all");
  const [gSelectedCustomers, setGSelectedCustomers] = useState<string[]>([]);

  // Customer Form State
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cLicensePlate, setCLicensePlate] = useState("");
  const [cDob, setCDob] = useState("");
  const [cAddress, setCAddress] = useState("");

  // Points Adjustment Form State (Master Admin)
  const [pointsChange, setPointsChange] = useState("");
  const [pointsDir, setPointsDir] = useState<"add" | "sub">("add");
  const [pointsReason, setPointsReason] = useState("");

  // Manager Proposal Form State
  const [propPoints, setPropPoints] = useState("");
  const [propDir, setPropDir] = useState<"add" | "sub">("add");
  const [propReason, setPropReason] = useState("");

  // Voucher Form State (Manual issuance)
  const [vCode, setVCode] = useState("");
  const [vType, setVType] = useState<"percent" | "fixed_amount" | "free_service">("percent");
  const [vValue, setVValue] = useState("");
  const [vMaxDiscount, setVMaxDiscount] = useState("");
  const [vMinOrder, setVMinOrder] = useState("");
  const [vReason, setVReason] = useState("Tri ân khách hàng thân thiết");

  // Vehicle adding state inside Sidebar
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newVehicleClass, setNewVehicleClass] = useState<"sedan" | "suv" | "truck">("sedan");
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  // Filter care history by vehicle
  const [historyPlateFilter, setHistoryPlateFilter] = useState("all");
  const [showPointsHistoryModal, setShowPointsHistoryModal] = useState(false);

  // Advanced Filtering states (S4.4)
  const [filterSpent, setFilterSpent] = useState("all");
  const [filterVisits, setFilterVisits] = useState("all");
  const [filterLastVisit, setFilterLastVisit] = useState("all");
  const [filterVouchers, setFilterVouchers] = useState("all");
  const [filterDobMonth, setFilterDobMonth] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Form input for initial vehicle segment (mode === "add")
  const [cVehicleClass, setCVehicleClass] = useState<"sedan" | "suv" | "truck">("sedan");

  // SUP Ledger Persistent State
  const [supLedger, setSupLedger] = useState<SupLedgerRow[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_sup_ledger");
      return cached ? JSON.parse(cached) : DEFAULT_LEDGER;
    } catch (e) {
      return DEFAULT_LEDGER;
    }
  });

  // Proposals List Persistent State (Pending approval)
  const [proposals, setProposals] = useState<PointProposal[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_crm_proposals");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem("wassup_sup_ledger", JSON.stringify(supLedger));
  }, [supLedger]);

  useEffect(() => {
    localStorage.setItem("wassup_crm_proposals", JSON.stringify(proposals));
  }, [proposals]);

  // Synchronize customers list when sim state updates
  const syncCustomers = () => {
    setCustomersList([...simActions.getCustomers()]);
    setVouchersList([...simActions.getVouchers()]);
    syncGroupsAndRedemptions();
  };

  const activeCustomerId = selectedCustomerId || (customersList[0]?.id || "");
  const selectedCustomer = customersList.find(c => c.id === activeCustomerId);

  // Filter SUP ledger for current customer
  const customerLedger = supLedger.filter(l => l.customerId === activeCustomerId);

  // Filter vouchers for current customer and system-wide vouchers
  const customerVouchers = vouchersList.filter(v => v.customerId === activeCustomerId || v.customerId === "all" || v.customerId === "system");

  // Helper to count total visits of a customer
  const getCustomerVisitsCount = (cust: Customer) => {
    if (!orders) return 0;
    const plates = cust.licensePlates || (cust.licensePlate ? [cust.licensePlate] : []);
    return orders.filter(
      o => o.customerId === cust.id || (o.licensePlate && plates.includes(o.licensePlate))
    ).length;
  };

  // Helper to get the most recent care date
  const getCustomerLastVisitDate = (cust: Customer) => {
    if (!orders) return null;
    const plates = cust.licensePlates || (cust.licensePlate ? [cust.licensePlate] : []);
    const customerOrders = orders.filter(
      o => o.customerId === cust.id || (o.licensePlate && plates.includes(o.licensePlate))
    );
    if (customerOrders.length === 0) return null;
    const sorted = [...customerOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return new Date(sorted[0].createdAt);
  };

  // Helper to check if customer has any active unused voucher
  const getCustomerHasVoucher = (cust: Customer) => {
    const custVouchers = vouchersList.filter(v => v.customerId === cust.id);
    return custVouchers.some(v => !v.usedAt && new Date(v.validTo).getTime() > Date.now());
  };

  // Helper to extract birth month
  const getCustomerDobMonth = (cust: Customer) => {
    if (!cust.dob) return null;
    const date = new Date(cust.dob);
    return (date.getMonth() + 1).toString();
  };

  const getVoucherRuntimeStatus = (v: Voucher) => {
    if (v.status === "paused" || v.status === "draft") {
      return v.status;
    }
    const now = Date.now();
    const validFromTime = new Date(v.validFrom).getTime();
    const validToTime = new Date(v.validTo).getTime();
    
    if (now < validFromTime) {
      return "draft";
    }
    if (now > validToTime) {
      return "expired";
    }
    if (v.usage_limit_total) {
      const totalRedeemed = redemptions.filter(r => r.voucherId === v.id).length;
      if (totalRedeemed >= v.usage_limit_total) {
        return "expired";
      }
    }
    return "active";
  };

  const getGroupMembers = (group: any): Customer[] => {
    if (group.mode === "static" || group.mode === "manual") {
      const ids = group.customerIds || [];
      return customersList.filter(c => ids.includes(c.id));
    }
    
    // Dynamic group
    const criteria = group.filterCriteria;
    if (!criteria) return [];
    
    return customersList.filter(c => {
      // 1. Spent Range
      if (criteria.spent && criteria.spent !== "all") {
        const spent = calculateCustomerTotalSpent(c);
        if (criteria.spent === "under_1m" && spent >= 1000000) return false;
        if (criteria.spent === "1m_5m" && (spent < 1000000 || spent > 5000000)) return false;
        if (criteria.spent === "over_5m" && spent <= 5000000) return false;
      }

      // 2. Visits Count
      if (criteria.visits && criteria.visits !== "all") {
        const visits = getCustomerVisitsCount(c);
        if (criteria.visits === "under_3" && visits >= 3) return false;
        if (criteria.visits === "3_10" && (visits < 3 || visits > 10)) return false;
        if (criteria.visits === "over_10" && visits <= 10) return false;
      }

      // 3. Last Visit Date
      if (criteria.lastVisit && criteria.lastVisit !== "all") {
        const lastVisit = getCustomerLastVisitDate(c);
        if (!lastVisit) return false;
        const daysDiff = (Date.now() - lastVisit.getTime()) / (1000 * 3600 * 24);
        if (criteria.lastVisit === "7_days" && daysDiff > 7) return false;
        if (criteria.lastVisit === "30_days" && daysDiff > 30) return false;
        if (criteria.lastVisit === "over_30" && daysDiff <= 30) return false;
      }

      // 4. Has active voucher
      if (criteria.vouchers && criteria.vouchers !== "all") {
        const hasVoucher = getCustomerHasVoucher(c);
        if (criteria.vouchers === "has_voucher" && !hasVoucher) return false;
        if (criteria.vouchers === "no_voucher" && hasVoucher) return false;
      }

      // 5. Dob Month
      if (criteria.dobMonth && criteria.dobMonth !== "all") {
        const month = getCustomerDobMonth(c);
        if (month !== criteria.dobMonth) return false;
      }

      return true;
    });
  };

  const filteredCustomers = customersList.filter((c) => {
    // 1. Search Query
    const term = searchQuery.toLowerCase().trim();
    if (term) {
      const plates = c.licensePlates || (c.licensePlate ? [c.licensePlate] : []);
      const plateMatches = plates.some(p => p.toLowerCase().includes(term));
      const textMatches = c.name.toLowerCase().includes(term) || c.phone.includes(term) || plateMatches;
      if (!textMatches) return false;
    }

    // 2. Spent Range
    if (filterSpent !== "all") {
      const spent = calculateCustomerTotalSpent(c);
      if (filterSpent === "under_1m" && spent >= 1000000) return false;
      if (filterSpent === "1m_5m" && (spent < 1000000 || spent > 5000000)) return false;
      if (filterSpent === "over_5m" && spent <= 5000000) return false;
    }

    // 3. Visits Count
    if (filterVisits !== "all") {
      const visits = getCustomerVisitsCount(c);
      if (filterVisits === "under_3" && visits >= 3) return false;
      if (filterVisits === "3_10" && (visits < 3 || visits > 10)) return false;
      if (filterVisits === "over_10" && visits <= 10) return false;
    }

    // 4. Last Visit Date
    if (filterLastVisit !== "all") {
      const lastVisit = getCustomerLastVisitDate(c);
      if (!lastVisit) return false;
      const daysDiff = (Date.now() - lastVisit.getTime()) / (1000 * 3600 * 24);
      if (filterLastVisit === "7_days" && daysDiff > 7) return false;
      if (filterLastVisit === "30_days" && daysDiff > 30) return false;
      if (filterLastVisit === "over_30" && daysDiff <= 30) return false;
    }

    // 5. Has active voucher
    if (filterVouchers !== "all") {
      const hasVoucher = getCustomerHasVoucher(c);
      if (filterVouchers === "has_voucher" && !hasVoucher) return false;
      if (filterVouchers === "no_voucher" && hasVoucher) return false;
    }

    // 6. Dob Month
    if (filterDobMonth !== "all") {
      const month = getCustomerDobMonth(c);
      if (month !== filterDobMonth) return false;
    }

    return true;
  });

  // Dynamic calculation of total spent for a customer (completed or paid orders)
  const calculateCustomerTotalSpent = (cust: Customer) => {
    if (!orders) return 0;
    const plates = cust.licensePlates || (cust.licensePlate ? [cust.licensePlate] : []);
    return orders
      .filter(o => o.commerceStatus === "paid" || o.commerceStatus === "closed")
      .filter(o => o.customerId === cust.id || (o.licensePlate && plates.includes(o.licensePlate)))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  };

  // Get filtered list of orders for the selected customer's vehicle care history
  const getCustomerCareHistory = (cust: Customer) => {
    if (!orders) return [];
    const list = cust.vehicles || [];
    const plates = cust.licensePlates || (cust.licensePlate ? [cust.licensePlate] : []);
    const merged = [...list];
    plates.forEach(p => {
      if (!merged.some(v => v.plate === p)) {
        merged.push({ plate: p, vehicleClass: "sedan" });
      }
    });

    let customerOrders = orders.filter(
      o => o.customerId === cust.id || (o.licensePlate && plates.includes(o.licensePlate))
    );
    
    const activeHistoryPlate = (historyPlateFilter === "all" || !merged.some(v => v.plate === historyPlateFilter))
      ? (merged[0]?.plate || "")
      : historyPlateFilter;

    if (activeHistoryPlate && activeHistoryPlate !== "") {
      customerOrders = customerOrders.filter(o => o.licensePlate === activeHistoryPlate);
    }
    
    return customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Submit Voucher Creation or Edit (S4.8)
  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCode || !vValue) {
      toast.error("THIẾU THÔNG TIN ❌", "Vui lòng nhập đầy đủ mã và giá trị giảm.");
      return;
    }

    const val = Number(vValue);
    if (vType !== "free_service" && (isNaN(val) || val <= 0)) {
      toast.error("GIÁ TRỊ SAI ❌", "Giá trị giảm phải là một số dương.");
      return;
    }

    const voucherData: any = {
      code: vCode.toUpperCase().trim(),
      name: vName || `Voucher ${vCode.toUpperCase().trim()}`,
      type: vType,
      value: val,
      minOrderValue: vMinOrder ? Number(vMinOrder) : 0,
      maxDiscount: vMaxDiscount ? Number(vMaxDiscount) : null,
      validFrom: new Date(vValidFrom).toISOString(),
      validTo: new Date(vValidTo).toISOString(),
      usage_limit_per_customer: Number(vLimitPerCustomer) || 1,
      usage_limit_total: vLimitTotal ? Number(vLimitTotal) : null,
      target_type: vTargetType,
      target_group_id: vTargetType === "group" ? vTargetGroupId : null,
      status: vStatus,
      source: vSource,
      customerId: vTargetType === "specific_customers" && vTargetSpecificCustomers.length === 1 ? vTargetSpecificCustomers[0] : "all"
    };

    if (vFormMode === "add") {
      // Check duplicate code
      const duplicate = vouchersList.some(v => v.code.toUpperCase() === voucherData.code);
      if (duplicate) {
        toast.error("MÃ VOUCHER ĐÃ TỒN TẠI ❌", "Vui lòng chọn mã khác không trùng.");
        return;
      }
      simActions.addVoucher(voucherData);
      
      // Log in Ledger for audit history
      if (activeCustomerId) {
        const newLedgerRow: SupLedgerRow = {
          id: "sl_" + Date.now(),
          customerId: activeCustomerId,
          date: new Date().toISOString(),
          type: "compensation",
          typeLabel: "Cấp Voucher Hệ Thống",
          pointsChanged: 0,
          balanceAfter: selectedCustomer?.points || 0,
          reason: `Phát hành mã voucher hệ thống ${vCode.toUpperCase()} giảm giá. Lý do: ${vReason}`
        };
        setSupLedger([newLedgerRow, ...supLedger]);
      }

      toast.success("TẠO VOUCHER THÀNH CÔNG 🎟️", `Mã ưu đãi ${vCode.toUpperCase()} đã được định nghĩa.`);
    } else {
      simActions.updateVoucher(editingVoucherId, voucherData);
      toast.success("CẬP NHẬT VOUCHER THÀNH CÔNG 🎟️", `Mã ưu đãi ${vCode.toUpperCase()} đã được sửa.`);
    }

    syncCustomers();
    setShowVoucherModal(false);
    // Reset fields
    setVCode("");
    setVName("");
    setVValue("");
    setVMaxDiscount("");
    setVMinOrder("");
    setVLimitPerCustomer("1");
    setVLimitTotal("");
    setVTargetType("all_customers");
    setVTargetGroupId("");
    setVTargetSpecificCustomers([]);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) {
      toast.error("THIẾU TÊN NHÓM ❌", "Vui lòng điền tên nhóm hội viên.");
      return;
    }

    const groupData: any = {
      name: gName.trim(),
      mode: gMode,
      filterCriteria: gMode === "dynamic" ? {
        spent: gFilterSpent,
        visits: gFilterVisits,
        lastVisit: gFilterLastVisit,
        vouchers: gFilterVouchers,
        dobMonth: gFilterDobMonth
      } : null,
      customerIds: gMode === "static" ? gSelectedCustomers : null
    };

    if (groupFormMode === "add") {
      simActions.addCustomerGroup(groupData);
      toast.success("TẠO NHÓM THÀNH CÔNG 👥", `Nhóm khách hàng "${gName}" đã được tạo.`);
    } else {
      simActions.updateCustomerGroup(editingGroupId, groupData);
      toast.success("CẬP NHẬT NHÓM THÀNH CÔNG 👥", `Nhóm khách hàng "${gName}" đã được cập nhật.`);
    }

    syncCustomers();
    setShowGroupModal(false);
    setGName("");
    setGMode("static");
    setGFilterSpent("all");
    setGFilterVisits("all");
    setGFilterLastVisit("all");
    setGFilterVouchers("all");
    setGFilterDobMonth("all");
    setGSelectedCustomers([]);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    const isLinked = vouchersList.some(
      v => v.target_type === "group" && v.target_group_id === groupId && getVoucherRuntimeStatus(v) === "active"
    );
    if (isLinked) {
      toast.error(
        "KHÔNG THỂ XÓA NHÓM ❌",
        `Nhóm "${groupName}" đang được gắn với một hoặc nhiều Voucher đang hoạt động. Vui lòng tạm dừng/hết hạn voucher trước!`
      );
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa nhóm khách hàng "${groupName}"?`)) {
      simActions.deleteCustomerGroup(groupId);
      syncCustomers();
      toast.success("XÓA NHÓM THÀNH CÔNG 👥", `Nhóm "${groupName}" đã được xóa.`);
    }
  };

  const openEditGroup = (g: any) => {
    setGroupFormMode("edit");
    setEditingGroupId(g.id);
    setGName(g.name);
    setGMode(g.mode);
    if (g.mode === "dynamic" && g.filterCriteria) {
      setGFilterSpent(g.filterCriteria.spent || "all");
      setGFilterVisits(g.filterCriteria.visits || "all");
      setGFilterLastVisit(g.filterCriteria.lastVisit || "all");
      setGFilterVouchers(g.filterCriteria.vouchers || "all");
      setGFilterDobMonth(g.filterCriteria.dobMonth || "all");
    } else {
      setGSelectedCustomers(g.customerIds || []);
    }
    setShowGroupModal(true);
  };

  const openEditVoucher = (v: any) => {
    setVFormMode("edit");
    setEditingVoucherId(v.id);
    setVCode(v.code);
    setVName(v.name || "");
    setVType(v.type);
    setVValue(v.value.toString());
    setVMinOrder(v.minOrderValue ? v.minOrderValue.toString() : "");
    setVMaxDiscount(v.maxDiscount ? v.maxDiscount.toString() : "");
    setVValidFrom(v.validFrom ? v.validFrom.substring(0, 10) : "");
    setVValidTo(v.validTo ? v.validTo.substring(0, 10) : "");
    setVLimitPerCustomer(v.usage_limit_per_customer ? v.usage_limit_per_customer.toString() : "1");
    setVLimitTotal(v.usage_limit_total ? v.usage_limit_total.toString() : "");
    setVTargetType(v.target_type || "all_customers");
    setVTargetGroupId(v.target_group_id || "");
    setVTargetSpecificCustomers(v.target_specific_customers || (v.customerId && v.customerId !== "all" ? [v.customerId] : []));
    setVStatus(v.status || "active");
    setVSource(v.source || "manual");
    setShowVoucherModal(true);
  };

  const handleToggleVoucherStatus = (v: Voucher) => {
    const currentStatus = getVoucherRuntimeStatus(v);
    const nextStatus = currentStatus === "paused" ? "active" : "paused";
    simActions.updateVoucher(v.id, { status: nextStatus });
    syncCustomers();
    toast.success(
      "TRẠNG THÁI VOUCHER ĐÃ ĐƯỢC CẬP NHẬT 🎟️",
      `Mã ${v.code} hiện tại ở trạng thái: ${nextStatus === "active" ? "Đang hoạt động" : "Tạm dừng"}`
    );
  };

  const handleDeleteVoucher = (v: Voucher) => {
    const usedCount = redemptions.filter(r => r.voucherId === v.id).length;
    if (usedCount > 0) {
      toast.error(
        "KHÔNG THỂ XÓA VOUCHER ❌",
        "Voucher này đã có lịch sử áp dụng đơn hàng, không thể xóa nhằm bảo toàn tính đồng bộ tài chính!"
      );
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn voucher ${v.code}?`)) {
      simActions.deleteVoucher(v.id);
      syncCustomers();
      toast.success("XÓA VOUCHER THÀNH CÔNG 🎟️", `Voucher ${v.code} đã được loại bỏ.`);
    }
  };

  // Submit Customer Register or Edit
  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cPhone) return;

    if (customerFormMode === "add") {
      const cleanPlate = cLicensePlate.toUpperCase().trim();
      const initialVehicles = cleanPlate ? [{ plate: cleanPlate, vehicleClass: cVehicleClass }] : [];
      const newCust = simActions.addCustomer({
        name: cName,
        phone: cPhone,
        licensePlate: cleanPlate || "",
        licensePlates: cleanPlate ? [cleanPlate] : [],
        vehicles: initialVehicles,
        dob: cDob,
        address: cAddress,
        points: 0
      });

      // Log in Ledger
      const newLedgerRow: SupLedgerRow = {
        id: "sl_" + Date.now(),
        customerId: newCust.id,
        date: new Date().toISOString(),
        type: "manual_adjust",
        typeLabel: "Khởi tạo tài khoản",
        pointsChanged: 0,
        balanceAfter: 0,
        reason: "Hội viên mới đăng ký thủ công từ CRM OS"
      };
      setSupLedger([newLedgerRow, ...supLedger]);
      setSelectedCustomerId(newCust.id);

      toast.success(
        "ĐĂNG KÝ HỘI VIÊN THÀNH CÔNG 🎉",
        `Đã tạo tài khoản cho khách hàng ${cName} (${cPhone})`,
        6000
      );
    } else {
      if (!selectedCustomer) return;
      
      const cleanPlate = cLicensePlate.toUpperCase().trim();
      const originalPlates = selectedCustomer.licensePlates || (selectedCustomer.licensePlate ? [selectedCustomer.licensePlate] : []);
      let finalPlates = [...originalPlates];
      if (cleanPlate && !finalPlates.includes(cleanPlate)) {
        finalPlates.push(cleanPlate);
      }

      // Keep vehicles array sync
      const currentVehicles = selectedCustomer.vehicles || [];
      const updatedVehicles = [...currentVehicles];
      if (cleanPlate && !updatedVehicles.some(v => v.plate === cleanPlate)) {
        updatedVehicles.push({ plate: cleanPlate, vehicleClass: "sedan" });
      }

      simActions.updateCustomer(selectedCustomer.id, {
        name: cName,
        phone: cPhone,
        licensePlate: cleanPlate || selectedCustomer.licensePlate,
        licensePlates: finalPlates,
        vehicles: updatedVehicles,
        dob: cDob,
        address: cAddress
      });

      toast.success(
        "CẬP NHẬT HỒ SƠ THÀNH CÔNG 💾",
        `Hồ sơ khách hàng ${cName} đã được lưu thay đổi`,
        5000
      );
    }

    syncCustomers();
    setShowCustomerModal(false);
    setCName("");
    setCPhone("");
    setCLicensePlate("");
    setCDob("");
    setCAddress("");
    setCVehicleClass("sedan");
  };

  // Open Edit Customer Profile
  const handleOpenEditCustomer = (cust?: Customer) => {
    const target = cust || selectedCustomer;
    if (!target) return;
    setCustomerFormMode("edit");
    setCName(target.name);
    setCPhone(target.phone);
    setCLicensePlate(target.licensePlate || "");
    setCDob(target.dob || "");
    setCAddress(target.address || "");
    setShowCustomerModal(true);
  };

  // Add multiple vehicle plates inside Sidebar
  const handleAddVehiclePlate = () => {
    if (!selectedCustomer || !newVehiclePlate.trim()) return;
    const cleanPlate = newVehiclePlate.toUpperCase().trim();
    
    const originalPlates = selectedCustomer.licensePlates || (selectedCustomer.licensePlate ? [selectedCustomer.licensePlate] : []);
    if (originalPlates.includes(cleanPlate)) {
      toast.error("BIỂN SỐ XE ĐÃ TỒN TẠI 🚗", `Biển số ${cleanPlate} đã thuộc sở hữu của tài khoản này rồi.`);
      return;
    }

    const updatedPlates = [...originalPlates, cleanPlate];
    const currentVehicles = selectedCustomer.vehicles || [];
    const updatedVehicles = [...currentVehicles, { plate: cleanPlate, vehicleClass: newVehicleClass }];

    simActions.updateCustomer(selectedCustomer.id, {
      licensePlates: updatedPlates,
      licensePlate: selectedCustomer.licensePlate || cleanPlate, // Set as default if empty
      vehicles: updatedVehicles
    });

    toast.success("ĐĂNG KÝ XE THÀNH CÔNG 🚙", `Đã gán xe biển số ${cleanPlate} (${newVehicleClass.toUpperCase()}) vào tài khoản khách hàng.`);
    setNewVehiclePlate("");
    setNewVehicleClass("sedan");
    setShowAddVehicleForm(false);
    syncCustomers();
  };

  // Master Admin direct points adjustment
  const handleAdjustPointsDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !pointsChange || !pointsReason) return;

    const value = Number(pointsChange);
    const finalChange = pointsDir === "add" ? value : -value;
    const nextPoints = Math.max(0, selectedCustomer.points + finalChange);

    simActions.updateCustomer(selectedCustomer.id, {
      points: nextPoints
    });

    // Write audit log to ledger
    const newLedgerRow: SupLedgerRow = {
      id: "sl_" + Date.now(),
      customerId: selectedCustomer.id,
      date: new Date().toISOString(),
      type: "manual_adjust",
      typeLabel: "Điều chỉnh thủ công (Admin)",
      pointsChanged: finalChange,
      balanceAfter: nextPoints,
      reason: `[MASTER ADMIN ĐIỀU CHỈNH] ${pointsReason}`
    };

    setSupLedger([newLedgerRow, ...supLedger]);
    syncCustomers();
    setShowPointsModal(false);

    toast.warning(
      "ĐẠ ĐIỀU CHỈNH ĐIỂM SUP THỦ CÔNG ⚠️",
      `Khách hàng ${selectedCustomer.name} được điều chỉnh ${finalChange >= 0 ? `+${finalChange}` : finalChange} SUP. Số dư hiện tại: ${nextPoints} SUP.`,
      7000
    );

    setPointsChange("");
    setPointsReason("");
  };

  // Manager proposed points adjustment
  const handleProposePoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !propPoints || !propReason) return;

    const val = Number(propPoints);
    const finalChange = propDir === "add" ? val : -val;

    const newProposal: PointProposal = {
      id: "prop_" + Date.now(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      pointsChanged: finalChange,
      reason: propReason,
      status: "pending",
      timestamp: new Date().toISOString(),
      managerName: "Nguyễn Văn Hùng (Quản Lý)"
    };

    setProposals([newProposal, ...proposals]);
    setShowProposalModal(false);

    toast.info(
      "ĐÃ GỬI ĐỀ XUẤT ĐIỀU CHỈNH 📨",
      `Đề xuất ${finalChange >= 0 ? `+${finalChange}` : finalChange} SUP đã được gửi lên Master Admin duyệt`,
      6000
    );

    setPropPoints("");
    setPropReason("");
  };

  // Master Admin approves proposal
  const handleApproveProposal = (prop: PointProposal) => {
    const cust = simActions.getCustomers().find(c => c.id === prop.customerId);
    if (!cust) {
      toast.error("KHÔNG TÌM THẤY KHÁCH HÀNG ❌", "Khách hàng của đề xuất này không tồn tại trên hệ thống.");
      return;
    }

    const nextPoints = Math.max(0, cust.points + prop.pointsChanged);
    simActions.updateCustomer(cust.id, {
      points: nextPoints
    });

    // Write ledger log
    const newLedgerRow: SupLedgerRow = {
      id: "sl_" + Date.now(),
      customerId: cust.id,
      date: new Date().toISOString(),
      type: "manual_adjust",
      typeLabel: "Duyệt đề xuất tích điểm",
      pointsChanged: prop.pointsChanged,
      balanceAfter: nextPoints,
      reason: `[DUYỆT ĐỀ XUẤT] ${prop.reason} (Manager đề xuất)`
    };

    setSupLedger([newLedgerRow, ...supLedger]);
    setProposals(proposals.map(p => p.id === prop.id ? { ...p, status: "approved" as const } : p));
    syncCustomers();

    toast.success(
      "ĐÃ DUYỆT ĐỀ XUẤT ĐIỀU CHỈNH ĐIỂM SUP ✅",
      `Đã cộng/trừ ${prop.pointsChanged >= 0 ? `+${prop.pointsChanged}` : prop.pointsChanged} SUP cho khách hàng ${cust.name}`,
      7000
    );
  };

  // Master Admin rejects proposal
  const handleRejectProposal = (prop: PointProposal) => {
    setProposals(proposals.map(p => p.id === prop.id ? { ...p, status: "rejected" as const } : p));
    
    toast.error(
      "ĐÃ TỪ CHỐI ĐỀ XUẤT ❌",
      `Đã từ chối đề xuất điều chỉnh điểm của khách hàng ${prop.customerName}`,
      6000
    );
  };

  // Quick emergency compensation desk
  const handleCompensateQuick = () => {
    if (!selectedCustomer) return;

    const newPoints = 50;
    const updatedCust = simActions.getCustomers().find(c => c.id === selectedCustomer.id);
    if (updatedCust) {
      updatedCust.points += newPoints;
      simActions.updateCustomer(updatedCust.id, { points: updatedCust.points });
    }

    const newLedgerRow: SupLedgerRow = {
      id: "sl_" + Date.now(),
      customerId: activeCustomerId,
      date: new Date().toISOString(),
      type: "compensation",
      typeLabel: "Bồi hoàn khiếu nại khẩn",
      pointsChanged: newPoints,
      balanceAfter: updatedCust ? updatedCust.points : selectedCustomer.points,
      reason: "Cấp 50 điểm SUP đền bù lỗi dịch vụ từ phím tắt bồi hoàn nhanh"
    };

    setSupLedger([newLedgerRow, ...supLedger]);

    const randomVCode = "COMP_" + Math.floor(1000 + Math.random() * 9000);
    simActions.addVoucher({
      customerId: activeCustomerId,
      code: randomVCode,
      type: "fixed_amount",
      value: 50000,
      maxDiscount: 50000,
      minOrderValue: 100000,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 86400000 * 15).toISOString(),
      source: "manual_grant"
    });

    syncCustomers();

    toast.error(
      "🚨 ĐÃ KÍCH HOẠT BỒI HOÀN KHẨN",
      `Đã bù 50 điểm SUP & cấp voucher ${randomVCode} trị giá 50,000 VND cho ${selectedCustomer.name}!`,
      8000
    );
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const handleExportCSV = () => {
    if (role !== "master_admin" && role !== "manager") {
      toast.error("KHÔNG ĐỦ QUYỀN HẠN ❌", "Bạn không có quyền xuất dữ liệu khách hàng.");
      return;
    }

    const headers = ["ID", "Họ Tên", "Số Điện Thoại", "Biển Số Xe", "Điểm SUP", "Hạng Thành Viên", "Tổng Chi Tiêu (VND)", "Ngày Sinh", "Địa Chỉ", "Ngày Tạo"];
    
    const rows = filteredCustomers.map(cust => {
      const spent = calculateCustomerTotalSpent(cust);
      const plates = (cust.licensePlates || (cust.licensePlate ? [cust.licensePlate] : [])).join("; ");
      
      let phone = cust.phone;
      if (role === "manager") {
        phone = phone.substring(0, phone.length - 3) + "***";
      }

      let tier = "Hạng Phổ Thông";
      if (cust.points >= 300) tier = "Diamond VIP";
      else if (cust.points >= 100) tier = "Gold Member";

      return [
        cust.id,
        cust.name,
        phone,
        plates,
        cust.points,
        tier,
        spent,
        cust.dob || "",
        cust.address || "",
        cust.createdAt
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `crm_export_${role}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (role === "manager") {
      toast.warning(
        "XUẤT FILE AN TOÀN TRUNG GIAN ⚠️",
        "Đã che 3 số cuối điện thoại của khách hàng theo chính sách bảo mật nội bộ dành cho Quản lý.",
        7000
      );
    } else {
      toast.success(
        "XUẤT DỮ LIỆU CSV THÀNH CÔNG 📊",
        `Đã tải xuống danh sách gồm ${rows.length} khách hàng với toàn quyền Master Admin.`,
        6000
      );
    }
  };

  // Filter current active proposals for the active customer
  const currentCustomerProposals = proposals.filter(p => p.customerId === activeCustomerId && p.status === "pending");

  // Keep history plate filter synced
  useEffect(() => {
    setHistoryPlateFilter("all");
  }, [selectedCustomerId]);

  return (
    <div className="space-y-6">
      
      {/* ROLE SWITCHER BAR */}
      <div className="bg-[#1a1a1a] text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4 border border-[#2d2d2d] shadow-md" id="crm-role-bar">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-sans font-medium">
          <Shield className="h-4 w-4 text-[#A2C62C]" />
          <span>PHÂN QUYỀN HỆ THỐNG OS:</span>
          <span className="text-white font-extrabold uppercase font-sans bg-white/10 px-2 py-0.5 rounded">
            {role === "master_admin" ? "MASTER ADMIN (TOÀN QUYỀN)" : "QUẢN LÝ VẬN HÀNH"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="role-switch-manager"
            onClick={() => setRole("manager")}
            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition cursor-pointer ${
              role === "manager"
                ? "bg-[#A2C62C] text-matte-black shadow-sm"
                : "bg-[#282828] text-gray-400 hover:text-white"
            }`}
          >
            Quản lý vận hành
          </button>
          <button
            type="button"
            id="role-switch-admin"
            onClick={() => setRole("master_admin")}
            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition cursor-pointer ${
              role === "master_admin"
                ? "bg-[#A2C62C] text-matte-black shadow-sm"
                : "bg-[#282828] text-gray-400 hover:text-white"
            }`}
          >
            Master Admin
          </button>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2" id="crm-header-card">
        <div className="px-4">
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">HỆ THỐNG HỘI VIÊN & ĐIỂM THƯỞNG SUP</h1>
          <p className="text-mid-gray text-xs mt-1 font-sans">
            Bảng theo dõi tổng quan thông tin tài khoản, quản lý nhiều phương tiện (xe), cấp voucher thủ công và tra cứu lịch sử dịch vụ.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            id="btn-add-customer-main"
            onClick={() => {
              setCustomerFormMode("add");
              setCName("");
              setCPhone("");
              setCLicensePlate("");
              setCDob("");
              setCAddress("");
              setShowCustomerModal(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl bg-[#A2C62C] text-matte-black hover:bg-[#A2C62C]/90 text-xs font-black font-display uppercase transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Thêm hội viên mới
          </button>
          <button
            type="button"
            id="btn-add-voucher-main"
            onClick={() => {
              setShowVoucherModal(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl bg-matte-black text-white hover:bg-matte-black/95 text-xs font-black font-display uppercase transition shadow-sm cursor-pointer"
          >
            <Gift className="h-4 w-4" />
            Cấp Voucher toàn hệ thống
          </button>
        </div>
      </div>

      {/* TABS BAR */}
      <div className="flex border border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-sm gap-2 overflow-x-auto scrollbar-none" id="crm-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab("customers")}
          className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
            activeTab === "customers"
              ? "bg-[#18181b] text-white shadow-xs"
              : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
          }`}
        >
          <Users className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "customers" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
          DANH SÁCH HỘI VIÊN
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
            activeTab === "vouchers"
              ? "bg-[#18181b] text-white shadow-xs"
              : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
          }`}
        >
          <Tag className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "vouchers" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
          QUẢN LÝ VOUCHER
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
            activeTab === "groups"
              ? "bg-[#18181b] text-white shadow-xs"
              : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
          }`}
        >
          <Compass className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "groups" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
          NHÓM KHÁCH HÀNG
        </button>
      </div>

      {activeTab === "customers" && (
        <>
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="space-y-4" id="crm-search-controls-wrapper">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-mid-gray" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hội viên, số điện thoại, biển số xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-10 pr-4 py-3 text-xs font-sans text-matte-black focus:outline-none focus:border-[#A2C62C] placeholder-mid-gray shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-4.5 py-3 rounded-xl border text-xs font-black font-display uppercase transition shadow-sm cursor-pointer ${
                showAdvancedFilters || filterSpent !== "all" || filterVisits !== "all" || filterLastVisit !== "all" || filterVouchers !== "all" || filterDobMonth !== "all"
                  ? "bg-[#A2C62C]/10 border-[#A2C62C] text-forest-green"
                  : "bg-white border-[#e5e5e5] text-slate-700 hover:bg-stone-50"
              }`}
            >
              <Settings className="h-4 w-4" />
              Bộ lọc nâng cao {(filterSpent !== "all" || filterVisits !== "all" || filterLastVisit !== "all" || filterVouchers !== "all" || filterDobMonth !== "all") && "•"}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-black font-display uppercase transition shadow-sm cursor-pointer"
            >
              Xuất File CSV
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-stone-50 border border-[#e5e5e5] p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 overflow-hidden shadow-inner"
            >
              {/* Lọc chi tiêu */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Tổng chi tiêu</label>
                <select
                  value={filterSpent}
                  onChange={(e) => setFilterSpent(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả chi tiêu</option>
                  <option value="under_1m">Dưới 1 triệu</option>
                  <option value="1m_5m">Từ 1 - 5 triệu</option>
                  <option value="over_5m">Trên 5 triệu</option>
                </select>
              </div>

              {/* Số lần ghé */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Số lần ghé trạm</label>
                <select
                  value={filterVisits}
                  onChange={(e) => setFilterVisits(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả lượt ghé</option>
                  <option value="under_3">Dưới 3 lần</option>
                  <option value="3_10">Từ 3 - 10 lần</option>
                  <option value="over_10">Trên 10 lần</option>
                </select>
              </div>

              {/* Ngày ghé gần nhất */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Lần ghé gần nhất</label>
                <select
                  value={filterLastVisit}
                  onChange={(e) => setFilterLastVisit(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="7_days">7 ngày vừa qua</option>
                  <option value="30_days">30 ngày vừa qua</option>
                  <option value="over_30">Hơn 30 ngày trước</option>
                </select>
              </div>

              {/* Còn voucher hay không */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Ví Voucher cá nhân</label>
                <select
                  value={filterVouchers}
                  onChange={(e) => setFilterVouchers(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="has_voucher">Còn voucher khả dụng</option>
                  <option value="no_voucher">Không có voucher khả dụng</option>
                </select>
              </div>

              {/* Tháng sinh nhật */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Tháng sinh nhật</label>
                <select
                  value={filterDobMonth}
                  onChange={(e) => setFilterDobMonth(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả các tháng</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m.toString()}>Tháng {m}</option>
                  ))}
                </select>
              </div>

              {/* Reset filters */}
              <div className="md:col-span-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterSpent("all");
                    setFilterVisits("all");
                    setFilterLastVisit("all");
                    setFilterVouchers("all");
                    setFilterDobMonth("all");
                  }}
                  className="text-[10px] font-extrabold text-red-600 uppercase hover:underline cursor-pointer"
                >
                  Xóa tất cả bộ lọc nâng cao
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN DATA TABLE VIEW */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm" id="crm-data-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-[#e5e5e5]">
                <th className="p-4 pl-6">Khách hàng</th>
                <th className="p-4">Số điện thoại</th>
                <th className="p-4">Danh sách xe sở hữu</th>
                <th className="p-4">Phân hạng</th>
                <th className="p-4 text-center">Số dư điểm</th>
                <th className="p-4 text-right">Tổng chi tiêu</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-mid-gray font-sans text-xs">
                    Không tìm thấy hội viên nào phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const totalSpent = calculateCustomerTotalSpent(cust);
                  const plates = cust.licensePlates || (cust.licensePlate ? [cust.licensePlate] : []);
                  
                  // Tier selector
                  let tier = "Hạng Phổ Thông";
                  let tierClass = "bg-slate-100 text-slate-700 border border-slate-200/50";
                  if (cust.points >= 300) {
                    tier = "Diamond VIP";
                    tierClass = "bg-amber-100 text-amber-800 border border-amber-200";
                  } else if (cust.points >= 100) {
                    tier = "Gold Member";
                    tierClass = "bg-lime-100 text-lime-800 border border-lime-200";
                  }

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setIsSidebarOpen(true);
                      }}
                      className={`hover:bg-lime-50/20 transition cursor-pointer ${
                        selectedCustomerId === cust.id ? "bg-[#A2C62C]/5" : ""
                      }`}
                    >
                      <td className="p-4 pl-6 font-display font-black uppercase text-slate-900 tracking-tight">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-stone-200">
                            {cust.name.split(" ").pop()?.substring(0, 2).toUpperCase() || "C"}
                          </div>
                          <div>
                            <span className="block">{cust.name}</span>
                            <span className="text-[9px] text-slate-400 normal-case font-normal font-sans">
                              ID: {cust.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-sans font-bold text-slate-600">
                        {cust.phone}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {plates.length === 0 ? (
                            <span className="text-stone-400 italic text-[10px]">Chưa đăng ký xe</span>
                          ) : (
                            plates.map((plate, idx) => (
                              <span
                                key={`${plate}-${idx}`}
                                className="inline-flex px-2 py-0.5 bg-stone-100 text-slate-800 rounded font-sans font-bold text-[9px] border border-stone-200"
                              >
                                {plate}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${tierClass}`}>
                          {tier}
                        </span>
                      </td>
                      <td className="p-4 text-center font-extrabold text-slate-900">
                        <span className="inline-flex items-center gap-1 justify-center text-xs font-black text-lime-700">
                          <Award className="h-3.5 w-3.5 text-[#A2C62C] fill-lime-100" />
                          {cust.points} SUP
                        </span>
                      </td>
                      <td className="p-4 text-right font-sans font-extrabold text-slate-900 text-xs">
                        {formatVnd(totalSpent)}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(cust.id);
                            setIsSidebarOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#A2C62C] hover:text-matte-black rounded-lg text-[10px] font-extrabold uppercase text-slate-700 tracking-wider transition"
                        >
                          Hồ Sơ & Xe
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

      {/* ALL SYSTEM PROPOSALS AUDIT TABLE (IF ROLE IS ADMIN & CONTAINS PROPOSALS) */}
      {role === "master_admin" && proposals.length > 0 && (
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4" id="crm-proposals-audit-desk">
          <h3 className="font-display font-extrabold text-sm text-matte-black tracking-wider uppercase flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
            YÊU CẦU ĐIỀU CHỈNH ĐIỂM CHỜ DUYỆT ĐỒNG BỘ
          </h3>

          <div className="overflow-x-auto border border-[#e5e5e5] rounded-xl">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-[#e5e5e5]">
                  <th className="p-3.5 pl-5">Thời gian</th>
                  <th className="p-3.5">Người đề xuất</th>
                  <th className="p-3.5">Hội viên nhận</th>
                  <th className="p-3.5 text-center">Biến động</th>
                  <th className="p-3.5">Lý do</th>
                  <th className="p-3.5 text-center">Trạng thái</th>
                  <th className="p-3.5 text-right pr-5">Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {proposals.map(prop => (
                  <tr key={prop.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 pl-5 text-slate-500">{new Date(prop.timestamp).toLocaleString("vi-VN")}</td>
                    <td className="p-3.5 font-bold text-slate-700">{prop.managerName}</td>
                    <td className="p-3.5 font-bold text-slate-950">{prop.customerName}</td>
                    <td className={`p-3.5 text-center font-black text-sm ${prop.pointsChanged >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {prop.pointsChanged >= 0 ? `+${prop.pointsChanged}` : prop.pointsChanged} SUP
                    </td>
                    <td className="p-3.5 text-slate-500 italic max-w-xs truncate">
                      <MarkdownRenderer text={prop.reason} />
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                        prop.status === "pending"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : prop.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {prop.status === "pending" ? "Đang chờ" : prop.status === "approved" ? "Đã duyệt" : "Từ chối"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right pr-5">
                      {prop.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleRejectProposal(prop)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[9px] uppercase rounded transition cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            onClick={() => handleApproveProposal(prop)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold text-[9px] uppercase rounded transition cursor-pointer"
                          >
                            Duyệt
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === "vouchers" && (
        <div className="space-y-6" id="vouchers-tab-container">
          {/* S4.11 overview widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left" id="vouchers-overview-stats">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5 rounded-2xl shadow-sm flex items-center justify-between text-left">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase block tracking-wider font-sans">ĐANG HOẠT ĐỘNG</span>
                <span className="text-3xl font-black text-emerald-900 mt-1 block">
                  {vouchersList.filter(v => getVoucherRuntimeStatus(v) === "active").length}
                </span>
                <span className="text-[10px] text-emerald-700/80 mt-1.5 block">Mã giảm giá đang có hiệu lực sử dụng</span>
              </div>
              <div className="h-12 w-12 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-5 rounded-2xl shadow-sm flex items-center justify-between text-left">
              <div>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase block tracking-wider font-sans">SẮP HẾT HẠN (7 NGÀY)</span>
                <span className="text-3xl font-black text-amber-900 mt-1 block">
                  {vouchersList.filter(v => {
                    if (getVoucherRuntimeStatus(v) !== "active") return false;
                    const expTime = new Date(v.validTo).getTime();
                    const diff = expTime - Date.now();
                    return diff > 0 && diff < 7 * 86400000;
                  }).length}
                </span>
                <span className="text-[10px] text-amber-700/80 mt-1.5 block">Hết hạn trong vòng 7 ngày tới</span>
              </div>
              <div className="h-12 w-12 bg-amber-500/15 rounded-xl flex items-center justify-center text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#A2C62C]/10 to-lime-500/5 border border-[#A2C62C]/20 p-5 rounded-2xl shadow-sm flex items-center justify-between text-left">
              <div>
                <span className="text-[10px] font-extrabold text-lime-800 uppercase block tracking-wider font-sans">DÙNG NHIỀU NHẤT</span>
                <span className="text-lg font-black text-slate-800 mt-1 block uppercase truncate max-w-[190px]">
                  {(() => {
                    if (redemptions.length === 0) return "CHƯA CÓ LƯỢT DÙNG";
                    const counts: Record<string, number> = {};
                    redemptions.forEach(r => {
                      counts[r.voucherId] = (counts[r.voucherId] || 0) + 1;
                    });
                    let maxVId = "";
                    let maxCount = 0;
                    Object.entries(counts).forEach(([vId, count]) => {
                      if (count > maxCount) {
                        maxCount = count;
                        maxVId = vId;
                      }
                    });
                    const topV = vouchersList.find(v => v.id === maxVId);
                    return topV ? `${topV.code} (${maxCount} lượt)` : "KHÔNG XÁC ĐỊNH";
                  })()}
                </span>
                <span className="text-[10px] text-lime-700/80 mt-1.5 block">Mã có tần suất áp dụng lớn nhất</span>
              </div>
              <div className="h-12 w-12 bg-[#A2C62C]/15 rounded-xl flex items-center justify-center text-lime-700">
                <Gift className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Vouchers Filter & Actions */}
          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm text-left" id="vouchers-filter-panel">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Trạng thái</label>
                <select
                  value={vFilterStatus}
                  onChange={(e) => setVFilterStatus(e.target.value)}
                  className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Nháp / Chưa bắt đầu</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="paused">Tạm dừng</option>
                  <option value="expired">Hết hạn</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold text-stone-500 uppercase block">Đối tượng áp dụng</label>
                <select
                  value={vFilterTarget}
                  onChange={(e) => setVFilterTarget(e.target.value)}
                  className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                >
                  <option value="all">Tất cả đối tượng</option>
                  <option value="all_customers">Tất cả khách hàng</option>
                  <option value="group">Theo nhóm khách</option>
                  <option value="specific_customers">Khách được chỉ định</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVFormMode("add");
                setVCode("");
                setVName("");
                setVType("percent");
                setVValue("");
                setVMinOrder("");
                setVMaxDiscount("");
                setVValidFrom(new Date().toISOString().substring(0, 10));
                setVValidTo(new Date(Date.now() + 86400000 * 30).toISOString().substring(0, 10));
                setVLimitPerCustomer("1");
                setVLimitTotal("");
                setVTargetType("all_customers");
                setVTargetGroupId("");
                setVTargetSpecificCustomers([]);
                setVStatus("active");
                setVSource("manual");
                setShowVoucherModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-black font-display uppercase transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tạo Voucher Mới
            </button>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm" id="vouchers-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-[#e5e5e5]">
                    <th className="p-4 pl-6">Mã & Tên Voucher</th>
                    <th className="p-4">Loại & Giá trị</th>
                    <th className="p-4">Đối tượng áp dụng</th>
                    <th className="p-4">Giới hạn sử dụng</th>
                    <th className="p-4">Thời gian hiệu lực</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-right pr-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {vouchersList
                    .filter(v => {
                      const rtStatus = getVoucherRuntimeStatus(v);
                      if (vFilterStatus !== "all" && rtStatus !== vFilterStatus) return false;
                      if (vFilterTarget !== "all" && v.target_type !== vFilterTarget) return false;
                      return true;
                    })
                    .map(v => {
                      const usedCount = redemptions.filter(r => r.voucherId === v.id).length;
                      const rtStatus = getVoucherRuntimeStatus(v);
                      
                      let statusBadge = "bg-stone-100 text-stone-600 border border-stone-200";
                      let statusText = "Nháp";
                      if (rtStatus === "active") {
                        statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                        statusText = "Đang hoạt động";
                      } else if (rtStatus === "paused") {
                        statusBadge = "bg-amber-50 text-amber-700 border border-amber-100";
                        statusText = "Tạm dừng";
                      } else if (rtStatus === "expired") {
                        statusBadge = "bg-red-50 text-red-700 border border-red-100";
                        statusText = "Hết hạn";
                      }

                      let targetText = "Tất cả khách hàng";
                      if (v.target_type === "group") {
                        const grp = groups.find(g => g.id === v.target_group_id);
                        targetText = `Nhóm: ${grp ? grp.name : "Không xác định"}`;
                      } else if (v.target_type === "specific_customers") {
                        const targetCustCount = v.target_specific_customers?.length || (v.customerId && v.customerId !== "all" ? 1 : 0);
                        targetText = `Danh sách chỉ định (${targetCustCount} khách)`;
                      }

                      return (
                        <tr key={v.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4 pl-6 text-left">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-sans font-extrabold text-[10px] tracking-wider uppercase">
                                {v.code}
                              </span>
                              <span className="text-slate-800 font-bold font-sans text-xs">
                                {v.name || "Chưa đặt tên"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-left">
                            <span className="font-extrabold text-slate-800">
                              {v.type === "percent"
                                ? `Giảm ${v.value}%`
                                : v.type === "free_service"
                                  ? "Miễn phí dịch vụ"
                                  : `Giảm ${formatVnd(v.value)}`}
                            </span>
                            {v.maxDiscount && (
                              <span className="block text-[9px] text-slate-400 mt-0.5">
                                Trần giảm: {formatVnd(v.maxDiscount)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-600 font-medium text-left">
                            {targetText}
                          </td>
                          <td className="p-4 text-left">
                            <span className="font-bold text-slate-700 block">
                              {usedCount} / {v.usage_limit_total || "∞"} lượt
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              Giới hạn: {v.usage_limit_per_customer || 1} lần/khách
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-sans text-[10px] text-left">
                            {new Date(v.validFrom).toLocaleDateString("vi-VN")} - {new Date(v.validTo).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase border ${statusBadge}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingVoucherId(v.id)}
                                className="px-2 py-1 bg-stone-150 hover:bg-stone-200 text-stone-700 font-bold text-[9px] uppercase rounded transition cursor-pointer"
                              >
                                Phân bổ
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditVoucher(v)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[9px] uppercase rounded transition cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleVoucherStatus(v)}
                                className={`px-2 py-1 font-bold text-[9px] uppercase rounded transition cursor-pointer ${
                                  v.status === "paused"
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-600"
                                }`}
                              >
                                {v.status === "paused" ? "Kích hoạt" : "Tạm dừng"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVoucher(v)}
                                disabled={usedCount > 0}
                                className={`px-2 py-1 font-bold text-[9px] uppercase rounded transition cursor-pointer ${
                                  usedCount > 0
                                    ? "bg-stone-50 text-stone-300 cursor-not-allowed"
                                    : "bg-red-50 hover:bg-red-100 text-red-600"
                                }`}
                                title={usedCount > 0 ? "Voucher đã được áp dụng, không thể xóa." : "Xóa voucher"}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {vouchersList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-mid-gray">
                        Chưa có voucher nào trong hệ thống. Hãy bấm Tạo Voucher Mới.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "groups" && (
        <div className="space-y-6" id="groups-tab-container">
          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm" id="groups-filter-panel">
            <div className="text-left">
              <h3 className="font-display font-extrabold text-sm text-matte-black uppercase tracking-wider">Danh sách Nhóm Hội Viên</h3>
              <p className="text-mid-gray text-[11px] mt-0.5">Phân loại nhóm khách hàng Tĩnh (chọn tay) hoặc nhóm Động (tự động lọc theo điều kiện) để gắn campaign/voucher.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setGroupFormMode("add");
                setGName("");
                setGMode("static");
                setGFilterSpent("all");
                setGFilterVisits("all");
                setGFilterLastVisit("all");
                setGFilterVouchers("all");
                setGFilterDobMonth("all");
                setGSelectedCustomers([]);
                setShowGroupModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-black font-display uppercase transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tạo Nhóm Mới
            </button>
          </div>

          {/* Groups List Table */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm" id="groups-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-[#e5e5e5]">
                    <th className="p-4 pl-6">Tên Nhóm</th>
                    <th className="p-4">Phân Loại</th>
                    <th className="p-4">Mô tả tiêu chí / Thành viên</th>
                    <th className="p-4 text-center">Số lượng khách</th>
                    <th className="p-4 text-right pr-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {groups.map(g => {
                    const members = getGroupMembers(g);
                    const memberCount = members.length;

                    return (
                      <tr key={g.id} className="hover:bg-stone-50/50 transition">
                        <td className="p-4 pl-6 font-bold text-slate-900 text-left">
                          {g.name}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                            g.mode === "dynamic"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-purple-50 text-purple-700 border border-purple-100"
                          }`}>
                            {g.mode === "dynamic" ? "Động" : "Tĩnh"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 max-w-sm truncate text-left">
                          {g.mode === "dynamic" ? (
                            <span>
                              {g.filterCriteria?.spent !== "all" && `Chi tiêu: ${g.filterCriteria?.spent} • `}
                              {g.filterCriteria?.visits !== "all" && `Lượt ghé: ${g.filterCriteria?.visits} • `}
                              {g.filterCriteria?.lastVisit !== "all" && `Ghé lần cuối: ${g.filterCriteria?.lastVisit} • `}
                              {g.filterCriteria?.dobMonth !== "all" && `Tháng sinh nhật: ${g.filterCriteria?.dobMonth}`}
                              {!g.filterCriteria || (g.filterCriteria.spent === "all" && g.filterCriteria.visits === "all" && g.filterCriteria.lastVisit === "all" && g.filterCriteria.dobMonth === "all") ? "Tất cả khách" : ""}
                            </span>
                          ) : (
                            <span>Thành viên: {members.map(m => m.name).join(", ") || "(Trống)"}</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-900">
                          {memberCount} thành viên
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditGroup(g)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[9px] uppercase rounded transition cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(g.id, g.name)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[9px] uppercase rounded transition cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-mid-gray">
                        Chưa có nhóm khách hàng nào được tạo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER SIDEBAR SLIDING IN FROM RIGHT */}
      <AnimatePresence>
        {isSidebarOpen && selectedCustomer && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] z-[100] transition-opacity"
            />

            {/* Sliding Sidebar Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-[101] flex flex-col border-l border-stone-200 overflow-hidden"
              id="crm-sidebar-drawer"
            >
              {/* Sidebar Header */}
              <div className="p-5 border-b border-stone-150 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#A2C62C]" />
                  <h2 className="text-sm font-extrabold font-display tracking-wider text-slate-900 uppercase">
                    Chi Tiết Tài Khoản Hội Viên
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditCustomer(selectedCustomer)}
                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-bold font-sans cursor-pointer"
                  >
                    <Edit className="h-4 w-4" /> Sửa thông tin
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Sidebar Content (Scrollable) */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6 text-left">
                
                {/* SECTION 1: THÔNG TIN HỘI VIÊN */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800 tracking-wider">
                    <span className="bg-[#A2C62C] w-1.5 h-3.5 rounded-xs inline-block"></span>
                    SECTION 1: THÔNG TIN HỘI VIÊN
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3.5 relative" id="sidebar-profile-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-[#A2C62C] font-black uppercase tracking-widest block font-sans">
                          THẺ HỘI VIÊN CHÍNH THỨC
                        </span>
                        <h3 className="text-xl font-black font-display uppercase tracking-tight text-slate-900 mt-1">
                          {selectedCustomer.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-900 text-[#A2C62C] font-black text-[10px] rounded uppercase font-sans tracking-wider">
                        {selectedCustomer.points >= 300 ? "VIP DIAMOND" : selectedCustomer.points >= 100 ? "GOLD" : "MEMBER"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-[9px] text-slate-400 block font-black uppercase">SỐ ĐIỆN THOẠI</span>
                          <span className="font-sans font-bold">{selectedCustomer.phone}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-[9px] text-slate-400 block font-black uppercase">NGÀY SINH (DOB)</span>
                          <span className="font-bold">{selectedCustomer.dob ? new Date(selectedCustomer.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-700 md:col-span-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-[9px] text-slate-400 block font-black uppercase">ĐỊA CHỈ THƯỜNG TRÚ</span>
                          <span className="font-medium text-slate-800">{selectedCustomer.address || "Chưa cập nhật địa chỉ"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: TỔNG CHI TIÊU & LỊCH SỬ CHĂM SÓC */}
                {(() => {
                  const list = selectedCustomer.vehicles || [];
                  const plates = selectedCustomer.licensePlates || (selectedCustomer.licensePlate ? [selectedCustomer.licensePlate] : []);
                  const merged = [...list];
                  plates.forEach(p => {
                    if (!merged.some(v => v.plate === p)) {
                      merged.push({ plate: p, vehicleClass: "sedan" });
                    }
                  });

                  const activeHistoryPlate = (historyPlateFilter === "all" || !merged.some(v => v.plate === historyPlateFilter))
                    ? (merged[0]?.plate || "")
                    : historyPlateFilter;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800 tracking-wider">
                        <span className="bg-[#A2C62C] w-1.5 h-3.5 rounded-xs inline-block"></span>
                        SECTION 2: TỔNG CHI TIÊU & LỊCH SỬ
                      </div>

                      {/* Highlighted Spent */}
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 flex items-center justify-between" id="highlight-spent-card">
                        <div>
                          <span className="text-[9px] text-emerald-800 font-extrabold tracking-wider block uppercase font-sans">TỔNG CHI TIÊU HỘI VIÊN</span>
                          <span className="text-2xl font-black font-sans text-emerald-700 tracking-tight block mt-1">
                            {formatVnd(calculateCustomerTotalSpent(selectedCustomer))}
                          </span>
                        </div>
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-xs">
                          <DollarSign className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Care history block with tabs per vehicle, no 'all vehicles' tab */}
                      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Car className="h-4 w-4 text-lime-600" /> Chọn phương tiện để xem lịch sử
                          </span>
                          {!showAddVehicleForm && (
                            <button
                              type="button"
                              onClick={() => setShowAddVehicleForm(true)}
                              className="text-[#1a1a1a] hover:text-[#1a1a1a]/80 font-extrabold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition font-sans"
                            >
                              <PlusCircle className="h-3.5 w-3.5" /> Đăng ký thêm xe
                            </button>
                          )}
                        </div>

                        {/* Interactive vehicle tabs */}
                        <div className="flex flex-wrap gap-2">
                          {merged.length === 0 ? (
                            <span className="text-xs text-stone-400 italic font-sans py-1">Hội viên chưa có xe đăng ký</span>
                          ) : (
                            merged.map((v, idx) => (
                              <button
                                type="button"
                                key={`${v.plate}-${idx}`}
                                onClick={() => setHistoryPlateFilter(v.plate)}
                                className={`px-3 py-2 rounded-xl border text-xs font-bold font-sans transition cursor-pointer flex items-center gap-1.5 ${
                                  activeHistoryPlate === v.plate
                                    ? "bg-[#A2C62C] border-[#A2C62C] text-slate-950 shadow-sm"
                                    : "bg-stone-50 border-stone-200 text-slate-600 hover:bg-stone-100"
                                }`}
                              >
                                <Car className="h-3.5 w-3.5" />
                                <span>{v.plate}</span>
                                <span className="text-[8px] uppercase opacity-75 font-sans">({v.vehicleClass})</span>
                              </button>
                            ))
                          )}
                        </div>

                        {/* Add Vehicle Inline Expand Form */}
                        {showAddVehicleForm && (
                          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 pt-3.5 text-left">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-stone-500 uppercase block">Biển số xe mới</label>
                                <input
                                  type="text"
                                  placeholder="Ví dụ: 30A-999.99..."
                                  value={newVehiclePlate}
                                  onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                                  className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-sans font-bold focus:outline-none"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-stone-500 uppercase block">Phân hạng (Segment)</label>
                                <select
                                  value={newVehicleClass}
                                  onChange={(e) => setNewVehicleClass(e.target.value as any)}
                                  className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none"
                                >
                                  <option value="sedan">Sedan (4-5 chỗ nhỏ)</option>
                                  <option value="suv">SUV / CUV (5-7 chỗ lớn)</option>
                                  <option value="truck">Bán tải / Xe khách</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddVehicleForm(false);
                                  setNewVehiclePlate("");
                                  setNewVehicleClass("sedan");
                                }}
                                className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-50 cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={handleAddVehiclePlate}
                                className="px-4 py-1.5 bg-[#A2C62C] text-slate-950 rounded-lg text-xs font-extrabold uppercase hover:bg-[#8fb124] cursor-pointer"
                              >
                                Xác nhận đăng ký
                              </button>
                            </div>
                          </div>
                        )}

                        {/* History Table */}
                        <div className="pt-2">
                          <div className="text-[10px] font-black text-slate-400 uppercase mb-2">
                            LỊCH SỬ THI CÔNG CHI TIẾT CỦA XE <span className="text-forest-green font-sans font-extrabold">{activeHistoryPlate || "CHƯA CÓ CHỌN"}</span>
                          </div>
                          
                          <div className="overflow-x-auto border border-stone-150 rounded-xl bg-white">
                            <table className="w-full text-left border-collapse font-sans text-xs">
                              <thead>
                                <tr className="bg-stone-50 text-slate-400 font-extrabold text-[9px] uppercase border-b border-stone-150">
                                  <th className="p-3 pl-4">Thời gian</th>
                                  <th className="p-3">Gói dịch vụ</th>
                                  <th className="p-3 text-right">Chi phí</th>
                                  <th className="p-3 text-center pr-4">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100">
                                {getCustomerCareHistory(selectedCustomer).length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="p-6 text-center text-stone-400 italic font-sans bg-white">
                                      Không tìm thấy dữ liệu thi công cho phương tiện này.
                                    </td>
                                  </tr>
                                ) : (
                                  getCustomerCareHistory(selectedCustomer).map((o) => (
                                    <tr key={o.id} className="hover:bg-stone-50/50 transition">
                                      <td className="p-3 pl-4 text-slate-500 font-medium">
                                        {new Date(o.createdAt).toLocaleString("vi-VN", {
                                          dateStyle: "short",
                                          timeStyle: "short"
                                        })}
                                      </td>
                                      <td className="p-3">
                                        <span className="inline-flex px-1.5 py-0.5 bg-slate-900 text-[#A2C62C] font-black text-[9px] rounded font-sans">
                                          {o.packageCode}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-sans font-extrabold text-slate-900">
                                        {formatVnd(o.total)}
                                      </td>
                                      <td className="p-3 text-center pr-4">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                          o.commerceStatus === "paid" || o.commerceStatus === "closed"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                            : o.commerceStatus === "cancelled"
                                              ? "bg-red-50 text-red-700 border border-red-100"
                                              : "bg-blue-50 text-blue-700 border border-blue-100"
                                        }`}>
                                          {o.commerceStatus === "paid" ? "Hoàn thành" : o.commerceStatus === "closed" ? "Hoàn thành" : o.commerceStatus === "cancelled" ? "Đã hủy" : "Chờ thu tiền"}
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
                  );
                })()}

                {/* SECTION 3: ĐIỂM TÍCH LŨY */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800 tracking-wider">
                    <span className="bg-[#A2C62C] w-1.5 h-3.5 rounded-xs inline-block"></span>
                    SECTION 3: ĐIỂM TÍCH LŨY
                  </div>
                  
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 flex flex-col justify-between" id="highlight-sup-card">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="text-[8px] text-amber-800 font-extrabold tracking-wider block uppercase">ĐIỂM TÍCH LŨY</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black font-sans text-amber-700 tracking-tight">
                            {selectedCustomer.points} SUP
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPointsHistoryModal(true)}
                            className="text-xs font-bold text-[#A2C62C] hover:text-[#8fb124] underline flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <History className="h-3 w-3" /> lịch sử điểm
                          </button>
                        </div>
                      </div>
                      <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                        <Award className="h-5 w-5" />
                      </div>
                    </div>

                    {role === "master_admin" || role === "manager" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (role === "master_admin") {
                            setShowPointsModal(true);
                          } else {
                            setShowProposalModal(true);
                          }
                        }}
                        className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider text-center transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Shield className="h-3.5 w-3.5" /> Chỉnh sửa điểm
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* SECTION 4: VOUCHER HIỆN CÓ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800 tracking-wider">
                      <span className="bg-[#A2C62C] w-1.5 h-3.5 rounded-xs inline-block"></span>
                      SECTION 4: VOUCHER HIỆN CÓ ({customerVouchers.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVoucherModal(true)}
                      className="text-[#1a1a1a] hover:text-[#1a1a1a]/80 font-extrabold uppercase text-[10px] flex items-center gap-1 cursor-pointer transition font-sans"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Cấp voucher thủ công
                    </button>
                  </div>

                  {customerVouchers.length === 0 ? (
                    <div className="p-5 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 text-slate-400 font-sans text-xs">
                      Hội viên chưa có voucher ưu đãi cá nhân nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customerVouchers.map((v) => (
                        <div
                          key={v.id}
                          className="p-3 border-2 border-[#A2C62C] bg-[#A2C62C]/5 rounded-xl flex justify-between items-center relative overflow-hidden shadow-xs"
                        >
                          {/* Ticket edge cuts */}
                          <div className="absolute top-1/2 -left-2 h-4 w-4 rounded-full bg-white border border-[#A2C62C] -translate-y-1/2" />
                          <div className="absolute top-1/2 -right-2 h-4 w-4 rounded-full bg-white border border-[#A2C62C] -translate-y-1/2" />

                          <div className="pl-3.5 space-y-0.5">
                            <span className="text-[11px] font-black font-sans tracking-wider text-forest-green uppercase flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {v.code}
                            </span>
                            <span className="text-[10px] text-slate-700 font-sans block leading-none">
                              Giảm {v.type === "percent" ? `${v.value}%` : formatVnd(v.value)}
                            </span>
                            <span className="text-[8px] text-slate-400 font-sans block pt-0.5">
                              Hạn: {new Date(v.validTo).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          <div className="pr-3">
                            {v.usedAt ? (
                              <span className="text-[7px] font-black uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                Đã dùng
                              </span>
                            ) : (
                              <span className="text-[7px] font-black uppercase text-forest-green bg-[#A2C62C]/20 border border-[#A2C62C]/30 px-1.5 py-0.5 rounded animate-pulse">
                                Sẵn sàng
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: ADD / EDIT CUSTOMER PORTRAIT */}
      <AnimatePresence>
        {showCustomerModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-customer-modal"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-[#A2C62C]" />
                  {customerFormMode === "add" ? "ĐĂNG KÝ HỘI VIÊN MỚI" : "CẬP NHẬT HỒ SƠ HỘI VIÊN"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitCustomer} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Họ và tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A..."
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Số điện thoại di động *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 090xxxxxxxx..."
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Ngày tháng năm sinh (DOB)
                  </label>
                  <input
                    type="date"
                    value={cDob}
                    onChange={(e) => setCDob(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Địa chỉ liên lạc / thường trú
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 123 Đường Láng, Hà Nội..."
                    value={cAddress}
                    onChange={(e) => setCAddress(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                  />
                </div>

                {customerFormMode === "add" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                        Biển số liên kết ban đầu
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 30A-123.45..."
                        value={cLicensePlate}
                        onChange={(e) => setCLicensePlate(e.target.value.toUpperCase())}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans font-bold text-matte-black focus:outline-none focus:border-[#A2C62C]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                        Phân hạng (Segment)
                      </label>
                      <select
                        value={cVehicleClass}
                        onChange={(e) => setCVehicleClass(e.target.value as any)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#A2C62C]"
                        disabled={!cLicensePlate.trim()}
                      >
                        <option value="sedan">Sedan (4-5 chỗ nhỏ)</option>
                        <option value="suv">SUV / CUV (5-7 chỗ lớn)</option>
                        <option value="truck">Bán tải / Xe khách</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#A2C62C] hover:bg-[#A2C62C]/90 text-matte-black font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    LƯU HỒ SƠ
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: DIRECT POINTS ADJUSTMENT (MASTER ADMIN ONLY) */}
      <AnimatePresence>
        {showPointsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPointsModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-points-modal"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  ĐIỀU CHỈNH ĐIỂM SUP TRỰC TIẾP
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPointsModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustPointsDirect} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs font-sans text-amber-800 leading-relaxed mb-2">
                  Trực tiếp thay đổi số dư điểm SUP của khách hàng{" "}
                  <strong>{selectedCustomer?.name}</strong>. Nghiệp vụ này sẽ tự
                  động tạo bản ghi kiểm toán trên SUP Ledger.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Hướng thay đổi
                    </label>
                    <select
                      value={pointsDir}
                      onChange={(e) => setPointsDir(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    >
                      <option value="add">Cộng điểm (+)</option>
                      <option value="sub">Trừ điểm (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Số điểm thay đổi
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ví dụ: 50..."
                      value={pointsChange}
                      onChange={(e) => setPointsChange(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Lý do điều chỉnh
                  </label>
                  <MarkdownTextarea
                    id="crm-points-reason"
                    placeholder="Ghi rõ lý do điều chỉnh điểm để phục vụ kiểm toán..."
                    value={pointsReason}
                    onChange={(val) => setPointsReason(val)}
                    rows={3}
                  />
                </div>

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowPointsModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: POINT ADJUSTMENT PROPOSAL (MANAGER ROLE ONLY) */}
      <AnimatePresence>
        {showProposalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProposalModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-proposal-modal"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-blue-400" />
                  ĐỀ XUẤT ĐIỀU CHỈNH ĐIỂM SUP
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleProposePoints} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs font-sans text-blue-800 leading-relaxed mb-2">
                  Bạn đang tạo yêu cầu điều chỉnh số dư điểm SUP của khách hàng{" "}
                  <strong>{selectedCustomer?.name}</strong>. Yêu cầu này cần được
                  Master Admin trực tiếp phê duyệt trước khi cộng vào tài khoản.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Đề xuất thay đổi
                    </label>
                    <select
                      value={propDir}
                      onChange={(e) => setPropDir(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    >
                      <option value="add">Cộng điểm (+)</option>
                      <option value="sub">Trừ điểm (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Số điểm đề xuất
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ví dụ: 20..."
                      value={propPoints}
                      onChange={(e) => setPropPoints(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Lý do đề xuất chi tiết * (Bắt buộc)
                  </label>
                  <MarkdownTextarea
                    id="crm-prop-reason"
                    placeholder="Mô tả lý do, ví dụ: Đăng ký sai thông tin, cộng bù cho khách rửa hôm qua..."
                    value={propReason}
                    onChange={(val) => setPropReason(val)}
                    rows={3}
                  />
                </div>

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    GỬI ĐỀ XUẤT DUYỆT
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: LỊCH SỬ ĐIỂM TÍCH LŨY */}
      <AnimatePresence>
        {showPointsHistoryModal && selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPointsHistoryModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-points-history-modal"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-black font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <History className="h-5 w-5 text-[#A2C62C]" />
                  LỊCH SỬ BIẾN ĐỘNG ĐIỂM SUP - {selectedCustomer.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPointsHistoryModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-stone-50 text-slate-400 font-extrabold text-[9px] uppercase border-b border-stone-200">
                        <th className="p-3 pl-4">Thời gian</th>
                        <th className="p-3">Loại giao dịch</th>
                        <th className="p-3 text-center">Thay đổi</th>
                        <th className="p-3 text-center">Số dư mới</th>
                        <th className="p-3 pr-4">Lý do điều chỉnh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {customerLedger.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-stone-400 italic font-sans bg-white">
                            Chưa có lịch sử giao dịch điểm tích lũy.
                          </td>
                        </tr>
                      ) : (
                        customerLedger.map((row) => (
                          <tr key={row.id} className="hover:bg-stone-50/50 transition">
                            <td className="p-3 pl-4 text-slate-500 font-medium">
                              {new Date(row.date).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short"
                              })}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                row.type === "auto_gain"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : row.type === "redeem"
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : row.type === "compensation"
                                      ? "bg-red-50 text-red-700 border border-red-100"
                                      : "bg-amber-50 text-amber-800 border border-amber-250"
                              }`}>
                                {row.typeLabel || (row.type === "auto_gain" ? "Tự động" : row.type === "redeem" ? "Đổi quà" : row.type === "compensation" ? "Bồi hoàn" : "Điều chỉnh")}
                              </span>
                            </td>
                            <td className={`p-3 text-center font-black ${
                              row.pointsChanged >= 0 ? "text-emerald-600" : "text-red-500"
                            }`}>
                              {row.pointsChanged >= 0 ? `+${row.pointsChanged}` : row.pointsChanged}
                            </td>
                            <td className="p-3 text-center font-sans font-extrabold text-slate-800">
                              {row.balanceAfter} SUP
                            </td>
                            <td className="p-3 pr-4 text-slate-500 font-medium max-w-xs truncate" title={row.reason}>
                              {row.reason}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-5 border-t border-stone-200 bg-stone-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPointsHistoryModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase cursor-pointer"
                >
                  Đóng lịch sử
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: CREATE / EDIT RULE-BASED VOUCHER */}
      <AnimatePresence>
        {showVoucherModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoucherModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-voucher-modal"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#A2C62C]" />
                  {vFormMode === "add" ? "TẠO VOUCHER CHIẾN DỊCH MỚI" : `CẬP NHẬT VOUCHER: ${vCode}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVoucher} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                  Thiết lập điều kiện, hạn dùng, giới hạn sử dụng và đối tượng áp dụng cho mã voucher. Mã sẽ tự động có hiệu lực theo lịch biểu đã cài đặt.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Mã Voucher (Code) *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={vFormMode === "edit"}
                      placeholder="Ví dụ: SUP2026, SUPVIP"
                      value={vCode}
                      onChange={(e) => setVCode(e.target.value.toUpperCase())}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans font-bold text-matte-black focus:outline-none focus:border-[#A2C62C] disabled:bg-stone-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Tên chiến dịch / Chương trình *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Tri ân khách hàng tháng 7"
                      value={vName}
                      onChange={(e) => setVName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Loại ưu đãi
                    </label>
                    <select
                      value={vType}
                      onChange={(e) => setVType(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    >
                      <option value="percent">Giảm giá %</option>
                      <option value="fixed_amount">Giảm tiền mặt (đ)</option>
                      <option value="free_service">Miễn phí dịch vụ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Giá trị giảm *
                    </label>
                    <input
                      type="number"
                      required={vType !== "free_service"}
                      disabled={vType === "free_service"}
                      placeholder={vType === "percent" ? "Ví dụ: 10 (%)" : "Ví dụ: 50000 (đ)"}
                      value={vType === "free_service" ? "" : vValue}
                      onChange={(e) => setVValue(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C] disabled:bg-stone-100"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Nguồn phát hành
                    </label>
                    <select
                      value={vSource}
                      onChange={(e) => setVSource(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    >
                      <option value="manual">Phát hành thủ công</option>
                      <option value="birthday">Tự động sinh nhật</option>
                      <option value="upgrade">Tự động khi lên hạng</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Đơn hàng tối thiểu (đ)
                    </label>
                    <input
                      type="number"
                      placeholder="Không giới hạn..."
                      value={vMinOrder}
                      onChange={(e) => setVMinOrder(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Giảm tối đa (Trần giảm - đ)
                    </label>
                    <input
                      type="number"
                      placeholder="Không giới hạn..."
                      value={vMaxDiscount}
                      onChange={(e) => setVMaxDiscount(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Ngày bắt đầu có hiệu lực *
                    </label>
                    <input
                      type="date"
                      required
                      value={vValidFrom}
                      onChange={(e) => setVValidFrom(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Ngày hết hạn hiệu lực *
                    </label>
                    <input
                      type="date"
                      required
                      value={vValidTo}
                      onChange={(e) => setVValidTo(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Giới hạn / một khách hàng *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ví dụ: 1"
                      value={vLimitPerCustomer}
                      onChange={(e) => setVLimitPerCustomer(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                      Tổng lượt dùng tối đa hệ thống
                    </label>
                    <input
                      type="number"
                      placeholder="Không giới hạn..."
                      value={vLimitTotal}
                      onChange={(e) => setVLimitTotal(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                    />
                  </div>
                </div>

                {/* TARGETING SPECIFICATION */}
                <div className="space-y-2 border-t border-stone-150 pt-3">
                  <label className="text-xs font-sans text-mid-gray uppercase font-black block">
                    Đối tượng khách hàng áp dụng *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="vTargetType"
                        value="all_customers"
                        checked={vTargetType === "all_customers"}
                        onChange={() => setVTargetType("all_customers")}
                      />
                      Tất cả khách
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="vTargetType"
                        value="group"
                        checked={vTargetType === "group"}
                        onChange={() => setVTargetType("group")}
                      />
                      Theo nhóm khách
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
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
                    <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200 mt-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase block">Chọn nhóm thành viên</label>
                      <select
                        value={vTargetGroupId}
                        onChange={(e) => setVTargetGroupId(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                      >
                        <option value="">-- Chưa chọn nhóm --</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({getGroupMembers(g).length} khách)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {vTargetType === "specific_customers" && (
                    <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200 mt-2 max-h-48 overflow-y-auto">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Đánh dấu khách hàng được nhận ({vTargetSpecificCustomers.length} đã chọn):</span>
                      <div className="space-y-1.5">
                        {customers.map(c => {
                          const isChecked = vTargetSpecificCustomers.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer hover:bg-stone-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setVTargetSpecificCustomers(vTargetSpecificCustomers.filter(id => id !== c.id));
                                  } else {
                                    setVTargetSpecificCustomers([...vTargetSpecificCustomers, c.id]);
                                  }
                                }}
                              />
                              <span className="font-bold">{c.name}</span> - <span className="font-sans text-stone-500 text-[10px]">{c.phone}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowVoucherModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#A2C62C] hover:bg-[#A2C62C]/90 text-matte-black font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    {vFormMode === "add" ? "KÍCH HOẠT VOUCHER" : "LƯU THAY ĐỔI"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: CREATE / EDIT CUSTOMER GROUP */}
      <AnimatePresence>
        {showGroupModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGroupModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-group-modal"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Compass className="h-5 w-5 text-purple-400" />
                  {groupFormMode === "add" ? "THIẾT LẬP NHÓM HỘI VIÊN MỚI" : "SỬA NHÓM HỘI VIÊN"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGroup} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Tên Nhóm Hội Viên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Khách Thân Thiết 2026, Sinh Nhật Tháng 7"
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-[#A2C62C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Cơ chế phân nhóm
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="gMode"
                        value="static"
                        checked={gMode === "static"}
                        onChange={() => setGMode("static")}
                      />
                      Nhóm tĩnh (Chọn tay từng người)
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="gMode"
                        value="dynamic"
                        checked={gMode === "dynamic"}
                        onChange={() => setGMode("dynamic")}
                      />
                      Nhóm động (Tự lọc theo hành vi)
                    </label>
                  </div>
                </div>

                {gMode === "dynamic" ? (
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Điều kiện lọc động (And):</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Mức doanh thu tích lũy</label>
                        <select
                          value={gFilterSpent}
                          onChange={(e) => setGFilterSpent(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                        >
                          <option value="all">Tất cả chi tiêu</option>
                          <option value="under_1m">Dưới 1,000,000đ</option>
                          <option value="1m_5m">Từ 1,000,000đ - 5,000,000đ</option>
                          <option value="over_5m">Trên 5,000,000đ</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Số lần ghé trạm</label>
                        <select
                          value={gFilterVisits}
                          onChange={(e) => setGFilterVisits(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                        >
                          <option value="all">Tất cả lượt ghé</option>
                          <option value="under_3">Dưới 3 lần</option>
                          <option value="3_10">Từ 3 đến 10 lần</option>
                          <option value="over_10">Trên 10 lần</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Lần ghé gần nhất</label>
                        <select
                          value={gFilterLastVisit}
                          onChange={(e) => setGFilterLastVisit(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                        >
                          <option value="all">Tất cả mốc giờ</option>
                          <option value="7_days">Trong vòng 7 ngày</option>
                          <option value="30_days">Trong vòng 30 ngày</option>
                          <option value="over_30">Đã hơn 30 ngày chưa ghé</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Tháng sinh nhật</label>
                        <select
                          value={gFilterDobMonth}
                          onChange={(e) => setGFilterDobMonth(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                        >
                          <option value="all">Tất cả các tháng</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={(i + 1).toString()}>Tháng {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Chọn thành viên vào nhóm ({gSelectedCustomers.length} đã chọn):</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {customers.map(c => {
                        const isChecked = gSelectedCustomers.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer hover:bg-stone-100 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setGSelectedCustomers(gSelectedCustomers.filter(id => id !== c.id));
                                } else {
                                  setGSelectedCustomers([...gSelectedCustomers, c.id]);
                                }
                              }}
                            />
                            <span className="font-bold">{c.name}</span> - <span className="text-[10px] text-stone-500 font-sans">{c.phone}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowGroupModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    LƯU NHÓM
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: VOUCHER DETAILS & REDEMPTIONS AUDIT LOG */}
      <AnimatePresence>
        {viewingVoucherId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingVoucherId(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
              id="crm-voucher-details-modal"
            >
              {(() => {
                const v = vouchersList.find(x => x.id === viewingVoucherId);
                if (!v) return null;
                const rtStatus = getVoucherRuntimeStatus(v);
                const voucherRed = redemptions.filter(r => r.voucherId === v.id);

                let statusColor = "text-stone-600 bg-stone-100";
                if (rtStatus === "active") statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                else if (rtStatus === "paused") statusColor = "text-amber-700 bg-amber-50 border-amber-200";
                else if (rtStatus === "expired") statusColor = "text-red-700 bg-red-50 border-red-200";

                return (
                  <>
                    <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                      <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                        <Gift className="h-5 w-5 text-[#A2C62C]" />
                        CHI TIẾT & LỊCH SỬ SỬ DỤNG VOUCHER
                      </h3>
                      <button
                        type="button"
                        onClick={() => setViewingVoucherId(null)}
                        className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                          <span className="text-[10px] font-black text-stone-500 uppercase block">Thông tin cơ bản</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-900 text-[#A2C62C] font-sans font-black text-xs rounded tracking-wider uppercase">
                              {v.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${statusColor}`}>
                              {rtStatus === "active" ? "ĐANG HOẠT ĐỘNG" : rtStatus === "paused" ? "TẠM DỪNG" : "HẾT HẠN"}
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-800 font-sans mt-1">
                            {v.name || "Chưa đặt tên chiến dịch"}
                          </p>
                          <p className="text-xs text-stone-500">
                            Hiệu lực: <strong className="text-slate-700">{new Date(v.validFrom).toLocaleDateString("vi-VN")}</strong> đến <strong className="text-slate-700">{new Date(v.validTo).toLocaleDateString("vi-VN")}</strong>
                          </p>
                          <p className="text-xs text-stone-500">
                            Giá trị giảm: <strong className="text-slate-800">{v.type === "percent" ? `Giảm ${v.value}%` : v.type === "free_service" ? "Miễn phí dịch vụ" : `Giảm ${formatVnd(v.value)}`}</strong>
                          </p>
                        </div>

                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                          <span className="text-[10px] font-black text-stone-500 uppercase block">Thông số phát hành & Hiệu suất</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-stone-400 block text-[10px]">Giới hạn hệ thống:</span>
                              <strong className="text-slate-800">{v.usage_limit_total || "Không giới hạn"}</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">Đã áp dụng:</span>
                              <strong className="text-emerald-600">{voucherRed.length} lượt dùng</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">Giới hạn mỗi khách:</span>
                              <strong className="text-slate-800">{v.usage_limit_per_customer || 1} lần</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">Đối tượng áp dụng:</span>
                              <strong className="text-slate-800 capitalize">
                                {v.target_type === "all_customers" ? "Tất cả khách" : v.target_type === "group" ? "Theo nhóm khách" : "Khách chỉ định"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* REDEMPTION LOG TABLE */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Nhật ký sử dụng / Áp dụng thực tế</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-sans font-bold text-slate-600">
                            {voucherRed.length} bản ghi kiểm toán
                          </span>
                        </div>

                        <div className="border border-stone-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-stone-50 text-slate-500 font-extrabold text-[9px] uppercase border-b border-stone-200">
                                <th className="p-2.5 pl-4">Thời gian</th>
                                <th className="p-2.5">Khách hàng</th>
                                <th className="p-2.5">Mã đơn hàng</th>
                                <th className="p-2.5 text-right pr-4">Số tiền giảm</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-150">
                              {voucherRed.map(r => {
                                const c = customers.find(x => x.id === r.customerId);
                                return (
                                  <tr key={r.id} className="hover:bg-stone-50 transition">
                                    <td className="p-2.5 pl-4 text-stone-500 font-sans text-[10px]">
                                      {new Date(r.redeemedAt).toLocaleString("vi-VN")}
                                    </td>
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-800">{c ? c.name : "Khách vãng lai"}</span>
                                      <span className="block text-[9px] text-stone-400 font-sans">{c ? c.phone : ""}</span>
                                    </td>
                                    <td className="p-2.5 font-sans text-stone-600">{r.orderId}</td>
                                    <td className="p-2.5 text-right pr-4 font-black font-sans text-emerald-600">
                                      -{formatVnd(r.discountApplied)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {voucherRed.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-stone-400 italic">
                                    Chưa có lịch sử áp dụng voucher này trên hệ thống.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border-t border-stone-200 bg-stone-50 flex justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingVoucherId(null)}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs font-display uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
                      >
                        ĐÓNG CỬA SỔ
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
