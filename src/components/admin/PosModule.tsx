import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CreditCard,
  DollarSign,
  QrCode,
  ShieldAlert,
  XCircle,
  FileSpreadsheet,
  Check,
  Percent,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  Coins,
  Search,
  FileText,
  Printer,
  Download,
  User,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle,
  X,
  ChevronRight,
  RefreshCw,
  Wallet,
  Calendar,
  Building,
  CheckCircle2,
  ListFilter,
  Zap,
  TrendingUp,
  UserCheck,
  Info,
  Settings,
  Plus,
  ClipboardList,
  TrendingDown
} from "lucide-react";
import { OrderStatusView } from "../../types/workOrder.types";
import { simActions } from "../../lib/supabase/client";
import { exportPosModuleToHtml } from "../../utils/exportPosHtml";
import { Voucher } from "../../types/voucher.types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface PosModuleProps {
  orders: OrderStatusView[];
  revenueStats: any;
}

interface ShiftHistory {
  id: string;
  cashierName: string;
  shiftType: string;
  openTime: string;
  closeTime: string;
  openCash: number;
  expectedCash: number;
  actualCash: number;
  expectedTransfer: number;
  difference: number;
  status: "completed" | "unreconciled";
}

interface ShiftSale {
  orderId: string;
  licensePlate: string;
  total: number;
  discount: number;
  method: "cash" | "bank_transfer" | "card";
  timestamp: string;
}

// Structured models for digital accounting
interface PhieuThu {
  id: string; // PT-XXXXX
  timestamp: string;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  vehicleSegment: 'sedan' | 'suv' | 'truck';
  paymentMethod: "cash" | "bank_transfer" | "card" | "e-wallet";
  notes: string;
  amount: number;
  attachmentUrl?: string;
  createdBy: string;
  orderId?: string;
  costOfChemicals: number; // Simulated COGS
  technicianCommission: number; // Commission paid to tech
  thuType?: "service" | "merchandise" | "prepaid_card" | "deposit" | "insurance" | "other";
}

interface PhieuChi {
  id: string; // PC-XXXXX
  timestamp: string;
  expenseType: "commercial_goods" | "rent" | "utilities" | "technician_commission" | "entertainment" | "other";
  recipient: string;
  amount: number;
  notes: string;
  status: "pending" | "approved" | "completed" | "rejected";
  paymentAccount: "cash_fund" | "bank_fund";
  attachmentUrl?: string;
  createdBy: string;
  approvedBy?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetId: string;
  details: string;
}

export default function PosModule({ orders, revenueStats }: PosModuleProps) {
  // Navigation & Role simulation
  const [activeTab, setActiveTab] = useState<"pos" | "receipts" | "expenses" | "reports" | "audit" | "shifts">("pos");
  const [currentRole, setCurrentRole] = useState<"cashier" | "manager">("manager");

  // Cash register/shift state
  const [isShiftOpen, setIsShiftOpen] = useState(() => {
    const saved = localStorage.getItem("wassup_pos_shift_open");
    return saved !== "false";
  });

  const [openCash, setOpenCash] = useState(() => {
    const saved = localStorage.getItem("wassup_pos_open_cash");
    return saved ? Number(saved) : 2000000;
  });

  const [actualCashInput, setActualCashInput] = useState("");
  const [cashierName, setCashierName] = useState(() => {
    return localStorage.getItem("wassup_pos_cashier") || "Nguyễn Văn Hùng";
  });
  
  const [shiftType, setShiftType] = useState(() => {
    return localStorage.getItem("wassup_pos_shifttype") || "Ca Sáng (07:00 - 15:00)";
  });

  // Shift Sales
  const [shiftSales, setShiftSales] = useState<ShiftSale[]>(() => {
    const saved = localStorage.getItem("wassup_pos_shift_sales");
    return saved ? JSON.parse(saved) : [];
  });

  // Shift Logs
  const [shiftLogs, setShiftLogs] = useState<ShiftHistory[]>(() => {
    const saved = localStorage.getItem("wassup_pos_shift_logs");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "sh-101",
        cashierName: "Trần Thị D (Kế toán)",
        shiftType: "Ca Chiều (15:00 - 23:00)",
        openTime: new Date(Date.now() - 86400000).toISOString(),
        closeTime: new Date(Date.now() - 86400000 + 8 * 3600000).toISOString(),
        openCash: 2000000,
        expectedCash: 8500000,
        actualCash: 8500000,
        expectedTransfer: 12400000,
        difference: 0,
        status: "completed"
      }
    ];
  });

  // --- NEW FINANCIAL DATABASE ---
  const [phieuThuList, setPhieuThuList] = useState<PhieuThu[]>(() => {
    const saved = localStorage.getItem("wassup_phieu_thu_list");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "PT-2026-001",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        customerName: "Trần Minh Quân",
        customerPhone: "0901234567",
        licensePlate: "30A-123.45",
        vehicleSegment: "suv",
        paymentMethod: "bank_transfer",
        notes: "Thu tiền thanh toán gói dịch vụ rửa xe W2 cao cấp",
        amount: 250000,
        createdBy: "Nguyễn Văn Hùng",
        costOfChemicals: 50000,
        technicianCommission: 25000,
        attachmentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=120&q=80",
        thuType: "service"
      },
      {
        id: "PT-2026-002",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        customerName: "Lê Hoàng Long",
        customerPhone: "0988776655",
        licensePlate: "29H-888.88",
        vehicleSegment: "truck",
        paymentMethod: "bank_transfer",
        notes: "Thu tiền cọc gói phủ Ceramic W4 chuyên sâu",
        amount: 1200000,
        createdBy: "Nguyễn Văn Hùng",
        costOfChemicals: 300000,
        technicianCommission: 120000,
        attachmentUrl: "",
        thuType: "deposit"
      },
      {
        id: "PT-2026-003",
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        customerName: "Nguyễn Thị Bích",
        customerPhone: "0911223344",
        licensePlate: "51G-999.99",
        vehicleSegment: "sedan",
        paymentMethod: "cash",
        notes: "Thu tiền dịch vụ rửa xe phổ thông W1",
        amount: 150000,
        createdBy: "Nguyễn Văn Hùng",
        costOfChemicals: 15000,
        technicianCommission: 15000,
        attachmentUrl: "",
        thuType: "service"
      }
    ];
  });

  const [phieuChiList, setPhieuChiList] = useState<PhieuChi[]>(() => {
    const saved = localStorage.getItem("wassup_phieu_chi_list");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "PC-2026-001",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        expenseType: "commercial_goods",
        recipient: "Cty TNHH Sonax Việt Nam",
        amount: 4500000,
        notes: "Chi mua 5 thùng hóa chất rửa xe Sonax đậm đặc",
        status: "completed",
        paymentAccount: "bank_fund",
        createdBy: "Trần Thị D (Kế toán)",
        approvedBy: "Nguyễn Văn Hùng (Quản Lý)",
        attachmentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=120&q=80"
      },
      {
        id: "PC-2026-002",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        expenseType: "technician_commission",
        recipient: "KTV Lê Văn B",
        amount: 240000,
        notes: "Chi hoa hồng thợ cho xe 30A-123.45 và 51G-999.99",
        status: "completed",
        paymentAccount: "cash_fund",
        createdBy: "Trần Thị D (Kế toán)",
        approvedBy: "Nguyễn Văn Hùng (Quản Lý)",
        attachmentUrl: ""
      },
      {
        id: "PC-2026-003",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        expenseType: "utilities",
        recipient: "Công ty Điện lực Hà Nội",
        amount: 3200000,
        notes: "Thanh toán hóa đơn tiền điện và nước tháng 6",
        status: "completed",
        paymentAccount: "bank_fund",
        createdBy: "Trần Thị D (Kế toán)",
        approvedBy: "Nguyễn Văn Hùng (Quản Lý)",
        attachmentUrl: ""
      },
      {
        id: "PC-2026-004",
        timestamp: new Date().toISOString(),
        expenseType: "commercial_goods",
        recipient: "Nhà cung cấp lốp Michelin",
        amount: 1800000,
        notes: "Đề xuất mua bổ sung gạt mưa Michelin để bán lẻ tại quầy",
        status: "pending",
        paymentAccount: "cash_fund",
        createdBy: "Nguyễn Văn Hùng (Thu Ngân)",
        attachmentUrl: ""
      }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("wassup_pos_audit_logs");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "AL-101",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        actor: "Nguyễn Văn Hùng (Thu Ngân)",
        action: "LẬP PHIẾU CHI DỰ THẢO",
        targetId: "PC-2026-004",
        details: "Lập đề xuất chi 1.800.000 VND mua gạt mưa Michelin"
      },
      {
        id: "AL-102",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        actor: "Nguyễn Văn Hùng (Quản Lý)",
        action: "DUYỆT PHIẾU CHI",
        targetId: "PC-2026-003",
        details: "Phê duyệt phiếu chi thanh toán tiền điện nước sản xuất"
      }
    ];
  });

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_payment" | "paid" | "cancelled" | "closed">("all");

  // Vouchers search / creation inside tabs
  const [searchVoucherText, setSearchVoucherText] = useState("");
  const [phieuThuSearch, setPhieuThuSearch] = useState("");
  const [phieuChiSearch, setPhieuChiSearch] = useState("");

  // Create Phiếu forms state
  const [showAddThu, setShowAddThu] = useState(false);
  const [newThuData, setNewThuData] = useState({
    customerName: "",
    customerPhone: "",
    licensePlate: "",
    vehicleSegment: "sedan" as any,
    paymentMethod: "bank_transfer" as any,
    amount: "",
    notes: "",
    attachmentUrl: "",
    thuType: "service" as any
  });

  const [showAddChi, setShowAddChi] = useState(false);
  const [newChiData, setNewChiData] = useState({
    expenseType: "commercial_goods" as any,
    recipient: "",
    amount: "",
    notes: "",
    paymentAccount: "cash_fund" as any,
    attachmentUrl: ""
  });

  // Edit states to prevent deletes
  const [editingThuId, setEditingThuId] = useState<string | null>(null);
  const [editingThuNotes, setEditingThuNotes] = useState("");
  const [editingChiId, setEditingChiId] = useState<string | null>(null);
  const [editingChiNotes, setEditingChiNotes] = useState("");

  // Active payment state
  const [selectedOrder, setSelectedOrder] = useState<OrderStatusView | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "card">("bank_transfer");
  const [cashPaid, setCashPaid] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState("Ưu đãi khách hàng VIP");
  const [isDiscountApproved, setIsDiscountApproved] = useState(false);
  const [showShiftConfig, setShowShiftConfig] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [printedReceipt, setPrintedReceipt] = useState<any>(null);

  // Voucher validation state
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem("wassup_pos_shift_open", String(isShiftOpen));
    localStorage.setItem("wassup_pos_open_cash", String(openCash));
    localStorage.setItem("wassup_pos_cashier", cashierName);
    localStorage.setItem("wassup_pos_shifttype", shiftType);
    localStorage.setItem("wassup_pos_shift_sales", JSON.stringify(shiftSales));
    localStorage.setItem("wassup_pos_shift_logs", JSON.stringify(shiftLogs));
    localStorage.setItem("wassup_phieu_thu_list", JSON.stringify(phieuThuList));
    localStorage.setItem("wassup_phieu_chi_list", JSON.stringify(phieuChiList));
    localStorage.setItem("wassup_pos_audit_logs", JSON.stringify(auditLogs));
  }, [isShiftOpen, openCash, cashierName, shiftType, shiftSales, shiftLogs, phieuThuList, phieuChiList, auditLogs]);

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  // Filter orders based on status & search query
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(searchQuery)) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      o.commerceStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApplyDiscount = (percent: number) => {
    setDiscountPercent(percent);
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    if (percent > 10) {
      setIsDiscountApproved(false);
    } else {
      setIsDiscountApproved(true);
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;
    const vouchers = simActions.getVouchers();
    const found = vouchers.find(v => v.code === code && !v.usedAt);
    if (found) {
      if (selectedOrder && selectedOrder.total < found.minOrderValue) {
        setVoucherError(`Đơn hàng tối thiểu từ ${formatVnd(found.minOrderValue)}`);
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(found);
        setVoucherError("");
        if (found.type === "percent") {
          setDiscountPercent(found.value);
          setIsDiscountApproved(true);
        } else {
          // Convert static discount to ratio
          const base = selectedOrder?.total || 1;
          const pct = Math.min(Math.round((found.value / base) * 100), 100);
          setDiscountPercent(pct);
          setIsDiscountApproved(true);
        }
        triggerToast(`Áp dụng mã voucher ${code} thành công!`);
      }
    } else {
      setVoucherError("Mã không tồn tại hoặc đã qua hạn sử dụng.");
      setAppliedVoucher(null);
    }
  };

  const calculateTotal = () => {
    if (!selectedOrder) return 0;
    const base = selectedOrder.total;
    const discountAmount = base * (discountPercent / 100);
    return Math.max(base - discountAmount, 0);
  };

  // Process core payment and create automatic voucher + stock log
  const handleProcessPayment = () => {
    if (!selectedOrder) return;
    
    const finalTotal = calculateTotal();
    const discountAmount = selectedOrder.total * (discountPercent / 100);

    // 1. Persist update to mock backend
    simActions.updateOrderStatus(selectedOrder.orderId, "paid", finalTotal, discountAmount);

    // 2. Add to shift sales list
    const newSale: ShiftSale = {
      orderId: selectedOrder.orderId,
      licensePlate: selectedOrder.licensePlate,
      total: finalTotal,
      discount: discountAmount,
      method: paymentMethod,
      timestamp: new Date().toISOString()
    };
    setShiftSales(prev => [newSale, ...prev]);

    // 3. Dynamic Stock Depletion Analysis & Technician commission assignment
    let coChemicals = 15000;
    let depletedText = "01 nắp dung dịch rửa xe WASSUP SOAP, xịt lốp Sonax, 50L nước tinh khiết.";
    if (selectedOrder.packageCode === "W4" || selectedOrder.packageCode === "W5") {
      coChemicals = 350000;
      depletedText = "01 chai phủ dung dịch Ceramic chuyên sâu, 01 set khăn lau lông cừu microfiber.";
    } else if (selectedOrder.packageCode === "W2" || selectedOrder.packageCode === "W3") {
      coChemicals = 80000;
      depletedText = "02 thỏi đất sét 3M tẩy bụi sơn, 200ml hóa chất dưỡng nhựa khoang nội thất.";
    }

    const techCom = Math.round(finalTotal * 0.1); // 10% commission

    // 4. Automatically generate a digital Phiếu Thu (Inflow Voucher)
    const newPtId = `PT-${new Date().getFullYear()}-${String(phieuThuList.length + 1).padStart(3, '0')}`;
    const autoPt: PhieuThu = {
      id: newPtId,
      timestamp: new Date().toISOString(),
      customerName: selectedOrder.customerName || "Khách vãng lai",
      customerPhone: selectedOrder.customerPhone || "—",
      licensePlate: selectedOrder.licensePlate,
      vehicleSegment: selectedOrder.vehicleSegment,
      paymentMethod: paymentMethod === "cash" ? "cash" : (paymentMethod === "card" ? "card" : "bank_transfer"),
      notes: `Thu tiền thanh toán hóa đơn ${selectedOrder.packageCode} (Biển số: ${selectedOrder.licensePlate})`,
      amount: finalTotal,
      createdBy: cashierName,
      orderId: selectedOrder.orderId,
      costOfChemicals: coChemicals,
      technicianCommission: techCom,
      thuType: "service"
    };
    setPhieuThuList(prev => [autoPt, ...prev]);

    // 5. Save to audit log
    const auditId = `AL-${Date.now().toString().slice(-4)}`;
    const autoAudit: AuditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actor: `${cashierName} (Thu Ngân)`,
      action: "LẬP PHIẾU THU TỰ ĐỘNG",
      targetId: newPtId,
      details: `Thanh toán thành công hóa đơn #${selectedOrder.orderId.slice(-6).toUpperCase()}. Tiêu hao vật tư: ${depletedText}. Trích hoa hồng thợ: ${formatVnd(techCom)}`
    };
    setAuditLogs(prev => [autoAudit, ...prev]);

    // 6. Set receipt details for preview/modal
    setPrintedReceipt({
      orderId: selectedOrder.orderId,
      licensePlate: selectedOrder.licensePlate,
      customerName: selectedOrder.customerName || "Khách vãng lai",
      customerPhone: selectedOrder.customerPhone || "—",
      packageCode: selectedOrder.packageCode,
      basePrice: selectedOrder.total,
      discount: discountAmount,
      discountPercent: discountPercent,
      finalTotal: finalTotal,
      method: paymentMethod,
      cashPaid: paymentMethod === "cash" ? (Number(cashPaid) || finalTotal) : undefined,
      cashChange: paymentMethod === "cash" ? Math.max((Number(cashPaid) || finalTotal) - finalTotal, 0) : undefined,
      timestamp: new Date().toISOString()
    });

    // Toast alerts
    triggerToast(`Thu tiền & khấu trừ kho tự động thành công! Giảm tồn kho: ${depletedText}`);

    // Reset payment values
    setSelectedOrder(null);
    setCashPaid("");
    setDiscountPercent(0);
    setIsDiscountApproved(false);
    setShowReceiptModal(true);
    setVoucherCodeInput("");
    setAppliedVoucher(null);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = Number(actualCashInput) || 0;
    
    const cashSalesInShift = shiftSales
      .filter(s => s.method === "cash")
      .reduce((sum, s) => sum + s.total, 0);

    const nonCashSalesInShift = shiftSales
      .filter(s => s.method === "bank_transfer" || s.method === "card")
      .reduce((sum, s) => sum + s.total, 0);

    const expectedCash = openCash + cashSalesInShift;
    const difference = actual - expectedCash;

    const log: ShiftHistory = {
      id: "sh_" + Date.now(),
      cashierName,
      shiftType,
      openTime: new Date(Date.now() - 8 * 3600000).toISOString(),
      closeTime: new Date().toISOString(),
      openCash,
      expectedCash,
      actualCash: actual,
      expectedTransfer: nonCashSalesInShift,
      difference,
      status: "completed"
    };

    setShiftLogs(prev => [log, ...prev]);
    setIsShiftOpen(false);
    setActualCashInput("");
    setShiftSales([]); 
    setShowShiftConfig(false);
    triggerToast("Chốt ca và đối soát két tiền thành công!");
  };

  const handleOpenNewShift = (openingAmount: number, cashier: string, shift: string) => {
    setOpenCash(openingAmount);
    setCashierName(cashier);
    setShiftType(shift);
    setShiftSales([]);
    setIsShiftOpen(true);
    triggerToast(`Đã mở ca làm việc mới cho thu ngân ${cashier}.`);
  };

  // Adding independent Phiếu Thu
  const handleCreateManualThu = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newThuData.amount) || 0;
    if (amountNum <= 0) return;

    const newId = `PT-${new Date().getFullYear()}-${String(phieuThuList.length + 1).padStart(3, '0')}`;
    const newPt: PhieuThu = {
      id: newId,
      timestamp: new Date().toISOString(),
      customerName: newThuData.customerName,
      customerPhone: newThuData.customerPhone || "—",
      licensePlate: newThuData.licensePlate,
      vehicleSegment: newThuData.vehicleSegment,
      paymentMethod: newThuData.paymentMethod,
      notes: newThuData.notes || "Thu ngoài dịch vụ / bán lẻ đồ chơi xe",
      amount: amountNum,
      createdBy: cashierName,
      costOfChemicals: Math.round(amountNum * 0.2), // Default 20% cost estimation
      technicianCommission: 0,
      thuType: newThuData.thuType
    };

    setPhieuThuList(prev => [newPt, ...prev]);
    setShowAddThu(false);
    setNewThuData({
      customerName: "",
      customerPhone: "",
      licensePlate: "",
      vehicleSegment: "sedan",
      paymentMethod: "bank_transfer",
      amount: "",
      notes: "",
      attachmentUrl: "",
      thuType: "service"
    });

    const auditId = `AL-${Date.now().toString().slice(-4)}`;
    setAuditLogs(prev => [
      {
        id: auditId,
        timestamp: new Date().toISOString(),
        actor: `${cashierName} (Thu Ngân)`,
        action: "LẬP PHIẾU THU THỦ CÔNG",
        targetId: newId,
        details: `Tạo phiếu thu ngoài dịch vụ trị giá ${formatVnd(amountNum)}`
      },
      ...prev
    ]);
    triggerToast("Tạo phiếu thu dòng tiền thành công!");
  };

  // Adding independent Phiếu Chi (proposing or paying directly)
  const handleCreateManualChi = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newChiData.amount) || 0;
    if (amountNum <= 0) return;

    const newId = `PC-${new Date().getFullYear()}-${String(phieuChiList.length + 1).padStart(3, '0')}`;
    // Cashier role can only propose (Pending status)
    const isMgr = currentRole === "manager";
    const statusVal = isMgr ? "completed" : "pending";

    const newPc: PhieuChi = {
      id: newId,
      timestamp: new Date().toISOString(),
      expenseType: newChiData.expenseType,
      recipient: newChiData.recipient,
      amount: amountNum,
      notes: newChiData.notes,
      status: statusVal,
      paymentAccount: newChiData.paymentAccount,
      createdBy: `${cashierName} (${currentRole === "manager" ? "Quản Lý" : "Thu Ngân"})`,
      approvedBy: isMgr ? cashierName : undefined
    };

    setPhieuChiList(prev => [newPc, ...prev]);
    setShowAddChi(false);
    setNewChiData({
      expenseType: "commercial_goods",
      recipient: "",
      amount: "",
      notes: "",
      paymentAccount: "cash_fund",
      attachmentUrl: ""
    });

    const auditId = `AL-${Date.now().toString().slice(-4)}`;
    setAuditLogs(prev => [
      {
        id: auditId,
        timestamp: new Date().toISOString(),
        actor: `${cashierName} (${currentRole === "manager" ? "Quản Lý" : "Thu Ngân"})`,
        action: isMgr ? "LẬP & DUYỆT PHIẾU CHI" : "ĐỀ XUẤT PHIẾU CHI",
        targetId: newId,
        details: isMgr 
          ? `Chi tiền mặt/chuyển khoản trị giá ${formatVnd(amountNum)} trực tiếp.` 
          : `Đề xuất duyệt chi trị giá ${formatVnd(amountNum)} từ quỹ.`
      },
      ...prev
    ]);

    triggerToast(isMgr ? "Lập phiếu chi đã duyệt thành công!" : "Đề xuất chi tiền của bạn đã gửi tới Quản lý!");
  };

  // Approve a pending expense
  const handleApproveExpense = (id: string, actionType: "approved" | "completed" | "rejected") => {
    if (currentRole !== "manager") {
      alert("Chỉ tài khoản Chủ cửa hàng/Kế toán mới có quyền duyệt chi!");
      return;
    }

    setPhieuChiList(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: actionType, approvedBy: cashierName };
      }
      return p;
    }));

    const pc = phieuChiList.find(p => p.id === id);
    const auditId = `AL-${Date.now().toString().slice(-4)}`;
    setAuditLogs(prev => [
      {
        id: auditId,
        timestamp: new Date().toISOString(),
        actor: `${cashierName} (Quản Lý)`,
        action: actionType === "rejected" ? "TỪ CHỐI CHI" : "PHÊ DUYỆT CHI",
        targetId: id,
        details: `Cập nhật trạng thái phiếu chi của ${pc?.recipient} thành ${actionType.toUpperCase()}`
      },
      ...prev
    ]);

    triggerToast(`Đã ${actionType === "rejected" ? "từ chối" : "phê duyệt"} phiếu chi ${id}!`);
  };

  // Safe Audit Trail: editing transaction notes (Deletes are locked for audit traceability)
  const saveEditThuNotes = (id: string) => {
    setPhieuThuList(prev => prev.map(p => p.id === id ? { ...p, notes: editingThuNotes } : p));
    setEditingThuId(null);

    const auditId = `AL-${Date.now().toString().slice(-4)}`;
    setAuditLogs(prev => [
      {
        id: auditId,
        timestamp: new Date().toISOString(),
        actor: `${cashierName} (${currentRole === "manager" ? "Quản Lý" : "Thu Ngân"})`,
        action: "CHỈNH SỬA PHIẾU THU",
        targetId: id,
        details: `Cập nhật nội dung phiếu thu thành: "${editingThuNotes}"`
      },
      ...prev
    ]);
    triggerToast("Cập nhật ghi chú phiếu thu thành công!");
  };

  const saveEditChiNotes = (id: string) => {
    setPhieuChiList(prev => prev.map(p => p.id === id ? { ...p, notes: editingChiNotes } : p));
    setEditingChiId(null);

    const auditId = `AL-${Date.now().toString().slice(-4)}`;
    setAuditLogs(prev => [
      {
        id: auditId,
        timestamp: new Date().toISOString(),
        actor: `${cashierName} (${currentRole === "manager" ? "Quản Lý" : "Thu Ngân"})`,
        action: "CHỈNH SỬA PHIẾU CHI",
        targetId: id,
        details: `Cập nhật nội dung phiếu chi thành: "${editingChiNotes}"`
      },
      ...prev
    ]);
    triggerToast("Cập nhật ghi chú phiếu chi thành công!");
  };

  // ---------------------------------------------------------------------------
  // INTERACTIVE ACCOUNTING CALCULATORS (REALTIME REPORTS)
  // ---------------------------------------------------------------------------
  // 1. Cashflow Calculator
  const totalCashReceipts = phieuThuList
    .filter(p => p.paymentMethod === "cash")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBankReceipts = phieuThuList
    .filter(p => p.paymentMethod === "bank_transfer" || p.paymentMethod === "card")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCashExpenses = phieuChiList
    .filter(p => p.paymentAccount === "cash_fund" && (p.status === "completed" || p.status === "approved"))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBankExpenses = phieuChiList
    .filter(p => p.paymentAccount === "bank_fund" && (p.status === "completed" || p.status === "approved"))
    .reduce((sum, p) => sum + p.amount, 0);

  // Cash in Cash drawer (Két mặt)
  const currentCashInDrawer = openCash + totalCashReceipts - totalCashExpenses;
  // Cash in Bank accounts (Tài khoản)
  const currentBankBalance = 45000000 + totalBankReceipts - totalBankExpenses; // 45M starting bank float

  // 2. Revenue split calculation
  const revenueBySegment = {
    sedan: phieuThuList.filter(p => p.vehicleSegment === "sedan").reduce((sum, p) => sum + p.amount, 0),
    suv: phieuThuList.filter(p => p.vehicleSegment === "suv").reduce((sum, p) => sum + p.amount, 0),
    truck: phieuThuList.filter(p => p.vehicleSegment === "truck").reduce((sum, p) => sum + p.amount, 0)
  };

  const revenueBySegmentData = [
    { name: "Sedan (4-5 chỗ)", value: revenueBySegment.sedan, color: "#A2C62C" },
    { name: "SUV (7 chỗ/MPV)", value: revenueBySegment.suv, color: "#3B82F6" },
    { name: "Xe bán tải (Truck)", value: revenueBySegment.truck, color: "#F59E0B" }
  ];

  // 3. Profit & Loss Statement (P&L)
  const grossRevenue = phieuThuList.reduce((sum, p) => sum + p.amount, 0) + 18450000; // Baseline + real-time Inflows
  const costOfChemicalsTotal = phieuThuList.reduce((sum, p) => sum + p.costOfChemicals, 0) + (grossRevenue * 0.08); // Real COGS + estimated baseline
  const technicianCommissionsTotal = phieuThuList.reduce((sum, p) => sum + p.technicianCommission, 0) + (grossRevenue * 0.12); // Real commission + estimated baseline

  const operatingCosts = phieuChiList
    .filter(p => p.expenseType !== "commercial_goods" && p.expenseType !== "technician_commission" && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const netProfitVal = grossRevenue - costOfChemicalsTotal - technicianCommissionsTotal - operatingCosts;

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* GLOBAL TOAST BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 border-l-4 border-[#A2C62C] text-white p-4 rounded-xl shadow-2xl flex items-start gap-3"
          >
            <CheckCircle className="h-5 w-5 text-[#A2C62C] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#A2C62C]">Thông báo nghiệp vụ</p>
              <p className="text-xs text-stone-300 mt-1 font-sans font-bold leading-relaxed">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER MODULE & REAL-TIME CONTROLS */}
      <div className="space-y-4 py-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="space-y-1 px-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-900 text-[#A2C62C] text-[9px] font-black tracking-wider rounded uppercase">
                DIGITAL CASHIER V2
              </span>
              <h1 className="text-xl font-black font-display text-matte-black uppercase tracking-tight">
                POS THU NGÂN & HOẠCH TOÁN THU CHI
              </h1>
            </div>
            <p className="text-mid-gray text-xs font-sans max-w-2xl leading-relaxed">
              Hệ thống quản lý dòng tiền toàn diện: tự sinh mã QR chuyển khoản động, kiểm soát bàn giao ca két tiền mặt trực tiếp, tự động khấu trừ định mức vật tư hóa chất, và phân quyền kế toán minh bạch.
            </p>
          </div>

          {/* SIMULATED ROLE SELECTOR & EXPORT HTML */}
          <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl flex flex-col sm:flex-row items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <UserCheck className="h-4 w-4 text-slate-500" /> VAI TRÒ CHUYÊN MÔN:
            </span>
            <div className="grid grid-cols-2 gap-1 bg-stone-200/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setCurrentRole("cashier");
                  triggerToast("Đã chuyển sang vai trò THU NGÂN ca trực.");
                }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase transition cursor-pointer ${
                  currentRole === "cashier"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                👩‍💼 Thu Ngân
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentRole("manager");
                  triggerToast("Đã chuyển sang vai trò CHỦ TIỆM / KẾ TOÁN.");
                }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase transition cursor-pointer ${
                  currentRole === "manager"
                    ? "bg-slate-950 text-[#A2C62C] shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                👑 Kế Toán / Admin
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                exportPosModuleToHtml({
                  orders: orders || [],
                  activeShift: {
                    cashierName,
                    shiftType,
                    openTime: new Date().toISOString(),
                    openCash,
                    sales: shiftSales
                  },
                  phieuThuList,
                  phieuChiList,
                  auditLogs: [],
                  shiftHistory: shiftLogs || []
                });
                triggerToast("Đã xuất thành công Module 3 (M3 POS) thành 1 file HTML!");
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-sm shrink-0"
              title="Xuất Module 3 thành file HTML độc lập"
            >
              <Download className="h-4 w-4" />
              <span>Xuất File HTML</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex border border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-sm gap-2 overflow-x-auto scrollbar-none my-3">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
              activeTab === "pos"
                ? "bg-[#18181b] text-white shadow-xs"
                : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
            }`}
          >
            <CreditCard className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "pos" ? "text-[#a2c62c]" : "text-[#64748b]"}`} /> BÁN HÀNG & TÍNH BILL
          </button>
          
          <button
            onClick={() => setActiveTab("receipts")}
            className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
              activeTab === "receipts"
                ? "bg-[#18181b] text-white shadow-xs"
                : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
            }`}
          >
            <TrendingUp className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "receipts" ? "text-[#a2c62c]" : "text-[#64748b]"}`} /> PHIẾU THU ({phieuThuList.length})
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
              activeTab === "expenses"
                ? "bg-[#18181b] text-white shadow-xs"
                : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
            }`}
          >
            <TrendingDown className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "expenses" ? "text-[#a2c62c]" : "text-[#64748b]"}`} /> PHIẾU CHI ({phieuChiList.length})
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
              activeTab === "reports"
                ? "bg-[#18181b] text-white shadow-xs"
                : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
            }`}
          >
            <TrendingUp className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "reports" ? "text-[#a2c62c]" : "text-[#64748b]"}`} /> BÁO CÁO KẾ TOÁN
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
              activeTab === "audit"
                ? "bg-[#18181b] text-white shadow-xs"
                : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
            }`}
          >
            <ClipboardList className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "audit" ? "text-[#a2c62c]" : "text-[#64748b]"}`} /> KIỂM TOÁN ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab("shifts")}
            className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
              activeTab === "shifts"
                ? "bg-[#18181b] text-white shadow-xs"
                : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
            }`}
          >
            <History className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeTab === "shifts" ? "text-[#a2c62c]" : "text-[#64748b]"}`} /> GIAO CA ({shiftLogs.length})
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER RENDERING BASED ON ACTIVE TAB */}
      <AnimatePresence mode="wait">
        {activeTab === "pos" && (
          <motion.div
            key="pos-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {isShiftOpen ? (
              <div className="space-y-6">
                
                {/* LEFT: WORK ORDERS REQUIRING PAYMENT (Expanded to full-width) */}
                <div className="flex flex-col justify-between bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden w-full">
                  <div className="p-5 border-b border-[#e5e5e5] space-y-4 bg-stone-50/50">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <h2 className="text-sm font-extrabold font-display tracking-wider text-slate-900 uppercase flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-lime-600" />
                        Đơn Hàng Cần Xử Lý Thanh Toán ({filteredOrders.length})
                      </h2>
                      
                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tìm biển số, khách hàng..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#A2C62C]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[
                        { value: "all", label: "Tất cả" },
                        { value: "pending_payment", label: "Chờ thanh toán ⏳" },
                        { value: "paid", label: "Đã thu tiền ✅" },
                        { value: "draft", label: "Nháp 📝" },
                        { value: "cancelled", label: "Đã hủy ❌" }
                      ].map((tab) => (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setStatusFilter(tab.value as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            statusFilter === tab.value
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-white border border-stone-200 text-slate-600 hover:bg-stone-50"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto min-h-[380px]">
                    {filteredOrders.length > 0 ? (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-50 text-slate-500 border-b border-[#e5e5e5]">
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Mã đơn</th>
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Biển số</th>
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Khách hàng / KTV</th>
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Gói dịch vụ</th>
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-right">Giá gốc</th>
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-center">Trạng thái</th>
                            <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-sans">
                          {filteredOrders.map((o) => {
                            const isPending = o.commerceStatus === "pending_payment" || o.commerceStatus === "draft";
                            const isPaid = o.commerceStatus === "paid" || o.commerceStatus === "closed";
                            
                            return (
                              <tr
                                key={o.id}
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setDiscountPercent(0);
                                  setIsDiscountApproved(false);
                                  setVoucherCodeInput("");
                                  setAppliedVoucher(null);
                                }}
                                className={`hover:bg-lime-50/20 transition-colors cursor-pointer ${
                                  selectedOrder?.id === o.id ? "bg-lime-50/50" : ""
                                }`}
                              >
                                <td className="p-4 font-sans font-bold text-slate-400">#{o.id.slice(-6).toUpperCase()}</td>
                                <td className="p-4 font-sans font-black text-slate-900 tracking-wider">
                                  <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded text-xs font-bold shadow-xs">
                                    {o.licensePlate}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <p className="font-bold text-slate-800">{o.customerName || "Khách vãng lai"}</p>
                                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#A2C62C]"></span>
                                    KTV: {o.technicianName || "Đang xếp lịch..."}
                                  </p>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-900 text-[#A2C62C] font-black text-[10px] tracking-wide uppercase font-sans">
                                    {o.packageCode}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-black text-slate-900">{formatVnd(o.total)}</td>
                                <td className="p-4 text-center">
                                  {isPending && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                      Chờ thanh toán
                                    </span>
                                  )}
                                  {isPaid && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                                      Đã thanh toán
                                    </span>
                                  )}
                                  {o.commerceStatus === "cancelled" && (
                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-red-50 border border-red-150 text-red-700 text-[9px] font-black uppercase tracking-wider">
                                      Đã hủy
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(o);
                                      setDiscountPercent(0);
                                      setIsDiscountApproved(false);
                                      setVoucherCodeInput("");
                                      setAppliedVoucher(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                                      selectedOrder?.id === o.id
                                        ? "bg-[#A2C62C] text-slate-950 shadow-sm"
                                        : "bg-slate-950 text-white hover:bg-slate-800"
                                    }`}
                                  >
                                    {isPaid ? "Xem Lại" : "Tính Tiền"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 h-full min-h-[300px]">
                        <XCircle className="h-10 w-10 text-stone-200 mb-2" />
                        <p className="font-bold text-sm text-slate-700">Không có hóa đơn chờ thanh toán</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                          Chọn bộ lọc khác hoặc kiểm tra quy trình công việc tại trạm để đưa xe vào hàng chờ thanh toán.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3.5 bg-stone-50 border-t border-stone-150 flex items-center justify-between text-[10px] font-sans text-slate-400">
                    <span>* Bấm vào dòng đơn hàng để mở bảng thanh toán chi tiết từ bên phải qua</span>
                    <span>Hệ thống đối lưu dòng tiền tự động v2</span>
                  </div>
                </div>

                {/* DETAILED ACTIVE BILLING SIDEBAR DRAWER (Sliding from right) */}
                <AnimatePresence>
                  {selectedOrder && (
                    <>
                      {/* Backdrop Overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedOrder(null)}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 transition-opacity"
                      />

                      {/* Sliding Sidebar Drawer Container */}
                      <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-stone-200"
                      >
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-[#e5e5e5] bg-stone-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-lime-600" />
                            <h2 className="text-sm font-extrabold font-display tracking-wider text-slate-900 uppercase">
                              Phiếu Thu Tính Tiền POS
                            </h2>
                          </div>
                          <button
                            onClick={() => setSelectedOrder(null)}
                            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-950 transition cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Drawer Body - Scrollable content */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-left">
                          {/* Car Details */}
                          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between shadow-xs">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">BIỂN SỐ XE</span>
                              <span className="text-lg font-black font-sans tracking-widest text-slate-900">
                                {selectedOrder.licensePlate}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex px-2.5 py-1 bg-slate-900 text-[#A2C62C] font-black text-[11px] rounded uppercase font-sans tracking-wider">
                                {selectedOrder.packageCode}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-extrabold mt-1 uppercase">
                                {selectedOrder.vehicleSegment === "sedan" ? "4-5 Chỗ" : "7 Chỗ / SUV"}
                              </span>
                            </div>
                          </div>

                          {/* Customer & Technician details */}
                          <div className="text-xs space-y-1.5 border-b border-stone-100 pb-3">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans">Khách hàng:</span>
                              <span className="font-bold text-slate-800">{selectedOrder.customerName || "Khách vãng lai"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans">Nhân viên kỹ thuật:</span>
                              <span className="font-bold text-slate-800 text-[#A2C62C]">{selectedOrder.technicianName || "Đang gán..."}</span>
                            </div>
                          </div>

                          {/* STOCK DEPLETION PREVIEW ALERT */}
                          <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1">
                            <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider">
                              ĐỊNH MỨC VẬT TƯ HAO HỤT (XUẤT KHO TỰ ĐỘNG)
                            </span>
                            <p className="text-[10px] text-slate-700 font-bold leading-relaxed">
                              {selectedOrder.packageCode === "W4" || selectedOrder.packageCode === "W5"
                                ? "⚠️ Xuất 01 bộ dung dịch Ceramic phủ gầm cao cấp + set khăn microfiber chuyên dụng"
                                : selectedOrder.packageCode === "W2" || selectedOrder.packageCode === "W3"
                                ? "📦 Xuất 02 miếng đất sét tẩy bụi sơn 3M + 150ml chất dưỡng bóng lốp"
                                : "📦 Tiêu hao 1 nắp bọt tuyết đậm đặc WASSUP SOAP + 50L nước sản xuất"}
                            </p>
                          </div>

                          {/* VOUCHER APPLICATION */}
                          <div className="space-y-1.5 border-t border-stone-100 pt-3">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                              ÁP DỤNG MÃ GIẢM GIÁ / VOUCHER
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Nhập mã (Ví dụ: WASSUPNEW)..."
                                value={voucherCodeInput}
                                onChange={(e) => setVoucherCodeInput(e.target.value)}
                                className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans font-bold uppercase focus:outline-none focus:border-[#A2C62C]"
                              />
                              <button
                                type="button"
                                onClick={handleApplyVoucher}
                                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-[#A2C62C] font-extrabold text-[10px] rounded-xl uppercase transition cursor-pointer"
                              >
                                Áp Dụng
                              </button>
                            </div>
                            {voucherError && (
                              <p className="text-[10px] text-red-600 font-bold">{voucherError}</p>
                            )}
                            {appliedVoucher && (
                              <p className="text-[10px] text-emerald-600 font-bold">
                                ✓ Đã áp mã {appliedVoucher.code} ({appliedVoucher.type === "percent" ? `${appliedVoucher.value}%` : formatVnd(appliedVoucher.value)})
                              </p>
                            )}
                          </div>

                          {/* PRICE & DISCOUNT SUMMARY */}
                          <div className="space-y-2 bg-stone-900 text-white p-4 rounded-xl text-xs font-sans shadow-md">
                            <div className="flex justify-between text-stone-400">
                              <span>Giá dịch vụ gốc:</span>
                              <span className="font-bold">{formatVnd(selectedOrder.total)}</span>
                            </div>

                            {discountPercent > 0 && (
                              <div className="flex justify-between text-red-400 font-bold">
                                <span>Chiết khấu giảm ({discountPercent}%):</span>
                                <span>-{formatVnd(selectedOrder.total * (discountPercent / 100))}</span>
                              </div>
                            )}

                            <div className="flex justify-between border-t border-stone-700 pt-2 text-sm font-black">
                              <span className="text-stone-300">CẦN THANH TOÁN:</span>
                              <span className="text-[#A2C62C] text-base font-display font-black">
                                {formatVnd(calculateTotal())}
                              </span>
                            </div>
                          </div>

                          {/* PAYMENT METHOD CHOICES */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">
                              PHƯƠNG THỨC THANH TOÁN
                            </label>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("bank_transfer")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${
                                  paymentMethod === "bank_transfer"
                                    ? "bg-lime-50/50 border-[#A2C62C] text-slate-900 font-bold"
                                    : "bg-white border-stone-200 text-slate-500 hover:bg-stone-50"
                                }`}
                              >
                                <QrCode className="h-4 w-4 text-[#A2C62C]" />
                                <span className="text-[9px] leading-none">Chuyển khoản</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("cash")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${
                                  paymentMethod === "cash"
                                    ? "bg-lime-50/50 border-[#A2C62C] text-slate-900 font-bold"
                                    : "bg-white border-stone-200 text-slate-500 hover:bg-stone-50"
                                }`}
                              >
                                <DollarSign className="h-4 w-4 text-amber-600" />
                                <span className="text-[9px] leading-none">Tiền Mặt</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPaymentMethod("card")}
                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer ${
                                  paymentMethod === "card"
                                    ? "bg-lime-50/50 border-[#A2C62C] text-slate-900 font-bold"
                                    : "bg-white border-stone-200 text-slate-500 hover:bg-stone-50"
                                }`}
                              >
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <span className="text-[9px] leading-none">Cà Thẻ</span>
                              </button>
                            </div>
                          </div>

                          {/* DYNAMIC VIETQR SPEC IMPLEMENTATION */}
                          {paymentMethod === "bank_transfer" && (
                            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center text-center space-y-2">
                              <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-xs relative">
                                {/* Dynamic VietQR code mock with transaction payload */}
                                <div className="h-28 w-28 bg-stone-50 flex items-center justify-center relative overflow-hidden">
                                  <div className="absolute inset-2 border-2 border-slate-950 flex flex-wrap p-1">
                                    <div className="w-1/3 h-1/3 bg-slate-950" />
                                    <div className="w-1/3 h-1/3" />
                                    <div className="w-1/3 h-1/3 bg-slate-950" />
                                    <div className="w-1/3 h-1/3" />
                                    <div className="w-1/3 h-1/3 bg-slate-950" />
                                    <div className="w-1/3 h-1/3" />
                                    <div className="w-1/3 h-1/3 bg-slate-950" />
                                    <div className="w-1/3 h-1/3" />
                                    <div className="w-1/3 h-1/3 bg-slate-950" />
                                  </div>
                                  <div className="absolute h-6 w-6 rounded bg-slate-900 text-[#A2C62C] font-black text-[7px] flex items-center justify-center z-10 shadow-md">
                                    QR
                                  </div>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal font-sans">
                                Nội dung chuyển khoản động:<br />
                                <span className="font-sans font-black text-slate-900 bg-stone-200 px-1.5 py-0.5 rounded text-[11px]">
                                  {`HD${selectedOrder.id.slice(-6).toUpperCase()}_${selectedOrder.licensePlate.replace(/[-.]/g, "")}`}
                                </span><br />
                                STK: <strong className="text-slate-800">1012999999</strong> - Vietcombank
                              </p>
                            </div>
                          )}

                          {/* CASH CHANGE CALCULATOR */}
                          {paymentMethod === "cash" && (
                            <div className="space-y-3 bg-stone-50 border border-stone-200 p-3.5 rounded-xl text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 uppercase font-extrabold block">
                                  Tiền mặt khách đưa (VND)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="Nhập số tiền..."
                                    value={cashPaid}
                                    onChange={(e) => setCashPaid(e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-2 text-xs font-sans font-bold text-slate-900 focus:outline-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 font-sans">
                                    VND
                                  </span>
                                </div>
                              </div>

                              {Number(cashPaid) >= calculateTotal() && (
                                <div className="flex justify-between border-t border-stone-200 pt-2 text-xs font-bold text-slate-900">
                                  <span className="text-slate-400 text-[9px] mt-0.5">TIỀN THỐI LẠI:</span>
                                  <span className="text-emerald-700 font-sans font-black text-sm">
                                    {formatVnd(Number(cashPaid) - calculateTotal())}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* COMPONENT ACTIONS */}
                          <div className="pt-2">
                            {selectedOrder.commerceStatus === "paid" || selectedOrder.commerceStatus === "closed" ? (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-bold">
                                Đơn hàng đã thanh toán thành công.
                              </div>
                            ) : (
                              <button
                                onClick={handleProcessPayment}
                                disabled={(discountPercent > 10 && !isDiscountApproved) || (paymentMethod === "cash" && cashPaid !== "" && Number(cashPaid) < calculateTotal())}
                                className={`w-full py-3.5 rounded-xl font-black tracking-wider text-xs transition uppercase shadow-md flex items-center justify-center gap-2 border-0 ${
                                  (discountPercent > 10 && !isDiscountApproved) || (paymentMethod === "cash" && cashPaid !== "" && Number(cashPaid) < calculateTotal())
                                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                                    : "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 cursor-pointer"
                                }`}
                              >
                                Xác Nhận Thu Tiền &amp; Khấu Trừ Kho <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-200 rounded-3xl bg-white max-w-lg mx-auto shadow-sm">
                <div className="h-14 w-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-sm animate-pulse">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 font-display uppercase tracking-wider">Hệ Thống POS Đang Khóa Ca</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                  Vui lòng bấm vào tab <strong>"Nhật trình giao ca"</strong> hoặc bấm nút mở ca mới để thiết lập dòng tiền bắt đầu.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: PHIẾU THU */}
        {activeTab === "receipts" && (
          <motion.div
            key="receipts-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* PHIẾU THU (INFLOWS LOGS) */}
            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Sổ Quỹ Phiếu Thu (Dòng Thu Inflow)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">Thu phí dịch vụ, cọc combo hoặc bán lẻ phụ kiện.</p>
                </div>
                <button
                  onClick={() => setShowAddThu(!showAddThu)}
                  className="px-2.5 py-1.5 bg-brand-green hover:bg-brand-green-hover text-matte-black rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition border-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Tạo Phiếu Thu
                </button>
              </div>

              {/* FORM TẠO PHIẾU THU DRAWER */}
              <AnimatePresence>
                {showAddThu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAddThu(false)}
                      className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 transition-opacity"
                    />

                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-stone-200 text-slate-800"
                    >
                      <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-[#A2C62C] flex items-center justify-center text-slate-950">
                            <TrendingUp className="h-4.5 w-4.5" />
                          </div>
                          <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                            Tạo Phiếu Thu Mới
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddThu(false)}
                          className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateManualThu} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Khách hàng <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="Tên khách..."
                              value={newThuData.customerName}
                              onChange={(e) => setNewThuData({ ...newThuData, customerName: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Số điện thoại</label>
                            <input
                              type="text"
                              placeholder="Số điện thoại..."
                              value={newThuData.customerPhone}
                              onChange={(e) => setNewThuData({ ...newThuData, customerPhone: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Biển số xe <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: 30A-123.45"
                              value={newThuData.licensePlate}
                              onChange={(e) => setNewThuData({ ...newThuData, licensePlate: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 uppercase focus:outline-none focus:border-slate-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Phân khúc xe</label>
                            <select
                              value={newThuData.vehicleSegment}
                              onChange={(e) => setNewThuData({ ...newThuData, vehicleSegment: e.target.value as any })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            >
                              <option value="sedan">Sedan (4-5 Chỗ)</option>
                              <option value="suv">SUV / MPV (7 Chỗ)</option>
                              <option value="truck">Bán tải / Khác</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Phân loại dòng thu <span className="text-red-500">*</span></label>
                            <select
                              value={newThuData.thuType}
                              onChange={(e) => setNewThuData({ ...newThuData, thuType: e.target.value as any })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
                            >
                              <option value="service">Thu từ dịch vụ (Rửa xe, Ceramic...)</option>
                              <option value="merchandise">Thu từ bán hàng (Dung dịch, gạt mưa...)</option>
                              <option value="deposit">Thu khác: Khách cọc tiền combo lớn</option>
                              <option value="prepaid_card">Thu khác: Thẻ trả trước (Prepaid)</option>
                              <option value="insurance">Thu khác: Tiền đền bù từ bảo hiểm</option>
                              <option value="other">Khoản thu khác</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Hình thức</label>
                            <select
                              value={newThuData.paymentMethod}
                              onChange={(e) => setNewThuData({ ...newThuData, paymentMethod: e.target.value as any })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            >
                              <option value="bank_transfer">Chuyển khoản VietQR</option>
                              <option value="cash">Tiền mặt quỹ két</option>
                              <option value="card">Cà thẻ ATM</option>
                              <option value="e-wallet">Ví điện tử MoMo</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Số tiền thu <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            required
                            placeholder="VND..."
                            value={newThuData.amount}
                            onChange={(e) => setNewThuData({ ...newThuData, amount: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-sans font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Nội dung thu <span className="text-red-500">*</span></label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Nội dung cụ thể..."
                            value={newThuData.notes}
                            onChange={(e) => setNewThuData({ ...newThuData, notes: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-stone-200 justify-end mt-auto">
                          <button
                            type="button"
                            onClick={() => setShowAddThu(false)}
                            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-0 shadow-sm"
                          >
                            Lưu phiếu thu
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* SEARCH PHIẾU THU */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm mã phiếu, biển số, tên khách..."
                  value={phieuThuSearch}
                  onChange={(e) => setPhieuThuSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              {/* TABLE OF INFLOWS */}
              <div className="overflow-x-auto border border-stone-150 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px] font-sans">
                  <thead>
                    <tr className="bg-stone-50 text-slate-500 border-b border-stone-150">
                      <th className="p-3 font-extrabold uppercase text-[9px]">Mã / Giờ</th>
                      <th className="p-3 font-extrabold uppercase text-[9px]">Xe & Khách</th>
                      <th className="p-3 font-extrabold uppercase text-[9px]">Nội dung</th>
                      <th className="p-3 font-extrabold uppercase text-[9px] text-right">Số tiền</th>
                      <th className="p-3 font-extrabold uppercase text-[9px] text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {phieuThuList
                      .filter(p => p.id.toLowerCase().includes(phieuThuSearch.toLowerCase()) || p.licensePlate.toLowerCase().includes(phieuThuSearch.toLowerCase()) || p.customerName.toLowerCase().includes(phieuThuSearch.toLowerCase()))
                      .map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/40">
                        <td className="p-3">
                          <span className="font-sans font-bold text-slate-950 block">{p.id}</span>
                          <span className="text-[9px] text-slate-400 font-sans mt-0.5 block mb-1">{new Date(p.timestamp).toLocaleTimeString("vi-VN")}</span>
                          {p.thuType && (
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              p.thuType === "service" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                              p.thuType === "merchandise" ? "bg-teal-50 text-teal-700 border border-teal-200" :
                              p.thuType === "prepaid_card" ? "bg-violet-50 text-violet-700 border border-violet-200" :
                              p.thuType === "deposit" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              p.thuType === "insurance" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}>
                              {p.thuType === "service" ? "Dịch vụ" :
                               p.thuType === "merchandise" ? "Bán hàng" :
                               p.thuType === "prepaid_card" ? "Thẻ trả trước" :
                               p.thuType === "deposit" ? "Đặt cọc" :
                               p.thuType === "insurance" ? "Bảo hiểm" : "Khác"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-sans bg-slate-100 border border-stone-200 px-1 py-0.5 rounded text-[10px] font-bold block w-fit mb-1">{p.licensePlate}</span>
                          <span className="font-bold text-slate-700">{p.customerName}</span>
                        </td>
                        <td className="p-3">
                          {editingThuId === p.id ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={editingThuNotes}
                                onChange={(e) => setEditingThuNotes(e.target.value)}
                                className="border border-stone-300 rounded p-1 text-[11px] bg-white text-slate-800"
                              />
                              <button onClick={() => saveEditThuNotes(p.id)} className="p-1 bg-[#A2C62C] rounded text-slate-950 font-bold">Lưu</button>
                              <button onClick={() => setEditingThuId(null)} className="p-1 bg-stone-100 rounded text-slate-500">X</button>
                            </div>
                          ) : (
                            <p className="text-slate-600 font-medium leading-relaxed">{p.notes}</p>
                          )}
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">Người thu: {p.createdBy} • HT: {p.paymentMethod.toUpperCase()}</span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700 text-xs">
                          +{formatVnd(p.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setEditingThuId(p.id);
                              setEditingThuNotes(p.notes);
                            }}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            Sửa
                          </button>
                          <span className="block text-[8px] text-stone-400 font-sans mt-1">🔒 LOCKED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: PHIẾU CHI */}
        {activeTab === "expenses" && (
          <motion.div
            key="expenses-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* PHIẾU CHI (OUTFLOWS LOGS) */}
            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-wider flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Sổ Quỹ Phiếu Chi (Dòng Chi Outflow)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">Giá vốn mua vật tư, trả hoa hồng thợ, điện nước mặt bằng.</p>
                </div>
                <button
                  onClick={() => setShowAddChi(!showAddChi)}
                  className="px-2.5 py-1.5 bg-brand-green hover:bg-brand-green-hover text-matte-black rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition border-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Tạo Phiếu Chi
                </button>
              </div>

              {/* FORM TẠO PHIẾU CHI DRAWER */}
              <AnimatePresence>
                {showAddChi && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAddChi(false)}
                      className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 transition-opacity"
                    />

                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-stone-200 text-slate-800"
                    >
                      <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-red-600 flex items-center justify-center text-white">
                            <TrendingDown className="h-4.5 w-4.5" />
                          </div>
                          <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                            Tạo Phiếu Chi Mới
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddChi(false)}
                          className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateManualChi} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Loại chi phí</label>
                            <select
                              value={newChiData.expenseType}
                              onChange={(e) => setNewChiData({ ...newChiData, expenseType: e.target.value as any })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            >
                              <option value="commercial_goods">Mua hàng hóa / Vật tư hóa chất</option>
                              <option value="technician_commission">Trả hoa hồng / Lương thợ</option>
                              <option value="utilities">Điện nước sản xuất</option>
                              <option value="rent">Mặt bằng / Thuê hạ tầng</option>
                              <option value="entertainment">Tiếp khách / Đối tác</option>
                              <option value="other">Chi phí khác</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Tài khoản thanh toán</label>
                            <select
                              value={newChiData.paymentAccount}
                              onChange={(e) => setNewChiData({ ...newChiData, paymentAccount: e.target.value as any })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            >
                              <option value="cash_fund">Quỹ tiền mặt (Két mặt)</option>
                              <option value="bank_fund">Tài khoản ngân hàng</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Người nhận tiền <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="Tên đơn vị/cá nhân nhận..."
                              value={newChiData.recipient}
                              onChange={(e) => setNewChiData({ ...newChiData, recipient: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Số tiền chi <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              required
                              placeholder="VND..."
                              value={newChiData.amount}
                              onChange={(e) => setNewChiData({ ...newChiData, amount: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-sans font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Nội dung chi chi tiết <span className="text-red-500">*</span></label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Nêu rõ lý do và danh mục chi..."
                            value={newChiData.notes}
                            onChange={(e) => setNewChiData({ ...newChiData, notes: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                          />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-stone-200 justify-end mt-auto">
                          <button
                            type="button"
                            onClick={() => setShowAddChi(false)}
                            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-0 shadow-sm"
                          >
                            {currentRole === "manager" ? "Tạo đã duyệt" : "Gửi Đề xuất chi"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* SEARCH PHIẾU CHI */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm mã phiếu, người nhận, nội dung chi..."
                  value={phieuChiSearch}
                  onChange={(e) => setPhieuChiSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              {/* TABLE OF OUTFLOWS */}
              <div className="overflow-x-auto border border-stone-150 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px] font-sans">
                  <thead>
                    <tr className="bg-stone-50 text-slate-500 border-b border-stone-150">
                      <th className="p-3 font-extrabold uppercase text-[9px]">Mã / Giờ</th>
                      <th className="p-3 font-extrabold uppercase text-[9px]">Đối tác / Người nhận</th>
                      <th className="p-3 font-extrabold uppercase text-[9px]">Nội dung & Phân loại</th>
                      <th className="p-3 font-extrabold uppercase text-[9px] text-right">Số tiền</th>
                      <th className="p-3 font-extrabold uppercase text-[9px] text-center">Xác thực / Duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {phieuChiList
                      .filter(p => p.id.toLowerCase().includes(phieuChiSearch.toLowerCase()) || p.recipient.toLowerCase().includes(phieuChiSearch.toLowerCase()) || p.notes.toLowerCase().includes(phieuChiSearch.toLowerCase()))
                      .map((p) => {
                        const isPending = p.status === "pending";
                        
                        return (
                          <tr key={p.id} className="hover:bg-stone-50/40">
                            <td className="p-3">
                              <span className="font-sans font-bold text-slate-950 block">{p.id}</span>
                              <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">{new Date(p.timestamp).toLocaleTimeString("vi-VN")}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-800">{p.recipient}</span>
                              <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-200 px-1 py-0.5 rounded uppercase font-sans block w-fit mt-1">
                                {p.paymentAccount === "cash_fund" ? "Quỹ Mặt" : "Ngân hàng"}
                              </span>
                            </td>
                            <td className="p-3">
                              {editingChiId === p.id ? (
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    value={editingChiNotes}
                                    onChange={(e) => setEditingChiNotes(e.target.value)}
                                    className="border border-stone-300 rounded p-1 text-[11px] bg-white text-slate-800"
                                  />
                                  <button onClick={() => saveEditChiNotes(p.id)} className="p-1 bg-[#A2C62C] rounded text-slate-950 font-bold">Lưu</button>
                                  <button onClick={() => setEditingChiId(null)} className="p-1 bg-stone-100 rounded text-slate-500">X</button>
                                </div>
                              ) : (
                                <p className="text-slate-600 font-medium leading-relaxed">{p.notes}</p>
                              )}
                              <span className="text-[9px] text-slate-400 block mt-1 font-bold">Phân loại: {p.expenseType.toUpperCase()} • Tạo: {p.createdBy}</span>
                            </td>
                            <td className="p-3 text-right font-black text-red-700 text-xs">
                              -{formatVnd(p.amount)}
                            </td>
                            <td className="p-3 text-center">
                              {isPending ? (
                                <div className="space-y-1">
                                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[9px] rounded-full uppercase">Chờ Duyệt</span>
                                  {currentRole === "manager" ? (
                                    <div className="flex gap-1 justify-center mt-1.5">
                                      <button
                                        onClick={() => handleApproveExpense(p.id, "completed")}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded cursor-pointer border-0"
                                      >
                                        Duyệt
                                      </button>
                                      <button
                                        onClick={() => handleApproveExpense(p.id, "rejected")}
                                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded cursor-pointer border-0"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-[8px] text-stone-400 leading-snug">Cần quản lý duyệt</p>
                                  )}
                                </div>
                              ) : p.status === "rejected" ? (
                                <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 font-bold text-[9px] rounded-full uppercase">Từ chối</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full uppercase">Đã Chi</span>
                                  {p.approvedBy && <span className="block text-[8px] text-slate-400">Duyệt: {p.approvedBy}</span>}
                                </div>
                              )}
                              
                              <div className="mt-2 flex gap-1 justify-center border-t border-stone-100 pt-1">
                                <button
                                  onClick={() => {
                                    setEditingChiId(p.id);
                                    setEditingChiNotes(p.notes);
                                  }}
                                  className="text-blue-600 hover:underline font-bold text-[10px]"
                                >
                                  Sửa
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: ACCOUNTING REPORTS */}
        {activeTab === "reports" && (
          <motion.div
            key="reports-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* INFLOW/OUTFLOW CASHFLOW BALANCE STATUS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-1.5">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">KÉT TIỀN MẶT CỬA HÀNG (CASH ON HAND)</span>
                <p className="text-xl font-black font-sans text-slate-900">{formatVnd(currentCashInDrawer)}</p>
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-stone-100 pt-1.5 font-sans">
                  <span>Mở ca: {formatVnd(openCash)}</span>
                  <span>Thu: +{formatVnd(totalCashReceipts)} | Chi: -{formatVnd(totalCashExpenses)}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10px] p-2 rounded-lg mt-2 font-bold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Đã kiểm kê khớp thực tế két sắt
                </div>
              </div>

              <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-1.5">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">TÀI KHOẢN NGÂN HÀNG VIETCOMBANK</span>
                <p className="text-xl font-black font-sans text-slate-900">{formatVnd(currentBankBalance)}</p>
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-stone-100 pt-1.5 font-sans">
                  <span>Mở ví: 45.000.000đ</span>
                  <span>Thu: +{formatVnd(totalBankReceipts)} | Chi: -{formatVnd(totalBankExpenses)}</span>
                </div>
                <div className="bg-blue-50 border border-blue-150 text-blue-800 text-[10px] p-2 rounded-lg mt-2 font-bold flex items-center gap-1">
                  <QrCode className="h-3 w-3" /> Kết nối VietQR đối lưu trực tuyến
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-stone-400 uppercase font-black tracking-wider block">TỔNG QUỸ KẾT TOÁN SỐ DƯ</span>
                  <p className="text-2xl font-black font-sans text-[#A2C62C]">{formatVnd(currentCashInDrawer + currentBankBalance)}</p>
                </div>
                <button
                  onClick={() => alert("Hệ thống đã gửi dữ liệu sao kê đối lưu dòng tiền tự động khớp 100%!")}
                  className="w-full py-2 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-black uppercase text-[10px] rounded-xl transition border-0 cursor-pointer"
                >
                  Yêu Cầu Đối Soát Dòng Tiền Hàng Ngày
                </button>
              </div>
            </div>

            {/* INCOME STATEMENT (P&L REPORT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* PROFIT AND LOSS STATEMENT LEDGER */}
              <div className="lg:col-span-7 bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-wider">
                    Báo cáo Lợi nhuận gộp &amp; Giá vốn dịch vụ (P&amp;L)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">Tính toán thực tế dựa trên tiêu hao hóa chất (COGS) và hoa hồng kỹ thuật viên.</p>
                </div>

                <div className="space-y-2.5 text-xs font-sans">
                  <div className="flex justify-between items-center p-2.5 bg-stone-50 rounded-lg">
                    <span className="font-bold text-slate-700">1. Tổng Doanh Thu Hoạt Động (Inflows):</span>
                    <span className="font-sans font-black text-slate-900">{formatVnd(grossRevenue)}</span>
                  </div>

                  <div className="pl-4 space-y-2 text-slate-600 border-l-2 border-stone-100 py-1">
                    <div className="flex justify-between">
                      <span>• Baseline doanh thu tích lũy:</span>
                      <span className="font-sans">{formatVnd(18450000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Phát sinh thực tế POS:</span>
                      <span className="font-sans">+{formatVnd(phieuThuList.reduce((sum, p) => sum + p.amount, 0))}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-red-50 text-red-800 rounded-lg">
                    <span className="font-bold">2. Giá vốn hóa chất / Dung dịch sử dụng (COGS):</span>
                    <span className="font-sans font-black">-{formatVnd(costOfChemicalsTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-red-50 text-red-800 rounded-lg">
                    <span className="font-bold">3. Trích chi hoa hồng cho thợ (Commissions):</span>
                    <span className="font-sans font-black">-{formatVnd(technicianCommissionsTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-stone-50 text-slate-800 rounded-lg border-y border-stone-200">
                    <span className="font-black uppercase text-[10px]">=&gt; Lợi Nhuận Gộp (Gross Profit):</span>
                    <span className="font-sans font-black text-forest-green text-sm">
                      {formatVnd(grossRevenue - costOfChemicalsTotal - technicianCommissionsTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-red-50 text-red-800 rounded-lg">
                    <span className="font-bold">4. Chi phí gián tiếp / Vận hành (OPEX):</span>
                    <span className="font-sans font-black">-{formatVnd(operatingCosts)}</span>
                  </div>

                  <div className="pl-4 space-y-2 text-slate-600 border-l-2 border-stone-100 py-1">
                    <div className="flex justify-between">
                      <span>• Chi phí điện &amp; nước sản xuất:</span>
                      <span className="font-sans">{formatVnd(phieuChiList.filter(p => p.expenseType === "utilities" && p.status === "completed").reduce((sum, p) => sum + p.amount, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Chi phí mua vật tư / Mặt bằng:</span>
                      <span className="font-sans">{formatVnd(phieuChiList.filter(p => p.expenseType === "commercial_goods" && p.status === "completed").reduce((sum, p) => sum + p.amount, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Đối ngoại / Tiếp khách / Khác:</span>
                      <span className="font-sans">{formatVnd(phieuChiList.filter(p => (p.expenseType === "entertainment" || p.expenseType === "other") && p.status === "completed").reduce((sum, p) => sum + p.amount, 0))}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl shadow-md">
                    <div className="space-y-0.5">
                      <span className="font-black uppercase tracking-wider text-[10px] text-[#A2C62C]">LỢI NHUẬN RÒNG THỰC TẾ (NET PROFIT):</span>
                      <p className="text-[9px] text-stone-400">Tự động kết toán dòng tiền phát sinh theo thời gian thực.</p>
                    </div>
                    <span className="font-sans font-black text-lg text-[#A2C62C]">
                      {formatVnd(netProfitVal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SERVICE REVENUE DISTRIBUTION */}
              <div className="lg:col-span-5 bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-wider">
                    Phân bổ Doanh Thu theo Xe
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">Chiếm tỷ trọng nguồn vào SUV, Sedan, bán tải.</p>
                </div>

                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBySegmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueBySegmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatVnd(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 font-sans text-xs">
                  {revenueBySegmentData.map((seg, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }}></span>
                        <span className="text-slate-600 font-bold">{seg.name}</span>
                      </div>
                      <span className="font-sans font-black text-slate-900">{formatVnd(seg.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <motion.div
            key="audit-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4"
          >
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-wider">
                Nhật Ký Kiểm Toán Biến Động Số Sách (Audit Trail)
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Lưu vết mọi thao tác chỉnh sửa, khởi tạo phiếu thu/chi, thanh toán hóa đơn nhằm loại bỏ gian lận thu ngân.</p>
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log, idx) => (
                <div key={`${log.id || 'al'}-${idx}`} className="p-4 bg-stone-50 border border-stone-200/60 rounded-xl flex items-start gap-3 text-xs">
                  <div className="p-2 bg-slate-900 text-[#A2C62C] font-black font-sans text-[9px] rounded-lg shadow-sm">
                    {log.id}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-black text-slate-900 uppercase tracking-wider text-[10px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-sans">{new Date(log.timestamp).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">{log.details}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 bg-stone-200 text-stone-700 font-bold rounded text-[9px]">Tác nhân: {log.actor}</span>
                      <span className="text-[9px] text-slate-400 font-sans">Đối tượng liên quan: {log.targetId}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 5: SHIFTS & HANDOVERS */}
        {activeTab === "shifts" && (
          <motion.div
            key="shifts-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* SHIFT STATE ACTION BOARD */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-slate-900 text-[#A2C62C] text-[9px] font-black tracking-wider rounded uppercase">
                  ACTIVE REGISTRY
                </span>
                <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                  Quản Lý Ca Làm Việc &amp; Bàn Giao Két Tiền Mặt
                </h3>
                <p className="text-[11px] text-slate-400">Thiết lập quỹ két mặt an toàn đầu ca và thực hiện chốt ca đối soát sai lệch két.</p>
              </div>

              <div>
                <button
                  onClick={() => {
                    if (isShiftOpen) {
                      setShowShiftConfig(true);
                    } else {
                      const cash = prompt("Nhập số tiền mặt quỹ đầu ca (VND):", "2000000");
                      const cashier = prompt("Nhập tên thu ngân ca mới:", "Nguyễn Văn Hùng");
                      const shiftName = prompt("Nhập tên ca làm việc (Ví dụ: Ca Sáng, Ca Chiều):", "Ca Sáng (07:00 - 15:00)");
                      if (cash !== null && cashier && shiftName) {
                        handleOpenNewShift(Number(cash) || 0, cashier, shiftName);
                      }
                    }
                  }}
                  className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm border-0 cursor-pointer ${
                    isShiftOpen
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950"
                  }`}
                >
                  {isShiftOpen ? "Chốt Ca & Bàn Giao Két" : "Mở Ca Két Mới"}
                </button>
              </div>
            </div>

            {/* HISTORIC HANDOVER RECORDS */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-100 pb-3 gap-3">
                <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-wider uppercase flex items-center gap-2">
                  <History className="h-5 w-5 text-[#A2C62C]" />
                  Lịch sử Báo cáo Giao ca &amp; Sai số két sắt
                </h3>
                <button
                  onClick={() => alert("Xuất báo cáo biên bản giao ca thành công!")}
                  className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-1.5 uppercase transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Xuất File Excel
                </button>
              </div>

              <div className="overflow-x-auto border border-stone-200 rounded-xl">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-slate-500 border-b border-stone-200">
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold">Ca trực</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold">Thu ngân bàn giao</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold text-right">Quỹ đầu ca</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold text-right">Lý thuyết quỹ</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold text-right">Thực tế két</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold text-right">DT Chuyển khoản</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold text-right">Sai lệch két</th>
                      <th className="p-3.5 uppercase tracking-wider text-[10px] font-extrabold text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {shiftLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/50">
                        <td className="p-3.5 font-extrabold text-slate-800">{log.shiftType}</td>
                        <td className="p-3.5 font-bold text-slate-700">{log.cashierName}</td>
                        <td className="p-3.5 text-right font-sans text-slate-400">{formatVnd(log.openCash)}</td>
                        <td className="p-3.5 text-right font-sans font-bold text-slate-800">{formatVnd(log.expectedCash)}</td>
                        <td className="p-3.5 text-right font-sans font-black text-slate-900">{formatVnd(log.actualCash)}</td>
                        <td className="p-3.5 text-right font-sans text-emerald-600 font-bold">{formatVnd(log.expectedTransfer)}</td>
                        <td className={`p-3.5 text-right font-sans font-black ${
                          log.difference < 0 ? "text-red-600" : log.difference > 0 ? "text-emerald-600" : "text-slate-900"
                        }`}>
                          {log.difference === 0 ? "—" : (log.difference > 0 ? "+" : "") + formatVnd(log.difference)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                            Đã chốt khớp
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLOSE SHIFT FORM DRAWER (SLIDING FROM RIGHT) */}
      <AnimatePresence>
        {showShiftConfig && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShiftConfig(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 transition-opacity"
            />

            {/* Sliding Sidebar Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-stone-200 text-slate-800"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#A2C62C] flex items-center justify-center text-slate-950">
                    <Coins className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display font-black text-xs uppercase tracking-wide">
                    Kết Toán Bàn Giao Ca Trực Két Tiền
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShiftConfig(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCloseShift} className="p-6 flex-1 overflow-y-auto space-y-5 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-display font-black text-slate-400 uppercase tracking-wider block">
                    Thu ngân giao ca
                  </label>
                  <input
                    type="text"
                    required
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-display font-black text-slate-400 uppercase tracking-wider block">
                    Ca làm việc bàn giao
                  </label>
                  <input
                    type="text"
                    required
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2.5">
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider border-b border-stone-200 pb-1.5">KẾT TOÁN LÝ THUYẾT CA TRỰC</p>
                  <div className="flex justify-between text-slate-600">
                    <span>Quỹ đầu ca (Mặt):</span>
                    <span className="font-sans font-bold">{formatVnd(openCash)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>+ Doanh thu Tiền mặt thu được:</span>
                    <span className="font-sans font-bold text-emerald-600">
                      +{formatVnd(shiftSales.filter(s => s.method === "cash").reduce((sum, s) => sum + s.total, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold border-t border-stone-200/80 pt-2">
                    <span>TỔNG TIỀN MẶT LÝ THUYẾT:</span>
                    <span className="font-sans text-slate-950 font-black">
                      {formatVnd(openCash + shiftSales.filter(s => s.method === "cash").reduce((sum, s) => sum + s.total, 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-display font-black text-slate-400 uppercase tracking-wider block">
                    Tiền mặt thực tế đếm được trong két (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Kiểm đếm và nhập số tiền thực có..."
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-sans font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowShiftConfig(false)}
                    className="flex-1 py-3 rounded-xl border border-stone-200 text-slate-600 hover:bg-stone-50 transition text-xs font-bold font-display uppercase cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black transition text-xs font-display uppercase shadow-sm cursor-pointer border-0"
                  >
                    Xác Nhận Chốt Ca
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POS RETAIL RECEIPT MODAL */}
      <AnimatePresence>
        {showReceiptModal && printedReceipt && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-stone-250 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-slate-800 font-sans relative"
            >
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setPrintedReceipt(null);
                }}
                className="absolute right-4 top-4 p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition border-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-4 text-center">
                <div className="border-b-2 border-dashed border-stone-200 pb-3 space-y-1">
                  <h3 className="font-display font-black text-lg tracking-tight uppercase text-slate-950">
                    WASSUP <span className="text-[#A2C62C]">WASH</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Biên Lai Thanh Toán Kiosk POS
                  </p>
                  <p className="text-[9px] text-slate-450 font-sans">
                    Ngày: {new Date(printedReceipt.timestamp).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-left">
                  <div className="flex justify-between font-sans">
                    <span className="text-slate-450">Mã giao dịch:</span>
                    <span className="font-bold text-slate-800">#{printedReceipt.orderId.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Biển số xe:</span>
                    <span className="font-black text-slate-900 tracking-wider font-sans bg-stone-100 px-2 py-0.5 rounded">
                      {printedReceipt.licensePlate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Khách hàng:</span>
                    <span className="font-bold text-slate-800">{printedReceipt.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Gói dịch vụ:</span>
                    <span className="font-bold text-slate-800 uppercase">{printedReceipt.packageCode}</span>
                  </div>
                  
                  <div className="border-t border-dashed border-stone-200 pt-2.5 space-y-1.5">
                    <div className="flex justify-between font-sans">
                      <span className="text-slate-450">Giá trị gốc:</span>
                      <span className="text-slate-700">{formatVnd(printedReceipt.basePrice)}</span>
                    </div>
                    {printedReceipt.discount > 0 && (
                      <div className="flex justify-between font-sans text-red-600">
                        <span>Chiết khấu (-{printedReceipt.discountPercent}%):</span>
                        <span>-{formatVnd(printedReceipt.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-200 pt-2 font-display font-black text-sm text-slate-950">
                      <span>TỔNG THANH TOÁN:</span>
                      <span className="text-emerald-700">{formatVnd(printedReceipt.finalTotal)}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-stone-200 pt-2.5 space-y-1.5 font-sans text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-450">Phương thức:</span>
                      <span className="font-bold text-slate-850 uppercase">
                        {printedReceipt.method === "cash" ? "Tiền mặt" : printedReceipt.method === "card" ? "Thẻ ATM" : "Chuyển khoản QR"}
                      </span>
                    </div>
                    {printedReceipt.method === "cash" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-455">Khách đưa:</span>
                          <span className="text-slate-700">{formatVnd(printedReceipt.cashPaid)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-600">
                          <span>Thối lại:</span>
                          <span>{formatVnd(printedReceipt.cashChange)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-stone-200 pt-4 text-center space-y-1.5">
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    Cảm ơn quý khách đã tin dùng!
                  </p>
                  <p className="text-[9px] text-slate-400 italic">
                    Hệ thống trạm tự động Wassup Wash - Sạch bóng, an tâm.
                  </p>
                  <div className="flex justify-center gap-2 pt-2.5">
                    <button
                      onClick={() => alert("Đang in biên lai ra cổng máy in nhiệt...")}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition border-0"
                    >
                      <Printer className="h-3.5 w-3.5" /> In Biên Lai
                    </button>
                    <button
                      onClick={() => {
                        setShowReceiptModal(false);
                        setPrintedReceipt(null);
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition border-0"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
