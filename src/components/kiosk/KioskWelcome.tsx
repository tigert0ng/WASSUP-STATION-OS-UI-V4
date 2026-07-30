import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  QrCode,
  Phone,
  UserPlus,
  ArrowRight,
  CheckCircle,
  X,
  Sparkles,
  Clock,
  Globe,
  Delete,
  ShieldCheck,
  AlertCircle,
  User,
  Car,
  ChevronRight,
  Info
} from "lucide-react";
import { simActions } from "../../lib/supabase/client";

interface KioskWelcomeProps {
  onStartOrder?: (phone?: string, customer?: any) => void;
  lang?: "vi" | "en";
  onLanguageChange?: (lang: "vi" | "en") => void;
}

export default function KioskWelcome({
  onStartOrder,
  lang: initialLang = "vi",
  onLanguageChange
}: KioskWelcomeProps) {
  const [lang, setLang] = useState<"vi" | "en">(initialLang);
  const [phone, setPhone] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Registration Modal States
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPlate, setRegPlate] = useState("");
  const [regSegment, setRegSegment] = useState<"sedan" | "suv">("sedan");
  const [regSuccess, setRegSuccess] = useState(false);
  const [createdMember, setCreatedMember] = useState<any>(null);

  // Phone Lookup Feedback State
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    customer?: any;
    message?: string;
  } | null>(null);

  // Sync internal language state with prop if it changes
  useEffect(() => {
    setLang(initialLang);
  }, [initialLang]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLanguageToggle = (selected: "vi" | "en") => {
    setLang(selected);
    if (onLanguageChange) {
      onLanguageChange(selected);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Touch Dialpad Handlers
  const handleKeyPress = (num: string) => {
    if (phone.length < 10) {
      setPhone(prev => prev + num);
      setLookupResult(null);
    }
  };

  const handleBackspace = () => {
    setPhone(prev => prev.slice(0, -1));
    setLookupResult(null);
  };

  const handleClear = () => {
    setPhone("");
    setLookupResult(null);
  };

  // Customer Phone Submission / Verification
  const handlePhoneSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length < 9) return;

    const customers = simActions.getCustomers();
    const match = customers.find(c => c.phone === phone);

    if (match) {
      setLookupResult({
        found: true,
        customer: match,
        message: lang === "vi" 
          ? `Chào mừng trở lại, ${match.name}! Hạng hội viên đã được xác thực.`
          : `Welcome back, ${match.name}! Membership authenticated.`
      });
      
      // Auto-proceed after a brief display of success
      setTimeout(() => {
        if (onStartOrder) {
          onStartOrder(phone, match);
        }
      }, 1500);
    } else {
      setLookupResult({
        found: false,
        message: lang === "vi"
          ? "Số điện thoại chưa đăng ký hội viên. Đăng ký ngay để nhận quà chào mừng!"
          : "Phone number not registered. Sign up now for member privileges!"
      });
    }
  };

  // Register New Customer Action
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;

    // Call simulated action to persist member
    const newCust = simActions.addCustomer({
      name: regName.trim(),
      phone: regPhone.trim(),
      licensePlate: regPlate.trim().toUpperCase(),
      points: 100 // Welcome points
    });

    setCreatedMember(newCust);
    setRegSuccess(true);

    // Populate phone lookup with the newly registered phone
    setPhone(regPhone.trim());
    setLookupResult({
      found: true,
      customer: newCust,
      message: lang === "vi" 
        ? "Đăng ký thành công! Đang chuyển đến chọn dịch vụ..."
        : "Registration successful! Redirecting to package selection..."
    });

    // Auto-proceed to order after 2 seconds
    setTimeout(() => {
      setShowRegModal(false);
      // Reset registration form
      setRegName("");
      setRegPhone("");
      setRegPlate("");
      setRegSuccess(false);
      
      if (onStartOrder) {
        onStartOrder(newCust.phone, newCust);
      }
    }, 2500);
  };

  // Simulate scanning a Demo QR Code
  const handleDemoQrScan = (demoType: "member" | "coupon") => {
    if (demoType === "member") {
      const demoCust = simActions.getCustomers()[0] || {
        name: "Trần Minh Quân",
        phone: "0901234567"
      };
      setPhone(demoCust.phone);
      setLookupResult({
        found: true,
        customer: demoCust,
        message: lang === "vi"
          ? `[QR Code Scanned] Đăng nhập hội viên: ${demoCust.name}`
          : `[QR Code Scanned] Logged in member: ${demoCust.name}`
      });
      setTimeout(() => {
        if (onStartOrder) {
          onStartOrder(demoCust.phone, demoCust);
        }
      }, 1500);
    } else {
      alert(
        lang === "vi"
          ? "🎫 Quét mã giảm giá thành công: WASSUP100 (-100,000đ). Chúng tôi đã lưu mã vào phiên làm việc của bạn!"
          : "🎫 Promo code scanned successfully: WASSUP100 (-100,000đ). Added to your session!"
      );
      if (onStartOrder) {
        onStartOrder();
      }
    }
  };

  const t = {
    welcomeTitle: lang === "vi" ? "CHÀO MỪNG ĐẾN VỚI" : "WELCOME TO",
    welcomeSub: lang === "vi" ? "Hệ thống Rửa xe & Chăm sóc xe Tự động 24/7" : "24/7 Premium Automatic Car Wash & Care",
    qrScanTitle: lang === "vi" ? "QUÉT MÃ ĐĂNG NHẬP" : "SCAN TO CHECK-IN",
    qrScanDesc: lang === "vi" ? "Đưa mã QR hội viên hoặc mã đặt lịch trước camera để quét nhanh" : "Present membership QR or booking code to scanner",
    demoScanBtn: lang === "vi" ? "Simulate Quét QR Hội Viên" : "Simulate Member QR Scan",
    demoPromoBtn: lang === "vi" ? "Simulate Quét Voucher Giảm Giá" : "Simulate Voucher QR Scan",
    phoneLoginTitle: lang === "vi" ? "NHẬP SỐ ĐIỆN THOẠI" : "ENTER PHONE NUMBER",
    phoneLoginDesc: lang === "vi" ? "Nhập số điện thoại để tra cứu ưu đãi & lịch sử xe" : "Enter phone number to look up history & rewards",
    phonePlaceholder: lang === "vi" ? "Nhập số điện thoại..." : "Enter phone number...",
    registerBtn: lang === "vi" ? "Đăng ký thành viên mới" : "Register new customer",
    registerTagline: lang === "vi" ? "Đăng ký nhanh chóng - Nhận ưu đãi tích điểm" : "Quick registration - Collect points & rewards",
    guestBtn: lang === "vi" ? "TIẾP TỤC KHÔNG ĐĂNG NHẬP (KHÁCH VÃNG LAI)" : "CONTINUE AS GUEST (NO LOGIN)",
    modalTitle: lang === "vi" ? "ĐĂNG KÝ HỘI VIÊN MỚI" : "NEW MEMBER REGISTRATION",
    modalSub: lang === "vi" ? "Trở thành hội viên Wassup Wash để tích điểm và nhận ưu đãi độc quyền" : "Join Wassup Wash rewards program to collect points & exclusive gifts",
    fullName: lang === "vi" ? "Họ và Tên" : "Full Name",
    phoneLabel: lang === "vi" ? "Số điện thoại" : "Phone Number",
    plateLabel: lang === "vi" ? "Biển số xe (Tùy chọn)" : "License Plate (Optional)",
    segmentLabel: lang === "vi" ? "Phân khúc xe chính" : "Primary Vehicle Segment",
    segmentSedan: lang === "vi" ? "4-5 Chỗ (Sedan/Hatchback)" : "4-5 Seats (Sedan/CUV)",
    segmentSuv: lang === "vi" ? "7-9 Chỗ / MPV / Bán tải" : "7-9 Seats / SUV / Pickup",
    confirmReg: lang === "vi" ? "Xác nhận Đăng ký" : "Confirm Registration",
    canceling: lang === "vi" ? "Hủy bỏ" : "Cancel",
    regSuccessTitle: lang === "vi" ? "Đăng ký thành công!" : "Registration Successful!"
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-[#fafaf9] rounded-3xl border border-stone-200/80 shadow-2xl overflow-hidden relative text-slate-800 flex flex-col justify-between min-h-[82vh]">
      
      {/* Top Banner (Header) */}
      <div className="bg-white border-b border-stone-150 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Side Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#A2C62C] flex items-center justify-center text-slate-950 shadow-md shadow-lime-300/30">
            <Car className="h-5.5 w-5.5" />
          </div>
          <div className="text-left">
            <h2 className="font-display font-black text-lg tracking-tight text-slate-950 leading-none">
              WASSUP <span className="text-[#A2C62C]">WASH</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-sans font-semibold tracking-widest uppercase mt-0.5">
              Smart Kiosk Portal
            </p>
          </div>
        </div>

        {/* Local Clock & Language */}
        <div className="flex items-center gap-5">
          {/* Live Clock display */}
          <div className="flex items-center gap-2 text-slate-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100 text-xs font-sans font-bold">
            <Clock className="h-3.5 w-3.5 text-slate-400 animate-spin-slow" />
            <span className="text-slate-700">{formatTime(currentTime)}</span>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              onClick={() => handleLanguageToggle("vi")}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                lang === "vi" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-450 hover:text-slate-700"
              }`}
            >
              VI
            </button>
            <button
              onClick={() => handleLanguageToggle("en")}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                lang === "en" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-450 hover:text-slate-700"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Kiosk Welcome Grid */}
      <div className="flex-1 px-8 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: QR Scanning Area */}
        <div className="md:col-span-5 flex flex-col justify-between bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm relative overflow-hidden">
          {/* Glowing background accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A2C62C]/5 rounded-full blur-2xl" />
          
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-50 border border-lime-100 rounded-full text-[9px] font-black text-lime-800 tracking-wider uppercase">
              <Sparkles className="h-3 w-3 text-lime-500" />
              Scan &amp; Wash
            </div>
            <h3 className="text-md font-display font-black text-slate-900 tracking-tight uppercase">
              {t.qrScanTitle}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {t.qrScanDesc}
            </p>
          </div>

          {/* High-fidelity Scan QR Area with laser animation */}
          <div className="my-6 relative flex flex-col items-center justify-center">
            <div className="p-5 bg-stone-50 border-2 border-stone-200 rounded-2xl relative w-48 h-48 flex items-center justify-center shadow-inner group">
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#A2C62C] rounded-tl" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#A2C62C] rounded-tr" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#A2C62C] rounded-bl" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#A2C62C] rounded-br" />

              {/* Laser Scanning Line */}
              <motion.div 
                className="absolute left-3 right-3 h-[2px] bg-[#A2C62C] shadow-[0_0_8px_#A2C62C] z-10"
                animate={{
                  top: ["16px", "176px", "16px"]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Stylized QR Code Graphic */}
              <QrCode className="h-32 w-32 text-slate-800 stroke-[1.2] opacity-90 group-hover:scale-102 transition-transform" />
            </div>
          </div>

          {/* Demonstration Tooltips / Quick Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              <Info className="h-3 w-3" />
              <span>Demo Controls</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoQrScan("member")}
                className="w-full py-1.5 px-3 bg-stone-100 hover:bg-stone-150 text-slate-700 hover:text-slate-900 border border-stone-250/60 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5 text-[#A2C62C]" />
                {t.demoScanBtn}
              </button>
              <button
                type="button"
                onClick={() => handleDemoQrScan("coupon")}
                className="w-full py-1.5 px-3 bg-stone-100 hover:bg-stone-150 text-slate-700 hover:text-slate-900 border border-stone-250/60 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {t.demoPromoBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Phone Number Input + Touch Numpad */}
        <div className="md:col-span-7 flex flex-col justify-between bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm relative text-left">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-md font-display font-black text-slate-900 uppercase flex items-center gap-2">
                <Phone className="h-4.5 w-4.5 text-[#A2C62C]" />
                {t.phoneLoginTitle}
              </h3>
              <p className="text-xs text-slate-400 font-sans font-medium">
                {t.phoneLoginDesc}
              </p>
            </div>

            {/* Input field */}
            <form onSubmit={handlePhoneSubmit} className="relative mt-2">
              <input
                type="text"
                readOnly
                value={phone}
                placeholder={t.phonePlaceholder}
                className="w-full text-center py-4 bg-stone-50 text-slate-900 font-display font-black text-2xl tracking-widest rounded-2xl border-2 border-stone-200 focus:outline-none focus:border-[#A2C62C] transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {phone.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-full bg-stone-150 hover:bg-stone-200 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Verification Status Feedback Panel */}
            <AnimatePresence mode="wait">
              {lookupResult && (
                <motion.div
                  key={lookupResult.found ? "found" : "notfound"}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs font-medium leading-relaxed transition ${
                    lookupResult.found
                      ? "bg-emerald-50 border-emerald-150 text-emerald-800"
                      : "bg-amber-50 border-amber-150 text-amber-800"
                  }`}
                >
                  {lookupResult.found ? (
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{lookupResult.message}</p>
                    {lookupResult.customer && (
                      <p className="text-[10px] text-emerald-600 font-sans mt-1">
                        Hạng: VIP Silver • Điểm tích luỹ: {lookupResult.customer.points} PTS
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom On-screen Numerical Keyboard / Dialpad */}
            <div className="grid grid-cols-3 gap-2 pt-2 max-w-sm mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 font-display font-black text-slate-800 text-lg active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 font-bold text-slate-600 text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Delete className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="py-3.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 font-display font-black text-slate-800 text-lg active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                disabled={phone.length < 9}
                onClick={() => handlePhoneSubmit()}
                className={`py-3.5 rounded-xl font-display font-black text-sm active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer border-0 ${
                  phone.length >= 9
                    ? "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950"
                    : "bg-stone-100 text-stone-450 border border-stone-200 cursor-not-allowed"
                }`}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Action Row at Bottom of Phone Login Column */}
          <div className="pt-4 border-t border-stone-100 space-y-4 mt-4">
            <button
              type="button"
              onClick={() => {
                if (onStartOrder) onStartOrder();
              }}
              className="w-full py-6 px-8 bg-[#A2C62C] hover:bg-[#91b324] text-slate-950 rounded-2xl text-sm font-black uppercase tracking-widest transition duration-300 flex items-center justify-center gap-3 group cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.015] border-0"
            >
              <Car className="h-6 w-6 text-slate-950 group-hover:scale-110 transition-transform" />
              {t.guestBtn}
            </button>

            <button
              type="button"
              onClick={() => {
                setRegPhone(phone); // Pre-populate registration phone if typed
                setShowRegModal(true);
              }}
              className="w-full py-4.5 px-6 bg-white hover:bg-stone-50 text-slate-800 border-2 border-stone-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-sm hover:shadow"
            >
              <UserPlus className="h-4.5 w-4.5 text-slate-600 group-hover:scale-110 transition-transform" />
              {t.registerBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-stone-50 border-t border-stone-150 px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-sans text-slate-400 font-semibold gap-3">
        <span className="uppercase tracking-wider">
          ● WASSUP AUTOMATION INFRASTRUCTURE v3.4.1
        </span>
        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="uppercase tracking-wider font-sans font-bold">100% SECURE PERSONAL DATA PROTECTION</span>
        </div>
      </div>

      {/* NEW CUSTOMER REGISTRATION SLIDE-UP MODAL */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-250 overflow-hidden text-slate-800"
            >
              {/* Modal Header */}
              <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#A2C62C] flex items-center justify-center text-slate-950">
                    <UserPlus className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-black text-sm uppercase tracking-wide">
                      {t.modalTitle}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRegModal(false);
                    setRegSuccess(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body / Form Content */}
              <div className="p-6 text-left">
                {!regSuccess ? (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      {t.modalSub}
                    </p>

                    {/* Name Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-display font-black text-slate-400 uppercase tracking-wider">
                        {t.fullName} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-sans text-xs focus:ring-2 focus:ring-[#A2C62C]/30 focus:outline-none focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-display font-black text-slate-400 uppercase tracking-wider">
                        {t.phoneLabel} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="09xx xxx xxx"
                          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-sans text-xs focus:ring-2 focus:ring-[#A2C62C]/30 focus:outline-none focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* License Plate Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-display font-black text-slate-400 uppercase tracking-wider">
                        {t.plateLabel}
                      </label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={regPlate}
                          onChange={(e) => setRegPlate(e.target.value)}
                          placeholder="51G-12345"
                          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-sans text-xs focus:ring-2 focus:ring-[#A2C62C]/30 focus:outline-none focus:bg-white transition uppercase"
                        />
                      </div>
                    </div>

                    {/* Vehicle Segment Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-display font-black text-slate-400 uppercase tracking-wider">
                        {t.segmentLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRegSegment("sedan")}
                          className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${
                            regSegment === "sedan"
                              ? "bg-lime-50/50 border-[#A2C62C] text-slate-900"
                              : "bg-white border-stone-200 text-slate-500 hover:bg-stone-50"
                          }`}
                        >
                          <Car className="h-4.5 w-4.5" />
                          <span className="text-[10px] font-bold">{t.segmentSedan}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegSegment("suv")}
                          className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${
                            regSegment === "suv"
                              ? "bg-lime-50/50 border-[#A2C62C] text-slate-900"
                              : "bg-white border-stone-200 text-slate-500 hover:bg-stone-50"
                          }`}
                        >
                          <Car className="h-4.5 w-4.5 rotate-12" />
                          <span className="text-[10px] font-bold">{t.segmentSuv}</span>
                        </button>
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRegModal(false);
                          setRegSuccess(false);
                        }}
                        className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition cursor-pointer border-0 bg-transparent"
                      >
                        {t.canceling}
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow shadow-lime-200/55 transition border-0 cursor-pointer"
                      >
                        {t.confirmReg}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Success State inside Modal */
                  <div className="py-8 text-center space-y-4">
                    <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                      <CheckCircle className="h-10 w-10 stroke-[2]" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-display font-black text-slate-950 uppercase tracking-tight">
                        {t.regSuccessTitle}
                      </h4>
                      <p className="text-xs text-slate-500 font-sans max-w-xs mx-auto">
                        Chào mừng hội viên <strong className="text-slate-900">{createdMember?.name}</strong>! Bạn nhận ngay 100 điểm thưởng chào mừng cùng mã ưu đãi giảm giá thành viên đặc quyền.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
