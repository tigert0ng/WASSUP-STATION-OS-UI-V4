import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Users,
  Gift,
  Coins,
  ArrowRight,
  Clock,
  CheckCircle2,
  Phone,
  Eye,
  Send
} from "lucide-react";
import { Customer, Order } from "../../../types/order.types";
import { toast } from "../../../lib/toast";

export type RfmSegment =
  | "champions"
  | "loyal"
  | "potential"
  | "new"
  | "at_risk"
  | "hibernating";

interface CustomerRfmData {
  customer: Customer;
  recencyDays: number;
  frequency: number;
  monetary: number;
  segment: RfmSegment;
  segmentLabel: string;
  segmentColor: string;
}

interface CrmRfmAnalysisProps {
  customers: Customer[];
  orders: Order[];
  onSelectCustomer: (customer: Customer) => void;
  onOpenCreateVoucherForSegment: (segment: RfmSegment, customerIds: string[]) => void;
}

export default function CrmRfmAnalysis({
  customers,
  orders,
  onSelectCustomer,
  onOpenCreateVoucherForSegment
}: CrmRfmAnalysisProps) {
  const [selectedSegment, setSelectedSegment] = useState<RfmSegment | "all">("all");

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Compute RFM data for all customers
  const rfmList: CustomerRfmData[] = useMemo(() => {
    const now = Date.now();

    return customers.map((c) => {
      const cOrders = orders.filter(
        (o) => o.customerId === c.id || o.customerPhone === c.phone
      );

      const paidOrders = cOrders.filter(
        (o) => o.status === "paid" || o.status === "closed"
      );

      const monetary = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const frequency = paidOrders.length;

      let recencyDays = 999;
      if (cOrders.length > 0) {
        const dates = cOrders.map((o) => new Date(o.createdAt).getTime()).filter((t) => !isNaN(t));
        if (dates.length > 0) {
          const lastDate = Math.max(...dates);
          recencyDays = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));
        }
      }

      // Segmentation classification logic
      let segment: RfmSegment = "hibernating";
      let segmentLabel = "Ngủ đông / Rời bỏ";
      let segmentColor = "bg-stone-100 text-stone-700 border-stone-200";

      if (frequency >= 5 && monetary >= 3000000 && recencyDays <= 30) {
        segment = "champions";
        segmentLabel = "VIP / Champions";
        segmentColor = "bg-[#A2C62C]/20 text-forest-green border-[#A2C62C]/40";
      } else if (frequency >= 3 && recencyDays <= 60) {
        segment = "loyal";
        segmentLabel = "Khách thân thiết (Loyal)";
        segmentColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      } else if (recencyDays <= 30 && (monetary >= 1000000 || frequency >= 2)) {
        segment = "potential";
        segmentLabel = "Khách tiềm năng (Potential)";
        segmentColor = "bg-blue-50 text-blue-700 border-blue-200";
      } else if (frequency <= 1 && recencyDays <= 30) {
        segment = "new";
        segmentLabel = "Khách hàng mới (New)";
        segmentColor = "bg-purple-50 text-purple-700 border-purple-200";
      } else if (frequency >= 2 && recencyDays > 45 && recencyDays <= 90) {
        segment = "at_risk";
        segmentLabel = "Nguy cơ rời bỏ (At-Risk)";
        segmentColor = "bg-amber-50 text-amber-700 border-amber-200";
      } else {
        segment = "hibernating";
        segmentLabel = "Ngủ đông (Hibernating)";
        segmentColor = "bg-red-50 text-red-700 border-red-200";
      }

      return {
        customer: c,
        recencyDays,
        frequency,
        monetary,
        segment,
        segmentLabel,
        segmentColor
      };
    });
  }, [customers, orders]);

  // Segment metrics
  const segmentStats = useMemo(() => {
    const stats: Record<RfmSegment, { count: number; totalMonetary: number; customerIds: string[] }> = {
      champions: { count: 0, totalMonetary: 0, customerIds: [] },
      loyal: { count: 0, totalMonetary: 0, customerIds: [] },
      potential: { count: 0, totalMonetary: 0, customerIds: [] },
      new: { count: 0, totalMonetary: 0, customerIds: [] },
      at_risk: { count: 0, totalMonetary: 0, customerIds: [] },
      hibernating: { count: 0, totalMonetary: 0, customerIds: [] }
    };

    rfmList.forEach((item) => {
      stats[item.segment].count += 1;
      stats[item.segment].totalMonetary += item.monetary;
      stats[item.segment].customerIds.push(item.customer.id);
    });

    return stats;
  }, [rfmList]);

  // Filtered list
  const displayList = useMemo(() => {
    if (selectedSegment === "all") return rfmList;
    return rfmList.filter((item) => item.segment === selectedSegment);
  }, [rfmList, selectedSegment]);

  const atRiskCount = segmentStats.at_risk.count + segmentStats.hibernating.count;

  const handleTriggerWinback = () => {
    const targetIds = [...segmentStats.at_risk.customerIds, ...segmentStats.hibernating.customerIds];
    if (targetIds.length === 0) {
      toast.info("CHƯA CÓ KHÁCH NGUY CƠ", "Hiện tại không có hội viên nào nằm trong phân khúc nguy cơ rời bỏ.");
      return;
    }
    onOpenCreateVoucherForSegment("at_risk", targetIds);
  };

  return (
    <div className="space-y-4 text-left font-sans" id="crm-rfm-container">
      {/* HEADER & WIN-BACK CTA */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase text-matte-black font-display tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-forest-green" />
            PHÂN TÍCH MA TRẬN RFM (S4.13)
          </h3>
          <p className="text-[11px] text-mid-gray font-sans mt-0.5">
            Tự động chấm điểm Recency (Lần ghé gần nhất), Frequency (Số lần ghé) & Monetary (Tổng chi tiêu) để phân nhóm tiếp thị mục tiêu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerWinback}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs font-display uppercase tracking-wider transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 border-0"
        >
          <Gift className="h-4 w-4" />
          Kích hoạt chiến dịch Win-Back ({atRiskCount} khách)
        </button>
      </div>

      {/* SEGMENT CARDS MATRIX */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5" id="rfm-segments-grid">
        {[
          { id: "champions" as const, title: "VIP / Champions", desc: "R ≤ 30d, F ≥ 5", color: "border-forest-green bg-brand-green/10" },
          { id: "loyal" as const, title: "Khách thân thiết", desc: "F ≥ 3, R ≤ 60d", color: "border-emerald-400 bg-emerald-50/50" },
          { id: "potential" as const, title: "Tiềm năng", desc: "Mới & Chi tiêu tốt", color: "border-blue-400 bg-blue-50/50" },
          { id: "new" as const, title: "Khách mới", desc: "Lần đầu ghé trạm", color: "border-purple-400 bg-purple-50/50" },
          { id: "at_risk" as const, title: "Nguy cơ rời bỏ", desc: "Đã 45-90d chưa ghé", color: "border-amber-400 bg-amber-50/50" },
          { id: "hibernating" as const, title: "Ngủ đông / Mất kết nối", desc: "> 90d chưa quay lại", color: "border-red-400 bg-red-50/50" }
        ].map((seg) => {
          const stats = segmentStats[seg.id];
          const isSelected = selectedSegment === seg.id;

          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => setSelectedSegment(isSelected ? "all" : seg.id)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? "ring-2 ring-forest-green shadow-md bg-white border-forest-green"
                  : `${seg.color} hover:shadow-xs`
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase block text-slate-800 truncate">
                  {seg.title}
                </span>
                <span className="text-[9px] text-mid-gray block">{seg.desc}</span>
              </div>

              <div>
                <div className="text-lg font-black font-display text-matte-black">
                  {stats.count} <span className="text-[10px] font-normal text-mid-gray">khách</span>
                </div>
                <span className="text-[9px] text-forest-green font-bold block truncate">
                  {formatVnd(stats.totalMonetary)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CUSTOMERS IN SELECTED SEGMENT TABLE */}
      <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-xs" id="rfm-customers-table">
        <div className="px-4 py-3 bg-stone-50 border-b border-[#e5e5e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-forest-green" />
            <span className="text-xs font-black uppercase text-matte-black font-display tracking-wider">
              DANH SÁCH HỘI VIÊN THEO PHÂN KHÚC: {selectedSegment === "all" ? "TẤT CẢ" : selectedSegment.toUpperCase()} ({displayList.length})
            </span>
          </div>

          {selectedSegment !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedSegment("all")}
              className="text-xs font-bold text-forest-green hover:underline cursor-pointer"
            >
              Xem tất cả phân khúc
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-stone-50/50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                <th className="p-3 pl-4">Hội viên</th>
                <th className="p-3">Phân khúc RFM</th>
                <th className="p-3 text-center">Recency (Lần cuối)</th>
                <th className="p-3 text-center">Frequency (Số đơn)</th>
                <th className="p-3 text-right">Monetary (Tổng tiền)</th>
                <th className="p-3 pr-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                    Không có hội viên nào trong phân khúc này.
                  </td>
                </tr>
              ) : (
                displayList.map((item) => (
                  <tr key={item.customer.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3 pl-4">
                      <div className="font-bold text-slate-900">{item.customer.name}</div>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1 font-sans">
                        <Phone className="h-2.5 w-2.5" /> {item.customer.phone}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${item.segmentColor}`}
                      >
                        {item.segmentLabel}
                      </span>
                    </td>

                    <td className="p-3 text-center font-bold text-slate-700">
                      {item.recencyDays === 999 ? "Chưa ghé" : `${item.recencyDays} ngày trước`}
                    </td>

                    <td className="p-3 text-center font-bold text-slate-900">
                      {item.frequency} lần
                    </td>

                    <td className="p-3 text-right font-extrabold text-forest-green">
                      {formatVnd(item.monetary)}
                    </td>

                    <td className="p-3 pr-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(item.customer)}
                        className="px-3 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <Eye className="h-3.5 w-3.5 text-forest-green" /> Hồ sơ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
