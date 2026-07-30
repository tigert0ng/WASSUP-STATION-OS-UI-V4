import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertTriangle, ImageIcon, Hammer, FileText, Bold, Italic, Underline, Tag, Trash2, History } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import { ADDON_CATEGORY_LABELS, AddonCategory, HighlightType, ServiceRow, ServiceType } from "../../../types/catalog.types";
import { renderRichText, wrapSelection } from "../../../lib/catalog/richText";
import BomEditor from "./BomEditor";

const HISTORY_ACTION_LABELS: Record<string, string> = {
  create_service: "Tạo dịch vụ",
  update_service: "Cập nhật dịch vụ",
  delete_service: "Xóa dịch vụ",
};

interface HistoryRow {
  id: string;
  actor_id: string | null;
  action: string;
  before: Partial<ServiceRow> | null;
  after: Partial<ServiceRow> | null;
  at: string;
}

const HIGHLIGHT_OPTIONS: { value: HighlightType; label: string; swatchClass: string }[] = [
  { value: "none", label: "Thường", swatchClass: "bg-white border-gray-300 text-matte-black" },
  { value: "best_seller", label: "Best Seller", swatchClass: "bg-brand-green border-brand-green text-matte-black" },
  { value: "vip", label: "VIP", swatchClass: "bg-warm-gold border-amber-600 text-white" },
  { value: "custom", label: "Đen Mờ", swatchClass: "bg-matte-black border-matte-black text-white" },
];

const ADDON_CATEGORY_OPTIONS = Object.entries(ADDON_CATEGORY_LABELS) as [AddonCategory, string][];

// S5.2/S5.3 — Form sửa gói dịch vụ / dịch vụ lẻ, gộp 2 tab: Thông tin +
// S5.7 Định mức vật tư. service=null nghĩa là tạo mới.
interface Props {
  service: ServiceRow | null;
  type: ServiceType;
  onClose: () => void;
  onSaved: () => void;
}

const formatVnd = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function ServiceFormDrawer({ service, type, onClose, onSaved }: Props) {
  const { can, staff } = useAuth();
  const canWrite = can("catalog", "update") || (!service && can("catalog", "create"));
  const isCreate = !service;
  const canDelete = !isCreate && can("catalog", "delete");
  // audit_log_select ở migration 0003 gate theo quyền 'settings' read (không
  // phải 'catalog') — Quản lý/Thu ngân xem/sửa được dịch vụ nhưng không thấy
  // lịch sử nếu không có quyền Cài đặt, nên ẩn hẳn mục này thay vì hiện rỗng
  // gây hiểu lầm "chưa có thay đổi nào".
  const canViewHistory = !isCreate && can("settings", "read");

  const [tab, setTab] = useState<"info" | "bom">("info");
  const [code, setCode] = useState(service?.code ?? "");
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(String(service?.price ?? ""));
  const [durationMin, setDurationMin] = useState(String(service?.duration_min ?? "30"));
  const [durationMax, setDurationMax] = useState(String(service?.duration_max ?? "30"));
  const [checklistText, setChecklistText] = useState((service?.checklist_jsonb ?? []).join("\n"));
  const [descriptionText, setDescriptionText] = useState((service?.description_bullets_jsonb ?? []).join("\n"));
  const [imageUrl, setImageUrl] = useState(service?.image_url ?? "");
  const [exemptSurcharge, setExemptSurcharge] = useState(service?.exempt_surcharge ?? false);
  const [standalone, setStandalone] = useState(service?.standalone ?? true);
  const [active, setActive] = useState(service?.active ?? false);
  const [highlightType, setHighlightType] = useState<HighlightType>(service?.highlight_type ?? "none");
  const [addonCategory, setAddonCategory] = useState<AddonCategory | "">(service?.addon_category ?? "");
  const [descPreview, setDescPreview] = useState(false);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [bomCount, setBomCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyActors, setHistoryActors] = useState<Record<string, string>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  function applyDescFormat(prefix: string, suffix: string, placeholder: string) {
    const el = descTextareaRef.current;
    if (!el) return;
    const result = wrapSelection(descriptionText, el.selectionStart, el.selectionEnd, prefix, suffix, placeholder);
    setDescriptionText(result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  const showToast = (kind: "success" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    // Đếm ngay khi mở drawer (không đợi user bấm sang tab BOM) — nếu không,
    // toggle "Hoạt động" của 1 dịch vụ đã active sẵn sẽ hiện sai là bị khóa.
    if (!service || !supabase) return;
    void (async () => {
      const { count } = await supabase
        .from("service_bom")
        .select("id", { count: "exact", head: true })
        .eq("service_id", service.id);
      setBomCount(count ?? 0);
    })();
  }, [service]);

  useEffect(() => {
    if (!service || !supabase || !canViewHistory) return;
    void (async () => {
      setHistoryLoading(true);
      const { data } = await supabase
        .from("audit_log")
        .select("id, actor_id, action, before, after, at")
        .eq("entity", "services")
        .eq("entity_id", service.id)
        .order("at", { ascending: false })
        .limit(10);
      const rows = (data as HistoryRow[]) ?? [];
      setHistory(rows);

      const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id)));
      if (actorIds.length > 0) {
        const { data: staffRows } = await supabase.from("staff").select("id, name").in("id", actorIds);
        const map: Record<string, string> = {};
        for (const s of staffRows ?? []) map[s.id] = s.name;
        setHistoryActors(map);
      }
      setHistoryLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !staff || !canWrite) return;

    if (active && bomCount < 1) {
      showToast("error", 'Chưa thể kích hoạt: cần ít nhất 1 dòng định mức vật tư ở tab "Định mức vật tư".');
      return;
    }

    const checklist = checklistText.split("\n").map((s) => s.trim()).filter(Boolean);
    const descriptionBullets = descriptionText.split("\n").map((s) => s.trim()).filter(Boolean);
    const priceNum = Number(price);
    const durMin = Number(durationMin);
    const durMax = Number(durationMax);

    if (durMax < durMin) {
      showToast("error", "Thời lượng tối đa phải >= thời lượng tối thiểu.");
      return;
    }

    setSaving(true);

    if (isCreate) {
      const { data: stationRow } = await supabase.from("stations").select("id").order("created_at").limit(1).maybeSingle();
      if (!stationRow) {
        setSaving(false);
        showToast("error", "Chưa có trạm — không thể tạo dịch vụ.");
        return;
      }
      const { data, error } = await supabase
        .from("services")
        .insert({
          station_id: stationRow.id,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          type,
          price: priceNum,
          duration_min: durMin,
          duration_max: durMax,
          checklist_jsonb: checklist,
          description_bullets_jsonb: descriptionBullets,
          image_url: imageUrl.trim() || null,
          exempt_surcharge: type === "package" ? exemptSurcharge : false,
          standalone: type === "addon" ? standalone : true,
          addon_category: type === "addon" && addonCategory ? addonCategory : null,
          highlight_type: highlightType,
          active: false,
        })
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        showToast("error", error.message);
        return;
      }
      await logAudit({
        actorId: staff.id,
        module: "catalog",
        action: "create_service",
        entity: "services",
        entityId: data.id,
        after: { code: code.trim().toUpperCase(), name: name.trim(), price: priceNum },
      });
      showToast("success", `Đã tạo dịch vụ ${code.trim().toUpperCase()}. Thêm định mức vật tư để kích hoạt.`);
      onSaved();
      return;
    }

    const before = service!;
    const { error } = await supabase
      .from("services")
      .update({
        name: name.trim(),
        price: priceNum,
        duration_min: durMin,
        duration_max: durMax,
        checklist_jsonb: checklist,
        description_bullets_jsonb: descriptionBullets,
        image_url: imageUrl.trim() || null,
        exempt_surcharge: type === "package" ? exemptSurcharge : false,
        standalone: type === "addon" ? standalone : true,
        addon_category: type === "addon" && addonCategory ? addonCategory : null,
        highlight_type: highlightType,
        active,
      })
      .eq("id", service!.id);
    setSaving(false);
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "update_service",
      entity: "services",
      entityId: service!.id,
      before,
      after: { name: name.trim(), price: priceNum, active },
    });
    showToast("success", `Đã lưu thay đổi cho ${service!.code}.`);
    onSaved();
  }

  // PRD: xóa dịch vụ bắt buộc gõ đúng mã gói để xác nhận (chống bấm nhầm),
  // nút Xóa chỉ enable khi khớp tuyệt đối (không phân biệt hoa/thường).
  async function handleDelete() {
    if (!supabase || !staff || !service) return;
    if (deleteConfirmCode.trim().toUpperCase() !== service.code.toUpperCase()) return;

    setDeleting(true);
    const { error } = await supabase.from("services").delete().eq("id", service.id);
    setDeleting(false);
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "delete_service",
      entity: "services",
      entityId: service.id,
      before: service,
    });
    onSaved();
  }

  const canActivate = bomCount >= 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-matte-black/60 z-40 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-white border-l border-[#e5e5e5] shadow-2xl z-50 overflow-y-auto flex flex-col font-sans text-xs"
      >
        {toast && (
          <div
            className={`fixed top-20 right-6 z-[70] px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 font-sans text-xs font-bold ${
              toast.kind === "success" ? "bg-matte-black text-brand-green border-brand-green/30" : "bg-red-600 text-white border-red-500"
            }`}
          >
            <span>{toast.text}</span>
          </div>
        )}

        <div className="p-6 border-b border-[#e5e5e5] flex justify-between items-center bg-warm-white shrink-0">
          <div>
            <span className="text-[9px] font-extrabold bg-matte-black text-white px-2 py-0.5 rounded uppercase tracking-widest font-mono">
              {isCreate ? `Mã: ${type === "package" ? "W?" : "ADD?"}` : `Mã: ${service!.code}`}
            </span>
            <h3 className="text-base font-black font-display text-matte-black uppercase mt-1">
              {isCreate ? "Tạo dịch vụ mới" : "Cấu hình dịch vụ"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-mid-gray hover:text-matte-black hover:bg-gray-100 rounded-lg transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!canWrite && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-snug">
              Bạn chỉ có quyền xem. Dùng tab "Đề xuất đổi giá" nếu muốn đề xuất giá mới.
            </p>
          </div>
        )}

        {!isCreate && (
          <div className="flex bg-gray-50 border-b border-[#e5e5e5] p-1 gap-1 mx-0 shrink-0">
            <button
              type="button"
              onClick={() => setTab("info")}
              className={`flex-1 py-2 font-display font-extrabold text-[10px] tracking-wider uppercase rounded-lg transition cursor-pointer ${
                tab === "info" ? "bg-white text-forest-green shadow-xs" : "text-mid-gray"
              }`}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1" /> Thông tin
            </button>
            <button
              type="button"
              onClick={() => setTab("bom")}
              className={`flex-1 py-2 font-display font-extrabold text-[10px] tracking-wider uppercase rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === "bom" ? "bg-emerald-600 text-white shadow-xs" : "text-mid-gray"
              }`}
            >
              <Hammer className="h-3.5 w-3.5" /> Định mức (BOM) {bomCount > 0 && `· ${bomCount}`}
            </button>
          </div>
        )}

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {tab === "info" || isCreate ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isCreate && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Mã dịch vụ</label>
                  <input
                    type="text"
                    required
                    disabled={!canWrite}
                    placeholder={type === "package" ? "Vd: W6" : "Vd: ADD03"}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Tên hiển thị</label>
                <input
                  type="text"
                  required
                  disabled={!canWrite}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-mid-gray uppercase font-extrabold block">
                  Đơn giá (VND, xe 4-5 chỗ){!isCreate && !can("catalog", "update") ? " — chỉ Master Admin sửa được" : ""}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  disabled={!canWrite || (!isCreate && !can("catalog", "update"))}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono text-forest-green font-bold focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                />
                {!isCreate && (
                  <p className="text-[9px] text-mid-gray leading-relaxed">
                    Hiện tại: {formatVnd(service!.price)} · phiên bản v{service!.version}.{" "}
                    {Number(price) !== service!.price
                      ? `Lưu sẽ nâng lên v${service!.version + 1}, áp dụng ngay — không hồi tố đơn đã tạo trước đó (versioned pricing).`
                      : "Đổi giá sẽ tự nâng phiên bản, áp dụng từ thời điểm lưu — không hồi tố đơn đã tạo trước đó."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Thời lượng tối thiểu (phút)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    disabled={!canWrite}
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Thời lượng tối đa (phút)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    disabled={!canWrite}
                    value={durationMax}
                    onChange={(e) => setDurationMax(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-mid-gray uppercase font-extrabold block flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" /> URL ảnh minh họa
                </label>
                <input
                  type="text"
                  disabled={!canWrite}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Checklist bước xử lý (mỗi dòng 1 bước)</label>
                <textarea
                  rows={3}
                  disabled={!canWrite}
                  value={checklistText}
                  onChange={(e) => setChecklistText(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-forest-green disabled:bg-gray-50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Loại thẻ hiển thị</label>
                <div className="grid grid-cols-4 gap-2">
                  {HIGHLIGHT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!canWrite}
                      onClick={() => setHighlightType(opt.value)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 ${opt.swatchClass} ${
                        highlightType === opt.value ? "ring-2 ring-forest-green ring-offset-2 font-extrabold scale-105" : "opacity-70"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-tighter block leading-none flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {opt.label}
                      </span>
                      {highlightType === opt.value && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-mid-gray leading-tight">Best Seller = nền xanh primary; VIP = nền vàng warm-gold; Đen Mờ = nền đen, không tag — hiển thị trên thẻ danh sách.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Mô tả gạch đầu dòng (mỗi dòng 1 gạch đầu dòng)</label>
                  <button
                    type="button"
                    onClick={() => setDescPreview((p) => !p)}
                    className="text-[9px] font-extrabold text-forest-green uppercase cursor-pointer hover:underline"
                  >
                    {descPreview ? "Soạn thảo" : "Xem trước"}
                  </button>
                </div>

                {descPreview ? (
                  <div className="w-full bg-warm-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 min-h-[76px]">
                    <ul className="text-xs space-y-1">
                      {descriptionText.split("\n").filter((l) => l.trim()).map((line, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span>•</span>
                          <span dangerouslySetInnerHTML={{ __html: renderRichText(line) }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <>
                    {canWrite && (
                      <div className="flex gap-1 pb-1">
                        <button type="button" onClick={() => applyDescFormat("**", "**", "chữ đậm")} className="p-1.5 rounded-lg border border-[#e5e5e5] text-mid-gray hover:text-matte-black hover:bg-gray-50 cursor-pointer" title="Đậm">
                          <Bold className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => applyDescFormat("*", "*", "chữ nghiêng")} className="p-1.5 rounded-lg border border-[#e5e5e5] text-mid-gray hover:text-matte-black hover:bg-gray-50 cursor-pointer" title="Nghiêng">
                          <Italic className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => applyDescFormat("<u>", "</u>", "gạch chân")} className="p-1.5 rounded-lg border border-[#e5e5e5] text-mid-gray hover:text-matte-black hover:bg-gray-50 cursor-pointer" title="Gạch chân">
                          <Underline className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={descTextareaRef}
                      rows={3}
                      disabled={!canWrite}
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                      className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                    />
                  </>
                )}
              </div>

              {type === "package" && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" disabled={!canWrite} checked={exemptSurcharge} onChange={(e) => setExemptSurcharge(e.target.checked)} className="h-4 w-4 accent-forest-green" />
                  <span className="text-[11px] font-semibold text-matte-black">Miễn phụ thu hạng xe (dùng cho gói Fleet)</span>
                </label>
              )}

              {type === "addon" && (
                <>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" disabled={!canWrite} checked={standalone} onChange={(e) => setStandalone(e.target.checked)} className="h-4 w-4 accent-forest-green" />
                    <span className="text-[11px] font-semibold text-matte-black">Cho phép mua riêng (không bắt buộc kèm gói chính)</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-mid-gray uppercase font-extrabold block">Nhóm hiển thị</label>
                    <select
                      disabled={!canWrite}
                      value={addonCategory}
                      onChange={(e) => setAddonCategory(e.target.value as AddonCategory | "")}
                      className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-forest-green disabled:bg-gray-50"
                    >
                      <option value="">Khác (chưa phân nhóm)</option>
                      {ADDON_CATEGORY_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {!isCreate && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <label className={`flex items-center gap-2.5 select-none ${canWrite && canActivate ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}>
                    <input
                      type="checkbox"
                      disabled={!canWrite || !canActivate}
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="h-4 w-4 accent-forest-green"
                    />
                    <span className="text-[11px] font-black text-matte-black uppercase">Trạng thái: {active ? "Hoạt động" : "Tạm ngừng"}</span>
                  </label>
                  {!canActivate && (
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-rose-800 leading-snug">
                        Chưa cấu hình định mức vật tư — không thể kích hoạt.
                        <button type="button" onClick={() => setTab("bom")} className="block mt-1 font-black underline cursor-pointer">
                          Mở tab Định mức vật tư →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canWrite && (
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold uppercase cursor-pointer">
                    Hủy
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer disabled:opacity-60">
                    {saving ? "Đang lưu..." : isCreate ? "Tạo dịch vụ" : "Lưu thay đổi"}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <BomEditor serviceId={service!.id} serviceName={service!.name} onBomCountChange={setBomCount} />
          )}

          {canViewHistory && tab === "info" && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center gap-1.5 text-matte-black font-display font-black text-[11px] uppercase tracking-wider">
                <History className="h-3.5 w-3.5 text-purple-600" />
                Lịch sử thay đổi
              </div>

              {historyLoading ? (
                <p className="text-[10px] text-mid-gray font-sans">Đang tải...</p>
              ) : history.length === 0 ? (
                <p className="text-[10px] text-mid-gray font-sans italic">Chưa ghi nhận thay đổi nào cho dịch vụ này.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {history.map((row) => {
                    const priceChanged =
                      row.action === "update_service" && row.before && row.after && row.before.price !== row.after.price;
                    return (
                      <div key={row.id} className="text-[10px] font-sans flex flex-col gap-0.5 bg-warm-white p-2 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center text-[9px] text-mid-gray">
                          <span className="font-semibold text-slate-700">
                            {row.actor_id ? historyActors[row.actor_id] ?? "—" : "—"} · {HISTORY_ACTION_LABELS[row.action] ?? row.action}
                          </span>
                          <span>{new Date(row.at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                        </div>
                        {priceChanged && row.before && row.after ? (
                          <div className="text-matte-black leading-tight">
                            Đổi giá: <span className="line-through text-red-500">{formatVnd(row.before.price!)}</span> →{" "}
                            <strong className="text-forest-green">{formatVnd(row.after.price!)}</strong>
                            <span className="text-mid-gray"> · phiên bản v{row.before.version} → v{(row.before.version ?? 1) + 1}</span>
                          </div>
                        ) : row.action === "create_service" ? (
                          <div className="text-matte-black leading-tight">
                            Tạo mới {row.after?.code} — {row.after?.name}, giá khởi tạo {row.after?.price != null ? formatVnd(row.after.price) : "—"}
                          </div>
                        ) : row.action === "delete_service" ? (
                          <div className="text-matte-black leading-tight">
                            Đã xóa {row.before?.code} — {row.before?.name}
                          </div>
                        ) : (
                          <div className="text-matte-black leading-tight">Cập nhật thông tin dịch vụ.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {canDelete && tab === "info" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 mt-4">
              <div className="flex items-center gap-1 text-red-700 font-extrabold uppercase text-[10px] tracking-wider">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                VÙNG NGUY HIỂM: XÓA DỊCH VỤ
              </div>
              <p className="text-[10px] text-red-700 leading-relaxed font-sans">
                Nhập đúng mã gói <strong className="font-mono text-red-900 bg-red-100 px-1 py-0.5 rounded">{service!.code}</strong> để xác nhận xóa vĩnh viễn dịch vụ này. Hành động không thể hoàn tác.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã gói..."
                  value={deleteConfirmCode}
                  onChange={(e) => setDeleteConfirmCode(e.target.value)}
                  className="flex-1 bg-white border border-red-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-matte-black uppercase focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  disabled={deleteConfirmCode.trim().toUpperCase() !== service!.code.toUpperCase() || deleting}
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
