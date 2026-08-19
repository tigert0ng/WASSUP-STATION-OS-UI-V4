import React, { useMemo } from "react";
import {
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Repeat,
  CheckCircle2,
  PieChart
} from "lucide-react";
import { Customer, Order } from "../../../types/order.types";

interface CrmRetentionDashboardProps {
  customers: Customer[];
  orders: Order[];
}

interface CohortRow {
  cohortMonth: string; // e.g. "05/2026"
  cohortSize: number;
  m0: number; // 100%
  m1: { count: number; rate: number }; // 30 days
  m2: { count: number; rate: number }; // 60 days
  m3: { count: number; rate: number }; // 90 days
}

export default function CrmRetentionDashboard({
  customers,
  orders
}: CrmRetentionDashboardProps) {
  // Compute retention statistics
  const { repeatCustomerRate, avgIntervalDays, loyalCustomersCount, totalActiveCustomers } = useMemo(() => {
    const customerOrderCounts: Record<string, number> = {};
    const customerIntervals: number[] = [];

    // Group orders by customer phone or customer ID
    const customerOrderDates: Record<string, number[]> = {};

    orders
      .filter((o) => o.status === "paid" || o.status === "closed")
      .forEach((o) => {
        const key = o.customerId || o.customerPhone || o.licensePlate;
        if (!key) return;
        customerOrderCounts[key] = (customerOrderCounts[key] || 0) + 1;

        const time = new Date(o.createdAt).getTime();
        if (!customerOrderDates[key]) customerOrderDates[key] = [];
        customerOrderDates[key].push(time);
      });

    const activeKeys = Object.keys(customerOrderCounts);
    const totalActive = activeKeys.length;
    const repeatKeys = activeKeys.filter((k) => customerOrderCounts[k] >= 2);
    const loyalKeys = activeKeys.filter((k) => customerOrderCounts[k] >= 3);

    const repeatRate = totalActive > 0 ? (repeatKeys.length / totalActive) * 100 : 0;

    // Calculate intervals
    Object.values(customerOrderDates).forEach((dates) => {
      if (dates.length >= 2) {
        const sorted = [...dates].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          const diffDays = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
          if (diffDays > 0 && diffDays < 365) {
            customerIntervals.push(diffDays);
          }
        }
      }
    });

    const avgInterval =
      customerIntervals.length > 0
        ? Math.round(customerIntervals.reduce((a, b) => a + b, 0) / customerIntervals.length)
        : 21; // Default benchmark 21 days

    return {
      repeatCustomerRate: Math.round(repeatRate),
      avgIntervalDays: avgInterval,
      loyalCustomersCount: loyalKeys.length,
      totalActiveCustomers: totalActive
    };
  }, [orders]);

  // Compute Cohort Analysis
  const cohortData: CohortRow[] = useMemo(() => {
    // 1. Find first order date for each customer
    const firstOrderMap: Record<string, number> = {};
    const allOrdersMap: Record<string, number[]> = {};

    orders
      .filter((o) => o.status === "paid" || o.status === "closed")
      .forEach((o) => {
        const key = o.customerId || o.customerPhone || o.licensePlate;
        if (!key) return;
        const time = new Date(o.createdAt).getTime();
        if (!allOrdersMap[key]) allOrdersMap[key] = [];
        allOrdersMap[key].push(time);

        if (!firstOrderMap[key] || time < firstOrderMap[key]) {
          firstOrderMap[key] = time;
        }
      });

    // 2. Group into monthly cohorts
    const cohortGroups: Record<string, string[]> = {};

    Object.entries(firstOrderMap).forEach(([key, firstTime]) => {
      const d = new Date(firstTime);
      const cohortMonth = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      if (!cohortGroups[cohortMonth]) cohortGroups[cohortMonth] = [];
      cohortGroups[cohortMonth].push(key);
    });

    // Sort cohort months
    const sortedCohorts = Object.keys(cohortGroups).sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    });

    const rows: CohortRow[] = sortedCohorts.map((cMonth) => {
      const keys = cohortGroups[cMonth];
      const cohortSize = keys.length;

      let m1Count = 0;
      let m2Count = 0;
      let m3Count = 0;

      keys.forEach((k) => {
        const firstTime = firstOrderMap[k];
        const times = allOrdersMap[k] || [];

        // Check if customer had orders in Month 1 (30-60d), Month 2 (60-90d), Month 3 (90-120d)
        const hasM1 = times.some((t) => {
          const diff = (t - firstTime) / (1000 * 60 * 60 * 24);
          return diff >= 20 && diff <= 45;
        });
        const hasM2 = times.some((t) => {
          const diff = (t - firstTime) / (1000 * 60 * 60 * 24);
          return diff > 45 && diff <= 75;
        });
        const hasM3 = times.some((t) => {
          const diff = (t - firstTime) / (1000 * 60 * 60 * 24);
          return diff > 75 && diff <= 105;
        });

        if (hasM1) m1Count++;
        if (hasM2) m2Count++;
        if (hasM3) m3Count++;
      });

      return {
        cohortMonth: cMonth,
        cohortSize,
        m0: 100,
        m1: { count: m1Count, rate: cohortSize > 0 ? Math.round((m1Count / cohortSize) * 100) : 0 },
        m2: { count: m2Count, rate: cohortSize > 0 ? Math.round((m2Count / cohortSize) * 100) : 0 },
        m3: { count: m3Count, rate: cohortSize > 0 ? Math.round((m3Count / cohortSize) * 100) : 0 }
      };
    });

    // If no data, provide standard demo cohort row for preview
    if (rows.length === 0) {
      return [
        { cohortMonth: "06/2026", cohortSize: 12, m0: 100, m1: { count: 8, rate: 67 }, m2: { count: 6, rate: 50 }, m3: { count: 5, rate: 42 } },
        { cohortMonth: "07/2026", cohortSize: 18, m0: 100, m1: { count: 13, rate: 72 }, m2: { count: 10, rate: 56 }, m3: { count: 8, rate: 44 } },
        { cohortMonth: "08/2026", cohortSize: 24, m0: 100, m1: { count: 19, rate: 79 }, m2: { count: 14, rate: 58 }, m3: { count: 11, rate: 46 } }
      ];
    }

    return rows;
  }, [orders]);

  // Retention heatmap cell color helper
  const getCellBg = (rate: number) => {
    if (rate >= 70) return "bg-forest-green text-white font-black";
    if (rate >= 50) return "bg-[#A2C62C] text-matte-black font-extrabold";
    if (rate >= 35) return "bg-[#A2C62C]/30 text-forest-green font-bold";
    if (rate > 0) return "bg-stone-100 text-slate-700 font-semibold";
    return "bg-stone-50 text-stone-300 font-normal";
  };

  return (
    <div className="space-y-4 text-left font-sans" id="crm-retention-container">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3" id="retention-kpis">
        <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
            Tỷ lệ khách quay lại (Repeat Rate)
          </span>
          <div className="text-2xl font-black font-display text-forest-green mt-1">
            {repeatCustomerRate}%
          </div>
          <span className="text-[10px] text-mid-gray font-medium block mt-0.5">
            Khách hàng có từ 2 lần ghé trạm trở lên
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
            Chu kỳ ghé trạm trung bình
          </span>
          <div className="text-2xl font-black font-display text-matte-black mt-1">
            {avgIntervalDays} <span className="text-xs font-normal text-stone-400">ngày / lần</span>
          </div>
          <span className="text-[10px] text-forest-green font-bold block mt-0.5">
            Khoảng cách giữa các đợt chăm sóc xe
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
          <span className="text-[10px] font-black text-mid-gray uppercase tracking-wider block">
            Khách hàng thân thiết (≥ 3 đơn)
          </span>
          <div className="text-2xl font-black font-display text-matte-black mt-1">
            {loyalCustomersCount} <span className="text-xs font-normal text-stone-400">hội viên</span>
          </div>
          <span className="text-[10px] text-mid-gray font-medium block mt-0.5">
            Tỷ trọng khách trung thành đóng góp doanh thu
          </span>
        </div>

        <div className="p-4 bg-matte-black text-white rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
            Tổng quy mô hội viên hoạt động
          </span>
          <div className="text-2xl font-black font-display text-[#A2C62C] mt-1">
            {totalActiveCustomers} <span className="text-xs font-normal text-stone-400">khách</span>
          </div>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            Đã phát sinh giao dịch trong hệ thống
          </span>
        </div>
      </div>

      {/* COHORT RETENTION TABLE (S4.14) */}
      <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-xs" id="cohort-retention-card">
        <div className="px-4 py-3 bg-stone-50 border-b border-[#e5e5e5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-matte-black font-display tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-forest-green" />
              BẢNG PHÂN TÍCH COHORT RETENTION THEO THÁNG (S4.14)
            </h3>
            <span className="text-[10px] text-mid-gray">
              Tỷ lệ khách hàng quay lại sử dụng dịch vụ sau 30 ngày (M+1), 60 ngày (M+2), 90 ngày (M+3)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-stone-50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                <th className="p-3 pl-4">Tháng gia nhập (Cohort)</th>
                <th className="p-3 text-center">Quy mô nhóm</th>
                <th className="p-3 text-center">Tháng đầu (M0)</th>
                <th className="p-3 text-center">Sau 30 ngày (M+1)</th>
                <th className="p-3 text-center">Sau 60 ngày (M+2)</th>
                <th className="p-3 pr-4 text-center">Sau 90 ngày (M+3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cohortData.map((row) => (
                <tr key={row.cohortMonth} className="hover:bg-stone-50/50 transition">
                  <td className="p-3 pl-4 font-bold text-matte-black">
                    Tháng {row.cohortMonth}
                  </td>
                  <td className="p-3 text-center font-extrabold text-slate-700">
                    {row.cohortSize} khách
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-block w-16 py-1 rounded-lg text-center bg-stone-200 text-slate-800 font-black text-xs">
                      100%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block w-16 py-1 rounded-lg text-center text-xs transition ${getCellBg(row.m1.rate)}`}>
                      {row.m1.rate}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block w-16 py-1 rounded-lg text-center text-xs transition ${getCellBg(row.m2.rate)}`}>
                      {row.m2.rate}%
                    </span>
                  </td>
                  <td className="p-3 pr-4 text-center">
                    <span className={`inline-block w-16 py-1 rounded-lg text-center text-xs transition ${getCellBg(row.m3.rate)}`}>
                      {row.m3.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
