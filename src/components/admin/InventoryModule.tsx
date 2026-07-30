import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Briefcase
} from "lucide-react";
import { MarkdownTextarea, MarkdownRenderer } from "./shared/Markdown";

import StockCounting from "./inventory/StockCounting";
import InventoryReports from "./inventory/InventoryReports";
import PrdHandbook from "./inventory/PrdHandbook";

interface InventoryItem {
  id: string;
  name: string;
  category: "commercial" | "consumable" | "tool";
  categoryLabel: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  pricePerUnit: number;
  lastUpdated: string;
  // Depreciation details for tools
  purchaseDate?: string;
  usefulLifeMonths?: number;
  originalValue?: number;
  currentValue?: number;
}

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

const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: "inv-01",
    name: "Dầu bóng lốp xe Sonax Xtreme",
    category: "commercial",
    categoryLabel: "Sản phẩm thương mại",
    quantity: 45,
    unit: "Chai 500ml",
    minThreshold: 10,
    pricePerUnit: 250000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "inv-02",
    name: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP",
    category: "consumable",
    categoryLabel: "Vật tư tiêu hao",
    quantity: 8,
    unit: "Can 20L",
    minThreshold: 15,
    pricePerUnit: 1200000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "inv-03",
    name: "Đất sét tẩy ố bụi sơn 3M Claybar",
    category: "consumable",
    categoryLabel: "Vật tư tiêu hao",
    quantity: 12,
    unit: "Cục 200g",
    minThreshold: 5,
    pricePerUnit: 350000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "inv-04",
    name: "Máy xịt nước cao áp sấy gầm Karcher HD 6/15",
    category: "tool",
    categoryLabel: "Công cụ dụng cụ (Tools)",
    quantity: 4,
    unit: "Bộ máy",
    minThreshold: 2,
    pricePerUnit: 35000000,
    lastUpdated: new Date().toISOString(),
    purchaseDate: "2025-01-15",
    usefulLifeMonths: 36,
    originalValue: 140000000,
    currentValue: 120000000
  },
  {
    id: "inv-05",
    name: "Máy đánh bóng lệch tâm Rupes LHR15 Mark III",
    category: "tool",
    categoryLabel: "Công cụ dụng cụ (Tools)",
    quantity: 3,
    unit: "Máy",
    minThreshold: 1,
    pricePerUnit: 12500000,
    lastUpdated: new Date().toISOString(),
    purchaseDate: "2025-03-20",
    usefulLifeMonths: 24,
    originalValue: 37500000,
    currentValue: 31250000
  },
  {
    id: "inv-06",
    name: "Cầu nâng cắt kéo bọc gầm âm nền",
    category: "tool",
    categoryLabel: "Công cụ dụng cụ (Tools)",
    quantity: 2,
    unit: "Bộ cầu",
    minThreshold: 1,
    pricePerUnit: 65000000,
    lastUpdated: new Date().toISOString(),
    purchaseDate: "2024-11-05",
    usefulLifeMonths: 60,
    originalValue: 130000000,
    currentValue: 119166667
  }
];

const DEFAULT_LEDGER: StockLedgerRow[] = [
  {
    id: "lg-101",
    itemId: "inv-02",
    itemName: "Hóa chất bọt tuyết WASSUP SOAP",
    date: new Date(Date.now() - 86400000).toISOString(),
    type: "export",
    typeLabel: "Xuất kho sử dụng",
    quantityChanged: -2,
    balanceAfter: 8,
    actor: "Nguyễn Văn Hùng",
    reason: "Cấp phát cho Bay A và Bay B đầu ca sáng"
  },
  {
    id: "lg-102",
    itemId: "inv-01",
    itemName: "Dầu bóng lốp xe Sonax Xtreme",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: "import",
    typeLabel: "Nhập hàng từ nhà phân phối",
    quantityChanged: 20,
    balanceAfter: 45,
    actor: "Trần Thị D (Kế toán)",
    reason: "Hóa đơn nhập mua số #HD-908"
  }
];

export default function InventoryModule() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_inventory_items");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Map any legacy "equipment" to "tool" for complete safety
        return parsed.map((item: any) => ({
          ...item,
          category: item.category === "equipment" ? "tool" : item.category,
          categoryLabel: item.category === "equipment" ? "Công cụ dụng cụ (Tools)" : item.categoryLabel
        }));
      }
      return DEFAULT_ITEMS;
    } catch (e) {
      return DEFAULT_ITEMS;
    }
  });

  const [ledger, setLedger] = useState<StockLedgerRow[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_inventory_ledger");
      return cached ? JSON.parse(cached) : DEFAULT_LEDGER;
    } catch (e) {
      return DEFAULT_LEDGER;
    }
  });

  // State synchronization and alerts
  useEffect(() => {
    localStorage.setItem("wassup_inventory_items", JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("wassup-inventory-update", { detail: items }));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("wassup_inventory_ledger", JSON.stringify(ledger));
  }, [ledger]);

  // Synchronize from outside updates (e.g. Auto-BOM completed orders in other tabs/views)
  useEffect(() => {
    const handleOutsideUpdate = () => {
      try {
        const cachedItems = localStorage.getItem("wassup_inventory_items");
        if (cachedItems) {
          setItems(JSON.parse(cachedItems));
        }
        const cachedLedger = localStorage.getItem("wassup_inventory_ledger");
        if (cachedLedger) {
          setLedger(JSON.parse(cachedLedger));
        }
      } catch (e) {
        console.error("Error updating inventory from storage event:", e);
      }
    };
    
    window.addEventListener("wassup-inventory-update", handleOutsideUpdate);
    window.addEventListener("storage", handleOutsideUpdate);
    return () => {
      window.removeEventListener("wassup-inventory-update", handleOutsideUpdate);
      window.removeEventListener("storage", handleOutsideUpdate);
    };
  }, []);

  // Main navigation & filtering
  const [activeTab, setActiveTab] = useState<"all" | "commercial" | "consumable" | "tool">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "import" | "export" | "adjust">("all");

  // Right Side Panel Tabs
  const [activeActionTab, setActiveActionTab] = useState<"movement" | "depreciation" | "haophi">("movement");
  const [activeModuleTab, setActiveModuleTab] = useState<"inventory" | "counting" | "reports" | "prd">("inventory");

  // Add Material Modal Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"commercial" | "consumable" | "tool">("commercial");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemThreshold, setItemThreshold] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState("24");

  // Stock Movement Form State (for existing items)
  const [movementItemId, setMovementItemId] = useState("");
  const [movementType, setMovementType] = useState<"import" | "export" | "adjust">("import");
  const [movementQty, setMovementQty] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementActor, setMovementActor] = useState("Nguyễn Văn Hùng");

  // Tool Depreciation Edit Form State
  const [depEditItemId, setDepEditItemId] = useState("");
  const [depEditOriginalValue, setDepEditOriginalValue] = useState("");
  const [depEditUsefulLife, setDepEditUsefulLife] = useState("");
  const [depEditPurchaseDate, setDepEditPurchaseDate] = useState("");

  // Technical Consumption Form State
  const [compOrderCount, setCompOrderCount] = useState("15");
  const [compWassupSoap, setCompWassupSoap] = useState("0.5"); // Litres per wash
  const [calculatedConsumption, setCalculatedConsumption] = useState<number | null>(null);

  // Success message state (toast replacement)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Currency Formatter
  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  // Dynamic Dashboard Stats Calculators
  const totalCommercialValue = items
    .filter(i => i.category === "commercial")
    .reduce((sum, i) => sum + i.quantity * i.pricePerUnit, 0);

  const totalConsumableValue = items
    .filter(i => i.category === "consumable")
    .reduce((sum, i) => sum + i.quantity * i.pricePerUnit, 0);

  const totalToolsBookValue = items
    .filter(i => i.category === "tool")
    .reduce((sum, i) => sum + (i.currentValue !== undefined ? i.currentValue : (i.originalValue || i.quantity * i.pricePerUnit)), 0);

  const grandTotalAssetValue = totalCommercialValue + totalConsumableValue + totalToolsBookValue;

  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);

  const totalMonthlyDepreciation = items
    .filter(i => i.category === "tool")
    .reduce((sum, i) => {
      const orig = i.originalValue || (i.pricePerUnit * i.quantity);
      const life = i.usefulLifeMonths || 24;
      return sum + Math.round(orig / life);
    }, 0);

  // Filtered items list
  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === "all" || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Filtered ledger list
  const filteredLedger = ledger.filter(row => {
    return ledgerFilter === "all" || row.type === ledgerFilter;
  });

  // Form Submit Handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemQuantity || !itemUnit.trim() || !itemPrice) {
      showToast("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    const qty = Number(itemQuantity);
    const unitPrice = Number(itemPrice);
    const threshold = Number(itemThreshold) || 5;

    const newItem: InventoryItem = {
      id: "inv_" + Date.now(),
      name: itemName.trim(),
      category: selectedCategory,
      categoryLabel: selectedCategory === "commercial" ? "Sản phẩm thương mại" : selectedCategory === "consumable" ? "Vật tư tiêu hao" : "Công cụ dụng cụ (Tools)",
      quantity: qty,
      unit: itemUnit.trim(),
      minThreshold: threshold,
      pricePerUnit: unitPrice,
      lastUpdated: new Date().toISOString()
    };

    if (selectedCategory === "tool") {
      const origValue = qty * unitPrice;
      newItem.purchaseDate = purchaseDate;
      newItem.usefulLifeMonths = Number(usefulLifeMonths) || 24;
      newItem.originalValue = origValue;
      newItem.currentValue = origValue;
    }

    setItems([...items, newItem]);

    // Add row to Ledger
    const newLedgerRow: StockLedgerRow = {
      id: "lg_" + Date.now(),
      itemId: newItem.id,
      itemName: newItem.name,
      date: new Date().toISOString(),
      type: "import",
      typeLabel: "Khai báo nhập kho ban đầu",
      quantityChanged: qty,
      balanceAfter: qty,
      actor: "Nguyễn Văn Hùng",
      reason: `Khai báo nhập kho hệ thống (${newItem.categoryLabel})`
    };

    setLedger([newLedgerRow, ...ledger]);
    showToast(`Khai báo thành công vật tư: ${newItem.name}`);

    // Reset Form
    setItemName("");
    setItemQuantity("");
    setItemUnit("");
    setItemThreshold("");
    setItemPrice("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setUsefulLifeMonths("24");
    setShowAddModal(false);
  };

  const handleStockMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementItemId || !movementQty) {
      showToast("Vui lòng chọn vật tư và nhập số lượng!");
      return;
    }

    const qty = Number(movementQty);
    if (qty <= 0) {
      showToast("Số lượng điều chuyển phải lớn hơn 0!");
      return;
    }

    const targetItem = items.find(i => i.id === movementItemId);
    if (!targetItem) {
      showToast("Không tìm thấy vật tư được chọn!");
      return;
    }

    let change = qty;
    if (movementType === "export") {
      change = -qty;
    }

    const newQty = targetItem.quantity + change;
    if (newQty < 0) {
      showToast(`Số lượng tồn kho không đủ để xuất! Hiện tại chỉ còn: ${targetItem.quantity} ${targetItem.unit}`);
      return;
    }

    // Update item quantity & lastUpdated
    setItems(prevItems => prevItems.map(item => {
      if (item.id === movementItemId) {
        const updatedItem = {
          ...item,
          quantity: newQty,
          lastUpdated: new Date().toISOString()
        };
        // Re-scale original asset value for tools if quantity is adjusted directly
        if (item.category === "tool") {
          const ratio = item.quantity > 0 ? newQty / item.quantity : 1;
          updatedItem.originalValue = Math.round((item.originalValue || (item.pricePerUnit * item.quantity)) * ratio);
          updatedItem.currentValue = Math.round((item.currentValue !== undefined ? item.currentValue : (item.originalValue || (item.pricePerUnit * item.quantity))) * ratio);
        }
        return updatedItem;
      }
      return item;
    }));

    // Register Stock Ledger Row
    const newRow: StockLedgerRow = {
      id: "lg_" + Date.now(),
      itemId: targetItem.id,
      itemName: targetItem.name,
      date: new Date().toISOString(),
      type: movementType,
      typeLabel: movementType === "import" ? "Nhập kho bổ sung" : movementType === "export" ? "Xuất kho sử dụng" : "Điều chỉnh kho",
      quantityChanged: change,
      balanceAfter: newQty,
      actor: movementActor.trim() || "Thủ kho",
      reason: movementReason.trim() || (movementType === "import" ? "Nhập hàng định kỳ" : movementType === "export" ? "Cấp phát thi công" : "Khấu kiểm kê")
    };

    setLedger(prev => [newRow, ...prev]);
    showToast(`Đã hạch toán biến động kho cho: ${targetItem.name}`);

    // Reset Form
    setMovementQty("");
    setMovementReason("");
  };

  const handleRunAllDepreciation = () => {
    const toolItems = items.filter(i => i.category === "tool");
    if (toolItems.length === 0) {
      showToast("Không tìm thấy Công cụ dụng cụ nào trong danh mục!");
      return;
    }

    let totalExpense = 0;
    const timestamp = new Date().toISOString();

    const updatedItems = items.map(item => {
      if (item.category === "tool") {
        const orig = item.originalValue || (item.pricePerUnit * item.quantity);
        const life = item.usefulLifeMonths || 24;
        const monthlyDep = Math.round(orig / life);
        const curVal = item.currentValue !== undefined ? item.currentValue : orig;

        if (curVal <= 0) return item; // Already fully depreciated

        const nextVal = Math.max(curVal - monthlyDep, 0);
        const actualDep = curVal - nextVal;
        totalExpense += actualDep;

        const ledgerRow: StockLedgerRow = {
          id: `lg_dep_${item.id}_${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          date: timestamp,
          type: "adjust",
          typeLabel: "Khấu hao TSCĐ",
          quantityChanged: 0,
          balanceAfter: item.quantity,
          actor: "Hệ thống tự động",
          reason: `Trích khấu hao thẳng hàng tháng (-${formatVnd(actualDep)}) · Giá trị còn lại: ${formatVnd(nextVal)}`
        };

        // Inject delay to bypass concurrent state modifications
        setTimeout(() => {
          setLedger(prev => [ledgerRow, ...prev]);
        }, 50);

        return {
          ...item,
          currentValue: nextVal,
          lastUpdated: timestamp
        };
      }
      return item;
    });

    if (totalExpense === 0) {
      showToast("Toàn bộ máy móc & công cụ đã được khấu hao hết giá trị gốc!");
      return;
    }

    setItems(updatedItems);
    showToast(`Đã hạch toán khấu hao thành công! Tổng giá trị hao mòn tài sản: -${formatVnd(totalExpense)}`);
  };

  const handleUpdateDepreciationConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depEditItemId) {
      showToast("Vui lòng chọn Công cụ dụng cụ!");
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === depEditItemId) {
        const origVal = Number(depEditOriginalValue);
        const usefulLife = Number(depEditUsefulLife);
        return {
          ...item,
          originalValue: origVal,
          currentValue: Math.min(item.currentValue ?? origVal, origVal), // Ensure remaining value isn't above new original cost
          usefulLifeMonths: usefulLife,
          purchaseDate: depEditPurchaseDate,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));

    showToast("Đã cập nhật hồ sơ khấu hao thiết bị thành công!");
    setDepEditItemId("");
    setDepEditOriginalValue("");
    setDepEditUsefulLife("");
    setDepEditPurchaseDate("");
  };

  const handleCalculateHaoPhi = (e: React.FormEvent) => {
    e.preventDefault();
    const totalWashes = Number(compOrderCount) || 0;
    const ratePerWash = Number(compWassupSoap) || 0;
    const totalConsumed = totalWashes * ratePerWash;

    setCalculatedConsumption(totalConsumed);

    // Auto deduct soap can (20L per can) proportional to calculated soap usage
    const cansDeducted = Math.floor(totalConsumed / 20) || 1;

    setItems(prevItems => prevItems.map(item => {
      if (item.id === "inv-02") {
        const remaining = Math.max(item.quantity - cansDeducted, 0);

        const logRow: StockLedgerRow = {
          id: "lg_calc_" + Date.now(),
          itemId: item.id,
          itemName: item.name,
          date: new Date().toISOString(),
          type: "export",
          typeLabel: "Hao phí định mức",
          quantityChanged: -cansDeducted,
          balanceAfter: remaining,
          actor: "Hệ thống tự động",
          reason: `Auto-BOM: Trừ bọt tuyết tự động dựa trên số đơn hàng (${totalWashes} lượt xe x ${ratePerWash}L/lượt)`
        };

        setTimeout(() => setLedger(prev => [logRow, ...prev]), 50);

        return {
          ...item,
          quantity: remaining,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));

    showToast(`Đã tự động trừ bọt tuyết trong kho: -${cansDeducted} can 20L`);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;

    if (confirm(`Bạn có chắc chắn muốn xóa vật tư "${target.name}" hoàn toàn khỏi danh mục không?`)) {
      setItems(items.filter(i => i.id !== id));
      showToast(`Đã xóa thành công vật tư: ${target.name}`);
    }
  };

  // Pre-load depreciation editor when a tool is selected
  useEffect(() => {
    if (depEditItemId) {
      const selected = items.find(i => i.id === depEditItemId);
      if (selected) {
        setDepEditOriginalValue((selected.originalValue || (selected.pricePerUnit * selected.quantity)).toString());
        setDepEditUsefulLife((selected.usefulLifeMonths || 24).toString());
        setDepEditPurchaseDate(selected.purchaseDate || new Date().toISOString().split("T")[0]);
      }
    }
  }, [depEditItemId, items]);

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold"
          >
            <CheckCircle2 className="h-4 w-4 text-brand-green animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div>

          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">KHO VẬT TƯ & KHẤU HAO THIẾT BỊ</h1>
          <p className="text-mid-gray text-xs mt-1 font-sans">
            Giám sát nguyên vật liệu, sản phẩm thương mại, công cụ bãi rửa, và hạch toán hao mòn khấu hao tài sản hàng kỳ.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-matte-black text-white hover:bg-gray-900 text-xs font-extrabold font-display uppercase transition shadow-md cursor-pointer self-stretch sm:self-auto text-center justify-center"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          KHAI BÁO VẬT TƯ MỚI
        </button>
      </div>

      {/* MODULE TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row border border-[#e5e5e5] bg-white rounded-2xl p-2 shadow-xs gap-2">
        <button
          onClick={() => setActiveModuleTab("inventory")}
          className={`flex-1 py-3 text-center font-display font-black text-[10.5px] tracking-wider uppercase transition rounded-xl cursor-pointer ${
            activeModuleTab === "inventory" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "text-[#a5a5a5] hover:text-matte-black bg-stone-50 hover:bg-stone-100/50"
          }`}
        >
          💳 DANH MỤC THẺ KHO
        </button>
        <button
          onClick={() => setActiveModuleTab("counting")}
          className={`flex-1 py-3 text-center font-display font-black text-[10.5px] tracking-wider uppercase transition rounded-xl cursor-pointer ${
            activeModuleTab === "counting" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "text-[#a5a5a5] hover:text-matte-black bg-stone-50 hover:bg-stone-100/50"
          }`}
        >
          📋 KIỂM KHO ĐỊNH KỲ (AUDIT)
        </button>
        <button
          onClick={() => setActiveModuleTab("reports")}
          className={`flex-1 py-3 text-center font-display font-black text-[10.5px] tracking-wider uppercase transition rounded-xl cursor-pointer ${
            activeModuleTab === "reports" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "text-[#a5a5a5] hover:text-matte-black bg-stone-50 hover:bg-stone-100/50"
          }`}
        >
          📊 BÁO CÁO PHÂN TÍCH
        </button>
        <button
          onClick={() => setActiveModuleTab("prd")}
          className={`flex-1 py-3 text-center font-display font-black text-[10.5px] tracking-wider uppercase transition rounded-xl cursor-pointer ${
            activeModuleTab === "prd" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "text-[#a5a5a5] hover:text-matte-black bg-stone-50 hover:bg-stone-100/50"
          }`}
        >
          📕 QUY TRÌNH CHUẨN PRD
        </button>
      </div>

      {activeModuleTab === "inventory" && (
        <>
          {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: Total Asset value */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-mid-gray uppercase font-extrabold tracking-wider font-sans">TỔNG TRỊ GIÁ TÀI SẢN KHO</span>
            <span className="text-xl font-black text-matte-black block font-sans">{formatVnd(grandTotalAssetValue)}</span>
            <span className="text-[9px] text-forest-green font-sans block">Gồm cả khấu hao Công cụ dụng cụ</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-forest-green flex items-center justify-center border border-emerald-100 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* STAT 2: Alert Items */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-mid-gray uppercase font-extrabold tracking-wider font-sans">VẬT TƯ CẦN NHẬP GẤP</span>
            <span className="text-xl font-black block text-matte-black font-sans">
              {lowStockItems.length} <span className="text-xs font-sans text-mid-gray">mặt hàng</span>
            </span>
            <span className={`text-[9px] font-sans font-semibold block ${lowStockItems.length > 0 ? "text-red-500 animate-pulse" : "text-mid-gray"}`}>
              {lowStockItems.length > 0 ? "⚠️ Dưới ngưỡng an toàn" : "✓ Kho đạt trạng thái an toàn"}
            </span>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${
            lowStockItems.length > 0 ? "bg-red-50 border-red-100 text-red-500" : "bg-gray-50 border-gray-100 text-mid-gray"
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* STAT 3: Monthly depreciation expense */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-mid-gray uppercase font-extrabold tracking-wider font-sans">ƯỚC KHẤU HAO THÁNG</span>
            <span className="text-xl font-black text-matte-black block font-sans">-{formatVnd(totalMonthlyDepreciation)}</span>
            <span className="text-[9px] text-purple-600 font-sans block">Trích thẳng hàng tháng (Straight Line)</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        {/* STAT 4: Total stock movements */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-mid-gray uppercase font-extrabold tracking-wider font-sans">TẦN SUẤT BIẾN ĐỘNG KHO</span>
            <span className="text-xl font-black block text-matte-black font-sans">
              {ledger.length} <span className="text-xs font-sans text-mid-gray">lần giao dịch</span>
            </span>
            <span className="text-[9px] text-blue-600 font-sans block">Ghi nhận vào sổ thẻ kho thực tế</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <History className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* EMERGENCY WARNING OVERLAY */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-2xl space-y-3 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-red-900">🔔 PHÁT HIỆN HÓA CHẤT / VẬT TƯ CHẠM NGƯỠNG ĐỎ</h4>
              <p className="text-xs text-red-800 leading-snug mt-0.5 font-sans font-medium">
                Nguyên vật liệu dưới đây đã giảm sâu dưới hạn định mức tiêu chuẩn. Hệ thống đã gửi cảnh báo Telegram trực tiếp đến Master Admin để phê duyệt ngân sách mua bổ sung.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-red-200/50">
            {lowStockItems.map(item => (
              <span key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-red-600 font-black text-[10px] font-sans border border-red-200 shadow-sm">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
                {item.name}: Còn {item.quantity} {item.unit} (Hạn mức: {item.minThreshold})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TWO-COLUMN GRID WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: MAIN INVENTORY & LEDGER (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main List Box */}
          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-forest-green" />
                <h2 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">
                  THẺ KHO VẬT TƯ & THIẾT BỊ CHI TIẾT
                </h2>
              </div>

              {/* Category selector pills */}
              <div className="flex flex-wrap gap-1 bg-warm-white p-1 rounded-xl border border-[#e5e5e5]">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-display transition cursor-pointer ${
                    activeTab === "all" ? "bg-white text-matte-black shadow-xs" : "text-mid-gray hover:text-matte-black"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setActiveTab("commercial")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-display transition cursor-pointer ${
                    activeTab === "commercial" ? "bg-white text-matte-black shadow-xs" : "text-mid-gray hover:text-matte-black"
                  }`}
                >
                  Thương mại
                </button>
                <button
                  onClick={() => setActiveTab("consumable")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-display transition cursor-pointer ${
                    activeTab === "consumable" ? "bg-white text-matte-black shadow-xs" : "text-mid-gray hover:text-matte-black"
                  }`}
                >
                  Tiêu hao
                </button>
                <button
                  onClick={() => setActiveTab("tool")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-display transition cursor-pointer ${
                    activeTab === "tool" ? "bg-white text-matte-black shadow-xs" : "text-mid-gray hover:text-matte-black"
                  }`}
                >
                  Công cụ
                </button>
              </div>
            </div>

            {/* Search filter row */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bcbcbc]" />
              <input
                type="text"
                placeholder="Tìm kiếm vật tư theo tên, chủng loại hóa chất..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-warm-white/50 border border-[#e5e5e5] rounded-xl pl-10 pr-4 py-2.5 text-xs font-sans text-matte-black placeholder:text-[#a5a5a5] focus:outline-none focus:border-forest-green focus:bg-white transition"
              />
            </div>

            {/* Inventory Table Container */}
            <div className="overflow-x-auto border border-[#e5e5e5] rounded-xl">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5] font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Tên vật tư / Thiết bị</th>
                    <th className="p-4">Phân nhóm</th>
                    <th className="p-4 text-center">Tồn thực tế</th>
                    <th className="p-4 text-right">Đơn giá</th>
                    <th className="p-4 text-right">Giá trị sổ sách</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-mid-gray">
                        Không tìm thấy nguyên vật liệu nào khớp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const isLow = item.quantity <= item.minThreshold;
                      const bookValue = item.category === "tool"
                        ? (item.currentValue !== undefined ? item.currentValue : (item.originalValue || (item.quantity * item.pricePerUnit)))
                        : item.quantity * item.pricePerUnit;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-warm-white/40 transition ${
                            isLow ? "bg-red-500/5 text-red-900 font-medium" : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-sm text-matte-black block leading-snug">{item.name}</span>
                              <span className="text-[9px] text-[#a5a5a5] font-sans tracking-wider block uppercase">
                                ID: {item.id} {item.purchaseDate ? `· Nhập ngày ${new Date(item.purchaseDate).toLocaleDateString("vi-VN")}` : ""}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.category === "commercial" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              item.category === "consumable" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              "bg-purple-50 text-purple-700 border border-purple-100"
                            }`}>
                              {item.category === "commercial" ? <Tag className="h-2.5 w-2.5" /> :
                               item.category === "consumable" ? <Briefcase className="h-2.5 w-2.5" /> :
                               <Wrench className="h-2.5 w-2.5" />}
                              {item.category === "commercial" ? "Thương mại" :
                               item.category === "consumable" ? "Tiêu hao" :
                               "Công cụ"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-black ${isLow ? "text-red-600 font-extrabold" : "text-matte-black"}`}>
                                {item.quantity} {item.unit}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-wide mt-0.5 px-1.5 py-0.2 rounded-full ${
                                isLow ? "bg-red-100 text-red-800 animate-pulse" : "bg-gray-100 text-[#a5a5a5]"
                              }`}>
                                Min: {item.minThreshold}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-sans font-bold text-matte-black">
                            {formatVnd(item.pricePerUnit)}
                          </td>
                          <td className="p-4 text-right font-sans text-sm text-matte-black font-extrabold">
                            <div className="space-y-0.5">
                              <span className={item.category === "tool" ? "text-purple-700" : "text-forest-green"}>
                                {formatVnd(bookValue)}
                              </span>
                              {item.category === "tool" && item.originalValue && item.currentValue !== undefined && item.currentValue < item.originalValue && (
                                <span className="text-[9px] text-[#a5a5a5] block font-sans line-through decoration-red-400">
                                  {formatVnd(item.originalValue)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Direct action to quickly load into stock movement or edit depreciation if tool */}
                              <button
                                onClick={() => {
                                  setMovementItemId(item.id);
                                  if (item.category === "tool") {
                                    setDepEditItemId(item.id);
                                    setActiveActionTab("depreciation");
                                  } else {
                                    setActiveActionTab("movement");
                                  }
                                  showToast(`Đã nạp vật tư "${item.name}" vào bảng xử lý nhanh!`);
                                }}
                                className="p-1.5 rounded-lg border border-[#e5e5e5] hover:bg-matte-black hover:text-white transition cursor-pointer"
                                title="Nạp nhanh cấu hình/biến động"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 hover:text-red-600 text-mid-gray transition cursor-pointer"
                                title="Xóa vĩnh viễn"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

          {/* STOCK LEDGER TIMELINE HISTORY */}
          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-forest-green" />
                <h3 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">
                  SỔ THẺ KHO VẬT TƯ (TRANSACTION GENERAL LEDGER)
                </h3>
              </div>

              {/* Ledger filter pills */}
              <div className="flex bg-warm-white p-1 rounded-xl border border-[#e5e5e5]">
                <button
                  onClick={() => setLedgerFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase font-display transition cursor-pointer ${
                    ledgerFilter === "all" ? "bg-white text-matte-black" : "text-mid-gray"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setLedgerFilter("import")}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase font-display transition cursor-pointer ${
                    ledgerFilter === "import" ? "bg-white text-matte-black" : "text-mid-gray"
                  }`}
                >
                  Nhập kho
                </button>
                <button
                  onClick={() => setLedgerFilter("export")}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase font-display transition cursor-pointer ${
                    ledgerFilter === "export" ? "bg-white text-matte-black" : "text-mid-gray"
                  }`}
                >
                  Xuất kho
                </button>
                <button
                  onClick={() => setLedgerFilter("adjust")}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase font-display transition cursor-pointer ${
                    ledgerFilter === "adjust" ? "bg-white text-matte-black" : "text-mid-gray"
                  }`}
                >
                  Khấu hao
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#e5e5e5] rounded-xl max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5] font-extrabold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                    <th className="p-3.5">Thời gian</th>
                    <th className="p-3.5">Vật tư liên đới</th>
                    <th className="p-3.5">Phân loại</th>
                    <th className="p-3.5 text-center">Biến động</th>
                    <th className="p-3.5 text-center">Lũy kế tồn</th>
                    <th className="p-3.5">Thành viên hạch toán</th>
                    <th className="p-3.5 text-right">Lý do giao dịch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-mid-gray">
                        Sổ sách chưa ghi nhận giao dịch biến động nào.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(row => (
                      <tr key={row.id} className="hover:bg-warm-white/30 transition text-[11px]">
                        <td className="p-3.5 text-[#a5a5a5] font-sans">
                          {new Date(row.date).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-3.5 font-bold text-matte-black">{row.itemName}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            row.type === "import" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            row.type === "export" ? "bg-red-50 text-red-700 border border-red-100" :
                            "bg-purple-50 text-purple-700 border border-purple-100"
                          }`}>
                            {row.typeLabel}
                          </span>
                        </td>
                        <td className={`p-3.5 text-center font-black text-sm ${
                          row.quantityChanged > 0 ? "text-emerald-600" :
                          row.quantityChanged < 0 ? "text-red-500" :
                          "text-purple-600"
                        }`}>
                          {row.quantityChanged > 0 ? `+${row.quantityChanged}` :
                           row.quantityChanged < 0 ? row.quantityChanged : "0 (Val)"}
                        </td>
                        <td className="p-3.5 text-center font-black text-matte-black font-sans">
                          {row.balanceAfter}
                        </td>
                        <td className="p-3.5 font-semibold text-matte-black">{row.actor}</td>
                        <td className="p-3.5 text-right text-mid-gray max-w-[200px] truncate" title={row.reason}>
                          <MarkdownRenderer text={row.reason} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE ACTIONS & FORMS PANEL (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-green to-emerald-400" />

            <div className="flex border-b border-[#e5e5e5] -mx-5 px-5 bg-warm-white pb-3 pt-1">
              <button
                onClick={() => setActiveActionTab("movement")}
                className={`flex-1 pb-1 text-center font-display font-black text-[10px] tracking-wider uppercase transition cursor-pointer relative ${
                  activeActionTab === "movement" ? "text-forest-green" : "text-[#a5a5a5] hover:text-matte-black"
                }`}
              >
                BIẾN ĐỘNG KHO
                {activeActionTab === "movement" && (
                  <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-forest-green" />
                )}
              </button>
              <button
                onClick={() => setActiveActionTab("depreciation")}
                className={`flex-1 pb-1 text-center font-display font-black text-[10px] tracking-wider uppercase transition cursor-pointer relative ${
                  activeActionTab === "depreciation" ? "text-forest-green" : "text-[#a5a5a5] hover:text-matte-black"
                }`}
              >
                KHẤU HAO CCDC
                {activeActionTab === "depreciation" && (
                  <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-forest-green" />
                )}
              </button>
              <button
                onClick={() => setActiveActionTab("haophi")}
                className={`flex-1 pb-1 text-center font-display font-black text-[10px] tracking-wider uppercase transition cursor-pointer relative ${
                  activeActionTab === "haophi" ? "text-forest-green" : "text-[#a5a5a5] hover:text-matte-black"
                }`}
              >
                HAO PHÍ ĐỊNH MỨC
                {activeActionTab === "haophi" && (
                  <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-forest-green" />
                )}
              </button>
            </div>

            {/* TAB CONTENT PANEL */}
            <div>
              {/* TAB 1: STOCK MOVEMENT FORM */}
              {activeActionTab === "movement" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-xs text-matte-black uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-forest-green" />
                      GHI NHẬN BIẾN ĐỘNG SỐ LƯỢNG KHO
                    </h3>
                    <p className="text-[10px] text-mid-gray leading-normal font-sans">
                      Dùng khi xuất kho cấp phát trực tiếp cho kỹ thuật viên hoặc nhập mua hàng hóa thương mại bổ sung không qua khai báo mới.
                    </p>
                  </div>

                  <form onSubmit={handleStockMovementSubmit} className="space-y-3 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase text-mid-gray">Vật tư điều chỉnh</label>
                      <select
                        required
                        value={movementItemId}
                        onChange={(e) => setMovementItemId(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
                      >
                        <option value="">-- Chọn một vật tư trong kho --</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.quantity} {i.unit} còn tồn)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase text-mid-gray">Hình thức biến động</label>
                        <div className="flex gap-1.5 bg-warm-white p-1 rounded-xl border border-[#e5e5e5]">
                          <button
                            type="button"
                            onClick={() => setMovementType("import")}
                            className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase text-center cursor-pointer transition ${
                              movementType === "import" ? "bg-white text-emerald-700 shadow-xs" : "text-[#a5a5a5]"
                            }`}
                          >
                            Nhập kho
                          </button>
                          <button
                            type="button"
                            onClick={() => setMovementType("export")}
                            className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase text-center cursor-pointer transition ${
                              movementType === "export" ? "bg-white text-red-600 shadow-xs" : "text-[#a5a5a5]"
                            }`}
                          >
                            Xuất kho
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase text-mid-gray">Số lượng giao dịch</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Nhập số lượng..."
                          value={movementQty}
                          onChange={(e) => setMovementQty(e.target.value)}
                          className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-xs text-matte-black focus:outline-none focus:border-forest-green"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase text-mid-gray">Nhân sự thực hiện hạch toán</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn Hùng"
                        value={movementActor}
                        onChange={(e) => setMovementActor(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase text-mid-gray">Lý do điều chuyển chi tiết</label>
                      <MarkdownTextarea
                        id="inventory-movement-reason"
                        placeholder="Ghi rõ số hóa đơn nhập hoặc tên kỹ thuật nhận bọt tuyết..."
                        value={movementReason}
                        onChange={(val) => setMovementReason(val)}
                        rows={2}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold text-xs font-display uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Activity className="h-4 w-4" />
                      HẠCH TOÁN SỔ THẺ KHO
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: ASSETS DEPRECIATION MANAGER */}
              {activeActionTab === "depreciation" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-xs text-matte-black uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-purple-600" />
                      QUẢN LÝ KHẤU HAO CCDC CHI TIẾT
                    </h3>
                    <p className="text-[10px] text-mid-gray leading-normal font-sans">
                      Theo dõi độ hao mòn vật lý của máy móc bãi xe. Nhấn nút bên dưới để hạch toán khấu hao thẳng hàng tháng đồng loạt cho mọi máy móc.
                    </p>
                  </div>

                  {/* Master Trigger Button */}
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center space-y-3.5 shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#a5a5a5] font-extrabold uppercase tracking-widest block font-sans">Giá trị tài sản ước tính hao mòn kỳ này</span>
                      <strong className="text-xl font-sans font-black text-purple-700 block">
                        -{formatVnd(totalMonthlyDepreciation)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunAllDepreciation}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-[10px] font-display uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                      CHẠY KHẤU HAO THÁNG NÀY
                    </button>
                  </div>

                  {/* Individual tool config modification form */}
                  <div className="pt-2 border-t border-[#e5e5e5] space-y-3">
                    <h4 className="font-display font-extrabold text-[10.5px] text-matte-black uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-mid-gray" />
                      CẤU HÌNH KHẤU HAO RIÊNG LẺ
                    </h4>

                    <form onSubmit={handleUpdateDepreciationConfig} className="space-y-3 text-xs font-sans">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase text-mid-gray">Chọn thiết bị cần điều chỉnh</label>
                        <select
                          value={depEditItemId}
                          onChange={(e) => setDepEditItemId(e.target.value)}
                          className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none"
                        >
                          <option value="">-- Chọn một công cụ --</option>
                          {items.filter(i => i.category === "tool").map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} (Gốc: {formatVnd(i.originalValue || (i.pricePerUnit * i.quantity))})
                            </option>
                          ))}
                        </select>
                      </div>

                      {depEditItemId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-3"
                        >
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold uppercase text-mid-gray">Nguyên giá gốc tài sản (VND)</label>
                            <input
                              type="number"
                              required
                              value={depEditOriginalValue}
                              onChange={(e) => setDepEditOriginalValue(e.target.value)}
                              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-extrabold uppercase text-mid-gray">Số tháng sử dụng hữu ích</label>
                              <input
                                type="number"
                                required
                                value={depEditUsefulLife}
                                onChange={(e) => setDepEditUsefulLife(e.target.value)}
                                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-extrabold uppercase text-mid-gray">Ngày đưa vào vận hành</label>
                              <input
                                type="date"
                                required
                                value={depEditPurchaseDate}
                                onChange={(e) => setDepEditPurchaseDate(e.target.value)}
                                className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-matte-black text-white text-[10px] font-extrabold font-display uppercase tracking-wide rounded-xl transition cursor-pointer"
                          >
                            LƯU HỒ SƠ KHẤU HAO
                          </button>
                        </motion.div>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: TECHNICAL CONSUMPTION / AUTO-BOM */}
              {activeActionTab === "haophi" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-xs text-matte-black uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-forest-green" />
                      HAO PHÍ ĐỊNH MỨC KỸ THUẬT (AUTO-BOM)
                    </h3>
                    <p className="text-[10px] text-mid-gray leading-normal font-sans">
                      Khớp số lượt thi công thực tế với định lượng sử dụng hóa chất tiêu chuẩn, hệ thống tự động hạch toán xuất kho bọt tuyết SOAP can 20L khi tích lũy tiêu hao vượt định mức.
                    </p>
                  </div>

                  <form onSubmit={handleCalculateHaoPhi} className="space-y-3 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase text-mid-gray">Tổng lượt xe thi công hoàn thành thực tế</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={compOrderCount}
                        onChange={(e) => setCompOrderCount(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase text-mid-gray">Hạn định mức xà phòng tiêu chuẩn (Lít / Lượt xe)</label>
                      <input
                        type="text"
                        required
                        value={compWassupSoap}
                        onChange={(e) => setCompWassupSoap(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold text-xs font-display uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Activity className="h-4 w-4" />
                      TÍNH HAO PHÍ & TRỪ KHO
                    </button>
                  </form>

                  {calculatedConsumption !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5 font-sans"
                    >
                      <span className="text-[8px] text-forest-green font-black block uppercase tracking-wider">Hạch toán hao phí tự động</span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-mid-gray font-medium">Hóa chất bọt bọt bạt lý thuyết:</span>
                        <strong className="text-matte-black font-sans">{calculatedConsumption.toFixed(1)} Lít</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-mid-gray font-medium">Đổi can tương đương trừ kho:</span>
                        <strong className="text-red-600 font-sans">-{Math.floor(calculatedConsumption / 20) || 1} Can (20L)</strong>
                      </div>
                      <p className="text-[9px] text-[#a5a5a5] leading-normal pt-1 border-t border-emerald-100/50">
                        * Thẻ kho bọt tuyết WASSUP SOAP (can 20L) đã được cập nhật lùi tồn kho tương đương trên bảng hệ thống.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {activeModuleTab === "counting" && (
        <StockCounting 
          items={items} 
          setItems={setItems} 
          ledger={ledger} 
          setLedger={setLedger} 
          showToast={showToast} 
        />
      )}

      {activeModuleTab === "reports" && (
        <InventoryReports items={items} />
      )}

      {activeModuleTab === "prd" && (
        <PrdHandbook />
      )}

      {/* CREATE NEW ITEM DRAWER (SLIDES FROM RIGHT) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] overflow-hidden" id="inventory-add-drawer">
            {/* Backdrop with fade transition */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-matte-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Sliding Drawer Panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 240, mass: 0.9 }}
                className="w-screen max-w-md md:max-w-xl bg-white border-l border-[#e5e5e5] shadow-2xl flex flex-col h-full overflow-hidden"
              >
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between bg-stone-50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-forest-green/10 rounded-xl">
                      <Boxes className="h-5 w-5 text-forest-green" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black font-display tracking-wider text-matte-black uppercase">
                        KHAI BÁO VẬT TƯ MỚI
                      </h3>
                      <p className="text-[10px] text-mid-gray font-sans mt-0.5">
                        Thêm mặt hàng mới vào danh mục thẻ kho hệ thống
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-xl text-mid-gray hover:text-matte-black hover:bg-stone-200/50 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Form Body (Scrollable) */}
                <form onSubmit={handleAddItem} className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 font-sans text-xs">
                    
                    {/* ROW 1: Phân nhóm vật tư tài sản */}
                    <div className="space-y-2 pb-2 border-b border-stone-100">
                      <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold tracking-wider block">
                        Phân nhóm vật tư tài sản *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("commercial")}
                          className={`py-3 rounded-xl border font-extrabold font-display uppercase tracking-wider text-[10px] cursor-pointer transition text-center ${
                            selectedCategory === "commercial" 
                              ? "bg-matte-black text-white border-matte-black shadow-xs" 
                              : "bg-white border-[#e5e5e5] text-[#a5a5a5] hover:bg-warm-white"
                          }`}
                        >
                          Thương mại
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("consumable")}
                          className={`py-3 rounded-xl border font-extrabold font-display uppercase tracking-wider text-[10px] cursor-pointer transition text-center ${
                            selectedCategory === "consumable" 
                              ? "bg-matte-black text-white border-matte-black shadow-xs" 
                              : "bg-white border-[#e5e5e5] text-[#a5a5a5] hover:bg-warm-white"
                          }`}
                        >
                          Tiêu hao
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("tool")}
                          className={`py-3 rounded-xl border font-extrabold font-display uppercase tracking-wider text-[10px] cursor-pointer transition text-center ${
                            selectedCategory === "tool" 
                              ? "bg-matte-black text-white border-matte-black shadow-xs" 
                              : "bg-white border-[#e5e5e5] text-[#a5a5a5] hover:bg-warm-white"
                          }`}
                        >
                          Công cụ (CCDC)
                        </button>
                      </div>
                      <p className="text-[10px] text-mid-gray italic mt-1">
                        {selectedCategory === "commercial" && "• Mặt hàng bán trực tiếp cho khách hàng (Khăn, tinh dầu, sáp, phụ kiện...)"}
                        {selectedCategory === "consumable" && "• Vật tư kỹ thuật dùng cho thi công dịch vụ rửa xe/detailing (Hóa chất, xà bông...)"}
                        {selectedCategory === "tool" && "• Thiết bị, máy móc bãi xe có tính khấu hao tài sản cố định hàng kỳ"}
                      </p>
                    </div>

                    {/* ROW 2: Tên vật tư */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold tracking-wider block">
                        Tên vật tư / Tên máy móc thiết bị *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Dung dịch tẩy lazang đĩa phanh 3D GLIDE..."
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-3 text-xs text-matte-black focus:outline-none focus:border-forest-green transition-colors"
                      />
                    </div>

                    {/* ROW 3: Đơn vị tính */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold tracking-wider block">
                        Đơn vị tính (UOM) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Chai 500ml, Can 5L, Máy, Chiếc, Bộ..."
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-3 text-xs text-matte-black focus:outline-none focus:border-forest-green transition-colors"
                      />
                    </div>

                    {/* ROW 4: Đơn giá nhập */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold tracking-wider block">
                        Đơn giá nhập hàng gốc (VND) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="Ví dụ: 125000"
                          value={itemPrice}
                          onChange={(e) => setItemPrice(e.target.value)}
                          className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-3.5 pr-12 py-3 text-xs text-matte-black focus:outline-none focus:border-forest-green transition-colors font-sans font-bold"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mid-gray font-bold text-[10px] uppercase">
                          VND
                        </span>
                      </div>
                    </div>

                    {/* ROW 5: Số lượng ban đầu */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold tracking-wider block">
                        Số lượng nhập kho ban đầu *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ví dụ: 10"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-3 text-xs text-matte-black focus:outline-none focus:border-forest-green transition-colors font-sans font-bold"
                      />
                    </div>

                    {/* ROW 6: Ngưỡng cảnh báo tồn tối thiểu */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans text-[#a5a5a5] uppercase font-extrabold tracking-wider block">
                        Ngưỡng cảnh báo tồn tối thiểu *
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Mặc định cảnh báo khi dưới: 5"
                        value={itemThreshold}
                        onChange={(e) => setItemThreshold(e.target.value)}
                        className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-3 text-xs text-matte-black focus:outline-none focus:border-forest-green transition-colors font-sans"
                      />
                    </div>

                    {/* ROW 7: Depreciation settings if CCDC/Tool */}
                    {selectedCategory === "tool" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50/75 p-4 rounded-2xl border border-purple-100 space-y-4"
                      >
                        <span className="text-[9px] text-purple-800 font-black uppercase tracking-widest block">
                          ⚙ CẤU HÌNH TRÍCH KHẤU HAO THIẾT BỊ
                        </span>

                        <div className="space-y-3">
                          {/* Sub-row 1: Useful Life */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-sans text-purple-900 uppercase font-extrabold block">
                              Số tháng sử dụng ước tính (Tháng)
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={usefulLifeMonths}
                              onChange={(e) => setUsefulLifeMonths(e.target.value)}
                              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-purple-500 font-sans"
                            />
                          </div>

                          {/* Sub-row 2: Purchase Date */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-sans text-purple-900 uppercase font-extrabold block">
                              Ngày mua đưa vào sử dụng
                            </label>
                            <input
                              type="date"
                              required
                              value={purchaseDate}
                              onChange={(e) => setPurchaseDate(e.target.value)}
                              className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs text-matte-black focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ROW 8: Dynamic Total Cost (BOLD Highlight) */}
                    <div className="bg-stone-50 border border-[#e5e5e5] p-4 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-mid-gray text-[10px] uppercase font-extrabold tracking-wider">
                        <span>Giá trị nhập kho ban đầu</span>
                        <span>Tạm tính</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-sans text-slate-500 font-medium">
                          {itemQuantity ? `${itemQuantity} ${itemUnit || "đơn vị"}` : "0 đơn vị"} × {itemPrice ? formatVnd(Number(itemPrice)) : "0đ"}
                        </span>
                        <span className="text-lg font-black text-slate-900 font-sans tracking-tight">
                          {formatVnd((Number(itemPrice) || 0) * (Number(itemQuantity) || 0))}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-slate-800 text-xs font-black uppercase tracking-wide">
                        <span>TỔNG TIỀN THANH TOÁN GỐC:</span>
                        <span className="text-xl font-extrabold text-forest-green font-sans">
                          {formatVnd((Number(itemPrice) || 0) * (Number(itemQuantity) || 0))}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Drawer Footer (Sticky bottom) */}
                  <div className="border-t border-[#e5e5e5] bg-stone-50 p-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-mid-gray bg-white hover:bg-stone-100/50 transition text-xs font-extrabold font-display uppercase cursor-pointer text-center"
                    >
                      HỦY BỎ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white font-extrabold transition text-xs font-display uppercase shadow-md cursor-pointer text-center"
                    >
                      TẠO MỚI & NHẬP KHO
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
