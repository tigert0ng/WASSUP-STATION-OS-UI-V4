import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

/**
 * Khung Drawer dùng chung cho toàn dự án — trượt vào từ bên phải, cùng
 * pattern gốc từ InventoryModule.tsx ("inventory-add-drawer": backdrop mờ
 * dần + panel spring-slide từ x:100%), sau đó Module 3 (POS) đã port thành
 * component dùng chung này trước khi được nâng lên `common/` để mọi module
 * dùng chung 1 nguồn duy nhất.
 *
 * Quy ước UI của Tiger (áp dụng toàn dự án, không riêng module nào):
 * - Drawer dùng để THỰC HIỆN 1 hành động/lệnh — nhập dữ liệu rồi submit
 *   (mở/đóng ca, ghi nhận thanh toán/đặt cọc/phiếu thu, đề xuất điều
 *   chỉnh/phiếu chi, ghi đè 1 dòng bonus, tạo/sửa 1 dòng danh mục...).
 * - Popup (dialog giữa màn hình) CHỈ dùng cho cảnh báo/xác nhận hành động
 *   quan trọng, nguy hiểm, không hoàn tác được — nút xác nhận để chắc chắn
 *   người dùng hiểu rõ hậu quả (huỷ bàn giao, đóng ca một mình, mở khoá lại
 *   ca, tính lại bonus tháng, duyệt bonus tháng, từ chối phiếu chi, xoá vật
 *   tư/nhân sự...). Xem ví dụ reasonModal trong ShiftPanel.tsx.
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  widthClass = "max-w-md",
  closable = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footer: React.ReactNode;
  widthClass?: string;
  closable?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closable && onClose()}
            className={`absolute inset-0 bg-matte-black/60 backdrop-blur-xs ${closable ? "cursor-pointer" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240, mass: 0.9 }}
              className={`w-screen ${widthClass} bg-white border-l border-[#e5e5e5] shadow-2xl flex flex-col h-full overflow-hidden`}
            >
              <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-green/15 rounded-xl">
                    <Icon className="h-5 w-5 text-forest-green" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display tracking-wider text-matte-black uppercase">{title}</h3>
                    {subtitle && <p className="text-[10px] text-mid-gray font-sans mt-0.5">{subtitle}</p>}
                  </div>
                </div>
                {closable && (
                  <button onClick={onClose} className="p-2 rounded-xl text-mid-gray hover:text-matte-black hover:bg-stone-200/50 transition cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
              <div className="border-t border-[#e5e5e5] bg-stone-50 p-6 flex gap-3">{footer}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Nút bo tròn full-width dùng trong footer Drawer — cặp Hủy (trắng viền) +
 * hành động chính (màu theo variant), cùng tỉ lệ flex-1 hai bên. */
export function DrawerFooterButtons({
  onCancel,
  cancelLabel = "Hủy",
  onSubmit,
  submitLabel,
  submitDisabled,
  submitBusy,
  submitVariant = "primary",
}: {
  onCancel: () => void;
  cancelLabel?: string;
  onSubmit: () => void;
  submitLabel: React.ReactNode;
  submitDisabled?: boolean;
  submitBusy?: boolean;
  submitVariant?: "primary" | "destructive";
}) {
  const submitClass =
    submitVariant === "primary"
      ? "bg-brand-green hover:bg-brand-green-hover text-matte-black"
      : "bg-red-500 hover:bg-red-600 text-white";
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-stone-200 text-mid-gray bg-white hover:bg-stone-100/50 transition text-xs font-extrabold font-display uppercase cursor-pointer"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className={`flex-1 py-3 rounded-xl font-extrabold font-display uppercase text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-0 ${submitClass}`}
      >
        {submitBusy && <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {submitLabel}
      </button>
    </>
  );
}
