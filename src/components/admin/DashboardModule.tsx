import React, { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  DollarSign,
  Clock,
  Wrench,
  Users,
  Layers,
  Settings,
  CheckCircle,
  Activity,
  AlertTriangle,
  Play,
  CheckCircle2,
  Check,
  RotateCcw,
  Car,
  ChevronDown,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Line
} from "recharts";
import { OrderStatusView, WoStatus } from "../../types/workOrder.types";
import { Booth } from "../../types/order.types";
import { simActions } from "../../lib/supabase/client";

interface DashboardModuleProps {
  orders: OrderStatusView[];
  revenueStats: any;
  booths: Booth[];
  staff: any[];
  onDispatchClick?: () => void;
}

export default function DashboardModule({
  orders,
  revenueStats,
  booths,
  staff,
  onDispatchClick
}: DashboardModuleProps) {
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [targetInput, setTargetInput] = useState(revenueStats.target);
  const [warningInput, setWarningInput] = useState(revenueStats.warning);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");

  const handleUpdateThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    simActions.updateThresholds(Number(targetInput), Number(warningInput));
    setShowThresholdConfig(false);
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  // 1. Chart Mock Data based on filter
  const chartDataMap = {
    day: [
      { name: "07:00", revenue: 4500000, vehicles: 12 },
      { name: "09:00", revenue: 8200000, vehicles: 24 },
      { name: "11:00", revenue: 12500000, vehicles: 35 },
      { name: "13:00", revenue: 15100000, vehicles: 42 },
      { name: "15:00", revenue: revenueStats.totalRevenue * 0.85, vehicles: Math.round(revenueStats.orderCount * 0.8) },
      { name: "Hiện tại", revenue: revenueStats.totalRevenue, vehicles: revenueStats.orderCount }
    ],
    week: [
      { name: "Thứ 2", revenue: 22000000, vehicles: 62 },
      { name: "Thứ 3", revenue: 28500000, vehicles: 78 },
      { name: "Thứ 4", revenue: 31000000, vehicles: 85 },
      { name: "Thứ 5", revenue: 27000000, vehicles: 70 },
      { name: "Thứ 6", revenue: 38000000, vehicles: 95 },
      { name: "Thứ 7", revenue: 52000000, vehicles: 140 },
      { name: "Chủ Nhật", revenue: revenueStats.totalRevenue, vehicles: revenueStats.orderCount }
    ],
    month: [
      { name: "Tuần 1", revenue: 142000000, vehicles: 410 },
      { name: "Tuần 2", revenue: 165000000, vehicles: 480 },
      { name: "Tuần 3", revenue: 189000000, vehicles: 550 },
      { name: "Tuần hiện tại", revenue: revenueStats.totalRevenue * 4, vehicles: revenueStats.orderCount * 4 }
    ]
  };

  const activeChartData = chartDataMap[timeRange];

  // 2. Service Mix Analysis Data
  // Mix chuẩn: W0 35%, W1 44%, W2 12%, W3 5%, W4 2%, W5 1%, Khác 1%
  const idealMixes = {
    W0: 35,
    W1: 44,
    W2: 12,
    W3: 5,
    W4: 2,
    W5: 1,
    Khác: 1
  };

  // Calculate actual mixes
  const totalOrders = orders.length || 1;
  const packageCounts: { [key: string]: number } = {
    W0: 0,
    W1: 0,
    W2: 0,
    W3: 0,
    W4: 0,
    W5: 0,
    Khác: 0
  };

  orders.forEach(o => {
    if (packageCounts[o.packageCode] !== undefined) {
      packageCounts[o.packageCode]++;
    } else {
      packageCounts["Khác"]++;
    }
  });

  const actualMixes = Object.keys(idealMixes).map(code => {
    const count = packageCounts[code];
    const percentage = Math.round((count / totalOrders) * 100);
    const ideal = idealMixes[code as keyof typeof idealMixes];
    const diff = percentage - ideal;
    const isHighlight = Math.abs(diff) > 10;

    return {
      code,
      count,
      percentage,
      ideal,
      diff,
      isHighlight
    };
  });

  return (
    <div className="space-y-6">
      {/* MODULE HEADER AND QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2">
        <div>

          <h1 className="text-3xl font-extrabold tracking-tight text-matte-black font-display uppercase">BÀN ĐIỀU PHỐI WASSUP</h1>
          <p className="text-mid-gray text-sm mt-1 font-sans">Đồng bộ hàng chờ thời gian thực, quản lý buồng rửa xe và giám sát mục tiêu doanh thu</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowThresholdConfig(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-white text-matte-black hover:bg-warm-white transition text-xs font-extrabold font-display tracking-wide shadow-sm cursor-pointer"
          >
            <Settings className="h-4 w-4 text-mid-gray" />
            CẤU HÌNH NGƯỠNG DOANH THU
          </button>
        </div>
      </div>

      {/* ROW 1: 4 TOP METRIC CARDS WITH REVENUE PROGRESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* CARD 1: TODAY'S REVENUE WITH LIVE PROGRESS */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <TrendingUp className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Doanh thu hôm nay</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-matte-black tracking-tight">
              {formatVnd(revenueStats.totalRevenue)}
            </h3>

            {/* Target warning level metrics indicator */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-sans mb-1 text-mid-gray">
                <span>Tiến độ: {revenueStats.progressPercent}%</span>
                <span>Mục tiêu: {formatVnd(revenueStats.target)}</span>
              </div>
              
              {/* Progress track */}
              <div className="w-full h-2.5 bg-warm-white rounded-full overflow-hidden relative border border-[#e5e5e5]">
                {/* Warning marker line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" 
                  style={{ left: `${(revenueStats.warning / revenueStats.target) * 100}%` }}
                  title="Ngưỡng cảnh báo doanh thu thấp"
                />
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    revenueStats.targetMet 
                      ? "bg-brand-green" 
                      : revenueStats.warningLevelMet 
                        ? "bg-forest-green" 
                        : "bg-amber-500"
                  }`} 
                  style={{ width: `${revenueStats.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Threshold flags badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {revenueStats.targetMet ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-sans px-2.5 py-1 rounded-md bg-brand-green text-matte-black uppercase tracking-widest">
                  <CheckCircle className="h-3 w-3" /> Đạt Target Ngày
                </span>
              ) : revenueStats.warningLevelMet ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-sans px-2.5 py-1 rounded-md bg-brand-green-light text-forest-green border border-brand-green/20 uppercase tracking-widest">
                  <Activity className="h-3 w-3" /> Trên Cảnh Báo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-sans px-2.5 py-1 rounded-md bg-red-100 text-red-700 border border-red-200 uppercase tracking-widest animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Doanh Thu Thấp
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: CAR WASH QUEUE (HÀNG CHỜ) */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <Clock className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Hàng chờ điều phối</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-matte-black tracking-tight">
              {revenueStats.queuedCount} <span className="text-sm font-normal text-mid-gray">lệnh chờ</span>
            </h3>
            
            <div className="pt-2 text-xs font-sans text-mid-gray space-y-1">
              <div className="flex justify-between">
                <span>Đang thi công:</span>
                <span className="text-matte-black font-bold">{revenueStats.activeCount} xe</span>
              </div>
              <div className="flex justify-between">
                <span>Chờ phân buồng:</span>
                <span className="text-amber-600 font-bold">{orders.filter(o => o.status === 'queued').length} xe</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: HOÀN THÀNH VÀ REWORK */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <Wrench className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Hiệu suất trạm</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <Wrench className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-matte-black tracking-tight">
              {revenueStats.completedCount} <span className="text-sm font-normal text-mid-gray">đã xong</span>
            </h3>
            
            <div className="pt-2 text-xs font-sans text-mid-gray space-y-1">
              <div className="flex justify-between">
                <span>Yêu cầu rửa lại (Rework):</span>
                <span className={`font-bold ${revenueStats.reworkCount > 0 ? "text-red-500 animate-pulse" : "text-matte-black"}`}>
                  {revenueStats.reworkCount} lượt
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-mid-gray italic">
                <span>* Rework tối đa 2 lần/lệnh</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: DOANH THU TRUNG BÌNH & GIAO CA */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <Users className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Vé trung bình (Avg Ticket)</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold font-display text-matte-black tracking-tight">
              {formatVnd(orders.length > 0 ? Math.round(revenueStats.totalRevenue / orders.length) : 252510)}
            </h3>
            
            <div className="pt-1 text-xs font-sans text-mid-gray space-y-1">
              <div className="flex justify-between">
                <span>Target chuẩn:</span>
                <span className="text-matte-black font-bold">252.510 VND</span>
              </div>
              <div className="flex justify-between">
                <span>Ca hoạt động:</span>
                <span className="text-matte-black">Ca Sáng (07:00 - 15:00)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ TRỰC QUAN DOANH THU VÀ LƯỢT XE */}
      <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4">
          <div>
            <h3 className="font-display font-extrabold text-sm text-matte-black tracking-wider uppercase flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-forest-green" />
              BIỂU ĐỒ TIẾN TRÌNH VẬN HÀNH (TELEMETRY CHARTS)
            </h3>
            <p className="text-xs text-mid-gray font-sans mt-0.5">Giám sát tổng doanh thu tích lũy kết hợp số lượt xe theo thời gian thực</p>
          </div>

          <div className="flex bg-warm-white p-1 rounded-xl border border-[#e5e5e5] text-xs font-sans">
            <button
              onClick={() => setTimeRange("day")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeRange === "day" ? "bg-matte-black text-white" : "text-mid-gray hover:text-matte-black"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeRange === "week" ? "bg-matte-black text-white" : "text-mid-gray hover:text-matte-black"
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeRange === "month" ? "bg-matte-black text-white" : "text-mid-gray hover:text-matte-black"
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activeChartData} margin={{ top: 10, right: -5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#41c590" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#41c590" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
              <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip 
                formatter={(value: any, name: any) => {
                  if (name === "Doanh thu") return [formatVnd(value), name];
                  return [`${value} xe`, name];
                }}
                contentStyle={{ background: "#1a1a1a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#257454" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
              <Line yAxisId="right" type="monotone" dataKey="vehicles" name="Lượt xe" stroke="#ffaa00" strokeWidth={2.5} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RENDER ROW 2: ACTIVE BOOTHS MONITOR GRID */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <Layers className="h-5 w-5 text-forest-green" />
          SƠ ĐỒ TRẠNG THÁI BUỒNG THI CÔNG (BAY STATUS MONITOR)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {booths.map((booth) => {
            const activeWos = orders.filter(o => o.boothId === booth.id && o.status !== 'done');
            const activeWo = activeWos[0];

            return (
              <div
                key={booth.id}
                className={`border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden shadow-sm ${
                  activeWo
                    ? "bg-white border-2 border-brand-green ring-4 ring-brand-green-light"
                    : "bg-white border-[#e5e5e5] hover:border-brand-green"
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3 mb-4">
                  <h3 className="font-display font-extrabold text-sm text-matte-black tracking-wide">{booth.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold font-sans uppercase tracking-widest border ${
                      activeWo
                        ? "bg-brand-green text-matte-black border-brand-green"
                        : "bg-warm-white text-mid-gray border-[#e5e5e5]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${activeWo ? 'bg-matte-black animate-pulse' : 'bg-mid-gray'}`} />
                    {activeWo ? "BẬN (BUSY)" : "TRỐNG (IDLE)"}
                  </span>
                </div>

                {activeWo ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-warm-white p-3 rounded-xl border border-[#e5e5e5]">
                      <div>
                        <span className="text-[10px] font-sans font-extrabold text-mid-gray block uppercase">Biển số xe</span>
                        <span className="text-base font-extrabold font-sans text-matte-black tracking-wider">
                          {activeWo.licensePlate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-sans font-extrabold text-mid-gray block uppercase">Dịch vụ</span>
                        <span className="inline-flex text-xs font-extrabold font-sans px-2.5 py-1 rounded bg-brand-green text-matte-black">
                          {activeWo.packageCode}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-sans bg-warm-white p-2.5 rounded-lg border border-[#e5e5e5]">
                      <div>
                        <span className="text-[9px] text-mid-gray font-extrabold block uppercase">KTV Điều Phối</span>
                        <span className="text-matte-black truncate block font-bold">
                          {activeWo.technicianName || "Chưa gán"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-mid-gray font-extrabold block uppercase">Bước Vận Hành</span>
                        <span className="text-forest-green font-extrabold block uppercase tracking-wider text-[11px]">
                          {activeWo.status === 'assigned' ? 'Đã gán' : activeWo.status === 'in_progress' ? 'Đang rửa' : activeWo.status === 'quality_check' ? 'QC Check' : activeWo.status === 'rework' ? 'Rework' : activeWo.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-sans font-bold text-mid-gray">
                        <span>Tiến độ dịch vụ</span>
                        <span>{activeWo.status === 'assigned' ? '15%' : activeWo.status === 'in_progress' ? '55%' : activeWo.status === 'quality_check' ? '85%' : activeWo.status === 'rework' ? '40%' : '0%'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#eaeaea] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-green transition-all duration-500"
                          style={{ 
                            width: activeWo.status === 'assigned' 
                              ? '15%' 
                              : activeWo.status === 'in_progress' 
                                ? '55%' 
                                : activeWo.status === 'quality_check' 
                                  ? '85%' 
                                  : activeWo.status === 'rework'
                                    ? '40%'
                                    : '0%' 
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#e5e5e5] flex flex-wrap gap-1.5">
                      {activeWo.status === 'assigned' && (
                        <button
                          onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'in_progress')}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green hover:bg-brand-green-hover text-matte-black text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5" /> BẮT ĐẦU RỬA
                        </button>
                      )}
                      {activeWo.status === 'in_progress' && (
                        <button
                          onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'quality_check')}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> QC CHECK
                        </button>
                      )}
                      {activeWo.status === 'quality_check' && (
                        <div className="grid grid-cols-2 gap-1.5 w-full">
                          <button
                            onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'done')}
                            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> HOÀN THÀNH
                          </button>
                          <button
                            onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'rework')}
                            disabled={activeWo.reworkCount >= 2}
                            className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold font-display transition cursor-pointer ${
                              activeWo.reworkCount >= 2 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                                : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                            }`}
                            title={activeWo.reworkCount >= 2 ? "Rework đạt tối đa 2 lần!" : "Yêu cầu thi công lại"}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> REWORK ({activeWo.reworkCount}/2)
                          </button>
                        </div>
                      )}
                      {activeWo.status === 'rework' && (
                        <button
                          onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'in_progress')}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5" /> CHẠY LẠI REWORK
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-[#e5e5e5] rounded-xl bg-warm-white">
                    <Car className="h-8 w-8 text-mid-gray mb-2" />
                    <span className="text-xs font-display text-matte-black font-extrabold tracking-wider">BUỒNG TRỐNG (IDLE)</span>
                    <span className="text-[10px] text-mid-gray mt-1 font-sans">
                      {onDispatchClick ? "Gán lệnh chờ tại phân hệ tiếp nhận & điều phối" : "Đang đợi phân bổ xe..."}
                    </span>
                    {onDispatchClick && (
                      <button
                        onClick={onDispatchClick}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-matte-black hover:bg-matte-black/95 text-white rounded-lg text-[10px] font-black uppercase font-display cursor-pointer"
                      >
                        Đến Tiếp Nhận
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SERVICE MIX RATIO ANALYSIS */}
      <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-extrabold text-sm text-matte-black tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-forest-green" />
            PHÂN TÍCH MIX GÓI DỊCH VỤ (SERVICE MIX BENCHMARKING)
          </h3>
          <p className="text-xs text-mid-gray font-sans mt-0.5">So sánh phân bổ tỷ lệ các gói rửa xe thực tế trong ngày với mix chuẩn thiết kế tối ưu doanh thu</p>
        </div>

        <div className="overflow-x-auto border border-[#e5e5e5] rounded-xl">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-warm-white border-b border-[#e5e5e5] text-mid-gray">
                <th className="p-3.5 font-extrabold uppercase text-[10px] tracking-wider">Mã Gói</th>
                <th className="p-3.5 font-extrabold uppercase text-[10px] tracking-wider text-center">Số Lượng Thực Tế</th>
                <th className="p-3.5 font-extrabold uppercase text-[10px] tracking-wider text-center">Tỷ Lệ Thực Tế</th>
                <th className="p-3.5 font-extrabold uppercase text-[10px] tracking-wider text-center">Tỷ Lệ Mục Tiêu (Mix Chuẩn)</th>
                <th className="p-3.5 font-extrabold uppercase text-[10px] tracking-wider text-center">Chênh Lệch</th>
                <th className="p-3.5 font-extrabold uppercase text-[10px] tracking-wider text-right">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {actualMixes.map((mix) => (
                <tr 
                  key={mix.code} 
                  className={`transition-colors ${
                    mix.isHighlight 
                      ? "bg-amber-500/10 text-amber-900 hover:bg-amber-500/15" 
                      : "hover:bg-warm-white/50"
                  }`}
                >
                  <td className="p-3.5 font-extrabold text-matte-black font-sans text-sm">{mix.code}</td>
                  <td className="p-3.5 font-bold text-center text-sm">{mix.count} xe</td>
                  <td className="p-3.5 font-black text-center text-sm">{mix.percentage}%</td>
                  <td className="p-3.5 font-medium text-center text-sm text-mid-gray">{mix.ideal}%</td>
                  <td className={`p-3.5 font-extrabold text-center text-sm ${
                    mix.diff > 0 ? "text-emerald-600" : mix.diff < 0 ? "text-red-500" : "text-matte-black"
                  }`}>
                    {mix.diff > 0 ? `+${mix.diff}` : mix.diff}%
                  </td>
                  <td className="p-3.5 text-right">
                    {mix.isHighlight ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 text-matte-black font-extrabold text-[10px] uppercase tracking-wider animate-pulse">
                        ⚠️ Lệch Lớn (&gt;10%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-green-light text-forest-green border border-brand-green/20 font-extrabold text-[10px] uppercase tracking-wider">
                        ✅ Đạt chuẩn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* THRESHOLD CONFIGURATION MODAL DIALOG */}
      {showThresholdConfig && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase mb-4 flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
              <Settings className="h-5 w-5 text-forest-green" />
              CẤU HÌNH NGƯỠNG TARGET NGÀY
            </h3>

            <form onSubmit={handleUpdateThresholds} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Chỉ tiêu Doanh thu Ngày (Target)
                </label>
                <input
                  type="number"
                  required
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Ngưỡng Cảnh báo Doanh thu Thấp (Warning)
                </label>
                <input
                  type="number"
                  required
                  value={warningInput}
                  onChange={(e) => setWarningInput(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowThresholdConfig(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold font-display uppercase cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                >
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
