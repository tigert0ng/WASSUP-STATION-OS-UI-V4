import React, { useState } from "react";
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Search,
  Check
} from "lucide-react";

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

interface AuditSheet {
  id: string;
  date: string;
  actor: string;
  itemsAudited: {
    itemId: string;
    itemName: string;
    bookQty: number;
    actualQty: number;
    difference: number;
    reason: string;
    unit: string;
  }[];
}

interface StockCountingProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  ledger: StockLedgerRow[];
  setLedger: React.Dispatch<React.SetStateAction<StockLedgerRow[]>>;
  showToast: (msg: string) => void;
}

const INITIAL_AUDITS: AuditSheet[] = [
  {
    id: "AUD-2026-001",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    actor: "Nguyễn Văn Hùng (Thủ kho)",
    itemsAudited: [
      {
        itemId: "inv-01",
        itemName: "Dầu bóng lốp xe Sonax Xtreme",
        bookQty: 45,
        actualQty: 45,
        difference: 0,
        reason: "Khớp hoàn toàn dữ liệu sổ sách",
        unit: "Chai 500ml"
      },
      {
        itemId: "inv-03",
        itemName: "Đất sét tẩy ố bụi sơn 3M Claybar",
        bookQty: 13,
        actualQty: 12,
        difference: -1,
        reason: "Kỹ thuật viên làm vỡ vụn hỏng trong ca làm",
        unit: "Cục 200g"
      }
    ]
  }
];

export default function StockCounting({ items, setItems, ledger, setLedger, showToast }: StockCountingProps) {
  const [audits, setAudits] = useState<AuditSheet[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_inventory_audits");
      return cached ? JSON.parse(cached) : INITIAL_AUDITS;
    } catch (e) {
      return INITIAL_AUDITS;
    }
  });

  // State saving
  const saveAudits = (newAudits: AuditSheet[]) => {
    setAudits(newAudits);
    localStorage.setItem("wassup_inventory_audits", JSON.stringify(newAudits));
  };

  // Form states
  const [actorName, setActorName] = useState("Nguyễn Văn Hùng");
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Pending line items in the active counting form
  const [formItemId, setFormItemId] = useState("");
  const [formActualQty, setFormActualQty] = useState("");
  const [formReason, setFormReason] = useState("");
  
  const [activeLines, setActiveLines] = useState<{
    itemId: string;
    itemName: string;
    bookQty: number;
    actualQty: number;
    difference: number;
    reason: string;
    unit: string;
  }[]>([]);

  const selectedItemData = items.find(i => i.id === formItemId);

  // Add a line item to current draft counting sheet
  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemId || formActualQty === "") {
      showToast("Vui lòng chọn mặt hàng và nhập số lượng kiểm đếm thực tế!");
      return;
    }

    if (activeLines.some(l => l.itemId === formItemId)) {
      showToast("Mặt hàng này đã tồn tại trong phiếu kiểm kê nháp!");
      return;
    }

    const book = selectedItemData ? selectedItemData.quantity : 0;
    const actual = Number(formActualQty);
    const diff = actual - book;

    const newLine = {
      itemId: formItemId,
      itemName: selectedItemData ? selectedItemData.name : "",
      bookQty: book,
      actualQty: actual,
      difference: diff,
      reason: formReason.trim() || (diff === 0 ? "Khớp dữ liệu" : "Chưa rõ lý do hao hụt"),
      unit: selectedItemData ? selectedItemData.unit : ""
    };

    setActiveLines([...activeLines, newLine]);
    
    // Reset item inputs
    setFormItemId("");
    setFormActualQty("");
    setFormReason("");
  };

  // Remove a line from draft
  const handleRemoveLine = (idx: number) => {
    setActiveLines(activeLines.filter((_, i) => i !== idx));
  };

  // Submit complete audit sheet
  const handleSubmitAuditSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeLines.length === 0) {
      showToast("Vui lòng thêm ít nhất một mặt hàng để chốt phiếu kiểm đếm!");
      return;
    }

    const newSheet: AuditSheet = {
      id: "AUD-2026-" + Math.floor(100 + Math.random() * 900),
      date: new Date(auditDate).toISOString(),
      actor: actorName,
      itemsAudited: activeLines
    };

    // Update quantities in main inventory items
    const updatedItems = items.map(item => {
      const audited = activeLines.find(al => al.itemId === item.id);
      if (audited) {
        return {
          ...item,
          quantity: audited.actualQty,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    });

    setItems(updatedItems);

    // Create Ledger transactions for any discrepancies (where difference !== 0)
    const newLedgerRows: StockLedgerRow[] = [];
    activeLines.forEach(line => {
      if (line.difference !== 0) {
        newLedgerRows.push({
          id: "lg_aud_" + Date.now() + "_" + Math.floor(Math.random() * 100),
          itemId: line.itemId,
          itemName: line.itemName,
          date: new Date().toISOString(),
          type: "adjust",
          typeLabel: "Điều chỉnh kiểm kê",
          quantityChanged: line.difference,
          balanceAfter: line.actualQty,
          actor: actorName,
          reason: `[KIỂM KHO ĐỊNH KỲ] ${line.reason}`
        });
      }
    });

    if (newLedgerRows.length > 0) {
      setLedger(prev => [...newLedgerRows, ...prev]);
    }

    // Save audit sheet
    saveAudits([newSheet, ...audits]);
    
    // Clear draft form
    setActiveLines([]);
    showToast(`Đã lưu phiếu kiểm kê ${newSheet.id} và cập nhật tồn kho sổ sách thành công!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Form Lập Phiếu Kiểm Kê (3/5) */}
        <div className="lg:col-span-3 bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-forest-green" />
            <h3 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">
              LẬP PHIẾU KIỂM KÊ KHO ĐỊNH KỲ
            </h3>
          </div>

          <form onSubmit={handleSubmitAuditSheet} className="space-y-4 font-sans text-xs">
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Người thực hiện kiểm kê</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={actorName}
                    onChange={(e) => setActorName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-slate-500">Ngày chốt kiểm kê</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Input Line Form */}
            <div className="bg-white border border-[#e5e5e5] p-4 rounded-xl space-y-3">
              <h4 className="font-display font-extrabold text-[10.5px] text-slate-900 uppercase tracking-wider">
                Thêm mặt hàng cần kiểm đếm
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[8px] font-extrabold text-slate-400 uppercase">Chọn SKU vật tư</label>
                  <select
                    value={formItemId}
                    onChange={(e) => setFormItemId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-950"
                  >
                    <option value="">-- Chọn một mặt hàng --</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} {item.unit} sổ sách)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-extrabold text-slate-400 uppercase">Tồn thực tế</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="0"
                      value={formActualQty}
                      onChange={(e) => setFormActualQty(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-950"
                    />
                    {selectedItemData && (
                      <span className="text-[9px] text-slate-500 whitespace-nowrap font-medium">{selectedItemData.unit}</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedItemData && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] bg-stone-50 p-2.5 rounded-lg border border-stone-150">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px]">Tồn sổ sách:</span>
                    <strong className="text-slate-900 text-xs">{selectedItemData.quantity} {selectedItemData.unit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px]">Chênh lệch:</span>
                    {formActualQty !== "" ? (
                      <strong className={`text-xs ${
                        Number(formActualQty) - selectedItemData.quantity === 0 ? "text-slate-700" :
                        Number(formActualQty) - selectedItemData.quantity < 0 ? "text-red-500 font-extrabold" : "text-emerald-600 font-extrabold"
                      }`}>
                        {Number(formActualQty) - selectedItemData.quantity > 0 ? `+` : ""}
                        {Number(formActualQty) - selectedItemData.quantity} {selectedItemData.unit}
                      </strong>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[8px]">Ngưỡng tối thiểu:</span>
                    <strong className="text-slate-900 text-xs">{selectedItemData.minThreshold} {selectedItemData.unit}</strong>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[8px] font-extrabold text-slate-400 uppercase">Lý do chênh lệch / Cách xử lý</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: Bay bọt đong sai số, hoặc hao hụt tự nhiên do bay hơi..."
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#A2C62C] font-black uppercase text-[9px] rounded-lg transition"
                  >
                    Thêm vào phiếu
                  </button>
                </div>
              </div>
            </div>

            {/* List of pending lines in draft */}
            <div className="border border-[#e5e5e5] rounded-xl overflow-hidden bg-stone-50/50">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-stone-100 text-slate-500 font-black uppercase text-[8px] tracking-wider border-b border-stone-200">
                    <th className="p-3 pl-4">Mặt hàng</th>
                    <th className="p-3 text-center">Tồn sổ sách</th>
                    <th className="p-3 text-center">Thực tế</th>
                    <th className="p-3 text-center">Chênh lệch</th>
                    <th className="p-3">Lý do / Ghi chú</th>
                    <th className="p-3 text-right pr-4">Hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150 text-slate-700 bg-white">
                  {activeLines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 text-xs italic">
                        Chưa có mặt hàng nào được nạp vào phiếu nháp này.
                      </td>
                    </tr>
                  ) : (
                    activeLines.map((line, idx) => (
                      <tr key={line.itemId} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-4 font-bold text-slate-950">{line.itemName}</td>
                        <td className="p-3 text-center font-sans font-medium">{line.bookQty} {line.unit}</td>
                        <td className="p-3 text-center font-sans font-bold text-slate-900">{line.actualQty} {line.unit}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-1.5 py-0.2 rounded font-sans font-black text-[10px] ${
                            line.difference === 0 ? "bg-stone-100 text-slate-600" :
                            line.difference < 0 ? "bg-red-50 text-red-600 font-bold" : "bg-emerald-50 text-emerald-600 font-bold"
                          }`}>
                            {line.difference > 0 ? "+" : ""}{line.difference}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate">{line.reason}</td>
                        <td className="p-3 text-right pr-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Submit Sheet Action */}
            <button
              type="submit"
              disabled={activeLines.length === 0}
              className={`w-full py-3 rounded-xl font-extrabold text-xs font-display uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                activeLines.length > 0 
                  ? "bg-slate-950 hover:bg-slate-900 text-white" 
                  : "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200"
              }`}
            >
              <Check className="h-4 w-4 stroke-[3.5] text-[#A2C62C]" />
              CHỐT PHIẾU KIỂM KÊ & ĐỒNG BỘ TỒN SỔ SÁCH
            </button>
          </form>
        </div>

        {/* Right Column: Lịch Sử Phiếu Kiểm Đếm (2/5) */}
        <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-600" />
            <h3 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">
              LỊCH SỬ KIỂM KHO
            </h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {audits.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">Chưa có phiếu kiểm đếm lịch sử nào.</p>
            ) : (
              audits.map(aud => (
                <div key={aud.id} className="border border-stone-200 rounded-xl p-4 space-y-2.5 hover:shadow-xs transition text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-950 font-sans tracking-wide block">{aud.id}</strong>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Ngày: {new Date(aud.date).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-stone-100 text-slate-700 px-2 py-0.5 rounded border border-stone-200">
                      Đã đồng bộ
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    <span className="font-bold text-slate-700">Người thực hiện:</span> {aud.actor}
                  </div>

                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Các SKU kiểm kê:</span>
                    <div className="space-y-1.5">
                      {aud.itemsAudited.map(item => (
                        <div key={item.itemId} className="flex justify-between items-center text-[11px] bg-stone-50/50 p-2 rounded border border-stone-100">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{item.itemName}</span>
                            <span className="text-[9px] text-slate-400 italic block">Ghi chú: {item.reason}</span>
                          </div>
                          <div className="text-right text-[10px]">
                            <span className="block text-slate-500">Đếm: {item.actualQty} / Sách: {item.bookQty}</span>
                            <span className={`font-black font-sans block ${
                              item.difference === 0 ? "text-slate-500" :
                              item.difference < 0 ? "text-red-500" : "text-emerald-600"
                            }`}>
                              {item.difference > 0 ? "+" : ""}{item.difference} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
