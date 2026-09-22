import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Car, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  Tv, 
  MapPin, 
  Volume2,
  Maximize2
} from "lucide-react";
import WassupLogo from "../common/WassupLogo";
import { OrderStatusView, Booth } from "../../lib/supabase/client";

interface TvQueueDisplayViewProps {
  orders: OrderStatusView[];
  booths: Booth[];
}

export default function TvQueueDisplayView({ orders, booths }: TvQueueDisplayViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe filtering for 3 Bento Grid zones
  const waitingOrders = orders.filter(o => o.status === 'queued');
  const ongoingWos = orders.filter(o => o.status !== 'done' && o.status !== 'queued');
  const readyOrders = orders.filter(o => o.status === 'done');

  // Station name from storage or default
  const stationName = "WASSUP TRẠM PILOT - QUẬN 7";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-6 select-none font-sans">
      
      {/* TV BROADCAST HEADER */}
      <header className="bg-slate-900 border border-slate-800 rounded-3xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#A2C62C]" />
        
        <div className="flex items-center gap-5">
          <WassupLogo id="tv-header-logo" className="h-10 sm:h-12 w-auto max-w-[180px] filter drop-shadow-md" />
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-xl font-black font-display text-white tracking-wide uppercase">
                BẢNG THÔNG TIN TIẾN ĐỘ XE REALTIME
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#A2C62C] animate-ping" />
            </div>
            <p className="text-[#A2C62C] font-display font-extrabold text-xs uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{stationName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-sans normal-case font-normal">Màn hình phòng chờ (3–5 mét)</span>
            </p>
          </div>
        </div>

        {/* Live Clock & Connection */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">GIỜ HỆ THỐNG</span>
            <div className="font-mono text-2xl font-black tracking-widest text-[#A2C62C]">
              {currentTime.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 pl-4 border-l border-slate-800">
            <span className="font-display text-[10px] font-black text-slate-950 bg-[#A2C62C] px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
              <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" /> ĐỒNG BỘ TRỰC TIẾP
            </span>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Tự động cập nhật 24/7</span>
          </div>
        </div>
      </header>

      {/* 3-COLUMN BENTO GRID (PRD v3.1 Layout) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* CỘT 1: HÀNG CHỜ TIẾP NHẬN (INCOMING QUEUE) - 3.5 cols */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-black font-display tracking-wider text-white uppercase">
                    1. HÀNG CHỜ TIẾP NHẬN
                  </h2>
                  <span className="text-[10px] text-slate-400 font-sans block">Sắp xếp theo thứ tự vào trạm</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-display font-black text-xs">
                {waitingOrders.length} XE
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {waitingOrders.length === 0 ? (
                  <motion.div
                    key="empty-waiting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-[260px] flex flex-col items-center justify-center text-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800/80"
                  >
                    <Car className="h-10 w-10 text-slate-700 mb-3" />
                    <span className="text-xs font-black font-display uppercase tracking-wider text-slate-300">
                      Hiện Không Có Xe Chờ
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-relaxed font-sans">
                      Tất cả xe đang được chăm sóc tại khoang hoặc đã hoàn tất!
                    </span>
                  </motion.div>
                ) : (
                  waitingOrders.slice(0, 5).map((ord, idx) => (
                    <motion.div
                      key={ord.id ? `${ord.id}-${idx}` : `wait-ord-${idx}`}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-black text-[#A2C62C] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                            #{idx + 1}
                          </span>
                          <span className="text-2xl font-black text-white tracking-widest font-display">
                            {ord.licensePlate}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block uppercase font-bold font-sans">
                          Gói: <strong className="text-[#A2C62C]">{ord.packageCode}</strong> • {ord.vehicleSegment === 'suv' ? '7–9 Chỗ (SUV)' : '4–5 Chỗ (Sedan)'}
                        </span>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                          Đang Chờ Khoang
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          ~{(idx + 1) * 8} phút
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Thời gian chờ trung bình:</span>
            <strong className="text-amber-400 font-mono">~10 phút / lượt</strong>
          </div>
        </div>

        {/* CỘT 2: KHOANG ĐANG PHỤC VỤ (WASH BAY STATUS) - 5 cols */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-black font-display tracking-wider text-white uppercase">
                    2. KHOANG RỬA ĐANG PHỤC VỤ
                  </h2>
                  <span className="text-[10px] text-slate-400 font-sans block">Trạng thái robot 360° &amp; kỹ thuật viên</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-display font-black text-xs">
                {booths.length} KHOANG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {booths.map((booth, idx) => {
                const matchedWo = ongoingWos.find(w => w.boothId === booth.id);
                const progress = matchedWo 
                  ? (matchedWo.status === 'assigned' ? 25 : matchedWo.status === 'in_progress' ? 65 : matchedWo.status === 'quality_check' ? 90 : 45)
                  : 0;

                return (
                  <div
                    key={booth.id ? `${booth.id}-${idx}` : `booth-${idx}`}
                    className={`border rounded-2xl p-4 space-y-3 transition-colors duration-300 ${
                      matchedWo
                        ? "bg-slate-950 border-[#A2C62C]/70 shadow-lg"
                        : "bg-slate-950/40 border-slate-800 border-dashed text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-white uppercase font-display tracking-wider">
                        {booth.name}
                      </span>
                      {matchedWo ? (
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-[#A2C62C] uppercase font-mono">
                          <span className="h-2 w-2 rounded-full bg-[#A2C62C] animate-pulse" />
                          ĐANG RỬA
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">
                          SẴN SÀNG (TRỐNG)
                        </span>
                      )}
                    </div>

                    {matchedWo ? (
                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">BIỂN SỐ XE</span>
                            <span className="text-xl font-black text-white tracking-widest font-display animate-pulse">
                              {matchedWo.licensePlate}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-950 bg-[#A2C62C] px-2 py-0.5 rounded">
                            {matchedWo.packageCode}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800/80 space-y-1">
                          <div className="flex justify-between">
                            <span>Kỹ thuật viên:</span>
                            <strong className="text-white">{matchedWo.technicianName || "Robot Tự Động"}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Giai đoạn:</span>
                            <strong className="text-[#A2C62C]">
                              {matchedWo.status === 'assigned' ? 'Chuẩn bị vào khoang' : 
                               matchedWo.status === 'in_progress' ? 'Xịt bọt & Rửa 360°' : 
                               matchedWo.status === 'quality_check' ? 'Kiểm tra chất lượng (QC)' : 'Đang xử lý'}
                            </strong>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-[#A2C62C] rounded-full" 
                              style={{ width: `${progress}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                            <span>Tiến độ</span>
                            <span className="text-white font-bold">{progress}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-1">
                        <Car className="h-7 w-7 text-slate-700 mx-auto" />
                        <span className="text-[11px] font-bold text-slate-400 block">Khoang Trống</span>
                        <span className="text-[9px] text-slate-600 block">Sẵn sàng điều phối xe tiếp theo</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-sans flex items-center justify-between">
            <span>Tiêu chuẩn công nghệ:</span>
            <strong className="text-slate-300 font-bold">Touchless 360° &amp; Sấy Khí Khép Kín</strong>
          </div>
        </div>

        {/* CỘT 3: XE HOÀN TẤT — MỜI NHẬN XE (READY FOR PICKUP) - 3.5 cols */}
        <div className="lg:col-span-3 bg-slate-900/90 border-2 border-[#A2C62C]/40 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#A2C62C]/20 text-[#A2C62C] flex items-center justify-center font-black">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black font-display tracking-wider text-[#A2C62C] uppercase">
                    3. HOÀN TẤT — MỜI NHẬN XE
                  </h2>
                  <span className="text-[10px] text-slate-400 font-sans block">Quý khách vui lòng nhận bàn giao</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#A2C62C] text-slate-950 font-display font-black text-xs">
                {readyOrders.length} XE
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {readyOrders.length === 0 ? (
                  <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800/80">
                    <CheckCircle2 className="h-10 w-10 text-slate-700 mb-3" />
                    <span className="text-xs font-black font-display uppercase tracking-wider text-slate-400">
                      Chưa Có Xe Mới Hoàn Tất
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 max-w-[180px] leading-relaxed font-sans">
                      Xe sau khi rửa xong và kiểm tra QC sẽ xuất hiện nổi bật tại đây!
                    </span>
                  </div>
                ) : (
                  readyOrders.slice(0, 4).map((ord) => (
                    <motion.div
                      key={ord.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-gradient-to-r from-emerald-950 to-slate-950 border-2 border-[#A2C62C] rounded-2xl p-4 shadow-lg shadow-lime-900/20 space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#A2C62C] flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#A2C62C] animate-ping" />
                          ĐÃ XONG • MỜI NHẬN XE
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {ord.packageCode}
                        </span>
                      </div>

                      {/* Giant Highly Legible License Plate (≥32px for distance reading) */}
                      <div className="text-3xl font-black font-display text-white tracking-widest text-center py-1 bg-slate-900/90 rounded-xl border border-emerald-500/30">
                        {ord.licensePlate}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-sans pt-1">
                        <span>Khách hàng: <strong className="text-white">{ord.customerName || "Khách hội viên"}</strong></span>
                        <span className="text-[#A2C62C] font-bold">Khu vực trả xe A1 ✓</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans text-center">
            🔔 Loa trạm sẽ phát âm thanh thông báo khi xe của bạn hoàn tất
          </div>
        </div>

      </main>

      {/* FOOTER TICKER */}
      <footer className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#A2C62C]" />
          <span>WASSUP CAR WASH NETWORK • HỆ THỐNG RỬA XE TỰ PHỤC VỤ VÀ TỰ ĐỘNG THÔNG MINH SỐ 1 VIỆT NAM</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Hotline hỗ trợ: <strong className="text-white">1900-WASSUP (9277)</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-[#A2C62C] font-display font-black">CARE. CREATE. GROW.</span>
        </div>
      </footer>
    </div>
  );
}
