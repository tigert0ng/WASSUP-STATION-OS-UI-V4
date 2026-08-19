import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Trash2, X, CheckCircle2, ShieldAlert } from "lucide-react";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemTypeLabel?: string; // e.g. "khách hàng", "voucher", "nhóm khách hàng", "phương tiện", "dịch vụ", "vật tư"
  itemName: string; // The exact text the user must type to confirm
  warningDetails?: string;
  confirmButtonText?: string;
  caseSensitive?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "XÁC NHẬN XÓA DỮ LIỆU",
  itemTypeLabel = "mục",
  itemName,
  warningDetails,
  confirmButtonText = "Xóa vĩnh viễn",
  caseSensitive = false,
}: ConfirmDeleteModalProps) {
  const [typedValue, setTypedValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset input when opening
  useEffect(() => {
    if (isOpen) {
      setTypedValue("");
      setIsDeleting(false);
      // Auto focus after spring transition
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  const targetName = itemName ? itemName.trim() : "";
  const isMatch = caseSensitive
    ? typedValue.trim() === targetName
    : typedValue.trim().toLowerCase() === targetName.toLowerCase();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch || isDeleting) return;

    try {
      setIsDeleting(true);
      await Promise.resolve(onConfirm());
      onClose();
    } catch (err) {
      console.error("Error during deletion confirm:", err);
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
          id="confirm-delete-modal-root"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isDeleting && onClose()}
            className="fixed inset-0 bg-matte-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden z-10 font-sans text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red Accent Header Banner */}
            <div className="bg-red-50/90 border-b border-red-100 p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black font-display text-red-950 uppercase tracking-tight">
                    {title}
                  </h3>
                  <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block mt-0.5">
                    Hành động nguy hiểm · Không thể hoàn tác
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer border-0 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirm} className="p-4 sm:p-5 space-y-4">
              <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <p>
                  Bạn đang thực hiện thao tác xóa {itemTypeLabel}:
                </p>

                {/* Target Name Highlight Box */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-sm text-matte-black select-all break-all">
                    {targetName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-bold text-[10px] uppercase shrink-0">
                    {itemTypeLabel}
                  </span>
                </div>

                {warningDetails && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{warningDetails}</span>
                  </p>
                )}

                <p className="text-stone-700 font-medium pt-1">
                  Để xác nhận, vui lòng nhập chính xác tên <strong className="text-red-700 font-mono">"{targetName}"</strong> vào ô bên dưới:
                </p>
              </div>

              {/* Confirmation Input Field */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    disabled={isDeleting}
                    value={typedValue}
                    onChange={(e) => setTypedValue(e.target.value)}
                    placeholder={`Nhập chính xác "${targetName}"...`}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition focus:outline-hidden ${
                      isMatch
                        ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-500/20"
                        : typedValue.length > 0
                        ? "border-red-400 bg-red-50/20 text-matte-black focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-stone-300 bg-white text-matte-black focus:border-matte-black focus:ring-2 focus:ring-matte-black/10"
                    }`}
                  />
                  {isMatch && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold pointer-events-none">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[10px] hidden sm:inline uppercase">Khớp</span>
                    </div>
                  )}
                </div>
                {typedValue.length > 0 && !isMatch && (
                  <span className="text-[10px] font-bold text-red-600 block pl-1">
                    Tên nhập chưa khớp với "{targetName}"
                  </span>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 bg-white hover:bg-stone-100 transition text-xs font-bold font-display uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={!isMatch || isDeleting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 transition shadow-xs border-0 ${
                    isMatch && !isDeleting
                      ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-red-500/25 active:scale-[0.98]"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Đang xóa dữ liệu..." : confirmButtonText}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
