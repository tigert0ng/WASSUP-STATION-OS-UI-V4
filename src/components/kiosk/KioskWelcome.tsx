import React from "react";
import { motion } from "motion/react";
import {
  Car,
  Eye,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Clock,
  Gift,
  Zap,
  MapPin
} from "lucide-react";
import WassupLogo from "../common/WassupLogo";

interface KioskWelcomeProps {
  onStartOrder?: () => void;
  onOpenLiveview?: () => void;
  pairedDevice?: {
    stationName?: string;
    deviceName?: string;
    stationId?: string;
  } | null;
}

export default function KioskWelcome({
  onStartOrder,
  onOpenLiveview,
  pairedDevice
}: KioskWelcomeProps) {
  const stationName = pairedDevice?.stationName || "WASSUP Trạm Pilot - Quận 7";
  const deviceName = pairedDevice?.deviceName || "Kiosk Sảnh 01";

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-between min-h-[75vh] py-4 text-slate-800 select-none">
      
      {/* Top Station Status Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 text-slate-800 border border-stone-200/90 shadow-2xs text-xs font-black uppercase tracking-wider"
      >
        <span className="h-2 w-2 rounded-full bg-[#A2C62C] animate-pulse" />
        <MapPin className="h-3.5 w-3.5 text-forest-green" />
        <span>{stationName}</span>
        <span className="text-stone-400">•</span>
        <span className="text-slate-600 font-mono text-[11px]">{deviceName}</span>
      </motion.div>

      {/* Hero Touch Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        onClick={onStartOrder}
        className="w-full my-6 p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white to-stone-50 border-2 border-stone-200 hover:border-[#A2C62C] shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer text-center space-y-6 group relative overflow-hidden"
      >
        {/* Subtle Ambient Lime Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#A2C62C]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#A2C62C]/20 transition-all" />

        <div className="space-y-3">
          <div className="h-20 w-20 sm:h-24 sm:w-24 mx-auto rounded-3xl bg-[#A2C62C]/20 text-forest-green border border-[#A2C62C]/40 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
            <Car className="h-10 w-10 sm:h-12 sm:w-12 stroke-[2] text-forest-green" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-950 uppercase tracking-tight">
              TỰ PHỤC VỤ &amp; RỬA XE THÔNG MINH
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans font-medium">
              Chạm vào màn hình để đặt dịch vụ, chọn gói W0–W5 và nhận xe sạch bóng
            </p>
          </div>
        </div>

        {/* Big Touch CTA Button */}
        <div className="pt-2">
          <div className="w-full py-5 px-6 rounded-2xl bg-[#A2C62C] group-hover:bg-[#8fb124] text-slate-950 font-display font-black text-base uppercase tracking-wider shadow-lg shadow-lime-300/40 flex items-center justify-center gap-3 transition-all duration-300 group-hover:scale-[1.02] border-0">
            <span>CHẠM ĐỂ BẮT ĐẦU</span>
            <ChevronRight className="h-5 w-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3 Core Value Props */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-200/80 text-[11px] text-slate-600 font-sans">
          <div className="flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="font-bold">Robot 360°</span>
            <span className="text-[10px] text-slate-400">Không xước sơn</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-stone-200">
            <Gift className="h-4 w-4 text-[#A2C62C]" />
            <span className="font-bold">Ưu đãi Voucher</span>
            <span className="text-[10px] text-slate-400">Tích điểm SUP</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-bold">Chính xác ETA</span>
            <span className="text-[10px] text-slate-400">Xem tiến độ TV</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom Liveview Switcher Action */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <button
          type="button"
          onClick={onOpenLiveview}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-slate-900 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-stone-200 shadow-sm hover:border-stone-300 transition cursor-pointer"
        >
          <Eye className="h-4 w-4 text-forest-green" />
          <span>XEM TIẾN ĐỘ XE TRẠM (LIVEVIEW) →</span>
        </button>

        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-sans">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Bảo vệ quyền riêng tư &amp; dữ liệu xe</span>
        </div>
      </motion.div>
    </div>
  );
}
