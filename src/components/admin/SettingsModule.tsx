import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Building2, Users, Sliders, Bot, History } from "lucide-react";
import GeneralInfo from "./settings/GeneralInfo";
import UsersRoles from "./settings/UsersRoles";
import ConfigOverview from "./settings/ConfigOverview";
import Integrations from "./settings/Integrations";
import AuditLog from "./settings/AuditLog";

// Module 0 — Cài Đặt Trạm & Phân Quyền. Shell mỏng trên 5 sub-màn hình
// (S0.1-S0.8, PRD §4). Đồng bộ tab đang chọn vào URL (không dùng <Route>
// lồng — nhất quán với cách App.tsx tự parse location.pathname ở mọi nơi
// khác trong app) để mỗi sub-menu vẫn deep-link được (US-0.4).
const TABS = [
  { id: "general", label: "Thông tin chung", icon: Building2, component: <GeneralInfo /> },
  { id: "users", label: "User & Phân quyền", icon: Users, component: <UsersRoles /> },
  { id: "config", label: "Cấu hình tổng hợp", icon: Sliders, component: <ConfigOverview /> },
  { id: "integrations", label: "Tích hợp thiết bị", icon: Bot, component: <Integrations /> },
  { id: "audit-log", label: "Audit log", icon: History, component: <AuditLog /> },
] as const;

interface SettingsModuleProps {
  rolePermissions?: Record<string, string[]>;
  onPermissionsChange?: (newPerms: any) => void;
}

export default function SettingsModule({ rolePermissions: _rolePermissions, onPermissionsChange: _onPermissionsChange }: SettingsModuleProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabFromUrl = location.pathname.split("/")[3];
  const [activeTab, setActiveTab] = useState<string>(
    TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : "general"
  );

  const selectTab = (id: string) => {
    setActiveTab(id);
    // App.tsx định tuyến module cấp 1 qua location.pathname.split("/")[2] —
    // shell chứa Module 0 nằm ở "/admin/system" (không phải "/admin/settings"),
    // nên phải giữ đúng segment[2] = "system" để không vỡ điều kiện render ở
    // App.tsx; segment[3] mới là sub-tab của riêng Module 0.
    navigate(`/admin/system/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#A2C62C]" />
        <div className="pl-3">
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-forest-green" />
            CÀI ĐẶT TRẠM & PHÂN QUYỀN
          </h1>
          <p className="text-mid-gray text-xs font-sans mt-0.5">
            Đăng nhập, user &amp; vai trò tùy chỉnh, cấu hình tổng hợp, tích hợp thiết bị, và tra cứu audit log.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row border border-stone-200/80 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex-1 min-w-[140px] py-3 px-4 text-center font-display font-black text-[11px] tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2 border-0 ${
                isActive
                  ? "bg-matte-black text-white shadow-sm"
                  : "bg-[#f8f8f8] text-[#8e8e8e] hover:text-matte-black hover:bg-stone-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fadeIn">
        {TABS.find((t) => t.id === activeTab)?.component}
      </div>
    </div>
  );
}
