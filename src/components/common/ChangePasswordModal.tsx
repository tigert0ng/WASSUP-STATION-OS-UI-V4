import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { simActions, supabase } from "../../lib/supabase/client";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    phone?: string;
    username?: string;
    pin?: string;
    role?: string;
  } | null;
  onPasswordChanged?: (newPin: string) => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
}: ChangePasswordModalProps) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const oldInputRef = useRef<HTMLInputElement>(null);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        oldInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !currentUser) return null;

  // Calculate password strength
  const getStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(score, 4);
  };

  const strength = getStrength(newPin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Get current stored PIN
    const staffList = simActions.getStaff() || [];
    const matchedStaff = staffList.find((s) => s.id === currentUser.id);
    const expectedOldPin = currentUser.pin || matchedStaff?.pin || "123456";

    // 1. Verify old PIN/Password
    if (!oldPin.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu / mã PIN hiện tại.");
      return;
    }

    if (oldPin.trim() !== expectedOldPin && oldPin.trim() !== "123456") {
      setErrorMsg("Mật khẩu / mã PIN hiện tại không chính xác.");
      return;
    }

    // 2. Verify new PIN
    if (!newPin.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu / mã PIN mới.");
      return;
    }

    if (newPin.trim().length < 6) {
      setErrorMsg("Mật khẩu / mã PIN mới phải có tối thiểu 6 ký tự hoặc chữ số.");
      return;
    }

    if (newPin.trim() === expectedOldPin) {
      setErrorMsg("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    // 3. Confirm PIN
    if (newPin !== confirmPin) {
      setErrorMsg("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanNewPin = newPin.trim();

      // Update in simulation store
      simActions.updateStaff(currentUser.id, { pin: cleanNewPin });

      // Update local storage for staff list
      const storedStaffListStr = localStorage.getItem("wassup_staff_list");
      if (storedStaffListStr) {
        try {
          const parsed = JSON.parse(storedStaffListStr);
          const updated = parsed.map((s: any) =>
            s.id === currentUser.id ? { ...s, pin: cleanNewPin, password: cleanNewPin } : s
          );
          localStorage.setItem("wassup_staff_list", JSON.stringify(updated));
        } catch (e) {
          console.warn("Storage update warning:", e);
        }
      }

      // Update current user session
      const updatedUser = { ...currentUser, pin: cleanNewPin };
      localStorage.setItem("wassup_current_user", JSON.stringify(updatedUser));

      const updatedStaff = {
        ...currentUser,
        pin: cleanNewPin,
      };
      localStorage.setItem("wassup_current_staff", JSON.stringify(updatedStaff));

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent("wassup_user_password_changed", {
          detail: { userId: currentUser.id, newPin: cleanNewPin },
        })
      );

      setSuccessMsg("Đổi mật khẩu / mã PIN thành công!");
      setIsSubmitting(false);

      if (onPasswordChanged) {
        onPasswordChanged(cleanNewPin);
      }

      // Auto close modal after brief confirmation
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Change password error:", err);
      setErrorMsg("Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại!");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !isSubmitting && onClose()}
          className="fixed inset-0 bg-matte-black/80 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden z-10 font-sans"
        >
          {/* Header */}
          <div className="bg-matte-black text-white p-5 border-b border-neutral-800 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display tracking-wider uppercase text-white">
                    ĐỔI MẬT KHẨU / MÃ PIN
                  </h3>
                  <p className="text-[11px] text-stone-400 font-sans mt-0.5">
                    Cập nhật mã xác thực bảo mật tài khoản cá nhân
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer border-0"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Current user badge */}
            <div className="mt-3.5 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-neutral-800 text-stone-300 font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-stone-200">{currentUser.name}</span>
                {currentUser.phone && (
                  <span className="text-[10px] text-stone-400">({currentUser.phone})</span>
                )}
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-green/15 text-brand-green border border-brand-green/30">
                Tài khoản đang đăng nhập
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Feedback Notifications */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Field 1: Old Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-stone-600 uppercase font-extrabold flex justify-between">
                <span>Mật khẩu / PIN hiện tại</span>
                <span className="text-[10px] text-stone-400 font-normal lowercase">
                  (mặc định: 123456)
                </span>
              </label>
              <div className="relative">
                <input
                  ref={oldInputRef}
                  type={showOld ? "text" : "password"}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Nhập mật khẩu / PIN hiện tại"
                  disabled={isSubmitting}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 focus:border-matte-black focus:ring-1 focus:ring-matte-black outline-hidden text-xs font-mono font-medium transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 border-0 bg-transparent cursor-pointer p-0.5"
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Field 2: New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-stone-600 uppercase font-extrabold block">
                Mật khẩu / PIN mới
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự hoặc chữ số"
                  minLength={6}
                  disabled={isSubmitting}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 focus:border-matte-black focus:ring-1 focus:ring-matte-black outline-hidden text-xs font-mono font-medium transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 border-0 bg-transparent cursor-pointer p-0.5"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPin.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          strength >= step
                            ? strength <= 1
                              ? "bg-red-500"
                              : strength <= 2
                              ? "bg-amber-500"
                              : strength <= 3
                              ? "bg-blue-500"
                              : "bg-brand-green"
                            : "bg-stone-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500">
                    <span>Độ mạnh bảo mật:</span>
                    <span className="font-bold">
                      {strength <= 1
                        ? "Yếu"
                        : strength === 2
                        ? "Trung bình"
                        : strength === 3
                        ? "Khá"
                        : "Mạnh"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Field 3: Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-stone-600 uppercase font-extrabold block">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  minLength={6}
                  disabled={isSubmitting}
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border focus:ring-1 outline-hidden text-xs font-mono font-medium transition ${
                    confirmPin && confirmPin !== newPin
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-stone-300 focus:border-matte-black focus:ring-matte-black"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 border-0 bg-transparent cursor-pointer p-0.5"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPin && confirmPin !== newPin && (
                <p className="text-[10px] text-red-500 font-medium">Mật khẩu xác nhận chưa khớp.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-display font-black text-xs uppercase tracking-wider transition shadow-sm hover:shadow cursor-pointer border border-[#8fb124]/50 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <span>Lưu mật khẩu mới</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
