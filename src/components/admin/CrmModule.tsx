import React, { useState, useEffect } from "react";
import {
  Users,
  Gift,
  Compass,
  Award,
  BarChart3,
  TrendingUp,
  Shield,
  Clock,
  Plus,
  Coins,
  History,
  X,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import PillTabBar, { PillTab } from "../common/PillTabBar";
import Drawer, { DrawerFooterButtons } from "../common/Drawer";
import { MarkdownTextarea } from "./shared/Markdown";
import { Customer, Order } from "../../types/order.types";
import { Voucher } from "../../types/voucher.types";
import { simActions, CustomerGroup, VoucherRedemption } from "../../lib/supabase/client";
import { toast } from "../../lib/toast";

// Sub-components
import CrmCustomerList from "./crm/CrmCustomerList";
import CrmCustomerDrawer from "./crm/CrmCustomerDrawer";
import CrmVehicleModal from "./crm/CrmVehicleModal";
import CrmVoucherManagement from "./crm/CrmVoucherManagement";
import CrmCustomerGroups from "./crm/CrmCustomerGroups";
import CrmSupConfig from "./crm/CrmSupConfig";
import CrmRfmAnalysis, { RfmSegment } from "./crm/CrmRfmAnalysis";
import CrmRetentionDashboard from "./crm/CrmRetentionDashboard";

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
  proposerId: string;
  proposerName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const CRM_TABS: readonly PillTab[] = [
  { id: "customers", label: "Danh sách hội viên", icon: Users },
  { id: "vouchers", label: "Quản lý Voucher", icon: Gift },
  { id: "groups", label: "Nhóm khách hàng", icon: Compass },
  { id: "sup_config", label: "Quy đổi điểm SUP", icon: Award },
  { id: "rfm", label: "Phân tích RFM", icon: BarChart3 },
  { id: "retention", label: "Tỷ lệ giữ chân", icon: TrendingUp }
];

export default function CrmModule({
  customers: initialCustomers,
  vouchers: initialVouchers,
  orders: initialOrders = []
}: CrmModuleProps) {
  // Active sub-tab
  const [activeTab, setActiveTab] = useState<string>("customers");

  // Role: Master Admin vs Quản lý vận hành (Manager)
  const [currentRole, setCurrentRole] = useState<"master_admin" | "manager">("master_admin");
  const isMasterAdmin = currentRole === "master_admin";

  // Core data states
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers || []);
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [ledger, setLedger] = useState<SupLedgerRow[]>([]);
  const [proposals, setProposals] = useState<PointProposal[]>([]);

  // Selected customer for detail drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // Modals & Drawers state
  const [showCustomerFormModal, setShowCustomerFormModal] = useState(false);
  const [customerFormMode, setCustomerFormMode] = useState<"add" | "edit">("add");
  const [editingCustomerTarget, setEditingCustomerTarget] = useState<Customer | null>(null);

  // Customer Form fields
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cDob, setCDob] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cInitialPlate, setCInitialPlate] = useState("");
  const [cInitialVehicleClass, setCInitialVehicleClass] = useState<"sedan" | "suv" | "truck">("sedan");
  const [cInitialBrand, setCInitialBrand] = useState("");
  const [cInitialModel, setCInitialModel] = useState("");

  // Vehicle Modal state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicleTarget, setEditingVehicleTarget] = useState<{
    plate: string;
    vehicleClass: "sedan" | "suv" | "truck";
    car_brand?: string;
    car_model?: string;
  } | null>(null);

  // Direct Points Adjustment Modal (Master Admin)
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsTargetCustomer, setPointsTargetCustomer] = useState<Customer | null>(null);
  const [pointsDir, setPointsDir] = useState<"add" | "sub">("add");
  const [pointsChange, setPointsChange] = useState<string>("");
  const [pointsReason, setPointsReason] = useState<string>("");

  // Point Adjustment Proposal Modal (Manager)
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalTargetCustomer, setProposalTargetCustomer] = useState<Customer | null>(null);
  const [propDir, setPropDir] = useState<"add" | "sub">("add");
  const [propPoints, setPropPoints] = useState<string>("");
  const [propReason, setPropReason] = useState<string>("");

  // Points Ledger Modal
  const [showPointsHistoryModal, setShowPointsHistoryModal] = useState(false);
  const [historyTargetCustomer, setHistoryTargetCustomer] = useState<Customer | null>(null);

  // Emergency Compensation Modal
  const [showEmergencyCompensationModal, setShowEmergencyCompensationModal] = useState(false);
  const [emergencyTargetCustomer, setEmergencyTargetCustomer] = useState<Customer | null>(null);
  const [compPoints, setCompPoints] = useState<string>("50");
  const [compVoucherPercent, setCompVoucherPercent] = useState<string>("20");
  const [compReason, setCompReason] = useState<string>("");

  // Manual Grant Voucher Modal
  const [showManualGrantModal, setShowManualGrantModal] = useState(false);
  const [grantTargetCustomer, setGrantTargetCustomer] = useState<Customer | null>(null);
  const [grantVoucherType, setGrantVoucherType] = useState<"percent" | "fixed_amount" | "free_service">("percent");
  const [grantVoucherValue, setGrantVoucherValue] = useState<string>("15");
  const [grantVoucherReason, setGrantVoucherReason] = useState<string>("");

  // Load initial data from simActions and sync
  const syncStateFromSimActions = () => {
    try {
      const state = simActions.getState();
      if (state.customers) setCustomers(state.customers);
      if (state.vouchers) setVouchers(state.vouchers);
      if (state.orders) setOrders(state.orders);
      if (state.customerGroups) setGroups(state.customerGroups);
      if (state.voucherRedemptions) setRedemptions(state.voucherRedemptions);
    } catch (e) {
      console.warn("simActions sync warning:", e);
    }
  };

  useEffect(() => {
    syncStateFromSimActions();

    // Load ledger & proposals from localStorage
    try {
      const savedLedger = localStorage.getItem("wassup_crm_sup_ledger");
      if (savedLedger) {
        setLedger(JSON.parse(savedLedger));
      } else {
        const seedLedger: SupLedgerRow[] = [
          {
            id: "sl-001",
            customerId: "c1",
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            type: "auto_gain",
            typeLabel: "Tích điểm tự động",
            pointsChanged: 25,
            balanceAfter: 125,
            reason: "Tích điểm đơn chăm sóc xe W2"
          },
          {
            id: "sl-002",
            customerId: "c1",
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            type: "redeem",
            typeLabel: "Đổi điểm sang voucher",
            pointsChanged: -25,
            balanceAfter: 100,
            reason: "Đổi 25 điểm lấy voucher giảm 10%"
          }
        ];
        setLedger(seedLedger);
        localStorage.setItem("wassup_crm_sup_ledger", JSON.stringify(seedLedger));
      }

      const savedProposals = localStorage.getItem("wassup_crm_proposals");
      if (savedProposals) {
        setProposals(JSON.parse(savedProposals));
      }
    } catch (e) {
      console.warn("Ledger loading error:", e);
    }
  }, []);

  // Customer registration / edit submission
  const handleOpenCustomerForm = (c?: Customer) => {
    if (c) {
      setCustomerFormMode("edit");
      setEditingCustomerTarget(c);
      setCName(c.name);
      setCPhone(c.phone);
      setCDob(c.dob || "");
      setCAddress(c.address || "");
    } else {
      setCustomerFormMode("add");
      setEditingCustomerTarget(null);
      setCName("");
      setCPhone("");
      setCDob("");
      setCAddress("");
      setCInitialPlate("");
      setCInitialVehicleClass("sedan");
      setCInitialBrand("");
      setCInitialModel("");
    }
    setShowCustomerFormModal(true);
  };

  const handleSaveCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) {
      toast.error("THIẾU THÔNG TIN ❌", "Vui lòng nhập họ tên và số điện thoại.");
      return;
    }

    if (customerFormMode === "add") {
      const cleanPlate = cInitialPlate.toUpperCase().trim();
      const initialVehicles = cleanPlate
        ? [
            {
              plate: cleanPlate,
              vehicleClass: cInitialVehicleClass,
              car_brand: cInitialBrand.trim() || undefined,
              car_model: cInitialModel.trim() || undefined
            }
          ]
        : [];

      const newCustomer: Partial<Customer> = {
        id: `c_${Date.now()}`,
        name: cName.trim(),
        phone: cPhone.trim(),
        dob: cDob || undefined,
        address: cAddress.trim() || undefined,
        points: 0,
        createdAt: new Date().toISOString(),
        vehicles: initialVehicles,
        licensePlates: cleanPlate ? [cleanPlate] : [],
        licensePlate: cleanPlate || undefined
      };

      simActions.addCustomer(newCustomer as Customer);
      syncStateFromSimActions();
      toast.success("ĐĂNG KÝ THÀNH CÔNG 👤", `Đã tạo hồ sơ hội viên mới: ${cName}`);
    } else if (editingCustomerTarget) {
      const updated = {
        ...editingCustomerTarget,
        name: cName.trim(),
        phone: cPhone.trim(),
        dob: cDob || undefined,
        address: cAddress.trim() || undefined
      };

      simActions.updateCustomer(updated);
      syncStateFromSimActions();
      toast.success("CẬP NHẬT HỒ SƠ 👤", `Đã lưu thông tin hội viên ${cName}`);
    }

    setShowCustomerFormModal(false);
  };

  // Vehicle saving handler
  const handleSaveVehiclesForSelectedCustomer = (
    updatedVehicles: { plate: string; vehicleClass: "sedan" | "suv" | "truck"; car_brand?: string; car_model?: string }[]
  ) => {
    if (!selectedCustomer) return;
    const plates = updatedVehicles.map((v) => v.plate);
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      vehicles: updatedVehicles,
      licensePlates: plates,
      licensePlate: plates[0] || undefined
    };

    simActions.updateCustomer(updatedCustomer);
    syncStateFromSimActions();
  };

  const handleDeleteVehicle = (plateToDelete: string) => {
    if (!selectedCustomer) return;
    const currentVehicles = selectedCustomer.vehicles || [];
    const remaining = currentVehicles.filter((v) => v.plate.toUpperCase() !== plateToDelete.toUpperCase());
    handleSaveVehiclesForSelectedCustomer(remaining);
    toast.success("ĐÃ XÓA XE 🚗", `Đã gỡ phương tiện ${plateToDelete} khỏi hồ sơ.`);
  };

  // Toggle static customer group membership (US-4.11 / FR-4.5b)
  const handleToggleStaticGroup = (groupId: string, customerId: string, isMember: boolean) => {
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    let updatedIds = targetGroup.customer_ids || [];
    if (isMember) {
      if (!updatedIds.includes(customerId)) {
        updatedIds = [...updatedIds, customerId];
      }
    } else {
      updatedIds = updatedIds.filter((id) => id !== customerId);
    }

    const updatedGroup = { ...targetGroup, customer_ids: updatedIds };
    simActions.updateCustomerGroup(updatedGroup);
    syncStateFromSimActions();
    toast.success(
      isMember ? "ĐÃ THÊM VÀO NHÓM 🏷️" : "ĐÃ GỠ KHỎI NHÓM 🏷️",
      `${isMember ? "Đã thêm" : "Đã gỡ"} hội viên vào nhóm ${targetGroup.name}.`
    );
  };

  // Direct points adjustment by Master Admin
  const handleDirectAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsTargetCustomer) return;
    const delta = Number(pointsChange);
    if (isNaN(delta) || delta <= 0) {
      toast.error("SỐ ĐIỂM KHÔNG HỢP LỆ ❌", "Vui lòng nhập số điểm lớn hơn 0.");
      return;
    }
    if (!pointsReason.trim()) {
      toast.error("THIẾU LÝ DO ĐIỀU CHỈNH ❌", "Vui lòng nhập lý do để ghi nhận kiểm toán.");
      return;
    }

    const finalDelta = pointsDir === "add" ? delta : -delta;
    const currentPts = pointsTargetCustomer.points || 0;
    const newBalance = Math.max(0, currentPts + finalDelta);

    const updatedCust: Customer = {
      ...pointsTargetCustomer,
      points: newBalance
    };
    simActions.updateCustomer(updatedCust);

    // Record to ledger
    const ledgerRow: SupLedgerRow = {
      id: `sl-${Date.now()}`,
      customerId: pointsTargetCustomer.id,
      date: new Date().toISOString(),
      type: "manual_adjust",
      typeLabel: pointsDir === "add" ? "Chỉnh cộng (Admin)" : "Chỉnh trừ (Admin)",
      pointsChanged: finalDelta,
      balanceAfter: newBalance,
      reason: pointsReason.trim()
    };
    const updatedLedger = [ledgerRow, ...ledger];
    setLedger(updatedLedger);
    localStorage.setItem("wassup_crm_sup_ledger", JSON.stringify(updatedLedger));

    syncStateFromSimActions();
    setShowPointsModal(false);
    setPointsChange("");
    setPointsReason("");
    toast.success("ĐIỀU CHỈNH ĐIỂM THÀNH CÔNG 🪙", `Số dư mới của ${pointsTargetCustomer.name}: ${newBalance} SUP`);
  };

  // Propose points adjustment by Manager
  const handleProposePointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTargetCustomer) return;
    const delta = Number(propPoints);
    if (isNaN(delta) || delta <= 0) {
      toast.error("SỐ ĐIỂM KHÔNG HỢP LỆ ❌", "Vui lòng nhập số điểm lớn hơn 0.");
      return;
    }
    if (!propReason.trim()) {
      toast.error("THIẾU LÝ DO ĐỀ XUẤT ❌", "Vui lòng nêu rõ lý do đề xuất.");
      return;
    }

    const finalDelta = propDir === "add" ? delta : -delta;
    const newProp: PointProposal = {
      id: `prop-${Date.now()}`,
      customerId: proposalTargetCustomer.id,
      customerName: proposalTargetCustomer.name,
      pointsChanged: finalDelta,
      reason: propReason.trim(),
      proposerId: "mgr-01",
      proposerName: "Quản lý Ca Trực",
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const updated = [newProp, ...proposals];
    setProposals(updated);
    localStorage.setItem("wassup_crm_proposals", JSON.stringify(updated));

    setShowProposalModal(false);
    setPropPoints("");
    setPropReason("");
    toast.success("ĐÃ GỬI ĐỀ XUẤT 📩", `Yêu cầu điều chỉnh điểm cho ${proposalTargetCustomer.name} đã được chuyển tới Master Admin.`);
  };

  // Approve proposal (Master Admin)
  const handleApproveProposal = (p: PointProposal) => {
    const cust = customers.find((c) => c.id === p.customerId);
    if (!cust) {
      toast.error("LỖI ❌", "Không tìm thấy khách hàng.");
      return;
    }

    const newBalance = Math.max(0, (cust.points || 0) + p.pointsChanged);
    const updatedCust = { ...cust, points: newBalance };
    simActions.updateCustomer(updatedCust);

    // Add to ledger
    const ledgerRow: SupLedgerRow = {
      id: `sl-${Date.now()}`,
      customerId: cust.id,
      date: new Date().toISOString(),
      type: "manual_adjust",
      typeLabel: "Duyệt đề xuất điểm",
      pointsChanged: p.pointsChanged,
      balanceAfter: newBalance,
      reason: `Duyệt đề xuất từ ${p.proposerName}: ${p.reason}`
    };
    const updatedLedger = [ledgerRow, ...ledger];
    setLedger(updatedLedger);
    localStorage.setItem("wassup_crm_sup_ledger", JSON.stringify(updatedLedger));

    // Update proposal status
    const updatedProps = proposals.map((x) => (x.id === p.id ? { ...x, status: "approved" as const } : x));
    setProposals(updatedProps);
    localStorage.setItem("wassup_crm_proposals", JSON.stringify(updatedProps));

    syncStateFromSimActions();
    toast.success("ĐÃ PHÊ DUYỆT ĐỀ XUẤT ✅", `Đã cập nhật ${p.pointsChanged >= 0 ? "+" : ""}${p.pointsChanged} SUP cho ${cust.name}.`);
  };

  // Reject proposal (Master Admin)
  const handleRejectProposal = (p: PointProposal) => {
    const updatedProps = proposals.map((x) => (x.id === p.id ? { ...x, status: "rejected" as const } : x));
    setProposals(updatedProps);
    localStorage.setItem("wassup_crm_proposals", JSON.stringify(updatedProps));
    toast.info("ĐÃ TỪ CHỐI ĐỀ XUẤT ⛔", `Đề xuất điều chỉnh điểm của ${p.customerName} đã bị từ chối.`);
  };

  // Emergency compensation submission
  const handleEmergencyCompensationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyTargetCustomer) return;
    const addPts = Number(compPoints) || 0;
    const discountPct = Number(compVoucherPercent) || 0;

    if (!compReason.trim()) {
      toast.error("THIẾU LÝ DO BỒI HOÀN ❌", "Vui lòng mô tả sự cố để ghi nhận kiểm toán bồi hoàn.");
      return;
    }

    // 1. Add compensation points if requested
    if (addPts > 0) {
      const newBal = (emergencyTargetCustomer.points || 0) + addPts;
      simActions.updateCustomer({
        ...emergencyTargetCustomer,
        points: newBal
      });

      const ledgerRow: SupLedgerRow = {
        id: `sl-${Date.now()}`,
        customerId: emergencyTargetCustomer.id,
        date: new Date().toISOString(),
        type: "compensation",
        typeLabel: "Bồi hoàn khẩn cấp",
        pointsChanged: addPts,
        balanceAfter: newBal,
        reason: `Bồi hoàn sự cố: ${compReason.trim()}`
      };
      const updatedLedger = [ledgerRow, ...ledger];
      setLedger(updatedLedger);
      localStorage.setItem("wassup_crm_sup_ledger", JSON.stringify(updatedLedger));
    }

    // 2. Issue compensation voucher if requested
    if (discountPct > 0) {
      const compVoucher: Voucher = {
        id: `v_comp_${Date.now()}`,
        customerId: emergencyTargetCustomer.id,
        code: `COMP${Date.now().toString().slice(-4)}`,
        name: `Voucher Bồi Hoàn: ${emergencyTargetCustomer.name}`,
        type: "percent",
        value: discountPct,
        minOrderValue: 0,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        source: "compensation",
        createdAt: new Date().toISOString(),
        status: "active",
        target_type: "specific_customers",
        target_specific_customers: [emergencyTargetCustomer.id]
      };
      simActions.addVoucher(compVoucher);
    }

    syncStateFromSimActions();
    setShowEmergencyCompensationModal(false);
    setCompReason("");
    toast.success("ĐÃ PHÁT HÀNH BỒI HOÀN 🎁", `Đã đền bù ${addPts} điểm SUP và voucher giảm ${discountPct}% cho ${emergencyTargetCustomer.name}.`);
  };

  // Manual grant voucher submission
  const handleGrantPersonalVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTargetCustomer) return;
    const val = Number(grantVoucherValue) || 0;
    if (val <= 0 && grantVoucherType !== "free_service") {
      toast.error("GIÁ TRỊ KHÔNG HỢP LỆ ❌", "Vui lòng nhập giá trị ưu đãi lớn hơn 0.");
      return;
    }

    const newV: Voucher = {
      id: `v_grant_${Date.now()}`,
      customerId: grantTargetCustomer.id,
      code: `VIP${grantTargetCustomer.name.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`,
      name: grantVoucherReason.trim() || `Ưu đãi đặc cách - ${grantTargetCustomer.name}`,
      type: grantVoucherType,
      value: val,
      minOrderValue: 0,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
      source: "manual_grant",
      createdAt: new Date().toISOString(),
      status: "active",
      target_type: "specific_customers",
      target_specific_customers: [grantTargetCustomer.id]
    };

    simActions.addVoucher(newV);
    syncStateFromSimActions();
    setShowManualGrantModal(false);
    setGrantVoucherReason("");
    toast.success("CẤP VOUCHER THÀNH CÔNG 🎁", `Đã gán mã ưu đãi ${newV.code} cho ${grantTargetCustomer.name}.`);
  };

  // Voucher Management Actions
  const handleSaveVoucher = (vData: Partial<Voucher>, isEdit: boolean) => {
    if (isEdit && vData.code) {
      const existing = vouchers.find((v) => v.code === vData.code);
      if (existing) {
        const updated = { ...existing, ...vData };
        simActions.updateVoucher(updated as Voucher);
        syncStateFromSimActions();
        toast.success("CẬP NHẬT VOUCHER THÀNH CÔNG 🎁", `Chiến dịch ${vData.code} đã được lưu.`);
        return;
      }
    }

    const newV: Voucher = {
      id: `v_${Date.now()}`,
      customerId: "",
      code: vData.code || `VOUCHER${Date.now()}`,
      name: vData.name || "Chiến dịch mới",
      type: vData.type || "percent",
      value: vData.value || 0,
      maxDiscount: vData.maxDiscount,
      minOrderValue: vData.minOrderValue || 0,
      validFrom: vData.validFrom || new Date().toISOString().slice(0, 10),
      validTo: vData.validTo || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      source: "manual",
      createdAt: new Date().toISOString(),
      status: "active",
      usage_limit_total: vData.usage_limit_total,
      usage_limit_per_customer: vData.usage_limit_per_customer || 1,
      target_type: vData.target_type || "all_customers",
      target_group_id: vData.target_group_id,
      target_specific_customers: vData.target_specific_customers,
      applicable_vehicle_classes: vData.applicable_vehicle_classes,
      schedule_restriction: vData.schedule_restriction
    };

    simActions.addVoucher(newV);
    syncStateFromSimActions();
    toast.success("TẠO VOUCHER THÀNH CÔNG 🎁", `Chiến dịch ${newV.code} đã được kích hoạt.`);
  };

  const handleToggleVoucherStatus = (v: Voucher) => {
    const nextStatus = v.status === "paused" ? "active" : "paused";
    const updated = { ...v, status: nextStatus as any };
    simActions.updateVoucher(updated);
    syncStateFromSimActions();
    toast.info(
      nextStatus === "active" ? "ĐÃ KÍCH HOẠT VOUCHER ▶️" : "ĐÃ TẠM DỪNG VOUCHER ⏸️",
      `Mã ${v.code} hiện ở trạng thái: ${nextStatus === "active" ? "Hoạt động" : "Tạm dừng"}.`
    );
  };

  const handleDeleteVoucher = (vId: string) => {
    const updated = vouchers.filter((v) => v.id !== vId);
    setVouchers(updated);
    // Sync state
    try {
      const st = simActions.getState();
      st.vouchers = updated;
      localStorage.setItem("wassup_pos_state", JSON.stringify(st));
    } catch (e) {
      console.warn("delete voucher sync error:", e);
    }
    toast.success("ĐÃ XÓA VOUCHER 🗑️", "Chiến dịch khuyến mãi đã được gỡ khỏi hệ thống.");
  };

  // Group Management Actions
  const handleSaveGroup = (gData: Partial<CustomerGroup>, isEdit: boolean) => {
    if (isEdit && gData.id) {
      const existing = groups.find((g) => g.id === gData.id);
      if (existing) {
        const updated: CustomerGroup = {
          ...existing,
          name: gData.name || existing.name,
          type: gData.type || existing.type,
          customer_ids: gData.type === "static" ? (gData.customer_ids || []) : [],
          condition: gData.type === "dynamic" ? gData.condition : undefined
        };
        simActions.updateCustomerGroup(updated);
        syncStateFromSimActions();
        toast.success("CẬP NHẬT NHÓM THÀNH CÔNG 🏷️", `Nhóm ${updated.name} đã được cập nhật.`);
        return;
      }
    }

    const newG: CustomerGroup = {
      id: `cg_${Date.now()}`,
      name: gData.name || "Nhóm mới",
      type: gData.type || "static",
      customer_ids: gData.type === "static" ? (gData.customer_ids || []) : [],
      condition: gData.type === "dynamic" ? gData.condition : undefined,
      created_at: new Date().toISOString()
    };

    simActions.addCustomerGroup(newG);
    syncStateFromSimActions();
    toast.success("TẠO NHÓM THÀNH CÔNG 🏷️", `Nhóm ${newG.name} đã được khởi tạo.`);
  };

  const handleDeleteGroup = (gId: string) => {
    simActions.deleteCustomerGroup(gId);
    syncStateFromSimActions();
    toast.success("ĐÃ XÓA NHÓM 🗑️", "Nhóm khách hàng đã được gỡ bỏ.");
  };

  // Win-back campaign from RFM
  const handleOpenCreateVoucherForSegment = (segment: RfmSegment, customerIds: string[]) => {
    setActiveTab("vouchers");
    toast.info("CHIẾN DỊCH WIN-BACK 🎯", `Đã chuyển sang tab Voucher. Vui lòng bấm Tạo Voucher và chọn đối tượng "Chỉ định thủ công" (${customerIds.length} khách).`);
  };

  return (
    <div className="space-y-4 text-left font-sans" id="crm-module-root">
      {/* TOP BAR: MODULE HEADER & ROLE SWITCHER */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3" id="crm-header-bar">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-green/15 text-forest-green rounded-xl">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black font-display uppercase tracking-wider text-matte-black">
                MODULE 4: QUẢN TRỊ QUAN HỆ KHÁCH HÀNG (CRM)
              </h2>
              <p className="text-[11px] text-mid-gray font-sans mt-0.5">
                Quản lý hồ sơ hội viên, phương tiện liên kết, tích lũy điểm SUP, chiến dịch voucher và phân tích giữ chân.
              </p>
            </div>
          </div>
        </div>

        {/* ROLE SWITCHER */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200" id="crm-role-switcher">
          <button
            type="button"
            onClick={() => setCurrentRole("master_admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase transition cursor-pointer flex items-center gap-1.5 ${
              isMasterAdmin
                ? "bg-matte-black text-white shadow-xs"
                : "text-stone-600 hover:text-matte-black hover:bg-stone-200/60"
            }`}
          >
            <Shield className={`h-3.5 w-3.5 ${isMasterAdmin ? "text-[#A2C62C]" : "text-stone-400"}`} />
            Master Admin
          </button>

          <button
            type="button"
            onClick={() => setCurrentRole("manager")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase transition cursor-pointer flex items-center gap-1.5 ${
              !isMasterAdmin
                ? "bg-matte-black text-white shadow-xs"
                : "text-stone-600 hover:text-matte-black hover:bg-stone-200/60"
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${!isMasterAdmin ? "text-blue-400" : "text-stone-400"}`} />
            Quản lý vận hành
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION (USING PILLTABBAR) */}
      <PillTabBar
        tabs={CRM_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id)}
      />

      {/* ACTIVE SUB-TAB CONTENT */}
      {activeTab === "customers" && (
        <CrmCustomerList
          customers={customers}
          orders={orders}
          groups={groups}
          isMasterAdmin={isMasterAdmin}
          proposals={proposals}
          onOpenCustomerModal={handleOpenCustomerForm}
          onSelectCustomer={(c) => setSelectedCustomerId(c.id)}
          onApproveProposal={handleApproveProposal}
          onRejectProposal={handleRejectProposal}
        />
      )}

      {activeTab === "vouchers" && (
        <CrmVoucherManagement
          vouchers={vouchers}
          customers={customers}
          orders={orders}
          groups={groups}
          redemptions={redemptions}
          isMasterAdmin={isMasterAdmin}
          onSaveVoucher={handleSaveVoucher}
          onToggleVoucherStatus={handleToggleVoucherStatus}
          onDeleteVoucher={handleDeleteVoucher}
        />
      )}

      {activeTab === "groups" && (
        <CrmCustomerGroups
          groups={groups}
          customers={customers}
          orders={orders}
          vouchers={vouchers}
          isMasterAdmin={isMasterAdmin}
          onSaveGroup={handleSaveGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      {activeTab === "sup_config" && (
        <CrmSupConfig isMasterAdmin={isMasterAdmin} />
      )}

      {activeTab === "rfm" && (
        <CrmRfmAnalysis
          customers={customers}
          orders={orders}
          onSelectCustomer={(c) => setSelectedCustomerId(c.id)}
          onOpenCreateVoucherForSegment={handleOpenCreateVoucherForSegment}
        />
      )}

      {activeTab === "retention" && (
        <CrmRetentionDashboard
          customers={customers}
          orders={orders}
        />
      )}

      {/* DRAWER: CUSTOMER DETAIL & PROFILES */}
      <CrmCustomerDrawer
        open={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        customer={selectedCustomer}
        orders={orders}
        vouchers={vouchers}
        groups={groups}
        isMasterAdmin={isMasterAdmin}
        onEditCustomer={(c) => {
          handleOpenCustomerForm(c);
        }}
        onOpenVehicleModal={(v) => {
          setEditingVehicleTarget(v);
          setShowVehicleModal(true);
        }}
        onDeleteVehicle={handleDeleteVehicle}
        onOpenPointsModal={(c) => {
          setPointsTargetCustomer(c);
          setPointsDir("add");
          setPointsChange("");
          setPointsReason("");
          setShowPointsModal(true);
        }}
        onOpenProposalModal={(c) => {
          setProposalTargetCustomer(c);
          setPropDir("add");
          setPropPoints("");
          setPropReason("");
          setShowProposalModal(true);
        }}
        onOpenPointsHistory={(c) => {
          setHistoryTargetCustomer(c);
          setShowPointsHistoryModal(true);
        }}
        onOpenEmergencyCompensation={(c) => {
          setEmergencyTargetCustomer(c);
          setCompPoints("50");
          setCompVoucherPercent("20");
          setCompReason("");
          setShowEmergencyCompensationModal(true);
        }}
        onOpenManualGrantVoucher={(c) => {
          setGrantTargetCustomer(c);
          setGrantVoucherType("percent");
          setGrantVoucherValue("15");
          setGrantVoucherReason("");
          setShowManualGrantModal(true);
        }}
        onToggleStaticGroup={handleToggleStaticGroup}
      />

      {/* DRAWER: VEHICLE ADD / EDIT MODAL */}
      <CrmVehicleModal
        open={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        customer={selectedCustomer}
        vehicle={editingVehicleTarget}
        orders={orders}
        onSaveVehicle={handleSaveVehiclesForSelectedCustomer}
      />

      {/* DRAWER: CUSTOMER REGISTRATION / EDIT MODAL */}
      <Drawer
        open={showCustomerFormModal}
        onClose={() => setShowCustomerFormModal(false)}
        title={customerFormMode === "add" ? "ĐĂNG KÝ HỘI VIÊN MỚI" : "CẬP NHẬT HỒ SƠ HỘI VIÊN"}
        subtitle="Hồ sơ định danh khách hàng duy nhất bằng số điện thoại di động"
        icon={UserCheck}
        widthClass="max-w-lg"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowCustomerFormModal(false)}
            cancelLabel="Hủy"
            onSubmit={handleSaveCustomerSubmit as any}
            submitLabel={customerFormMode === "add" ? "XÁC NHẬN ĐĂNG KÝ" : "LƯU HỒ SƠ"}
            submitVariant="primary"
          />
        }
      >
        <form onSubmit={handleSaveCustomerSubmit} className="space-y-4 text-left font-sans" id="crm-customer-form">
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
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Số điện thoại di động *
            </label>
            <input
              type="tel"
              required
              placeholder="Ví dụ: 0901234567..."
              value={cPhone}
              onChange={(e) => setCPhone(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green font-bold"
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
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Địa chỉ liên lạc / thường trú
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 123 Đường Láng, Đống Đa, Hà Nội..."
              value={cAddress}
              onChange={(e) => setCAddress(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
            />
          </div>

          {customerFormMode === "add" && (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <span className="text-[10px] font-black text-mid-gray uppercase block">
                Phương tiện liên kết ban đầu (Tùy chọn)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Biển số xe</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 30A-999.99..."
                    value={cInitialPlate}
                    onChange={(e) => setCInitialPlate(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Phân hạng xe</label>
                  <select
                    value={cInitialVehicleClass}
                    onChange={(e) => setCInitialVehicleClass(e.target.value as any)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="sedan">Sedan (4-5 chỗ)</option>
                    <option value="suv">SUV / CUV (5-7 chỗ)</option>
                    <option value="truck">Bán tải / Xe tải</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Hãng xe</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Toyota, Honda..."
                    value={cInitialBrand}
                    onChange={(e) => setCInitialBrand(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700">Dòng xe</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Camry, CR-V..."
                    value={cInitialModel}
                    onChange={(e) => setCInitialModel(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </Drawer>

      {/* DRAWER: DIRECT POINTS ADJUSTMENT (MASTER ADMIN) */}
      <Drawer
        open={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        title="ĐIỀU CHỈNH ĐIỂM SUP TRỰC TIẾP"
        subtitle={pointsTargetCustomer ? `Khách hàng: ${pointsTargetCustomer.name} (${pointsTargetCustomer.phone})` : undefined}
        icon={Shield}
        widthClass="max-w-md"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowPointsModal(false)}
            cancelLabel="Hủy"
            onSubmit={handleDirectAdjustPoints as any}
            submitLabel="XÁC NHẬN ĐIỀU CHỈNH"
            submitVariant="primary"
          />
        }
      >
        <form onSubmit={handleDirectAdjustPoints} className="space-y-4 text-left font-sans">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-900 leading-relaxed">
            Quyền Master Admin: Trực tiếp thay đổi số dư điểm SUP. Hành động này sẽ tự động ghi vết kiểm toán vào SUP Ledger.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Hướng điều chỉnh
              </label>
              <select
                value={pointsDir}
                onChange={(e) => setPointsDir(e.target.value as any)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-bold text-matte-black"
              >
                <option value="add">Cộng điểm (+)</option>
                <option value="sub">Trừ điểm (-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Số điểm SUP *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ví dụ: 50..."
                value={pointsChange}
                onChange={(e) => setPointsChange(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-bold text-matte-black"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Lý do điều chỉnh *
            </label>
            <MarkdownTextarea
              id="points-direct-reason"
              placeholder="Ghi rõ lý do điều chỉnh để phục vụ kiểm toán nội bộ..."
              value={pointsReason}
              onChange={(val) => setPointsReason(val)}
              rows={3}
            />
          </div>
        </form>
      </Drawer>

      {/* DRAWER: PROPOSE POINTS (MANAGER) */}
      <Drawer
        open={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        title="ĐỀ XUẤT ĐIỀU CHỈNH ĐIỂM SUP"
        subtitle={proposalTargetCustomer ? `Khách hàng: ${proposalTargetCustomer.name}` : undefined}
        icon={Clock}
        widthClass="max-w-md"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowProposalModal(false)}
            cancelLabel="Hủy"
            onSubmit={handleProposePointsSubmit as any}
            submitLabel="GỬI ĐỀ XUẤT DUYỆT"
            submitVariant="primary"
          />
        }
      >
        <form onSubmit={handleProposePointsSubmit} className="space-y-4 text-left font-sans">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            Bạn đang tạo đề xuất thay đổi điểm SUP. Yêu cầu này sẽ được gửi tới Master Admin để phê duyệt trước khi cộng/trừ vào tài khoản khách hàng.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Hướng đề xuất
              </label>
              <select
                value={propDir}
                onChange={(e) => setPropDir(e.target.value as any)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-bold text-matte-black"
              >
                <option value="add">Cộng điểm (+)</option>
                <option value="sub">Trừ điểm (-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Số điểm đề xuất *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ví dụ: 30..."
                value={propPoints}
                onChange={(e) => setPropPoints(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-bold text-matte-black"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Lý do chi tiết *
            </label>
            <MarkdownTextarea
              id="prop-points-reason"
              placeholder="Mô tả sự việc: Đăng ký bù cho khách, sự cố thi công ca sáng..."
              value={propReason}
              onChange={(val) => setPropReason(val)}
              rows={3}
            />
          </div>
        </form>
      </Drawer>

      {/* DRAWER: POINTS HISTORY (SUP LEDGER) */}
      <Drawer
        open={showPointsHistoryModal}
        onClose={() => setShowPointsHistoryModal(false)}
        title="LỊCH SỬ BIẾN ĐỘNG ĐIỂM SUP"
        subtitle={historyTargetCustomer ? `Hội viên: ${historyTargetCustomer.name} (${historyTargetCustomer.phone})` : undefined}
        icon={History}
        widthClass="max-w-2xl"
        footer={
          <div className="flex justify-end w-full">
            <button
              type="button"
              onClick={() => setShowPointsHistoryModal(false)}
              className="px-6 py-2.5 rounded-xl bg-matte-black text-white font-extrabold text-xs uppercase cursor-pointer"
            >
              Đóng lịch sử
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-left font-sans">
          <div className="border border-[#e5e5e5] rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                  <th className="p-2.5 pl-4">Thời gian</th>
                  <th className="p-2.5">Loại giao dịch</th>
                  <th className="p-2.5 text-center">Biến động</th>
                  <th className="p-2.5 text-center">Số dư mới</th>
                  <th className="p-2.5 pr-4">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(() => {
                  const customerLedger = ledger.filter(
                    (l) => historyTargetCustomer && l.customerId === historyTargetCustomer.id
                  );
                  if (customerLedger.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-stone-400 italic">
                          Chưa có lịch sử giao dịch điểm tích lũy nào.
                        </td>
                      </tr>
                    );
                  }
                  return customerLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-2.5 pl-4 text-slate-500 text-[11px]">
                        {new Date(row.date).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="p-2.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-slate-800">
                          {row.typeLabel}
                        </span>
                      </td>
                      <td className={`p-2.5 text-center font-black ${row.pointsChanged >= 0 ? "text-forest-green" : "text-red-500"}`}>
                        {row.pointsChanged >= 0 ? `+${row.pointsChanged}` : row.pointsChanged}
                      </td>
                      <td className="p-2.5 text-center font-black text-slate-800">
                        {row.balanceAfter} SUP
                      </td>
                      <td className="p-2.5 pr-4 text-slate-600 max-w-xs truncate" title={row.reason}>
                        {row.reason}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </Drawer>

      {/* DRAWER: EMERGENCY COMPENSATION DESK */}
      <Drawer
        open={showEmergencyCompensationModal}
        onClose={() => setShowEmergencyCompensationModal(false)}
        title="BÀN XỬ LÝ KHIẾU NẠI & BỒI HOÀN KHẨN CẤP"
        subtitle={emergencyTargetCustomer ? `Khách hàng tiếp nhận: ${emergencyTargetCustomer.name}` : undefined}
        icon={AlertTriangle}
        widthClass="max-w-md"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowEmergencyCompensationModal(false)}
            cancelLabel="Hủy"
            onSubmit={handleEmergencyCompensationSubmit as any}
            submitLabel="PHÁT HÀNH BỒI HOÀN"
            submitVariant="destructive"
          />
        }
      >
        <form onSubmit={handleEmergencyCompensationSubmit} className="space-y-4 text-left font-sans">
          <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-900 leading-relaxed">
            Nghiệp vụ bồi hoàn đặc cách: Dùng khi có sự cố dịch vụ (làm bẩn xe, chậm trễ bàn giao, sai sót thao tác). Hệ thống sẽ cấp điểm SUP và voucher giảm giá trực tiếp cho khách hàng.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Điểm SUP đền bù
              </label>
              <input
                type="number"
                min="0"
                value={compPoints}
                onChange={(e) => setCompPoints(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Voucher giảm giá (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={compVoucherPercent}
                onChange={(e) => setCompVoucherPercent(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Mô tả chi tiết sự cố *
            </label>
            <MarkdownTextarea
              id="emergency-comp-reason"
              placeholder="Ghi rõ nguyên nhân sự cố: Khách chờ quá 45 phút, xước nhẹ lazang đã xử lý..."
              value={compReason}
              onChange={(val) => setCompReason(val)}
              rows={3}
            />
          </div>
        </form>
      </Drawer>

      {/* DRAWER: GRANT MANUAL VOUCHER */}
      <Drawer
        open={showManualGrantModal}
        onClose={() => setShowManualGrantModal(false)}
        title="CẤP VOUCHER ĐẶC CÁCH CÁ NHÂN"
        subtitle={grantTargetCustomer ? `Khách hàng nhận: ${grantTargetCustomer.name}` : undefined}
        icon={Gift}
        widthClass="max-w-md"
        footer={
          <DrawerFooterButtons
            onCancel={() => setShowManualGrantModal(false)}
            cancelLabel="Hủy"
            onSubmit={handleGrantPersonalVoucher as any}
            submitLabel="CẤP VOUCHER CHO KHÁCH"
            submitVariant="primary"
          />
        }
      >
        <form onSubmit={handleGrantPersonalVoucher} className="space-y-4 text-left font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Loại ưu đãi
              </label>
              <select
                value={grantVoucherType}
                onChange={(e) => setGrantVoucherType(e.target.value as any)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="percent">Giảm phần trăm (%)</option>
                <option value="fixed_amount">Giảm tiền mặt (đ)</option>
                <option value="free_service">Miễn phí dịch vụ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                Giá trị ưu đãi *
              </label>
              <input
                type="number"
                disabled={grantVoucherType === "free_service"}
                placeholder={grantVoucherType === "percent" ? "15 (%)" : "50000 (đ)"}
                value={grantVoucherType === "free_service" ? "" : grantVoucherValue}
                onChange={(e) => setGrantVoucherValue(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold text-matte-black disabled:bg-stone-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
              Lý do hoặc Tên chương trình ưu đãi
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Tri ân khách hàng đặc cách tháng 8..."
              value={grantVoucherReason}
              onChange={(e) => setGrantVoucherReason(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
