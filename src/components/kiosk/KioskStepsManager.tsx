import React, { useState, useReducer, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Car,
  QrCode,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Tag,
  CreditCard,
  DollarSign,
  History,
  Sparkles,
  Zap,
  KeyRound,
  Delete,
  Eye,
  Star,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  Layers,
  Building2,
  RefreshCw,
  Smartphone,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { simActions, Customer } from "../../lib/supabase/client";
import KioskLiveviewVertical from "./KioskLiveviewVertical";
import KioskDevicePairing from "./KioskDevicePairing";
import WassupLogo from "../common/WassupLogo";

// -------------------------------------------------------------------
// 100% VI-VN LOCALIZED PACKAGES CATALOG (W0 - W5) - STATION OS SYNC
// -------------------------------------------------------------------
export const KIOSK_PACKAGES = [
  {
    id: 'w0',
    code: 'W0',
    name: 'Express',
    badge: null,
    description: 'Rửa nhanh tự động bằng máy rửa WashNOW (ngoại thất)',
    description_md: [
      'Rửa nhanh tự động bằng máy rửa WashNOW (ngoại thất)',
      'Xịt gầm áp lực cao',
      'Sấy khô contour tốc độ cao'
    ],
    duration_min: 10,
    duration_max: 15,
    basePrice: 59000
  },
  {
    id: 'w1',
    code: 'W1',
    name: 'Basic Clean',
    badge: 'KHUYÊN DÙNG ⭐',
    description: 'Rửa nhanh tự động (ngoại thất) • Xịt gầm • Hút bụi cơ bản • Lau kính nội thất',
    description_md: [
      'Rửa nhanh tự động (ngoại thất)',
      'Xịt gầm áp lực cao',
      'Hút bụi cơ bản sàn xe & thảm chân',
      'Lau kính nội thất sạch bóng'
    ],
    duration_min: 15,
    duration_max: 25,
    basePrice: 159000
  },
  {
    id: 'w2',
    code: 'W2',
    name: 'Full Clean',
    badge: 'CAO CẤP ✨',
    description: 'Bao gồm toàn bộ gói W1 • Giặt thảm • Wax bóng • Vệ sinh mâm • Vệ sinh khe kẽ',
    description_md: [
      'Bao gồm toàn bộ gói W1',
      'Giặt sấy thảm lót chân chuyên dụng',
      'Wax bóng bảo vệ bề mặt sơn',
      'Vệ sinh mâm & vệ sinh chi tiết khe kẽ'
    ],
    duration_min: 25,
    duration_max: 35,
    basePrice: 299000,
    isBestSeller: true
  },
  {
    id: 'w3',
    code: 'W3',
    name: 'Super Shine',
    badge: 'KHUYÊN DÙNG ⭐',
    description: 'Bao gồm toàn bộ gói W2 • Dưỡng taplo • Dưỡng nhựa • Dưỡng da ghế',
    description_md: [
      'Bao gồm toàn bộ gói W2',
      'Dưỡng taplo chống lão hóa tia UV',
      'Dưỡng phục hồi nhựa nội ngoại thất',
      'Dưỡng da ghế cao cấp chống nứt nẻ'
    ],
    duration_min: 35,
    duration_max: 50,
    basePrice: 649000
  },
  {
    id: 'w4',
    code: 'W4',
    name: 'Detail Care',
    badge: 'CAO CẤP ✨',
    description: 'Bao gồm toàn bộ gói W3 • Rửa xe chi tiết • Tẩy nhựa đường + Tẩy bụi sơn + Tẩy ố chrome • Dưỡng taplo + dưỡng nhựa + dưỡng da ghế • Phục hồi nhựa ngoại thất • Wax bóng ngoại thất',
    description_md: [
      'Bao gồm toàn bộ gói W3',
      'Rửa xe chi tiết tỉ mỉ từng ngóc ngách',
      'Tẩy nhựa đường + Tẩy bụi sơn + Tẩy ố chrome',
      'Dưỡng taplo + dưỡng nhựa + dưỡng da ghế',
      'Phục hồi nhựa ngoại thất • Wax bóng ngoại thất'
    ],
    duration_min: 50,
    duration_max: 70,
    basePrice: 1699000
  },
  {
    id: 'w5',
    code: 'W5',
    name: 'WASSUP PRIME',
    badge: 'ĐẶC BIỆT',
    description: 'Bao gồm toàn bộ gói W4 • Gói dưỡng • Diệt khuẩn khử mùi ion • Phủ bóng',
    description_md: [
      'Bao gồm toàn bộ gói W4',
      'Gói dưỡng toàn diện cao cấp',
      'Diệt khuẩn khử mùi ion âm',
      'Phủ bóng bảo vệ sơn Ceramic'
    ],
    duration_min: 70,
    duration_max: 90,
    basePrice: 3399000
  }
];

// -------------------------------------------------------------------
// 100% VI-VN LOCALIZED ADD-ONS LIST
// -------------------------------------------------------------------
export const KIOSK_ADDONS = [
  { id: 'add01', category: 'NỘI THẤT', name: 'Hút bụi sâu & vệ sinh khe kẽ nội thất', price: 99000, duration: 10 },
  { id: 'add02', category: 'NỘI THẤT', name: 'Xông khử khuẩn Nano Bạc khoang xe', price: 499000, duration: 15 },
  { id: 'add03', category: 'NỘI THẤT', name: 'Dưỡng da ghế cao cấp chống nứt nẻ', price: 249000, duration: 15 },
  { id: 'add04', category: 'NGOẠI THẤT', name: 'Tẩy ố kính lái & gương chiếu hậu 3M', price: 499000, duration: 20 },
  { id: 'add05', category: 'NGOẠI THẤT', name: 'Tẩy nhựa đường & mạt sắt bám thân xe', price: 399000, duration: 20 },
  { id: 'add06', category: 'NGOẠI THẤT', name: 'Phủ sáp bóng nano kháng nước nhanh', price: 299000, duration: 15 },
  { id: 'add07', category: 'BẢO DƯỠNG', name: 'Vệ sinh & dưỡng bóng khoang động cơ', price: 249000, duration: 25 },
  { id: 'add08', category: 'BẢO DƯỠNG', name: 'Phủ Ceramic kính lái chống bám mưa', price: 599000, duration: 30 }
];

export type KioskStep =
  | 'k0_pairing'
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
  isRegisteredUser: boolean; // true if authenticated
  isNewlyRegistered: boolean; // true if registered during this session (Pay Later blocked per PRD v3.1)
  customerData: any | null;
  plate: string;
  segment: 'sedan' | 'suv';
  segmentSelected: boolean;
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
  | { type: 'SET_CUSTOMER'; payload: { phone: string; name: string; isRegistered?: boolean; isNew?: boolean; data?: any } }
  | { type: 'SET_VEHICLE'; payload: { plate: string; segment: 'sedan' | 'suv'; segmentSelected?: boolean } }
  | { type: 'SET_PACKAGE'; payload: string }
  | { type: 'TOGGLE_ADDON'; payload: string }
  | { type: 'APPLY_PROMO'; payload: { code: string; discount: number; name: string } }
  | { type: 'CLEAR_PROMO' }
  | { type: 'SET_PAYMENT'; payload: 'qr_pay' | 'card' | 'cash' | 'pay_later' }
  | { type: 'COMPLETE_ORDER'; payload: string }
  | { type: 'RESET' };

const getInitialDeviceSession = () => {
  try {
    const stored = localStorage.getItem("wassup_kiosk_device_session");
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null;
};

const initialSession = getInitialDeviceSession();

const initialState: KioskState = {
  step: initialSession ? 'liveview' : 'k0_pairing',
  phone: '',
  name: '',
  pin: '',
  isRegisteredUser: false,
  isNewlyRegistered: false,
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
        isNewlyRegistered: action.payload.isNew !== undefined ? action.payload.isNew : false,
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
      const exists = state.selectedAddonIds.includes(action.payload);
      return {
        ...state,
        selectedAddonIds: exists
          ? state.selectedAddonIds.filter(id => id !== action.payload)
          : [...state.selectedAddonIds, action.payload]
      };
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
      return {
        ...state,
        step: 'completed',
        createdOrderId: action.payload
      };
    case 'RESET': {
      const sess = getInitialDeviceSession();
      return {
        ...initialState,
        step: sess ? 'liveview' : 'k0_pairing'
      };
    }
    default:
      return state;
  }
}

export default function KioskStepsManager() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(kioskReducer, initialState);
  const [deviceSession, setDeviceSession] = useState<any>(initialSession);

  // Secret Admin Trigger (5 consecutive taps on logo within 3s)
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showSecretAdminModal, setShowSecretAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  // Promo state
  const [promoError, setPromoError] = useState("");
  const [promoInput, setPromoInput] = useState("");

  // Idle Timers
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Phone + PIN Login Internal States (K4)
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinMode, setPinMode] = useState<"phone" | "pin_verify">("phone");
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
  const [etaSeconds, setEtaSeconds] = useState(1500); // 25 min default
  const [progressPercent, setProgressPercent] = useState(15);
  const [stageText, setStageText] = useState("Đang chuẩn bị vào khoang rửa");
  const [rating, setRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [completedCountdown, setCompletedCountdown] = useState(20);

  // Listen to device session updates
  useEffect(() => {
    const handleUpdate = () => {
      const sess = getInitialDeviceSession();
      setDeviceSession(sess);
      if (!sess && state.step !== 'k0_pairing') {
        dispatch({ type: 'SET_STEP', payload: 'k0_pairing' });
      }
    };
    window.addEventListener("wassup_kiosk_device_session_updated", handleUpdate);
    return () => window.removeEventListener("wassup_kiosk_device_session_updated", handleUpdate);
  }, [state.step]);

  // INACTIVITY AUTO-RESET: Return to Liveview after 90s of inactivity during ordering
  useEffect(() => {
    const isOrdering = state.step !== 'liveview' && state.step !== 'idle' && state.step !== 'k0_pairing' && state.step !== 'processing' && state.step !== 'completed';
    
    if (!isOrdering) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        // Reset local draft input states on inactivity
        setPhoneInput("");
        setPinInput("");
        setPinMode("phone");
        setPinError("");
        setMatchedCustomer(null);
        setPromoInput("");
        setPromoError("");
        setRegStep(1);
        setRegName("");
        setRegPhone("");
        setRegPin("");
        setRegPinConfirm("");
        setRegError("");
        dispatch({ type: 'RESET' });
      }, 90000);
    };

    // Start 90s inactivity countdown
    resetIdleTimer();

    // Listen to user touch/click/key activity to refresh the 90s timer
    const activityEvents = ['mousedown', 'mousemove', 'touchstart', 'touchend', 'keydown', 'scroll', 'click'];
    const handleActivity = () => {
      resetIdleTimer();
    };

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [state.step]);

  // K11 COMPLETION TIMEOUT: 20 seconds auto reset to K1
  useEffect(() => {
    if (state.step === 'completed') {
      setCompletedCountdown(20);
      const timer = setInterval(() => {
        setCompletedCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            dispatch({ type: 'RESET' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.step]);

  // K10 PROCESSING COUNTDOWN
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.step === 'processing') {
      setProcessTimeLeft(60);
      timer = setInterval(() => {
        setProcessTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleConfirmOrder();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.step]);

  // Calculate pricing
  const selectedPackage = KIOSK_PACKAGES.find(p => p.id === state.selectedPackageId) || KIOSK_PACKAGES[2];
  const isLarge = state.segment === 'suv';
  // 20% surcharge for 7-9 seats / SUV
  const packagePrice = Math.round((selectedPackage.basePrice * (isLarge ? 1.2 : 1)) / 1000) * 1000;
  const addonsTotal = KIOSK_ADDONS
    .filter(a => state.selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  
  const subtotal = packagePrice + addonsTotal;
  const finalTotal = Math.max(subtotal - state.appliedDiscount, 0);

  // Total duration in minutes
  const totalDurationMin = selectedPackage.duration_min + KIOSK_ADDONS
    .filter(a => state.selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + (a.duration || 10), 0);

  // Database vehicles lookup for current customer account
  const allDbCustomers = simActions.getCustomers();
  const activeCustomer = (state.phone
    ? allDbCustomers.find(c => c.phone.replace(/\D/g, "") === state.phone.replace(/\D/g, ""))
    : null) || state.customerData || matchedCustomer;

  let accountVehicles: {
    plate: string;
    vehicleClass: 'sedan' | 'suv' | 'truck';
    car_brand?: string;
    car_model?: string;
  }[] = [];

  if (activeCustomer?.vehicles && activeCustomer.vehicles.length > 0) {
    accountVehicles = activeCustomer.vehicles;
  } else if (activeCustomer?.licensePlates && activeCustomer.licensePlates.length > 0) {
    accountVehicles = activeCustomer.licensePlates.map((lp: string, idx: number) => ({
      plate: lp,
      vehicleClass: (activeCustomer.vehicleSegment || (idx % 2 === 1 ? 'suv' : 'sedan')) as 'sedan' | 'suv',
      car_brand: idx === 0 ? 'Xe chính' : 'Xe phụ'
    }));
  } else if (activeCustomer?.licensePlate) {
    accountVehicles = [{
      plate: activeCustomer.licensePlate,
      vehicleClass: (activeCustomer.vehicleSegment || 'sedan') as 'sedan' | 'suv',
      car_brand: 'Xe đã lưu'
    }];
  } else {
    // Newly registered or no saved vehicles for this customer
    accountVehicles = [];
  }

  // 100% Registration Policy: Enforce mandatory customer authentication
  useEffect(() => {
    const orderingSteps: KioskStep[] = ['xe', 'goi', 'dich-vu-them', 'voucher', 'thanh-toan', 'processing'];
    if (orderingSteps.includes(state.step) && (!state.phone || !state.isRegisteredUser)) {
      dispatch({ type: 'SET_STEP', payload: 'auth-method' });
    }
  }, [state.step, state.phone, state.isRegisteredUser]);

  // Logo tap trigger for Secret Admin Modal
  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 800) {
      const newCount = secretTapCount + 1;
      setSecretTapCount(newCount);
      if (newCount >= 5) {
        setShowSecretAdminModal(true);
        setSecretTapCount(0);
        setAdminPinInput("");
        setAdminAuthError("");
        setAdminAuthenticated(false);
      }
    } else {
      setSecretTapCount(1);
    }
    setLastTapTime(now);
  };

  // Secret Admin PIN check
  const handleVerifyAdminPin = () => {
    if (adminPinInput === "1234" || adminPinInput === "0000" || adminPinInput === "8888") {
      setAdminAuthenticated(true);
      setAdminAuthError("");
    } else {
      setAdminAuthError("Mã PIN Quản lý không đúng (Thử mã: 1234).");
    }
  };

  // Revoke device pairing action
  const handleRevokePairing = () => {
    if (deviceSession?.deviceId) {
      simActions.revokeKioskDevice(deviceSession.deviceId);
    } else {
      localStorage.removeItem("wassup_kiosk_device_session");
    }
    setDeviceSession(null);
    setShowSecretAdminModal(false);
    dispatch({ type: 'SET_STEP', payload: 'k0_pairing' });
  };

  // Phone + PIN Handlers (K4)
  const handlePhoneDigit = (digit: string) => {
    if (phoneInput.length < 10) {
      setPhoneInput(prev => prev + digit);
      setPinError("");
    }
  };

  const handlePhoneBackspace = () => {
    setPhoneInput(prev => prev.slice(0, -1));
    setPinError("");
  };

  const handlePhoneCheck = () => {
    if (phoneInput.length < 9) {
      setPinError("Vui lòng nhập đủ số điện thoại.");
      return;
    }

    const customers = simActions.getCustomers();
    const match = customers.find(c => c.phone.replace(/\D/g, "") === phoneInput.replace(/\D/g, ""));

    if (match) {
      setMatchedCustomer(match);
      setPinMode("pin_verify");
      setPinInput("");
      setPinError("");
    } else {
      // Auto-advance to K4b registration with prefilled phone!
      setRegPhone(phoneInput);
      setRegName("");
      setRegPin("");
      setRegPinConfirm("");
      setRegStep(1);
      dispatch({ type: 'SET_STEP', payload: 'register' });
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError("");

      if (next.length === 4 || next.length === 6) {
        // Auto check pin if 4 digits
        setTimeout(() => {
          verifyPinAttempt(next);
        }, 300);
      }
    }
  };

  const verifyPinAttempt = (enteredPin: string) => {
    if (isLocked) {
      setPinError("Tài khoản đang bị tạm khóa 5 phút do nhập sai PIN quá 5 lần.");
      return;
    }

    // Default pin "1234" or match customer pin
    const correctPin = matchedCustomer?.pin || "1234";

    if (enteredPin === correctPin || enteredPin === "1234") {
      // Authenticated!
      dispatch({
        type: 'SET_CUSTOMER',
        payload: {
          phone: matchedCustomer.phone,
          name: matchedCustomer.name,
          isRegistered: true,
          isNew: false,
          data: matchedCustomer
        }
      });

      // Prefill vehicle if customer has vehicles or licensePlate
      const primaryVehicle = matchedCustomer.vehicles?.[0];
      const initialPlate = primaryVehicle?.plate || matchedCustomer.licensePlate;
      if (initialPlate) {
        const isSuv = primaryVehicle?.vehicleClass === 'suv' || primaryVehicle?.vehicleClass === 'truck' || matchedCustomer.vehicleSegment === 'suv';
        dispatch({
          type: 'SET_VEHICLE',
          payload: {
            plate: initialPlate,
            segment: isSuv ? 'suv' : 'sedan',
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
        setPinError("Đã nhập sai PIN 5 lần! Tài khoản tạm khóa 5 phút. Vui lòng liên hệ quầy thu ngân.");
      } else {
        setPinError(`Mã PIN không đúng! Còn ${5 - attempts} lần thử (Thử PIN: 1234).`);
      }
    }
  };

  // Register New Customer Action (K4b)
  const handleCompleteRegistration = () => {
    if (!regName.trim()) {
      setRegError("Vui lòng nhập Họ và Tên.");
      return;
    }
    if (!regPhone.trim() || regPhone.length < 9) {
      setRegError("Số điện thoại không hợp lệ.");
      return;
    }
    if (regPin.length < 4) {
      setRegError("Mã PIN bảo mật tối thiểu 4 chữ số.");
      return;
    }
    if (regPin !== regPinConfirm) {
      setRegError("Xác nhận mã PIN không khớp.");
      return;
    }

    // Persist new member in DB
    const newCust = simActions.addCustomer({
      name: regName.trim(),
      phone: regPhone.trim(),
      licensePlate: state.plate || "51G-888.88",
      vehicleSegment: state.segment,
      supPoints: 100 // Welcome points
    });

    // Mark as newly registered in this session!
    dispatch({
      type: 'SET_CUSTOMER',
      payload: {
        phone: newCust.phone,
        name: newCust.name,
        isRegistered: true,
        isNew: true, // IMPORTANT: disables Pay Later
        data: newCust
      }
    });

    dispatch({ type: 'SET_STEP', payload: 'xe' });
  };

  // Promo application
  const handleApplyPromo = () => {
    setPromoError("");
    if (!promoInput.trim()) return;
    const code = promoInput.toUpperCase().trim();

    if (code === "WASSUP100") {
      dispatch({
        type: 'APPLY_PROMO',
        payload: { code, discount: 100000, name: "WASSUP100 (-100.000đ)" }
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

  // Confirm order & create in database
  const handleConfirmOrder = () => {
    const orderResult = simActions.createOrder({
      customerPhone: state.phone || undefined,
      customerName: state.name || "Khách Hàng Kiosk",
      licensePlate: state.plate || "51G-888.88",
      vehicleSegment: state.segment,
      packageCode: selectedPackage.code,
      subtotal: subtotal,
      discount: state.appliedDiscount,
      total: finalTotal,
      paymentMethod: state.paymentMethod,
      channel: 'kiosk'
    });

    if (orderResult && orderResult.orderId) {
      dispatch({ type: 'COMPLETE_ORDER', payload: orderResult.orderId });
    }
  };

  // Navigation: Quay lại màn hình trước
  const handleGoBack = () => {
    switch (state.step) {
      case 'auth-method':
      case 'phone-login':
      case 'qr-login':
        if (pinMode === 'pin_verify') {
          setPinMode('phone');
          setPinInput('');
          setPinError('');
        } else {
          setPinMode('phone');
          setPhoneInput('');
          setPinInput('');
          setPinError('');
          setMatchedCustomer(null);
          dispatch({ type: 'SET_STEP', payload: 'liveview' });
        }
        break;
      case 'liveview':
        break;
      case 'register':
        dispatch({ type: 'SET_STEP', payload: 'auth-method' });
        break;
      case 'xe':
        dispatch({ type: 'SET_STEP', payload: 'auth-method' });
        break;
      case 'goi':
        dispatch({ type: 'SET_STEP', payload: 'xe' });
        break;
      case 'dich-vu-them':
        dispatch({ type: 'SET_STEP', payload: 'goi' });
        break;
      case 'voucher':
        dispatch({ type: 'SET_STEP', payload: 'dich-vu-them' });
        break;
      case 'thanh-toan':
        dispatch({ type: 'SET_STEP', payload: 'voucher' });
        break;
      default:
        dispatch({ type: 'SET_STEP', payload: 'liveview' });
        break;
    }
  };

  return (
    <div 
      id="kiosk-touch-container" 
      className="w-full max-w-6xl mx-auto bg-white min-h-screen md:h-screen md:h-[100dvh] flex flex-col justify-between text-slate-800 shadow-none sm:shadow-2xl border-0 sm:border-x sm:border-stone-200 overflow-hidden relative select-none"
    >
      
      {/* KIOSK TOP BRAND HEADER WITH 5-TAP SECRET ADMIN TRIGGER */}
      <header className="w-full pt-6 pb-2 px-6 flex flex-col items-center justify-center relative bg-gradient-to-b from-stone-50 to-white border-b border-stone-100">
        <div 
          onClick={handleLogoTap}
          title="Chạm 5 lần để mở Cài đặt Trạm Quản trị viên"
          className="cursor-pointer active:scale-95 transition-transform"
        >
          <WassupLogo
            id="kiosk-header-logo"
            className="h-12 sm:h-14 w-auto mx-auto filter drop-shadow-sm select-none"
          />
        </div>

        {/* Station Name & Pairing Status Indicator */}
        {deviceSession && state.step !== 'k0_pairing' && (
          <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-sans text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#A2C62C] animate-pulse" />
            <strong className="text-slate-800 font-display uppercase tracking-wider">{deviceSession.stationName}</strong>
          </div>
        )}
      </header>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 relative overflow-y-auto flex flex-col justify-start">
        <AnimatePresence mode="wait">

          {/* ========================================================= */}
          {/* STEP K0: DEVICE PAIRING (GHÉP ĐÔI THIẾT BỊ)               */}
          {/* ========================================================= */}
          {state.step === 'k0_pairing' && (
            <motion.div
              key="step-k0"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <KioskDevicePairing
                onPairSuccess={(session) => {
                  setDeviceSession(session);
                  dispatch({ type: 'SET_STEP', payload: 'liveview' });
                }}
              />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K1: LIVEVIEW AS DEFAULT IDLE SCREEN                  */}
          {/* ========================================================= */}
          {(state.step === 'liveview' || state.step === 'idle') && (
            <motion.div
              key="step-liveview"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="w-full"
            >
              <KioskLiveviewVertical
                stationName={deviceSession?.stationName}
                onStartOrder={() => {
                  setPinMode("phone");
                  setPhoneInput("");
                  setPinInput("");
                  setPinError("");
                  setMatchedCustomer(null);
                  dispatch({ type: 'SET_STEP', payload: 'auth-method' });
                }}
              />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K2: GOM ĐĂNG NHẬP SĐT VÀ QUÉT MÃ QR TRÊN 1 MÀN HÌNH (2 CỘT TỶ LỆ 8:4) */}
          {/* ========================================================= */}
          {(state.step === 'auth-method' || state.step === 'phone-login' || state.step === 'qr-login') && (
            <motion.div
              key="step-unified-auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full py-1 space-y-6 sm:space-y-8"
            >
              {/* UNIFIED HEADER PATTERN */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 uppercase tracking-tight">
                    {pinMode === "phone" ? "XÁC THỰC TÀI KHOẢN HỘI VIÊN" : "XÁC THỰC MÃ PIN BẢO MẬT"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 font-sans font-medium mt-1">
                    {pinMode === "phone"
                      ? "Nhập số điện thoại hoặc quét mã QR trên App WASSUP để nhận ưu đãi và tải thông tin xe."
                      : `Xin chào ${matchedCustomer?.name || "Quý khách"}! Vui lòng nhập mã PIN bảo mật 4 chữ số.`}
                  </p>
                </div>

                <div className="bg-[#0b131f] text-[#A2C62C] font-mono font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span>TRẠM: {deviceSession?.stationName || "WASSUP TÂN BÌNH"}</span>
                </div>
              </div>

              {/* -------------------------------------------------- */}
              {/* LAYOUT 2 CỘT TỶ LỆ 8:4 (TRÁI: PHONE LOGIN, PHẢI: QR LOGIN) */}
              {/* -------------------------------------------------- */}
              <div 
                id="kiosk-auth-unified-grid"
                className="grid grid-cols-12 gap-4 sm:gap-5 items-stretch text-left"
              >
                {/* CỘT TRÁI (8/12): LOGIN BẰNG SỐ ĐIỆN THOẠI (HOẶC PIN NẾU ĐÃ NHẬP SĐT) */}
                <div 
                  id="kiosk-auth-phone-col"
                  className="col-span-12 md:col-span-8 bg-white border-2 border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5"
                >
                  {pinMode === "phone" ? (
                    <div className="space-y-3 flex flex-col justify-between h-full">
                      {/* Tiêu đề & Hướng dẫn cột Phone */}
                      <div className="flex items-center justify-between pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-lime-100 text-forest-green flex items-center justify-center shrink-0 shadow-2xs">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide">
                              ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI
                            </h3>
                          </div>
                        </div>                  
                      </div>

                      {/* Phone Display Box */}
                      <div className="py-2.5 px-4 bg-stone-50 border-2 border-stone-200 focus-within:border-[#A2C62C] focus-within:bg-white rounded-2xl text-2xl sm:text-3xl font-sans font-black text-slate-950 tracking-wider min-h-[58px] flex items-center justify-between shadow-2xs transition">
                        <div className="flex items-center gap-3">
                          <span id="kiosk-phone-display" className="tracking-widest font-black">
                            {phoneInput || <span className="text-stone-300 text-xl text-center font-display">09xx xxx xxx</span>}
                          </span>
                        </div>
                        {phoneInput && (
                          <button
                            type="button"
                            onClick={() => setPhoneInput("")}
                            className="text-stone-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-stone-200/60 transition cursor-pointer border-0 bg-transparent"
                            title="Xóa nhanh"
                          >
                            <Delete className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Error Alert */}
                      {pinError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-left animate-shake">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{pinError}</span>
                        </div>
                      )}

                      {/* Touch Dialpad Grid (3x4) - Full width tràn đều container, gap trên dưới trái phải bằng nhau tuyệt đối */}
                      <div className="grid grid-cols-3 grid-rows-4 gap-2.5 w-full flex-1">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                          <button
                            key={`dial-${num}`}
                            type="button"
                            id={`dialpad-btn-${num}`}
                            onClick={() => handlePhoneDigit(num)}
                            className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-[#A2C62C] active:text-slate-950 text-slate-900 font-display font-black text-2xl transition-all flex items-center justify-center border-0 cursor-pointer shadow-2xs active:scale-95"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          id="dialpad-btn-clear"
                          onClick={() => {
                            setPhoneInput("");
                            setPinError("");
                          }}
                          className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-500 font-display font-bold text-xs sm:text-sm uppercase transition flex items-center justify-center border-0 cursor-pointer active:scale-95"
                        >
                          XÓA HẾT
                        </button>
                        <button
                          type="button"
                          id="dialpad-btn-0"
                          onClick={() => handlePhoneDigit("0")}
                          className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-[#A2C62C] active:text-slate-950 text-slate-900 font-display font-black text-2xl transition-all flex items-center justify-center border-0 cursor-pointer shadow-2xs active:scale-95"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          id="dialpad-btn-backspace"
                          onClick={() => handlePhoneBackspace()}
                          className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition flex items-center justify-center border-0 cursor-pointer active:scale-95"
                        >
                          <Delete className="h-6 w-6" />
                        </button>
                      </div>

                      {/* NÚT TIẾP TỤC */}
                      <button
                        type="button"
                        id="btn-kiosk-phone-continue"
                        onClick={handlePhoneCheck}
                        disabled={phoneInput.length < 9}
                        className={`w-full py-3.5 sm:py-4 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-0 shadow-md cursor-pointer ${
                          phoneInput.length >= 9
                            ? "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-lime-200 active:scale-[0.99]"
                            : "bg-stone-200 text-stone-400 cursor-not-allowed"
                        }`}
                      >
                        <span>TIẾP TỤC KIỂM TRA TÀI KHOẢN</span>
                        <ArrowRight className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  ) : (
                    /* PIN Verify Mode in Left Column */
                    <div className="space-y-3 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-lime-100 text-forest-green flex items-center justify-center shrink-0 shadow-2xs">
                            <KeyRound className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide">
                              XÁC THỰC MÃ PIN BẢO MẬT
                            </h3>
                            <p className="text-[11px] text-slate-500 font-sans">
                              Khách hàng: <span className="font-bold text-slate-900">{matchedCustomer?.name}</span> ({matchedCustomer?.phone})
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-forest-green bg-[#A2C62C]/20 border border-[#A2C62C]/30 px-2 py-0.5 rounded-full font-display uppercase">
                          MÃ PIN 4 SỐ
                        </span>
                      </div>

                      {/* PIN Display Dots */}
                      <div className="py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl flex items-center justify-center gap-3 min-h-[58px] shadow-inner">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={`pin-dot-${idx}`}
                            className={`h-4 w-4 rounded-full transition-all ${
                              pinInput.length > idx
                                ? "bg-[#A2C62C] ring-4 ring-[#A2C62C]/30 scale-125"
                                : "bg-stone-300"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Error Alert */}
                      {pinError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-left animate-shake">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{pinError}</span>
                        </div>
                      )}

                      {/* Touch Dialpad Grid for PIN - Full width tràn đều container, gap trên dưới trái phải bằng nhau tuyệt đối */}
                      <div className="grid grid-cols-3 grid-rows-4 gap-2.5 w-full flex-1">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                          <button
                            key={`dial-pin-${num}`}
                            type="button"
                            onClick={() => handlePinDigit(num)}
                            className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-[#A2C62C] active:text-slate-950 text-slate-900 font-display font-black text-2xl transition-all flex items-center justify-center border-0 cursor-pointer shadow-2xs active:scale-95"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setPinInput("");
                            setPinError("");
                          }}
                          className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-500 font-display font-bold text-xs sm:text-sm uppercase transition flex items-center justify-center border-0 cursor-pointer active:scale-95"
                        >
                          XÓA HẾT
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinDigit("0")}
                          className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-[#A2C62C] active:text-slate-950 text-slate-900 font-display font-black text-2xl transition-all flex items-center justify-center border-0 cursor-pointer shadow-2xs active:scale-95"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPinInput(prev => prev.slice(0, -1));
                            setPinError("");
                          }}
                          className="w-full h-full min-h-[54px] sm:min-h-[58px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition flex items-center justify-center border-0 cursor-pointer active:scale-95"
                        >
                          <Delete className="h-6 w-6" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPinMode("phone");
                          setPinInput("");
                          setPinError("");
                        }}
                        className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 font-display font-bold text-xs uppercase rounded-xl transition cursor-pointer border-0"
                      >
                        ← Nhập số điện thoại khác
                      </button>
                    </div>
                  )}
                </div>

                {/* CỘT PHẢI (4/12): LOGIN BẰNG QR */}
                <div 
                  id="kiosk-auth-qr-col"
                  className="col-span-12 md:col-span-4 bg-white border-2 border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  {/* Header Cột QR */}
                  <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-lime-100 text-forest-green flex items-center justify-center shrink-0 shadow-2xs">
                        <QrCode className="h-4 w-4" />
                      </div>
                        <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide">
                          ĐĂNG NHẬP BẰNG QR 
                        </h3>
                    </div>
                  </div>

                    {/* QR Code Container */}
                    <div className="p-3.5 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      {/* Crisp Vector QR Code Graphic */}
                      <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                          {/* Top-left position pattern */}
                          <rect x="5" y="5" width="28" height="28" rx="4" fill="currentColor" />
                          <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                          <rect x="13" y="13" width="12" height="12" rx="2" fill="currentColor" />

                          {/* Top-right position pattern */}
                          <rect x="67" y="5" width="28" height="28" rx="4" fill="currentColor" />
                          <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                          <rect x="75" y="13" width="12" height="12" rx="2" fill="currentColor" />

                          {/* Bottom-left position pattern */}
                          <rect x="5" y="67" width="28" height="28" rx="4" fill="currentColor" />
                          <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                          <rect x="13" y="75" width="12" height="12" rx="2" fill="currentColor" />

                          {/* Timing patterns */}
                          <rect x="37" y="7" width="4" height="4" rx="1" />
                          <rect x="45" y="7" width="4" height="4" rx="1" />
                          <rect x="53" y="7" width="4" height="4" rx="1" />
                          <rect x="59" y="7" width="4" height="4" rx="1" />
                          <rect x="7" y="37" width="4" height="4" rx="1" />
                          <rect x="7" y="45" width="4" height="4" rx="1" />
                          <rect x="7" y="53" width="4" height="4" rx="1" />
                          <rect x="7" y="59" width="4" height="4" rx="1" />

                          {/* Alignment pattern */}
                          <rect x="67" y="67" width="18" height="18" rx="3" fill="currentColor" />
                          <rect x="71" y="71" width="10" height="10" rx="1.5" fill="white" />
                          <rect x="74" y="74" width="4" height="4" rx="1" fill="currentColor" />

                          {/* Dense QR matrix data dots */}
                          <rect x="37" y="17" width="4" height="4" rx="1" />
                          <rect x="43" y="17" width="4" height="4" rx="1" />
                          <rect x="51" y="17" width="4" height="4" rx="1" />
                          <rect x="57" y="17" width="4" height="4" rx="1" />

                          <rect x="37" y="25" width="4" height="4" rx="1" />
                          <rect x="47" y="25" width="4" height="4" rx="1" />
                          <rect x="55" y="25" width="4" height="4" rx="1" />

                          <rect x="17" y="37" width="4" height="4" rx="1" />
                          <rect x="25" y="37" width="4" height="4" rx="1" />
                          <rect x="37" y="37" width="4" height="4" rx="1" />
                          <rect x="43" y="37" width="4" height="4" rx="1" />
                          <rect x="57" y="37" width="4" height="4" rx="1" />
                          <rect x="65" y="37" width="4" height="4" rx="1" />
                          <rect x="75" y="37" width="4" height="4" rx="1" />
                          <rect x="85" y="37" width="4" height="4" rx="1" />

                          <rect x="17" y="45" width="4" height="4" rx="1" />
                          <rect x="25" y="45" width="4" height="4" rx="1" />
                          <rect x="35" y="45" width="4" height="4" rx="1" />
                          <rect x="63" y="45" width="4" height="4" rx="1" />
                          <rect x="71" y="45" width="4" height="4" rx="1" />
                          <rect x="81" y="45" width="4" height="4" rx="1" />

                          <rect x="17" y="55" width="4" height="4" rx="1" />
                          <rect x="25" y="55" width="4" height="4" rx="1" />
                          <rect x="37" y="55" width="4" height="4" rx="1" />
                          <rect x="57" y="55" width="4" height="4" rx="1" />
                          <rect x="65" y="55" width="4" height="4" rx="1" />
                          <rect x="77" y="55" width="4" height="4" rx="1" />
                          <rect x="87" y="55" width="4" height="4" rx="1" />

                          <rect x="37" y="65" width="4" height="4" rx="1" />
                          <rect x="47" y="65" width="4" height="4" rx="1" />
                          <rect x="55" y="65" width="4" height="4" rx="1" />

                          <rect x="37" y="75" width="4" height="4" rx="1" />
                          <rect x="45" y="75" width="4" height="4" rx="1" />
                          <rect x="55" y="75" width="4" height="4" rx="1" />

                          <rect x="37" y="85" width="4" height="4" rx="1" />
                          <rect x="47" y="85" width="4" height="4" rx="1" />
                          <rect x="53" y="85" width="4" height="4" rx="1" />
                          <rect x="89" y="89" width="4" height="4" rx="1" />

                          {/* Center WASSUP Badge */}
                          <rect x="38" y="38" width="24" height="24" rx="6" fill="#A2C62C" />
                          <path d="M43 45L46.5 55L50 48L53.5 55L57 45" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </div>
                    </div>

                    {/* Hướng dẫn quét */}
                    <div className="mt-3 text-center space-y-1">
                      <p className="text-[10px] text-slate-500 font-sans leading-tight">
                        Mở Camera điện thoại hoặc app WASSUP quét mã QR trên để đăng nhập
                      </p>
                    </div>

                  {/* Quick Simulated Scan Samples */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-display">
                      ⚡ Mô phỏng điện thoại khách quét mã:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allC = simActions.getCustomers();
                          const c1 = allC.find(c => c.phone === "0901234567") || allC[0];
                          const v1 = c1.vehicles?.[0];
                          const isSuv = v1?.vehicleClass === 'suv' || v1?.vehicleClass === 'truck';
                          dispatch({
                            type: 'SET_CUSTOMER',
                            payload: { phone: c1.phone, name: c1.name, isRegistered: true, isNew: false, data: c1 }
                          });
                          dispatch({
                            type: 'SET_VEHICLE',
                            payload: { plate: v1?.plate || c1.licensePlate || "30A-123.45", segment: isSuv ? 'suv' : 'sedan', segmentSelected: true }
                          });
                          dispatch({ type: 'SET_STEP', payload: 'xe' });
                        }}
                        className="p-2.5 bg-stone-50 hover:bg-lime-50 text-slate-800 text-[11px] font-bold rounded-xl border border-stone-200 hover:border-[#A2C62C] transition flex items-center justify-between cursor-pointer shadow-2xs active:scale-95"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Smartphone className="h-3.5 w-3.5 text-forest-green shrink-0" />
                          <span className="truncate">ĐT Trần Minh Quân quét</span>
                        </div>
                        <span className="font-sans font-black text-forest-green text-[10px] shrink-0 ml-1">30A-123.45 →</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const allC = simActions.getCustomers();
                          const c2 = allC.find(c => c.phone === "0911223344") || allC[1];
                          const v2 = c2.vehicles?.[0];
                          const isSuv = v2?.vehicleClass === 'suv' || v2?.vehicleClass === 'truck';
                          dispatch({
                            type: 'SET_CUSTOMER',
                            payload: { phone: c2.phone, name: c2.name, isRegistered: true, isNew: false, data: c2 }
                          });
                          dispatch({
                            type: 'SET_VEHICLE',
                            payload: { plate: v2?.plate || c2.licensePlate || "51G-999.99", segment: isSuv ? 'suv' : 'sedan', segmentSelected: true }
                          });
                          dispatch({ type: 'SET_STEP', payload: 'xe' });
                        }}
                        className="p-2.5 bg-stone-50 hover:bg-lime-50 text-slate-800 text-[11px] font-bold rounded-xl border border-stone-200 hover:border-[#A2C62C] transition flex items-center justify-between cursor-pointer shadow-2xs active:scale-95"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Smartphone className="h-3.5 w-3.5 text-forest-green shrink-0" />
                          <span className="truncate">ĐT Nguyễn Thị Bích quét</span>
                        </div>
                        <span className="font-sans font-black text-forest-green text-[10px] shrink-0 ml-1">51G-999.99 →</span>
                      </button>
                    </div>
                  </div>

                  {/* Helper Info Footer */}
                  <div className="bg-lime-50/70 border border-[#A2C62C]/30 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-forest-green font-sans font-medium">
                      ✓ Tích điểm SUP nhanh chóng
                    </p>
                  </div>
                </div>
              </div>

              {/* UNIFIED BOTTOM NAVIGATION BAR */}
              <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-auto">
                <button
                  type="button"
                  id="btn-kiosk-auth-back-to-idle"
                  onClick={handleGoBack}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                  <span>QUAY LẠI</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    id="btn-kiosk-go-to-register"
                    onClick={() => {
                      setRegPhone(phoneInput || "");
                      setRegName("");
                      setRegPin("");
                      setRegPinConfirm("");
                      setRegStep(1);
                      dispatch({ type: 'SET_STEP', payload: 'register' });
                    }}
                    className="px-5 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-display font-black text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY ➔</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K4b: ĐĂNG KÝ TÀI KHOẢN MỚI (3 BƯỚC TUẦN TỰ)          */}
          {/* ========================================================= */}
          {state.step === 'register' && (
            <motion.div
              key="step-register"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md mx-auto space-y-6 text-center"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
                  🎁 TẶNG NGAY 100 ĐIỂM SUP KHI ĐĂNG KÝ
                </span>
                <h2 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">
                  ĐĂNG KÝ HỘI VIÊN MỚI
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Chỉ mất 30 giây để hoàn tất và nhận quyền lợi rửa xe thông minh.
                </p>
              </div>

              {/* Stepper Progress */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold">
                <span className={`px-3 py-1 rounded-full ${regStep === 1 ? 'bg-slate-950 text-[#A2C62C]' : 'bg-stone-200 text-slate-500'}`}>
                  1. Họ Tên
                </span>
                <span className="text-stone-300">→</span>
                <span className={`px-3 py-1 rounded-full ${regStep === 2 ? 'bg-slate-950 text-[#A2C62C]' : 'bg-stone-200 text-slate-500'}`}>
                  2. Số ĐT
                </span>
                <span className="text-stone-300">→</span>
                <span className={`px-3 py-1 rounded-full ${regStep === 3 ? 'bg-slate-950 text-[#A2C62C]' : 'bg-stone-200 text-slate-500'}`}>
                  3. Mã PIN
                </span>
              </div>

              {/* Step Content */}
              <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 space-y-4 text-left">
                {regStep === 1 && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      HỌ VÀ TÊN KHÁCH HÀNG:
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        setRegError("");
                      }}
                      placeholder="Ví dụ: Nguyễn Văn Hùng"
                      className="w-full px-4 py-3.5 bg-white border-2 border-stone-300 rounded-2xl font-sans text-slate-900 font-bold text-base focus:border-[#A2C62C] focus:outline-none"
                    />
                  </div>
                )}

                {regStep === 2 && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      XÁC NHẬN SỐ ĐIỆN THOẠI:
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        setRegError("");
                      }}
                      placeholder="09xx xxx xxx"
                      className="w-full px-4 py-3.5 bg-white border-2 border-stone-300 rounded-2xl font-mono text-slate-900 font-bold text-base focus:border-[#A2C62C] focus:outline-none"
                    />
                  </div>
                )}

                {regStep === 3 && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                        THIẾT LẬP MÃ PIN (4–6 SỐ):
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={regPin}
                        onChange={(e) => {
                          setRegPin(e.target.value);
                          setRegError("");
                        }}
                        placeholder="••••"
                        className="w-full px-4 py-3 bg-white border-2 border-stone-300 rounded-2xl font-mono text-center text-slate-900 font-black text-xl focus:border-[#A2C62C] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                        NHẬP LẠI MÃ PIN ĐỂ XÁC NHẬN:
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={regPinConfirm}
                        onChange={(e) => {
                          setRegPinConfirm(e.target.value);
                          setRegError("");
                        }}
                        placeholder="••••"
                        className="w-full px-4 py-3 bg-white border-2 border-stone-300 rounded-2xl font-mono text-center text-slate-900 font-black text-xl focus:border-[#A2C62C] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {regError && (
                  <p className="text-xs text-red-600 font-bold">{regError}</p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {regStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (regStep === 1) {
                        if (!regName.trim()) {
                          setRegError("Vui lòng nhập họ và tên của bạn.");
                          return;
                        }
                        setRegStep(2);
                      } else if (regStep === 2) {
                        if (!regPhone.trim() || regPhone.length < 9) {
                          setRegError("Vui lòng nhập số điện thoại hợp lệ.");
                          return;
                        }
                        setRegStep(3);
                      }
                    }}
                    className="w-full py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer border-0"
                  >
                    TIẾP TỤC →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteRegistration}
                    className="w-full py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer border-0"
                  >
                    HOÀN TẤT ĐĂNG KÝ &amp; ĐẶT XE ✓
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (regStep > 1) {
                      setRegStep((prev) => (prev - 1) as any);
                    } else {
                      dispatch({ type: 'SET_STEP', payload: 'auth-method' });
                    }
                  }}
                  className="py-2.5 px-6 text-slate-400 hover:text-slate-700 text-xs font-bold uppercase rounded-xl transition cursor-pointer bg-transparent border-0"
                >
                  Quay lại
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K5: XÁC NHẬN BIỂN SỐ XE & PHÂN KHÚC (VEHICLE STEP)     */}
          {/* ========================================================= */}
          {state.step === 'xe' && (
            <motion.div
              key="step-xe"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full py-1 space-y-6 sm:space-y-8"
            >
              {/* UNIFIED HEADER PATTERN */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 uppercase tracking-tight">
                    BƯỚC 1: XÁC NHẬN BIỂN SỐ &amp; PHÂN KHÚC XE
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 font-sans font-medium mt-1">
                    Nhập hoặc chọn biển số xe để quy chuẩn kích cỡ và áp dụng bảng giá dịch vụ phù hợp.
                  </p>
                </div>

                <div className="bg-[#0b131f] text-[#A2C62C] font-mono font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span>HỘI VIÊN: {state.name || state.phone || "HỘI VIÊN WASSUP"}</span>
                </div>
              </div>

              {/* 2 COLUMNS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1">
                {/* CỘT TRÁI: BIỂN SỐ XE */}
                <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                        NHẬP BIỂN SỐ XE TIẾP NHẬN:
                      </label>
                      <span className="text-[11px] font-sans font-bold text-forest-green bg-lime-50 px-2 py-0.5 rounded-md border border-[#A2C62C]/30">
                        BẮT BUỘC
                      </span>
                    </div>

                    <input
                      type="text"
                      value={state.plate}
                      onChange={(e) => dispatch({
                        type: 'SET_VEHICLE',
                        payload: { plate: e.target.value.toUpperCase(), segment: state.segment, segmentSelected: state.segmentSelected }
                      })}
                      placeholder="VD: 51G-888.88"
                      className="w-full py-4 px-4 text-center bg-stone-50 text-slate-950 font-display font-black text-3xl tracking-widest rounded-2xl border-2 border-stone-300 focus:border-[#A2C62C] focus:bg-white focus:outline-none uppercase shadow-inner transition"
                    />

                    {/* Chọn nhanh xe đã lưu trong tài khoản */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          XE TRONG TÀI KHOẢN CỦA BẠN:
                        </label>
                        <span className="text-[11px] font-sans text-slate-500 font-semibold">
                          {accountVehicles.length} xe khả dụng
                        </span>
                      </div>

                      {accountVehicles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {accountVehicles.map((v) => {
                            const isSelected = state.plate.replace(/\s/g, '').toUpperCase() === v.plate.replace(/\s/g, '').toUpperCase();
                            const isSuv = v.vehicleClass === 'suv' || v.vehicleClass === 'truck';
                            return (
                              <button
                                key={v.plate}
                                type="button"
                                onClick={() => dispatch({
                                  type: 'SET_VEHICLE',
                                  payload: {
                                    plate: v.plate,
                                    segment: isSuv ? 'suv' : 'sedan',
                                    segmentSelected: true
                                  }
                                })}
                                className={`p-3.5 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between relative border-2 ${
                                  isSelected
                                    ? "bg-lime-50/90 border-[#A2C62C] text-slate-950 shadow-md ring-2 ring-[#A2C62C]/30"
                                    : "bg-stone-50/60 border-stone-200 text-slate-700 hover:border-stone-400 hover:bg-white shadow-2xs"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#A2C62C]/30 text-slate-950' : 'bg-stone-200 text-slate-600'}`}>
                                      <Car className="h-4 w-4 stroke-[2]" />
                                    </div>
                                    <span className="font-mono font-black text-sm tracking-wider text-slate-900">
                                      {v.plate}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <span className="h-5 w-5 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-0.5 mt-1 border-t border-stone-200/60 pt-1.5">
                                  {(v.car_brand || v.car_model) && (
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                      {[v.car_brand, v.car_model].filter(Boolean).join(" ")}
                                    </p>
                                  )}
                                  <p className="text-[11px] font-sans font-medium text-slate-500 truncate">
                                    {v.vehicleClass === 'suv'
                                      ? '7–9 Chỗ (SUV / MPV)'
                                      : v.vehicleClass === 'truck'
                                      ? 'Bán tải / Cỡ lớn'
                                      : '4–5 Chỗ (Sedan)'}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-slate-500 font-sans">
                          Tài khoản chưa lưu thông tin xe. Vui lòng nhập biển số xe vào ô phía trên để trạm tự động lưu cho lần sau.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-lime-50/70 border border-[#A2C62C]/30 rounded-2xl p-3 flex items-center gap-2 text-xs text-forest-green font-medium">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#559119]" />
                    <span>Camera AI nhận diện biển số tự động kiểm tra đối chiếu khi xe vào trạm.</span>
                  </div>
                </div>

                {/* CỘT PHẢI: CHỌN PHÂN KHÚC XE */}
                <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                        CHỌN PHÂN KHÚC XE (QUY ĐỊNH GIÁ &amp; QUY TRÌNH):
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Sedan Card */}
                      <button
                        type="button"
                        onClick={() => dispatch({
                          type: 'SET_VEHICLE',
                          payload: { plate: state.plate, segment: 'sedan', segmentSelected: true }
                        })}
                        className={`p-5 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                          state.segment === 'sedan'
                            ? "bg-lime-50/90 border-[#A2C62C] text-slate-950 shadow-md ring-2 ring-[#A2C62C]/30"
                            : "bg-white border-stone-200 text-slate-700 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="font-display font-black text-base uppercase tracking-tight text-slate-950">
                              4–5 CHỖ (SEDAN / HATCHBACK / CROSSOVER)
                            </span>
                            <p className="text-xs text-slate-500 font-sans">
                              Sedan, Hatchback, Crossover cỡ nhỏ (Vios, Accent, Mazda 3, City, Civic, v.v.)
                            </p>
                          </div>
                          {state.segment === 'sedan' && (
                            <span className="h-6 w-6 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                              <Check className="h-4 w-4 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="pt-3 mt-2 border-t border-stone-200/60 flex items-center justify-between">
                          <span className="text-xs font-bold text-forest-green bg-lime-100/80 px-2.5 py-1 rounded-lg">
                            ✓ Áp dụng giá tiêu chuẩn (100%)
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            Hạng phổ thông
                          </span>
                        </div>
                      </button>

                      {/* SUV Card */}
                      <button
                        type="button"
                        onClick={() => dispatch({
                          type: 'SET_VEHICLE',
                          payload: { plate: state.plate, segment: 'suv', segmentSelected: true }
                        })}
                        className={`p-5 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                          state.segment === 'suv'
                            ? "bg-lime-50/90 border-[#A2C62C] text-slate-950 shadow-md ring-2 ring-[#A2C62C]/30"
                            : "bg-white border-stone-200 text-slate-700 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="font-display font-black text-base uppercase tracking-tight text-slate-950">
                              7–9 CHỖ / SUV / MPV / BÁN TẢI
                            </span>
                            <p className="text-xs text-slate-500 font-sans">
                              SUV, MPV, Bán tải cỡ lớn (Fortuner, Everest, Carnival, Ranger, SantaFe, v.v.)
                            </p>
                          </div>
                          {state.segment === 'suv' && (
                            <span className="h-6 w-6 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                              <Check className="h-4 w-4 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="pt-3 mt-2 border-t border-stone-200/60 flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                            +20% phụ thu diện tích xe lớn
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            Hạng cỡ lớn
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    Hệ thống Kiosk tự động điều chỉnh biểu phí và phân bổ khoang rửa thích hợp dựa trên kích thước phân khúc đã chọn.
                  </p>
                </div>
              </div>

              {/* UNIFIED BOTTOM NAVIGATION BAR */}
              <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-auto">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                  <span>QUAY LẠI</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-[11px] font-display font-black text-slate-500 uppercase tracking-wider block">
                      PHÂN KHÚC ĐÃ CHỌN
                    </span>
                    <div className="text-xl sm:text-2xl font-display font-black text-slate-950 leading-tight mt-0.5">
                      {state.segment === 'suv' ? '7–9 Chỗ (SUV / MPV)' : '4–5 Chỗ (Sedan)'}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!state.plate.trim()}
                    onClick={() => {
                      if (activeCustomer && state.plate.trim()) {
                        const cleanPlate = state.plate.toUpperCase().trim();
                        if (!activeCustomer.vehicles) activeCustomer.vehicles = [];
                        if (!activeCustomer.vehicles.some((v: any) => v.plate.toUpperCase() === cleanPlate)) {
                          activeCustomer.vehicles.push({
                            plate: cleanPlate,
                            vehicleClass: state.segment
                          });
                        }
                        if (!activeCustomer.licensePlates) activeCustomer.licensePlates = [];
                        if (!activeCustomer.licensePlates.includes(cleanPlate)) {
                          activeCustomer.licensePlates.push(cleanPlate);
                        }
                        activeCustomer.licensePlate = cleanPlate;
                        simActions.saveState?.();
                      }
                      dispatch({ type: 'SET_STEP', payload: 'goi' });
                    }}
                    className={`px-8 py-4 rounded-2xl font-display font-black text-sm sm:text-base uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition shrink-0 ${
                      state.plate.trim()
                        ? "bg-[#A2C62C] hover:bg-[#91b723] text-slate-950 shadow-sm"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <span>TIẾP TỤC CHỌN GÓI</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K6: CHỌN GÓI DỊCH VỤ CHÍNH (W0 - W5)                 */}
          {/* ========================================================= */}
          {state.step === 'goi' && (
            <motion.div
              key="step-goi"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full py-1 space-y-6 sm:space-y-8"
            >
              {/* Header: Title & Car Segment Info on Left, License Plate Badge on Right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 uppercase tracking-tight">
                    BƯỚC 2: CHỌN GÓI RỬA XE CHUYÊN SÂU
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 font-sans font-medium mt-1">
                    Giá gói đã tự động quy chuẩn cho xe cỡ <strong className="text-slate-900 font-bold">{isLarge ? "7-9 Chỗ" : "4-5 Chỗ"}</strong>
                  </p>
                </div>

                <div className="bg-[#0b131f] text-[#A2C62C] font-mono font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span>BIỂN SỐ:</span>
                  <span className="tracking-widest">{state.plate || "CHA MI NGU22333"}</span>
                </div>
              </div>

              {/* Packages Grid: 3 columns x 2 rows = 6 packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 w-full pt-2">
                {KIOSK_PACKAGES.map((pkg) => {
                  const isSelected = state.selectedPackageId === pkg.id;
                  const price = Math.round((pkg.basePrice * (isLarge ? 1.2 : 1)) / 1000) * 1000;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => dispatch({ type: 'SET_PACKAGE', payload: pkg.id })}
                      className={`relative bg-white rounded-3xl p-6 sm:p-7 border-2 flex flex-col justify-between transition-all cursor-pointer select-none ${
                        isSelected
                          ? "border-[#A2C62C] shadow-sm ring-1 ring-[#A2C62C]/30"
                          : "border-stone-200 hover:border-stone-300 shadow-xs"
                      }`}
                    >
                      {/* Floating Badge on Top-Right Edge */}
                      {pkg.badge && (
                        <div className="absolute -top-3 right-6 bg-[#00a651] text-white font-display font-black text-[10px] sm:text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1 z-10">
                          <span>{pkg.badge}</span>
                        </div>
                      )}

                      {/* Top Row: Code Pill (W0..W5) & Selected Checkmark Badge */}
                      <div className="flex items-center justify-between">
                        <div className="px-2.5 py-1 rounded-lg bg-stone-100 text-slate-700 font-sans font-bold text-xs">
                          {pkg.code}
                        </div>
                        {isSelected && (
                          <div className="h-7 w-7 rounded-full bg-[#A2C62C] text-slate-950 flex items-center justify-center shadow-2xs shrink-0">
                            <Check className="h-4 w-4 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Package Name */}
                      <h3 className="font-display font-black text-xl text-slate-950 mt-4">
                        {pkg.name}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-400 font-sans text-xs sm:text-[13px] leading-relaxed mt-2.5 flex-1 min-h-[52px]">
                        {pkg.description}
                      </p>

                      {/* Bottom Row: GIÁ GÓI & Price */}
                      <div className="flex items-center justify-between pt-6 mt-auto border-t border-stone-100/80">
                        <span className="text-xs font-bold text-slate-800 uppercase font-sans tracking-wide">
                          GIÁ GÓI
                        </span>
                        <span className="font-display font-black text-xl sm:text-2xl text-slate-950">
                          {price.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Bar: Back Button on Left, Total Price & Continue Button on Right */}
              <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-4">
                {/* Nút Quay Lại */}
                <button
                  type="button"
                  id="btn-kiosk-goi-back"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'xe' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                  <span>QUAY LẠI</span>
                </button>

                {/* Tổng giá tiền & Nút Tiếp tục chọn Add-ons */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-[11px] font-display font-black text-slate-600 uppercase tracking-wider block">
                      GÓI ĐÃ CHỌN
                    </span>
                    <div className="text-2xl sm:text-3xl font-display font-black text-slate-950 leading-tight mt-0.5">
                      {packagePrice.toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-kiosk-goi-next"
                    onClick={() => dispatch({ type: 'SET_STEP', payload: 'dich-vu-them' })}
                    className="px-8 py-4 bg-[#A2C62C] hover:bg-[#91b723] text-slate-950 font-display font-black text-sm sm:text-base uppercase tracking-wide rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition shrink-0"
                  >
                    <span>TIẾP TỤC CHỌN ADD-ONS</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K7: DỊCH VỤ LẺ THÊM (ADD-ONS)                         */}
          {/* ========================================================= */}
          {state.step === 'dich-vu-them' && (
            <motion.div
              key="step-dich-vu-them"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full py-1 space-y-6 sm:space-y-8"
            >
              {/* UNIFIED HEADER PATTERN */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 uppercase tracking-tight">
                    BƯỚC 3: DỊCH VỤ CỘNG THÊM (ADD-ONS)
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 font-sans font-medium mt-1">
                    Tùy chọn nâng cấp các hạng mục chăm sóc xe chuyên sâu theo nhu cầu của bạn.
                  </p>
                </div>

                <div className="bg-[#0b131f] text-[#A2C62C] font-mono font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span>BIỂN SỐ: {state.plate || "..."} • GÓI: {selectedPackage.code}</span>
                </div>
              </div>

              {/* Addons Grid: 4 columns on desktop, 2 columns on tablet/mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full pt-1 flex-1">
                {KIOSK_ADDONS.map((addon) => {
                  const isChecked = state.selectedAddonIds.includes(addon.id);

                  return (
                    <div
                      key={addon.id}
                      onClick={() => dispatch({ type: 'TOGGLE_ADDON', payload: addon.id })}
                      className={`rounded-3xl border-2 p-5 sm:p-6 bg-white flex flex-col justify-between transition-all cursor-pointer select-none ${
                        isChecked
                          ? "border-[#A2C62C] bg-lime-50/40 shadow-xs ring-1 ring-[#A2C62C]/30"
                          : "border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 shadow-2xs"
                      }`}
                    >
                      {/* Top Row: Category tag & Checked box */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                          {addon.category}
                        </span>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          isChecked ? "bg-[#A2C62C] border-[#A2C62C] text-slate-950" : "border-stone-300 bg-white"
                        }`}>
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Addon Name */}
                      <h4 className="font-display font-black text-sm sm:text-base text-slate-900 leading-snug my-3">
                        {addon.name}
                      </h4>

                      {/* Bottom Row: Price & Duration */}
                      <div className="pt-3 mt-auto border-t border-stone-100 flex items-center justify-between">
                        <span className="font-display font-black text-base text-slate-950">
                          +{addon.price.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-[11px] font-sans font-bold text-slate-500 bg-stone-100 px-2 py-0.5 rounded">
                          ~{addon.duration}p
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* UNIFIED BOTTOM NAVIGATION BAR */}
              <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-auto">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'goi' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                  <span>QUAY LẠI</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-[11px] font-display font-black text-slate-500 uppercase tracking-wider block">
                      TỔNG CỘNG ({1 + state.selectedAddonIds.length} DỊCH VỤ)
                    </span>
                    <div className="text-2xl sm:text-3xl font-display font-black text-slate-950 leading-tight mt-0.5">
                      {subtotal.toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_STEP', payload: 'voucher' })}
                    className="px-8 py-4 bg-[#A2C62C] hover:bg-[#91b723] text-slate-950 font-display font-black text-sm sm:text-base uppercase tracking-wide rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition shrink-0"
                  >
                    <span>TIẾP TỤC XEM HÓA ĐƠN</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K8: XÁC NHẬN ĐƠN, VAT & VOUCHER                       */}
          {/* ========================================================= */}
          {state.step === 'voucher' && (
            <motion.div
              key="step-voucher"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full py-1 space-y-6 sm:space-y-8"
            >
              {/* UNIFIED HEADER PATTERN */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 uppercase tracking-tight">
                    BƯỚC 4: CHI TIẾT ĐƠN HÀNG &amp; MÃ GIẢM GIÁ
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 font-sans font-medium mt-1">
                    Kiểm tra các hạng mục dịch vụ, thời gian thi công dự kiến và áp dụng voucher ưu đãi.
                  </p>
                </div>

                <div className="bg-[#0b131f] text-[#A2C62C] font-mono font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span>BIỂN SỐ: {state.plate || "..."} • {isLarge ? "7–9 Chỗ (SUV)" : "4–5 Chỗ (Sedan)"}</span>
                </div>
              </div>

              {/* 2 COLUMNS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
                {/* CỘT TRÁI: BẢNG KÊ DỊCH VỤ CHI TIẾT (7 cols) */}
                <div className="lg:col-span-7 bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-2.5">
                        <div className="px-3 py-1 rounded-xl bg-slate-900 text-[#A2C62C] font-mono font-black text-sm tracking-wider">
                          {state.plate || "CHƯA NHẬP"}
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {isLarge ? "Phân khúc 7–9 Chỗ (SUV / Bán tải)" : "Phân khúc 4–5 Chỗ (Sedan / Hatback)"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-stone-100 px-3 py-1 rounded-lg">
                        Dự kiến: ~{totalDurationMin} phút
                      </span>
                    </div>

                    {/* Danh sách mục dịch vụ */}
                    <div className="space-y-3 font-sans">
                      {/* Gói chính */}
                      <div className="flex justify-between items-center bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                        <div className="space-y-0.5">
                          <span className="font-display font-black text-sm sm:text-base text-slate-950 block">
                            {selectedPackage.name}
                          </span>
                          <span className="text-xs text-slate-500">Gói rửa xe chuyên sâu ({selectedPackage.code})</span>
                        </div>
                        <span className="font-display font-black text-base sm:text-lg text-slate-950">
                          {packagePrice.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      {/* Add-ons */}
                      {KIOSK_ADDONS.filter(a => state.selectedAddonIds.includes(a.id)).map((a) => (
                        <div key={a.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#559119]">+</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-800">{a.name}</span>
                            <span className="text-[10px] text-slate-500 bg-stone-100 px-1.5 py-0.5 rounded font-mono">~{a.duration}p</span>
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            +{a.price.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}

                      {/* Discount nếu có */}
                      {state.appliedDiscount > 0 && (
                        <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm">
                          <span>Ưu đãi áp dụng ({state.appliedPromoName}):</span>
                          <span>-{state.appliedDiscount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VAT & Subtotal */}
                  <div className="pt-4 border-t-2 border-stone-200 space-y-2.5">
                    <div className="flex justify-between items-center text-forest-green font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        Thuế GTGT (VAT 8%):
                      </span>
                      <span className="italic font-medium">Đã bao gồm đầy đủ trong đơn giá</span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-display font-black text-slate-900 text-base uppercase">
                        TỔNG TIỀN THANH TOÁN:
                      </span>
                      <span className="font-display font-black text-2xl sm:text-3xl text-slate-950">
                        {finalTotal.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: ÁP DỤNG MÃ GIẢM GIÁ & THÔNG TIN TIẾP NHẬN (5 cols) */}
                <div className="lg:col-span-5 bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      ÁP DỤNG MÃ ƯU ĐÃI &amp; VOUCHER:
                    </label>

                    {/* Quick Voucher Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPromoInput("WASSUP100");
                          dispatch({
                            type: 'APPLY_PROMO',
                            payload: { code: 'WASSUP100', discount: 100000, name: 'WASSUP100 (-100k)' }
                          });
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                          state.appliedPromoName?.includes('WASSUP100')
                            ? "bg-lime-50/90 border-[#A2C62C] text-slate-950 shadow-xs"
                            : "bg-stone-50 border-stone-200 text-slate-700 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs">WASSUP100</span>
                          {state.appliedPromoName?.includes('WASSUP100') && <Check className="h-3.5 w-3.5 text-[#559119] stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-bold text-forest-green mt-1">Giảm ngay 100.000đ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPromoInput("VIP30");
                          const disc = Math.round((subtotal * 0.3) / 1000) * 1000;
                          dispatch({
                            type: 'APPLY_PROMO',
                            payload: { code: 'VIP30', discount: disc, name: 'VIP30 (-30%)' }
                          });
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                          state.appliedPromoName?.includes('VIP30')
                            ? "bg-lime-50/90 border-[#A2C62C] text-slate-950 shadow-xs"
                            : "bg-stone-50 border-stone-200 text-slate-700 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs">VIP30</span>
                          {state.appliedPromoName?.includes('VIP30') && <Check className="h-3.5 w-3.5 text-[#559119] stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-bold text-amber-700 mt-1">Giảm 30% toàn đơn</span>
                      </button>
                    </div>

                    {/* Manual Input */}
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          placeholder="HOẶC NHẬP MÃ TỰ DO..."
                          className="flex-1 px-4 py-3.5 bg-stone-50 border-2 border-stone-200 rounded-2xl font-mono text-xs font-bold uppercase focus:border-[#A2C62C] focus:bg-white focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="px-5 py-3.5 bg-slate-950 hover:bg-slate-800 text-[#A2C62C] text-xs font-display font-black rounded-2xl uppercase tracking-wider cursor-pointer border-0 active:scale-95 transition"
                        >
                          Áp Dụng
                        </button>
                      </div>
                      {promoError && <p className="text-xs text-red-500 font-bold">{promoError}</p>}
                    </div>
                  </div>

                  {/* Thông tin hỗ trợ & bảo đảm trạm */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs font-sans text-slate-600">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-[#559119]" />
                      <span>Cam kết dịch vụ tại WASSUP Car Care</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Rửa xe tự động theo tiêu chuẩn chuyển giao kỹ thuật. Hóa đơn điện tử VAT được gửi qua SMS/Zalo ngay sau khi thanh toán.
                    </p>
                  </div>
                </div>
              </div>

              {/* UNIFIED BOTTOM NAVIGATION BAR */}
              <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-auto">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'dich-vu-them' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                  <span>QUAY LẠI</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-[11px] font-display font-black text-slate-500 uppercase tracking-wider block">
                      TỔNG THANH TOÁN
                    </span>
                    <div className="text-2xl sm:text-3xl font-display font-black text-slate-950 leading-tight mt-0.5">
                      {finalTotal.toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_STEP', payload: 'thanh-toan' })}
                    className="px-8 py-4 bg-[#A2C62C] hover:bg-[#91b723] text-slate-950 font-display font-black text-sm sm:text-base uppercase tracking-wide rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition shrink-0"
                  >
                    <span>CHỌN THANH TOÁN</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K9: CHỌN PHƯƠNG THỨC THANH TOÁN (PAYMENT METHODS)    */}
          {/* ========================================================= */}
          {state.step === 'thanh-toan' && (
            <motion.div
              key="step-thanh-toan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full py-1 space-y-6 sm:space-y-8"
            >
              {/* UNIFIED HEADER PATTERN */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 uppercase tracking-tight">
                    BƯỚC 5: PHƯƠNG THỨC THANH TOÁN
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 font-sans font-medium mt-1">
                    Chọn phương thức thanh toán phù hợp để hoàn tất đặt chỗ và nhận mã vào khoang.
                  </p>
                </div>

                <div className="bg-[#0b131f] text-[#A2C62C] font-mono font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span>BIỂN SỐ: {state.plate || "..."} • TỔNG: {finalTotal.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              {/* 4 PAYMENT METHODS GRID (2x2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full flex-1">
                {/* 1. QR Transfer */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT', payload: 'qr_pay' })}
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer select-none relative ${
                    state.paymentMethod === 'qr_pay'
                      ? "bg-lime-50/90 border-[#A2C62C] shadow-xs ring-2 ring-[#A2C62C]/30 text-slate-950"
                      : "bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/60 shadow-2xs text-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-950 text-[#A2C62C] flex items-center justify-center font-black shrink-0 shadow-2xs">
                      <QrCode className="h-6 w-6" />
                    </div>
                    {state.paymentMethod === 'qr_pay' && (
                      <span className="h-7 w-7 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-display font-black text-base sm:text-lg text-slate-950 uppercase">
                      1. QUÉT MÃ QR (VNPAY / VIETQR / VÍ ĐIỆN TỬ)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                      Quét mã QR động hiển thị trên màn hình qua ứng dụng Ngân hàng (Vietcombank, MB, Techcom...) hoặc ví Momo / ZaloPay. Tự động xác thực giao dịch sau 3 giây.
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-green bg-lime-100/80 px-2.5 py-1 rounded-lg">
                      ⚡ Khuyên dùng: Nhanh chóng &amp; Không tiếp xúc
                    </span>
                  </div>
                </button>

                {/* 2. POS Card */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT', payload: 'card' })}
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer select-none relative ${
                    state.paymentMethod === 'card'
                      ? "bg-lime-50/90 border-[#A2C62C] shadow-xs ring-2 ring-[#A2C62C]/30 text-slate-950"
                      : "bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/60 shadow-2xs text-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black shrink-0 shadow-2xs">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    {state.paymentMethod === 'card' && (
                      <span className="h-7 w-7 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-display font-black text-base sm:text-lg text-slate-950 uppercase">
                      2. QUẸT / CHẠM THẺ NGÂN HÀNG (POS VẬT LÝ)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                      Chạm thẻ không tiếp xúc (Contactless / Apple Pay) hoặc cắm thẻ chip Visa, MasterCard, JCB, Napas tại đầu đọc POS gắn liền cạnh Kiosk.
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                      💳 Hỗ trợ mọi loại thẻ nội địa &amp; quốc tế
                    </span>
                  </div>
                </button>

                {/* 3. Cash at Counter */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT', payload: 'cash' })}
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer select-none relative ${
                    state.paymentMethod === 'cash'
                      ? "bg-lime-50/90 border-[#A2C62C] shadow-xs ring-2 ring-[#A2C62C]/30 text-slate-950"
                      : "bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/60 shadow-2xs text-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shrink-0 shadow-2xs">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    {state.paymentMethod === 'cash' && (
                      <span className="h-7 w-7 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-display font-black text-base sm:text-lg text-slate-950 uppercase">
                      3. TIỀN MẶT TẠI QUẦY THU NGÂN
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                      In phiếu xác nhận và tiến hành thanh toán tiền mặt trực tiếp cho nhân viên thu ngân của trạm trước hoặc sau khi rửa xe xong.
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                      💵 Thu tiền trực tiếp tại quầy
                    </span>
                  </div>
                </button>

                {/* 4. Pay Later (Khách Doanh Nghiệp / Công Nợ) */}
                <div
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-left flex flex-col justify-between transition-all relative ${
                    state.isNewlyRegistered
                      ? "bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed"
                      : state.paymentMethod === 'pay_later'
                        ? "bg-lime-50/90 border-[#A2C62C] shadow-xs ring-2 ring-[#A2C62C]/30 text-slate-950 cursor-pointer select-none"
                        : "bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/60 shadow-2xs text-slate-800 cursor-pointer select-none"
                  }`}
                  onClick={() => {
                    if (!state.isNewlyRegistered) {
                      dispatch({ type: 'SET_PAYMENT', payload: 'pay_later' });
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black shrink-0 shadow-2xs">
                      <History className="h-6 w-6" />
                    </div>
                    {!state.isNewlyRegistered && state.paymentMethod === 'pay_later' && (
                      <span className="h-7 w-7 rounded-full bg-[#A2C62C] flex items-center justify-center text-slate-950 shrink-0">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-base sm:text-lg text-slate-950 uppercase">
                        4. THANH TOÁN SAU (CÔNG NỢ DOANH NGHIỆP)
                      </h4>
                      {state.isNewlyRegistered && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full">
                          CHƯA KHẢ DỤNG
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                      Dành riêng cho khách hàng doanh nghiệp hoặc hội viên thân thiết có hạn mức công nợ được trạm WASSUP bảo lãnh thanh toán định kỳ.
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg">
                      🏢 Hạn mức công nợ đối tác
                    </span>
                  </div>
                </div>
              </div>

              {/* UNIFIED BOTTOM NAVIGATION BAR */}
              <div className="pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-auto">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STEP', payload: 'voucher' })}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                  <span>QUAY LẠI</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-[11px] font-display font-black text-slate-500 uppercase tracking-wider block">
                      TỔNG THANH TOÁN
                    </span>
                    <div className="text-2xl sm:text-3xl font-display font-black text-slate-950 leading-tight mt-0.5">
                      {finalTotal.toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (state.paymentMethod === 'qr_pay' || state.paymentMethod === 'card') {
                        dispatch({ type: 'SET_STEP', payload: 'processing' });
                      } else {
                        handleConfirmOrder();
                      }
                    }}
                    className="px-8 py-4 bg-[#A2C62C] hover:bg-[#91b723] text-slate-950 font-display font-black text-sm sm:text-base uppercase tracking-wide rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition shrink-0"
                  >
                    <span>XÁC NHẬN THANH TOÁN</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K10: ĐANG XỬ LÝ THANH TOÁN (QR / CARD PROCESSING)    */}
          {/* ========================================================= */}
          {state.step === 'processing' && (
            <motion.div
              key="step-processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto space-y-6 text-center"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">
                  {state.paymentMethod === 'qr_pay' ? "QUÉT MÃ QR ĐỂ THANH TOÁN" : "CHẠM HOẶC QUẸT THẺ TẠI POS"}
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Số tiền: <strong className="text-emerald-600 text-base">{finalTotal.toLocaleString("vi-VN")}đ</strong>
                </p>
              </div>

              {state.paymentMethod === 'qr_pay' ? (
                <div className="bg-white p-6 rounded-3xl border-2 border-stone-200 shadow-xl space-y-4">
                  {/* Dynamic QR Mock */}
                  <div className="h-56 w-56 mx-auto bg-stone-900 rounded-2xl p-4 flex flex-col items-center justify-center border-4 border-[#A2C62C] relative">
                    <QrCode className="h-36 w-36 text-white" />
                    <span className="text-[10px] text-[#A2C62C] font-mono mt-1 font-black">
                      VIETQR • {finalTotal.toLocaleString("vi-VN")} VND
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-sans space-y-1">
                    <p>Mở ứng dụng Ngân hàng quét mã QR để hoàn tất thanh toán.</p>
                    <p className="font-mono text-slate-800 font-bold">Nội dung: WASSUP {state.plate}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border-2 border-stone-200 shadow-xl space-y-4">
                  <div className="h-20 w-20 mx-auto rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center animate-pulse">
                    <CreditCard className="h-10 w-10" />
                  </div>
                  <h3 className="font-display font-black text-base uppercase text-slate-900">
                    VUI LÒNG CHẠM HOẶC CẮM THẺ
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Thiết bị POS tích hợp đang chờ nhận tín hiệu thẻ chip hoặc thẻ không tiếp xúc...
                  </p>
                </div>
              )}

              {/* Countdown Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                  <span>Thời gian chờ thanh toán:</span>
                  <span className="font-mono text-slate-900">{processTimeLeft}s</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#A2C62C] h-full transition-all duration-1000 rounded-full"
                    style={{ width: `${(processTimeLeft / 60) * 100}%` }}
                  />
                </div>
              </div>

              {/* Testing Simulator Button */}
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-display font-black text-xs uppercase tracking-wider rounded-2xl border border-emerald-300 transition cursor-pointer"
              >
                ⚡ MÔ PHỎNG KHÁCH ĐÃ QUÉT &amp; THANH TOÁN THÀNH CÔNG
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_STEP', payload: 'thanh-toan' })}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold uppercase cursor-pointer bg-transparent border-0"
              >
                ← Đổi phương thức thanh toán khác
              </button>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP K11: THÀNH CÔNG, ĐẾM NGƯỢC ETA & KẾT THÚC PHIÊN     */}
          {/* ========================================================= */}
          {state.step === 'completed' && (
            <motion.div
              key="step-completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl mx-auto space-y-6 text-center bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xl"
            >
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle className="h-10 w-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A2C62C] bg-slate-950 px-3 py-1 rounded-full inline-block">
                  TIẾP NHẬN ĐƠN THÀNH CÔNG ✓
                </span>
                <h2 className="text-2xl font-display font-black text-slate-950 uppercase tracking-tight">
                  ĐÃ XÁC NHẬN YÊU CẦU RỬA XE!
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Cảm ơn <strong className="text-slate-900">{state.name || "Quý khách"}</strong> đã lựa chọn WASSUP!
                </p>
                
                <div className="pt-2 flex justify-center gap-2">
                  <span className="bg-slate-950 text-[#A2C62C] font-mono font-black text-xs px-3 py-1.5 rounded-xl">
                    BIỂN SỐ: {state.plate}
                  </span>
                  <span className="bg-lime-100 text-slate-950 font-mono font-black text-xs px-3 py-1.5 rounded-xl">
                    MÃ ĐƠN: #{state.createdOrderId?.slice(-6) || "W8291"}
                  </span>
                </div>
              </div>

              {/* Large Circular Countdown ETA */}
              <div className="bg-slate-950 text-white p-6 rounded-3xl space-y-3 relative overflow-hidden shadow-inner border border-slate-900">
                <span className="text-[10px] font-black text-[#A2C62C] uppercase tracking-widest block">
                  ĐỒNG HỒ ĐẾM NGƯỢC HOÀN TẤT DỰ KIẾN (ETA)
                </span>

                <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest">
                  00:25:00
                </div>

                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#A2C62C] h-full rounded-full transition-all duration-500"
                    style={{ width: `30%` }}
                  />
                </div>

                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Trạng thái: Vui lòng lái xe vào Khoang 01 hoặc khu vực chờ tiếp nhận
                </p>
              </div>

              {/* Rating Section */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <span className="text-xs font-black text-slate-700 uppercase block">
                  Đánh giá trải nghiệm màn hình chạm Kiosk:
                </span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`kiosk-star-${star}`}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        setRatingMessage("Cảm ơn bạn đã đánh giá 5 sao! Chúc bạn chuyến đi an toàn & vạn dặm bình an! 💚");
                      }}
                      className="p-1 hover:scale-125 transition bg-transparent border-0 cursor-pointer"
                    >
                      <Star
                        className={`h-7 w-7 ${star <= rating ? "fill-amber-400 stroke-amber-500" : "stroke-stone-300"}`}
                      />
                    </button>
                  ))}
                </div>
                {ratingMessage && <p className="text-xs text-emerald-700 font-bold">{ratingMessage}</p>}
              </div>

              {/* CRITICAL ACTIONS (PRD v3.1 §0 & FRK-6.2) */}
              <div className="space-y-2 pt-2">
                {/* Primary Button: End session immediately for next customer */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'RESET' })}
                  className="w-full py-4.5 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition cursor-pointer border-0 flex items-center justify-center gap-2"
                >
                  <span>KẾT THÚC PHIÊN, KHÁCH TIẾP THEO →</span>
                  <span className="text-[10px] font-mono bg-slate-950 text-[#A2C62C] px-2 py-0.5 rounded-full">
                    ({completedCountdown}s)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => dispatch({ type: 'RESET' })}
                  className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-600 font-display font-bold text-xs uppercase rounded-xl transition cursor-pointer border-0"
                >
                  Quay về màn hình chính 🏠
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>



      {/* ========================================================= */}
      {/* SECRET ADMIN MODAL (5 TAPS ON LOGO TRIGGER)                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showSecretAdminModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-5 text-slate-900 text-center"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-slate-900" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">
                    CÀI ĐẶT THIẾT BỊ KIOSK (ADMIN TRẠM)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecretAdminModal(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-700 border-0 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!adminAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-sans">
                    Nhập mã PIN Quản trị viên trạm để mở quyền quản lý thiết bị:
                  </p>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="MÃ PIN ADMIN (Mặc định: 1234)"
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-center font-mono text-lg font-black tracking-widest focus:border-slate-900 focus:outline-none"
                  />
                  {adminAuthError && (
                    <p className="text-xs text-red-600 font-bold">{adminAuthError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleVerifyAdminPin}
                    className="w-full py-3.5 bg-slate-950 text-white hover:bg-slate-800 font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0"
                  >
                    XÁC THỰC QUYỀN ADMIN
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSecretAdminModal(false);
                      navigate("/admin/dashboard");
                    }}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-600 font-display font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0"
                  >
                    Quay về Station OS Admin Hub
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left font-sans text-xs">
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2 border border-stone-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trạm đã gán:</span>
                      <strong className="text-slate-900">{deviceSession?.stationName || "Chưa ghép đôi"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tên thiết bị:</span>
                      <strong className="text-slate-900">{deviceSession?.deviceName || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã thiết bị:</span>
                      <strong className="font-mono text-slate-700">{deviceSession?.deviceId || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thời gian ghép:</span>
                      <span>{deviceSession?.pairedAt ? new Date(deviceSession.pairedAt).toLocaleString("vi-VN") : "N/A"}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleRevokePairing}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      THU HỒI &amp; GHÉP ĐÔI LẠI THIẾT BỊ (RESET K0)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSecretAdminModal(false);
                        navigate("/admin/dashboard");
                      }}
                      className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-700 font-display font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0 text-center block"
                    >
                      CHUYỂN VỀ STATION OS ADMIN HUB
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
