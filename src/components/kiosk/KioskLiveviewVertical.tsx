import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Car, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  ChevronRight,
  Search,
  ArrowUpDown,
  Flame,
  Check,
  Activity,
  Layers
} from "lucide-react";
import { getMergedOrderStatusView, OrderStatusView } from "../../lib/supabase/client";

interface KioskLiveviewVerticalProps {
  onStartOrder?: () => void;
  onBackToK1?: () => void;
  stationName?: string;
}

type StatusFilter = 'all' | 'in_progress' | 'queued' | 'done';

export default function KioskLiveviewVertical({
  onStartOrder,
  onBackToK1,
  stationName = "WASSUP Trạm Pilot - Quận 7"
}: KioskLiveviewVerticalProps) {
  const handleStart = onStartOrder || onBackToK1 || (() => {});
  const [orders, setOrders] = useState<OrderStatusView[]>(() => getMergedOrderStatusView());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // asc = thứ tự vào trước đến sau (Order 1, 2, 3...)

  useEffect(() => {
    const update = () => {
      setOrders(getMergedOrderStatusView());
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sort strictly by order creation time / order sequence
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const timeA = new Date(a.orderCreatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.orderCreatedAt || b.createdAt || 0).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [orders, sortDirection]);

  // Counts for status pills
  const counts = useMemo(() => {
    const inProgress = orders.filter(o => 
      o.status === 'in_progress' || o.status === 'quality_check' || o.status === 'rework' || o.status === 'assigned'
    ).length;
    const queued = orders.filter(o => o.status === 'queued').length;
    const done = orders.filter(o => o.status === 'done').length;
    return { all: orders.length, inProgress, queued, done };
  }, [orders]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(ord => {
      // Status filter
      if (activeFilter === 'in_progress') {
        const isProgress = ord.status === 'in_progress' || ord.status === 'quality_check' || ord.status === 'rework' || ord.status === 'assigned';
        if (!isProgress) return false;
      } else if (activeFilter === 'queued') {
        if (ord.status !== 'queued') return false;
      } else if (activeFilter === 'done') {
        if (ord.status !== 'done') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const plate = ord.licensePlate.toLowerCase();
        const pkg = (ord.packageCode || "").toLowerCase();
        if (!plate.includes(term) && !pkg.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [sortedOrders, activeFilter, searchTerm]);

  // Helper for status styling & labels
  const getStatusBadge = (status: OrderStatusView['status']) => {
    switch (status) {
      case 'done':
        return {
          label: "ĐÃ XONG — MỜI NHẬN XE",
          subLabel: "Sẵn sàng bàn giao",
          bgClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
          dotClass: "bg-emerald-500",
          progress: 100,
          progressColor: "bg-emerald-500"
        };
      case 'quality_check':
        return {
          label: "KIỂM TRA CHẤT LƯỢNG (QC)",
          subLabel: "Đang kiểm tra 24 điểm chi tiết",
          bgClass: "bg-purple-50 text-purple-800 border-purple-200",
          dotClass: "bg-purple-500",
          progress: 85,
          progressColor: "bg-purple-500"
        };
      case 'in_progress':
        return {
          label: "ĐANG RỬA & CHĂM SÓC",
          subLabel: "Đang xịt bọt & rửa 360°",
          bgClass: "bg-blue-50 text-blue-800 border-blue-200",
          dotClass: "bg-blue-500",
          progress: 60,
          progressColor: "bg-blue-500"
        };
      case 'assigned':
        return {
          label: "ĐÃ VÀO VỊ TRÍ PHỤC VỤ",
          subLabel: "Kỹ thuật viên đang tiếp nhận",
          bgClass: "bg-amber-50 text-amber-800 border-amber-200",
          dotClass: "bg-amber-500",
          progress: 35,
          progressColor: "bg-amber-500"
        };
      case 'rework':
        return {
          label: "CHĂM SÓC LẠI CHI TIẾT",
          subLabel: "Đang hoàn thiện thêm",
          bgClass: "bg-rose-50 text-rose-800 border-rose-200",
          dotClass: "bg-rose-500",
          progress: 80,
          progressColor: "bg-rose-500"
        };
      case 'queued':
      default:
        return {
          label: "CHỜ RỬA (HÀNG ĐỢI)",
          subLabel: "Chờ đến lượt phục vụ",
          bgClass: "bg-stone-100 text-stone-700 border-stone-300",
          dotClass: "bg-stone-400",
          progress: 15,
          progressColor: "bg-stone-400"
        };
    }
  };

  return (
    <div 
      id="kiosk-liveview-vertical-container"
      className="w-full max-w-xl mx-auto flex flex-col justify-between min-h-[85vh] text-slate-900 select-none space-y-4 py-2"
    >
      {/* 1. Header Banner */}
      <div 
        onClick={handleStart}
        className="bg-white text-slate-900 rounded-3xl p-4.5 border border-stone-200/90 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#A2C62C] hover:bg-lime-50/30 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#A2C62C]/20 text-forest-green flex items-center justify-center font-black border border-[#A2C62C]/30 group-hover:scale-105 transition-transform">
            <Car className="h-5 w-5 text-forest-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-display text-slate-900 uppercase tracking-wider">
                DANH SÁCH XE THEO THỨ TỰ ORDER
              </span>
              <span className="h-2 w-2 rounded-full bg-[#A2C62C] animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              {stationName} • Cập nhật trực tiếp
            </p>
          </div>
        </div>

        <div className="bg-[#A2C62C] group-hover:bg-[#8fb124] text-slate-950 text-[10px] font-black uppercase px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition">
          <span>CHẠM ĐỂ ĐẶT XE</span>
          <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
        </div>
      </div>

      {/* 2. Control Bar: Filter Tabs & Quick Search */}
      <div className="space-y-2.5">
        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            id="filter-all"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-sans font-black text-xs uppercase tracking-wide transition flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'all'
                ? "bg-[#A2C62C] text-slate-950 shadow-sm border border-[#8fb124]"
                : "bg-white text-slate-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>Tất cả</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === 'all' ? "bg-slate-950/15 text-slate-950 font-black" : "bg-stone-100 text-slate-600"}`}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            id="filter-in-progress"
            onClick={() => setActiveFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl font-sans font-black text-xs uppercase tracking-wide transition flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'in_progress'
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>Đang rửa</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === 'in_progress' ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"}`}>
              {counts.inProgress}
            </span>
          </button>

          <button
            type="button"
            id="filter-queued"
            onClick={() => setActiveFilter('queued')}
            className={`px-3 py-1.5 rounded-xl font-display font-black text-xs uppercase tracking-wide transition flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'queued'
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Chờ rửa</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === 'queued' ? "bg-amber-700 text-white" : "bg-amber-50 text-amber-700"}`}>
              {counts.queued}
            </span>
          </button>

          <button
            type="button"
            id="filter-done"
            onClick={() => setActiveFilter('done')}
            className={`px-3 py-1.5 rounded-xl font-display font-black text-xs uppercase tracking-wide transition flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'done'
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Đã xong</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === 'done' ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700"}`}>
              {counts.done}
            </span>
          </button>
        </div>

        {/* Search & Sort Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="kiosk-search-plate-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh biển số xe..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#A2C62C] focus:ring-1 focus:ring-[#A2C62C] transition shadow-2xs"
            />
          </div>

          <button
            type="button"
            id="kiosk-sort-order-toggle"
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            title="Đổi thứ tự hiển thị"
            className="px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-slate-700 text-[11px] font-sans font-bold flex items-center gap-1 hover:bg-stone-50 transition shrink-0"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortDirection === 'asc' ? "Thứ tự 1 → N" : "Mới nhất trước"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Vehicle List (DẠNG LIST THEO THỨ TỰ ORDER) */}
      <div className="flex-1 bg-warm-white border border-stone-200 rounded-3xl p-3 sm:p-4 shadow-sm space-y-3 min-h-[380px] max-h-[55vh] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div
              key="empty-list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-400"
            >
              <Car className="h-10 w-10 text-stone-300 mb-1" />
              <p className="font-display font-black text-sm text-slate-700 uppercase tracking-wide">
                Không tìm thấy xe phù hợp
              </p>
              <p className="text-xs text-slate-400 font-sans max-w-xs">
                {searchTerm ? `Không có xe nào khớp với "${searchTerm}".` : "Hiện không có xe nào trong danh sách."}
              </p>
            </motion.div>
          ) : (
            filteredOrders.map((ord, idx) => {
              const statusInfo = getStatusBadge(ord.status);
              const orderIndex = sortDirection === 'asc' ? idx + 1 : sortedOrders.length - idx;
              const formattedTime = ord.orderCreatedAt || ord.createdAt 
                ? new Date(ord.orderCreatedAt || ord.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : "--:--";

              return (
                <motion.div
                  key={ord.id || `order-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-sm hover:border-[#A2C62C] transition-all space-y-2.5"
                >
                  {/* Top Row: STT, Biển số, Gói dịch vụ */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Số thứ tự Order */}
                      <span className="h-7 w-7 rounded-xl bg-stone-100 text-slate-800 border border-stone-200/90 font-display font-black text-xs flex items-center justify-center shadow-2xs">
                        #{orderIndex < 10 ? `0${orderIndex}` : orderIndex}
                      </span>

                      {/* Biển số xe */}
                      <div className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg shadow-2xs">
                        <span className="font-display font-black text-sm tracking-wider text-slate-900">
                          {ord.licensePlate}
                        </span>
                      </div>
                    </div>

                    {/* Gói dịch vụ & Loại xe */}
                    <div className="text-right">
                      <span className="inline-block font-sans font-black text-[11px] text-slate-900 uppercase bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        {ord.packageCode} • {ord.vehicleSegment.toUpperCase()}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                        Giờ đặt: {formattedTime}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Trạng thái chi tiết & Thanh tiến trình */}
                  <div className="space-y-1.5 pt-1 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusInfo.dotClass} ${ord.status === 'in_progress' ? 'animate-ping' : ''}`} />
                        <span className="font-sans font-black text-[11px] text-slate-900 uppercase tracking-wide">
                          {statusInfo.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-slate-500 font-medium">
                        {statusInfo.subLabel}
                      </span>
                    </div>

                    {/* Thanh tiến độ trực quan */}
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${statusInfo.progressColor}`}
                        style={{ width: `${statusInfo.progress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* 4. Bottom Sticky Action Button */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          id="btn-kiosk-liveview-start-order"
          onClick={handleStart}
          className="w-full py-4.5 bg-[#A2C62C] hover:bg-[#8fb124] active:scale-[0.99] text-slate-950 font-display font-black text-base uppercase tracking-wider rounded-2xl shadow-lg transition flex items-center justify-center gap-2.5 border-0 cursor-pointer"
        >
          <Sparkles className="h-5 w-5 fill-slate-950 stroke-slate-950" />
          <span>CHẠM ĐỂ BẮT ĐẦU ĐẶT DỊCH VỤ</span>
          <ChevronRight className="h-5 w-5 stroke-[3]" />
        </button>
        <p className="text-center text-[11px] text-slate-400 font-sans">
          Màn hình cập nhật trực tiếp tiến độ các xe • Chạm để đặt dịch vụ ngay
        </p>
      </div>
    </div>
  );
}
