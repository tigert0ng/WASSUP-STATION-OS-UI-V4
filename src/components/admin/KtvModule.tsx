import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Check,
  AlertTriangle,
  ChevronRight,
  User,
  Activity,
  Plus,
  ArrowRight,
  RefreshCw,
  MapPin,
  Timer,
  AlertCircle
} from "lucide-react";
import { OrderStatusView, WoStatus } from "../../types/workOrder.types";
import { simActions } from "../../lib/supabase/client";

interface KtvModuleProps {
  orders: OrderStatusView[];
  staff: any[];
  isStandalone?: boolean;
}

// Checklist for packages
const PACKAGE_CHECKLISTS: { [key: string]: string[] } = {
  W0: ["Xịt gầm bằng nước áp lực cao", "Xịt rửa lốp và lazang", "Xả sạch sấy khô nhanh"],
  W1: ["Ủ bọt tuyết mịn toàn thân", "Rửa vỏ xe bằng khăn microfiber", "Hút bụi thảm sàn và ghế", "Lau kính lái bên ngoài", "Dưỡng bóng cao su lốp"],
  W2: ["Tẩy ố lazang và khe hốc", "Rửa vỏ xe 2 xô (Three-bucket wash)", "Hút bụi & lau nhựa nội thất", "Phun nước xịt gầm sâu", "Dưỡng bóng lốp & nhựa ngoài"],
  W3: ["Tháo lốp rửa lòng dè bùn đất", "Tẩy đất sét (Clay) loại bỏ bụi sắt", "Tẩy ố phèn gầm", "Xịt phủ dưỡng cao su chống rỉ gầm", "Dưỡng bóng toàn diện nội ngoại thất"],
  W4: ["Tháo ghế dọn sâu sàn xe", "Giặt sấy đệm da lộn / ghế da", "Dưỡng ẩm da cao cấp", "Xông tinh dầu khử mùi sinh học ion bạc", "Vệ sinh lỗ thông gió điều hòa"],
  W5: ["Dọn bụi khoang block máy bằng chổi mềm", "Phun hơi nước nóng tẩy dầu mỡ bám", "Phủ chất dưỡng block máy", "Kiểm tra rò rỉ cơ bản"]
};

// Standard duration mapping (Thời gian quy định thực hiện gói dịch vụ)
const PACKAGE_DURATIONS: { [key: string]: number } = {
  W0: 15, // 15 minutes
  W1: 30, // 30 minutes
  W2: 45, // 45 minutes
  W3: 60, // 60 minutes
  W4: 90, // 90 minutes
  W5: 120 // 120 minutes
};

// Helper to get duration
const getStandardDuration = (pkgCode: string): number => {
  const code = (pkgCode || "W1").toUpperCase();
  return PACKAGE_DURATIONS[code] || 30;
};

// Helper to calculate simulated customer waiting elapsed minutes (Thời gian khách đã đợi)
// Based on created_at or random-consistent for simulation realism
const getSimulatedWaitTime = (orderId: string, orderCreatedAt?: string): number => {
  if (!orderCreatedAt) return 8; // Default fallback
  const created = new Date(orderCreatedAt).getTime();
  const now = new Date().getTime();
  const diffMins = Math.floor((now - created) / 60000);
  // Keep it realistic between 5 and 28 minutes for visual demonstration if it's too small
  return diffMins > 0 ? diffMins : (orderId.charCodeAt(0) % 20) + 5;
};

export default function KtvModule({ orders, staff, isStandalone }: KtvModuleProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>("");
  const [userRole, setUserRole] = useState<'technician' | 'manager' | 'qc_lead'>('technician');
  const [activeWoId, setActiveWoId] = useState<string | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionReason, setExtensionReason] = useState("Xe bẩn nặng quá mức");
  const [extensionTime, setExtensionTime] = useState("15");

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  const technicians = staff.filter(s => s.role === "technician");

  // If no tech is selected, pick first
  const currentTechId = selectedTechId || (technicians[0]?.id || "");
  const currentTech = technicians.find(t => t.id === currentTechId);

  // Filter tasks assigned to current technician (excluding completed)
  const assignedTasks = orders.filter(
    o => o.technicianId === currentTechId && o.status !== "done"
  );

  // Active / current job being processed (status: in_progress, quality_check, rework)
  const activeTask = assignedTasks.find(t => t.status !== "assigned");

  // If there's an active job and the user has not clicked anything, default activeWoId to it
  useEffect(() => {
    if (activeTask && !activeWoId) {
      setActiveWoId(activeTask.id);
    }
  }, [activeTask, activeWoId]);

  // If user clicks back or the active task changed, resolve selected task
  const selectedTask = orders.find(o => o.id === activeWoId);

  const handleToggleChecklist = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleStartWork = (id: string) => {
    simActions.updateWorkOrderStatus(id, "in_progress", undefined, "web", "KTV bắt đầu thi công rửa xe");
  };

  const handleCompleteWork = (id: string) => {
    // Ensure all checklist items are checked for realism
    const pkg = selectedTask?.packageCode || "W1";
    const checklist = PACKAGE_CHECKLISTS[pkg] || PACKAGE_CHECKLISTS["W1"];
    const newChecked = { ...checkedItems };
    checklist.forEach(item => {
      newChecked[item] = true;
    });
    setCheckedItems(newChecked);

    simActions.updateWorkOrderStatus(id, "quality_check", undefined, "web", "KTV báo cáo hoàn thành, chuyển duyệt QC");
  };

  const handleDoneWork = (id: string) => {
    simActions.updateWorkOrderStatus(id, "done", undefined, "web", "Quản lý hoàn thành lệnh thi công - Xuất xưởng");
    setActiveWoId(null);
  };

  const handleRework = (id: string) => {
    simActions.updateWorkOrderStatus(id, "rework", undefined, "web", "Yêu cầu thi công lại (Rework) do lỗi");
  };

  const handleExtendEta = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeWoId) {
      simActions.requestEtaExtension(activeWoId, Number(extensionTime), extensionReason);
      setShowExtensionModal(false);
    }
  };

  // Divide waiting queue (Xe đang chờ) and active tasks
  const waitingQueue = assignedTasks.filter(t => t.status === "assigned");

  // Determine working station / booth of the technician (Trạm đang trực)
  const currentStation = activeTask?.boothName || (assignedTasks[0]?.boothName) || "Sảnh Chờ Điều Phối (Trực toàn trạm)";

  // Wait time warning threshold (Thời gian cảnh báo khách chờ lâu)
  const WAIT_WARNING_THRESHOLD = 15; // 15 minutes

  return (
    <div className="w-full space-y-6">
      {/* SECTION HEADER (Frameless design consistent with all other modules) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">
            MX: KỸ THUẬT VIÊN MOBILE
          </h1>
          <p className="text-mid-gray text-xs mt-1 font-sans">
            Giao diện tác nghiệp di động cho Kỹ thuật viên (KTV) tại các khoang rửa xe, cập nhật tiến độ công việc và kiểm định QC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-brand-green-light text-forest-green border border-brand-green/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-forest-green animate-pulse" />
            Tác nghiệp Trực tuyến ({assignedTasks.length} xe đang xử lý)
          </span>
        </div>
      </div>

      {isStandalone && (
        <div className="w-full max-w-md mx-auto bg-matte-black text-white p-3.5 rounded-2xl border border-zinc-800 shadow-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green animate-pulse" />
            <div>
              <span className="font-display font-black text-xs text-brand-green uppercase tracking-wider block">
                STATION OS API LIVE SYNC
              </span>
              <span className="text-[10px] text-gray-400 font-sans">
                App Kỹ Thuật Viên Độc Lập
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-[#1f2d08] text-brand-green border border-[#3e5910] text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              ONLINE ({orders.length} Đơn)
            </span>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        <div className="max-w-md w-full bg-warm-white p-5 rounded-3xl border border-[#e5e5e5] shadow-sm min-h-[650px] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
        {/* HEADER & TECH PROFILE CARD */}
        <div className="bg-matte-black text-white p-4.5 rounded-2xl shadow-md space-y-4.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Wrench className="h-24 w-24 text-white" />
          </div>

          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#A2C62C] flex items-center justify-center text-matte-black font-black">
                W
              </div>
              <div>
                <h2 className="font-display font-black text-xs text-white uppercase tracking-wider">WORKSPACE KTV</h2>
                <span className="text-[9px] text-[#A2C62C] uppercase block font-sans font-bold tracking-widest">Wassup Mobile OS</span>
              </div>
            </div>

            {/* Dropdown switch to switch technicians & role for testing */}
            <div className="flex flex-col gap-1.5 items-end">
              <div className="flex items-center gap-1 bg-[#1d1d1d] border border-zinc-800 px-2 py-0.5 rounded-xl">
                <User className="h-3 w-3 text-gray-400" />
                <select
                  value={currentTechId}
                  onChange={(e) => {
                    setSelectedTechId(e.target.value);
                    setActiveWoId(null);
                    setCheckedItems({});
                  }}
                  className="bg-transparent border-0 rounded p-0 text-[10px] font-black font-sans text-[#A2C62C] focus:outline-none cursor-pointer"
                >
                  {technicians.map(t => (
                    <option key={t.id} value={t.id} className="bg-matte-black text-white">
                      KTV: {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[#1d1d1d] border border-zinc-800 px-2 py-0.5 rounded-xl">
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="bg-transparent border-0 rounded p-0 text-[10px] font-black font-sans text-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="technician" className="bg-matte-black text-white">👷 Vai trò: KTV</option>
                  <option value="manager" className="bg-matte-black text-white">🧑‍💼 Vai trò: Quản lý sảnh</option>
                  <option value="qc_lead" className="bg-matte-black text-white">🔍 Vai trò: Tổ trưởng QC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detailed technician profile info */}
          {currentTech && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-wide text-white">{currentTech.name}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Đang trực tuyến" />
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 font-sans text-[10px]">
                  <MapPin className="h-3 w-3 text-[#A2C62C]" />
                  <span>Trạm: <strong className="text-white font-extrabold">{currentStation}</strong></span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#1f2d08] text-[#A2C62C] border border-[#3e5910] text-[9px] font-black uppercase tracking-wider font-sans">
                  {assignedTasks.length > 0 ? "🟢 ĐANG THI CÔNG" : "⚪ CHỜ ĐIỀU PHỐI"}
                </span>
                <div className="text-[9px] text-gray-400">
                  Việc gán: <strong className="text-white">{assignedTasks.length} xe</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TASK CONTAINER AREA */}
        <AnimatePresence mode="wait">
          {!activeWoId ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* HEADING SECTION */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black font-display text-matte-black uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#A2C62C]" />
                  DANH SÁCH LỆNH XE GÁN ({assignedTasks.length})
                </h3>
                <span className="text-[9px] font-bold text-mid-gray bg-stone-100 px-2 py-0.5 rounded">
                  Ngưỡng cảnh báo: 15 phút
                </span>
              </div>

              {assignedTasks.length === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#e5e5e5] rounded-2xl bg-white">
                  <Wrench className="h-9 w-9 text-stone-300 mb-2 animate-bounce" />
                  <span className="text-xs font-black text-matte-black font-display uppercase">Không có việc gán</span>
                  <p className="text-[10px] text-mid-gray mt-1.5 leading-relaxed font-sans max-w-[240px]">
                    Hệ thống đang rảnh. Vui lòng đợi quản lý phân phối xe mới từ màn hình tiếp nhận!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active Job Alert if existing but minimized */}
                  {activeTask && (
                    <div
                      onClick={() => setActiveWoId(activeTask.id)}
                      className="bg-amber-50/70 border-2 border-amber-500/20 hover:border-amber-500 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-sm relative overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                          ĐANG THI CÔNG DỞ DANG
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-matte-black tracking-widest font-sans">
                            {activeTask.licensePlate}
                          </span>
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-brand-green text-matte-black font-black text-[9px]">
                            {activeTask.packageCode}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-extrabold animate-pulse">
                        Xem tiếp <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  {/* Waiting list header */}
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-black text-mid-gray uppercase tracking-widest block mb-2">HÀNG ĐỢI XE ĐANG CHỜ ({waitingQueue.length})</span>
                    
                    {waitingQueue.length === 0 ? (
                      <div className="text-center py-4 bg-stone-50 border border-stone-200 rounded-xl text-[10px] text-mid-gray font-medium">
                        Không còn xe nào trong hàng đợi
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {waitingQueue.map((t) => {
                          const waitTime = getSimulatedWaitTime(t.id, t.orderCreatedAt);
                          const isWarning = waitTime >= WAIT_WARNING_THRESHOLD;
                          const stdDuration = getStandardDuration(t.packageCode);

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setActiveWoId(t.id);
                                setCheckedItems({});
                              }}
                              className="bg-white border border-[#e5e5e5] rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:border-[#A2C62C] transition shadow-sm hover:shadow relative overflow-hidden group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-black text-matte-black tracking-widest font-sans">
                                      {t.licensePlate}
                                    </span>
                                    <span className="inline-flex px-2 py-0.5 rounded bg-[#A2C62C] text-matte-black font-black text-[9px] font-sans">
                                      {t.packageCode}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-mid-gray font-sans">
                                    <span className="flex items-center gap-1 font-semibold text-stone-600">
                                      <Clock className="h-3 w-3" /> Chuẩn: {stdDuration} phút
                                    </span>
                                    <span className="font-extrabold text-blue-600 uppercase">
                                      {t.boothName || "Sảnh điều phối"}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-matte-black transition mt-1" />
                              </div>

                              {/* Wait Time Warning section */}
                              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                                <span className="text-mid-gray flex items-center gap-1">
                                  <Timer className="h-3.5 w-3.5" /> Khách đã đợi: <strong className="text-stone-800 font-extrabold">{waitTime} phút</strong>
                                </span>

                                {isWarning ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[9px] font-black animate-pulse">
                                    <AlertCircle className="h-3 w-3" /> CẢNH BÁO CHỜ LÂU ({waitTime}m)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                                    ✓ Ổn định ({waitTime}m)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            selectedTask && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* TASK TITLE & BACK */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveWoId(null)}
                    className="text-xs text-mid-gray hover:text-matte-black font-black flex items-center gap-1 cursor-pointer"
                  >
                    ← Trở lại danh sách xe
                  </button>
                  <span className="text-[10px] font-extrabold uppercase bg-matte-black text-white px-2.5 py-1 rounded border border-zinc-800 tracking-wider">
                    BUỒNG: {selectedTask.boothName || "Sảnh chờ"}
                  </span>
                </div>

                {/* DETAILED HIGH-POLISHED CARD */}
                <div className="bg-matte-black text-white rounded-2xl p-4.5 space-y-3.5 shadow-md relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Biển Số Xe Thi Công</span>
                      <span className="text-xl font-black font-sans tracking-widest text-[#A2C62C]">{selectedTask.licensePlate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">Gói rửa xe</span>
                      <span className="inline-flex px-2 py-0.5 rounded bg-[#A2C62C] text-matte-black font-black text-[10px] font-sans">
                        {selectedTask.packageCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-300 font-sans border-t border-zinc-800 pt-3">
                    <span>Phân khúc: <strong className="uppercase text-white">{selectedTask.vehicleSegment}</strong></span>
                    <span className="flex items-center gap-1 text-[#A2C62C] font-bold uppercase tracking-wider font-sans">
                      <Activity className="h-3.5 w-3.5" /> {
                        selectedTask.status === "assigned" ? "ĐÃ GÁN" :
                        selectedTask.status === "in_progress" ? "ĐANG THI CÔNG" :
                        selectedTask.status === "quality_check" ? "CHỜ DUYỆT QC" :
                        selectedTask.status === "rework" ? "REWORK LỖI" : selectedTask.status
                      }
                    </span>
                  </div>
                </div>

                {/* WORK DURATIONS AND DEADLINE CORNER */}
                <div className="bg-white border border-[#e5e5e5] p-4 rounded-2xl space-y-3 shadow-sm">
                  <h4 className="font-display text-[10px] font-black text-matte-black uppercase tracking-wider flex items-center gap-1.5 border-b border-[#e5e5e5] pb-2">
                    <Clock className="h-4 w-4 text-[#A2C62C]" />
                    QUẢN LÝ TIẾN ĐỘ THI CÔNG CHUẨN
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-2.5 bg-stone-50 rounded-xl space-y-1">
                      <span className="text-[9px] text-mid-gray uppercase block font-bold">Thời gian quy chuẩn</span>
                      <span className="text-sm font-black text-matte-black font-sans">
                        {getStandardDuration(selectedTask.packageCode)} Phút
                      </span>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-xl space-y-1">
                      <span className="text-[9px] text-mid-gray uppercase block font-bold">Thời gian phải hoàn thành</span>
                      <span className={`text-sm font-black font-sans block ${
                        selectedTask.status === "in_progress" ? "text-amber-600" : "text-stone-800"
                      }`}>
                        {selectedTask.status === "in_progress" ? (
                          <span>Trong hạn (~20m)</span>
                        ) : selectedTask.status === "rework" ? (
                          <span className="text-red-500 animate-pulse">Quá hạn (Rework)</span>
                        ) : (
                          <span>Chưa thi công</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar if active */}
                  {selectedTask.status === "in_progress" && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex justify-between text-[10px] text-mid-gray">
                        <span>Đã thi công: ~12 phút</span>
                        <span className="font-bold text-emerald-600">Còn lại 18 phút</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[40%] animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE CHECKLIST */}
                <div className="space-y-2.5 bg-white border border-[#e5e5e5] p-4 rounded-2xl shadow-sm">
                  <h4 className="font-display text-[10px] font-black text-matte-black uppercase tracking-wider flex items-center gap-1.5 border-b border-[#e5e5e5] pb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    CHECKLIST CHI TIẾT THI CÔNG ({
                      (PACKAGE_CHECKLISTS[selectedTask.packageCode] || PACKAGE_CHECKLISTS["W1"]).filter(item => checkedItems[item]).length
                    }/{(PACKAGE_CHECKLISTS[selectedTask.packageCode] || PACKAGE_CHECKLISTS["W1"]).length})
                  </h4>

                  <div className="space-y-2 pt-1">
                    {(PACKAGE_CHECKLISTS[selectedTask.packageCode] || PACKAGE_CHECKLISTS["W1"]).map((item, idx) => {
                      const isChecked = !!checkedItems[item];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleChecklist(item)}
                          className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition"
                        >
                          <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all mt-0.5 ${
                            isChecked ? "bg-brand-green border-brand-green text-matte-black animate-pulse" : "border-[#e5e5e5] bg-white"
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] font-sans leading-snug ${isChecked ? "line-through text-mid-gray font-medium" : "text-matte-black font-semibold"}`}>
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CONTROLLER BUTTONS */}
                <div className="pt-2 space-y-2.5">
                  {selectedTask.status === "assigned" && (
                    <button
                      onClick={() => handleStartWork(selectedTask.id)}
                      className="w-full py-4.5 rounded-2xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-black font-display tracking-widest text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase border-0"
                    >
                      <Play className="h-5 w-5 fill-matte-black" /> BẮT ĐẦU RỬA XE (START)
                    </button>
                  )}

                  {selectedTask.status === "in_progress" && (
                    <button
                      onClick={() => handleCompleteWork(selectedTask.id)}
                      className="w-full py-4.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black font-display tracking-widest text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase border-0"
                    >
                      <CheckCircle2 className="h-5 w-5" /> BÁO CÁO HOÀN THÀNH (QC READY)
                    </button>
                  )}

                  {selectedTask.status === "quality_check" && (
                    <div className="space-y-2">
                      <div className="text-center py-2 bg-purple-50 border border-purple-150 rounded-xl text-[10px] text-purple-700 font-extrabold uppercase animate-pulse">
                        ⌛ ĐANG CHỜ DUYỆT CHẤT LƯỢNG (QC IN PROGRESS)
                      </div>
                      
                      {userRole === "technician" ? (
                        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-center space-y-1.5">
                          <span className="text-[10px] font-extrabold text-amber-800 uppercase block tracking-wider">🔒 BỊ KHÓA: PHÂN QUYỀN (RBAC)</span>
                          <p className="text-[9px] text-stone-600 leading-normal font-sans">
                            Bạn đang ở vai trò <strong>Kỹ Thuật Viên</strong>. KTV không thể tự phê duyệt hay từ chối công việc của mình để bảo đảm tính khách quan. 
                          </p>
                          <span className="text-[9px] text-amber-700 block font-bold font-sans">
                            💡 Vui lòng đổi vai trò thành "Quản lý sảnh" hoặc "Tổ trưởng QC" ở góc trên màn hình để duyệt.
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3.5">
                          <button
                            onClick={() => handleDoneWork(selectedTask.id)}
                            className="py-4 rounded-2xl bg-forest-green hover:bg-forest-green/95 text-white font-black font-display tracking-wider text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase border-0"
                          >
                            <Check className="h-4 w-4 stroke-[3]" /> HOÀN THÀNH (ĐẠT QC)
                          </button>
                          <button
                            onClick={() => handleRework(selectedTask.id)}
                            disabled={selectedTask.reworkCount >= 2}
                            className={`py-4 rounded-2xl text-xs font-black font-display tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase border-0 ${
                              selectedTask.reworkCount >= 2
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            }`}
                          >
                            <RotateCcw className="h-4 w-4" /> REWORK ({selectedTask.reworkCount}/2)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTask.status === "rework" && (
                    <button
                      onClick={() => handleStartWork(selectedTask.id)}
                      className="w-full py-4.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black font-display tracking-widest text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase border-0"
                    >
                      <Play className="h-5 w-5 fill-white" /> CHẠY LẠI THI CÔNG REWORK
                    </button>
                  )}

                  {/* ETA EXTENSION EMERGENCY */}
                  {selectedTask.status !== "done" && (
                    selectedTask.etaExtensionRequest?.status === "pending" ? (
                      <div className="w-full py-3 text-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 text-[10px] font-black font-display tracking-widest uppercase animate-pulse">
                        ⏳ ĐÃ GỬI YÊU CẦU GIA HẠN (+{selectedTask.etaExtensionRequest.minutes}P) · CHỜ PHÊ DUYỆT
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowExtensionModal(true)}
                        className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black font-display tracking-wider transition cursor-pointer uppercase"
                      >
                        ⚠️ XIN GIA HẠN THỜI GIAN THI CÔNG (ETA)
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* EXTENSION MODAL */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-sm rounded-2xl p-5 shadow-2xl relative">
            <h3 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase mb-4 flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              GỬI YÊU CẦU XIN GIA HẠN THI CÔNG
            </h3>

            <form onSubmit={handleExtendEta} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Lý do trì hoãn (Reason)
                </label>
                <select
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                >
                  <option value="Xe bẩn nặng quá mức">Xe bẩn nặng quá mức</option>
                  <option value="Phát sinh lỗi kỹ thuật gầm">Phát sinh lỗi kỹ thuật gầm</option>
                  <option value="Khách yêu cầu thêm dịch vụ phụ">Khách yêu cầu thêm dịch vụ phụ</option>
                  <option value="Tắc nghẽn nước xịt bay">Tắc nghẽn nước xịt bay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Số phút xin thêm
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => setExtensionTime("15")}
                    className={`py-2.5 rounded-xl border font-bold transition ${
                      extensionTime === "15" ? "bg-matte-black text-white border-matte-black" : "bg-white border-[#e5e5e5] text-mid-gray"
                    }`}
                  >
                    +15 Phút
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtensionTime("30")}
                    className={`py-2.5 rounded-xl border font-bold transition ${
                      extensionTime === "30" ? "bg-matte-black text-white border-matte-black" : "bg-white border-[#e5e5e5] text-mid-gray"
                    }`}
                  >
                    +30 Phút
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold font-display uppercase cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-matte-black hover:bg-matte-black/95 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                >
                  GỬI YÊU CẦU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
