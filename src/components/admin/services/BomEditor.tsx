import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, AlertTriangle, Beaker } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import { ServiceBomRow, InventoryItemPickerRow, VehicleClass } from "../../../types/catalog.types";

// S5.7 — Tab "Định mức vật tư". 2 cột định lượng song song (Xe 4-5 chỗ / Xe
// 7-9 chỗ·bán tải) trên cùng 1 dòng vật tư, theo đúng bố cục PRD mô tả. Tên +
// đơn vị tính luôn lấy từ inventory_items (Module 6) — không nhập tay, tránh
// lệch dữ liệu giữa 2 module dùng chung bảng service_bom.
interface Props {
  serviceId: string;
  serviceName: string;
  onBomCountChange: (count: number) => void;
}

type GroupedRow = {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  line45: ServiceBomRow | null;
  line79: ServiceBomRow | null;
};

export default function BomEditor({ serviceId, serviceName, onBomCountChange }: Props) {
  const { can, staff } = useAuth();
  const canWrite = can("catalog", "update");

  const [bomLines, setBomLines] = useState<ServiceBomRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemPickerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [addItemId, setAddItemId] = useState("");
  const [addQty45, setAddQty45] = useState("");
  const [addQty79, setAddQty79] = useState("");
  const [saving, setSaving] = useState(false);

  // Quick-edit inline khi bấm trực tiếp vào 1 ô định lượng của dòng đã có.
  const [editingCell, setEditingCell] = useState<{ itemId: string; vehicleClass: VehicleClass } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const showToast = (kind: "success" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function loadAll() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: bomData, error: bomErr }, { data: invData, error: invErr }] = await Promise.all([
      supabase.from("service_bom").select("*").eq("service_id", serviceId),
      supabase
        .from("inventory_items")
        .select("id, name, category, unit, min_stock")
        .in("category", ["consumable", "tool"])
        .order("name"),
    ]);
    if (bomErr) showToast("error", bomErr.message);
    if (invErr) showToast("error", invErr.message);
    const bom = (bomData as ServiceBomRow[]) ?? [];
    setBomLines(bom);
    setInventoryItems((invData as InventoryItemPickerRow[]) ?? []);
    onBomCountChange(bom.length);
    setLoading(false);
  }

  const grouped = useMemo<GroupedRow[]>(() => {
    const byItem = new Map<string, GroupedRow>();
    for (const line of bomLines) {
      const item = inventoryItems.find((i) => i.id === line.inventory_item_id);
      if (!byItem.has(line.inventory_item_id)) {
        byItem.set(line.inventory_item_id, {
          itemId: line.inventory_item_id,
          itemName: item?.name ?? "(Vật tư đã xóa)",
          category: item?.category ?? "—",
          unit: item?.unit ?? line.unit,
          line45: null,
          line79: null,
        });
      }
      const row = byItem.get(line.inventory_item_id)!;
      if (line.vehicle_class === "4_5_cho") row.line45 = line;
      else row.line79 = line;
    }
    return Array.from(byItem.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [bomLines, inventoryItems]);

  const selectedAddItem = inventoryItems.find((i) => i.id === addItemId) ?? null;

  async function handleAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !staff || !addItemId || !selectedAddItem) return;
    const qty45 = addQty45.trim() ? Number(addQty45) : null;
    const qty79 = addQty79.trim() ? Number(addQty79) : null;
    if (!qty45 && !qty79) {
      showToast("error", "Nhập định lượng cho ít nhất 1 hạng xe.");
      return;
    }

    let finalQty45 = qty45;
    let finalQty79 = qty79;
    if (qty45 && !qty79) {
      const useShared = window.confirm(
        "Chỉ nhập định lượng cho Xe 4-5 chỗ. Dùng chung định lượng này cho Xe 7-9 chỗ/bán tải?"
      );
      if (useShared) finalQty79 = qty45;
    } else if (qty79 && !qty45) {
      const useShared = window.confirm(
        "Chỉ nhập định lượng cho Xe 7-9 chỗ/bán tải. Dùng chung định lượng này cho Xe 4-5 chỗ?"
      );
      if (useShared) finalQty45 = qty79;
    }

    const rows: { service_id: string; vehicle_class: VehicleClass; inventory_item_id: string; qty_per_unit: number; unit: string }[] = [];
    if (finalQty45) rows.push({ service_id: serviceId, vehicle_class: "4_5_cho", inventory_item_id: addItemId, qty_per_unit: finalQty45, unit: selectedAddItem.unit });
    if (finalQty79) rows.push({ service_id: serviceId, vehicle_class: "7_9_cho_bantai", inventory_item_id: addItemId, qty_per_unit: finalQty79, unit: selectedAddItem.unit });

    setSaving(true);
    const { error } = await supabase
      .from("service_bom")
      .upsert(rows, { onConflict: "service_id,vehicle_class,inventory_item_id" });
    setSaving(false);

    if (error) {
      showToast("error", error.message);
      return;
    }

    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "add_service_bom_line",
      entity: "service_bom",
      entityId: serviceId,
      after: { service: serviceName, item: selectedAddItem.name, qty45: finalQty45, qty79: finalQty79, unit: selectedAddItem.unit },
    });

    setAddItemId("");
    setAddQty45("");
    setAddQty79("");
    await loadAll();
    showToast("success", `Đã lưu định mức vật tư: ${selectedAddItem.name}.`);
  }

  function startEdit(row: GroupedRow, vehicleClass: VehicleClass) {
    if (!canWrite) return;
    const existing = vehicleClass === "4_5_cho" ? row.line45 : row.line79;
    setEditingCell({ itemId: row.itemId, vehicleClass });
    setEditingValue(existing ? String(existing.qty_per_unit) : "");
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditingValue("");
  }

  async function saveEdit(row: GroupedRow) {
    if (!supabase || !staff || !editingCell) return;
    const qty = editingValue.trim() ? Number(editingValue) : null;
    if (qty === null || Number.isNaN(qty) || qty <= 0) {
      showToast("error", "Định mức phải là số lớn hơn 0.");
      return;
    }
    const { error } = await supabase
      .from("service_bom")
      .upsert(
        [{ service_id: serviceId, vehicle_class: editingCell.vehicleClass, inventory_item_id: row.itemId, qty_per_unit: qty, unit: row.unit }],
        { onConflict: "service_id,vehicle_class,inventory_item_id" }
      );
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "quick_edit_service_bom_line",
      entity: "service_bom",
      entityId: row.itemId,
      before: { qty: editingCell.vehicleClass === "4_5_cho" ? row.line45?.qty_per_unit : row.line79?.qty_per_unit },
      after: { item: row.itemName, vehicle_class: editingCell.vehicleClass, qty },
    });
    cancelEdit();
    await loadAll();
    showToast("success", `Đã cập nhật định mức ${row.itemName}.`);
  }

  async function handleDeleteRow(row: GroupedRow) {
    if (!supabase || !staff) return;
    if (!window.confirm(`Xóa toàn bộ định mức "${row.itemName}" (cả 2 hạng xe nếu có)?`)) return;
    const ids = [row.line45?.id, row.line79?.id].filter((id): id is string => !!id);
    const { error } = await supabase.from("service_bom").delete().in("id", ids);
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "delete_service_bom_line",
      entity: "service_bom",
      entityId: row.itemId,
      before: { item: row.itemName, line45: row.line45, line79: row.line79 },
    });
    await loadAll();
    showToast("success", "Đã xóa dòng định mức.");
  }

  if (loading) return <p className="text-mid-gray font-sans text-xs">Đang tải định mức...</p>;

  function renderCell(row: GroupedRow, vehicleClass: VehicleClass) {
    const line = vehicleClass === "4_5_cho" ? row.line45 : row.line79;
    const isEditing = editingCell?.itemId === row.itemId && editingCell.vehicleClass === vehicleClass;

    if (isEditing) {
      return (
        <input
          type="number"
          step="0.001"
          min="0"
          autoFocus
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => void saveEdit(row)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void saveEdit(row);
            } else if (e.key === "Escape") {
              cancelEdit();
            }
          }}
          className="w-20 bg-white border border-forest-green rounded px-1.5 py-1 text-xs font-mono text-center focus:outline-none"
        />
      );
    }

    return (
      <button
        type="button"
        disabled={!canWrite}
        onClick={() => startEdit(row, vehicleClass)}
        className={`font-mono rounded px-1.5 py-1 transition ${canWrite ? "cursor-pointer hover:bg-brand-green-light" : "cursor-default"}`}
        title={canWrite ? "Bấm để sửa nhanh" : undefined}
      >
        {line ? `${line.qty_per_unit} ${line.unit}` : <span className="text-mid-gray/50">—</span>}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[60] px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 font-sans text-xs font-bold ${
            toast.kind === "success" ? "bg-matte-black text-brand-green border-brand-green/30" : "bg-red-600 text-white border-red-500"
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      {grouped.length === 0 && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 font-sans leading-snug">
            Chưa có dòng định mức nào. Dịch vụ không thể chuyển "Hoạt động" cho tới khi có ít nhất 1 dòng.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
        <table className="w-full text-left border-collapse font-sans text-[11px]">
          <thead>
            <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
              <th className="p-2.5 uppercase tracking-wider text-[9px] font-extrabold">Vật tư</th>
              <th className="p-2.5 uppercase tracking-wider text-[9px] font-extrabold text-center">Xe 4-5 chỗ</th>
              <th className="p-2.5 uppercase tracking-wider text-[9px] font-extrabold text-center">Xe 7-9 chỗ · bán tải</th>
              {canWrite && <th className="p-2.5 uppercase tracking-wider text-[9px] font-extrabold text-right">Xóa</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {grouped.map((row) => (
              <tr key={row.itemId} className="hover:bg-warm-white/40 transition">
                <td className="p-2.5 font-bold text-matte-black">{row.itemName}</td>
                <td className="p-2.5 text-center">{renderCell(row, "4_5_cho")}</td>
                <td className="p-2.5 text-center">{renderCell(row, "7_9_cho_bantai")}</td>
                {canWrite && (
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDeleteRow(row)}
                      className="p-1.5 text-mid-gray hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Xóa cả dòng"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {grouped.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 4 : 3} className="p-6 text-center text-mid-gray text-xs">
                  Chưa có định mức vật tư.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canWrite && grouped.length > 0 && (
        <p className="text-[9px] text-mid-gray -mt-2">Mẹo: bấm trực tiếp vào 1 ô định lượng đã có để sửa nhanh.</p>
      )}

      {canWrite && (
        <form onSubmit={handleAddLine} className="bg-warm-white border border-[#e5e5e5] rounded-xl p-4 space-y-3">
          <h4 className="text-[10px] font-black font-display uppercase tracking-wider text-matte-black flex items-center gap-1.5">
            <Beaker className="h-3.5 w-3.5 text-forest-green" /> Thêm dòng định mức mới
          </h4>
          <select
            required
            value={addItemId}
            onChange={(e) => setAddItemId(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:border-forest-green"
          >
            <option value="">Chọn vật tư (Nhóm 2/3, từ Module 6 - Kho vật tư)...</option>
            {inventoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} · {i.unit} ({i.category === "consumable" ? "Tiêu hao" : "Dụng cụ"})
              </option>
            ))}
          </select>
          {selectedAddItem && (
            <p className="text-[9px] text-mid-gray">
              Đơn vị tính: <span className="font-bold text-matte-black">{selectedAddItem.unit}</span> (lấy từ Module 6, không nhập tay)
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-mid-gray uppercase block">Định lượng Xe 4-5 chỗ</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={addQty45}
                onChange={(e) => setAddQty45(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-forest-green"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-extrabold text-mid-gray uppercase block">Định lượng Xe 7-9 chỗ/bán tải</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={addQty79}
                onChange={(e) => setAddQty79(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-forest-green"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> {saving ? "Đang lưu..." : "Lưu định mức"}
          </button>
        </form>
      )}
    </div>
  );
}
