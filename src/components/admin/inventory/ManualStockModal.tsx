import React, { useState } from "react";
import SearchableSelect from "../../common/SearchableSelect";
import {
  FileText,
  X,
  AlertTriangle,
  Wrench,
  Package,
  CheckCircle2,
  Building2,
  DollarSign
} from "lucide-react";

export interface InventoryItem {
  id: string;
  code?: string;
  name: string;
  category: "commercial" | "consumable" | "tool" | "spare_part";
  categoryLabel: string;
  quantity: number;
  unit: string;
  usageUnit?: string;
  imageUrl?: string;
  minThreshold: number;
  costPrice?: number;
  avgCost?: number;
  pricePerUnit?: number;
  salePrice?: number | null;
  supplierId?: string;
  supplierName?: string;
  lastUpdated: string;
  purchaseDate?: string;
  usefulLifeMonths?: number;
  originalValue?: number;
  currentValue?: number;
  relatedToolItemId?: string;
  relatedToolName?: string;
}

export type ManualExportReason =
  | "retail_other"
  | "internal_use"
  | "damage"
  | "disposal"
  | "tool_maintenance"
  | "other";

export const MANUAL_REASON_LABELS: Record<ManualExportReason, string> = {
  retail_other: "Bán lẻ khác (Quà tặng VIP / Đổi trả)",
  internal_use: "Nội bộ (Sử dụng vận hành trạm)",
  damage: "Hỏng - Vỡ - Rơi rớt trong ca",
  disposal: "Thanh lý - Hết hạn xả bỏ",
  tool_maintenance: "Bảo trì CCDC (Dùng phụ tùng sửa máy)",
  other: "Lý do khác (Bắt buộc ghi chú)",
};

interface ManualStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onConfirmExport: (data: {
    itemId: string;
    qty: number;
    reason: ManualExportReason;
    reasonNote?: string;
    relatedToolItemId?: string;
  }) => void;
  formatVnd: (val: number) => string;
}

export default function ManualStockModal({
  isOpen,
  onClose,
  items,
  onConfirmExport,
  formatVnd,
}: ManualStockModalProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [reason, setReason] = useState<ManualExportReason>("internal_use");
  const [reasonNote, setReasonNote] = useState("");
  const [targetToolItemId, setTargetToolItemId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const toolItems = items.filter((i) => i.category === "tool");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedItemId) {
      setErrorMessage("Vui lòng chọn vật tư cần xuất kho!");
      return;
    }

    const qty = Number(qtyInput);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage("Số lượng xuất phải lớn hơn 0!");
      return;
    }

    if (!selectedItem) {
      setErrorMessage("Vật tư không hợp lệ!");
      return;
    }

    // HARD VALIDATION: Cannot export more than available stock
    if (qty > selectedItem.quantity) {
      setErrorMessage(
        `Số lượng xuất (${qty} ${selectedItem.unit}) vượt quá tồn kho khả dụng (${selectedItem.quantity} ${selectedItem.unit})! Hệ thống ngăn chặn xuất âm kho.`
      );
      return;
    }

    if (reason === "other" && !reasonNote.trim()) {
      setErrorMessage("Khi chọn lý do 'Khác', vui lòng điền nội dung ghi chú chi tiết!");
      return;
    }

    if (reason === "tool_maintenance" && selectedItem.category === "spare_part" && !targetToolItemId) {
      // Suggest tool item if available
    }

    onConfirmExport({
      itemId: selectedItemId,
      qty,
      reason,
      reasonNote: reasonNote.trim() || undefined,
      relatedToolItemId: reason === "tool_maintenance" ? targetToolItemId || undefined : undefined,
    });

    // Reset and close
    setSelectedItemId("");
    setQtyInput("");
    setReason("internal_use");
    setReasonNote("");
    setTargetToolItemId("");
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-stone-200 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative font-sans text-left space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-slate-800 transition cursor-pointer border-0"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
              LẬP PHIẾU XUẤT KHO THỦ CÔNG (S6.11)
            </h3>
            <p className="text-[11px] text-stone-500">
              Xuất kho cho mục đích Nội bộ, Hỏng-vỡ, Thanh lý, hoặc Bảo trì CCDC (Nội bộ / không gắn POS).
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2 animate-shake">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Material */}
          <div>
            <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
              Chọn Vật Tư / Phụ Tùng Xuất Kho <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              required
              value={selectedItemId}
              onChange={(val) => {
                setSelectedItemId(val);
                setErrorMessage(null);
              }}
              placeholder="-- Chọn vật tư (Nhóm 1 - 4) --"
              searchPlaceholder="Gõ tên hoặc mã vật tư để tìm nhanh..."
              options={items.map((item) => ({
                value: item.id,
                label: `[${item.code || item.id}] ${item.name}`,
                sublabel: `Tồn kho: ${item.quantity} ${item.unit}`,
              }))}
            />
          </div>

          {selectedItem && (
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between font-mono text-[11px]">
              <div>
                <span className="text-stone-500">Tồn kho khả dụng:</span>{" "}
                <strong className="text-slate-900 font-extrabold">{selectedItem.quantity} {selectedItem.unit}</strong>
              </div>
              <div>
                <span className="text-stone-500">Giá vốn hiện tại:</span>{" "}
                <strong className="text-emerald-700 font-extrabold">
                  {formatVnd(selectedItem.avgCost || selectedItem.costPrice || selectedItem.pricePerUnit || 0)}
                </strong>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
              Số Lượng Xuất <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="Nhập số lượng..."
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
              {selectedItem && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">
                  {selectedItem.unit}
                </span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
              Lý Do Xuất Kho Bắt Buộc <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={reason}
              onChange={(val) => setReason(val as ManualExportReason)}
              searchPlaceholder="Lọc lý do xuất kho..."
              options={(Object.keys(MANUAL_REASON_LABELS) as ManualExportReason[]).map((key) => ({
                value: key,
                label: MANUAL_REASON_LABELS[key],
              }))}
            />
          </div>

          {/* If Reason = Tool Maintenance */}
          {reason === "tool_maintenance" && (
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl space-y-2">
              <label className="font-extrabold uppercase text-[10px] text-purple-900 block flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-purple-600" /> Chọn CCDC / Máy Móc Sửa Chữa
              </label>
              <SearchableSelect
                value={targetToolItemId}
                onChange={(val) => setTargetToolItemId(val)}
                placeholder="-- Chọn CCDC/Máy móc được sửa chữa --"
                searchPlaceholder="Tìm kiếm CCDC..."
                options={toolItems.map((tool) => ({
                  value: tool.id,
                  label: tool.name,
                  sublabel: `Đơn vị: ${tool.unit}`,
                }))}
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
              Ghi Chú Chi Tiết {reason === "other" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={2}
              placeholder="Nhập chi tiết ghi chú đối chiếu..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold uppercase tracking-wider text-[11px] transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold uppercase tracking-wider text-[11px] transition shadow-sm cursor-pointer"
            >
              Xác Nhận Xuất Kho Thủ Công
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
