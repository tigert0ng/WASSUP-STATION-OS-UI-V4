import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Building2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Package,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Ban
} from "lucide-react";

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxCode?: string;
  note?: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: "draft" | "confirmed" | "received" | "cancelled";
  createdBy: string;
  createdAt: string;
  note?: string;
  lines: {
    itemId: string;
    itemName: string;
    qtyOrdered: number;
    qtyReceived?: number;
    unitCost: number;
    unit: string;
  }[];
}

interface SupplierManagementProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchaseOrders: PurchaseOrder[];
  showToast: (msg: string) => void;
  formatVnd: (val: number) => string;
}

export default function SupplierManagement({
  suppliers,
  setSuppliers,
  purchaseOrders,
  showToast,
  formatVnd,
}: SupplierManagementProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Drawer / Modal states
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formTaxCode, setFormTaxCode] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formActive, setFormActive] = useState(true);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormTaxCode("");
    setFormNote("");
    setFormActive(true);
    setShowDrawer(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormPhone(sup.phone);
    setFormAddress(sup.address);
    setFormTaxCode(sup.taxCode || "");
    setFormNote(sup.note || "");
    setFormActive(sup.active);
    setShowDrawer(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      showToast("Vui lòng nhập Tên nhà cung cấp và Số điện thoại!");
      return;
    }

    if (editingSupplier) {
      // Update
      const updated = suppliers.map((s) =>
        s.id === editingSupplier.id
          ? {
              ...s,
              name: formName.trim(),
              phone: formPhone.trim(),
              address: formAddress.trim(),
              taxCode: formTaxCode.trim() || undefined,
              note: formNote.trim() || undefined,
              active: formActive,
            }
          : s
      );
      setSuppliers(updated);
      localStorage.setItem("wassup_suppliers", JSON.stringify(updated));
      showToast(`Đã cập nhật nhà cung cấp "${formName.trim()}"`);
    } else {
      // Create new
      const newSup: Supplier = {
        id: "sup_" + Date.now(),
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        taxCode: formTaxCode.trim() || undefined,
        note: formNote.trim() || undefined,
        active: true,
        createdAt: new Date().toISOString(),
      };
      const updated = [newSup, ...suppliers];
      setSuppliers(updated);
      localStorage.setItem("wassup_suppliers", JSON.stringify(updated));
      showToast(`Đã thêm nhà cung cấp mới "${newSup.name}"`);
    }

    setShowDrawer(false);
  };

  const toggleActiveStatus = (sup: Supplier) => {
    const updated = suppliers.map((s) =>
      s.id === sup.id ? { ...s, active: !s.active } : s
    );
    setSuppliers(updated);
    localStorage.setItem("wassup_suppliers", JSON.stringify(updated));
    showToast(
      sup.active
        ? `Đã ngừng hợp tác với NCC "${sup.name}"`
        : `Đã kích hoạt lại NCC "${sup.name}"`
    );
  };

  // Helper stats for each supplier
  const getSupplierStats = (supId: string) => {
    const pos = purchaseOrders.filter((po) => po.supplierId === supId);
    const totalPos = pos.length;
    let totalBought = 0;
    pos.forEach((po) => {
      po.lines.forEach((line) => {
        const qty = line.qtyReceived ?? line.qtyOrdered;
        totalBought += qty * line.unitCost;
      });
    });

    // Mock unpaid balance (or calculate from receipts)
    const pendingPos = pos.filter((po) => po.status === "received" || po.status === "confirmed");
    const unpaidPayable = pendingPos.reduce((sum, po) => {
      return sum + po.lines.reduce((s, l) => s + (l.qtyReceived || l.qtyOrdered) * l.unitCost, 0);
    }, 0);

    return { totalPos, totalBought, unpaidPayable };
  };

  // Global KPIs
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter((s) => s.active).length;
  const grandTotalPurchased = suppliers.reduce(
    (sum, s) => sum + getSupplierStats(s.id).totalBought,
    0
  );
  const grandTotalPayable = suppliers.reduce(
    (sum, s) => sum + getSupplierStats(s.id).unpaidPayable,
    0
  );

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? sup.active
        : !sup.active;
    const matchesSearch =
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.phone.includes(searchTerm) ||
      (sup.taxCode && sup.taxCode.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="submenu-suppliers">
      {/* KPI Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Tổng Nhà Cung Cấp</p>
            <p className="text-2xl font-black text-slate-900 font-display mt-0.5">{totalSuppliersCount}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {activeSuppliersCount} đang hợp tác
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Tổng Đơn Mua Hàng (PO)</p>
            <p className="text-2xl font-black text-slate-900 font-display mt-0.5">{purchaseOrders.length}</p>
            <p className="text-[11px] text-stone-500 font-medium mt-1">Đã giao dịch hệ thống</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Tổng Giá Trị Đã Mua</p>
            <p className="text-xl font-black text-slate-900 font-display mt-0.5">{formatVnd(grandTotalPurchased)}</p>
            <p className="text-[11px] text-stone-500 font-medium mt-1">Ghi nhận qua phiếu nhập</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Công Nợ Phải Trả NCC</p>
            <p className="text-xl font-black text-amber-700 font-display mt-0.5">{formatVnd(grandTotalPayable)}</p>
            <p className="text-[11px] text-amber-600 font-bold mt-1">Cần thanh toán phiếu chi</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Control & Filter Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-purple-600" />
              QUẢN LÝ DANH SÁCH NHÀ CUNG CẤP (S6.12 & S6.13)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tạo và quản lý thông tin NCC, đối chiếu công nợ, xem lịch sử các đơn hàng PO theo từng đối tác.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Thêm Nhà Cung Cấp Mới
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Trạng thái:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Tất cả ({suppliers.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Đang hợp tác ({suppliers.filter((s) => s.active).length})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                statusFilter === "inactive"
                  ? "bg-stone-700 text-white border-stone-700"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              Ngừng hợp tác ({suppliers.filter((s) => !s.active).length})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Tên / SĐT / MST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-stone-100 text-stone-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-3.5">Tên Nhà Cung Cấp</th>
                <th className="p-3.5">Liên Hệ / Địa Chỉ</th>
                <th className="p-3.5 text-center">Mã Số Thuế</th>
                <th className="p-3.5 text-center">Số PO Đã Tạo</th>
                <th className="p-3.5 text-right">Tổng Giá Trị Mua</th>
                <th className="p-3.5 text-right">Công Nợ Chưa Chi</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 text-xs">
                    Không tìm thấy nhà cung cấp phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const stats = getSupplierStats(sup.id);
                  return (
                    <tr key={sup.id} className="hover:bg-purple-50/20 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 font-black text-xs">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs hover:text-purple-600 cursor-pointer" onClick={() => setSelectedSupplier(sup)}>
                              {sup.name}
                            </p>
                            {sup.note && (
                              <p className="text-[11px] text-stone-400 truncate max-w-[220px]">{sup.note}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-stone-700 text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3 text-stone-400" /> {sup.phone}
                          </p>
                          <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="h-3 w-3 text-stone-400 shrink-0" /> {sup.address}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="font-mono text-stone-600 text-xs bg-stone-100 px-2 py-0.5 rounded font-semibold">
                          {sup.taxCode || "—"}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg text-xs">
                          {stats.totalPos} PO
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatVnd(stats.totalBought)}
                      </td>

                      <td className="p-3.5 text-right">
                        {stats.unpaidPayable > 0 ? (
                          <span className="font-mono font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
                            {formatVnd(stats.unpaidPayable)}
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-600 font-bold text-xs">0 ₫</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {sup.active ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-500 border border-stone-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                            <Ban className="h-3 w-3" /> Ngừng
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSupplier(sup)}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-purple-100 text-stone-700 hover:text-purple-700 font-extrabold text-[10px] uppercase transition cursor-pointer flex items-center gap-1"
                            title="Xem lịch sử PO & công nợ"
                          >
                            <FileText className="h-3 w-3" /> Chi tiết
                          </button>

                          <button
                            onClick={() => openEditModal(sup)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => toggleActiveStatus(sup)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              sup.active
                                ? "hover:bg-red-50 text-stone-400 hover:text-red-600"
                                : "hover:bg-emerald-50 text-stone-400 hover:text-emerald-600"
                            }`}
                            title={sup.active ? "Ngừng hợp tác (vô hiệu hóa)" : "Kích hoạt lại"}
                          >
                            <Ban className="h-3.5 w-3.5" />
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

      {/* DRAWER FORM: THÊM / SỬA NCC (S6.13) */}
      {showDrawer && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[999] flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col font-sans">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-400" />
                <h3 className="font-black font-display text-sm uppercase tracking-wider">
                  {editingSupplier ? "SỬA NHÀ CUNG CẤP (S6.13)" : "THÊM NHÀ CUNG CẤP MỚI (S6.13)"}
                </h3>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-stone-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Tên Nhà Cung Cấp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 3M Việt Nam, WASSUP Supply Co..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Số Điện Thoại Liên Hệ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 0908.123.456 / 024.3999.8888"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Địa Chỉ Kho / Trụ Sở
                </label>
                <input
                  type="text"
                  placeholder="VD: Lô C2 Cụm CN Cầu Giấy, Hà Nội..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Mã Số Thuế (MST)
                </label>
                <input
                  type="text"
                  placeholder="VD: 0109887766"
                  value={formTaxCode}
                  onChange={(e) => setFormTaxCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-extrabold uppercase text-[10px] text-stone-600 block mb-1">
                  Ghi Chú Hợp Tác / Sản Phẩm Cung Cấp
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú về dòng sản phẩm chính, thời hạn thanh toán công nợ..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="font-extrabold text-stone-700 text-xs">Trạng thái hợp tác:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-800">
                    {formActive ? "Đang hợp tác (Hoạt động)" : "Ngừng hợp tác"}
                  </span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold uppercase tracking-wider text-[11px] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold uppercase tracking-wider text-[11px] transition shadow-sm cursor-pointer"
                >
                  Lưu Nhà Cung Cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER DETAIL SUPPLIER PO HISTORY */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative font-sans text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSupplier(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black font-display uppercase tracking-wider text-slate-900">
                  {selectedSupplier.name}
                </h3>
                <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                  <span>SĐT: <strong className="text-slate-800 font-mono">{selectedSupplier.phone}</strong></span>
                  <span>•</span>
                  <span>MST: <strong className="text-slate-800 font-mono">{selectedSupplier.taxCode || "—"}</strong></span>
                </p>
              </div>
            </div>

            {/* Stats summary */}
            {(() => {
              const stats = getSupplierStats(selectedSupplier.id);
              const pos = purchaseOrders.filter((po) => po.supplierId === selectedSupplier.id);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <p className="text-[10px] font-black uppercase text-stone-500">Số PO đã lập</p>
                      <p className="text-lg font-black text-slate-900">{stats.totalPos} đơn</p>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <p className="text-[10px] font-black uppercase text-stone-500">Tổng giá trị mua</p>
                      <p className="text-lg font-black text-emerald-700">{formatVnd(stats.totalBought)}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                      <p className="text-[10px] font-black uppercase text-amber-700">Công nợ chưa chi</p>
                      <p className="text-lg font-black text-amber-800">{formatVnd(stats.unpaidPayable)}</p>
                    </div>
                  </div>

                  {/* PO List */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                      Lịch Sử Đơn Mua Hàng (PO) Từ Nhà Cung Cấp
                    </h4>

                    {pos.length === 0 ? (
                      <div className="p-6 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                        Chưa có đơn mua hàng PO nào được tạo cho nhà cung cấp này.
                      </div>
                    ) : (
                      <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                        {pos.map((po) => (
                          <div key={po.id} className="p-3.5 hover:bg-stone-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-slate-900">{po.id}</span>
                                <span className="text-[11px] text-stone-400">• {new Date(po.createdAt).toLocaleDateString("vi-VN")}</span>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                  po.status === "received"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : po.status === "confirmed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-stone-100 text-stone-700"
                                }`}
                              >
                                {po.status === "received" ? "Đã Nhận Hàng" : po.status === "confirmed" ? "Đã Xác Nhận" : po.status}
                              </span>
                            </div>

                            <div className="space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-100 font-mono text-[11px]">
                              {po.lines.map((l, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span>{l.itemName} ({l.qtyReceived ?? l.qtyOrdered} {l.unit})</span>
                                  <span className="font-bold text-slate-900">{formatVnd((l.qtyReceived ?? l.qtyOrdered) * l.unitCost)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedSupplier(null)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
