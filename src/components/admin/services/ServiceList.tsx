import React, { useEffect, useState } from "react";
import { Plus, Clock, Layers, Sparkles, Sliders } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { ADDON_CATEGORY_LABELS, AddonCategory, ServiceRow, ServiceType } from "../../../types/catalog.types";
import { renderRichText } from "../../../lib/catalog/richText";
import ServiceFormDrawer from "./ServiceFormDrawer";

// S5.1 (packages) / S5.3 (add-ons) — cùng 1 nguồn dữ liệu, lọc theo type.
// Bố cục thẻ (card) mượn lại đúng phong cách hiển thị của bản UI cũ (main
// branch, src/lib/services.ts) — chỉ phần trình bày, dữ liệu/logic vẫn 100%
// lấy từ Supabase (services/service_bom) như trước.
interface Props {
  type: ServiceType;
}

const FALLBACK_ADDON_IMAGE = "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=300&h=300";
const ADDON_CATEGORY_ORDER: AddonCategory[] = [
  "noi_that_co_ban",
  "noi_that_nang_cao",
  "ngoai_that_nang_cao",
  "kiem_tra",
  "bao_duong_ky_thuat",
];

const formatVnd = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function ServiceList({ type }: Props) {
  const { can } = useAuth();
  const canCreate = can("catalog", "create");

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bomCounts, setBomCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null | "new">(null);

  useEffect(() => {
    void load();
    const handleOpenNew = () => setEditing("new");
    window.addEventListener("open-service-drawer-new", handleOpenNew);
    return () => window.removeEventListener("open-service-drawer-new", handleOpenNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").eq("type", type).order("code");
    if (!error && data) {
      const rows = data as ServiceRow[];
      setServices(rows);
      const { data: bomData } = await supabase
        .from("service_bom")
        .select("service_id")
        .in("service_id", rows.map((r) => r.id));
      const counts: Record<string, number> = {};
      for (const row of bomData ?? []) {
        counts[row.service_id] = (counts[row.service_id] ?? 0) + 1;
      }
      setBomCounts(counts);
    }
    setLoading(false);
  }

  function handleClosedDrawer() {
    setEditing(null);
  }

  function handleSaved() {
    setEditing(null);
    void load();
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  const Icon = type === "package" ? Layers : Sparkles;
  const title = type === "package" ? "Gói dịch vụ tiêu chuẩn (W0-W5)" : "Dịch vụ lẻ (Add-on)";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
        <h2 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <Icon className="h-5 w-5 text-forest-green" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-mid-gray bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">{services.length} dịch vụ</span>
          {canCreate && (
            <button
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-green hover:bg-brand-green-hover text-matte-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer border-0"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Tạo mới
            </button>
          )}
        </div>
      </div>

      {services.length === 0 ? (
        <div className="p-8 text-center text-mid-gray font-sans text-xs bg-white border border-[#e5e5e5] rounded-2xl">Chưa có dịch vụ nào.</div>
      ) : type === "package" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((pkg) => {
            const bomCount = bomCounts[pkg.id] ?? 0;
            const hasBom = bomCount > 0;
            // Tô màu + tag theo highlight_type thật (cột dữ liệu, Master Admin
            // chọn qua form sửa) — không còn suy diễn cứng theo code nữa.
            const isBestSeller = pkg.highlight_type === "best_seller";
            const isVip = pkg.highlight_type === "vip";
            const isCustom = pkg.highlight_type === "custom";

            let cardBg = "bg-white border-[#e5e5e5] hover:border-[#bcbcbc]";
            let textTitleColor = "text-matte-black font-black";
            let textPriceColor = "text-forest-green";
            let textDescColor = "text-mid-gray";
            let durationBadge = "bg-gray-100 text-matte-black";
            let tagBadge = "bg-matte-black text-brand-green";

            if (isBestSeller) {
              cardBg = "bg-brand-green border-brand-green/30 shadow-lg shadow-brand-green/10";
              textTitleColor = "text-matte-black font-black";
              textPriceColor = "text-matte-black";
              textDescColor = "text-slate-800/90";
              durationBadge = "bg-white/40 text-matte-black";
              tagBadge = "bg-matte-black text-brand-green";
            } else if (isVip) {
              cardBg = "bg-warm-gold border-amber-600/20 shadow-lg shadow-warm-gold/15";
              textTitleColor = "text-white font-black";
              textPriceColor = "text-yellow-100";
              textDescColor = "text-amber-50/90";
              durationBadge = "bg-white/20 text-white";
              tagBadge = "bg-white text-warm-gold";
            } else if (isCustom) {
              cardBg = "bg-matte-black border-matte-black/30 shadow-lg shadow-black/10";
              textTitleColor = "text-brand-green font-black";
              textPriceColor = "text-white";
              textDescColor = "text-slate-300";
              durationBadge = "bg-white/15 text-white";
              tagBadge = "bg-brand-green text-matte-black";
            }

            return (
              <div
                key={pkg.id}
                onClick={() => setEditing(pkg)}
                className={`p-6 border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[210px] relative overflow-hidden group hover:-translate-y-1 ${cardBg}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 relative z-10">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black font-mono tracking-wider opacity-60 uppercase">{pkg.code}</span>
                        {(isBestSeller || isVip) && (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${tagBadge}`}>
                            {isBestSeller ? "Best Seller" : "VIP"}
                          </span>
                        )}
                        {hasBom ? (
                          <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                            ✓ BOM: {bomCount} VT
                          </span>
                        ) : (
                          <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                            ⚠️ Chưa cấu hình định mức
                          </span>
                        )}
                        {!pkg.active && (
                          <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-gray-700/80 text-white uppercase tracking-wider">Tạm ngừng</span>
                        )}
                      </div>
                      <h4 className={`font-display text-base uppercase tracking-tight mt-1.5 ${textTitleColor}`}>{pkg.name}</h4>
                    </div>
                  </div>

                  {pkg.description_bullets_jsonb?.length > 0 && (
                    <ul className={`text-[11px] font-sans mt-3.5 space-y-1 relative z-10 ${textDescColor}`}>
                      {pkg.description_bullets_jsonb.slice(0, 4).map((bullet, i) => (
                        <li key={i} className="flex gap-1.5 leading-snug">
                          <span className="shrink-0">•</span>
                          <span className="line-clamp-1" dangerouslySetInnerHTML={{ __html: renderRichText(bullet) }} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between relative z-10">
                  <span className={`font-sans font-bold text-lg ${textPriceColor}`}>{formatVnd(pkg.price)}</span>
                  <div className={`flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-lg ${durationBadge}`}>
                    <Clock className="h-3.5 w-3.5 opacity-85" />
                    <span>
                      {pkg.duration_min}-{pkg.duration_max} phút
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {ADDON_CATEGORY_ORDER.map((cat) => {
            const items = services.filter((s) => s.addon_category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h3 className="text-[11px] font-black font-display uppercase tracking-wider text-mid-gray border-b border-gray-100 pb-2">
                  {ADDON_CATEGORY_LABELS[cat]} <span className="text-mid-gray/60 font-normal normal-case">({items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((add) => (
                    <AddonCard key={add.id} add={add} bomCount={bomCounts[add.id] ?? 0} onClick={() => setEditing(add)} />
                  ))}
                </div>
              </div>
            );
          })}

          {(() => {
            const uncategorized = services.filter((s) => !s.addon_category);
            if (uncategorized.length === 0 && !canCreate) return null;
            return (
              <div className="space-y-3">
                {uncategorized.length > 0 && (
                  <h3 className="text-[11px] font-black font-display uppercase tracking-wider text-mid-gray border-b border-gray-100 pb-2">
                    Khác <span className="text-mid-gray/60 font-normal normal-case">({uncategorized.length})</span>
                  </h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {uncategorized.map((add) => (
                    <AddonCard key={add.id} add={add} bomCount={bomCounts[add.id] ?? 0} onClick={() => setEditing(add)} />
                  ))}
                  {canCreate && (
                    <div
                      onClick={() => setEditing("new")}
                      className="group cursor-pointer bg-warm-white border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors min-h-[250px]"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-mid-gray group-hover:scale-110 group-hover:bg-brand-green-light group-hover:text-forest-green transition-all mb-3 shadow-inner">
                        <Plus className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <span className="text-xs text-matte-black font-extrabold font-display uppercase tracking-wide">THÊM DỊCH VỤ LẺ</span>
                      <span className="text-[10px] text-mid-gray mt-1 max-w-[150px] font-sans leading-relaxed">
                        Tạo nhanh các gói phủ dưỡng, tinh dầu thơm hoặc vệ sinh bổ trợ.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {editing && (
        <ServiceFormDrawer
          service={editing === "new" ? null : editing}
          type={type}
          onClose={handleClosedDrawer}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function AddonCard({ add, bomCount, onClick }: { add: ServiceRow; bomCount: number; onClick: () => void }) {
  const hasBom = bomCount > 0;
  const isBestSeller = add.highlight_type === "best_seller";
  const isVip = add.highlight_type === "vip";
  const isCustom = add.highlight_type === "custom";

  // Tô màu thẻ theo highlight_type — trước đây isBestSeller/isVip chỉ dùng để
  // hiện badge góc thẻ, KHÔNG áp vào nền/màu chữ nên thẻ luôn trắng dù đã
  // chọn màu ở form sửa (bug "không đổi màu card"). Nay khớp đúng logic thẻ
  // gói chính ở trên.
  let cardBg = "bg-white border-gray-200/70 hover:border-gray-300";
  let textTitleColor = "text-matte-black group-hover:text-forest-green transition-colors";
  let textDescColor = "text-mid-gray";
  let textPriceColor = "text-forest-green";
  let textDurationColor = "text-mid-gray";

  if (isBestSeller) {
    cardBg = "bg-brand-green border-brand-green/30 hover:border-brand-green-hover shadow-md";
    textTitleColor = "text-matte-black font-black";
    textDescColor = "text-emerald-950/80";
    textPriceColor = "text-matte-black";
    textDurationColor = "text-emerald-950/80";
  } else if (isVip) {
    cardBg = "bg-warm-gold border-amber-600/20 hover:border-amber-600/40 shadow-md";
    textTitleColor = "text-white font-black";
    textDescColor = "text-amber-50/90";
    textPriceColor = "text-white";
    textDurationColor = "text-amber-100";
  } else if (isCustom) {
    cardBg = "bg-matte-black border-matte-black/30 hover:border-neutral-800 shadow-md text-white";
    textTitleColor = "text-brand-green font-black";
    textDescColor = "text-slate-300";
    textPriceColor = "text-white";
    textDurationColor = "text-slate-400";
  }

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${cardBg}`}
    >
      <div>
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-100 mb-3.5">
          <img
            src={add.image_url || FALLBACK_ADDON_IMAGE}
            alt={add.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />

          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            <span className="bg-matte-black/75 backdrop-blur-sm text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{add.code}</span>
            {hasBom ? (
              <span className="bg-emerald-500/90 text-white font-sans text-[7px] font-black px-1.5 py-0.5 rounded tracking-wide">✓ BOM: {bomCount} VT</span>
            ) : (
              <span className="bg-rose-600/95 text-white font-sans text-[7px] font-black px-1.5 py-0.5 rounded tracking-wide animate-pulse">⚠️ Chưa cấu hình</span>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {isBestSeller && (
              <span className="bg-brand-green text-matte-black font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/30">
                Best Seller
              </span>
            )}
            {isVip && (
              <span className="bg-warm-gold text-white font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/30">
                VIP
              </span>
            )}
          </div>

          {!add.active && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-gray-700/90 text-white font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Tạm ngừng</span>
            </div>
          )}

          <div className="absolute inset-0 bg-matte-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg text-[9px] font-black text-matte-black uppercase flex items-center gap-1 shadow-md">
              <Sliders className="h-3 w-3" /> Xem chi tiết
            </div>
          </div>
        </div>

        <h4 className={`font-display font-black text-xs leading-snug line-clamp-2 ${textTitleColor}`}>{add.name}</h4>

        {add.description_bullets_jsonb?.[0] && (
          <p
            className={`text-[10px] mt-1 font-sans line-clamp-2 leading-relaxed ${textDescColor}`}
            dangerouslySetInnerHTML={{ __html: renderRichText(add.description_bullets_jsonb[0]) }}
          />
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-100/30 flex items-center justify-between gap-1">
        <span className={`font-sans font-bold text-base ${textPriceColor}`}>{formatVnd(add.price)}</span>
        <span className={`text-[9px] font-extrabold flex items-center gap-0.5 font-sans ${textDurationColor}`}>
          <Clock className="h-3 w-3" /> {add.duration_min}-{add.duration_max}p
        </span>
      </div>
    </div>
  );
}
