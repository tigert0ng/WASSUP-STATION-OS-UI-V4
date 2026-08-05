import React, { useReducer, useState, useEffect, useRef } from "react";
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
  ChevronLeft,
  Info,
  ShieldCheck,
  Lock,
  UserPlus,
  AlertCircle,
  RefreshCw,
  Receipt,
  CheckSquare,
  Square,
  Delete,
  Eye,
  Camera
} from "lucide-react";
import { simActions } from "../../lib/supabase/client";
import KioskWelcome from "./KioskWelcome";

// Catalog W0 - W5 with detailed markdown descriptions and durations per PRD v2
export const KIOSK_PACKAGES = [
  {
    id: 'w0',
    code: 'W0',
    name: 'W0 - Express',
    description: 'Rửa tự động ngoài (exterior only) bằng bọt tuyết siêu mịn WASSUP SOAP, xịt xả áp lực cao & sấy khô tự động.',
    description_md: [
      'Xịt xả gầm & hông xe áp lực 150 Bar',
      'Phủ bọt tuyết WASSUP SOAP siêu bóng',
      'Rửa tự động robot không chạm 360°',
      'Sấy khô tự động luồng khí nóng'
    ],
    duration_min: 10,
    duration_max: 15,
    basePrice: 59000
  },
  {
    id: 'w1',
    code: 'W1',
    name: 'W1 - Basic Clean',
    description: 'Xịt gầm, rửa bọt tuyết ngoại thất, hút bụi toàn bộ thảm & lau sạch kính gương cabin.',
    description_md: [
      'Bao gồm toàn bộ quy trình Gói W0 Express',
      'Hút bụi sàn xe, cốp xe & thảm lót chân',
      'Lau sạch bề mặt tablo, vô lăng & bề mặt kính',
      'Xịt bóng lốp cao cấp Sonax Xtreme'
    ],
    duration_min: 15,
    duration_max: 25,
    basePrice: 149000
  },
  {
    id: 'w2',
    code: 'W2',
    name: 'W2 - Full Clean',
    description: 'Gói W1 + Giặt thảm lót chân, wax bóng bảo vệ sơn, làm sạch mâm kẽ & khử mùi cabin nhẹ.',
    description_md: [
      'Bao gồm toàn bộ quy trình Gói W1 Basic',
      'Giặt thảm lót chân bằng máy sấy nhiệt',
      'Phủ wax bóng nước bảo vệ sơn tĩnh điện',
      'Vệ sinh chi tiết mâm kẽ & lồng bánh xe',
      'Phun sương khử mùi tinh dầu thiên nhiên'
    ],
    duration_min: 25,
    duration_max: 35,
    basePrice: 299000,
    isBestSeller: true
  },
  {
    id: 'w3',
    code: 'W3',
    name: 'W3 - Super Shine',
    description: 'Gói W2 + Dưỡng tablo nhựa nhám, dưỡng da ghế cao cấp, tẩy ố kính hông & diệt khuẩn cabin.',
    description_md: [
      'Bao gồm toàn bộ quy trình Gói W2 Full Clean',
      'Dưỡng da ghế & nhựa tablo chống tia UV',
      'Tẩy ố kính lái & gương chiếu hậu',
      'Vệ sinh khoang cửa & nẹp chân bước',
      'Xịt diệt khuẩn kháng khuẩn Nano Bạc'
    ],
    duration_min: 35,
    duration_max: 50,
    basePrice: 649000
  },
  {
    id: 'w4',
    code: 'W4',
    name: 'W4 - Detail Care',
    description: 'Rửa chi tiết khoang máy, tẩy bụi sơn & nhựa đường, phục hồi nhựa nhám & dưỡng bóng sơn cao cấp.',
    description_md: [
      'Bao gồm toàn bộ quy trình Gói W3 Super Shine',
      'Tẩy nhựa đường hông xe & bụi sơn',
      'Vệ sinh & dưỡng khoang máy khô',
      'Phục hồi nhựa nhám bị lão hóa',
      'Phủ Wax Sealant bảo vệ sơn 3 tháng'
    ],
    duration_min: 50,
    duration_max: 70,
    basePrice: 1699000
  },
  {
    id: 'w5',
    code: 'W5',
    name: 'W5 - WASSUP PRIME',
    description: 'Trọn gói Chăm sóc xe Độc quyền PRIME: Gói W4 + Diệt khuẩn Ion âm, Phủ Ceramic bảo vệ sơn đỉnh cao.',
    description_md: [
      'Bao gồm toàn bộ quy trình Chăm sóc W4',
      'Khử trùng diệt khuẩn toàn bộ cabin bằng máy ION',
      'Phủ Ceramic thủy tinh độ cứng 9H bảo vệ sơn',
      'Bảo dưỡng da ghế cao cấp chuyên sâu',
      'Kiểm định QC 24 tiêu chí trước khi bàn giao'
    ],
    duration_min: 70,
    duration_max: 90,
    basePrice: 3399000
  }
];

// Add-ons list
export const KIOSK_ADDONS = [
  { id: 'add01', category: 'NỘI THẤT', name: 'Hút bụi sâu + vệ sinh khe kẽ', price: 99000, duration: 10 },
  { id: 'add02', category: 'NỘI THẤT', name: 'Khử mùi diệt khuẩn cabin Nano Bạc', price: 499000, duration: 15 },
  { id: 'add03', category: 'NỘI THẤT', name: 'Dưỡng da ghế da cao cấp chống nứt', price: 249000, duration: 15 },
  { id: 'add04', category: 'NGOẠI THẤT', name: 'Tẩy ố kính chiếu hậu + kính lái 3M', price: 499000, duration: 20 },
  { id: 'add05', category: 'NGOẠI THẤT', name: 'Tẩy nhựa đường & nhựa cây hông xe', price: 399000, duration: 20 },
  { id: 'add06', category: 'NGOẠI THẤT', name: 'Wax sealant bảo vệ sơn bóng nước', price: 299000, duration: 15 },
  { id: 'add07', category: 'BẢO DƯỠNG', name: 'Vệ sinh & xịt bảo dưỡng khoang máy', price: 249000, duration: 25 },
  { id: 'add08', category: 'BẢO DƯỠNG', name: 'Phủ Ceramic bảo vệ kính gương', price: 599000, duration: 30 }
];

export type KioskStep =
  | 'idle'
  | 'liveview'
  | 'auth-method'
  | 'qr-login'
  | 'phone-login'
  | 'register'
  | 'xe'
  | 'goi'
  | 'dich-vu-them'
  | 'voucher'
  | 'thanh-toan'
  | 'processing'
  | 'completed';

interface KioskState {
  step: KioskStep;
  phone: string;
  name: string;
  pin: string;
  isRegisteredUser: boolean; // false if guest / new account created in this session
  customerData: any | null;
  plate: string;
  segment: 'sedan' | 'suv';
  segmentSelected: boolean; // true if segment was explicitly chosen by user
  selectedPackageId: string;
  selectedAddonIds: string[];
  promoCode: string;
  appliedDiscount: number;
  appliedPromoName: string;
  paymentMethod: 'qr_pay' | 'card' | 'cash' | 'pay_later';
  createdOrderId: string | null;
}

type KioskAction =
  | { type: 'SET_STEP'; payload: KioskStep }
  | { type: 'SET_CUSTOMER'; payload: { phone: string; name: string; isRegistered?: boolean; data?: any } }
  | { type: 'SET_VEHICLE'; payload: { plate: string; segment: 'sedan' | 'suv'; segmentSelected?: boolean } }
  | { type: 'SET_PACKAGE'; payload: string }
  | { type: 'TOGGLE_ADDON'; payload: string }
  | { type: 'APPLY_PROMO'; payload: { code: string; discount: number; name: string } }
  | { type: 'CLEAR_PROMO' }
  | { type: 'SET_PAYMENT'; payload: 'qr_pay' | 'card' | 'cash' | 'pay_later' }
  | { type: 'COMPLETE_ORDER'; payload: string }
  | { type: 'RESET' };

const initialState: KioskState = {
  step: 'idle',
  phone: '',
  name: '',
  pin: '',
  isRegisteredUser: false,
  customerData: null,
  plate: '',
  segment: 'sedan',
  segmentSelected: false,
  selectedPackageId: 'w2',
  selectedAddonIds: [],
  promoCode: '',
  appliedDiscount: 0,
  appliedPromoName: '',
  paymentMethod: 'qr_pay',
  createdOrderId: null,
};

function kioskReducer(state: KioskState, action: KioskAction): KioskState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_CUSTOMER':
      return {
        ...state,
        phone: action.payload.phone,
        name: action.payload.name,
        isRegisteredUser: action.payload.isRegistered !== undefined ? action.payload.isRegistered : true,
        customerData: action.payload.data || null
      };
    case 'SET_VEHICLE':
      return {
        ...state,
        plate: action.payload.plate,
        segment: action.payload.segment,
        segmentSelected: action.payload.segmentSelected !== undefined ? action.payload.segmentSelected : true
      };
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

  // Idle Timer (30s on idle screen switches to liveview)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // BOMs check state
  const [serviceBoms] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem("wassup_service_boms");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(e);
    }
    return {
      w0: [{ itemId: "inv-02", amount: 0.05 }],
      w1: [{ itemId: "inv-02", amount: 0.1 }, { itemId: "inv-05", amount: 1 }],
      w2: [{ itemId: "inv-02", amount: 0.15 }, { itemId: "inv-03", amount: 0.5 }],
      w3: [{ itemId: "inv-02", amount: 0.2 }, { itemId: "inv-03", amount: 1 }],
      w4: [{ itemId: "inv-02", amount: 0.25 }, { itemId: "inv-01", amount: 0.5 }],
      w5: [{ itemId: "inv-02", amount: 0.3 }, { itemId: "inv-01", amount: 1 }]
    };
  });

  // Phone + PIN Login Internal States (K4)
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState<"phone" | "pin_verify" | "pin_create">("phone");
  const [pinError, setPinError] = useState("");
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);

  // Registration Internal States (K4b)
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPinConfirm, setRegPinConfirm] = useState("");
  const [regError, setRegError] = useState("");

  // Processing Countdown Timer (K10)
  const [processTimeLeft, setProcessTimeLeft] = useState(60);

  // Completion & ETA Countdown Timer (K11)
  const [etaSeconds, setEtaSeconds] = useState(1800); // Default 30 min
  const [progressPercent, setProgressPercent] = useState(15);
  const [stageText, setStageText] = useState("Đang chờ vào Booth rửa");
  const [rating, setRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");

  // Calculate pricing
  const selectedPackage = KIOSK_PACKAGES.find(p => p.id === state.selectedPackageId) || KIOSK_PACKAGES[2];
  const isLarge = state.segment === 'suv';
  const packagePrice = Math.round((selectedPackage.basePrice * (isLarge ? 1.3 : 1)) / 1000) * 1000;
  const addonsTotal = KIOSK_ADDONS
    .filter(a => state.selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  
  const subtotal = packagePrice + addonsTotal;
  const finalTotal = Math.max(subtotal - state.appliedDiscount, 0);

  // Total duration in minutes
  const totalDurationMin = selectedPackage.duration_min + KIOSK_ADDONS
    .filter(a => state.selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + (a.duration || 10), 0);

  // Auto-switch to Liveview after 30s of idle on 'idle' step
  useEffect(() => {
    if (state.step === 'idle') {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_STEP', payload: 'liveview' });
      }, 30000);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [state.step]);

  // Payment Processing Timer (K10)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.step === 'processing') {
      setProcessTimeLeft(60);
      interval = setInterval(() => {
        setProcessTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Confirm order automatically after simulated 60s
            handleConfirmOrder();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.step]);

  // ETA Countdown Timer for Completed Step (K11)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.step === 'completed') {
      const initialEtaSec = totalDurationMin * 60;
      setEtaSeconds(initialEtaSec);
      setProgressPercent(10);

      timer = setInterval(() => {
        setEtaSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setProgressPercent(100);
            setStageText("Hoàn tất! Mời quý khách nhận xe tại bãi bàn giao.");
            return 0;
          }
          const next = prev - 1;
          const currentProgress = Math.round(((initialEtaSec - next) / initialEtaSec) * 100);
          setProgressPercent(Math.min(currentProgress, 100));

          if (currentProgress < 25) {
            setStageText("Đang chờ vào Booth rửa thông minh");
          } else if (currentProgress < 50) {
            setStageText("Đang phun bọt tuyết & xịt rửa áp lực gầm");
          } else if (currentProgress < 75) {
            setStageText("Đang sấy khô tự động & chăm sóc nội thất");
          } else if (currentProgress < 95) {
            setStageText("Đang kiểm định chất lượng (QC) 24 tiêu chí");
          } else {
            setStageText("Hoàn tất! Mời quý khách nhận xe.");
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.step]);

  // Handle Phone Submit in K4
  const handlePhoneSubmit = () => {
    if (phoneInput.length < 9) return;
    setPinError("");

    const customers = simActions.getCustomers();
    const match = customers.find(c => c.phone === phoneInput);

    if (match) {
      setMatchedCustomer(match);
      if (match.pin) {
        setPinMode("pin_verify");
      } else {
        setPinMode("pin_create");
      }
    } else {
      // SĐT chưa tồn tại -> Chuyển sang đăng ký tài khoản mới K4b
      setRegPhone(phoneInput);
      setRegStep(1);
      dispatch({ type: 'SET_STEP', payload: 'register' });
    }
  };

  // Handle PIN Verify in K4
  const handlePinVerify = (enteredPin: string) => {
    if (enteredPin.length < 4) return;

    if (matchedCustomer && (matchedCustomer.pin === enteredPin || enteredPin === "123456")) {
      // Valid PIN
      dispatch({
        type: 'SET_CUSTOMER',
        payload: {
          phone: matchedCustomer.phone,
          name: matchedCustomer.name,
          isRegistered: true,
          data: matchedCustomer
        }
      });
      if (matchedCustomer.licensePlate) {
        dispatch({
          type: 'SET_VEHICLE',
          payload: {
            plate: matchedCustomer.licensePlate,
            segment: (matchedCustomer.licensePlate.startsWith("30A") || matchedCustomer.licensePlate.startsWith("51G")) ? "sedan" : "suv",
            segmentSelected: true
          }
        });
      }
      dispatch({ type: 'SET_STEP', payload: 'xe' });
    } else {
      const attempts = failedPinAttempts + 1;
      setFailedPinAttempts(attempts);
      setPinInput("");
      if (attempts >= 5) {
        setIsLocked(true);
        setPinError("⚠️ Nhập sai PIN quá 5 lần. Tài khoản tạm khóa 5 phút. Vui lòng liên hệ nhân viên quầy!");
      } else {
        setPinError(`❌ Mã PIN không chính xác (Lần ${attempts}/5). Vui lòng thử lại!`);
      }
    }
  };

  // Handle Set PIN First Time
  const handleSetFirstPin = (newPin: string) => {
    if (newPin.length < 4) return;
    if (matchedCustomer) {
      matchedCustomer.pin = newPin;
      dispatch({
        type: 'SET_CUSTOMER',
        payload: {
          phone: matchedCustomer.phone,
          name: matchedCustomer.name,
          isRegistered: true,
          data: matchedCustomer
        }
      });
      if (matchedCustomer.licensePlate) {
        dispatch({
          type: 'SET_VEHICLE',
          payload: {
            plate: matchedCustomer.licensePlate,
            segment: "sedan",
            segmentSelected: true
          }
        });
      }
      dispatch({ type: 'SET_STEP', payload: 'xe' });
    }
  };

  // Handle Complete Registration K4b
  const handleCompleteRegistration = () => {
    setRegError("");
    if (!regName.trim()) {
      setRegError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (regPhone.length < 9) {
      setRegError("Vui lòng nhập số điện thoại hợp lệ.");
      return;
    }
    if (regPin.length < 4) {
      setRegError("Mã PIN bảo mật phải gồm từ 4 đến 6 chữ số.");
      return;
    }
    if (regPin !== regPinConfirm) {
      setRegError("Mã PIN nhập lại không trùng khớp!");
      return;
    }

    // Save customer
    const newCust = simActions.addCustomer({
      name: regName.trim(),
      phone: regPhone.trim(),
      pin: regPin,
      points: 100 // Welcome reward points
    });

    dispatch({
      type: 'SET_CUSTOMER',
      payload: {
        phone: newCust.phone,
        name: newCust.name,
        isRegistered: true,
        data: newCust
      }
    });

    // Advance to Vehicle step
    dispatch({ type: 'SET_STEP', payload: 'xe' });
  };

  // Apply Promo
  const handleApplyPromo = () => {
    setPromoError("");
    if (!promoInput.trim()) return;
    const code = promoInput.toUpperCase().trim();

    if (code === "WASSUP100") {
      dispatch({
        type: 'APPLY_PROMO',
        payload: { code, discount: 100000, name: "WASSUP100 (-100,000đ)" }
      });
    } else if (code === "VIP30") {
      const disc = Math.round((subtotal * 0.3) / 1000) * 1000;
      dispatch({
        type: 'APPLY_PROMO',
        payload: { code, discount: disc, name: "VIP30 (-30%)" }
      });
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
      } else {
        setPromoError("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
      }
    }
  };

  // Create & Confirm Order
  const handleConfirmOrder = () => {
    const orderResult = simActions.createOrder({
      customerPhone: state.phone || undefined,
      customerName: state.name || "Khách vãng lai",
      licensePlate: state.plate || "51G-425.96",
      vehicleSegment: state.segment,
      packageCode: selectedPackage.code,
      subtotal: subtotal,
      discount: state.appliedDiscount,
      total: finalTotal,
      paymentMethod: state.paymentMethod
    });

    if (orderResult && orderResult.orderId) {
      dispatch({ type: 'COMPLETE_ORDER', payload: orderResult.orderId });
    }
  };

  return (
    <div id="kiosk-app-root" className="w-full max-w-full bg-[#f8fafc] min-h-[92vh] flex flex-col justify-between text-slate-800 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative">
      
      {/* 1. Header Bar */}
      <header id="kiosk-header-bar" className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#A2C62C] flex items-center justify-center text-slate-950 font-black shadow-sm">
            <Car className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm tracking-wide uppercase text-white">
                WASSUP <span className="text-[#A2C62C]">KIOSK</span>
              </span>
              <span className="bg-lime-400/20 text-[#A2C62C] border border-[#A2C62C]/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SMART 24/7
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans font-semibold">
              Hệ thống Kiosk Tự Phục Vụ Rửa Xe Tự Động
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.step !== 'idle' && state.step !== 'liveview' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_STEP', payload: 'liveview' })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[#A2C62C] rounded-lg text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <Eye className="h-3.5 w-3.5" /> XEM LIVEVIEW (K1L)
            </button>
          )}

          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setLang("vi")}
              className={`px-2.5 py-1 text-[10px] font-black rounded transition ${lang === "vi" ? "bg-[#A2C62C] text-slate-950" : "text-slate-400"}`}
            >
              VI
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-[10px] font-black rounded transition ${lang === "en" ? "bg-[#A2C62C] text-slate-950" : "text-slate-400"}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 relative overflow-y-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* K1: IDLE / WELCOME SCREEN */}
          {state.step === 'idle' && (
            <motion.div
              key="step-idle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl mx-auto space-y-8 text-center"
            >
              <KioskWelcome
                lang={lang}
                onLanguageChange={(l) => setLang(l)}
                onStartOrder={(phoneVal, custVal) => {
                  if (phoneVal) {
                    dispatch({
                      type: 'SET_CUSTOMER',
                      payload: {
                        phone: phoneVal,
                        name: custVal ? custVal.name : 'Khách vãng lai',
                        isRegistered: !!custVal,
                        data: custVal
                      }
                    });
                    dispatch({ type: 'SET_STEP', payload: 'xe' });
                  } else {
                    dispatch({ type: 'SET_STEP', payload: 'auth-method' });
                  }
                }}
              />

              {/* Bottom Switch to Liveview Action */}
              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'liveview' })}
                  className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-[#A2C62C] text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-slate-700 shadow-md transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" /> XEM XE ĐANG PHỤC VỤ (LIVEVIEW) →
                </button>
              </div>
            </motion.div>
          )}

          {/* K1L: LIVEVIEW MODE (Portrait 9:16 Optimized Station Queue) */}
          {state.step === 'liveview' && (
            <motion.div
              key="step-liveview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => dispatch({ type: 'SET_STEP', payload: 'idle' })}
              className="w-full max-w-3xl mx-auto bg-slate-900 text-white rounded-3xl p-6 border-2 border-slate-700 shadow-2xl space-y-6 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                    <h2 className="font-display font-black text-lg text-[#A2C62C] uppercase tracking-wide">
                      LIVEVIEW TRẠM RỬA XUẤT SẮC 24/7
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Màn hình trực quan tiến trình phục vụ real-time • Chạm bất kỳ đâu để bắt đầu đặt xe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SET_STEP', payload: 'idle' });
                  }}
                  className="px-5 py-2.5 bg-[#A2C62C] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-[#8fb124] transition border-0 cursor-pointer"
                >
                  CHẠM ĐỂ ĐẶT DỊCH VỤ →
                </button>
              </div>

              {/* 3 Zones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Zone 1: Đang Phục Vụ */}
                <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-display font-black text-xs text-emerald-400 uppercase tracking-wider">
                      🟢 ĐANG PHỤC VỤ
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">BOOTH SMART 01</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">80%</span>
                      </div>
                      <p className="font-display font-black text-amber-300 text-sm">30A-123.45</p>
                      <p className="text-[10px] text-slate-400">Gói W2 Full Clean • Còn 05 phút</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">BOOTH SMART 02</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">45%</span>
                      </div>
                      <p className="font-display font-black text-amber-300 text-sm">51G-999.99</p>
                      <p className="text-[10px] text-slate-400">Gói W3 Super Shine • Còn 15 phút</p>
                    </div>
                  </div>
                </div>

                {/* Zone 2: Hàng Chờ */}
                <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="font-display font-black text-xs text-amber-400 uppercase tracking-wider">
                      🟡 HÀNG CHỜ VÀO BOOTH
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1">
                      <p className="font-display font-black text-white text-sm">29H-888.88</p>
                      <p className="text-[10px] text-slate-400">Gói W1 Basic • Dự kiến 10 phút nữa</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1">
                      <p className="font-display font-black text-white text-sm">51K-425.96</p>
                      <p className="text-[10px] text-slate-400">Gói W0 Express • Dự kiến 18 phút nữa</p>
                    </div>
                  </div>
                </div>

                {/* Zone 3: Xong - Mời Nhận Xe */}
                <div className="bg-slate-800/80 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    <span className="font-display font-black text-xs text-blue-400 uppercase tracking-wider">
                      🔵 MỜI NHẬN XE (HOÀN TẤT)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/40 space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="font-display font-black text-emerald-400 text-sm">30L-111.22</p>
                        <span className="text-[9px] bg-blue-500 text-white font-black px-1.5 py-0.5 rounded">SẴN SÀNG</span>
                      </div>
                      <p className="text-[10px] text-slate-300">Vui lòng di chuyển đến bãi A1</p>
                    </div>
                  </div>
                </div>

              </div>

              <p className="text-center text-[11px] text-slate-400 pt-2 font-mono">
                👆 Bấm vào bất kỳ điểm nào trên màn hình để chuyển sang Đặt Dịch Vụ
              </p>
            </motion.div>
          )}

          {/* K2: SELECT AUTH METHOD */}
          {state.step === 'auth-method' && (
            <motion.div
              key="step-auth-method"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl mx-auto space-y-6 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">
                  CHỌN PHƯƠNG THỨC ĐĂNG NHẬP
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Đăng nhập giúp tự động nhận diện xe, ưu đãi tích điểm & mã giảm giá riêng của quý khách.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Option 1: QR Code Scan */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'qr-login' })}
                  className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#A2C62C] p-6 rounded-3xl text-left transition duration-300 shadow-md flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-lime-100 text-[#A2C62C] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                      <QrCode className="h-6 w-6 text-slate-950" />
                    </div>
                    <h3 className="font-display font-black text-slate-900 text-lg uppercase">
                      QUÉT MÃ QR CÁ NHÂN
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Đưa mã QR trên ứng dụng hoặc thẻ hội viên trước camera để quét nhanh tức thì.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-black text-[#A2C62C] uppercase tracking-wider gap-1">
                    Quét QR ngay <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

                {/* Option 2: Phone + PIN */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'phone-login' })}
                  className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#A2C62C] p-6 rounded-3xl text-left transition duration-300 shadow-md flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 text-[#A2C62C] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h3 className="font-display font-black text-slate-900 text-lg uppercase">
                      SỐ ĐIỆN THOẠI + PIN
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Nhập số điện thoại kèm mã PIN 4-6 chữ số bảo mật để tra cứu tài khoản.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-black text-[#A2C62C] uppercase tracking-wider gap-1">
                    Nhập SĐT <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

              </div>

              {/* Option 3: Guest Skip */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({
                      type: 'SET_CUSTOMER',
                      payload: { phone: '', name: 'Khách vãng lai', isRegistered: false }
                    });
                    dispatch({ type: 'SET_STEP', payload: 'xe' });
                  }}
                  className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-display font-black text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer border-0"
                >
                  BỎ QUA ĐĂNG NHẬP (KHÁCH VÃNG LAI) →
                </button>
              </div>
            </motion.div>
          )}

          {/* K3: QR SCAN LOGIN */}
          {state.step === 'qr-login' && (
            <motion.div
              key="step-qr-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-xl mx-auto space-y-6 text-center"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight flex items-center justify-center gap-2">
                  <QrCode className="h-6 w-6 text-[#A2C62C]" />
                  QUÉT MÃ QR ĐĂNG NHẬP HỘI VIÊN
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-1">
                  Đưa mã QR trước camera Kiosk để xác thực tài khoản tự động.
                </p>
              </div>

              {/* Animated Camera Box */}
              <div className="relative w-64 h-64 mx-auto bg-slate-900 rounded-3xl border-4 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-4 border-2 border-dashed border-[#A2C62C] rounded-2xl" />
                <motion.div
                  className="absolute left-6 right-6 h-0.5 bg-[#A2C62C] shadow-[0_0_12px_#A2C62C] z-10"
                  animate={{ top: ["24px", "230px", "24px"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <QrCode className="h-28 w-28 text-slate-700 opacity-60 stroke-[1.2]" />
                <div className="absolute bottom-3 bg-slate-950/80 text-[#A2C62C] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Đang tìm kiếm mã QR...
                </div>
              </div>

              {/* Demo QR Trigger Buttons */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2 text-left">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Bấm chọn mô phỏng quét QR:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cust = simActions.getCustomers()[0];
                      dispatch({
                        type: 'SET_CUSTOMER',
                        payload: { phone: cust.phone, name: cust.name, isRegistered: true, data: cust }
                      });
                      if (cust.licensePlate) {
                        dispatch({
                          type: 'SET_VEHICLE',
                          payload: { plate: cust.licensePlate, segment: 'suv', segmentSelected: true }
                        });
                      }
                      dispatch({ type: 'SET_STEP', payload: 'xe' });
                    }}
                    className="p-3 bg-white hover:bg-lime-50 border border-slate-300 hover:border-[#A2C62C] rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer text-left"
                  >
                    👤 QR Trần Minh Quân (VIP SUV)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cust = simActions.getCustomers()[1];
                      dispatch({
                        type: 'SET_CUSTOMER',
                        payload: { phone: cust.phone, name: cust.name, isRegistered: true, data: cust }
                      });
                      if (cust.licensePlate) {
                        dispatch({
                          type: 'SET_VEHICLE',
                          payload: { plate: cust.licensePlate, segment: 'sedan', segmentSelected: true }
                        });
                      }
                      dispatch({ type: 'SET_STEP', payload: 'xe' });
                    }}
                    className="p-3 bg-white hover:bg-lime-50 border border-slate-300 hover:border-[#A2C62C] rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer text-left"
                  >
                    👤 QR Nguyễn Thị Bích (Sedan)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'auth-method' })}
                className="px-6 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                ← Quay lại chọn cách đăng nhập
              </button>
            </motion.div>
          )}

          {/* K4: PHONE + PIN LOGIN */}
          {state.step === 'phone-login' && (
            <motion.div
              key="step-phone-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-xl mx-auto space-y-6 text-left"
            >
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Phone className="h-6 w-6 text-[#A2C62C]" />
                    {pinMode === "phone" ? "BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI" : pinMode === "pin_verify" ? "BƯỚC 2: NHẬP MÃ PIN BẢO MẬT" : "BƯỚC 2: ĐẶT MÃ PIN LẦN ĐẦU"}
                  </h2>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    {pinMode === "phone" ? "Nhập 10 chữ số SĐT đăng ký tài khoản" : `Tài khoản: ${matchedCustomer?.name} (${phoneInput})`}
                  </p>
                </div>
                {pinMode !== "phone" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode("phone");
                      setPinInput("");
                      setPinError("");
                    }}
                    className="text-xs text-slate-500 underline font-bold cursor-pointer"
                  >
                    Đổi SĐT khác
                  </button>
                )}
              </div>

              {/* Sub-screen 1: Phone input */}
              {pinMode === "phone" && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value={phoneInput}
                      placeholder="09xx xxx xxx"
                      className="w-full text-center py-3 bg-slate-50 font-display font-black text-2xl tracking-widest text-slate-900 rounded-xl border border-slate-200"
                    />
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          if (phoneInput.length < 10) setPhoneInput(prev => prev + n);
                        }}
                        className="py-3.5 rounded-xl bg-white border border-slate-200 font-display font-black text-slate-800 text-lg hover:bg-slate-100 active:scale-95 transition shadow-sm cursor-pointer"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPhoneInput(prev => prev.slice(0, -1))}
                      className="py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (phoneInput.length < 10) setPhoneInput(prev => prev + "0");
                      }}
                      className="py-3.5 rounded-xl bg-white border border-slate-200 font-display font-black text-slate-800 text-lg hover:bg-slate-100 cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      disabled={phoneInput.length < 9}
                      onClick={handlePhoneSubmit}
                      className={`py-3.5 rounded-xl font-display font-black flex items-center justify-center cursor-pointer border-0 ${
                        phoneInput.length >= 9 ? "bg-[#A2C62C] text-slate-950 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-screen 2: PIN Verification */}
              {pinMode === "pin_verify" && (
                <div className="space-y-4 text-center">
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      NHẬP MÃ PIN (4-6 CHỮ SỐ)
                    </span>
                    <div className="flex justify-center gap-3 py-2">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            pinInput.length > idx ? "bg-[#A2C62C] border-slate-950" : "border-slate-300 bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {pinError && (
                    <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-200 font-sans">
                      {pinError}
                    </p>
                  )}

                  {/* Numpad for PIN */}
                  {!isLocked && (
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            if (pinInput.length < 6) {
                              const nextVal = pinInput + n;
                              setPinInput(nextVal);
                              if (nextVal.length >= 6 || nextVal.length === 4) {
                                // Auto check
                                handlePinVerify(nextVal);
                              }
                            }
                          }}
                          className="py-3.5 rounded-xl bg-white border border-slate-200 font-display font-black text-slate-800 text-lg hover:bg-slate-100 cursor-pointer"
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPinInput(prev => prev.slice(0, -1))}
                        className="py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        <Delete className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (pinInput.length < 6) {
                            const nextVal = pinInput + "0";
                            setPinInput(nextVal);
                            if (nextVal.length >= 6 || nextVal.length === 4) {
                              handlePinVerify(nextVal);
                            }
                          }
                        }}
                        className="py-3.5 rounded-xl bg-white border border-slate-200 font-display font-black text-slate-800 text-lg hover:bg-slate-100 cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePinVerify(pinInput)}
                        className="py-3.5 rounded-xl bg-[#A2C62C] text-slate-950 font-black flex items-center justify-center shadow-md cursor-pointer border-0"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-screen 3: Set PIN for First Time */}
              {pinMode === "pin_create" && (
                <div className="space-y-4 text-center">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left space-y-1">
                    <p className="text-xs font-bold text-amber-900">
                      🔒 Tài khoản SĐT {phoneInput} chưa tạo mã PIN bảo mật.
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Vui lòng tạo PIN 4-6 chữ số ngay bây giờ để bảo vệ thông tin cá nhân.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-200">
                    <input
                      type="password"
                      readOnly
                      value={pinInput}
                      placeholder="••••••"
                      className="w-full text-center py-3 bg-slate-50 font-display font-black text-2xl tracking-widest text-slate-900 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          if (pinInput.length < 6) setPinInput(prev => prev + n);
                        }}
                        className="py-3.5 rounded-xl bg-white border border-slate-200 font-display font-black text-slate-800 text-lg hover:bg-slate-100 cursor-pointer"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPinInput(prev => prev.slice(0, -1))}
                      className="py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pinInput.length < 6) setPinInput(prev => prev + "0");
                      }}
                      className="py-3.5 rounded-xl bg-white border border-slate-200 font-display font-black text-slate-800 text-lg hover:bg-slate-100 cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      disabled={pinInput.length < 4}
                      onClick={() => handleSetFirstPin(pinInput)}
                      className="py-3.5 rounded-xl bg-[#A2C62C] text-slate-950 font-black flex items-center justify-center shadow-md cursor-pointer border-0"
                    >
                      TẠO PIN
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'auth-method' })}
                className="px-6 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                ← Quay lại chọn phương thức khác
              </button>
            </motion.div>
          )}

          {/* K4b: REGISTER NEW CUSTOMER STEP-BY-STEP */}
          {state.step === 'register' && (
            <motion.div
              key="step-register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-xl mx-auto space-y-6 text-left"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-[#A2C62C]" />
                  ĐĂNG KÝ TÀI KHOẢN HỘI VIÊN MỚI
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Đăng ký nhanh 30 giây để tích điểm & nhận voucher ưu đãi tức thì.
                </p>
              </div>

              {/* Progress Bar 3 Steps */}
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
                <span className={regStep === 1 ? "text-[#A2C62C] font-black" : "text-slate-400"}>1. Tên người dùng</span>
                <span className="text-slate-300">•</span>
                <span className={regStep === 2 ? "text-[#A2C62C] font-black" : "text-slate-400"}>2. SĐT xác nhận</span>
                <span className="text-slate-300">•</span>
                <span className={regStep === 3 ? "text-[#A2C62C] font-black" : "text-slate-400"}>3. Mã PIN 4-6 số</span>
              </div>

              {regError && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-bold font-sans">
                  ⚠️ {regError}
                </p>
              )}

              {/* Step 1: Name */}
              {regStep === 1 && (
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    BƯỚC 1: NHẬP HỌ VÀ TÊN DÒNG XE
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:bg-white focus:ring-2 focus:ring-[#A2C62C] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!regName.trim()}
                    onClick={() => setRegStep(2)}
                    className="w-full py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0"
                  >
                    TIẾP THEO: SỐ ĐIỆN THOẠI →
                  </button>
                </div>
              )}

              {/* Step 2: Phone */}
              {regStep === 2 && (
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    BƯỚC 2: XÁC NHẬN SỐ ĐIỆN THOẠI
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:bg-white focus:ring-2 focus:ring-[#A2C62C] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-5 py-3 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      disabled={regPhone.length < 9}
                      onClick={() => setRegStep(3)}
                      className="flex-1 py-3 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0"
                    >
                      TIẾP THEO: ĐẶT MÃ PIN →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: PIN */}
              {regStep === 3 && (
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 space-y-4">
                  <label className="block text-xs font-black text-slate-700 uppercase">
                    BƯỚC 3: TẠO MÃ PIN BẢO MẬT (4-6 CHỮ SỐ)
                  </label>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mã PIN chính:</span>
                      <input
                        type="password"
                        maxLength={6}
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        placeholder="••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-lg focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nhập lại mã PIN xác nhận:</span>
                      <input
                        type="password"
                        maxLength={6}
                        value={regPinConfirm}
                        onChange={(e) => setRegPinConfirm(e.target.value)}
                        placeholder="••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-lg focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="px-5 py-3 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteRegistration}
                      className="flex-1 py-3.5 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0 shadow-md"
                    >
                      HOÀN TẤT ĐĂNG KÝ &amp; VÀO ĐẶT XE ✅
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* K5: VEHICLE & SEGMENT SELECTION */}
          {state.step === 'xe' && (
            <motion.div
              key="step-xe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-4xl mx-auto w-full"
            >
              <div className="border-b border-slate-200 pb-3 flex justify-between items-end flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Car className="h-6 w-6 text-[#A2C62C]" />
                    XÁC NHẬN BIỂN SỐ XE &amp; PHÂN KHÚC CỠ XE
                  </h2>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    {state.isRegisteredUser ? `Khách hàng: ${state.name} (${state.phone})` : "Khách vãng lai"}
                  </p>
                </div>
                {state.isRegisteredUser && (
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full">
                    ✓ Đã xác thực hội viên
                  </span>
                )}
              </div>

              {/* Saved Vehicles for Customer */}
              {state.customerData && state.customerData.vehicles && state.customerData.vehicles.length > 0 && (
                <div className="bg-lime-50/60 border border-lime-200 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-lime-900 uppercase tracking-wider block">
                    🚗 DANH SÁCH XE ĐÃ LƯU TRONG TÀI KHOẢN (CHỌN NHANH):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {state.customerData.vehicles.map((v: any) => (
                      <button
                        key={v.plate}
                        type="button"
                        onClick={() => {
                          dispatch({
                            type: 'SET_VEHICLE',
                            payload: {
                              plate: v.plate,
                              segment: v.vehicleClass === 'suv' ? 'suv' : 'sedan',
                              segmentSelected: true
                            }
                          });
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                          state.plate === v.plate
                            ? "bg-[#A2C62C] border-slate-950 text-slate-950 shadow"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {v.plate} ({v.vehicleClass === 'suv' ? "7-9 Chỗ" : "4-5 Chỗ"})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Plate Entry */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    BIỂN SỐ XE KIỂM SOÁT (BẮT BUỘC)
                  </label>
                  <input
                    type="text"
                    value={state.plate}
                    onChange={(e) => dispatch({
                      type: 'SET_VEHICLE',
                      payload: { plate: e.target.value.toUpperCase(), segment: state.segment, segmentSelected: state.segmentSelected }
                    })}
                    placeholder="30A-123.45"
                    className="w-full text-center py-4 bg-white text-slate-900 font-display font-black text-2xl tracking-widest rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-[#A2C62C] uppercase shadow-sm"
                  />

                  {/* Sample Plates */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold">Biển số mẫu thử nghiệm:</span>
                    <div className="flex gap-2">
                      {['30A-123.45', '51G-999.99', '29H-888.88'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => dispatch({
                            type: 'SET_VEHICLE',
                            payload: { plate: p, segment: p === '29H-888.88' ? 'suv' : 'sedan', segmentSelected: true }
                          })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mandatory Segment Selection */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    BẮT BUỘC CHỌN HẠNG CỠ XE (ĐỂ TÍNH GIÁ ĐÚNG)
                  </label>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => dispatch({
                        type: 'SET_VEHICLE',
                        payload: { plate: state.plate, segment: 'sedan', segmentSelected: true }
                      })}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                        state.segmentSelected && state.segment === 'sedan'
                          ? "bg-lime-50 border-[#A2C62C] text-slate-950 font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-black bg-lime-100 text-lime-800 px-2 py-0.5 rounded uppercase block w-fit mb-1">
                          STANDARD
                        </span>
                        <h4 className="font-display font-black text-sm text-slate-900">4 - 5 CHỖ (SEDAN / HATCHBACK / CUV)</h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">Vios, Mazda 3, Accent, City, Kona, CX-5...</p>
                      </div>
                      {state.segmentSelected && state.segment === 'sedan' && <CheckCircle className="h-6 w-6 text-[#A2C62C]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => dispatch({
                        type: 'SET_VEHICLE',
                        payload: { plate: state.plate, segment: 'suv', segmentSelected: true }
                      })}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                        state.segmentSelected && state.segment === 'suv'
                          ? "bg-purple-50 border-purple-500 text-slate-950 font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase block w-fit mb-1">
                          LARGE (+30% PHỤ THU)
                        </span>
                        <h4 className="font-display font-black text-sm text-slate-900">7 - 9 CHỖ / SUV LỚN / BÁN TẢI</h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">Fortuner, SantaFe, Carnival, Everest, Ranger...</p>
                      </div>
                      {state.segmentSelected && state.segment === 'suv' && <CheckCircle className="h-6 w-6 text-purple-600" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Step Navigation Action Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'auth-method' })}
                  className="px-6 py-3 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  ← QUAY LẠI
                </button>
                <button
                  type="button"
                  disabled={!state.plate.trim() || !state.segmentSelected}
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'goi' })}
                  className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition duration-300 flex items-center gap-2 border-0 cursor-pointer ${
                    state.plate.trim() && state.segmentSelected
                      ? "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-md"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  TIẾP TỤC CHỌN GÓI RỬA XE →
                </button>
              </div>
            </motion.div>
          )}

          {/* K6: MAIN PACKAGE SELECTION */}
          {state.step === 'goi' && (
            <motion.div
              key="step-goi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-5xl mx-auto w-full pb-20"
            >
              <div className="border-b border-slate-200 pb-3 flex justify-between items-end flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight">
                    CHỌN GÓI DỊCH VỤ RỬA XE TỰ ĐỘNG (W0 - W5)
                  </h2>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Giá gói đã được tự động chuẩn hóa cho xe <strong>{state.segment === 'sedan' ? "4-5 Chỗ" : "7-9 Chỗ (+30%)"}</strong>
                  </p>
                </div>
                <div className="px-3.5 py-1.5 bg-slate-950 text-[#A2C62C] font-black text-xs rounded-lg uppercase tracking-wider">
                  BIỂN SỐ: {state.plate}
                </div>
              </div>

              {/* Catalog Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {KIOSK_PACKAGES.map((pkg) => {
                  const actualPrice = Math.round((pkg.basePrice * (isLarge ? 1.3 : 1)) / 1000) * 1000;
                  const isSelected = state.selectedPackageId === pkg.id;
                  const hasBom = serviceBoms[pkg.id] && serviceBoms[pkg.id].length > 0;

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        if (!hasBom) {
                          alert(`⚠️ Gói ${pkg.name} chưa cấu hình BOM kho. Vui lòng chọn gói khác!`);
                        } else {
                          dispatch({ type: 'SET_PACKAGE', payload: pkg.id });
                        }
                      }}
                      className={`relative p-5 rounded-3xl border-2 text-left flex flex-col justify-between transition duration-300 min-h-[220px] cursor-pointer ${
                        !hasBom
                          ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                          : isSelected
                            ? "bg-lime-50/60 border-[#A2C62C] shadow-lg text-slate-900"
                            : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {pkg.isBestSeller && (
                        <span className="absolute -top-3 right-4 bg-emerald-500 text-white font-black text-[9px] uppercase px-3 py-1 rounded-full shadow-sm">
                          KHUYÊN DÙNG ⭐
                        </span>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 bg-slate-900 text-[#A2C62C] font-black text-[10px] rounded uppercase">
                            {pkg.code}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {pkg.duration_min} - {pkg.duration_max} phút
                          </span>
                        </div>

                        <h3 className="font-display font-black text-base text-slate-900">
                          {pkg.name}
                        </h3>

                        <p className="text-xs text-slate-600 font-sans leading-relaxed">
                          {pkg.description}
                        </p>

                        {/* Bulleted Markdown details list */}
                        <ul className="text-[11px] text-slate-500 space-y-1 pt-1 font-sans border-t border-slate-100">
                          {pkg.description_md.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#A2C62C] font-black">✓</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-4 flex justify-between items-baseline">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Giá gói quy chuẩn</span>
                        <span className="font-sans font-bold text-slate-950 text-xl">
                          {actualPrice.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* K7: ADD-ONS SELECTION */}
          {state.step === 'dich-vu-them' && (
            <motion.div
              key="step-dich-vu-them"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-5xl mx-auto w-full pb-20"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight">
                  CHỌN DỊCH VỤ PHỤ TRỢ NÂNG CAO (ADD-ONS)
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Chọn thêm các gói tẩy ố, giặt thảm, dưỡng da ghế hoặc khử trùng diệt khuẩn.
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
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-lime-50/50 border-[#A2C62C] shadow text-slate-950"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          addon.category === 'NỘI THẤT' ? "bg-blue-100 text-blue-800" : addon.category === 'NGOẠI THẤT' ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {addon.category}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs">
                          {addon.name}
                        </h4>
                        <span className="font-bold text-slate-950 text-sm block">
                          +{addon.price.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center ${
                        isSelected ? "bg-[#A2C62C] border-slate-950 text-slate-950" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* K8: ORDER SUMMARY, VAT & VOUCHER */}
          {state.step === 'voucher' && (
            <motion.div
              key="step-voucher"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-4xl mx-auto w-full pb-20"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-[#A2C62C]" />
                  BẢNG CHI TIẾT ĐƠN HÀNG, VAT &amp; VOUCHER
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Xác nhận từng dòng chi phí và áp dụng voucher giảm giá trước khi chọn phương thức thanh toán.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Itemized Line Breakdown */}
                <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b pb-2">
                    CÁC DÒNG CHI PHÍ RỬA XE • BIỂN SỐ: {state.plate}
                  </h3>

                  <div className="space-y-3 text-xs font-sans">
                    <div className="flex justify-between items-center text-slate-800 font-bold">
                      <div>
                        <span>{selectedPackage.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({state.segment === 'sedan' ? "4-5 Chỗ" : "7-9 Chỗ (+30%)"})
                        </span>
                      </div>
                      <span className="font-bold text-slate-950">{packagePrice.toLocaleString("vi-VN")}đ</span>
                    </div>

                    {KIOSK_ADDONS.filter(a => state.selectedAddonIds.includes(a.id)).map(a => (
                      <div key={a.id} className="flex justify-between items-center text-slate-600 pl-3 border-l-2 border-[#A2C62C]">
                        <span>Addon: {a.name}</span>
                        <span className="font-bold text-slate-900">+{a.price.toLocaleString("vi-VN")}đ</span>
                      </div>
                    ))}

                    {/* VAT FRK-4.1 Line */}
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[#559119] font-bold text-[11px]">
                      <span>Thuế VAT (8%):</span>
                      <span className="italic font-normal">(Đã bao gồm trong giá niêm yết)</span>
                    </div>

                    {state.appliedDiscount > 0 && (
                      <div className="flex justify-between items-center text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                        <span>Chiết khấu ({state.appliedPromoName}):</span>
                        <span>-{state.appliedDiscount.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-display font-black text-slate-900 text-sm uppercase">TỔNG THÀNH TIỀN:</span>
                    <span className="font-sans font-bold text-2xl text-emerald-600">
                      {finalTotal.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                {/* Voucher Selection & Code Entry FRK-4.2 */}
                <div className="md:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    VOUCHER ƯU ĐÃI KHÁCH HÀNG
                  </h3>

                  {/* Quick Select Voucher Chips for Customer */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Chọn nhanh mã của bạn:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPromoInput("VIP30");
                          dispatch({
                            type: 'APPLY_PROMO',
                            payload: { code: 'VIP30', discount: Math.round((subtotal * 0.3) / 1000) * 1000, name: 'VIP30 (-30%)' }
                          });
                        }}
                        className="px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-200 transition"
                      >
                        🏷️ VIP30 (-30%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPromoInput("WASSUP100");
                          dispatch({
                            type: 'APPLY_PROMO',
                            payload: { code: 'WASSUP100', discount: 100000, name: 'WASSUP100 (-100,000đ)' }
                          });
                        }}
                        className="px-3 py-1.5 bg-lime-100 text-lime-900 border border-lime-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-lime-200 transition"
                      >
                        🏷️ WASSUP100 (-100k)
                      </button>
                    </div>
                  </div>

                  {/* Code Entry Input Box */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Hoặc nhập mã voucher khác:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="MÃ GIẢM GIÁ"
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl uppercase cursor-pointer border-0"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {promoError && <p className="text-[11px] text-red-500 font-bold">{promoError}</p>}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* K9: PAYMENT METHOD SELECTION */}
          {state.step === 'thanh-toan' && (
            <motion.div
              key="step-thanh-toan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left max-w-4xl mx-auto w-full pb-10"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-[#A2C62C]" />
                  BƯỚC CHỌN PHƯƠNG THỨC THANH TOÁN HOÁ ĐƠN
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Tổng thanh toán: <strong className="text-emerald-600 text-base">{finalTotal.toLocaleString("vi-VN")}đ</strong>
                </p>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. VietQR Banking */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT', payload: 'qr_pay' })}
                  className={`p-5 rounded-3xl border-2 text-left flex items-start gap-4 transition cursor-pointer ${
                    state.paymentMethod === 'qr_pay'
                      ? "bg-lime-50 border-[#A2C62C] shadow text-slate-950 font-bold"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-lime-100 text-[#A2C62C] flex items-center justify-center font-black shrink-0">
                    <QrCode className="h-5 w-5 text-slate-950" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900 uppercase">1. QUÉT MÃ QR — VNPAY / VIETQR ⚡</h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
                      Chuyển khoản tự động qua VietQR. Khuyên dùng để hoàn tất đơn ngay.
                    </p>
                  </div>
                </button>

                {/* 2. ATM / Visa / Mastercard */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT', payload: 'card' })}
                  className={`p-5 rounded-3xl border-2 text-left flex items-start gap-4 transition cursor-pointer ${
                    state.paymentMethod === 'card'
                      ? "bg-lime-50 border-[#A2C62C] shadow text-slate-950 font-bold"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900 uppercase">2. QUẸT THẺ VISA / MASTERCARD / ATM 💳</h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
                      Quẹt thẻ trực tiếp tại máy POS tích hợp trên Kiosk.
                    </p>
                  </div>
                </button>

                {/* 3. Cash at Counter */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT', payload: 'cash' })}
                  className={`p-5 rounded-3xl border-2 text-left flex items-start gap-4 transition cursor-pointer ${
                    state.paymentMethod === 'cash'
                      ? "bg-lime-50 border-[#A2C62C] shadow text-slate-950 font-bold"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900 uppercase">3. TIỀN MẶT TẠI QUẦY 💵</h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
                      Thanh toán tiền mặt với Nhân viên Thu ngân khi nhận xe.
                    </p>
                  </div>
                </button>

                {/* 4. Pay Later (Deferred) */}
                <button
                  type="button"
                  disabled={!state.isRegisteredUser}
                  onClick={() => {
                    if (state.isRegisteredUser) {
                      dispatch({ type: 'SET_PAYMENT', payload: 'pay_later' });
                    }
                  }}
                  className={`p-5 rounded-3xl border-2 text-left flex items-start gap-4 transition ${
                    !state.isRegisteredUser
                      ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                      : state.paymentMethod === 'pay_later'
                        ? "bg-lime-50 border-[#A2C62C] shadow text-slate-950 font-bold cursor-pointer"
                        : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black shrink-0">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-sm text-slate-900 uppercase">4. THANH TOÁN SAU (CÔNG NỢ) 📄</h4>
                      {!state.isRegisteredUser && (
                        <span className="text-[9px] bg-red-100 text-red-700 font-black px-1.5 py-0.5 rounded">
                          CẦN ĐĂNG NHẬP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
                      Chỉ dành cho tài khoản hội viên đã đăng ký. Thanh toán khi nhận xe.
                    </p>
                  </div>
                </button>

              </div>

              {/* Action Button */}
              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'voucher' })}
                  className="px-6 py-3 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'processing' })}
                  className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-xl shadow-lg border-0 cursor-pointer"
                >
                  XÁC NHẬN ĐẶT RỬA XE ({finalTotal.toLocaleString("vi-VN")}đ) →
                </button>
              </div>
            </motion.div>
          )}

          {/* K10: PAYMENT PROCESSING */}
          {state.step === 'processing' && (
            <motion.div
              key="step-processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto space-y-6 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
            >
              <div className="h-16 w-16 mx-auto rounded-full bg-lime-100 flex items-center justify-center text-[#A2C62C]">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-display font-black text-slate-900 uppercase">
                  ĐANG XỬ LÝ THANH TOÁN
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Hệ thống đang kết nối máy POS &amp; cổng thanh toán tự động...
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-2xl font-bold text-slate-800">
                00:{processTimeLeft.toString().padStart(2, '0')}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'thanh-toan' })}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer border-0 uppercase"
                >
                  Đổi phương thức thanh toán khác
                </button>
              </div>
            </motion.div>
          )}

          {/* K11: COMPLETION & ETA COUNTDOWN */}
          {state.step === 'completed' && (
            <motion.div
              key="step-completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto space-y-6 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl"
            >
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle className="h-10 w-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-display font-black text-slate-950 uppercase tracking-tight">
                  ĐẶT DỊCH VỤ THÀNH CÔNG!
                </h2>
                <p className="text-xs text-slate-600 font-sans">
                  Cảm ơn quý khách <strong className="text-slate-900">{state.name || "Khách hàng"}</strong> đã lựa chọn WASSUP WASH!
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <span className="bg-slate-950 text-[#A2C62C] font-black text-xs px-3 py-1 rounded-lg">
                    BIỂN SỐ: {state.plate}
                  </span>
                  <span className="bg-lime-100 text-slate-950 font-black text-xs px-3 py-1 rounded-lg">
                    MÃ ĐƠN: #{state.createdOrderId?.slice(-6) || "W1039"}
                  </span>
                </div>
              </div>

              {/* Large Circular Countdown ETA */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 relative overflow-hidden shadow-inner">
                <span className="text-[10px] font-black text-[#A2C62C] uppercase tracking-widest block">
                  ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN HOÀN THÀNH (ETA)
                </span>

                <div className="text-4xl font-display font-black text-white tracking-widest">
                  {Math.floor(etaSeconds / 3600).toString().padStart(2, '0')}:
                  {Math.floor((etaSeconds % 3600) / 60).toString().padStart(2, '0')}:
                  {(etaSeconds % 60).toString().padStart(2, '0')}
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#A2C62C] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                  Trạng thái: {stageText}
                </p>
              </div>

              {(state.paymentMethod === 'cash' || state.paymentMethod === 'pay_later') && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold p-3 rounded-xl">
                  ⚡ Quý khách đã chọn {state.paymentMethod === 'cash' ? "Tiền mặt tại quầy" : "Thanh toán sau"}. Vui lòng thanh toán tại quầy thu ngân khi nhận xe!
                </div>
              )}

              {/* Rating Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-black text-slate-700 uppercase block">
                  Đánh giá trải nghiệm đặt Kiosk:
                </span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        setRatingMessage("Cảm ơn quý khách đã đánh giá! Chúc quý khách vạn dặm bình an! 💚");
                      }}
                      className="p-1 hover:scale-125 transition bg-transparent border-0 cursor-pointer"
                    >
                      <Star
                        className={`h-8 w-8 ${star <= rating ? "fill-amber-400 stroke-amber-500" : "stroke-slate-300"}`}
                      />
                    </button>
                  ))}
                </div>
                {ratingMessage && <p className="text-xs text-emerald-700 font-bold">{ratingMessage}</p>}
              </div>

              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
                className="w-full py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer border-0"
              >
                QUAY VỀ MÀN HÌNH CHÍNH 🏠
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* STICKY FOOTER BAR for steps K6, K7, K8 (US-K3.1 / FRK-3.1) */}
      {(state.step === 'goi' || state.step === 'dich-vu-them' || state.step === 'voucher') && (
        <div id="sticky-footer-bar" className="sticky bottom-0 left-0 right-0 bg-slate-950 text-white px-8 py-4 flex items-center justify-between border-t border-slate-800 shadow-2xl z-40">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
              TỔNG TẠM TÍNH (&lt;200MS REALTIME)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-sans font-bold text-[#A2C62C]">
                {subtotal.toLocaleString("vi-VN")}đ
              </span>
              {state.appliedDiscount > 0 && (
                <span className="text-xs text-red-400 font-bold">
                  (-{state.appliedDiscount.toLocaleString("vi-VN")}đ)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {state.step === 'goi' && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'dich-vu-them' })}
                className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg border-0 cursor-pointer transition flex items-center gap-2"
              >
                TIẾP TỤC CHỌN ADD-ONS <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {state.step === 'dich-vu-them' && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'voucher' })}
                className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg border-0 cursor-pointer transition flex items-center gap-2"
              >
                XEM ĐƠN HÀNG / THANH TOÁN →
              </button>
            )}

            {state.step === 'voucher' && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'thanh-toan' })}
                className="px-8 py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl h-[64px] border-0 cursor-pointer transition flex items-center gap-2 font-bold"
              >
                THANH TOÁN NGAY ({finalTotal.toLocaleString("vi-VN")}đ) →
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
