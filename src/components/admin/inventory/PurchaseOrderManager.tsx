import React, { useState } from "react";
import SearchableSelect from "../../common/SearchableSelect";
import {
  Package,
  Plus,
  Truck,
  CheckCircle2,
  X,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
  DollarSign,
  ArrowRight,
  Search,
  Filter
} from "lucide-react";
import { Supplier, PurchaseOrder } from "./SupplierManagement";
import { InventoryItem } from "./ManualStockModal";

interface PurchaseOrderManagerProps {
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  suppliers: Supplier[];
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  showToast: (msg: string) => void;
  formatVnd: (val: number) => string;
}

export default function PurchaseOrderManager({
  purchaseOrders,
  setPurchaseOrders,
  suppliers,
  items,
  setItems,
  showToast,
  formatVnd,
}: PurchaseOrderManagerProps) {
  const [poFilter, setPoFilter] = useState<"all" | "draft" | "confirmed" | "received" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Create PO Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poNote, setPoNote] = useState("");
  const [poLines, setPoLines] = useState<
    { itemId: string; itemName: string; qtyOrdered: number; unitCost: number; unit: string }[]
  >([]);

  // Goods Receipt Modal State (S6.5)
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [receiptLines, setReceiptLines] = useState<
    {
      itemId: string;
      itemName: string;
      qtyOrdered: number;
      qtyReceived: number;
      unitCost: number;
      unit: string;
      discrepancyReason?: string;
    }[]
  >([]);

  // Open Create PO Modal
  const openCreateModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || "");
    setPoNote("");
    setPoLines([
      {
        itemId: items[0]?.id || "",
        itemName: items[0]?.name || "",
        qtyOrdered: 10,
        unitCost: items[0]?.avgCost || items[0]?.costPrice || 100000,
        unit: items[0]?.unit || "Cái",
      },
    ]);
    setShowCreateModal(true);
  };

  const handleAddLineToPo = () => {
    const firstItem = items[0];
    if (!firstItem) return;
    setPoLines([
      ...poLines,
      {
        itemId: firstItem.id,
        itemName: firstItem.name,
        qtyOrdered: 5,
        unitCost: firstItem.avgCost || firstItem.costPrice || 50000,
        unit: firstItem.unit,
      },
    ]);
  };

  const handleRemoveLineFromPo = (index: number) => {
    setPoLines(poLines.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, itemId: string) => {
    const found = items.find((i) => i.id === itemId);
    if (!found) return;
    const newLines = [...poLines];
    newLines[index] = {
      ...newLines[index],
      itemId: found.id,
      itemName: found.name,
      unit: found.unit,
      unitCost: found.avgCost || found.costPrice || newLines[index].unitCost,
    };
    setPoLines(newLines);
  };

  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast("Vui lòng chọn Nhà cung cấp!");
      return;
    }
    if (poLines.length === 0) {
      showToast("Đơn hàng PO phải có ít nhất 1 dòng sản phẩm!");
      return;
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    const newPo: PurchaseOrder = {
      id: "PO-2026-" + Math.floor(100 + Math.random() * 900),
      supplierId: selectedSupplierId,
      supplierName: sup ? sup.name : "Nhà cung cấp",
      status: "confirmed", // Default to confirmed to allow receipt
      createdBy: "Trần Minh Quân (Master Admin)",
      createdAt: new Date().toISOString(),
      note: poNote.trim() || undefined,
      lines: poLines,
    };

    const updated = [newPo, ...purchaseOrders];
    setPurchaseOrders(updated);
    localStorage.setItem("wassup_purchase_orders", JSON.stringify(updated));
    showToast(`Đã lập đơn mua hàng ${newPo.id} thành công!`);
    setShowCreateModal(false);
  };

  // Open Receive Goods Modal (S6.5)
  const openReceiveModal = (po: PurchaseOrder) => {
    setReceivingPo(po);
    setReceiptLines(
      po.lines.map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        qtyOrdered: l.qtyOrdered,
        qtyReceived: l.qtyOrdered, // Default equal
        unitCost: l.unitCost,
        unit: l.unit,
        discrepancyReason: undefined,
      }))
    );
  };

  // Confirm Goods Receipt (S6.5)
  const handleConfirmGoodsReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPo) return;

    // Check discrepancy reasons if qty received differs
    for (const line of receiptLines) {
      if (line.qtyReceived !== line.qtyOrdered && !line.discrepancyReason) {
        showToast(
          `Vui lòng chọn lý do chênh lệch cho sản phẩm "${line.itemName}" (${line.qtyReceived} thực nhận vs ${line.qtyOrdered} đặt)!`
        );
        return;
      }
    }

    // Update inventory stock & weighted average cost
    const updatedItems = [...items];
    let totalReceiptValue = 0;

    receiptLines.forEach((rLine) => {
      const idx = updatedItems.findIndex((i) => i.id === rLine.itemId);
      if (idx !== -1) {
        const oldQty = updatedItems[idx].quantity;
        const oldCost = updatedItems[idx].avgCost || updatedItems[idx].costPrice || 0;
        const newQty = oldQty + rLine.qtyReceived;

        // Weighted Average Cost formula:
        // avg_cost = (oldQty * oldCost + qtyReceived * unitCost) / newQty
        const newAvgCost = newQty > 0 ? Math.round((oldQty * oldCost + rLine.qtyReceived * rLine.unitCost) / newQty) : oldCost;

        updatedItems[idx] = {
          ...updatedItems[idx],
          quantity: newQty,
          avgCost: newAvgCost,
          costPrice: newAvgCost,
          lastUpdated: new Date().toISOString(),
        };
      }
      totalReceiptValue += rLine.qtyReceived * rLine.unitCost;
    });

    setItems(updatedItems);
    localStorage.setItem("wassup_inventory_items", JSON.stringify(updatedItems));

    // Update PO Status to received
    const updatedPos = purchaseOrders.map((po) =>
      po.id === receivingPo.id
        ? {
            ...po,
            status: "received" as const,
            lines: po.lines.map((l) => {
              const r = receiptLines.find((rl) => rl.itemId === l.itemId);
              return { ...l, qtyReceived: r ? r.qtyReceived : l.qtyOrdered };
            }),
          }
        : po
    );
    setPurchaseOrders(updatedPos);
    localStorage.setItem("wassup_purchase_orders", JSON.stringify(updatedPos));

    // Create Expense Payable (Module 3 financial liability)
    try {
      const storedExpenses = localStorage.getItem("wassup_expenses");
      const currentExpenses = storedExpenses ? JSON.parse(storedExpenses) : [];
      const newExpense = {
        id: "EXP-PO-" + Date.now(),
        station_id: "st-001",
        code: `PC-NCC-${receivingPo.id}`,
        title: `Thanh toán công nợ mua hàng PO ${receivingPo.id} - ${receivingPo.supplierName}`,
        category: "Mua hàng hóa / hóa chất",
        amount: totalReceiptValue,
        status: "pending", // "Chờ chi"
        supplier_id: receivingPo.supplierId,
        supplier_name: receivingPo.supplierName,
        po_id: receivingPo.id,
        created_at: new Date().toISOString(),
        created_by: "Hệ thống kho (S6.5 Auto)",
      };
      currentExpenses.push(newExpense);
      localStorage.setItem("wassup_expenses", JSON.stringify(currentExpenses));
    } catch (e) {}

    showToast(
      `Đã hoàn tất nhận hàng PO ${receivingPo.id}! Tồn kho và giá vốn bình quân gia quyền đã cập nhật.`
    );
    setReceivingPo(null);
  };

  const filteredPos = purchaseOrders.filter((po) => {
    const matchesFilter = poFilter === "all" || po.status === poFilter;
    const matchesSearch =
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="submenu-po">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Package className="h-4.5 w-4.5 text-blue-600" />
            ĐƠN MUA HÀNG (PO) & ĐỐI CHIẾU NHẬN HÀNG (S6.4 & S6.5)
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Lập PO gửi nhà cung cấp, kiểm tra đối chiếu khi hàng về, tự động tính giá vốn bình quân và ghi nhận công nợ.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Lập Đơn Mua Hàng (PO) Mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-stone-400">Trạng thái PO:</span>
          {(["all", "confirmed", "received", "draft", "cancelled"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setPoFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                poFilter === st
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              {st === "all"
                ? `Tất cả (${purchaseOrders.length})`
                : st === "confirmed"
                ? "Chờ Nhận Hàng"
                : st === "received"
                ? "Đã Hoàn Tất"
                : st === "draft"
                ? "Nháp"
                : "Đã Hủy"}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã PO / Nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* PO List Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPos.map((po) => {
          const totalVal = po.lines.reduce(
            (sum, l) => sum + (l.qtyReceived ?? l.qtyOrdered) * l.unitCost,
            0
          );
          return (
            <div
              key={po.id}
              className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div>
                  <span className="font-mono font-black text-slate-900 text-sm">{po.id}</span>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <Truck className="h-3 w-3 text-purple-600" /> {po.supplierName}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    po.status === "received"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : po.status === "confirmed"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {po.status === "received" ? "Đã Nhận Hàng (Hoàn tất)" : po.status === "confirmed" ? "Chờ Nhận Hàng" : po.status}
                </span>
              </div>

              {/* Lines summary */}
              <div className="bg-stone-50 p-3 rounded-xl space-y-1.5 font-mono text-xs">
                {po.lines.map((l, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold truncate max-w-[200px]">{l.itemName}</span>
                    <span className="text-stone-600">
                      {l.qtyReceived !== undefined ? `${l.qtyReceived}/${l.qtyOrdered}` : l.qtyOrdered} {l.unit} × {formatVnd(l.unitCost)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center font-extrabold text-slate-900">
                  <span>Tổng giá trị đơn:</span>
                  <span className="text-blue-700 text-sm">{formatVnd(totalVal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Lập bởi: {po.createdBy}</span>
                <span>{new Date(po.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>

              {/* Action */}
              {po.status === "confirmed" && (
                <button
                  onClick={() => openReceiveModal(po)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Đối Chiếu Nhận Hàng (S6.5)
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE PO MODAL (S6.4) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative font-sans text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
                LẬP ĐƠN MUA HÀNG PO MỚI (S6.4)
              </h3>
            </div>

            <form onSubmit={handleSavePo} className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Chọn Nhà Cung Cấp <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  required
                  value={selectedSupplierId}
                  onChange={(val) => setSelectedSupplierId(val)}
                  placeholder="-- Chọn nhà cung cấp --"
                  searchPlaceholder="Tìm kiếm nhà cung cấp..."
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                    sublabel: s.phone,
                  }))}
                />
              </div>

              {/* PO Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold uppercase text-[10px] text-stone-600 block">
                    Danh Sách Vật Tư Đặt Mua
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineToPo}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Thêm dòng
                  </button>
                </div>

                <div className="space-y-2">
                  {poLines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            value={line.itemId}
                            onChange={(val) => handleLineItemChange(idx, val)}
                            placeholder="-- Chọn vật tư mua --"
                            searchPlaceholder="Gõ để tìm tên vật tư..."
                            options={items.map((it) => ({
                              value: it.id,
                              label: it.name,
                              sublabel: `ĐVT: ${it.unit}`,
                            }))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineFromPo(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-stone-500">Số lượng đặt:</span>
                          <input
                            type="number"
                            min="1"
                            value={line.qtyOrdered}
                            onChange={(e) => {
                              const newL = [...poLines];
                              newL[idx].qtyOrdered = Number(e.target.value);
                              setPoLines(newL);
                            }}
                            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 font-mono font-bold text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500">Đơn giá dự kiến (₫):</span>
                          <input
                            type="number"
                            min="0"
                            value={line.unitCost}
                            onChange={(e) => {
                              const newL = [...poLines];
                              newL[idx].unitCost = Number(e.target.value);
                              setPoLines(newL);
                            }}
                            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 font-mono font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">Ghi chú PO</label>
                <input
                  type="text"
                  placeholder="VD: Nhập bổ sung hóa chất cho đợt khuyến mãi cuối tuần..."
                  value={poNote}
                  onChange={(e) => setPoNote(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold uppercase text-[11px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold uppercase text-[11px]"
                >
                  Xác Nhận Lập PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE GOODS MODAL (S6.5) */}
      {receivingPo && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative font-sans text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReceivingPo(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
                  NHẬN HÀNG THỰC TẾ & ĐỐI CHIẾU PO (S6.5) — {receivingPo.id}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Nhà cung cấp: <strong>{receivingPo.supplierName}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmGoodsReceipt} className="space-y-4 text-xs">
              <div className="space-y-3">
                {receiptLines.map((line, idx) => {
                  const hasDiscrepancy = line.qtyReceived !== line.qtyOrdered;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 border rounded-xl space-y-2.5 ${
                        hasDiscrepancy ? "bg-amber-50/50 border-amber-300" : "bg-stone-50 border-stone-200"
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>{line.itemName}</span>
                        <span className="font-mono text-stone-500">Đã đặt: {line.qtyOrdered} {line.unit}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-[10px] font-extrabold uppercase text-stone-600 block mb-1">
                            Số Lượng Thực Nhận:
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={line.qtyReceived}
                            onChange={(e) => {
                              const newLines = [...receiptLines];
                              newLines[idx].qtyReceived = Number(e.target.value);
                              setReceiptLines(newLines);
                            }}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold uppercase text-stone-600 block mb-1">
                            Đơn Giá Nhận Thực Tế (₫):
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={line.unitCost}
                            onChange={(e) => {
                              const newLines = [...receiptLines];
                              newLines[idx].unitCost = Number(e.target.value);
                              setReceiptLines(newLines);
                            }}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 font-mono font-bold text-xs text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      {hasDiscrepancy && (
                        <div className="pt-2 border-t border-amber-200 space-y-1">
                          <label className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Bắt buộc chọn lý do chênh lệch:
                          </label>
                          <SearchableSelect
                            required
                            value={line.discrepancyReason || ""}
                            onChange={(val) => {
                              const newLines = [...receiptLines];
                              newLines[idx].discrepancyReason = val;
                              setReceiptLines(newLines);
                            }}
                            placeholder="-- Chọn lý do chênh lệch --"
                            searchPlaceholder="Lọc lý do chênh lệch..."
                            options={[
                              { value: "Hàng lỗi / hư hỏng trong quá trình vận chuyển", label: "Hàng lỗi / Hư hỏng vận chuyển" },
                              { value: "Nhà cung cấp giao thiếu hàng", label: "Nhà cung cấp giao thiếu hàng" },
                              { value: "Nhà cung cấp giao thừa khuyến mãi", label: "Nhà cung cấp giao thừa khuyến mãi" },
                              { value: "Giao sai quy cách / không đúng mẫu", label: "Giao sai quy cách / Không đúng mẫu" },
                              { value: "Lý do khác", label: "Lý do khác" },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium">
                ⚡ <strong>Tự động sau khi bấm xác nhận:</strong> Tồn kho sẽ tăng theo số lượng thực nhận, Hệ thống tự động tính lại <strong>Giá vốn Bình quân Gia quyền (Weighted Avg Cost)</strong>, và tự động ghi nhận khoản công nợ chưa chi trong danh sách Phiếu Chi (Module 3).
              </div>

              <div className="pt-3 border-t border-stone-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReceivingPo(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold uppercase text-[11px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold uppercase text-[11px] shadow-sm"
                >
                  Xác Nhận Hoàn Tất Phiếu Nhập Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
