import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor,
  Video,
  Gauge,
  Power,
  ShieldAlert,
  Wifi,
  Cpu,
  RefreshCw,
  X,
  Zap,
  Droplet
} from "lucide-react";

export default function MonitorModule() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [pressure, setPressure] = useState(12.5); // Bar water pressure
  const [pumpStatus, setPumpStatus] = useState<"nominal" | "warning" | "off">("nominal");

  const handleTriggerEmergencyStop = () => {
    setIsEmergencyActive(true);
    setPressure(0);
    setPumpStatus("off");
    setShowEmergencyModal(false);
    alert("🚨 ĐÃ KÍCH HOẠT DỪNG KHẨN CẤP TOÀN TRẠM! Toàn bộ rơ-le điện 3 pha và van xả áp lực nước đã ngắt thành công.");
  };

  const handleResetEmergency = () => {
    setIsEmergencyActive(false);
    setPressure(12.5);
    setPumpStatus("nominal");
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">MONITOR & GIÁM SÁT HẠ TẦNG THIẾT BỊ IOT</h1>
          <p className="text-mid-gray text-xs mt-1 font-sans">
            Giám sát camera hành trình, áp lực máy nén khí, cảm biến vật cản xe vào bay rửa (Giai đoạn phát triển IoT)
          </p>
        </div>

        {isEmergencyActive ? (
          <button
            onClick={handleResetEmergency}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold font-display uppercase transition shadow-md cursor-pointer animate-pulse"
          >
            <RefreshCw className="h-4 w-4" />
            KHÔI PHỤC HOẠT ĐỘNG TRẠM
          </button>
        ) : (
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold font-display uppercase transition shadow-md shadow-red-600/25 cursor-pointer"
          >
            <Power className="h-4 w-4 stroke-[3]" />
            DỪNG KHẨN CẤP TOÀN TRẠM
          </button>
        )}
      </div>

      {/* EMERGENCY ON AIR ACTIVE HEADER BANNER */}
      {isEmergencyActive && (
        <div className="bg-red-600 text-white p-5 rounded-2xl flex items-start gap-3 shadow-lg border border-red-700 animate-pulse">
          <ShieldAlert className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-black text-xs uppercase tracking-widest">🚨 EMERGENCY STOP ACTIVE - TOÀN TRẠM ĐÃ NGỪNG HOẠT ĐỘNG</h3>
            <p className="text-xs opacity-90 mt-1 font-sans">
              Toàn bộ rơ-le điện tổng 3 pha, máy bơm áp lực cao và nguồn cấp khí nén đã bị cưỡng bức ngắt kết nối vật lý (mô phỏng). Hãy kiểm tra khu vực kỹ thuật trước khi nhấn nút "Khôi phục hoạt động trạm".
            </p>
          </div>
        </div>
      )}

      {/* IoT LIVE METERS GROUP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WATER PRESSURE METER */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <span className="text-xs font-bold font-sans text-mid-gray uppercase">Áp lực nước vòi rửa gầm</span>
            <Gauge className={`h-4.5 w-4.5 ${isEmergencyActive ? "text-red-500" : "text-forest-green"}`} />
          </div>

          <div className="text-center py-4 space-y-1">
            <h3 className="text-4xl font-black font-display tracking-tight text-matte-black">
              {pressure.toFixed(1)} <span className="text-sm font-bold text-mid-gray">Bar</span>
            </h3>
            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              isEmergencyActive ? "bg-red-100 text-red-600" : "bg-brand-green-light text-forest-green"
            }`}>
              {isEmergencyActive ? "OFFLINE" : "NOMINAL OPERATION"}
            </span>
          </div>

          <div className="text-[10px] text-mid-gray font-sans text-center leading-snug">
            Áp suất vòi xịt gầm thiết kế tiêu chuẩn: <strong>11.0 - 14.5 Bar</strong>. Nếu vượt quá 16 Bar, hệ thống van tự động xả tràn sẽ kích hoạt.
          </div>
        </div>

        {/* COMPRESSOR POWER STATS */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <span className="text-xs font-bold font-sans text-mid-gray uppercase">Nguồn điện tổng 3 pha</span>
            <Zap className={`h-4.5 w-4.5 ${isEmergencyActive ? "text-red-500" : "text-amber-500"}`} />
          </div>

          <div className="text-center py-4 space-y-1">
            <h3 className="text-4xl font-black font-display tracking-tight text-matte-black">
              {isEmergencyActive ? "0" : "382"} <span className="text-sm font-bold text-mid-gray">VAC</span>
            </h3>
            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              isEmergencyActive ? "bg-red-100 text-red-600" : "bg-brand-green-light text-forest-green"
            }`}>
              {isEmergencyActive ? "NGẮT RƠ LE" : "PUMP LOAD NOMINAL"}
            </span>
          </div>

          <div className="text-[10px] text-mid-gray font-sans text-center leading-snug">
            Cảm biến tải rơ-le nhiệt bảo vệ động cơ bơm bọt tuyết. Dòng định mức hoạt động: <strong>15.2 Ampere</strong>.
          </div>
        </div>

        {/* CONNECTION STATUS */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <span className="text-xs font-bold font-sans text-mid-gray uppercase">Mạng IoT nội bộ trạm</span>
            <Wifi className={`h-4.5 w-4.5 ${isEmergencyActive ? "text-red-500" : "text-forest-green animate-pulse"}`} />
          </div>

          <div className="text-center py-4 space-y-1">
            <h3 className="text-3xl font-black font-display tracking-tight text-matte-black">
              {isEmergencyActive ? "DISCONNECTED" : "CONNECTED"}
            </h3>
            <span className="inline-flex px-2 py-0.5 rounded bg-brand-green-light text-forest-green text-[8px] font-black uppercase tracking-wider">
              IP: 192.168.1.254
            </span>
          </div>

          <div className="text-[10px] text-mid-gray font-sans text-center leading-snug">
            Giao tiếp ranh giới qua giao thức MQTT bảo mật cao. Chu kỳ đồng bộ cảm biến: <strong>500 ms / lần</strong>.
          </div>
        </div>
      </div>

      {/* MONITORS SENSORS MAPS - BLURRED GIAI ĐOẠN 2 AS REQUESTED */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <Video className="h-5 w-5 text-forest-green" />
          CAMERA GIÁM SÁT HÀNH TRÌNH XE & CẢM BIẾN VẬT CẢN (STAGE MAPS)
        </h2>

        {/* BLURRED MOCK BLOCK */}
        <div className="relative border border-[#e5e5e5] rounded-3xl p-8 bg-warm-white flex flex-col items-center justify-center text-center overflow-hidden min-h-[350px]">
          {/* SKELETON BLUR */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-matte-black text-white flex items-center justify-center shadow-lg mb-4">
              <Cpu className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="font-display font-black text-sm text-matte-black uppercase tracking-wider">🔒 CHỜ KẾT NỐI HẠ TẦNG IOT VẬT LÝ — GIAI ĐOẠN 2</h3>
            <p className="text-xs text-mid-gray mt-1.5 max-w-md leading-relaxed font-sans">
              Phân hệ bản đồ cảm biến và Live Camera hành trình xe đang chờ kết nối cổng phần cứng RS485 và mạch rơ-le ESP32 điều khiển van áp lực của trạm rửa.
            </p>
          </div>

          {/* BACKGROUND SKELETON ELEMENTS */}
          <div className="w-full max-w-xl opacity-20 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-28 bg-gray-200 rounded-xl" />
              <div className="h-28 bg-gray-200 rounded-xl" />
              <div className="h-28 bg-gray-200 rounded-xl" />
              <div className="h-28 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-32 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* EMERGENCY MODAL CONFIRMATION */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-red-500 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-mid-gray hover:text-matte-black transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-3 mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600 animate-bounce" />
              <h3 className="text-lg font-extrabold font-display tracking-wider text-red-600 uppercase">
                XÁC NHẬN DỪNG KHẨN CẤP CO-RELAY
              </h3>
            </div>

            <p className="text-xs text-matte-black font-sans leading-relaxed mb-4">
              Bấm xác nhận nút này sẽ ngay lập tức ngắt toàn bộ điện rơ-le và van cấp nước của hệ thống máy rửa xe. Hãy chắc chắn có sự cố xảy ra trước khi thực hiện để tránh ảnh hưởng tới xe khách đang thi công.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold font-display uppercase cursor-pointer"
              >
                HỦY BỎ (CANCEL)
              </button>
              <button
                type="button"
                onClick={handleTriggerEmergencyStop}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
              >
                KÍCH HOẠT DỪNG (STOP)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
