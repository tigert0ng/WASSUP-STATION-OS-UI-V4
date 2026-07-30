import React, { useReducer, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Car,
  ChevronRight,
  CheckCircle,
  Clock,
  DollarSign,
  Wrench,
  Tag,
  Check,
  ArrowRight,
  Sparkles,
  Star,
  QrCode,
  Phone,
  User,
  History,
  X,
  CreditCard,
  ShoppingBag,
  Percent,
  Compass,
  ArrowLeft,
  ChevronLeft
} from "lucide-react";
import { simActions } from "../../lib/supabase/client";
import KioskWelcome from "./KioskWelcome";

// Custom Kiosk packages
const KIOSK_PACKAGES = [
  { id: 'w0', code: 'W0', name: 'W0 - Express', description: 'Rửa tự động ngoài (exterior only)', basePrice: 59000 },
  { id: 'w1', code: 'W1', name: 'W1 - Basic Clean', description: 'Xịt gầm, rửa nhanh, hút bụi, lau nội thất', basePrice: 149000 },
  { id: 'w2', code: 'W2', name: 'W2 - Full Clean', description: 'Gói W1 + Giặt thảm, wax bóng, vệ sinh mâm kẽ', basePrice: 299000, isBestSeller: true },
  { id: 'w3', code: 'W3', name: 'W3 - Super Shine', description: 'Gói W2 + dưỡng taplo, dưỡng nhựa, dưỡng da ghế', basePrice: 649000 },
  { id: 'w4', code: 'W4', name: 'W4 - Detail Care', description: 'Rửa chi tiết, tẩy nhựa đường/bụi sơn, phục hồi ngoại thất', basePrice: 1699000 },
  { id: 'w5', code: 'W5', name: 'W5 - WASSUP PRIME', description: 'Gói W4 + diệt khuẩn cabin ion, phủ bóng Ceramic', basePrice: 3399000 }
];

// Custom Kiosk addons
const KIOSK_ADDONS = [
  { id: 'add01', category: 'NỘI THẤT', name: 'Hút bụi sâu + vệ sinh khe kẽ', price: 99000 },
  { id: 'add02', category: 'NỘI THẤT', name: 'Khử mùi diệt khuẩn cabin', price: 499000 },
  { id: 'add03', category: 'NỘI THẤT', name: 'Dưỡng da ghế da cao cấp', price: 249000 },
  { id: 'add04', category: 'NGOẠI THẤT', name: 'Tẩy ố kính chiếu hậu + kính lái', price: 499000 },
  { id: 'add05', category: 'NGOẠI THẤT', name: 'Tẩy nhựa đường hông xe', price: 399000 },
  { id: 'add06', category: 'NGOẠI THẤT', name: 'Wax sealant bảo vệ sơn bóng', price: 299000 },
  { id: 'add07', category: 'BẢO DƯỠNG', name: 'Thay nhớt máy + vệ sinh lọc', price: 249000 },
  { id: 'add08', category: 'BẢO DƯỠNG', name: 'Phủ Ceramic bảo vệ lớp sơn', price: 599000 },
  { id: 'add09', category: 'ĐIỆN TỬ', name: 'Vệ sinh camera hành trình + màn hình', price: 199000 },
  { id: 'add10', category: 'KHÁCH HÀNG', name: 'Thay lọc gió cabin + làm sạch hệ thống', price: 149000 }
];

type KioskStep = 'welcome' | 'xe' | 'goi' | 'dich-vu-them' | 'voucher' | 'thanh-toan' | 'completed';

interface KioskState {
  step: KioskStep;
  phone: string;
  name: string;
  plate: string;
  segment: 'sedan' | 'suv';
  selectedPackageId: string;
  selectedAddonIds: string[];
  promoCode: string;
  appliedDiscount: number;
  appliedPromoName: string;
  paymentMethod: string;
  createdOrderId: string | null;
}

type KioskAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; payload: KioskStep }
  | { type: 'SET_CUSTOMER'; payload: { phone: string; name: string } }
  | { type: 'SET_VEHICLE'; payload: { plate: string; segment: 'sedan' | 'suv' } }
  | { type: 'SET_PACKAGE'; payload: string }
  | { type: 'TOGGLE_ADDON'; payload: string }
  | { type: 'APPLY_PROMO'; payload: { code: string; discount: number; name: string } }
  | { type: 'CLEAR_PROMO' }
  | { type: 'SET_PAYMENT'; payload: string }
  | { type: 'COMPLETE_ORDER'; payload: string }
  | { type: 'RESET' };

const initialState: KioskState = {
  step: 'welcome',
  phone: '',
  name: '',
  plate: '',
  segment: 'sedan',
  selectedPackageId: 'w2',
  selectedAddonIds: [],
  promoCode: '',
  appliedDiscount: 0,
  appliedPromoName: '',
  paymentMethod: 'pay_later',
  createdOrderId: null,
};

function kioskReducer(state: KioskState, action: KioskAction): KioskState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'NEXT_STEP': {
      const steps: KioskStep[] = ['welcome', 'xe', 'goi', 'dich-vu-them', 'voucher', 'thanh-toan', 'completed'];
      const currentIndex = steps.indexOf(state.step);
      const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : state.step;
      return { ...state, step: nextStep };
    }
    case 'PREV_STEP': {
      const steps: KioskStep[] = ['welcome', 'xe', 'goi', 'dich-vu-them', 'voucher', 'thanh-toan', 'completed'];
      const currentIndex = steps.indexOf(state.step);
      const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : state.step;
      return { ...state, step: prevStep };
    }
    case 'SET_CUSTOMER':
      return { ...state, phone: action.payload.phone, name: action.payload.name };
    case 'SET_VEHICLE':
      return { ...state, plate: action.payload.plate, segment: action.payload.segment };
    case 'SET_PACKAGE':
      return { ...state, selectedPackageId: action.payload };
    case 'TOGGLE_ADDON': {
      const addonId = action.payload;
      const selectedAddonIds = state.selectedAddonIds.includes(addonId)
        ? state.selectedAddonIds.filter(id => id !== addonId)
        : [...state.selectedAddonIds, addonId];
      return { ...state, selectedAddonIds };
    }
    case 'APPLY_PROMO':
      return {
        ...state,
        promoCode: action.payload.code,
        appliedDiscount: action.payload.discount,
        appliedPromoName: action.payload.name
      };
    case 'CLEAR_PROMO':
      return {
        ...state,
        promoCode: '',
        appliedDiscount: 0,
        appliedPromoName: ''
      };
    case 'SET_PAYMENT':
      return { ...state, paymentMethod: action.payload };
    case 'COMPLETE_ORDER':
      return { ...state, createdOrderId: action.payload, step: 'completed' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default function KioskStepsManager() {
  const [state, dispatch] = useReducer(kioskReducer, initialState);
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [promoError, setPromoError] = useState("");
  const [promoInput, setPromoInput] = useState("");

  // Load BOMs to flag/block packages lacking a defined BOM according to PRD v2.3
  const [serviceBoms, setServiceBoms] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem("wassup_service_boms");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial seeded BOM lines fallback
    return {
      w0: [{ itemId: "inv-02", itemName: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP", amount: 0.05, unit: "Can 20L" }],
      w1: [
        { itemId: "inv-02", itemName: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP", amount: 0.1, unit: "Can 20L" },
        { itemId: "inv-05", itemName: "Khăn lau Microfiber siêu mịn 30x30", amount: 1, unit: "Cái" }
      ],
      w2: [
        { itemId: "inv-02", itemName: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP", amount: 0.15, unit: "Can 20L" },
        { itemId: "inv-03", itemName: "Đất sét tẩy ố bụi sơn 3M Claybar", amount: 0.5, unit: "Cục 200g" }
      ],
      w3: [
        { itemId: "inv-02", itemName: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP", amount: 0.2, unit: "Can 20L" },
        { itemId: "inv-03", itemName: "Đất sét tẩy ố bụi sơn 3M Claybar", amount: 1, unit: "Cục 200g" },
        { itemId: "inv-01", itemName: "Dầu bóng lốp xe Sonax Xtreme", amount: 0.2, unit: "Chai 500ml" }
      ],
      w4: [
        { itemId: "inv-02", itemName: "Hóa chất bọt tuyết siêu đậm đặc WASSUP SOAP", amount: 0.25, unit: "Can 20L" },
        { itemId: "inv-01", itemName: "Dầu bóng lốp xe Sonax Xtreme", amount: 0.5, unit: "Chai 500ml" },
        { itemId: "inv-03", itemName: "Đất sét tẩy ố bụi sơn 3M Claybar", amount: 1, unit: "Cục 200g" }
      ]
    };
  });

  // Live progress simulation for completed step
  const [countdown, setCountdown] = useState(1500); // 25 minutes
  const [progress, setProgress] = useState(0);
  const [trackingStatus, setTrackingStatus] = useState("Đang chờ vào Booth");
  const [rating, setRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");

  const selectedPackage = KIOSK_PACKAGES.find(p => p.id === state.selectedPackageId) || KIOSK_PACKAGES[2];
  const isLarge = state.segment === 'suv';
  const packagePrice = Math.round((selectedPackage.basePrice * (isLarge ? 1.3 : 1)) / 1000) * 1000;
  const addonsTotal = KIOSK_ADDONS
    .filter(a => state.selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  
  const subtotal = packagePrice + addonsTotal;
  const finalTotal = Math.max(subtotal - state.appliedDiscount, 0);

  // Poll progress if order is completed
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.step === 'completed') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setProgress(100);
            setTrackingStatus("Rửa xong! Mời nhận xe & Đánh giá.");
            return 0;
          }
          const nextVal = prev - 1;
          const nextProgress = Math.round(((1500 - nextVal) / 1500) * 100);
          setProgress(nextProgress);
          
          if (nextProgress < 25) {
            setTrackingStatus("Đang chờ vào Booth");
          } else if (nextProgress < 50) {
            setTrackingStatus("Đang xịt xả gầm & bọt rửa");
          } else if (nextProgress < 75) {
            setTrackingStatus("Đang quét dọn vệ sinh khoang máy");
          } else if (nextProgress < 95) {
            setTrackingStatus("Đang kiểm định chất lượng (QC)");
          } else {
            setTrackingStatus("Rửa xong! Mời nhận xe & Đánh giá.");
          }
          
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.step]);

  const getStepIndex = (s: KioskStep) => {
    const steps: KioskStep[] = ['welcome', 'xe', 'goi', 'dich-vu-them', 'voucher', 'thanh-toan', 'completed'];
    return steps.indexOf(s);
  };

  const getStepTitle = (s: KioskStep) => {
    switch (s) {
      case 'welcome': return "XIN CHÀO";
      case 'xe': return "BIỂN SỐ XE";
      case 'goi': return "GÓI DỊCH VỤ";
      case 'dich-vu-them': return "DỊCH VỤ THÊM";
      case 'voucher': return "VOUCHER ƯU ĐÃI";
      case 'thanh-toan': return "XÁC NHẬN THANH TOÁN";
      case 'completed': return "HOÀN TẤT & THEO DÕI";
      default: return "";
    }
  };

  const handleApplyPromo = () => {
    setPromoError("");
    if (!promoInput.trim()) return;
    const code = promoInput.toUpperCase().trim();
    
    if (code === "WASSUP100") {
      dispatch({
        type: 'APPLY_PROMO',
        payload: { code, discount: 100000, name: "WASSUP100 (-100k)" }
      });
      alert("Áp dụng thành công mã WASSUP100! Giảm ngay 100.000đ!");
    } else if (code === "VIP30") {
      const discountVal = Math.round((subtotal * 0.3) / 1000) * 1000;
      dispatch({
        type: 'APPLY_PROMO',
        payload: { code, discount: discountVal, name: "VIP30 (-30%)" }
      });
      alert(`Áp dụng thành công mã VIP30! Giảm ngay 30% (${discountVal.toLocaleString("vi-VN")}đ)!`);
    } else {
      const checkBack = simActions.validateVoucher(code);
      if (checkBack.valid && checkBack.voucher) {
        const v = checkBack.voucher;
        let discountVal = 0;
        if (v.type === 'percent') {
          const disc = Math.round(((subtotal * v.value) / 100) / 1000) * 1000;
          discountVal = v.maxDiscount ? Math.min(disc, v.maxDiscount) : disc;
        } else {
          discountVal = v.value;
        }
        dispatch({
          type: 'APPLY_PROMO',
          payload: { code, discount: discountVal, name: `${v.code} (-${v.value}${v.type === 'percent' ? '%' : 'đ'})` }
        });
        alert(`Áp dụng thành công voucher ${v.code}!`);
      } else {
        setPromoError(checkBack.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn!");
      }
    }
  };

  const handleConfirmOrder = () => {
    const result = simActions.createOrder({
      customerPhone: state.phone || undefined,
      customerName: state.name || undefined,
      licensePlate: state.plate || "51G-425.96",
      vehicleSegment: state.segment,
      packageCode: selectedPackage.code,
      subtotal: subtotal,
      discount: state.appliedDiscount,
      total: finalTotal,
    });

    if (result && result.orderId) {
      dispatch({ type: 'COMPLETE_ORDER', payload: result.orderId });
      setCountdown(1500);
      setProgress(0);
      setTrackingStatus("Đang chờ vào Booth 02");
    }
  };

  return (
    <div id="kiosk-steps-manager" className="w-full max-w-full bg-white border border-[#e5e5e5] rounded-3xl overflow-hidden relative min-h-[85vh] flex flex-col justify-between text-slate-800 shadow-xl">
      {/* Upper header */}
      <div id="kiosk-header" className="bg-[#f8fafc] border-b border-slate-200 px-6 py-4.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-[#A2C62C] shadow animate-pulse" />
          <span className="font-display text-xs font-black tracking-widest text-slate-900 uppercase">
            WASSUP KIOSK • HỆ THỐNG TỰ PHỤC VỤ THÔNG MINH
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang("vi")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              lang === "vi" ? "bg-slate-900 text-white" : "bg-stone-100 text-slate-500"
            }`}
          >
            VIỆT NAM
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              lang === "en" ? "bg-slate-900 text-white" : "bg-stone-100 text-slate-500"
            }`}
          >
            ENGLISH
          </button>
        </div>
      </div>

      {/* Progress Stepper bar */}
      {state.step !== 'welcome' && (
        <div id="kiosk-stepper" className="bg-white px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-black mb-3">
            <span className="text-slate-400 uppercase tracking-widest text-[9px]">TIẾN TRÌNH ĐẶT XE TRỰC TUYẾN</span>
            <span className="text-slate-900 uppercase tracking-wider text-xs font-display font-black bg-lime-100/60 px-2.5 py-1 rounded-md">
              {getStepTitle(state.step)}
            </span>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 h-1 bg-stone-100 rounded-full z-0" />
            <div
              className="absolute left-0 h-1 bg-[#A2C62C] rounded-full z-0 transition-all duration-500"
              style={{
                width: `${(getStepIndex(state.step) / 6) * 100}%`
              }}
            />

            {['WELCOME', 'XE', 'GÓI', 'THÊM', 'VOUCHER', 'PAY', 'DONE'].map((label, idx) => {
              const isCompletedOrActive = getStepIndex(state.step) >= idx;
              const isActive = getStepIndex(state.step) === idx;
              return (
                <div key={label} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#A2C62C] border-slate-950 scale-125"
                        : isCompletedOrActive
                          ? "bg-[#A2C62C] border-[#A2C62C]"
                          : "bg-white border-slate-200"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-sans font-black mt-2 tracking-wider uppercase transition-all duration-300 ${
                      isActive
                        ? "text-slate-950 scale-105"
                        : isCompletedOrActive
                          ? "text-slate-800"
                          : "text-slate-300"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content body */}
      <div id="kiosk-content" className="flex-1 p-6 bg-slate-50/40 overflow-y-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME */}
          {state.step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <KioskWelcome
                lang={lang}
                onLanguageChange={(newLang) => setLang(newLang)}
                onStartOrder={(phoneVal, customerVal) => {
                  if (phoneVal) {
                    dispatch({
                      type: 'SET_CUSTOMER',
                      payload: {
                        phone: phoneVal,
                        name: customerVal ? customerVal.name : 'Khách vãng lai'
                      }
                    });
                    if (customerVal && customerVal.licensePlate) {
                      dispatch({
                        type: 'SET_VEHICLE',
                        payload: {
                          plate: customerVal.licensePlate,
                          segment: (customerVal.licensePlate.startsWith("30A") || customerVal.licensePlate.startsWith("51G")) ? "sedan" : "suv"
                        }
                      });
                    }
                  }
                  dispatch({ type: 'NEXT_STEP' });
                }}
              />
            </motion.div>
          )}

          {/* STEP 2: XE - LICENSE PLATE & SEGMENT */}
          {state.step === 'xe' && (
            <motion.div
              key="xe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-4xl mx-auto w-full"
            >
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
                  <Car className="h-6 w-6 text-lime-600" />
                  BƯỚC 1: BIỂN SỐ XE & CỠ XE
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Xác định cỡ xe chính xác giúp vòi phun tự động rửa sạch toàn bộ gầm và hông xe không bỏ sót khe kẽ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Segment select */}
                <div id="segment-selection" className="space-y-4">
                  <span className="block text-[10px] font-black text-slate-450 tracking-wider uppercase">
                    VUI LÒNG CHỌN PHÂN KHÚC XE
                  </span>
                  
                  <div className="space-y-3">
                    <button
                      id="segment-sedan-btn"
                      type="button"
                      onClick={() => dispatch({ type: 'SET_VEHICLE', payload: { plate: state.plate, segment: 'sedan' } })}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        state.segment === 'sedan'
                          ? "bg-lime-50/40 border-[#A2C62C] shadow text-slate-950"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-display font-black text-xs text-lime-700 bg-lime-100 px-2 py-0.5 rounded block w-fit mb-1">STANDARD</span>
                          <h3 className="font-display font-black text-sm text-slate-900">4 - 5 CHỖ</h3>
                          <p className="text-[11px] text-slate-500 mt-1">Sedan, Hatchback, CUV cỡ nhỏ (Ví dụ: Mazda 3, Vios, Kona, Accent...)</p>
                        </div>
                        {state.segment === 'sedan' && (
                          <div className="h-5 w-5 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shadow-sm">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      id="segment-suv-btn"
                      type="button"
                      onClick={() => dispatch({ type: 'SET_VEHICLE', payload: { plate: state.plate, segment: 'suv' } })}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        state.segment === 'suv'
                          ? "bg-lime-50/40 border-[#A2C62C] shadow text-slate-950"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-display font-black text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded block w-fit mb-1">LARGE / MPV (+30%)</span>
                          <h3 className="font-display font-black text-sm text-slate-900">7 - 9 CHỖ / BÁN TẢI</h3>
                          <p className="text-[11px] text-slate-500 mt-1">SUV lớn, MPV, Bán tải, Pickup (Ví dụ: Fortuner, Sedona, Ford Ranger...)</p>
                        </div>
                        {state.segment === 'suv' && (
                          <div className="h-5 w-5 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shadow-sm">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* License Plate Keyboard input */}
                <div id="license-plate-section" className="space-y-4">
                  <span className="block text-[10px] font-black text-slate-450 tracking-wider uppercase">
                    BIỂN SỐ KIỂM SOÁT XE (BẮT BUỘC)
                  </span>

                  <div className="bg-white p-6 rounded-2xl border-2 border-stone-200/80 shadow-sm focus-within:border-[#A2C62C] transition-all space-y-4">
                    <input
                      id="plate-input-field"
                      type="text"
                      value={state.plate}
                      onChange={(e) => dispatch({ type: 'SET_VEHICLE', payload: { plate: e.target.value.toUpperCase(), segment: state.segment } })}
                      placeholder="30A-123.45"
                      className="w-full text-center py-4 bg-stone-50 text-slate-900 font-display font-black text-3xl tracking-widest rounded-xl border border-stone-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#A2C62C]/20 transition-all uppercase"
                    />

                    {/* Quick Demo Plates Selection */}
                    <div className="space-y-2">
                      <span className="block text-[10px] text-slate-400 font-bold">
                        Bấm chọn nhanh biển số mô phỏng:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { p: '30A-999.99', seg: 'sedan' as const },
                          { p: '51G-425.96', seg: 'sedan' as const },
                          { p: '29H-124.68', seg: 'suv' as const },
                        ].map((item) => (
                          <button
                            key={item.p}
                            type="button"
                            onClick={() => dispatch({ type: 'SET_VEHICLE', payload: { plate: item.p, segment: item.seg } })}
                            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-xs font-sans font-black text-slate-700 transition cursor-pointer"
                          >
                            {item.p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Action Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'welcome' })}
                  className="px-6 py-3 border border-stone-200 text-slate-500 hover:bg-stone-50 transition rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" /> QUAY LẠI
                </button>
                <button
                  type="button"
                  disabled={!state.plate.trim()}
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border-0 cursor-pointer ${
                    state.plate.trim()
                      ? "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-md shadow-lime-200/40"
                      : "bg-stone-150 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  TIẾP TỤC CHỌN GÓI <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: GOI - CHỌN GÓI DỊCH VỤ CHÍNH */}
          {state.step === 'goi' && (
            <motion.div
              key="goi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-5xl mx-auto w-full"
            >
              <div className="border-b border-stone-200 pb-3 flex justify-between items-end flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
                    BƯỚC 2: CHỌN GÓI RỬA XE CHUYÊN SÂU
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Giá gói đã tự động quy chuẩn cho xe cỡ <strong>{state.segment === 'sedan' ? "4-5 Chỗ" : "7-9 Chỗ (+30%)"}</strong>
                  </p>
                </div>
                <div className="px-3.5 py-1.5 bg-slate-900 text-[#A2C62C] font-sans font-black text-xs rounded uppercase tracking-wider">
                  BIỂN SỐ: {state.plate}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {KIOSK_PACKAGES.map((pkg) => {
                  const actualPriceVal = Math.round((pkg.basePrice * (isLarge ? 1.3 : 1)) / 1000) * 1000;
                  const isSelected = state.selectedPackageId === pkg.id;
                  const hasBomLine = serviceBoms[pkg.id] && serviceBoms[pkg.id].length > 0;

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        if (!hasBomLine) {
                          alert(`⚠️ Gói ${pkg.name} tạm ngưng hỗ trợ đặt trước tại Kiosk vì chưa cấu hình định mức nguyên liệu hao phí (BOM). Vui lòng chọn gói dịch vụ khác!`);
                        } else {
                          dispatch({ type: 'SET_PACKAGE', payload: pkg.id });
                        }
                      }}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between min-h-[190px] cursor-pointer ${
                        !hasBomLine
                          ? "bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed"
                          : isSelected
                            ? "bg-lime-50/20 border-[#A2C62C] shadow-md shadow-lime-200/10 text-slate-900"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      {!hasBomLine ? (
                        <span className="absolute top-3 right-3 bg-red-100 text-red-700 font-display font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          ⚠️ CHƯA CÓ BOM (KHÓA KIOSK)
                        </span>
                      ) : pkg.isBestSeller ? (
                        <span className="absolute -top-2.5 right-3 bg-emerald-500 text-white font-display font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          KHUYÊN DÙNG ⭐
                        </span>
                      ) : null}

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-sans font-bold text-[9px] text-slate-600">
                            {pkg.code}
                          </span>
                          {isSelected && hasBomLine && (
                            <div className="h-5 w-5 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shadow-sm">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-display font-black text-slate-900 text-sm">
                          {pkg.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 w-full flex items-baseline justify-between mt-4">
                        <span className="text-[10px] text-slate-445 font-sans uppercase font-bold">Giá gói</span>
                        <span className="font-sans font-bold text-slate-950 text-lg">
                          {actualPriceVal.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step Navigation Action Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  className="px-6 py-3 border border-stone-200 text-slate-500 hover:bg-slate-50 transition rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" /> QUAY LẠI
                </button>
                <div className="flex items-center gap-5">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-450 uppercase tracking-widest font-bold">Gói đã chọn</span>
                    <span className="text-lg font-sans font-bold text-slate-900 block leading-none mt-1">
                      {packagePrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const hasBomLine = serviceBoms[state.selectedPackageId] && serviceBoms[state.selectedPackageId].length > 0;
                      if (!hasBomLine) {
                        alert("⚠️ Gói dịch vụ hiện tại chưa có cấu hình định mức kho (BOM). Vui lòng chọn gói dịch vụ hợp lệ khác trước khi tiếp tục!");
                      } else {
                        dispatch({ type: 'NEXT_STEP' });
                      }
                    }}
                    className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-md shadow-lime-200/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border-0 cursor-pointer"
                  >
                    TIẾP TỤC CHỌN ADD-ONS <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: DICH-VU-THEM - DỊCH VỤ PHỤ TRỢ */}
          {state.step === 'dich-vu-them' && (
            <motion.div
              key="dich-vu-them"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-5xl mx-auto w-full"
            >
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
                  BƯỚC 3: DỊCH VỤ PHỤ TRỢ NÂNG CAO (ADD-ONS)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Chăm dưỡng chuyên nghiệp, khử khuẩn sâu, tẩy ổ kính hông hoặc thay dầu động cơ tại chỗ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {KIOSK_ADDONS.map((addon) => {
                  const isSelected = state.selectedAddonIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => dispatch({ type: 'TOGGLE_ADDON', payload: addon.id })}
                      className={`p-4.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-lime-50/20 border-[#A2C62C] shadow-sm text-slate-900"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-1.5 pr-4">
                        <span className={`text-[8px] font-display font-black tracking-wider px-2 py-0.5 rounded uppercase ${
                          addon.category === 'NỘI THẤT'
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : addon.category === 'NGOẠI THẤT'
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {addon.category}
                        </span>
                        <h3 className="font-sans font-bold text-slate-800 text-xs leading-tight">
                          {addon.name}
                        </h3>
                        <span className="font-sans font-bold text-slate-950 text-sm block">
                          {addon.price.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#A2C62C] border-slate-950 text-slate-950 shadow-inner"
                          : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step Navigation Action Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  className="px-6 py-3 border border-stone-200 text-slate-500 hover:bg-slate-50 transition rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" /> QUAY LẠI
                </button>
                <div className="flex items-center gap-5">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-450 uppercase tracking-widest font-bold">Tổng tạm tính</span>
                    <span className="text-lg font-sans font-bold text-slate-900 block leading-none mt-1">
                      {subtotal.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'NEXT_STEP' })}
                    className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-md shadow-lime-200/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border-0 cursor-pointer"
                  >
                    ĐẾN NHẬP VOUCHER <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: VOUCHER - NHẬP VÀ ÁP DỤNG KHUYẾN MÃI */}
          {state.step === 'voucher' && (
            <motion.div
              key="voucher"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-3xl mx-auto w-full"
            >
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
                  <Tag className="h-6 w-6 text-lime-600" />
                  BƯỚC 4: NHẬP VOUCHER GIẢM GIÁ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sử dụng các mã giảm giá đặc quyền để được chiết khấu trực tiếp vào hoá đơn trước khi thanh toán.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left block: Form entry */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-white p-6 border border-stone-200 rounded-2xl shadow-sm space-y-4">
                    <label className="block text-[10px] font-black text-slate-450 tracking-wider uppercase">
                      NHẬP MÃ ƯU ĐÃI (MẪU: VIP30 HOẶC WASSUP100)
                    </label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="MÃ GIẢM GIÁ"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-3 text-sm font-sans font-black uppercase rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#A2C62C]/20 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-5 py-3 bg-slate-950 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition cursor-pointer border-0 uppercase tracking-wider"
                      >
                        ÁP DỤNG
                      </button>
                    </div>

                    {promoError && (
                      <p className="text-xs text-red-500 font-bold font-sans">
                        ❌ {promoError}
                      </p>
                    )}

                    {state.appliedDiscount > 0 && (
                      <div className="flex justify-between items-center bg-amber-50 text-amber-800 text-xs font-bold p-3 rounded-xl border border-amber-200 animate-fadeIn">
                        <span>🏷️ Mã áp dụng: {state.appliedPromoName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-amber-900">-{state.appliedDiscount.toLocaleString("vi-VN")}đ</span>
                          <button
                            type="button"
                            onClick={() => {
                              dispatch({ type: 'CLEAR_PROMO' });
                              setPromoInput("");
                            }}
                            className="text-stone-400 hover:text-red-500 transition-colors bg-transparent border-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hot tips */}
                  <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">GỢI Ý MÃ HOT HÔM NAY 🔥</span>
                    <ul className="text-[11px] text-slate-500 space-y-1 font-sans">
                      <li>• <strong className="text-slate-800 font-sans">VIP30</strong>: Giảm ngay 30% toàn bộ dịch vụ rửa chính & phụ trợ.</li>
                      <li>• <strong className="text-slate-800 font-sans">WASSUP100</strong>: Giảm trừ trực tiếp 100.000đ khi trải nghiệm lần đầu.</li>
                    </ul>
                  </div>
                </div>

                {/* Right block: Subtotal sum preview */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                    <span className="text-[10px] font-black text-slate-450 tracking-wider uppercase block">CHI TIẾT GIÁ TRỊ</span>
                    
                    <div className="text-xs space-y-2 font-sans">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Gói chính ({selectedPackage.code}):</span>
                        <span className="font-sans font-bold text-slate-700">{packagePrice.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Dịch vụ thêm ({state.selectedAddonIds.length} món):</span>
                        <span className="font-sans font-bold text-slate-700">+{addonsTotal.toLocaleString("vi-VN")}đ</span>
                      </div>
                      {state.appliedDiscount > 0 && (
                        <div className="flex justify-between text-red-600 font-bold">
                          <span>Chiết khấu mã giảm:</span>
                          <span className="font-sans font-bold">-{state.appliedDiscount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      )}
                      
                      <div className="border-t border-stone-200 pt-2.5 flex justify-between items-baseline text-slate-900 font-black">
                        <span>THÀNH TIỀN:</span>
                        <span className="text-xl font-sans font-bold text-forest-green" style={{ color: "#559119" }}>
                          {finalTotal.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation Action Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  className="px-6 py-3 border border-stone-200 text-slate-500 hover:bg-slate-50 transition rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" /> QUAY LẠI
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-md shadow-lime-200/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border-0 cursor-pointer"
                >
                  ĐẾN THANH TOÁN <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: THANH-TOAN - PHƯƠNG THỨC THANH TOÁN & HOÀN TẤT */}
          {state.step === 'thanh-toan' && (
            <motion.div
              key="thanh-toan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-5xl mx-auto w-full"
            >
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-lime-600" />
                  BƯỚC 5: XÁC NHẬN THANH TOÁN HOÁ ĐƠN
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn phương thức phù hợp và bấm Xác nhận để tự động đăng ký buồng rửa kỹ thuật số thông minh.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left box: Receipt breakdown */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white p-6 border border-stone-200 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-display font-black text-slate-450 uppercase tracking-wider border-b border-stone-100 pb-2">
                      BIÊN LAI ĐẶT RỬA XE • BIỂN SỐ: {state.plate}
                    </h3>

                    <div className="space-y-3.5 pb-4 border-b border-stone-150">
                      {/* Package cost */}
                      <div className="flex justify-between items-center text-xs text-slate-800 font-medium">
                        <div>
                          <span className="font-bold">{selectedPackage.name}</span>
                          <span className="text-[10px] text-slate-400 font-sans ml-1">
                            ({state.segment === 'sedan' ? "4-5 Chỗ" : "7-9 Chỗ"})
                          </span>
                        </div>
                        <span className="font-sans font-bold text-slate-900 text-sm">{packagePrice.toLocaleString("vi-VN")}đ</span>
                      </div>

                      {/* Addon cost */}
                      {KIOSK_ADDONS.filter(a => state.selectedAddonIds.includes(a.id)).map((addon) => (
                        <div key={addon.id} className="flex justify-between items-center text-xs text-slate-650 pl-3 border-l-2 border-[#A2C62C]">
                          <span className="text-slate-500 font-sans">Addon: {addon.name}</span>
                          <span className="font-sans font-bold text-slate-900 text-sm">+{addon.price.toLocaleString("vi-VN")}đ</span>
                        </div>
                      ))}

                      {/* Voucher applied info */}
                      {state.appliedDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs text-red-600 font-bold bg-red-50/50 p-2 rounded-lg border border-red-100">
                          <span>Khuyến mãi ({state.appliedPromoName}):</span>
                          <span className="font-sans font-bold">-{state.appliedDiscount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-display font-black text-slate-800 uppercase">TỔNG THANH TOÁN (VND):</span>
                      <span className="text-3xl font-sans font-bold text-[#A2C62C] drop-shadow-sm">
                        {finalTotal.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right box: Payment gateway simulator */}
                <div className="lg:col-span-5 space-y-4">
                  <span className="block text-[10px] font-black text-slate-450 tracking-wider uppercase">
                    CHỌN PHƯƠNG THỨC THANH TOÁN
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'qr_pay', label: 'VietQR Banking ⚡' },
                      { id: 'pay_later', label: 'Thanh toán sau 📄' },
                      { id: 'card', label: 'Quẹt thẻ ATM/Visa 💳' },
                      { id: 'cash', label: 'Trả tại quầy 💵' }
                    ].map((method) => {
                      const isSelected = state.paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => dispatch({ type: 'SET_PAYMENT', payload: method.id })}
                          className={`p-3.5 rounded-xl border text-center font-display font-extrabold text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-lime-50/50 border-[#A2C62C] text-slate-950 shadow-sm font-black"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-stone-50"
                          }`}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* High fidelity dynamic VietQR dynamic pricing code rendering */}
                  {state.paymentMethod === 'qr_pay' && (
                    <div className="p-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-fadeIn">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-xl relative overflow-hidden">
                        {/* Simulation QR Code styling */}
                        <div className="h-32 w-32 bg-slate-50 flex items-center justify-center relative">
                          <div className="absolute inset-2.5 border-2 border-slate-950 flex flex-wrap p-1">
                            <div className="w-1/3 h-1/3 bg-slate-950" />
                            <div className="w-1/3 h-1/3" />
                            <div className="w-1/3 h-1/3 bg-slate-950" />
                            <div className="w-1/3 h-1/3" />
                            <div className="w-1/3 h-1/3 bg-slate-950" />
                            <div className="w-1/3 h-1/3" />
                            <div className="w-1/3 h-1/3 bg-slate-950" />
                            <div className="w-1/3 h-1/3" />
                            <div className="w-1/3 h-1/3 bg-slate-950" />
                          </div>
                          <div className="absolute h-6 w-6 rounded bg-slate-950 text-[#A2C62C] font-black text-[7px] flex items-center justify-center shadow-lg">
                            WASSUP
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-450 leading-snug">
                        Quét mã VietQR chuyển khoản nhanh đúng giá trị <strong>{finalTotal.toLocaleString("vi-VN")}đ</strong>.<br />
                        STK: <strong>1012999999</strong> - Vietcombank
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white py-4 px-6 rounded-2xl text-center font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition-all cursor-pointer border-0"
                  >
                    XÁC NHẬN &amp; IN BIÊN LAI ĐẶT XE
                  </button>
                </div>
              </div>

              {/* Navigation Action Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  className="px-6 py-3 border border-stone-200 text-slate-500 hover:bg-slate-50 transition rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 bg-white"
                >
                  <ChevronLeft className="h-4 w-4" /> QUAY LẠI
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 7: COMPLETED - TIẾN TRÌNH RỬA XE HOÀN TẤT & STAR RATINGS */}
          {state.step === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center max-w-xl mx-auto w-full"
            >
              <div className="text-left border-b border-stone-200 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
                    THEO DÕI TIẾN TRÌNH THỜI GIAN THỰC
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã lệnh đặt: <strong className="font-sans text-slate-800">#{state.createdOrderId?.split('_')[1]?.slice(-5) || "W1039"}</strong>
                  </p>
                </div>
                <div className="px-3.5 py-1.5 bg-[#A2C62C] text-slate-950 font-sans font-black text-sm rounded-lg tracking-wider">
                  {state.plate}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 text-left">
                
                {/* Active Booth header */}
                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-lime-600 animate-spin-slow" />
                    <span className="font-display font-black text-sm text-slate-900">
                      TRẠM PHÁT SỐ 2 (BOOTH SMART 02)
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold uppercase">
                    Rửa Tự Động
                  </span>
                </div>

                {/* Circular timer indicator */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="relative h-44 w-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track Circle (Gray) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f1f5f9"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      {/* Active Remaining Time Circle (Green) */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#A2C62C"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray="251.2"
                        animate={{
                          strokeDashoffset: 251.2 - (251.2 * (countdown / 1500))
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-display font-black text-slate-900 leading-none">
                        {Math.floor(countdown / 60).toString().padStart(2, '0')}:
                        {(countdown % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[8px] font-display font-black text-slate-400 tracking-wider mt-1.5 uppercase">
                        THỜI GIAN DỰ KIẾN
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full text-[10px] font-black text-slate-850">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    TIẾN TRÌNH: {progress}%
                  </div>
                </div>

                {/* State timeline progress */}
                <div className="space-y-3 text-xs font-medium border-t border-stone-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450">Trạng thái kỹ thuật:</span>
                    <span className="text-slate-900 font-display font-black uppercase text-[11px] bg-lime-100 px-2 py-0.5 rounded">
                      {trackingStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450">Gói lựa chọn:</span>
                    <span className="text-slate-900 font-bold">{selectedPackage.name}</span>
                  </div>
                </div>

                {/* Fast simulated steps buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => {
                      if (progress === 0) {
                        setTrackingStatus("Đang xịt xả gầm & bọt rửa");
                        setProgress(35);
                        setCountdown(975); // 65% of 1500 remaining
                      } else if (progress === 35) {
                        setTrackingStatus("Đang quét dọn vệ sinh khoang máy");
                        setProgress(65);
                        setCountdown(525); // 35% of 1500 remaining
                      } else if (progress === 65) {
                        setTrackingStatus("Đang kiểm định chất lượng (QC)");
                        setProgress(90);
                        setCountdown(150); // 10% of 1500 remaining
                      } else {
                        setTrackingStatus("Rửa xong! Mời nhận xe & Đánh giá.");
                        setProgress(100);
                        setCountdown(0);
                      }
                    }}
                    className="py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-[10px] font-display font-black tracking-wider uppercase text-slate-500 transition cursor-pointer bg-white"
                  >
                    TUA NHANH TIẾN TRÌNH ⏩
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProgress(100);
                      setTrackingStatus("Rửa xong! Mời nhận xe & Đánh giá.");
                      setCountdown(0);
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-display font-black tracking-wider uppercase transition-all cursor-pointer border-0"
                  >
                    HOÀN THÀNH NGAY ✅
                  </button>
                </div>

                {/* Interactive Star ratings */}
                {progress === 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t border-stone-150 space-y-4 animate-fadeIn"
                  >
                    <h3 className="text-xs font-display font-black text-slate-900 uppercase text-center">
                      ĐÁNH GIÁ CHẤT LƯỢNG RỬA SƠN HÔM NAY ⭐
                    </h3>
                    
                    <div className="flex justify-center gap-2.5">
                      {[1, 2, 3, 4, 5].map((starIdx) => {
                        const isSelected = starIdx <= rating;
                        return (
                          <button
                            key={starIdx}
                            type="button"
                            onClick={() => {
                              setRating(starIdx);
                              if (starIdx === 5) {
                                setRatingMessage("Dạ WASSUP cảm ơn quý khách rất nhiều! 🥰 Chúc quý khách vạn dặm bình an!");
                              } else if (starIdx >= 3) {
                                setRatingMessage("Dạ cảm ơn phản hồi của quý khách! Wassup sẽ cố gắng làm tốt hơn nữa! 💚");
                              } else {
                                setRatingMessage("Dạ xin lỗi quý khách vì trải nghiệm chưa trọn vẹn! Chúng tôi sẽ phản hồi Quản lý xử lý ngay ạ. 😔");
                              }
                            }}
                            className="p-1 hover:scale-125 transition-transform bg-transparent border-0 cursor-pointer"
                          >
                            <Star
                              className={`h-9 w-9 transition-all ${
                                isSelected
                                  ? "fill-amber-400 stroke-amber-500 scale-110"
                                  : "stroke-slate-300 fill-transparent hover:stroke-slate-400"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {ratingMessage && (
                      <p className="text-xs text-lime-800 font-display font-black bg-lime-50 border border-lime-100 p-3.5 rounded-2xl text-center leading-relaxed">
                        {ratingMessage}
                      </p>
                    )}
                  </motion.div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'RESET' });
                    setCountdown(1500);
                    setProgress(0);
                    setTrackingStatus("Đang chờ vào Booth");
                    setRating(0);
                    setRatingMessage("");
                    setPromoInput("");
                  }}
                  className="w-full bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 py-4 rounded-2xl text-center font-display font-black text-xs uppercase tracking-wider shadow-md shadow-lime-200/20 transition-all duration-200 cursor-pointer border-0"
                >
                  QUAY VỀ MÀN HÌNH CHÍNH 🏠
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
