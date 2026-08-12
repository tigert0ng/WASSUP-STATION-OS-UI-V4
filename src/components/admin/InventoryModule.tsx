import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  Plus,
  TrendingDown,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  History,
  Tag,
  Wrench,
  Activity,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  X,
  RefreshCw,
  TrendingUp,
  Percent,
  Clock,
  BookOpen,
  ShoppingBag,
  Briefcase,
  Truck,
  Building2,
  Package,
  FileText,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Zap,
  Edit3,
  HelpCircle
} from "lucide-react";

import StockCounting from "./inventory/StockCounting";
import InventoryReports from "./inventory/InventoryReports";
import PrdHandbook from "./inventory/PrdHandbook";
import SupplierManagement, { Supplier, PurchaseOrder } from "./inventory/SupplierManagement";
import PurchaseOrderManager from "./inventory/PurchaseOrderManager";
import ManualStockModal, { InventoryItem, MANUAL_REASON_LABELS } from "./inventory/ManualStockModal";

// Seed data
const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: "sup-001",
    name: "WASSUP Supply Co. Ltd",
    phone: "024.3999.8888",
    address: "Lô C2, Cụm CN Cầu Giấy, Hà Nội",
    taxCode: "0109887766",
    note: "Nhà cung cấp hóa chất & dụng cụ rửa xe chính hãng WASSUP HQ",
    active: true,
    createdAt: "2025-01-01",
  },
  {
    id: "sup-002",
    name: "3M Việt Nam Official Store",
    phone: "0908.123.456",
    address: "Tòa nhà MMap, Q.7, TP.HCM",
    taxCode: "0301234567",
    note: "Phân phối hóa chất phớt đánh bóng, đất sét 3M",
    active: true,
    createdAt: "2025-02-10",
  },
  {
    id: "sup-003",
    name: "Công ty Thiết bị Car Care Karcher VN",
    phone: "0912.888.999",
    address: "Khu Công Nghệ Cao, Hà Nội",
    taxCode: "0108889999",
    note: "Cung cấp máy rửa xe áp lực, máy hút bụi, phụ tùng thay thế Karcher",
    active: true,
    createdAt: "2025-03-01",
  },
];

const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: "inv-01",
    code: "VTM-001",
    name: "Dầu bóng lốp xe Sonax Xtreme",
    category: "commercial",
    categoryLabel: "Nhóm 1 — Hàng thương mại",
    quantity: 45,
    unit: "Chai 500ml",
    minThreshold: 10,
    costPrice: 180000,
    avgCost: 180000,
    pricePerUnit: 180000,
    salePrice: 250000, // Has retail price -> Badge "Có bán lẻ"
    supplierId: "sup-002",
    supplierName: "3M Việt Nam Official Store",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-02",
    code: "VTH-001",
    name: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP",
    category: "consumable",
    categoryLabel: "Nhóm 2 — Vật liệu tiêu hao",
    quantity: 8,
    unit: "Can 20L",
    usageUnit: "ml",
    minThreshold: 15,
    costPrice: 1200000,
    avgCost: 1200000,
    pricePerUnit: 1200000,
    salePrice: null, // Internal usage
    supplierId: "sup-001",
    supplierName: "WASSUP Supply Co. Ltd",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-03",
    code: "VTH-002",
    name: "Đất sét tẩy ố bụi sơn 3M Claybar",
    category: "consumable",
    categoryLabel: "Nhóm 2 — Vật liệu tiêu hao",
    quantity: 12,
    unit: "Cục 200g",
    minThreshold: 5,
    costPrice: 250000,
    avgCost: 250000,
    pricePerUnit: 250000,
    salePrice: 350000, // Also available for retail purchase
    supplierId: "sup-002",
    supplierName: "3M Việt Nam Official Store",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-04",
    code: "CDC-001",
    name: "Máy xịt nước cao áp sấy gầm Karcher HD 6/15",
    category: "tool",
    categoryLabel: "Nhóm 3 — Công cụ dụng cụ",
    quantity: 4,
    unit: "Bộ máy",
    minThreshold: 2,
    costPrice: 35000000,
    avgCost: 35000000,
    pricePerUnit: 35000000,
    salePrice: null,
    supplierId: "sup-003",
    supplierName: "Công ty Thiết bị Car Care Karcher VN",
    lastUpdated: new Date().toISOString(),
    purchaseDate: "2025-01-15",
    usefulLifeMonths: 36,
    originalValue: 140000000,
    currentValue: 120000000,
  },
  {
    id: "inv-05",
    code: "CDC-002",
    name: "Máy đánh bóng lệch tâm Rupes LHR15 Mark III",
    category: "tool",
    categoryLabel: "Nhóm 3 — Công cụ dụng cụ",
    quantity: 3,
    unit: "Máy",
    minThreshold: 1,
    costPrice: 12500000,
    avgCost: 12500000,
    pricePerUnit: 12500000,
    salePrice: null,
    supplierId: "sup-001",
    supplierName: "WASSUP Supply Co. Ltd",
    lastUpdated: new Date().toISOString(),
    purchaseDate: "2025-03-20",
    usefulLifeMonths: 24,
    originalValue: 37500000,
    currentValue: 31250000,
  },
  {
    id: "inv-06",
    code: "CDT-001",
    name: "Chổi than cao cấp thay thế cho máy Rupes LHR15",
    category: "spare_part",
    categoryLabel: "Nhóm 4 — Phụ tùng thay thế",
    quantity: 20,
    unit: "Cặp",
    minThreshold: 5,
    costPrice: 80000,
    avgCost: 80000,
    pricePerUnit: 80000,
    salePrice: 150000, // Available for retail
    supplierId: "sup-001",
    supplierName: "WASSUP Supply Co. Ltd",
    relatedToolItemId: "inv-05",
    relatedToolName: "Máy đánh bóng Rupes LHR15 Mark III",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-07",
    code: "CDT-002",
    name: "Vòi xịt áp lực bọc đầu xoay Karcher",
    category: "spare_part",
    categoryLabel: "Nhóm 4 — Phụ tùng thay thế",
    quantity: 6,
    unit: "Cái",
    minThreshold: 2,
    costPrice: 450000,
    avgCost: 450000,
    pricePerUnit: 450000,
    salePrice: null,
    supplierId: "sup-003",
    supplierName: "Công ty Thiết bị Car Care Karcher VN",
    relatedToolItemId: "inv-04",
    relatedToolName: "Máy xịt nước Karcher HD 6/15",
    lastUpdated: new Date().toISOString(),
  },
];

const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2026-001",
    supplierId: "sup-001",
    supplierName: "WASSUP Supply Co. Ltd",
    status: "received",
    createdBy: "Nguyễn Văn Hùng (Quản lý)",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    note: "Nhập bổ sung hóa chất bọt tuyết & chổi than dự phòng ca tối",
    lines: [
      { itemId: "inv-02", itemName: "Hóa chất bọt tuyết WASSUP SOAP", qtyOrdered: 5, qtyReceived: 5, unitCost: 1200000, unit: "Can 20L" },
      { itemId: "inv-06", itemName: "Chổi than Rupes LHR15", qtyOrdered: 10, qtyReceived: 10, unitCost: 80000, unit: "Cặp" },
    ],
  },
  {
    id: "PO-2026-002",
    supplierId: "sup-002",
    supplierName: "3M Việt Nam Official Store",
    status: "confirmed",
    createdBy: "Trần Minh Quân (Master Admin)",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    note: "Đơn đặt mua dầu bóng Sonax và Đất sét 3M đợt 2",
    lines: [
      { itemId: "inv-01", itemName: "Dầu bóng lốp xe Sonax Xtreme", qtyOrdered: 20, qtyReceived: 0, unitCost: 180000, unit: "Chai 500ml" },
      { itemId: "inv-03", itemName: "Đất sét 3M Claybar", qtyOrdered: 10, qtyReceived: 0, unitCost: 250000, unit: "Cục 200g" },
    ],
  },
];

interface StockLedgerRow {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  type: "import" | "export" | "adjust";
  typeLabel: string;
  quantityChanged: number;
  balanceAfter: number;
  actor: string;
  reason: string;
}

const DEFAULT_LEDGER: StockLedgerRow[] = [
  {
    id: "lg-101",
    itemId: "inv-02",
    itemName: "Hóa chất bọt tuyết WASSUP SOAP",
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: "export",
    typeLabel: "Xuất kho BOM dịch vụ",
    quantityChanged: -2,
    balanceAfter: 8,
    actor: "WO-2026-881 (Tự động)",
    reason: "Cấp phát rửa xe theo định mức cho biển 30H-889.12",
  },
  {
    id: "lg-102",
    itemId: "inv-01",
    itemName: "Dầu bóng lốp xe Sonax Xtreme",
    date: new Date(Date.now() - 3600000 * 10).toISOString(),
    type: "import",
    typeLabel: "Nhập hàng theo PO",
    quantityChanged: 20,
    balanceAfter: 45,
    actor: "Trần Thị D (Kế toán)",
    reason: "Hóa đơn nhập PO-2026-001",
  },
];

export default function InventoryModule() {
  const location = useLocation();
  const navigate = useNavigate();

  // SUBMENU STATE (5 Independent Submenus)
  // Submenu A: Quản Lý Vật Tư (Nhập–Xuất–Tồn)
  // Submenu B: Quản Lý Nhà Cung Cấp
  // Submenu C: Kiểm Kho Định Kỳ
  // Submenu D: Báo Cáo Kho
  // Submenu E: Quy Trình PRD Module 6
  const [activeSubmenu, setActiveSubmenu] = useState<"A" | "B" | "C" | "D" | "E">("A");

  useEffect(() => {
    if (location.pathname.includes("/admin/inventory/suppliers")) {
      setActiveSubmenu("B");
    } else if (location.pathname.includes("/admin/inventory/stocktake")) {
      setActiveSubmenu("C");
    } else if (location.pathname.includes("/admin/inventory/reports")) {
      setActiveSubmenu("D");
    } else if (location.pathname.includes("/admin/inventory/prd")) {
      setActiveSubmenu("E");
    } else if (location.pathname.startsWith("/admin/inventory")) {
      setActiveSubmenu("A");
    }
  }, [location.pathname]);

  const handleSubmenuSelect = (sub: "A" | "B" | "C" | "D" | "E") => {
    setActiveSubmenu(sub);
    if (sub === "A") navigate("/admin/inventory/items");
    else if (sub === "B") navigate("/admin/inventory/suppliers");
    else if (sub === "C") navigate("/admin/inventory/stocktake");
    else if (sub === "D") navigate("/admin/inventory/reports");
    else if (sub === "E") navigate("/admin/inventory/prd");
  };

  // Submenu A Sub-tabs
  const [activeSubmenuATab, setActiveSubmenuATab] = useState<
    "inventory_list" | "po_management" | "bom_requisitions" | "retail_exports" | "ledger"
  >("inventory_list");

  // Primary Data Collections
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_inventory_items");
      if (cached) return JSON.parse(cached);
      return DEFAULT_ITEMS;
    } catch (e) {
      return DEFAULT_ITEMS;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_suppliers");
      if (cached) return JSON.parse(cached);
      return DEFAULT_SUPPLIERS;
    } catch (e) {
      return DEFAULT_SUPPLIERS;
    }
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_purchase_orders");
      if (cached) return JSON.parse(cached);
      return DEFAULT_PURCHASE_ORDERS;
    } catch (e) {
      return DEFAULT_PURCHASE_ORDERS;
    }
  });

  const [ledger, setLedger] = useState<StockLedgerRow[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_inventory_ledger");
      if (cached) return JSON.parse(cached);
      return DEFAULT_LEDGER;
    } catch (e) {
      return DEFAULT_LEDGER;
    }
  });

  // Filter States for Submenu A
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "commercial" | "consumable" | "tool" | "spare_part"
  >("all");
  const [hasRetailFilter, setHasRetailFilter] = useState(false);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer / Modal Controls
  const [showItemDrawer, setShowItemDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showPrdModal, setShowPrdModal] = useState(false);

  // Form State for Item Drawer (S6.2)
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState<"commercial" | "consumable" | "tool" | "spare_part">("commercial");
  const [formUnit, setFormUnit] = useState("");
  const [formUsageUnit, setFormUsageUnit] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formMinThreshold, setFormMinThreshold] = useState("5");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  // Tool Depreciation
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [formUsefulLifeMonths, setFormUsefulLifeMonths] = useState("24");
  const [formOriginalValue, setFormOriginalValue] = useState("");
  // Spare Part relation
  const [formRelatedToolId, setFormRelatedToolId] = useState("");

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("wassup_inventory_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("wassup_suppliers", JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem("wassup_purchase_orders", JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem("wassup_inventory_ledger", JSON.stringify(ledger));
  }, [ledger]);

  // Handle external storage updates
  useEffect(() => {
    const handleOutsideUpdate = () => {
      try {
        const cachedStr = localStorage.getItem("wassup_inventory_items");
        if (cachedStr) {
          setItems((prev) => {
            if (JSON.stringify(prev) === cachedStr) return prev;
            return JSON.parse(cachedStr);
          });
        }
      } catch (e) {}
    };
    window.addEventListener("wassup-inventory-update", handleOutsideUpdate);
    window.addEventListener("storage", handleOutsideUpdate);
    return () => {
      window.removeEventListener("wassup-inventory-update", handleOutsideUpdate);
      window.removeEventListener("storage", handleOutsideUpdate);
    };
  }, []);

  // Format VND
  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  // Open Drawer S6.2 Add
  const openAddItemDrawer = () => {
    setEditingItem(null);
    setFormName("");
    setFormCode("SKU-" + Math.floor(1000 + Math.random() * 9000));
    setFormCategory("commercial");
    setFormUnit("Cái");
    setFormUsageUnit("");
    setFormQuantity("10");
    setFormMinThreshold("5");
    setFormCostPrice("100000");
    setFormSalePrice("");
    setFormSupplierId(suppliers[0]?.id || "");
    setFormImageUrl("");
    setFormPurchaseDate(new Date().toISOString().split("T")[0]);
    setFormUsefulLifeMonths("24");
    setFormOriginalValue("");
    setFormRelatedToolId("");
    setShowItemDrawer(true);
  };

  // Open Drawer S6.2 Edit
  const openEditItemDrawer = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.code || item.id);
    setFormCategory(item.category);
    setFormUnit(item.unit);
    setFormUsageUnit(item.usageUnit || "");
    setFormQuantity(item.quantity.toString());
    setFormMinThreshold(item.minThreshold.toString());
    setFormCostPrice((item.avgCost || item.costPrice || item.pricePerUnit || 0).toString());
    setFormSalePrice(item.salePrice ? item.salePrice.toString() : "");
    setFormSupplierId(item.supplierId || "");
    setFormImageUrl(item.imageUrl || "");
    setFormPurchaseDate(item.purchaseDate || new Date().toISOString().split("T")[0]);
    setFormUsefulLifeMonths((item.usefulLifeMonths || 24).toString());
    setFormOriginalValue((item.originalValue || 0).toString());
    setFormRelatedToolId(item.relatedToolItemId || "");
    setShowItemDrawer(true);
  };

  // Save Item (Drawer S6.2)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuantity || !formUnit.trim()) {
      showToast("Vui lòng điền đầy đủ Tên vật tư, Số lượng và Đơn vị tính!");
      return;
    }

    const qty = Number(formQuantity);
    const threshold = Number(formMinThreshold) || 5;
    const cost = Number(formCostPrice) || 0;
    const sale = formSalePrice.trim() !== "" ? Number(formSalePrice) : null;
    const sup = suppliers.find((s) => s.id === formSupplierId);
    const relTool = items.find((i) => i.id === formRelatedToolId);

    const categoryLabels: Record<string, string> = {
      commercial: "Nhóm 1 — Hàng thương mại",
      consumable: "Nhóm 2 — Vật liệu tiêu hao",
      tool: "Nhóm 3 — Công cụ dụng cụ",
      spare_part: "Nhóm 4 — Phụ tùng thay thế",
    };

    if (editingItem) {
      // Edit
      const updated = items.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              name: formName.trim(),
              code: formCode.trim() || i.code,
              category: formCategory,
              categoryLabel: categoryLabels[formCategory],
              quantity: qty,
              unit: formUnit.trim(),
              usageUnit: formUsageUnit.trim() || undefined,
              minThreshold: threshold,
              costPrice: cost,
              avgCost: i.avgCost || cost,
              pricePerUnit: cost,
              salePrice: sale,
              supplierId: formSupplierId || undefined,
              supplierName: sup ? sup.name : undefined,
              imageUrl: formImageUrl.trim() || undefined,
              lastUpdated: new Date().toISOString(),
              purchaseDate: formCategory === "tool" ? formPurchaseDate : undefined,
              usefulLifeMonths: formCategory === "tool" ? Number(formUsefulLifeMonths) : undefined,
              originalValue: formCategory === "tool" ? Number(formOriginalValue) || cost * qty : undefined,
              relatedToolItemId: formCategory === "spare_part" ? formRelatedToolId || undefined : undefined,
              relatedToolName: formCategory === "spare_part" && relTool ? relTool.name : undefined,
            }
          : i
      );
      setItems(updated);
      showToast(`Đã cập nhật thông tin vật tư "${formName.trim()}"`);
    } else {
      // Add new
      const newItem: InventoryItem = {
        id: "inv_" + Date.now(),
        code: formCode.trim() || `SKU-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        categoryLabel: categoryLabels[formCategory],
        quantity: qty,
        unit: formUnit.trim(),
        usageUnit: formUsageUnit.trim() || undefined,
        minThreshold: threshold,
        costPrice: cost,
        avgCost: cost,
        pricePerUnit: cost,
        salePrice: sale,
        supplierId: formSupplierId || undefined,
        supplierName: sup ? sup.name : undefined,
        imageUrl: formImageUrl.trim() || undefined,
        lastUpdated: new Date().toISOString(),
        purchaseDate: formCategory === "tool" ? formPurchaseDate : undefined,
        usefulLifeMonths: formCategory === "tool" ? Number(formUsefulLifeMonths) : undefined,
        originalValue: formCategory === "tool" ? Number(formOriginalValue) || cost * qty : undefined,
        relatedToolItemId: formCategory === "spare_part" ? formRelatedToolId || undefined : undefined,
        relatedToolName: formCategory === "spare_part" && relTool ? relTool.name : undefined,
      };
      setItems([newItem, ...items]);

      // Write ledger
      const newLedgerRow: StockLedgerRow = {
        id: "lg_" + Date.now(),
        itemId: newItem.id,
        itemName: newItem.name,
        date: new Date().toISOString(),
        type: "import",
        typeLabel: "Khởi tạo vật tư mới",
        quantityChanged: qty,
        balanceAfter: qty,
        actor: "Trần Minh Quân (Master Admin)",
        reason: "Khởi tạo danh mục vật tư mới",
      };
      setLedger([newLedgerRow, ...ledger]);
      showToast(`Đã thêm vật tư mới "${newItem.name}" thành công!`);
    }

    setShowItemDrawer(false);
  };

  // Confirm Manual Export (S6.11)
  const handleConfirmManualExport = (data: {
    itemId: string;
    qty: number;
    reason: any;
    reasonNote?: string;
    relatedToolItemId?: string;
  }) => {
    const foundItem = items.find((i) => i.id === data.itemId);
    if (!foundItem) return;

    const newQty = foundItem.quantity - data.qty;
    const updated = items.map((i) =>
      i.id === data.itemId
        ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() }
        : i
    );
    setItems(updated);

    // Save manual adjustment log
    try {
      const cachedAdjustments = localStorage.getItem("wassup_manual_adjustments");
      const currentAdj = cachedAdjustments ? JSON.parse(cachedAdjustments) : [];
      const relTool = items.find((i) => i.id === data.relatedToolItemId);

      currentAdj.unshift({
        id: "SA-2026-" + Math.floor(100 + Math.random() * 900),
        itemId: foundItem.id,
        itemName: foundItem.name,
        qty: data.qty,
        reason: data.reason,
        reasonLabel: MANUAL_REASON_LABELS[data.reason as keyof typeof MANUAL_REASON_LABELS],
        reasonNote: data.reasonNote,
        relatedToolItemId: data.relatedToolItemId,
        relatedToolName: relTool ? relTool.name : undefined,
        createdBy: "Nguyễn Văn Hùng (Quản lý - S6.11)",
        at: new Date().toISOString(),
      });
      localStorage.setItem("wassup_manual_adjustments", JSON.stringify(currentAdj));
    } catch (e) {}

    // Ledger row
    const newLedger: StockLedgerRow = {
      id: "lg_" + Date.now(),
      itemId: foundItem.id,
      itemName: foundItem.name,
      date: new Date().toISOString(),
      type: "export",
      typeLabel: `Xuất kho thủ công (${MANUAL_REASON_LABELS[data.reason as keyof typeof MANUAL_REASON_LABELS]})`,
      quantityChanged: -data.qty,
      balanceAfter: newQty,
      actor: "Nguyễn Văn Hùng (Quản lý)",
      reason: data.reasonNote || MANUAL_REASON_LABELS[data.reason as keyof typeof MANUAL_REASON_LABELS],
    };
    setLedger([newLedger, ...ledger]);

    showToast(
      `Đã xuất kho thủ công ${data.qty} ${foundItem.unit} "${foundItem.name}"! Tồn còn: ${newQty} ${foundItem.unit}`
    );
  };

  // Filter items in Submenu A Tab 1
  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesRetail = hasRetailFilter ? Boolean(item.salePrice && item.salePrice > 0) : true;
    const matchesLowStock = lowStockFilter ? item.quantity <= item.minThreshold : true;
    const matchesSupplier = supplierFilter === "all" ? true : item.supplierId === supplierFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      matchesCategory &&
      matchesRetail &&
      matchesLowStock &&
      matchesSupplier &&
      matchesSearch
    );
  });

  // Category Counts
  const commercialCount = items.filter((i) => i.category === "commercial").length;
  const consumableCount = items.filter((i) => i.category === "consumable").length;
  const toolCount = items.filter((i) => i.category === "tool").length;
  const sparePartCount = items.filter((i) => i.category === "spare_part").length;
  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;
  const retailCount = items.filter((i) => i.salePrice && i.salePrice > 0).length;

  // Total Valuations
  const totalValueCommercial = items
    .filter((i) => i.category === "commercial")
    .reduce((sum, i) => sum + i.quantity * (i.avgCost || i.costPrice || i.pricePerUnit), 0);
  const totalValueConsumable = items
    .filter((i) => i.category === "consumable")
    .reduce((sum, i) => sum + i.quantity * (i.avgCost || i.costPrice || i.pricePerUnit), 0);
  const totalValueTools = items
    .filter((i) => i.category === "tool")
    .reduce(
      (sum, i) =>
        sum + (i.currentValue !== undefined ? i.currentValue : i.quantity * (i.avgCost || i.costPrice || i.pricePerUnit)),
      0
    );
  const totalValueSpareParts = items
    .filter((i) => i.category === "spare_part")
    .reduce((sum, i) => sum + i.quantity * (i.avgCost || i.costPrice || i.pricePerUnit), 0);
  const totalInventoryValue =
    totalValueCommercial + totalValueConsumable + totalValueTools + totalValueSpareParts;

  const getSubmenuHeaderInfo = () => {
    switch (activeSubmenu) {
      case "A":
        return {
          badge: "SUBMENU A — M6.1 (PRD v2.3)",
          title: "QUẢN LÝ VẬT TƯ (NHẬP – XUẤT – TỒN)",
          description: "Quản lý danh mục kho vật tư, đơn đặt hàng PO nhập kho, đề xuất định mức BOM, xuất kho bán lẻ & sổ cái biến động vật tư.",
          icon: Boxes,
          iconColor: "text-purple-600 bg-purple-50"
        };
      case "B":
        return {
          badge: "SUBMENU B — M6.2 (PRD v2.3)",
          title: "QUẢN LÝ NHÀ CUNG CẤP & ĐƠN HÀNG PO",
          description: "Quản lý danh sách đối tác nhà cung cấp, hồ sơ chi tiết, đánh giá xếp hạng, đơn đặt hàng PO nhập kho & lịch sử công nợ.",
          icon: Truck,
          iconColor: "text-blue-600 bg-blue-50"
        };
      case "C":
        return {
          badge: "SUBMENU C — M6.3 (PRD v2.3)",
          title: "KIỂM KHO ĐỊNH KỲ & ĐIỀU CHỈNH CHÊNH LỆCH",
          description: "Lập phiếu kiểm kê kho thực tế, đối soát chênh lệch với dữ liệu tồn kho trên hệ thống & tự động điều chỉnh số lượng.",
          icon: ClipboardList,
          iconColor: "text-emerald-600 bg-emerald-50"
        };
      case "D":
        return {
          badge: "SUBMENU D — M6.4 (PRD v2.3)",
          title: "BÁO CÁO KHO & CẢNH BÁO TỒN THẤP",
          description: "Báo cáo tổng quan giá trị tồn kho, thống kê biến động vật tư nhập xuất & cảnh báo tự động các mặt hàng dưới định mức an toàn.",
          icon: Activity,
          iconColor: "text-amber-600 bg-amber-50"
        };
      case "E":
        return {
          badge: "SUBMENU E — M6.5 (PRD v2.3)",
          title: "QUY TRÌNH PRD & CẨM NANG CHUẨN KHO MODULE 6",
          description: "Tài liệu Yêu cầu Sản phẩm (PRD), định mức vật tư kỹ thuật BOM, luồng nhập xuất & quy định kiểm đếm kho Car Care.",
          icon: BookOpen,
          iconColor: "text-purple-600 bg-purple-50"
        };
    }
  };

  const currentHeader = getSubmenuHeaderInfo();
  const HeaderIcon = currentHeader.icon;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans" id="module-6-inventory">
      {/* Toast popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-500/30 font-sans text-xs font-bold flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BORDERLESS HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-1">
        <div className="px-1">
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${currentHeader.iconColor}`}>
              <HeaderIcon className="h-6 w-6" />
            </div>
            {currentHeader.title}
          </h1>
          <p className="text-mid-gray text-xs font-sans mt-1 max-w-3xl">
            {currentHeader.description}
          </p>
        </div>
      </div>



      {/* RENDER ACTIVE SUBMENU CONTENT */}
      {activeSubmenu === "A" && (
        <div className="space-y-6">
          {/* Submenu A KPI Summary Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
              <p className="text-[10px] font-black uppercase text-stone-500">Tổng Giá Trị Tồn Kho</p>
              <p className="text-lg font-black text-slate-900 font-display mt-0.5">{formatVnd(totalInventoryValue)}</p>
              <p className="text-[11px] text-purple-600 font-bold mt-1">4 nhóm hàng hóa</p>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
              <p className="text-[10px] font-black uppercase text-stone-500">Nhóm 1 — Thương Mại</p>
              <p className="text-lg font-black text-slate-900 font-display mt-0.5">{commercialCount} SKU</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">{formatVnd(totalValueCommercial)}</p>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
              <p className="text-[10px] font-black uppercase text-stone-500">Nhóm 2 — Tiêu Hao</p>
              <p className="text-lg font-black text-slate-900 font-display mt-0.5">{consumableCount} SKU</p>
              <p className="text-[11px] text-blue-600 font-bold mt-1">{formatVnd(totalValueConsumable)}</p>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
              <p className="text-[10px] font-black uppercase text-stone-500">Nhóm 3 & 4 — CCDC / Phụ Tùng</p>
              <p className="text-lg font-black text-slate-900 font-display mt-0.5">{toolCount + sparePartCount} SKU</p>
              <p className="text-[11px] text-purple-600 font-bold mt-1">{formatVnd(totalValueTools + totalValueSpareParts)}</p>
            </div>

            <div
              className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
                lowStockCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-stone-200"
              }`}
              onClick={() => setLowStockFilter(!lowStockFilter)}
            >
              <p className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Cảnh Báo Tồn Thấp
              </p>
              <p className="text-lg font-black text-red-700 font-display mt-0.5">{lowStockCount} SKU Cần Nhập</p>
              <p className="text-[11px] text-red-600 font-bold mt-1 underline">Click để lọc danh sách</p>
            </div>
          </div>

          {/* Submenu A Navigation Tabs & Actions */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Submenu A Internal Tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSubmenuATab("inventory_list")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                    activeSubmenuATab === "inventory_list"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  S6.1 — Danh Sách Tồn Kho ({items.length})
                </button>

                <button
                  onClick={() => setActiveSubmenuATab("po_management")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                    activeSubmenuATab === "po_management"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  S6.4/S6.5 — Đơn Mua Hàng & Nhận Hàng (PO)
                </button>

                <button
                  onClick={() => setActiveSubmenuATab("bom_requisitions")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                    activeSubmenuATab === "bom_requisitions"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  S6.6/S6.7 — Xuất Kho BOM & Cấp Phát
                </button>

                <button
                  onClick={() => setActiveSubmenuATab("retail_exports")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                    activeSubmenuATab === "retail_exports"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  S6.14 — Xuất Kho Bán Lẻ (POS)
                </button>

                <button
                  onClick={() => setActiveSubmenuATab("ledger")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                    activeSubmenuATab === "ledger"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  Sổ Nhật Ký Xuất Nhập Tồn
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  <FileText className="h-4 w-4" /> Xuất Kho Thủ Công (S6.11)
                </button>

                <button
                  onClick={openAddItemDrawer}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Thêm Vật Tư Mới (S6.2)
                </button>
              </div>
            </div>

            {/* Filters for Tab 1 (Inventory List) */}
            {activeSubmenuATab === "inventory_list" && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                {/* 4 Category Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-stone-400 mr-1">Nhóm hàng:</span>
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                      categoryFilter === "all"
                        ? "bg-purple-900 text-white border-purple-900"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Tất cả ({items.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("commercial")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                      categoryFilter === "commercial"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Nhóm 1 — Thương Mại ({commercialCount})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("consumable")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                      categoryFilter === "consumable"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Nhóm 2 — Tiêu Hao ({consumableCount})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("tool")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                      categoryFilter === "tool"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Nhóm 3 — CCDC ({toolCount})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("spare_part")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                      categoryFilter === "spare_part"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Nhóm 4 — Phụ Tùng ({sparePartCount})
                  </button>
                </div>

                {/* Additional Filter Checkboxes & Search */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRetailFilter}
                      onChange={(e) => setHasRetailFilter(e.target.checked)}
                      className="h-3.5 w-3.5 text-purple-600 rounded"
                    />
                    <span>Chỉ hiện SKU "Có bán lẻ" ({retailCount})</span>
                  </label>

                  <div className="relative min-w-[200px]">
                    <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm Tên / Mã SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1 text-xs font-sans text-stone-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: DANH SÁCH TỒN KHO (S6.1) */}
          {activeSubmenuATab === "inventory_list" && (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Mã / Tên Vật Tư</th>
                      <th className="p-3.5">Nhóm Danh Mục</th>
                      <th className="p-3.5 text-center">Đơn Vị</th>
                      <th className="p-3.5 text-center">Tồn Khả Dụng</th>
                      <th className="p-3.5 text-right">Giá Vốn (Avg Cost)</th>
                      <th className="p-3.5 text-right">Giá Bán Bán Lẻ</th>
                      <th className="p-3.5 text-center">Thông Tin Đặc Thù (Khấu hao/CCDC)</th>
                      <th className="p-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-stone-400 text-xs">
                          Không tìm thấy vật tư phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isLow = item.quantity <= item.minThreshold;
                        const hasRetail = Boolean(item.salePrice && item.salePrice > 0);

                        return (
                          <tr key={item.id} className="hover:bg-purple-50/20 transition">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Package className="h-4 w-4 text-stone-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-stone-500 text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">
                                      {item.code || item.id}
                                    </span>
                                    {hasRetail && (
                                      <span className="bg-purple-100 text-purple-800 border border-purple-200 font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded">
                                        Có Bán Lẻ
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-extrabold text-slate-900 text-xs mt-0.5 hover:text-purple-600 cursor-pointer" onClick={() => openEditItemDrawer(item)}>
                                    {item.name}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                  item.category === "commercial"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.category === "consumable"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : item.category === "tool"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {item.category === "commercial"
                                  ? "Nhóm 1 Thương mại"
                                  : item.category === "consumable"
                                  ? "Nhóm 2 Tiêu hao"
                                  : item.category === "tool"
                                  ? "Nhóm 3 CCDC"
                                  : "Nhóm 4 Phụ tùng"}
                              </span>
                            </td>

                            <td className="p-3.5 text-center font-bold text-stone-600">
                              {item.unit}
                            </td>

                            <td className="p-3.5 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg ${
                                    isLow ? "bg-red-100 text-red-800 font-black animate-pulse" : "text-slate-900"
                                  }`}
                                >
                                  {item.quantity} {item.unit}
                                </span>
                                <span className="text-[10px] text-stone-400">Ngưỡng: {item.minThreshold}</span>
                              </div>
                            </td>

                            <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                              {formatVnd(item.avgCost || item.costPrice || item.pricePerUnit || 0)}
                            </td>

                            <td className="p-3.5 text-right">
                              {hasRetail ? (
                                <span className="font-mono font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                                  {formatVnd(item.salePrice!)}
                                </span>
                              ) : (
                                <span className="text-stone-400 italic text-[11px]">Dùng nội bộ</span>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              {item.category === "tool" ? (
                                <div className="text-[10px] space-y-0.5 text-left font-mono bg-stone-50 p-2 rounded-lg border border-stone-200">
                                  <p className="font-bold text-purple-900">Giá trị còn lại: {formatVnd(item.currentValue || item.originalValue || 0)}</p>
                                  <p className="text-stone-500">Khấu hao: {item.usefulLifeMonths || 24} tháng (từ {item.purchaseDate || "2025-01-01"})</p>
                                </div>
                              ) : item.category === "spare_part" && item.relatedToolName ? (
                                <div className="text-[10px] text-left font-mono bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900">
                                  <span className="font-bold">CCDC sửa chữa:</span> {item.relatedToolName}
                                </div>
                              ) : (
                                <span className="text-stone-400">—</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditItemDrawer(item)}
                                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer"
                                  title="Sửa thông tin SKU"
                                >
                                  <Edit3 className="h-4 w-4" />
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
          )}

          {/* TAB 2: ĐƠN MUA HÀNG PO & NHẬN HÀNG (S6.4 & S6.5) */}
          {activeSubmenuATab === "po_management" && (
            <PurchaseOrderManager
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              suppliers={suppliers}
              items={items}
              setItems={setItems}
              showToast={showToast}
              formatVnd={formatVnd}
            />
          )}

          {/* TAB 3: PHIẾU XUẤT KHO BOM & CẤP PHÁT (S6.6 & S6.7) */}
          {activeSubmenuATab === "bom_requisitions" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-purple-600" />
                    PHIẾU XUẤT KHO TỰ ĐỘNG THEO BỘ ĐỊNH MỨC BOM (S6.6 & S6.7)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hệ thống tự động sinh và tự xác nhận phiếu trừ kho khi Lệnh dịch vụ chốt. Phần vượt định mức cần Quản lý duyệt qua Telegram.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-xs">REQ-2026-0801 • WO-2026-881</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      Đã Xuất Kho Định Mức
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">Biển số xe: <strong>30H-889.12</strong> (Hạng xe: 7-9 chỗ/Bán tải) • KTV Nguyễn Tuấn Anh</p>

                  <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>WASSUP SOAP (20L)</span>
                      <span className="font-bold text-slate-900">350 ml (Chuẩn BOM)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đất sét 3M Claybar</span>
                      <span className="font-bold text-slate-900">1 cục (Chuẩn BOM)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-xs">REQ-2026-0802 • WO-2026-885</span>
                    <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      Có Đề Xuất Vượt Định Mức (S6.7)
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">Biển số xe: <strong>29A-554.33</strong> (Hạng xe: 4-5 chỗ) • KTV Vũ Đức Duy</p>

                  <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-amber-900 font-bold">
                      <span>WASSUP SOAP (20L)</span>
                      <span>400 ml (Định mức 250ml + Vượt 150ml)</span>
                    </div>
                    <p className="text-[11px] text-amber-800 italic">Lý do vượt: Xe bẩn bùn đất quá nặng phát sinh xịt rửa kép ca tối.</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => showToast("Đã duyệt xuất bổ sung vật tư vượt định mức!")}
                      className="flex-1 py-1.5 bg-emerald-600 text-white font-extrabold text-[11px] uppercase rounded-lg hover:bg-emerald-700 transition"
                    >
                      Duyệt Xuất Bổ Sung
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: XUẤT KHO BÁN LẺ POS (S6.14) */}
          {activeSubmenuATab === "retail_exports" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-4.5 w-4.5 text-purple-600" />
                    LỊCH SỬ XUẤT KHO BÁN LẺ TRỰC TIẾP TỪ POS (S6.14 - READ ONLY)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hệ thống tự động trừ kho 100% khi đơn bán lẻ tại Module 3 POS được tạo. Bất kỳ SKU nào có Giá bán (Nhóm 1–4) đều cho phép bán lẻ.
                  </p>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left font-sans">
                  <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Mã Đơn POS</th>
                      <th className="p-3">Sản Phẩm Bán Lẻ</th>
                      <th className="p-3 text-center">Số Lượng</th>
                      <th className="p-3 text-right">Đơn Giá Bán</th>
                      <th className="p-3 text-right">Thành Tiền</th>
                      <th className="p-3 text-center">Thời Gian Ex</th>
                      <th className="p-3 text-right">Người Bán (Thu Ngân)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr className="hover:bg-stone-50 font-mono">
                      <td className="p-3 font-bold text-slate-900">POS-2026-9901</td>
                      <td className="p-3 font-bold text-purple-900">Dầu bóng lốp xe Sonax Xtreme</td>
                      <td className="p-3 text-center font-bold">2 Chai</td>
                      <td className="p-3 text-right">{formatVnd(250000)}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-700">{formatVnd(500000)}</td>
                      <td className="p-3 text-center text-stone-500">Ca sáng hôm nay</td>
                      <td className="p-3 text-right text-stone-700 font-sans">Phạm Thu Trang (POS)</td>
                    </tr>
                    <tr className="hover:bg-stone-50 font-mono">
                      <td className="p-3 font-bold text-slate-900">POS-2026-9904</td>
                      <td className="p-3 font-bold text-purple-900">Chổi than cao cấp Rupes LHR15 (Nhóm 4)</td>
                      <td className="p-3 text-center font-bold">1 Cặp</td>
                      <td className="p-3 text-right">{formatVnd(150000)}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-700">{formatVnd(150000)}</td>
                      <td className="p-3 text-center text-stone-500">2 giờ trước</td>
                      <td className="p-3 text-right text-stone-700 font-sans">Phạm Thu Trang (POS)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SỔ NHẬT KÝ XUẤT NHẬP TỒN */}
          {activeSubmenuATab === "ledger" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <History className="h-4.5 w-4.5 text-purple-600" /> SỔ NHẬT KÝ XUẤT NHẬP TỒN (STOCK LEDGER)
              </h3>

              <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Thời Gian</th>
                      <th className="p-3">Tên Vật Tư</th>
                      <th className="p-3 text-center">Loại Thao Tác</th>
                      <th className="p-3 text-center">Biến Động</th>
                      <th className="p-3 text-center">Tồn Sau Biến Động</th>
                      <th className="p-3">Lý Do / Chứng Từ</th>
                      <th className="p-3 text-right">Thực Hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {ledger.map((row) => (
                      <tr key={row.id} className="hover:bg-stone-50">
                        <td className="p-3 text-stone-500">{new Date(row.date).toLocaleString("vi-VN")}</td>
                        <td className="p-3 font-bold text-slate-900 font-sans">{row.itemName}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              row.type === "import"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.type === "export"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {row.typeLabel}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-center font-bold ${
                            row.quantityChanged > 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {row.quantityChanged > 0 ? `+${row.quantityChanged}` : row.quantityChanged}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">{row.balanceAfter}</td>
                        <td className="p-3 text-stone-600 font-sans">{row.reason}</td>
                        <td className="p-3 text-right text-stone-500 font-sans">{row.actor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBMENU B: QUẢN LÝ NHÀ CUNG CẤP (S6.12 & S6.13) */}
      {activeSubmenu === "B" && (
        <SupplierManagement
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          purchaseOrders={purchaseOrders}
          showToast={showToast}
          formatVnd={formatVnd}
        />
      )}

      {/* SUBMENU C: KIỂM KHO ĐỊNH KỲ (S6.8 & S6.9) */}
      {activeSubmenu === "C" && (
        <StockCounting
          items={items as any}
          setItems={setItems as any}
          ledger={ledger}
          setLedger={setLedger}
          showToast={showToast}
        />
      )}

      {/* SUBMENU D: BÁO CÁO KHO (S6.10) */}
      {activeSubmenu === "D" && (
        <InventoryReports items={items as any} />
      )}

      {/* SUBMENU E: QUY TRÌNH PRD MODULE 6 */}
      {activeSubmenu === "E" && (
        <div className="space-y-6 animate-fadeIn">
          <PrdHandbook />
        </div>
      )}

      {/* MODAL / DRAWER S6.2: FORM THÊM / SỬA VẬT TƯ */}
      {showItemDrawer && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[999] flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col font-sans">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-purple-400" />
                <h3 className="font-black font-display text-sm uppercase tracking-wider">
                  {editingItem ? "SỬA THÔNG TIN VẬT TƯ (S6.2)" : "THÊM VẬT TƯ MỚI (S6.2)"}
                </h3>
              </div>
              <button
                onClick={() => setShowItemDrawer(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-stone-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Nhóm Danh Mục Vật Tư <span className="text-red-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="commercial">Nhóm 1 — Hàng thương mại (Bán lẻ / Phụ kiện)</option>
                  <option value="consumable">Nhóm 2 — Vật liệu tiêu hao (Dung dịch / Xi / Ceramic)</option>
                  <option value="tool">Nhóm 3 — Công cụ dụng cụ (Máy móc / Thiết bị)</option>
                  <option value="spare_part">Nhóm 4 — Phụ tùng thay thế (Sửa chữa CCDC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Mã Vật Tư / SKU
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Nhà Cung Cấp Mặc Định
                  </label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">-- Chọn nhà cung cấp --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Tên Vật Tư / Phụ Tùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dung dịch bọt tuyết WASSUP SOAP, Chổi than Rupes..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Đơn Vị Quản Lý (Tồn) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Can 20L, Chai, Cục, Bộ..."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Đơn Vị Tiêu Hao BOM
                  </label>
                  <input
                    type="text"
                    placeholder="VD: ml, gram, cái..."
                    value={formUsageUnit}
                    onChange={(e) => setFormUsageUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Số Lượng Tồn Ban Đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Ngưỡng Cảnh Báo Tồn Thấp
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                    Giá Vốn Nhập Kho (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 1200000"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold uppercase text-[10px] text-purple-900 block mb-1 flex items-center justify-between">
                    <span>Giá Bán Lẻ (POS ₫)</span>
                    <span className="text-[9px] text-purple-600 font-bold">Mọi nhóm optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Để trống = Không bán lẻ"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-purple-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Special Fields for Group 3 (Tools) */}
              {formCategory === "tool" && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
                  <span className="font-extrabold uppercase text-[10px] text-purple-900 block">
                    Thông Tin Khấu Hao CCDC (Nhóm 3)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-purple-900 font-bold block mb-1">Ngày mua máy:</span>
                      <input
                        type="date"
                        value={formPurchaseDate}
                        onChange={(e) => setFormPurchaseDate(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-lg p-2 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-900 font-bold block mb-1">Thời gian KH (tháng):</span>
                      <input
                        type="number"
                        min="1"
                        value={formUsefulLifeMonths}
                        onChange={(e) => setFormUsefulLifeMonths(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-lg p-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Special Fields for Group 4 (Spare Parts) */}
              {formCategory === "spare_part" && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <label className="font-extrabold uppercase text-[10px] text-amber-900 block">
                    Gắn Với CCDC Cụ Thể (Nhóm 3)
                  </label>
                  <select
                    value={formRelatedToolId}
                    onChange={(e) => setFormRelatedToolId(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="">-- Chọn CCDC/Máy móc mà phụ tùng này sửa chữa --</option>
                    {items
                      .filter((i) => i.category === "tool")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Link Ảnh Sản Phẩm (Crop 1:1)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowItemDrawer(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold uppercase text-[11px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold uppercase text-[11px] shadow-sm"
                >
                  Lưu Vật Tư (S6.2)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL STOCK EXPORT (S6.11) */}
      <ManualStockModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        items={items}
        onConfirmExport={handleConfirmManualExport}
        formatVnd={formatVnd}
      />

      {/* PRD HANDBOOK MODAL */}
      <PrdHandbook isOpen={showPrdModal} onClose={() => setShowPrdModal(false)} />
    </div>
  );
}
