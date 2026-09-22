import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tablet, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Delete, 
  ArrowRight, 
  Building2,
  Sparkles,
  QrCode
} from "lucide-react";
import WassupLogo from "../common/WassupLogo";
import { simActions } from "../../lib/supabase/client";

interface KioskDevicePairingProps {
  onPairSuccess: (session: any) => void;
}

export default function KioskDevicePairing({ onPairSuccess }: KioskDevicePairingProps) {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Confirmation state (Mandatory v3.1)
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    stationId: string;
    stationName: string;
    code: string;
  } | null>(null);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setErrorMsg("");
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleClear = () => {
    setPin("");
    setErrorMsg("");
  };

  const handleVerify = (codeToTest?: string) => {
    const targetCode = (codeToTest || pin).replace(/\D/g, "");
    if (targetCode.length < 6) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số mã ghép đôi.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");

    setTimeout(() => {
      const result = simActions.verifyKioskPairingCode(targetCode);
      setIsVerifying(false);

      if (result.valid) {
        // Must show confirmation step per PRD v3.1 (§0, §9.1 US-K0.2)
        setPendingConfirmation({
          stationId: result.stationId || "st-001",
          stationName: result.stationName || "WASSUP Trạm Pilot - Quận 7",
          code: targetCode
        });
      } else {
        setErrorMsg(result.error || "Mã ghép đôi không hợp lệ hoặc đã hết hạn.");
      }
    }, 400);
  };

  const handleConfirmPairing = () => {
    if (!pendingConfirmation) return;
    const res: any = simActions.confirmPairKioskDevice(pendingConfirmation.code, "Kiosk Sảnh 01 (Tablet 9:16)");
    if (res.valid && res.session) {
      onPairSuccess(res.session);
    } else {
      setErrorMsg(res.error || "Lỗi lưu phiên thiết bị. Vui lòng thử lại.");
      setPendingConfirmation(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col justify-center items-center min-h-[85vh]">
      
      {/* Brand Header */}
      <div className="text-center space-y-3 mb-6">
        <WassupLogo className="h-16 w-auto mx-auto filter drop-shadow-sm select-none" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-[#A2C62C] text-[10px] font-black uppercase tracking-widest border border-slate-800 shadow-sm">
          <Tablet className="h-3.5 w-3.5" />
          K0: THIẾT LẬP &amp; GHÉP ĐÔI THIẾT BỊ (DEVICE PAIRING)
        </div>
      </div>

      <div className="w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 uppercase tracking-tight">
            GHÉP ĐÔI KIOSK VỚI TRẠM
          </h2>
          <p className="text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
            Nhập mã PIN 6 số do Quản lý trạm cấp từ Station OS Admin Hub để liên kết vĩnh viễn tablet này với trạm rửa xe.
          </p>
        </div>

        {/* 6 Digit Display Boxes */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const digit = pin[idx];
            const isCurrent = pin.length === idx;
            return (
              <React.Fragment key={`kiosk-pair-digit-${idx}`}>
                {idx === 3 && (
                  <span className="text-stone-400 font-mono text-xl font-black select-none">-</span>
                )}
                <div
                  className={`h-13 w-11 sm:h-14 sm:w-12 rounded-2xl flex items-center justify-center font-mono font-black text-2xl transition-all ${
                    digit
                      ? "bg-slate-950 text-[#A2C62C] border-2 border-slate-900 shadow-inner scale-105"
                      : isCurrent
                        ? "bg-lime-50 border-2 border-[#A2C62C] text-slate-900 ring-2 ring-[#A2C62C]/30 animate-pulse"
                        : "bg-stone-50 border border-stone-200 text-stone-300"
                  }`}
                >
                  {digit || "•"}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-sm animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Touch Dialpad Grid */}
        <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={`pair-key-${num}`}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-slate-950 active:text-[#A2C62C] active:scale-95 text-slate-800 font-display font-black text-xl transition-all flex items-center justify-center border-0 cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-500 font-display font-bold text-xs uppercase transition active:scale-95 flex items-center justify-center border-0 cursor-pointer"
          >
            XÓA HẾT
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-slate-950 active:text-[#A2C62C] active:scale-95 text-slate-800 font-display font-black text-xl transition-all flex items-center justify-center border-0 cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 active:bg-red-100 text-slate-700 transition active:scale-95 flex items-center justify-center border-0 cursor-pointer"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={pin.length < 6 || isVerifying}
            onClick={() => handleVerify()}
            className={`w-full py-4 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-0 shadow-lg cursor-pointer ${
              pin.length === 6 && !isVerifying
                ? "bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 shadow-lime-200"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ĐANG KIỂM TRA MÃ...
              </span>
            ) : (
              <>
                TIẾP TỤC XÁC THỰC MÃ <ArrowRight className="h-4 w-4 stroke-[3]" />
              </>
            )}
          </button>

          {/* Quick Demo Helper */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setPin("652000");
                handleVerify("652000");
              }}
              className="text-[11px] font-sans font-bold text-slate-400 hover:text-slate-700 underline cursor-pointer bg-transparent border-0"
            >
              ⚡ Bấm vào đây để điền mã mẫu thử nghiệm (652-000 • Trạm Pilot Q7)
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-sans">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Phiên thiết bị Kiosk được mã hóa và tự động gia hạn an toàn theo tiêu chuẩn WASSUP</span>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL (PRD v3.1 §0 & §9.1 US-K0.2) */}
      <AnimatePresence>
        {pendingConfirmation && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 text-center text-slate-800"
            >
              <div className="h-16 w-16 bg-lime-100 text-[#A2C62C] rounded-2xl mx-auto flex items-center justify-center">
                <Building2 className="h-9 w-9 text-slate-950" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block">
                  ⚠️ BƯỚC XÁC NHẬN BẮT BUỘC (PRD v3.1)
                </span>
                <h3 className="text-xl font-black font-display text-slate-950 uppercase tracking-tight">
                  XÁC NHẬN GHÉP THIẾT BỊ
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Bạn đang chuẩn bị ghép tablet này cho trạm dịch vụ:
                </p>
              </div>

              {/* Station Card */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl space-y-1.5 text-left border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A2C62C]">
                    TÊN TRẠM RỬA XE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {pendingConfirmation.stationId}</span>
                </div>
                <h4 className="text-lg font-black font-display text-white tracking-wide">
                  {pendingConfirmation.stationName}
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Mã kích hoạt: <strong className="font-mono text-white">{pendingConfirmation.code.slice(0, 3)}-{pendingConfirmation.code.slice(3)}</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-slate-600 text-left font-sans space-y-1">
                <p className="font-bold text-slate-800">Lưu ý quan trọng từ Tiger (v3.1):</p>
                <p className="text-slate-500">
                  Sau khi xác nhận, mọi đơn hàng tạo từ kiosk này sẽ gán vĩnh viễn vào trạm trên. Ghép nhầm trạm sẽ không thể phục hồi dữ liệu đơn hàng cũ.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmPairing}
                  className="w-full py-4 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer border-0"
                >
                  XÁC NHẬN GHÉP ĐÔI THIẾT BỊ NÀY ✓
                </button>
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(null)}
                  className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-slate-600 font-display font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer border-0"
                >
                  HỦY / NHẬP LẠI MÃ KHÁC
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
