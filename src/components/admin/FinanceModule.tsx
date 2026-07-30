import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Briefcase,
  Layers,
  Sparkles,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { OrderStatusView } from "../../types/workOrder.types";
import { MarkdownTextarea, MarkdownRenderer } from "./shared/Markdown";

interface FinanceRecord {
  id: string;
  title: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  categoryLabel: string;
  paymentMethod: "cash" | "bank_transfer" | "e_wallet";
  paymentMethodLabel: string;
  date: string;
  actor: string;
  notes?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  // Income categories
  wash_service: "Doanh thu dịch vụ rửa xe",
  merchandise: "Doanh thu bán lẻ phụ kiện",
  member_registration: "Đăng ký thẻ thành viên",
  other_income: "Thu nhập khác",
  // Expense categories
  chemical_material: "Chi mua hóa chất & vật tư",
  staff_salary: "Chi lương & Thưởng nhân sự",
  utilities: "Chi điện, nước, internet",
  equipment_repair: "Bảo trì & sửa chữa thiết bị",
  marketing: "Chi phí quảng cáo & Marketing",
  other_expense: "Chi phí khác"
};

const PAYMENT_METHODS: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản ngân hàng",
  e_wallet: "Ví điện tử (Momo/VNPAY)"
};

const DEFAULT_FINANCE_LEDGER: FinanceRecord[] = [
  {
    id: "fn_1",
    title: "Doanh thu Gói Detailer Chuyên Sâu (W3 - Xe 51K-999.88)",
    type: "income",
    amount: 1250000,
    category: "wash_service",
    categoryLabel: CATEGORY_LABELS.wash_service,
    paymentMethod: "bank_transfer",
    paymentMethodLabel: PAYMENT_METHODS.bank_transfer,
    date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
    actor: "Hệ thống POS",
    notes: "Đã hoàn thành bàn giao xe"
  },
  {
    id: "fn_2",
    title: "Nhập thêm 1 thùng Dầu bóng lốp xe Sonax Xtreme",
    type: "expense",
    amount: 1500000,
    category: "chemical_material",
    categoryLabel: CATEGORY_LABELS.chemical_material,
    paymentMethod: "bank_transfer",
    paymentMethodLabel: PAYMENT_METHODS.bank_transfer,
    date: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hrs ago
    actor: "Nguyễn Minh Hùng (Kho)",
    notes: "Hóa đơn sỉ nhà phân phối Sonax"
  },
  {
    id: "fn_3",
    title: "Chi lương ứng ca sáng cho KTV Nguyễn Văn A",
    type: "expense",
    amount: 350000,
    category: "staff_salary",
    categoryLabel: CATEGORY_LABELS.staff_salary,
    paymentMethod: "cash",
    paymentMethodLabel: PAYMENT_METHODS.cash,
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    actor: "Trần Thị D (Kế toán)",
    notes: "KTV xin ứng lương trước cuối tuần"
  },
  {
    id: "fn_4",
    title: "Doanh thu bán lẻ nước hoa ô tô Areon Gold",
    type: "income",
    amount: 450000,
    category: "merchandise",
    categoryLabel: CATEGORY_LABELS.merchandise,
    paymentMethod: "e_wallet",
    paymentMethodLabel: PAYMENT_METHODS.e_wallet,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    actor: "Hệ thống POS",
    notes: "Bán kèm combo dưỡng chất"
  },
  {
    id: "fn_5",
    title: "Thanh toán tiền điện ba pha và nước sảnh tháng trước",
    type: "expense",
    amount: 4850000,
    category: "utilities",
    categoryLabel: CATEGORY_LABELS.utilities,
    paymentMethod: "bank_transfer",
    paymentMethodLabel: PAYMENT_METHODS.bank_transfer,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    actor: "Trần Thị D (Kế toán)",
    notes: "Hóa đơn điện lực Tân Bình"
  }
];

export default function FinanceModule() {
  const [ledger, setLedger] = useState<FinanceRecord[]>(() => {
    try {
      const cached = localStorage.getItem("wassup_finance_ledger");
      return cached ? JSON.parse(cached) : DEFAULT_FINANCE_LEDGER;
    } catch (e) {
      return DEFAULT_FINANCE_LEDGER;
    }
  });

  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("wash_service");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "e_wallet">("bank_transfer");
  const [actor, setActor] = useState("Kế toán trưởng");
  const [notes, setNotes] = useState("");

  // Persist Ledger
  useEffect(() => {
    localStorage.setItem("wassup_finance_ledger", JSON.stringify(ledger));
  }, [ledger]);

  // Read orders to auto-populate Wash Service Income from COMPLETED orders!
  useEffect(() => {
    try {
      const cachedOrders = localStorage.getItem("wassup_orders");
      if (cachedOrders) {
        const ordersList: any[] = JSON.parse(cachedOrders);
        const completedPaidOrders = ordersList.filter(o => o.status === "paid" || o.status === "closed");

        // Look for any paid order that isn't logged in the ledger yet
        setLedger(prev => {
          let updated = [...prev];
          let altered = false;

          completedPaidOrders.forEach(ord => {
            const ledgerKey = `fn_auto_order_${ord.id}`;
            const exists = prev.some(r => r.id === ledgerKey);
            if (!exists) {
              const amountValue = ord.total || 0;
              if (amountValue > 0) {
                const newRecord: FinanceRecord = {
                  id: ledgerKey,
                  title: `Doanh thu rửa xe tự động (Order #${ord.id} - Xe ${ord.licensePlate})`,
                  type: "income",
                  amount: amountValue,
                  category: "wash_service",
                  categoryLabel: CATEGORY_LABELS.wash_service,
                  paymentMethod: "bank_transfer",
                  paymentMethodLabel: PAYMENT_METHODS.bank_transfer,
                  date: ord.createdAt || new Date().toISOString(),
                  actor: "Hệ thống POS",
                  notes: `Gói ${ord.packageCode} đã hoàn tất thanh toán.`
                };
                updated.unshift(newRecord);
                altered = true;
              }
            }
          });

          return altered ? updated : prev;
        });
      }
    } catch (e) {
      console.error("Error syncing POS revenue into finance ledger:", e);
    }
  }, []);

  // Compute stats
  const totalIncome = ledger
    .filter(r => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = ledger
    .filter(r => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      alert("Vui lòng điền đầy đủ tiêu đề và số tiền giao dịch!");
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Số tiền giao dịch phải là số dương hợp lệ!");
      return;
    }

    const newRecord: FinanceRecord = {
      id: "fn_" + Date.now(),
      title,
      type,
      amount: numericAmount,
      category,
      categoryLabel: CATEGORY_LABELS[category] || CATEGORY_LABELS.other_income,
      paymentMethod,
      paymentMethodLabel: PAYMENT_METHODS[paymentMethod],
      date: new Date().toISOString(),
      actor,
      notes: notes || undefined
    };

    setLedger(prev => [newRecord, ...prev]);
    setShowAddModal(false);

    // Reset Form
    setTitle("");
    setAmount("");
    setNotes("");
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dòng thu chi này khỏi sổ cái kế toán?")) {
      setLedger(prev => prev.filter(r => r.id !== id));
    }
  };

  const formatNumberWithDot = (val: string | number) => {
    if (val === undefined || val === null || val === "") return "";
    const clean = String(val).replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("vi-VN");
  };

  const parseNumberFromDot = (val: string) => {
    return val.replace(/\D/g, "");
  };

  // Filter logic
  const filteredLedger = ledger.filter(r => {
    const matchesTab = activeTab === "all" || r.type === activeTab;
    const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
    return matchesTab && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="space-y-1 px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-forest-green" />
            <h1 className="text-lg font-black tracking-tight text-matte-black uppercase font-display">
              SỔ CÁI THU CHI - BÁO CÁO TÀI CHÍNH TRẠM
            </h1>
          </div>
          <p className="text-mid-gray text-xs font-sans">
            Quản lý dòng tiền vào/ra, cân đối thu chi, hạch toán vật tư, vận hành lương thưởng và lợi nhuận thực tế.
          </p>
        </div>

        <button
          onClick={() => {
            setType("income");
            setCategory("wash_service");
            setShowAddModal(true);
          }}
          className="bg-brand-green hover:bg-brand-green-hover text-matte-black px-4.5 py-2.5 rounded-xl font-black text-xs font-display tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border-0 shadow-md shadow-brand-green/10"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> HẠCH TOÁN GIAO DỊCH MỚI
        </button>
      </div>

      {/* METRIC BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Inflow */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase font-sans tracking-wider block">Tổng Thu (Inflow Cash)</span>
            <span className="text-xl font-black font-sans text-emerald-600 block">
              {totalIncome.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
            </span>
            <span className="text-[10px] text-stone-400 block font-sans">Đã bao gồm doanh thu từ POS và sảnh chờ</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500" />
        </div>

        {/* Total Outflow */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase font-sans tracking-wider block">Tổng Chi (Outflow Cash)</span>
            <span className="text-xl font-black font-sans text-red-600 block">
              {totalExpense.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
            </span>
            <span className="text-[10px] text-stone-400 block font-sans">Lương thưởng, điện nước & hóa chất kho</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <ArrowDownRight className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="absolute top-0 right-0 h-1.5 w-full bg-red-500" />
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-stone-500 font-extrabold uppercase font-sans tracking-wider block">Lợi Nhuận Thuần (Net Operating Income)</span>
            <span className={`text-xl font-black font-sans block ${netProfit >= 0 ? "text-forest-green" : "text-amber-600"}`}>
              {netProfit.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
            </span>
            <span className="text-[10px] text-stone-400 block font-sans">Hiệu quả tài chính thời gian thực</span>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border ${netProfit >= 0 ? "bg-emerald-50 border-emerald-100 text-forest-green" : "bg-amber-50 border-amber-100 text-amber-600"}`}>
            <DollarSign className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className={`absolute top-0 right-0 h-1.5 w-full ${netProfit >= 0 ? "bg-forest-green" : "bg-amber-500"}`} />
        </div>
      </div>

      {/* FILTER BAR & LIST */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#e5e5e5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab switches */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start">
            {[
              { id: "all", label: "Tất cả giao dịch" },
              { id: "income", label: "Khoản Thu (+)" },
              { id: "expense", label: "Khoản Chi (-)" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition cursor-pointer border-0 ${
                  activeTab === tab.id
                    ? "bg-white text-matte-black shadow-sm"
                    : "text-stone-500 hover:text-stone-900 bg-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-mid-gray shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-stone-200 text-stone-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-green"
            >
              <option value="all">Tất cả danh mục phân loại...</option>
              <optgroup label="Danh mục Thu">
                <option value="wash_service">Doanh thu dịch vụ rửa xe</option>
                <option value="merchandise">Doanh thu bán lẻ phụ kiện</option>
                <option value="member_registration">Đăng ký thẻ thành viên</option>
                <option value="other_income">Thu nhập khác</option>
              </optgroup>
              <optgroup label="Danh mục Chi">
                <option value="chemical_material">Chi mua hóa chất & vật tư</option>
                <option value="staff_salary">Chi lương & Thưởng nhân sự</option>
                <option value="utilities">Chi điện, nước, internet</option>
                <option value="equipment_repair">Bảo trì & sửa chữa thiết bị</option>
                <option value="marketing">Chi phí quảng cáo & Marketing</option>
                <option value="other_expense">Chi phí khác</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Ngày Giao Dịch</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Mô tả / Tiêu đề</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Danh Mục Phân Phối</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Thanh Toán</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Người Thực Hiện</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-right">Số Tiền</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-mid-gray text-sm">
                    Không tìm thấy bản ghi giao dịch nào tương ứng với bộ lọc của bạn.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-warm-white/50 transition-colors">
                    <td className="p-4 text-stone-500 font-sans font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {new Date(row.date).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-matte-black max-w-xs truncate" title={row.title}>
                      <div>{row.title}</div>
                      {row.notes && <MarkdownRenderer text={row.notes} className="text-[10px] text-stone-400 font-normal italic mt-0.5" />}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold font-sans border uppercase ${
                        row.type === "income"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                          : "bg-red-50 text-red-800 border-red-100"
                      }`}>
                        {row.categoryLabel}
                      </span>
                    </td>
                    <td className="p-4 text-stone-600 font-medium">{row.paymentMethodLabel}</td>
                    <td className="p-4 text-stone-700">{row.actor}</td>
                    <td className={`p-4 text-right font-sans font-black text-xs ${
                      row.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {row.type === "income" ? "+" : "-"}{row.amount.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteRecord(row.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded bg-transparent border-0 cursor-pointer"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACCOUNTING FLOW EXPLANATION FOOTER */}
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3.5">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <span className="font-extrabold text-amber-900 block uppercase tracking-wider text-[11px] font-display">QUY TẮC LIÊN THÔNG VỚI BỘ PHẬN THU NGÂN (POS) & SẢNH CHỜ</span>
          <p className="text-amber-800 text-xs font-sans leading-relaxed">
            Hệ thống OS tự động đồng bộ doanh thu dịch vụ rửa xe: Ngay khi thu ngân bấm <strong>Xác nhận Thanh toán</strong> trong phân hệ POS, một bản ghi doanh thu rửa xe <strong>Thu (Income)</strong> tương ứng sẽ tự động được hạch toán trực tiếp vào Sổ cái Kế toán để tránh hao hụt và rà soát số liệu chéo.
          </p>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg w-full h-fit bg-white rounded-2xl shadow-2xl z-[101] border border-stone-200 overflow-hidden"
            >
              <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-warm-white">
                <span className="font-display font-black text-xs text-matte-black uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-forest-green" /> HẠCH TOÁN CHỨNG TỪ GIAO DỊCH MỚI
                </span>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-matte-black bg-transparent border-0 cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="p-5 space-y-4 font-sans text-xs">
                {/* TRANSACTION TYPE */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Phân loại giao dịch</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setType("income");
                        setCategory("wash_service");
                      }}
                      className={`py-2.5 rounded-xl border font-bold text-center uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 ${
                        type === "income"
                          ? "bg-emerald-50 border-emerald-500/30 text-emerald-700 font-extrabold"
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4 stroke-[2.5]" /> Khoản Thu (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setType("expense");
                        setCategory("chemical_material");
                      }}
                      className={`py-2.5 rounded-xl border font-bold text-center uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 ${
                        type === "expense"
                          ? "bg-red-50 border-red-500/30 text-red-700 font-extrabold"
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
                      }`}
                    >
                      <ArrowDownRight className="h-4 w-4 stroke-[2.5]" /> Khoản Chi (-)
                    </button>
                  </div>
                </div>

                {/* TITLE */}
                <div className="space-y-1">
                  <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Mô tả giao dịch / Tiêu đề chứng từ</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Nhập mua khăn lau microfiber sảnh A, Doanh thu từ máy pha cafe..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-matte-black focus:outline-none focus:border-brand-green focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* AMOUNT */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Số tiền giao dịch (VND)</label>
                    <input
                      type="text"
                      required
                      placeholder="ví dụ: 250.000"
                      value={formatNumberWithDot(amount)}
                      onChange={(e) => setAmount(parseNumberFromDot(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-sans font-semibold text-matte-black focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>

                  {/* CATEGORY */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Danh mục tài chính</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-green focus:bg-white"
                    >
                      {type === "income" ? (
                        <>
                          <option value="wash_service">Doanh thu dịch vụ rửa xe</option>
                          <option value="merchandise">Doanh thu bán lẻ phụ kiện</option>
                          <option value="member_registration">Đăng ký thẻ thành viên</option>
                          <option value="other_income">Thu nhập khác</option>
                        </>
                      ) : (
                        <>
                          <option value="chemical_material">Chi mua hóa chất & vật tư</option>
                          <option value="staff_salary">Chi lương & Thưởng nhân sự</option>
                          <option value="utilities">Chi điện, nước, internet</option>
                          <option value="equipment_repair">Bảo trì & sửa chữa thiết bị</option>
                          <option value="marketing">Chi phí quảng cáo & Marketing</option>
                          <option value="other_expense">Chi phí khác</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* PAYMENT METHOD */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Hình thức thanh toán</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-green focus:bg-white"
                    >
                      <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      <option value="cash">Tiền mặt</option>
                      <option value="e_wallet">Ví điện tử</option>
                    </select>
                  </div>

                  {/* ACTOR */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Người hạch toán</label>
                    <input
                      type="text"
                      required
                      value={actor}
                      onChange={(e) => setActor(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-matte-black focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                  </div>
                </div>

                {/* NOTES */}
                <div className="space-y-1">
                  <label className="font-extrabold text-stone-700 uppercase block tracking-wider text-[9px]">Ghi chú chứng từ (Không bắt buộc)</label>
                  <MarkdownTextarea
                    id="finance-notes"
                    placeholder="Nhập mã hóa đơn, số chứng từ, hoặc người nhận chi tiết..."
                    value={notes}
                    onChange={(val) => setNotes(val)}
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-matte-black hover:bg-stone-900 text-brand-green font-black font-display text-xs uppercase tracking-wider transition cursor-pointer border-0 mt-2 shadow-lg"
                >
                  XÁC NHẬN HẠCH TOÁN GIAO DỊCH
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
