import React, { useEffect, useState } from "react";
import { Plus, Clock, Layers, Sparkles, Sliders } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import {
  applyLocalOverridesToServices,
  DEFAULT_PACKAGES,
  DEFAULT_ADDONS,
  getBomLinesCountForService,
} from "../../../lib/catalog/serviceStore";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { ADDON_CATEGORY_LABELS, AddonCategory, ServiceRow, ServiceType } from "../../../types/catalog.types";
import { renderRichText } from "../../../lib/catalog/richText";
import ServiceFormDrawer from "./ServiceFormDrawer";

// S5.1 (packages) / S5.3 (add-ons) — cùng 1 nguồn dữ liệu, lọc theo type.
// Bố cục thẻ (card) chuẩn DESIGN.md — đầy đủ thông tin, màu thẻ linh hoạt (normal, primary, gold, custom).
interface Props {
  type: ServiceType;
}

const FALLBACK_PACKAGE_IMAGE = "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=600";
const FALLBACK_ADDON_IMAGE = "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=600";
const ADDON_CATEGORY_ORDER: AddonCategory[] = [
  "noi_that_co_ban",
  "noi_that_nang_cao",
  "ngoai_that_nang_cao",
  "kiem_tra",
  "bao_duong_ky_thuat",
];

const formatVnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

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
    const handleServicesUpdate = () => void load();
    window.addEventListener("open-service-drawer-new", handleOpenNew);
    window.addEventListener("wassup_services_updated", handleServicesUpdate);
    return () => {
      window.removeEventListener("open-service-drawer-new", handleOpenNew);
      window.removeEventListener("wassup_services_updated", handleServicesUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function load() {
    setLoading(true);
    let baseServices: ServiceRow[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase.from("services").select("*").eq("type", type).order("code");
        if (!error && data && data.length > 0) {
          baseServices = data as ServiceRow[];
        }
      } catch (e) {
        console.warn("Supabase fetch services warning:", e);
      }
    }

    if (baseServices.length === 0) {
      baseServices = type === "package" ? DEFAULT_PACKAGES : DEFAULT_ADDONS;
    }

    const rows = applyLocalOverridesToServices(baseServices, type);
    setServices(rows);

    const counts: Record<string, number> = {};
    for (const r of rows) {
      counts[r.id] = getBomLinesCountForService(r.id);
    }

    if (supabase) {
      try {
        const { data: bomData } = await supabase
          .from("service_bom")
          .select("service_id")
          .in("service_id", rows.map((r) => r.id));
        for (const row of bomData ?? []) {
          counts[row.service_id] = (counts[row.service_id] ?? 0) + 1;
        }
      } catch (e) {}
    }

    setBomCounts(counts);
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
          {services.map((pkg, idx) => {
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
                key={`${pkg.id || pkg.code}-${idx}`}
                onClick={() => setEditing(pkg)}
                className={`border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 shadow-xs hover:shadow-md ${cardBg}`}
              >
                <div>
                  {/* Thumbnail tràn viền tỉ lệ 3:2 */}
                  <div className="relative w-full aspect-[3/2] overflow-hidden bg-stone-900/10 shrink-0">
                    <img
                      src={pkg.image_url || FALLBACK_PACKAGE_IMAGE}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {/* Gradient overlay tăng tương phản cho thẻ, tag */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/45 pointer-events-none" />

                    {/* Vẫn giữ lại các thẻ, tag trên ảnh tràn viền */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-xs">
                          {pkg.code}
                        </span>
                        {(isBestSeller || isVip || isCustom) && (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-xs ${tagBadge}`}>
                            {isBestSeller ? "Khuyên dùng ⭐" : isVip ? "Cao cấp ✨" : "Đặc biệt 💎"}
                          </span>
                        )}
                        {!pkg.active && (
                          <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-stone-900/90 backdrop-blur-sm text-white uppercase tracking-wider border border-white/20">
                            Tạm ngừng
                          </span>
                        )}
                      </div>

                      {hasBom ? (
                        <span className="shrink-0 text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white uppercase tracking-wider shadow-xs border border-emerald-400/30">
                          ✓ BOM: {bomCount} VT
                        </span>
                      ) : (
                        <span className="shrink-0 text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600/95 backdrop-blur-sm text-white uppercase tracking-wider shadow-xs border border-rose-400/30 animate-pulse">
                          ⚠️ Chưa BOM
                        </span>
                      )}
                    </div>

                    {/* Quick action button on hover */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-matte-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
                        <Sliders className="h-3.5 w-3.5" /> Chỉnh sửa gói
                      </div>
                    </div>
                  </div>

                  {/* Thông tin chi tiết gói dịch vụ */}
                  <div className="p-5">
                    <h4 className={`font-display text-base uppercase tracking-tight ${textTitleColor}`}>{pkg.name}</h4>

                    {pkg.description_bullets_jsonb?.length > 0 && (
                      <ul className={`text-[11px] font-sans mt-2.5 space-y-1.5 ${textDescColor} max-h-36 overflow-y-auto scrollbar-thin`}>
                        {pkg.description_bullets_jsonb.map((bullet, i) => (
                          <li key={`desc-${pkg.id || pkg.code}-${i}`} className="flex gap-1.5 leading-snug">
                            <span className="shrink-0 font-bold opacity-70">•</span>
                            <span dangerouslySetInnerHTML={{ __html: renderRichText(bullet) }} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                    <span className={`font-sans font-bold text-lg ${textPriceColor}`}>{formatVnd(pkg.price)}</span>
                    <div className={`flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-lg ${durationBadge}`}>
                      <Clock className="h-3.5 w-3.5 opacity-85" />
                      <span>
                        {pkg.duration_min}-{pkg.duration_max} phút
                      </span>
                    </div>
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
                  {items.map((add, idx) => (
                    <AddonCard key={`${add.id || add.code}-${idx}`} add={add} bomCount={bomCounts[add.id] ?? 0} onClick={() => setEditing(add)} />
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
                  {uncategorized.map((add, idx) => (
                    <AddonCard key={`${add.id || add.code}-${idx}`} add={add} bomCount={bomCounts[add.id] ?? 0} onClick={() => setEditing(add)} />
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
      className={`group cursor-pointer rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md border ${cardBg}`}
    >
      <div>
        {/* Thumbnail tràn viền tỉ lệ 3:2 */}
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-stone-900/10 shrink-0">
          <img
            src={add.image_url || FALLBACK_ADDON_IMAGE}
            alt={add.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/45 pointer-events-none" />

          {/* Vẫn giữ lại các thẻ, tag trên ảnh tràn viền */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 pointer-events-none">
            <div className="flex flex-col gap-1 items-start">
              <span className="bg-matte-black/80 backdrop-blur-sm text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-white/20">
                {add.code}
              </span>
              {hasBom ? (
                <span className="bg-emerald-600/90 backdrop-blur-sm text-white font-sans text-[7px] font-black px-1.5 py-0.5 rounded tracking-wide border border-emerald-400/30">
                  ✓ BOM: {bomCount} VT
                </span>
              ) : (
                <span className="bg-rose-600/95 backdrop-blur-sm text-white font-sans text-[7px] font-black px-1.5 py-0.5 rounded tracking-wide animate-pulse border border-rose-400/30">
                  ⚠️ Chưa BOM
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 items-end">
              {isBestSeller && (
                <span className="bg-brand-green text-matte-black font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/30 shadow-xs">
                  Best Seller
                </span>
              )}
              {isVip && (
                <span className="bg-warm-gold text-white font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/30 shadow-xs">
                  VIP
                </span>
              )}
            </div>
          </div>

          {!add.active && (
            <div className="absolute bottom-2 left-2.5 pointer-events-none">
              <span className="bg-gray-900/85 backdrop-blur-sm text-white font-sans text-[7px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                Tạm ngừng
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-matte-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-black text-matte-black uppercase flex items-center gap-1 shadow-md">
              <Sliders className="h-3 w-3" /> Chi tiết
            </div>
          </div>
        </div>

        <div className="p-3.5">
          <h4 className={`font-display font-black text-xs leading-snug line-clamp-2 ${textTitleColor}`}>{add.name}</h4>

          {add.description_bullets_jsonb?.[0] && (
            <p
              className={`text-[10px] mt-1.5 font-sans line-clamp-2 leading-relaxed ${textDescColor}`}
              dangerouslySetInnerHTML={{ __html: renderRichText(add.description_bullets_jsonb[0]) }}
            />
          )}
        </div>
      </div>

      <div className="px-3.5 pb-3.5 pt-0">
        <div className="pt-2.5 border-t border-black/10 flex items-center justify-between gap-1">
          <span className={`font-sans font-bold text-base ${textPriceColor}`}>{formatVnd(add.price)}</span>
          <span className={`text-[9px] font-extrabold flex items-center gap-0.5 font-sans ${textDurationColor}`}>
            <Clock className="h-3 w-3" /> {add.duration_min}-{add.duration_max}p
          </span>
        </div>
      </div>
    </div>
  );
}
