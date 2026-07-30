import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layers, Sparkles, Percent, DollarSign, PackageSearch, Plus } from "lucide-react";
import ServiceList from "./services/ServiceList";
import SurchargeConfig from "./services/SurchargeConfig";
import PriceChangeRequests from "./services/PriceChangeRequest";

// Module 5 — Quản Lý Gói Dịch Vụ & Giá. Shell mỏng trên 4 sub-màn hình
// (S5.1/S5.3/S5.4/S5.8, PRD modules/module-5-dich-vu-gia/prd.md), cùng mẫu
// URL-synced tabs như SettingsModule.tsx (Module 0).
const TABS = [
  { id: "packages", label: "GÓI DỊCH VỤ (W0-W5)", icon: Layers, component: <ServiceList type="package" /> },
  { id: "addons", label: "DỊCH VỤ LẺ", icon: Sparkles, component: <ServiceList type="addon" /> },
  { id: "surcharge", label: "PHỤ THU HẠNG XE", icon: Percent, component: <SurchargeConfig /> },
  { id: "price-requests", label: "ĐỀ XUẤT ĐỔI GIÁ", icon: DollarSign, component: <PriceChangeRequests /> },
] as const;

export default function ServicesModule() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabFromUrl = location.pathname.split("/")[3];
  const [activeTab, setActiveTab] = useState<string>(TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : "packages");

  const selectTab = (id: string) => {
    setActiveTab(id);
    navigate(`/admin/services/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-1">
        <div className="px-4">
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl text-forest-green shrink-0">
              <PackageSearch className="h-6 w-6" />
            </div>
            GÓI DỊCH VỤ & GIÁ
          </h1>
          <p className="text-mid-gray text-xs font-sans mt-1">
            Nguồn giá duy nhất, đồng bộ tự động xuống Kiosk — quản lý gói W0-W5, dịch vụ lẻ, định mức vật tư, phụ thu hạng xe và đề xuất đổi giá.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeTab !== "surcharge" && (
            <button
              onClick={() => {
                if (activeTab === "packages" || activeTab === "addons") {
                  window.dispatchEvent(new CustomEvent("open-service-drawer-new"));
                } else if (activeTab === "price-requests") {
                  window.dispatchEvent(new CustomEvent("open-price-request-modal"));
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-display font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer border-0"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              {activeTab === "price-requests" ? "Tạo đề xuất giá" : "Tạo dịch vụ mới"}
            </button>
          )}
        </div>
      </div>

      <div className="flex border border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-sm gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex-1 min-w-[160px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
                isActive
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${isActive ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fadeIn">{TABS.find((t) => t.id === activeTab)?.component}</div>
    </div>
  );
}
