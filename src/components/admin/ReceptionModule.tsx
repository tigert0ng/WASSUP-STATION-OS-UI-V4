import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Plus,
  Search,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Car,
  Wrench,
  X,
  Phone,
  Tag,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Monitor,
  MessageSquare,
  Cpu,
  UserCheck,
  RefreshCw,
  Filter,
  Download,
  Star,
  History
} from "lucide-react";
import { OrderStatusView, WoStatus } from "../../types/workOrder.types";
import { Booth, Service } from "../../types/order.types";
import { MarkdownTextarea, MarkdownRenderer } from "./shared/Markdown";
import { simActions } from "../../lib/supabase/client";
import { SERVICES_CATALOG, ADDONS_CATALOG } from "../../lib/services";

const KTV_BASELINE: Record<string, { completed: number; duration: number; extensions: number; complaints: number; ratingSum: number; reasons: string[] }> = {
  s3: { completed: 42, duration: 1350, extensions: 2, complaints: 0, ratingSum: 202, reasons: ["Xe bẩn bùn đất sâu", "Khách muốn vệ sinh kỹ khe kẽ"] },
  s4: { completed: 35, duration: 1120, extensions: 4, complaints: 1, ratingSum: 161, reasons: ["Khoang máy bám dầu mỡ cứng", "Chờ dưỡng chất khô tự nhiên"] },
  s5: { completed: 39, duration: 1210, extensions: 5, complaints: 2, ratingSum: 171, reasons: ["Xe phủ ceramic cần sấy thêm", "Khách yêu cầu dọn kỹ khoang cốp"] }
};

const STATIONS = [
  "Wassup Station Cầu Giấy",
  "Wassup Station Tây Hồ",
  "Wassup Station Quận 1",
  "Wassup Station Nguyễn Trãi"
];

const getStationForOrder = (orderId: string) => {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return STATIONS[Math.abs(hash) % STATIONS.length];
};

interface ReceptionModuleProps {
  orders: OrderStatusView[];
  booths: Booth[];
  staff: any[];
}

export default function ReceptionModule({ orders, booths, staff }: ReceptionModuleProps) {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderStatusView | null>(null);
  const [showDispatchDrawer, setShowDispatchDrawer] = useState(false);
  
  // New States for Module 2 UI/UX Updates
  const [dispatchingWo, setDispatchingWo] = useState<OrderStatusView | null>(null);
  const [dispatchingBoothId, setDispatchingBoothId] = useState<string | null>(null);
  const [telegramNotification, setTelegramNotification] = useState<{
    woId: string;
    techId: string;
    techName: string;
    boothId: string;
    boothName: string;
    plate: string;
    pkg: string;
  } | null>(null);
  
  const [vehicleCondition, setVehicleCondition] = useState<'normal' | 'clean' | 'dirty_heavy' | 'scratch_light' | 'scratch_heavy'>('normal');
  const [ratingVehicleStars, setRatingVehicleStars] = useState<number>(5);
  const [ratingVehicleComment, setRatingVehicleComment] = useState<string>("");
  const [ratingKtvStars, setRatingKtvStars] = useState<number>(5);
  const [ratingKtvComment, setRatingKtvComment] = useState<string>("");

  // Drag and Drop & Tech Assign state
  const [draggedOverBoothId, setDraggedOverBoothId] = useState<string | null>(null);
  const [boothTechs, setBoothTechs] = useState<Record<string, string>>({
    b1: "s3", // Default to KTV 1
    b2: "s4", // Default to KTV 2
    b3: "s5", // Default to KTV 3
    b4: "s3"  // Default to KTV 1
  });

  const getFriendlyBoothName = (booth: { id: string; name: string }) => {
    if (booth.id === 'b1') return "Booth 1 Rửa nhanh";
    if (booth.id === 'b2') return "Booth 2 Detailing";
    if (booth.id === 'b3') return "Booth 3 Detailing";
    return booth.name;
  };

  const handleDropVehicle = (woId: string, boothId: string) => {
    const wo = orders.find(o => o.id === woId);
    if (!wo) return;

    if (wo.status === 'queued') {
      // Trigger interactive dispatch dialog
      setDispatchingWo(wo);
      setDispatchingBoothId(boothId);
    } else {
      // Dragging from one booth to another booth
      simActions.moveWorkOrderBooth(woId, boothId);
    }
  };

  // Quick Dispatch state
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [dispatchBoothId, setDispatchBoothId] = useState("");
  const [dispatchTechId, setDispatchTechId] = useState("");

  // Check-In Form State
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [segment, setSegment] = useState<'sedan' | 'suv' | 'truck'>('sedan');
  const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  
  // Load packages and addons from localStorage (Module 5)
  const [packages] = useState<Service[]>(() => {
    const saved = localStorage.getItem("wassup_packages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SERVICES_CATALOG;
      }
    }
    return SERVICES_CATALOG;
  });

  const [addonsList] = useState<Service[]>(() => {
    const saved = localStorage.getItem("wassup_addons");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ADDONS_CATALOG;
      }
    }
    return ADDONS_CATALOG;
  });

  const [selectedPkg, setSelectedPkg] = useState<Service>(() => {
    const saved = localStorage.getItem("wassup_packages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[1] || parsed[0] || SERVICES_CATALOG[1];
      } catch (e) {}
    }
    return SERVICES_CATALOG[1];
  });
  
  const [selectedAddons, setSelectedAddons] = useState<Service[]>([]);
  const [customEta, setCustomEta] = useState<string>(() => {
    const saved = localStorage.getItem("wassup_packages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const pkg = parsed[1] || parsed[0] || SERVICES_CATALOG[1];
        return pkg.duration?.toString() || "30";
      } catch (e) {}
    }
    return SERVICES_CATALOG[1].duration?.toString() || "30";
  });
  const [activeTab, setActiveTab] = useState<'dispatch' | 'orders' | 'kpi'>('dispatch');
  const [searchQuery, setSearchQuery] = useState("");
  const [addonSearch, setAddonSearch] = useState("");
  const [showAddonDropdown, setShowAddonDropdown] = useState(false);
  const [checkInNote, setCheckInNote] = useState("");

  // Advanced Filters
  const [filterTechId, setFilterTechId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  // Journal Notes & Ratings States
  const [orderNotes, setOrderNotes] = useState<any[]>(() => {
    const saved = localStorage.getItem("wassup_work_order_notes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [orderRatings, setOrderRatings] = useState<any[]>(() => {
    const saved = localStorage.getItem("wassup_work_order_ratings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>("");

  const handleSelectPackage = (pkg: Service) => {
    setSelectedPkg(pkg);
    if (pkg.duration !== undefined) {
      setCustomEta(pkg.duration.toString());
    } else {
      setCustomEta("30");
    }
  };

  // Customer Notes/Complaint States
  const [noteText, setNoteText] = useState("");
  const [noteTag, setNoteTag] = useState<"standard" | "complaint" | "technical" | "special" | "other">("standard");
  const [alertTelegramSent, setAlertTelegramSent] = useState(false);

  // Search and Advanced Filters
  const filteredOrders = orders.filter(o => {
    // Search text match
    const matchesSearch = 
      o.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(searchQuery)) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    // Tech filter
    if (filterTechId && o.technicianId !== filterTechId) return false;
    
    // Status filter
    if (filterStatus && o.status !== filterStatus) return false;
    
    // Package filter
    if (filterPackage && o.packageCode !== filterPackage) return false;
    
    // Channel filter
    if (filterChannel) {
      const isManual = o.lastChannel === 'web';
      if (filterChannel === 'manual' && !isManual) return false;
      if (filterChannel === 'kiosk' && isManual) return false;
    }
    
    return true;
  });

  const toggleAddon = (addon: Service) => {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Auto-fill customer from database if phone matches
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const existingCust = simActions.getCustomers().find(c => c.phone === val);
    if (existingCust) {
      setName(existingCust.name);
      if (existingCust.licensePlate) {
        setPlate(existingCust.licensePlate);
      } else if (existingCust.licensePlates && existingCust.licensePlates.length > 0) {
        setPlate(existingCust.licensePlates[0]);
      }
      if (existingCust.vehicles && existingCust.vehicles.length > 0) {
        setSegment(existingCust.vehicles[0].vehicleClass || 'sedan');
      }
    }
  };

  const handlePlateInputChange = (val: string) => {
    const formattedVal = val.toUpperCase();
    setPlate(formattedVal);

    if (formattedVal.trim().length >= 3) {
      const customers = simActions.getCustomers();
      const suggestions: any[] = [];
      customers.forEach(c => {
        // Main licensePlate
        if (c.licensePlate && c.licensePlate.toUpperCase().includes(formattedVal)) {
          suggestions.push({
            plate: c.licensePlate,
            customerName: c.name,
            phone: c.phone,
            vehicleClass: c.vehicles?.find(v => v.plate === c.licensePlate)?.vehicleClass || c.vehicles?.[0]?.vehicleClass || 'sedan'
          });
        }
        // Other vehicles
        if (c.vehicles && c.vehicles.length > 0) {
          c.vehicles.forEach(v => {
            if (v.plate && v.plate.toUpperCase().includes(formattedVal)) {
              suggestions.push({
                plate: v.plate,
                customerName: c.name,
                phone: c.phone,
                vehicleClass: v.vehicleClass || 'sedan'
              });
            }
          });
        }
        // licensePlates list
        if (c.licensePlates && c.licensePlates.length > 0) {
          c.licensePlates.forEach(p => {
            if (p && p.toUpperCase().includes(formattedVal)) {
              suggestions.push({
                plate: p,
                customerName: c.name,
                phone: c.phone,
                vehicleClass: c.vehicles?.find(v => v.plate === p)?.vehicleClass || 'sedan'
              });
            }
          });
        }
      });

      // Filter out duplicate suggestions by plate
      const uniqueSuggestions = suggestions.filter((item, index, self) =>
        index === self.findIndex((t) => t.plate === item.plate)
      );

      setFilteredSuggestions(uniqueSuggestions);
      setShowPlateSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowPlateSuggestions(false);
    }
  };

  const handleSelectPlateSuggestion = (sugg: any) => {
    setPlate(sugg.plate);
    setPhone(sugg.phone);
    setName(sugg.customerName);
    setSegment(sugg.vehicleClass || 'sedan');
    setShowPlateSuggestions(false);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) return;

    const subtotal = selectedPkg.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const total = subtotal; // No discount initially

    const calculatedDuration = (selectedPkg.duration || 30) + selectedAddons.reduce((sum, a) => sum + (a.duration || 0), 0);

    const conditionText = 
      vehicleCondition === 'normal' ? 'Bình thường' :
      vehicleCondition === 'clean' ? 'Sạch sẽ' :
      vehicleCondition === 'dirty_heavy' ? 'Bẩn nặng 🌧️' :
      vehicleCondition === 'scratch_light' ? 'Xước nhẹ ⚡' : 'Xước nặng ⚠️';

    const finalNotes = `[Tình trạng xe vào: ${conditionText}]${checkInNote ? " - " + checkInNote : ""}`;

    const res = simActions.createOrder({
      customerPhone: phone || undefined,
      customerName: name || undefined,
      licensePlate: plate.toUpperCase(),
      vehicleSegment: segment,
      packageCode: selectedPkg.code,
      subtotal,
      discount: 0,
      total,
      estimatedDuration: calculatedDuration,
      notes: finalNotes
    });

    // Reset Form
    setPhone("");
    setName("");
    setPlate("");
    setSegment("sedan");
    setVehicleCondition("normal");
    const defaultPkg = packages[1] || packages[0] || SERVICES_CATALOG[1];
    setSelectedPkg(defaultPkg);
    setSelectedAddons([]);
    setCustomEta(defaultPkg.duration?.toString() || "30");
    setCheckInNote("");
    setAddonSearch("");
    setShowCheckInModal(false);
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWoId && dispatchTechId && dispatchBoothId) {
      simActions.assignWorkOrder(selectedWoId, dispatchTechId, dispatchBoothId);
      setSelectedWoId(null);
      setDispatchBoothId("");
      setDispatchTechId("");
      setShowDispatchDrawer(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !noteText) return;

    const newNote = {
      id: "note_" + Date.now(),
      workOrderId: selectedOrder.id,
      actor: "Quản lý (Admin)",
      tag: noteTag,
      content: noteText,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [newNote, ...orderNotes];
    setOrderNotes(updatedNotes);
    localStorage.setItem("wassup_work_order_notes", JSON.stringify(updatedNotes));

    // Simulate note attachment or direct UI feedback
    if (noteTag === "complaint") {
      setAlertTelegramSent(true);
      setTimeout(() => setAlertTelegramSent(false), 5000);
    }

    // Reset
    setNoteText("");
  };

  const handleAddRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const newRatingVehicle = {
      id: "rate_v_" + Date.now(),
      workOrderId: selectedOrder.id,
      rating_type: 'vehicle_quality',
      stars: ratingVehicleStars,
      comment: ratingVehicleComment,
      source: 'manual',
      createdAt: new Date().toISOString()
    };

    const newRatingKtv = {
      id: "rate_k_" + Date.now(),
      workOrderId: selectedOrder.id,
      rating_type: 'ktv_service',
      stars: ratingKtvStars,
      comment: ratingKtvComment,
      source: 'manual',
      createdAt: new Date().toISOString()
    };

    const updatedRatings = [newRatingVehicle, newRatingKtv, ...orderRatings];
    setOrderRatings(updatedRatings);
    localStorage.setItem("wassup_work_order_ratings", JSON.stringify(updatedRatings));

    // Reset Form
    setRatingVehicleStars(5);
    setRatingVehicleComment("");
    setRatingKtvStars(5);
    setRatingKtvComment("");
    
    alert("Đã ghi nhận đánh giá 2 chiều (Chất lượng xe & Kỹ thuật viên) thành công!");
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const handleExportCSV = () => {
    const techStaff = staff.filter(s => s.role === 'technician');
    let csvContent = "\uFEFF"; // Byte Order Mark for UTF-8 compatibility
    csvContent += "Mã KTV,Tên Kỹ Thuật Viên,Lệnh Hoàn Thành,Thời Gian Thi Công (Phút),Số Lần Gia Hạn,Đánh Giá Trung Bình,Số Vụ Khiếu Nại,Trạng Thái KPI\n";
    
    techStaff.forEach(tech => {
      const base = KTV_BASELINE[tech.id] || { completed: 0, duration: 0, extensions: 0, complaints: 0, ratingSum: 0 };
      const realDone = orders.filter(o => o.technicianId === tech.id && o.status === 'done').length;
      const realDuration = orders.filter(o => o.technicianId === tech.id && o.status === 'done').reduce((sum, o) => sum + (o.estimatedDuration || 30), 0);
      const realExtensions = orders.filter(o => o.technicianId === tech.id && o.etaExtensionRequest?.status === 'approved').length;
      
      const techRatings = orderRatings.filter(r => {
        const wo = orders.find(o => o.id === r.workOrderId);
        return wo && wo.technicianId === tech.id && r.rating_type === 'ktv_service';
      });
      const realRatingSum = techRatings.reduce((sum, r) => sum + r.stars, 0);
      const realRatingCount = techRatings.length;

      const completed = base.completed + realDone;
      const duration = base.duration + realDuration;
      const extensions = base.extensions + realExtensions;
      
      const totalRatingsCount = base.completed + realRatingCount;
      const totalRatingsSum = base.ratingSum + realRatingSum;
      const averageRating = totalRatingsCount > 0 ? totalRatingsSum / totalRatingsCount : 5.0;

      const realComplaints = orderNotes.filter(n => {
        if (n.tag !== 'complaint') return false;
        const wo = orders.find(o => o.id === n.workOrderId);
        return wo && wo.technicianId === tech.id;
      }).length;
      const complaints = base.complaints + realComplaints;

      const isKpiPassed = averageRating >= 4.5 ? "DAT KPI" : "KHONG DAT";

      csvContent += `${tech.id},${tech.name},${completed},${duration},${extensions},${averageRating.toFixed(2)},${complaints},${isKpiPassed}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_KPI_Nhan_Vien_Wassup_OS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & QUICK CHECKIN BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">TIẾP NHẬN & ĐIỀU PHỐI (RECEPTION DESK)</h1>
          <p className="text-mid-gray text-xs mt-1 font-sans">
            Thực hiện check-in xe cực nhanh (dưới 45s) và phân bổ công việc tối ưu cho kỹ thuật viên
          </p>
        </div>

        <button
          onClick={() => setShowCheckInModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black text-xs font-extrabold font-display uppercase transition shadow-md shadow-brand-green/15 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          TIẾP NHẬN XE MỚI (CHECK-IN)
        </button>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row border border-stone-200/80 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex-1 py-3 px-4 text-center font-display font-black text-[11px] tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'dispatch'
              ? "bg-matte-black text-white shadow-sm"
              : "bg-[#f8f8f8] text-[#8e8e8e] hover:text-matte-black hover:bg-stone-100"
          }`}
        >
          <Activity className="h-4 w-4 shrink-0" />
          BẢNG ĐIỀU PHỐI TRỰC QUAN
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-4 text-center font-display font-black text-[11px] tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? "bg-matte-black text-white shadow-sm"
              : "bg-[#f8f8f8] text-[#8e8e8e] hover:text-matte-black hover:bg-stone-100"
          }`}
        >
          <ClipboardList className="h-4 w-4 shrink-0" />
          DANH SÁCH LỆNH XE & NHẬT KÝ
        </button>
        <button
          onClick={() => setActiveTab('kpi')}
          className={`flex-1 py-3 px-4 text-center font-display font-black text-[11px] tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'kpi'
              ? "bg-matte-black text-white shadow-sm"
              : "bg-[#f8f8f8] text-[#8e8e8e] hover:text-matte-black hover:bg-stone-100"
          }`}
        >
          <UserCheck className="h-4 w-4 shrink-0" />
          BÁO CÁO KPI KỸ THUẬT VIÊN
        </button>
      </div>

      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          {/* TELEGRAM ALERTS SIMULATION */}
          {alertTelegramSent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-red-500 text-white p-4.5 rounded-2xl flex items-start gap-3 shadow-lg"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-bounce mt-0.5" />
          <div>
            <h4 className="font-display font-extrabold text-xs uppercase tracking-wider">⚠️ CẢNH BÁO TELEGRAM ĐÃ BẮN KHẨN CẤP</h4>
            <p className="text-xs opacity-90 mt-0.5 font-sans">
              Hệ thống WASSUP OS vừa kích hoạt Webhook và bắn thông tin khiếu nại của xe <strong>{selectedOrder?.licensePlate}</strong> trực tiếp tới Master Admin: <em>"Khiếu nại: {noteText}"</em>.
            </p>
          </div>
        </motion.div>
      )}

      {/* SECTION: YÊU CẦU XIN GIA HẠN THỜI GIAN (ETA EXTENSIONS EMERGENCY) */}
      {orders.some(o => o.etaExtensionRequest?.status === 'pending') && (
        <div className="bg-red-50 border-2 border-red-500/30 p-5 rounded-2xl shadow-md space-y-3 animate-pulse-slow">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
            <h3 className="text-sm font-black font-display tracking-wider uppercase">
              🚨 CẢNH BÁO KHẨN: YÊU CẦU XIN GIA HẠN THI CÔNG (ETA REQUESTS)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.filter(o => o.etaExtensionRequest?.status === 'pending').map(wo => (
              <div key={wo.id} className="bg-white border border-red-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-black text-xs text-red-600 tracking-wider bg-red-100 px-2 py-0.5 rounded">
                      {wo.licensePlate}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-sans font-bold">
                      ({wo.vehicleSegment})
                    </span>
                  </div>
                  <div className="text-[11px] text-matte-black font-sans">
                    KTV: <strong>{wo.technicianName}</strong> ({wo.boothName})
                  </div>
                  <div className="text-[10px] text-stone-500 font-sans">
                    Lý do: <span className="italic text-red-600 font-semibold">"{wo.etaExtensionRequest?.reason}"</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-800">
                    Thời gian xin thêm: <span className="text-amber-600 text-xs font-black font-display">+{wo.etaExtensionRequest?.minutes} Phút</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => simActions.resolveEtaExtension(wo.id, 'approve')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] font-display uppercase tracking-wider cursor-pointer border-0 shadow-sm"
                  >
                    👍 ĐỒNG Ý
                  </button>
                  <button
                    onClick={() => simActions.resolveEtaExtension(wo.id, 'reject')}
                    className="px-3.5 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-[10px] font-display uppercase tracking-wider cursor-pointer border-0"
                  >
                    👎 TỪ CHỐI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BẢNG TRẠNG THÁI VẬN HÀNH & ĐIỀU PHỐI (LIVE DRAG-AND-DROP WORKSPACE) */}
      <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-green" />
            <h3 className="font-display text-sm font-black text-matte-black uppercase tracking-wider">
              BẢNG VẬN HÀNH & ĐIỀU PHỐI TRỰC QUAN
            </h3>
          </div>
          <div className="text-[10px] text-mid-gray font-sans font-bold flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Trống</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span> Đang thi công</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Bảo trì</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* COLUMN 1: HÀNG CHỜ XE (QUEUE) */}
          <div className="bg-slate-950 text-white p-4 rounded-xl flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-green" />
                <span className="text-xs font-extrabold uppercase text-brand-green font-display">Hàng Chờ Xe</span>
              </div>
              <span className="bg-brand-green/20 text-brand-green font-sans font-black text-[10px] px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'queued').length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {orders.filter(o => o.status === 'queued').length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500 h-full">
                  <Car className="h-8 w-8 opacity-40 mb-2" />
                  <p className="text-[10px] font-sans">Hàng chờ rỗng</p>
                  <p className="text-[9px] font-sans opacity-70">Check-in xe mới để tiếp nhận</p>
                </div>
              ) : (
                orders.filter(o => o.status === 'queued').map((wo) => (
                  <div
                    key={wo.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", wo.id);
                    }}
                    onClick={() => {
                      setDispatchingWo(wo);
                      setDispatchingBoothId(null);
                    }}
                    className="p-3 bg-slate-900 border border-slate-850 rounded-lg hover:border-brand-green/40 transition cursor-pointer hover:bg-slate-850 space-y-2 select-none"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-sans text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded font-extrabold">
                        {wo.packageCode}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold">
                        {wo.vehicleSegment}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-black font-sans tracking-wider text-white">{wo.licensePlate}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">
                        {wo.customerName || "Khách vãng lai"}
                      </div>
                      {wo.notes && (
                        <div className="text-[10px] text-brand-green bg-brand-green/10 p-1.5 rounded mt-2 italic font-medium leading-tight line-clamp-2">
                          💡 {wo.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-1.5 mt-1 font-medium">
                      <span>Chạm hoặc Kéo thả để xếp ➔</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMNS 2-5: THE BOOTHS (Wash Bays) */}
          {booths.map((b) => {
            const boothWorkOrders = orders.filter(o => o.boothId === b.id && o.status !== 'done');
            const hasCards = boothWorkOrders.length > 0;
            const isOver = draggedOverBoothId === b.id;
            const technicians = staff.filter(s => s.role === 'technician');
            const friendlyName = getFriendlyBoothName(b);

            return (
              <div
                key={b.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggedOverBoothId(b.id);
                }}
                onDragLeave={() => setDraggedOverBoothId(null)}
                onDrop={(e) => {
                  const receivedWoId = e.dataTransfer.getData("text/plain");
                  if (receivedWoId) {
                    handleDropVehicle(receivedWoId, b.id);
                  }
                  setDraggedOverBoothId(null);
                }}
                className={`rounded-xl border p-4 flex flex-col min-h-[350px] transition-all duration-200 ${
                  isOver 
                    ? "bg-brand-green-light border-brand-green ring-4 ring-brand-green/10" 
                    : hasCards 
                      ? "bg-white border-stone-200 shadow-sm" 
                      : "bg-stone-50/50 border-stone-200/80 border-dashed"
                }`}
              >
                {/* Booth Header */}
                <div className="flex items-center justify-between border-b border-stone-150 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      hasCards 
                        ? "bg-amber-500 animate-pulse" 
                        : b.status === 'idle' 
                          ? "bg-emerald-500" 
                          : "bg-red-500"
                    }`} />
                    <span className="text-xs font-extrabold text-slate-900 font-display uppercase tracking-wide">
                      {friendlyName}
                    </span>
                  </div>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                    hasCards 
                      ? "bg-amber-50 text-amber-800 border border-amber-100" 
                      : b.status === 'idle' 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                        : "bg-red-50 text-red-800 border border-red-100"
                  }`}>
                    {hasCards ? "Bận" : b.status === 'idle' ? "Rỗi" : "Bảo trì"}
                  </span>
                </div>

                {/* Booth Content */}
                <div className="flex-1 flex flex-col gap-3">
                  {hasCards ? (
                    boothWorkOrders.map((wo) => {
                      return (
                        <div
                          key={wo.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", wo.id);
                          }}
                          className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg space-y-2.5 transition shadow-sm cursor-grab active:cursor-grabbing select-none hover:border-stone-300"
                        >
                          {/* Card Header: Package & License Plate */}
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-xs font-black text-slate-950 tracking-wider">
                              {wo.licensePlate}
                            </span>
                            <span className="text-[9px] font-extrabold font-sans text-forest-green bg-brand-green-light px-1.5 py-0.5 rounded">
                              {wo.packageCode}
                            </span>
                          </div>

                          {/* Customer Info */}
                          <div className="text-[10px] text-stone-500 font-sans">
                            Khách: <strong className="text-slate-800">{wo.customerName || "Khách vãng lai"}</strong>
                          </div>

                          {wo.notes && (
                            <div className="text-[10px] text-stone-600 bg-stone-100 border border-stone-200 p-2 rounded italic font-medium leading-tight">
                              💡 {wo.notes}
                            </div>
                          )}

                          {/* Technician Assign Selector */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[9px] font-sans text-stone-500 uppercase font-extrabold">
                              <UserCheck className="h-3.5 w-3.5 text-stone-400" />
                              <span>Kỹ thuật viên gán:</span>
                            </div>
                            <select
                              value={wo.technicianId || ""}
                              onChange={(e) => {
                                const newTechId = e.target.value;
                                if (newTechId) {
                                  simActions.assignWorkOrder(wo.id, newTechId, b.id);
                                }
                              }}
                              className="w-full bg-white border border-stone-200 rounded px-1.5 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-brand-green font-semibold"
                            >
                              <option value="">Chưa phân công...</option>
                              {technicians.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* State & Channel Status Badges */}
                          <div className="space-y-1.5 pt-1.5 border-t border-stone-200/60">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-stone-400 font-medium">Trạng thái:</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                                wo.status === 'assigned' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                wo.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-150 animate-pulse' :
                                wo.status === 'quality_check' ? 'bg-purple-50 text-purple-700 border border-purple-150' :
                                wo.status === 'rework' ? 'bg-red-50 text-red-700 border border-red-200 animate-bounce' :
                                'bg-stone-50 text-stone-700'
                              }`}>
                                {wo.status === 'assigned' ? 'Đã gán (Chờ)' :
                                 wo.status === 'in_progress' ? 'Đang rửa xe' :
                                 wo.status === 'quality_check' ? 'Chờ QC' :
                                 wo.status === 'rework' ? 'Rework' : wo.status}
                              </span>
                            </div>

                            {/* Channel update badge */}
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-stone-400 font-medium">Nguồn cập nhật:</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold uppercase text-[8px] ${
                                wo.lastChannel === 'telegram' 
                                  ? 'bg-sky-50 text-sky-700 border border-sky-100' 
                                  : wo.lastChannel === 'system' 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                              }`}>
                                {wo.lastChannel === 'telegram' ? (
                                  <>
                                    <MessageSquare className="h-2.5 w-2.5 text-sky-500" />
                                    Telegram Bot
                                  </>
                                ) : wo.lastChannel === 'system' ? (
                                  <>
                                    <Cpu className="h-2.5 w-2.5 text-rose-500" />
                                    Hệ thống
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="h-2.5 w-2.5 text-stone-500" />
                                    Admin Update
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* State update quick buttons inside card */}
                          <div className="pt-2 border-t border-stone-200/60 flex flex-col gap-1">
                            {wo.status === 'assigned' && (
                              <button
                                onClick={() => {
                                  simActions.updateWorkOrderStatus(wo.id, 'in_progress', undefined, 'web', 'Bắt đầu từ sảnh đón');
                                }}
                                className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded text-[9px] uppercase transition cursor-pointer border-0 shadow-sm"
                              >
                                ▶ Bắt đầu thi công
                              </button>
                            )}
                            {wo.status === 'in_progress' && (
                              <button
                                onClick={() => {
                                  simActions.updateWorkOrderStatus(wo.id, 'quality_check', undefined, 'web', 'Yêu cầu kiểm định chất lượng');
                                }}
                                className="w-full py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded text-[9px] uppercase transition cursor-pointer border-0 shadow-sm"
                              >
                                🔍 Kiểm định QC
                              </button>
                            )}
                            {wo.status === 'quality_check' && (
                              <div className="grid grid-cols-2 gap-1 w-full">
                                <button
                                  onClick={() => {
                                    simActions.updateWorkOrderStatus(wo.id, 'done', undefined, 'web', 'Hoàn thành QC - Xuất xưởng');
                                  }}
                                  className="py-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[9px] uppercase transition cursor-pointer border-0 shadow-sm text-center"
                                >
                                  ✓ Đạt QC
                                </button>
                                <button
                                  onClick={() => {
                                    simActions.updateWorkOrderStatus(wo.id, 'rework', undefined, 'web', 'Yêu cầu thi công lại do lỗi');
                                  }}
                                  className="py-1 px-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded text-[9px] uppercase transition cursor-pointer border-0 shadow-sm text-center"
                                >
                                  ✗ Làm lại
                                </button>
                              </div>
                            )}
                            {wo.status === 'rework' && (
                              <button
                                onClick={() => {
                                  simActions.updateWorkOrderStatus(wo.id, 'in_progress', undefined, 'web', 'Bắt đầu khắc phục lỗi (Rework)');
                                }}
                                className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded text-[9px] uppercase transition cursor-pointer border-0 shadow-sm"
                              >
                                🔄 Làm lại
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Empty Dropzone style */}
                      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-lg p-6 text-center my-2 bg-stone-50/20 min-h-[160px]">
                        <Car className="h-6 w-6 text-stone-300 mb-1" />
                        <span className="text-[10px] text-stone-400 font-sans font-semibold block">
                          Kéo xe thả vào đây
                        </span>
                        <span className="text-[9px] text-stone-400 font-sans opacity-75">
                          hoặc gán từ hàng chờ
                        </span>
                      </div>

                      {/* Pre-assign technician selector */}
                      <div className="space-y-1 pt-2 border-t border-stone-100">
                        <label className="text-[9px] font-sans text-stone-500 uppercase font-extrabold block">
                          KTV dự kiến:
                        </label>
                        <select
                          value={boothTechs[b.id] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBoothTechs(prev => ({ ...prev, [b.id]: value }));
                          }}
                          className="w-full bg-white border border-stone-200 rounded px-1.5 py-1 text-[10px] text-slate-800 focus:outline-none focus:border-brand-green"
                        >
                          {technicians.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      )}

      {/* TAB 2: DANH SÁCH LỆNH XE & NHẬT KÝ CHI TIẾT */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: WORK ORDERS LIST TABLE */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-forest-green" />
                  DANH SÁCH TIẾP NHẬN XE TRONG NGÀY
                </h2>
                
                {/* Search Bar */}
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-mid-gray" />
                  <input
                    type="text"
                    placeholder="Tìm biển số, tên, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-9 pr-4 py-2 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green placeholder-mid-gray"
                  />
                </div>
              </div>

              {/* ADVANCED FILTER ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-stone-50 p-3 rounded-xl border border-stone-150/60">
                {/* Filter Tech */}
                <div className="space-y-1">
                  <label className="text-[9px] font-sans text-mid-gray uppercase font-extrabold block">KTV phụ trách</label>
                  <select
                    value={filterTechId}
                    onChange={(e) => setFilterTechId(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[10px] font-sans font-bold text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Tất cả KTV</option>
                    {staff.filter(s => s.role === 'technician').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Status */}
                <div className="space-y-1">
                  <label className="text-[9px] font-sans text-mid-gray uppercase font-extrabold block">Trạng thái lệnh</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[10px] font-sans font-bold text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="queued">Chờ phân buồng</option>
                    <option value="assigned">Đã gán (Chờ làm)</option>
                    <option value="in_progress">Đang rửa/thi công</option>
                    <option value="quality_check">Chờ QC kiểm định</option>
                    <option value="rework">Yêu cầu Rework (Làm lại)</option>
                    <option value="done">Hoàn thành (Đã xuất xưởng)</option>
                  </select>
                </div>

                {/* Filter Package */}
                <div className="space-y-1">
                  <label className="text-[9px] font-sans text-mid-gray uppercase font-extrabold block">Gói dịch vụ</label>
                  <select
                    value={filterPackage}
                    onChange={(e) => setFilterPackage(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[10px] font-sans font-bold text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Tất cả các gói</option>
                    {packages.map(p => (
                      <option key={p.code} value={p.code}>{p.name} [{p.code}]</option>
                    ))}
                  </select>
                </div>

                {/* Filter Channel */}
                <div className="space-y-1">
                  <label className="text-[9px] font-sans text-mid-gray uppercase font-extrabold block">Kênh tiếp nhận</label>
                  <select
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[10px] font-sans font-bold text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Tất cả các kênh</option>
                    <option value="manual">Thủ công (Nhân viên check-in)</option>
                    <option value="kiosk">Kiosk tự phục vụ (Kiosk)</option>
                  </select>
                </div>
              </div>

              {/* TABLE LIST */}
              <div className="border border-[#e5e5e5] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                        <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Biển Số Xe</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Khách Hàng</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Gói Dịch Vụ</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">KTV gán</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Kênh</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-mid-gray font-sans text-sm">
                            Không tìm thấy lệnh rửa xe nào phù hợp bộ lọc của bạn.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((wo) => {
                          const isManual = wo.lastChannel === 'web';
                          return (
                            <tr
                              key={wo.id}
                              onClick={() => setSelectedOrder(wo)}
                              className={`hover:bg-warm-white/50 transition-colors cursor-pointer ${
                                selectedOrder?.id === wo.id ? "bg-brand-green-light" : ""
                              }`}
                            >
                              <td className="p-4 font-extrabold text-matte-black tracking-wider text-sm font-sans">{wo.licensePlate}</td>
                              <td className="p-4 font-bold text-matte-black">
                                <div>{wo.customerName}</div>
                                <div className="text-[10px] text-mid-gray font-normal">{wo.customerPhone || "Khách vãng lai"}</div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-100 text-matte-black font-extrabold text-[10px] font-sans border border-stone-200">
                                  {wo.packageCode}
                                </span>
                              </td>
                              <td className="p-4 font-medium text-matte-black">
                                {wo.technicianName ? (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-forest-green" /> {wo.technicianName}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 italic font-bold">Chưa gán KTV</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isManual ? "bg-stone-100 text-stone-700 animate-pulse-slow" : "bg-teal-50 text-teal-700 border border-teal-100"
                                }`}>
                                  {isManual ? <User className="h-2.5 w-2.5 text-stone-500" /> : <Monitor className="h-2.5 w-2.5 text-teal-500" />}
                                  {isManual ? "THỦ CÔNG" : "KIOSK"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                                    wo.status === 'done'
                                      ? "bg-brand-green text-matte-black border-brand-green"
                                      : wo.status === 'quality_check'
                                        ? "bg-purple-50 text-purple-700 border-purple-150"
                                        : wo.status === 'rework'
                                          ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                          : wo.status === 'in_progress'
                                            ? "bg-amber-50 text-amber-700 border-amber-150 animate-pulse"
                                            : "bg-stone-50 text-stone-600 border-stone-200"
                                  }`}
                                >
                                  {wo.status === 'queued' ? 'Chờ phân bay' : 
                                   wo.status === 'assigned' ? 'Đã gán' : 
                                   wo.status === 'in_progress' ? 'Đang rửa' : 
                                   wo.status === 'quality_check' ? 'QC Check' : 
                                   wo.status === 'rework' ? 'Rework' : 'Hoàn tất'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS PANEL & NOTES JOURNAL & RATINGS */}
          <div className="space-y-6">
            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm space-y-5">
              {selectedOrder ? (
                <div className="space-y-5">
                  {/* Title Header */}
                  <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                    <div>
                      <span className="text-[10px] font-sans font-extrabold text-mid-gray block uppercase tracking-wider">Chi Tiết Lệnh Xe</span>
                      <span className="text-xl font-black font-sans text-matte-black tracking-widest">{selectedOrder.licensePlate}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      selectedOrder.status === 'done' ? "bg-brand-green text-matte-black border-brand-green" :
                      selectedOrder.status === 'rework' ? "bg-red-50 text-red-700 border-red-200 animate-pulse" :
                      selectedOrder.status === 'quality_check' ? "bg-purple-50 text-purple-700 border-purple-200" :
                      selectedOrder.status === 'in_progress' ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                      "bg-stone-100 text-stone-600 border-stone-200"
                    }`}>
                      {selectedOrder.status === 'queued' ? 'Hàng chờ xe' : 
                       selectedOrder.status === 'assigned' ? 'Đã gán KTV' : 
                       selectedOrder.status === 'in_progress' ? 'Đang thi công' : 
                       selectedOrder.status === 'quality_check' ? 'Chờ kiểm QC' : 
                       selectedOrder.status === 'rework' ? 'Rework (Lại)' : 'Hoàn tất'}
                    </span>
                  </div>

                  {/* Core Information Grid */}
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-sans border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase block">Khách hàng:</span>
                      <span className="text-matte-black font-bold block">{selectedOrder.customerName}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase block">Số điện thoại:</span>
                      <span className="text-matte-black font-sans block font-semibold">{selectedOrder.customerPhone || "Khách vãng lai"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase block">Dịch vụ chính:</span>
                      <span className="text-forest-green font-extrabold block">{selectedOrder.packageCode}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase block">Phân khúc:</span>
                      <span className="text-matte-black uppercase font-bold block">{selectedOrder.vehicleSegment}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase block">KTV gán:</span>
                      <span className="text-matte-black font-semibold block">{selectedOrder.technicianName || "— Chưa gán —"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase block">Buồng chuyên trách:</span>
                      <span className="text-forest-green font-bold block">{selectedOrder.boothName || "— Chưa gán —"}</span>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <div className="flex justify-between items-center bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-150/60 mt-1">
                        <span className="text-[10px] text-mid-gray font-bold">Tổng thanh toán:</span>
                        <span className="text-matte-black font-black font-display text-sm">{formatVnd(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1. TIMELINE NOTES JOURNAL (NO OVERWRITING) */}
                  <div className="space-y-3">
                    <span className="font-display text-[10px] font-black text-matte-black uppercase tracking-wider block">
                      📒 NHẬT KÝ GHI CHÚ XE ({orderNotes.filter(n => n.workOrderId === selectedOrder.id).length})
                    </span>
                    
                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-stone-200">
                      {orderNotes.filter(n => n.workOrderId === selectedOrder.id).length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                          <span className="text-[10px] text-mid-gray font-sans italic block">Chưa ghi nhận ghi chú nào trong nhật ký xe này.</span>
                        </div>
                      ) : (
                        orderNotes.filter(n => n.workOrderId === selectedOrder.id).map((note: any) => (
                          <div key={note.id} className="bg-stone-50 p-2.5 rounded-xl border border-stone-150/60 space-y-1 text-[11px] font-sans">
                            <div className="flex items-center justify-between text-[9px] font-bold">
                              <span className={`px-1.5 py-0.5 rounded uppercase ${
                                note.tag === 'complaint' ? "bg-red-150 text-red-700 border border-red-250 font-black animate-pulse" :
                                note.tag === 'technical' ? "bg-emerald-50 text-emerald-700" :
                                note.tag === 'special' ? "bg-amber-100 text-amber-700" :
                                "bg-stone-200 text-stone-700"
                              }`}>
                                {note.tag === 'complaint' ? 'Khiếu nại' :
                                 note.tag === 'technical' ? 'Kỹ thuật' :
                                 note.tag === 'special' ? 'Đặc biệt' :
                                 note.tag === 'other' ? 'Khác' : 'Thông thường'}
                              </span>
                              <span className="text-stone-400">
                                {new Date(note.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} | {new Date(note.createdAt).toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}
                              </span>
                            </div>
                            <p className="text-stone-800 leading-relaxed break-words">{note.content}</p>
                            <span className="text-[8px] text-stone-400 block font-semibold">Tác nhân: {note.actor}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 2. ADD NOTE TO JOURNAL FORM */}
                  <form onSubmit={handleAddNote} className="border-t border-stone-100 pt-4 space-y-3">
                    <span className="font-display text-[9px] font-black text-mid-gray uppercase tracking-wider block">Ghi chú sự kiện mới</span>
                    
                    <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-[9px] font-bold font-sans">
                      <button
                        type="button"
                        onClick={() => setNoteTag("standard")}
                        className={`flex-1 py-1 rounded-lg text-center transition ${
                          noteTag === "standard" ? "bg-white text-matte-black shadow-sm" : "text-mid-gray"
                        }`}
                      >
                        Bình thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteTag("technical")}
                        className={`flex-1 py-1 rounded-lg text-center transition ${
                          noteTag === "technical" ? "bg-white text-matte-black shadow-sm" : "text-mid-gray"
                        }`}
                      >
                        Kỹ thuật
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteTag("special")}
                        className={`flex-1 py-1 rounded-lg text-center transition ${
                          noteTag === "special" ? "bg-white text-matte-black shadow-sm" : "text-mid-gray"
                        }`}
                      >
                        Đặc biệt
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteTag("complaint")}
                        className={`flex-1 py-1 rounded-lg text-center transition ${
                          noteTag === "complaint" ? "bg-red-500 text-white shadow-sm" : "text-mid-gray"
                        }`}
                      >
                        Khiếu nại
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <MarkdownTextarea
                        id="reception-note-text"
                        placeholder="Nhập nội dung nhật ký ghi nhận xe..."
                        value={noteText}
                        onChange={(val) => setNoteText(val)}
                        rows={2}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-matte-black hover:bg-matte-black/90 text-white font-extrabold text-xs font-display transition shadow-sm uppercase cursor-pointer"
                    >
                      Xác nhận ghi ghi chú ✍️
                    </button>
                  </form>

                  {/* 3. RATINGS PANEL (FOR COMPLETED ORDERS ONLY) */}
                  {selectedOrder.status === 'done' && (
                    <div className="border-t border-stone-100 pt-4 space-y-4">
                      <span className="font-display text-[10px] font-black text-matte-black uppercase tracking-wider block">
                        ⭐ ĐÁNH GIÁ 2 CHIỀU ĐỘC LẬP
                      </span>

                      {(() => {
                        const vehicleRating = orderRatings.find(r => r.workOrderId === selectedOrder.id && r.rating_type === 'vehicle_quality');
                        const ktvRating = orderRatings.find(r => r.workOrderId === selectedOrder.id && r.rating_type === 'ktv_service');

                        if (vehicleRating || ktvRating) {
                          return (
                            <div className="space-y-3">
                              {vehicleRating && (
                                <div className="bg-emerald-50/60 border border-emerald-200/50 p-3 rounded-xl space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Chất lượng xe</span>
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`h-3 w-3 ${s <= vehicleRating.stars ? "fill-amber-400 stroke-amber-500 text-amber-500" : "text-stone-200"}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-stone-700 font-sans italic leading-relaxed">
                                    "{vehicleRating.comment || "Không có nhận xét."}"
                                  </p>
                                </div>
                              )}

                              {ktvRating && (
                                <div className="bg-sky-50/60 border border-sky-200/50 p-3 rounded-xl space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-extrabold uppercase bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Kỹ thuật viên</span>
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`h-3 w-3 ${s <= ktvRating.stars ? "fill-amber-400 stroke-amber-500 text-amber-500" : "text-stone-200"}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-stone-700 font-sans italic leading-relaxed">
                                    "{ktvRating.comment || "Không có nhận xét."}"
                                  </p>
                                </div>
                              )}
                              
                              <p className="text-[8px] text-center text-stone-400 font-sans font-bold uppercase mt-1">
                                Đã hoàn tất ghi nhận đánh giá 2 chiều
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <form onSubmit={handleAddRating} className="space-y-4">
                              {/* Đánh giá xe */}
                              <div className="bg-[#fafafa] p-3 rounded-xl border border-stone-200/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-matte-black font-extrabold uppercase tracking-wide">1. Chất lượng hoàn thành xe</span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRatingVehicleStars(s)}
                                        className="text-amber-400 hover:scale-110 transition cursor-pointer border-0 bg-transparent p-0.5"
                                      >
                                        <Star
                                          className={`h-4.5 w-4.5 ${s <= ratingVehicleStars ? "fill-amber-400 stroke-amber-500 text-amber-500" : "text-stone-300"}`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <MarkdownTextarea
                                  id="rating-vehicle-comment"
                                  placeholder="Nhập nhận xét về chất lượng rửa, dọn sạch, độ bóng xe..."
                                  value={ratingVehicleComment}
                                  onChange={(val) => setRatingVehicleComment(val)}
                                  rows={2}
                                />
                              </div>

                              {/* Đánh giá KTV */}
                              <div className="bg-[#fafafa] p-3 rounded-xl border border-stone-200/60 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-matte-black font-extrabold uppercase tracking-wide">2. Kỹ thuật viên (Thái độ & Tốc độ)</span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRatingKtvStars(s)}
                                        className="text-amber-400 hover:scale-110 transition cursor-pointer border-0 bg-transparent p-0.5"
                                      >
                                        <Star
                                          className={`h-4.5 w-4.5 ${s <= ratingKtvStars ? "fill-amber-400 stroke-amber-500 text-amber-500" : "text-stone-300"}`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <MarkdownTextarea
                                  id="rating-ktv-comment"
                                  placeholder="Nhập nhận xét về thái độ phục vụ, tốc độ thi công của KTV..."
                                  value={ratingKtvComment}
                                  onChange={(val) => setRatingKtvComment(val)}
                                  rows={2}
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-matte-black font-black text-xs font-display transition shadow-sm uppercase cursor-pointer border-0 font-bold"
                              >
                                Gửi Đánh Giá 2 Chiều ⭐
                              </button>
                            </form>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#e5e5e5] rounded-xl bg-warm-white">
                  <Activity className="h-6 w-6 text-mid-gray mb-2 animate-pulse-slow" />
                  <span className="text-xs text-matte-black font-extrabold font-display uppercase">BÀN ĐIỀU PHỐI ĐANG RỖI</span>
                  <span className="text-[10px] text-mid-gray mt-1 max-w-[200px] font-sans">
                    Nhấp chọn một dòng xe tại bảng danh sách để xem chi tiết lịch trình, ETA, đánh giá dịch vụ và cấu hình ghi chú kỹ thuật.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BÁO CÁO KPI KỸ THUẬT VIÊN THEO THÁNG */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          {/* GENERAL SUMMARY OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-brand-green-light rounded-xl">
                <CheckCircle className="h-5 w-5 text-forest-green" />
              </div>
              <div>
                <span className="text-[10px] text-mid-gray uppercase font-black font-display tracking-wider block">Tổng xe hoàn tất</span>
                <span className="text-lg font-black text-matte-black block">
                  {staff.filter(s => s.role === 'technician').reduce((sum, tech) => {
                    const realDone = orders.filter(o => o.technicianId === tech.id && o.status === 'done').length;
                    return sum + (KTV_BASELINE[tech.id]?.completed || 0) + realDone;
                  }, 0)} xe
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Star className="h-5 w-5 text-amber-600 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] text-mid-gray uppercase font-black font-display tracking-wider block">Rating trung bình tiệm</span>
                <span className="text-lg font-black text-matte-black block">
                  {(() => {
                    let totalStars = 0;
                    let totalCount = 0;
                    staff.filter(s => s.role === 'technician').forEach(tech => {
                      const base = KTV_BASELINE[tech.id];
                      if (base) {
                        totalStars += base.ratingSum;
                        totalCount += base.completed;
                      }
                      const techRatings = orderRatings.filter(r => {
                        const wo = orders.find(o => o.id === r.workOrderId);
                        return wo && wo.technicianId === tech.id && r.rating_type === 'ktv_service';
                      });
                      totalStars += techRatings.reduce((sum, r) => sum + r.stars, 0);
                      totalCount += techRatings.length;
                    });
                    return totalCount > 0 ? (totalStars / totalCount).toFixed(2) : "5.0";
                  })()} / 5.0
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <span className="text-[10px] text-mid-gray uppercase font-black font-display tracking-wider block">Số khách khiếu nại</span>
                <span className="text-lg font-black text-matte-black block">
                  {staff.filter(s => s.role === 'technician').reduce((sum, tech) => {
                    const realComplaints = orderNotes.filter(n => {
                      if (n.tag !== 'complaint') return false;
                      const wo = orders.find(o => o.id === n.workOrderId);
                      return wo && wo.technicianId === tech.id;
                    }).length;
                    return sum + (KTV_BASELINE[tech.id]?.complaints || 0) + realComplaints;
                  }, 0)} vụ
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl">
                <UserCheck className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <span className="text-[10px] text-mid-gray uppercase font-black font-display tracking-wider block">KTV đạt chuẩn KPI</span>
                <span className="text-lg font-black text-matte-black block">
                  {(() => {
                    let achieved = 0;
                    staff.filter(s => s.role === 'technician').forEach(tech => {
                      const base = KTV_BASELINE[tech.id];
                      const techRatings = orderRatings.filter(r => {
                        const wo = orders.find(o => o.id === r.workOrderId);
                        return wo && wo.technicianId === tech.id && r.rating_type === 'ktv_service';
                      });
                      const totalStars = (base?.ratingSum || 0) + techRatings.reduce((sum, r) => sum + r.stars, 0);
                      const totalCount = (base?.completed || 0) + techRatings.length;
                      const avg = totalCount > 0 ? totalStars / totalCount : 5.0;
                      if (avg >= 4.5) achieved++;
                    });
                    return `${achieved}/${staff.filter(s => s.role === 'technician').length}`;
                  })()} đạt
                </span>
              </div>
            </div>
          </div>

          {/* MAIN KPI REPORT TABLE */}
          <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-display text-sm font-black text-matte-black uppercase tracking-wider">
                  BÁO CÁO HIỆU SUẤT & KPI KỸ THUẬT VIÊN (THÁNG NÀY)
                </h3>
                <p className="text-[10px] text-mid-gray font-sans mt-0.5">
                  Đối chiếu KPI nhân viên Detailing (Rating trung bình tháng phải đạt từ <strong>&gt;= 4.5/5</strong>) để xét thưởng.
                </p>
              </div>

              {/* EXPORT CSV BUTTON */}
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-matte-black hover:bg-matte-black/95 text-white text-[11px] font-extrabold font-display uppercase tracking-wider transition shadow-sm cursor-pointer border-0"
              >
                <Download className="h-4 w-4" />
                XUẤT BÁO CÁO KPI (CSV)
              </button>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-mid-gray border-b border-stone-200">
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold">Kỹ Thuật Viên</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold text-center">Lệnh hoàn thành</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold text-center">Thời gian thi công (Phút)</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold text-center">Số lần gia hạn</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold">Lý do xin gia hạn phổ biến</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold text-center">Đánh giá trung bình</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold text-center">Khiếu nại</th>
                      <th className="p-4 uppercase tracking-wider text-[9px] font-extrabold text-right">KPI (Đạt &gt;= 4.5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150">
                    {staff.filter(s => s.role === 'technician').map(tech => {
                      const base = KTV_BASELINE[tech.id] || { completed: 0, duration: 0, extensions: 0, complaints: 0, ratingSum: 0, reasons: [] };
                      
                      // Calculate active daily completions
                      const realDone = orders.filter(o => o.technicianId === tech.id && o.status === 'done').length;
                      const realDuration = orders.filter(o => o.technicianId === tech.id && o.status === 'done').reduce((sum, o) => sum + (o.estimatedDuration || 30), 0);
                      const realExtensions = orders.filter(o => o.technicianId === tech.id && o.etaExtensionRequest?.status === 'approved').length;
                      
                      // Calculate ratings (KTV Service rating only)
                      const techRatings = orderRatings.filter(r => {
                        const wo = orders.find(o => o.id === r.workOrderId);
                        return wo && wo.technicianId === tech.id && r.rating_type === 'ktv_service';
                      });
                      const realRatingSum = techRatings.reduce((sum, r) => sum + r.stars, 0);
                      const realRatingCount = techRatings.length;

                      const completed = base.completed + realDone;
                      const duration = base.duration + realDuration;
                      const extensions = base.extensions + realExtensions;
                      
                      const totalRatingsCount = base.completed + realRatingCount;
                      const totalRatingsSum = base.ratingSum + realRatingSum;
                      const averageRating = totalRatingsCount > 0 ? parseFloat((totalRatingsSum / totalRatingsCount).toFixed(2)) : 5.0;

                      // Complaints
                      const realComplaints = orderNotes.filter(n => {
                        if (n.tag !== 'complaint') return false;
                        const wo = orders.find(o => o.id === n.workOrderId);
                        return wo && wo.technicianId === tech.id;
                      }).length;
                      const complaints = base.complaints + realComplaints;

                      const isKpiPassed = averageRating >= 4.5;

                      // Reasons union
                      const activeReasons = orders
                        .filter(o => o.technicianId === tech.id && o.etaExtensionRequest?.reason)
                        .map(o => o.etaExtensionRequest!.reason);
                      const allReasons = Array.from(new Set([...base.reasons, ...activeReasons])).slice(0, 3);

                      return (
                        <tr key={tech.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4">
                            <span className="font-extrabold text-matte-black text-sm block">{tech.name}</span>
                            <span className="text-[9px] text-mid-gray uppercase font-sans font-semibold">Mã: {tech.id} | Chức vụ: Kỹ thuật viên</span>
                          </td>
                          <td className="p-4 text-center font-bold text-matte-black text-sm">{completed}</td>
                          <td className="p-4 text-center font-sans text-mid-gray font-bold">{duration} phút</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold ${extensions > 3 ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700"}`}>
                              {extensions} lần
                            </span>
                          </td>
                          <td className="p-4 text-stone-600 font-sans max-w-xs">
                            {allReasons.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                                {allReasons.map((r, idx) => <li key={idx} className="truncate">"{r}"</li>)}
                              </ul>
                            ) : (
                              <span className="text-stone-400 italic">Chưa ghi nhận lý do</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 text-amber-500" />
                              <span className="font-extrabold text-matte-black text-sm">{averageRating.toFixed(2)}</span>
                            </div>
                            <span className="text-[8px] text-stone-400 font-bold block">{totalRatingsCount} đánh giá</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-black ${complaints > 0 ? "bg-red-100 text-red-700 animate-pulse border border-red-200" : "bg-emerald-100 text-emerald-800"}`}>
                              {complaints} vụ
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                              isKpiPassed 
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                                : "bg-red-500 text-white border-red-500 shadow-sm"
                            }`}>
                              {isKpiPassed ? "Đạt KPI ✓" : "Không đạt ✗"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH DRAWERS (MODAL) */}
      {showDispatchDrawer && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-white border-l border-[#e5e5e5] w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4 mb-6">
                <h3 className="font-display text-base font-black text-matte-black uppercase">ĐIỀU PHỐI LỆNH WASH BAY</h3>
                <button onClick={() => setShowDispatchDrawer(false)} className="text-mid-gray hover:text-matte-black transition cursor-pointer border-0 bg-transparent">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDispatchSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold block">
                    Gán Buồng Thi Công (Wash Bay)
                  </label>
                  <select
                    required
                    value={dispatchBoothId}
                    onChange={(e) => setDispatchBoothId(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-3 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Chọn buồng rỗi...</option>
                    {booths.map(b => (
                      <option key={b.id} value={b.id} disabled={b.status === 'busy'}>
                        {getFriendlyBoothName(b)} {b.status === 'busy' ? '(Đầy - Busy)' : '(Trống - Ready)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold block">
                    Gán Kỹ Thuật Viên Chuyên Trách
                  </label>
                  <select
                    required
                    value={dispatchTechId}
                    onChange={(e) => setDispatchTechId(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-3 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Chọn KTV ca làm...</option>
                    {staff.filter(s => s.role === 'technician').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-extrabold tracking-wider text-xs font-display transition shadow-md uppercase cursor-pointer border-0"
                >
                  XÁC NHẬN GÁN & CHUYỂN BUỒNG
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCheckInModal(false)}
              className="absolute top-4 right-4 text-mid-gray hover:text-matte-black transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-4 mb-4">
              <Sparkles className="h-5 w-5 text-forest-green" />
              <h3 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase">
                TIẾP NHẬN XE MỚI TRỰC TIẾP
              </h3>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              {/* 1. BIỂN SỐ XE - ĐƯA LÊN ĐẦU (TRƯỜNG ƯU TIÊN) */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-sans text-forest-green uppercase font-black flex items-center gap-1.5 justify-center">
                  <Car className="h-4 w-4" /> BIỂN SỐ XE (TRƯỜNG ƯU TIÊN)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="30A-123.45"
                  value={plate}
                  onChange={(e) => handlePlateInputChange(e.target.value)}
                  onFocus={() => {
                    if (plate.trim().length >= 3) setShowPlateSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowPlateSuggestions(false), 200)}
                  className="w-full bg-emerald-50/10 border-2 border-forest-green focus:border-forest-green rounded-2xl px-4 py-4 text-center font-black text-xl font-sans tracking-widest text-matte-black focus:outline-none shadow-inner placeholder-mid-gray/45 uppercase"
                />
                
                {/* Auto suggest dropdown from CRM */}
                {showPlateSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-xl max-h-[180px] overflow-y-auto divide-y divide-gray-100">
                    {filteredSuggestions.map((sugg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPlateSuggestion(sugg)}
                        className="w-full text-left p-2.5 hover:bg-stone-50 transition flex justify-between items-center cursor-pointer border-0 bg-transparent"
                      >
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-forest-green" />
                          <div>
                            <span className="font-sans font-extrabold text-xs text-matte-black tracking-wider block">{sugg.plate}</span>
                            <span className="text-[10px] text-mid-gray block font-sans font-medium">{sugg.customerName} - {sugg.phone}</span>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-forest-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {sugg.vehicleClass}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. THỂ HIỆN LỊCH SỬ DỊCH VỤ TẠI TẤT CẢ CÁC TRẠM NGAY LẬP TỨC */}
              {plate.trim().length >= 3 && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-150 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-display font-black text-matte-black uppercase tracking-wider flex items-center gap-1">
                      <History className="h-3.5 w-3.5 text-forest-green animate-spin-slow" /> LỊCH SỬ DỊCH VỤ TẠI TẤT CẢ CÁC TRẠM ({
                        orders.filter(o => o.licensePlate.toUpperCase().includes(plate.toUpperCase())).length
                      })
                    </span>
                    <span className="text-[9px] text-mid-gray font-sans font-bold">{plate.toUpperCase()}</span>
                  </div>

                  {(() => {
                    const plateServiceHistory = orders.filter(o => o.licensePlate.toUpperCase().includes(plate.toUpperCase()));
                    if (plateServiceHistory.length === 0) {
                      return (
                        <p className="text-[10px] text-mid-gray italic font-sans py-1">
                          Chưa có lịch sử dịch vụ nào tại hệ thống trạm cho xe này.
                        </p>
                      );
                    }
                    return (
                      <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                        {plateServiceHistory.map((h, idx) => {
                          const station = getStationForOrder(h.orderId || h.id);
                          const formattedDate = new Date(h.createdAt || h.orderCreatedAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          });
                          return (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-stone-200 text-[10px] font-sans flex justify-between items-start gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-stone-850">{h.packageCode}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-forest-green font-extrabold text-[9px] uppercase bg-brand-green-light px-1 rounded">{station}</span>
                                </div>
                                <div className="text-[9px] text-mid-gray font-medium">
                                  Ngày làm: {formattedDate} {h.technicianName && `| KTV: ${h.technicianName}`}
                                </div>
                                {h.notes && <p className="text-mid-gray italic mt-1 leading-relaxed text-[9px]">Ghi chú: "{h.notes}"</p>}
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <span className="font-bold text-matte-black font-sans">{formatVnd(h.total)}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                  h.status === 'done' ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-850"
                                }`}>
                                  {h.status === 'done' ? 'Đã xong' : 'Đang thi công'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TÌNH TRẠNG XE VÀO */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  TÌNH TRẠNG XE VÀO
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { value: 'normal', label: 'Bình thường', color: 'bg-stone-100 text-stone-800' },
                    { value: 'clean', label: 'Sạch sẽ ✨', color: 'bg-emerald-100 text-emerald-800' },
                    { value: 'dirty_heavy', label: 'Bẩn nặng 🌧️', color: 'bg-amber-100 text-amber-800' },
                    { value: 'scratch_light', label: 'Xước nhẹ ⚡', color: 'bg-blue-100 text-blue-800' },
                    { value: 'scratch_heavy', label: 'Xước nặng ⚠️', color: 'bg-red-100 text-red-800' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setVehicleCondition(item.value as any)}
                      className={`px-2 py-2.5 rounded-xl text-center text-[10px] font-extrabold border transition-all cursor-pointer ${
                        vehicleCondition === item.value
                          ? "border-matte-black bg-matte-black text-white shadow-sm ring-2 ring-stone-900/10"
                          : "border-transparent bg-stone-50 text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. THÔNG TIN KHÁCH HÀNG & PHÂN KHÚC XE (Tự động tải khi chọn gợi ý) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fafafa] p-3 rounded-xl border border-stone-150">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold flex items-center gap-1">
                    <Phone className="h-3 w-3 text-mid-gray" /> Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0901234567..."
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2.5 py-2 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold flex items-center gap-1">
                    <User className="h-3 w-3 text-mid-gray" /> Tên Khách Hàng
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tên chủ xe..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2.5 py-2 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold block">
                    Phân Khúc Xe
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as any)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-lg px-2.5 py-2 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV / Crossover</option>
                    <option value="truck">Bán tải / Xe tải</option>
                  </select>
                </div>
              </div>

              {/* Service package selection */}
              <div className="space-y-2">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Chọn Gói Dịch Vụ Chính
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-3 border rounded-xl text-left flex flex-col justify-between gap-1 transition-all min-h-[85px] ${
                        selectedPkg.id === pkg.id
                          ? "bg-brand-green-light border-2 border-brand-green text-matte-black"
                          : "bg-white border-[#e5e5e5] text-mid-gray hover:border-[#bcbcbc]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-[10px] tracking-wider uppercase font-sans text-xs">{pkg.code}</span>
                        {pkg.duration && (
                          <span className="text-[9px] font-sans text-gray-400 font-semibold">{pkg.duration} phút</span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-[11px] text-matte-black uppercase tracking-tight leading-tight mt-1 line-clamp-2">{pkg.name}</h4>
                      <span className="font-sans text-[10px] text-forest-green font-extrabold block mt-1">{formatVnd(pkg.price)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Addons Selection - Quick Search & Select */}
              <div className="space-y-2 relative">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold flex items-center justify-between">
                  <span>Dịch Vụ Lẻ / Bổ Trợ (Add-ons)</span>
                  <span className="text-[10px] text-gray-400 font-normal normal-case">Nhập tên để tìm kiếm nhanh</span>
                </label>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh dịch vụ lẻ (ví dụ: Phủ Rain, Khử mùi...)"
                    value={addonSearch}
                    onChange={(e) => {
                      setAddonSearch(e.target.value);
                      setShowAddonDropdown(true);
                    }}
                    onFocus={() => setShowAddonDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAddonDropdown(false), 200)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl pl-9 pr-8 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  />
                  {addonSearch && (
                    <button
                      type="button"
                      onClick={() => setAddonSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-matte-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {showAddonDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-xl max-h-[220px] overflow-y-auto divide-y divide-gray-100">
                    {addonsList.filter(addon => 
                      addon.name.toLowerCase().includes(addonSearch.toLowerCase()) ||
                      addon.code.toLowerCase().includes(addonSearch.toLowerCase())
                    ).length > 0 ? (
                      addonsList.filter(addon => 
                        addon.name.toLowerCase().includes(addonSearch.toLowerCase()) ||
                        addon.code.toLowerCase().includes(addonSearch.toLowerCase())
                      ).map((addon) => {
                        const isChecked = selectedAddons.find(a => a.id === addon.id);
                        return (
                          <div
                            key={addon.id}
                            onMouseDown={() => {
                              toggleAddon(addon);
                              setAddonSearch("");
                            }}
                            className={`p-2.5 flex items-center justify-between text-left cursor-pointer transition-colors ${
                              isChecked ? "bg-brand-green-light/60 hover:bg-brand-green-light" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-sans text-[9px] font-extrabold bg-stone-100 px-1 rounded text-stone-600">
                                  {addon.code}
                                </span>
                                <span className="font-display font-extrabold text-[11px] text-matte-black">
                                  {addon.name}
                                </span>
                              </div>
                              {addon.description && (
                                <p className="text-[10px] text-mid-gray leading-tight line-clamp-1">{addon.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-xs font-black text-forest-green">{formatVnd(addon.price)}</span>
                              <input
                                type="checkbox"
                                checked={!!isChecked}
                                readOnly
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green h-3.5 w-3.5"
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-400 font-medium">
                        Không tìm thấy dịch vụ lẻ nào phù hợp
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Addons list (tags style) */}
                {selectedAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="inline-flex items-center gap-1 bg-brand-green-light border border-brand-green/30 px-2 py-1 rounded-lg text-[10px] font-sans font-semibold text-matte-black transition"
                      >
                        <span className="font-sans font-bold opacity-75">[{addon.code}]</span>
                        <span>{addon.name}</span>
                        <span className="text-forest-green font-extrabold">({formatVnd(addon.price)})</span>
                        <button
                          type="button"
                          onClick={() => toggleAddon(addon)}
                          className="ml-1 text-gray-500 hover:text-red-600 transition"
                        >
                          <X className="h-3 w-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thể hiện thời gian thi công dự kiến (Tự động lấy data theo module 5) */}
              <div className="bg-[#f0f9ff] border border-[#bae6fd] p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-600 animate-pulse" />
                  <div>
                    <span className="text-[11px] font-sans text-sky-800 font-extrabold block uppercase tracking-wide">
                      Thời gian thi công dự kiến (Tự động)
                    </span>
                    <span className="text-[10px] font-sans text-sky-600 leading-none">
                      (Tính tự động theo dịch vụ chính và dịch vụ bổ trợ đã chọn)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-sans text-lg font-black text-sky-700">
                    {(selectedPkg.duration || 30) + selectedAddons.reduce((sum, a) => sum + (a.duration || 0), 0)}
                  </span>
                  <span className="text-xs font-bold text-sky-700 ml-1">phút</span>
                </div>
              </div>

              {/* Ghi chú tiếp nhận xe cuối cùng */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Ghi chú nhận xe (Mô tả tình trạng, yêu cầu đặc biệt)
                </label>
                <MarkdownTextarea
                  id="reception-check-in-note"
                  placeholder="Nhập ghi chú quan trọng từ khách hàng hoặc tình trạng cần lưu ý..."
                  value={checkInNote}
                  onChange={(val) => setCheckInNote(val)}
                  rows={2}
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold font-display uppercase cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-extrabold tracking-wider text-xs font-display transition shadow-md uppercase flex items-center justify-center gap-1 cursor-pointer"
                >
                  HOÀN TẤT CHECK-IN <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH ASSIGN MODAL (Kanban & Mobile drag-drop replacement) */}
      {dispatchingWo && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setDispatchingWo(null);
                setDispatchingBoothId(null);
              }}
              className="absolute top-4 right-4 text-mid-gray hover:text-matte-black transition border-0 bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-4 mb-4">
              <Activity className="h-5 w-5 text-brand-green" />
              <h3 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase">
                ĐIỀU PHỐI VÀ PHÂN CÔNG XE
              </h3>
            </div>

            <div className="space-y-4">
              {/* Thông tin xe */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-sans font-black text-forest-green bg-brand-green-light px-2 py-0.5 rounded uppercase">{dispatchingWo.packageCode}</span>
                    <h4 className="font-sans text-lg font-black text-matte-black mt-1">{dispatchingWo.licensePlate}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-mid-gray font-bold uppercase">{dispatchingWo.vehicleSegment}</span>
                    <p className="text-xs text-stone-600 font-medium mt-1">{dispatchingWo.customerName || "Khách vãng lai"}</p>
                  </div>
                </div>
              </div>

              {/* 1. Chọn Booth (nếu chưa gán booth) */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans text-mid-gray uppercase font-black block">
                  1. Chọn Buồng Thi Công (Booth)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {booths.map((b) => {
                    const friendlyName = getFriendlyBoothName(b);
                    const boothWorkOrders = orders.filter(o => o.boothId === b.id && o.status !== 'done');
                    const isBusy = boothWorkOrders.length > 0;
                    const isSelected = dispatchingBoothId === b.id;

                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setDispatchingBoothId(b.id)}
                        className={`p-3 border rounded-xl text-left transition-all relative cursor-pointer text-xs font-bold font-sans ${
                          isSelected
                            ? "bg-brand-green-light border-2 border-brand-green text-matte-black"
                            : "bg-white border-[#e5e5e5] hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${isBusy ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <span className="text-[11px] font-extrabold font-display uppercase truncate">{friendlyName}</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium block mt-1">
                          {isBusy ? `Đang rửa: ${boothWorkOrders[0].licensePlate}` : "Đang rỗi"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Chọn KTV & Gán việc */}
              {dispatchingBoothId && (
                <div className="space-y-2">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-black block">
                    2. Chọn Kỹ Thuật Viên Chuyên Trách (Đồng thời gửi Telegram Bot)
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {staff.filter(s => s.role === 'technician').map((tech) => {
                      const activeJobs = orders.filter(o => o.technicianId === tech.id && o.status !== 'done').length;
                      
                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => {
                            const bName = getFriendlyBoothName({ id: dispatchingBoothId, name: booths.find(b => b.id === dispatchingBoothId)?.name || "" });
                            simActions.assignWorkOrder(dispatchingWo.id, tech.id, dispatchingBoothId);
                            
                            // Trigger Telegram simulation widget
                            setTelegramNotification({
                              woId: dispatchingWo.id,
                              techId: tech.id,
                              techName: tech.name,
                              boothId: dispatchingBoothId,
                              boothName: bName,
                              plate: dispatchingWo.licensePlate,
                              pkg: dispatchingWo.packageCode
                            });

                            // Close modal
                            setDispatchingWo(null);
                            setDispatchingBoothId(null);
                          }}
                          className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between text-left transition cursor-pointer border-0 w-full"
                        >
                          <div>
                            <span className="text-xs font-bold text-matte-black block">{tech.name}</span>
                            <span className="text-[9px] text-stone-500 font-medium">KTV ID: {tech.id}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                              activeJobs === 0 ? "bg-emerald-100 text-emerald-800" :
                              activeJobs === 1 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800 animate-pulse"
                            }`}>
                              {activeJobs === 0 ? "Nhàn rỗi" : `Đang làm ${activeJobs} xe`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM SIMULATOR WIDGET */}
      {telegramNotification && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-sky-500/50 overflow-hidden font-sans">
          {/* Telegram header style */}
          <div className="bg-sky-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-full">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-white">Telegram KTV Bot</h4>
                <span className="text-[9px] text-sky-100 block">Kênh mô phỏng KTV trực tuyến</span>
              </div>
            </div>
            <button
              onClick={() => setTelegramNotification(null)}
              className="text-sky-100 hover:text-white transition cursor-pointer border-0 bg-transparent animate-pulse-slow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message Content */}
          <div className="p-4 space-y-3 bg-slate-950">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5">
              <span className="text-[10px] text-sky-400 font-extrabold uppercase block">📥 LỆNH ĐIỀU PHỐI MỚI GỬI KTV</span>
              <p className="text-xs leading-relaxed text-gray-300 font-sans">
                Kỹ thuật viên <strong>{telegramNotification.techName}</strong> được chỉ định nhận việc:
              </p>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] font-sans">
                  <span className="text-gray-500">Biển số:</span>
                  <strong className="font-sans text-white tracking-wider">{telegramNotification.plate}</strong>
                </div>
                <div className="flex justify-between text-[11px] font-sans">
                  <span className="text-gray-500">Vị trí:</span>
                  <strong className="text-white">{telegramNotification.boothName}</strong>
                </div>
                <div className="flex justify-between text-[11px] font-sans">
                  <span className="text-gray-500">Gói chính:</span>
                  <strong className="text-brand-green">{telegramNotification.pkg}</strong>
                </div>
              </div>
            </div>

            {/* Buttons to simulate KTV reply */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  simActions.updateWorkOrderStatus(telegramNotification.woId, 'in_progress', telegramNotification.techId, 'telegram', 'KTV đồng ý nhận việc qua Telegram Bot');
                  alert(`KTV ${telegramNotification.techName} đã ĐỒNG Ý và xe bắt đầu thi công!`);
                  setTelegramNotification(null);
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer border-0 shadow-sm"
              >
                👍 ĐỒNG Ý
              </button>
              <button
                onClick={() => {
                  simActions.rejectWorkOrder(telegramNotification.woId);
                  alert(`KTV ${telegramNotification.techName} báo BẬN. Xe quay lại Hàng Chờ!`);
                  setTelegramNotification(null);
                }}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer border-0 shadow-sm"
              >
                👎 BÁO BẬN
              </button>
            </div>
            <p className="text-[8px] text-center text-slate-500 font-sans italic leading-tight">
              *Mô phỏng: Click 1 trong 2 nút trên để xem sự thay đổi trạng thái tự động đồng bộ Kanban và Dashboard trong &lt;= 3 giây.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
