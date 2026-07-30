import React, { useState } from "react";
import { 
  Lock, 
  Phone, 
  ShieldCheck, 
  User, 
  Key, 
  AlertCircle, 
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";

interface LoginModuleProps {
  staff: any[];
  onLoginSuccess: (user: any) => void;
}

export default function LoginModule({ staff, onLoginSuccess }: LoginModuleProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // High-fidelity validation feedback
  const [phoneError, setPhoneError] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Forgot password flow states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotIsLoading, setForgotIsLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotErrorMsg, setForgotErrorMsg] = useState<string | null>(null);

  // Filter out blocked users from Quick Login list
  const activeStaff = staff.filter(s => s.status !== "blocked");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPhoneError(false);
    setPinError(false);

    if (!phoneInput.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại!");
      setPhoneError(true);
      return;
    }
    if (!pinInput) {
      setErrorMsg("Vui lòng nhập mã PIN bảo mật!");
      setPinError(true);
      return;
    }

    setIsLoading(true);

    // Simulate database lookup latency for a real-world feel
    setTimeout(() => {
      // Find staff by phone
      const matched = staff.find(s => s.phone === phoneInput.trim());

      if (!matched) {
        setErrorMsg("Đăng nhập không thành công: Không tìm thấy nhân sự có số điện thoại này!");
        setPhoneError(true);
        setIsLoading(false);
        return;
      }

      if (matched.status === "blocked") {
        setErrorMsg("Đăng nhập không thành công: Tài khoản của bạn đã bị vô hiệu hóa! Vui lòng liên hệ Master Admin.");
        setIsLoading(false);
        return;
      }

      // Safe PIN comparison: accept "123456" as default for any staff without custom pin
      const storedPin = matched.pin || "123456";
      if (pinInput !== storedPin) {
        setErrorMsg("Đăng nhập không thành công: Mã PIN bảo mật không chính xác!");
        setPinError(true);
        setIsLoading(false);
        return;
      }

      // Success
      setIsLoading(false);
      onLoginSuccess(matched);
    }, 600);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg(null);
    setForgotSuccessMsg(null);

    const targetPhone = forgotPhone.trim();
    if (!targetPhone) {
      setForgotErrorMsg("Vui lòng nhập số điện thoại!");
      return;
    }

    setForgotIsLoading(true);

    setTimeout(() => {
      // Find staff by phone
      const matched = staff.find(s => s.phone === targetPhone);
      if (!matched) {
        setForgotErrorMsg("Không tìm thấy số điện thoại nhân sự này trên hệ thống!");
        setForgotIsLoading(false);
        return;
      }

      setForgotIsLoading(false);
      setForgotSuccessMsg(`Yêu cầu khôi phục mã PIN cho nhân viên "${matched.name}" đã được gửi thành công đến Master Admin! Vui lòng chờ phê duyệt.`);
    }, 800);
  };

  const selectQuickLogin = (member: any) => {
    setPhoneInput(member.phone);
    setPinInput(member.pin || "123456");
    setErrorMsg(null);
    setPhoneError(false);
    setPinError(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "master_admin": return "Master Admin";
      case "manager": return "Quản Lý Trạm";
      case "technician": return "Kỹ Thuật Viên";
      case "accountant": return "Kế Toán";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "master_admin": return "bg-purple-500/10 text-purple-400 border border-purple-500/30";
      case "manager": return "bg-blue-500/10 text-blue-400 border border-blue-500/30";
      case "technician": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "accountant": return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      default: return "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 font-sans" id="login-container">
      <div className="w-full max-w-md bg-matte-black border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
        
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-brand-green flex items-center justify-center shadow-lg shadow-brand-green/20">
            <span className="font-display text-xl font-black text-matte-black tracking-widest">W</span>
          </div>
          <div>
            <span className="text-[10px] text-brand-green font-extrabold tracking-widest uppercase block">
              <Sparkles className="h-3 w-3 inline mr-1 text-[#A2C62C]" />
              SECURE AUTHORIZATION
            </span>
            <h2 className="text-xl font-black font-display text-white uppercase tracking-tight mt-1">
              ĐĂNG NHẬP TRẠM WASSUP
            </h2>
            <p className="text-[11px] text-stone-400 max-w-xs mt-1">
              Hệ thống xác thực người dùng & phân quyền truy cập chức năng vận hành.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-5 flex items-start gap-2.5 text-xs animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
              Số điện thoại nhân sự
            </label>
            <div className="relative">
              <Phone className={`absolute left-3.5 top-3 h-4 w-4 ${phoneError ? "text-red-400" : "text-stone-500"}`} />
              <input
                type="tel"
                placeholder="Ví dụ: 0901234567"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (phoneError) setPhoneError(false);
                }}
                disabled={isLoading}
                className={`w-full bg-stone-900 border ${
                  phoneError ? "border-red-500/80 focus:border-red-500" : "border-stone-800 focus:border-brand-green"
                } rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-stone-600 focus:outline-none transition focus:bg-[#1a1a1a]`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
                Mã PIN bảo mật
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[9.5px] text-brand-green hover:text-[#b5e032] font-semibold hover:underline cursor-pointer focus:outline-none transition"
              >
                Quên mã PIN?
              </button>
            </div>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-3 h-4 w-4 ${pinError ? "text-red-400" : "text-stone-500"}`} />
              <input
                type="password"
                maxLength={8}
                placeholder="Nhập mã PIN"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError(false);
                }}
                disabled={isLoading}
                className={`w-full bg-stone-900 border ${
                  pinError ? "border-red-500/80 focus:border-red-500" : "border-stone-800 focus:border-brand-green"
                } rounded-xl pl-10 pr-4 py-3 text-xs font-sans font-bold tracking-widest text-white placeholder-stone-600 focus:outline-none transition focus:bg-[#1a1a1a]`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-green hover:bg-[#b5e032] text-matte-black font-black font-display uppercase tracking-wider rounded-xl transition shadow-lg shadow-brand-green/10 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-55"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-matte-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>XÁC THỰC ĐĂNG NHẬP</span>
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Accounts Accordion */}
        <div className="mt-8 pt-6 border-t border-stone-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-stone-400">
            <Info className="h-3.5 w-3.5 text-brand-green" />
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider block">
              QUICK LOGINS FOR TESTING (ROLE SELECTION)
            </span>
          </div>

          <p className="text-[10px] text-stone-500 leading-normal">
            Bấm nhanh vào tài khoản nhân sự bên dưới để tự động điền thông tin và kiểm tra phân quyền (RBAC) chi tiết:
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {activeStaff.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => selectQuickLogin(member)}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-left transition flex flex-col justify-between gap-1.5 hover:border-stone-700 cursor-pointer text-[11px]"
              >
                <div>
                  <div className="font-bold text-stone-200 truncate">{member.name}</div>
                  <div className="text-[9px] text-stone-500 font-sans mt-0.5">{member.phone}</div>
                </div>
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase self-start ${getRoleColor(member.role)}`}>
                  {getRoleLabel(member.role)}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-white font-sans">
          <div className="w-full max-w-sm bg-matte-black border border-stone-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              type="button" 
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccessMsg(null);
                setForgotErrorMsg(null);
                setForgotPhone("");
              }}
              className="absolute top-4 right-4 text-stone-500 hover:text-white transition cursor-pointer text-lg leading-none"
            >
              &times;
            </button>
            
            <div className="flex flex-col items-center text-center space-y-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Key className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  KHÔI PHỤC MÃ PIN BẢO MẬT
                </h3>
                <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                  Hệ thống bảo mật trạm WASSUP. Gửi yêu cầu phê duyệt đặt lại mã PIN tới tài khoản Master Admin của hệ thống.
                </p>
              </div>
            </div>

            {forgotSuccessMsg ? (
              <div className="space-y-4 text-center py-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs leading-normal">
                  {forgotSuccessMsg}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccessMsg(null);
                    setForgotErrorMsg(null);
                    setForgotPhone("");
                  }}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ĐÓNG CỬA SỔ
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                {forgotErrorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-2.5 rounded-lg text-[11px] flex items-start gap-2 leading-normal">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{forgotErrorMsg}</span>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block">
                    Nhập số điện thoại nhân sự của bạn
                  </label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0901234567"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    required
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-stone-600 focus:outline-none focus:border-brand-green transition focus:bg-[#1a1a1a]"
                  />
                </div>

                <div className="bg-stone-900/50 border border-stone-800/80 p-3 rounded-xl space-y-1 text-[10.5px] text-stone-400 leading-normal">
                  <div className="font-bold text-stone-300 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-brand-green" /> Hotline hỗ trợ trạm:
                  </div>
                  <div>Quản lý trực ban: <span className="font-bold text-white">0901.234.567</span></div>
                  <div>Lưu ý: Bạn cũng có thể gặp trực tiếp Quản lý hoặc Master Admin của trạm để được cập nhật lại mã PIN nhanh chóng.</div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 border border-stone-800 hover:bg-stone-900 text-stone-400 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={forgotIsLoading}
                    className="flex-1 py-2.5 bg-brand-green hover:bg-[#b5e032] text-matte-black text-xs font-black rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {forgotIsLoading ? (
                      <div className="h-3.5 w-3.5 border-2 border-matte-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>GỬI YÊU CẦU</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
