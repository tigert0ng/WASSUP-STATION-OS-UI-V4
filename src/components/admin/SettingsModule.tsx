import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Building2, Users, Sliders, Bot, Sparkles, AlertCircle, ArrowLeftRight } from "lucide-react";
import StationsList from "./settings/StationsList";
import UsersRoles from "./settings/UsersRoles";
import ConfigOverview from "./settings/ConfigOverview";
import Integrations from "./settings/Integrations";
import { useAuth } from "../../lib/auth/AuthProvider";
import { supabase } from "../../lib/supabase/client";

interface StationOption {
  id: string;
  name: string;
  is_headquarters: boolean;
}

const SAMPLE_STATIONS: StationOption[] = [
  { id: "st-001", name: "WASSUP Station - Cầu Giấy (Trạm Tổng)", is_headquarters: true },
  { id: "st-002", name: "WASSUP Station - Mỹ Đình", is_headquarters: false },
  { id: "st-003", name: "WASSUP Station - Hà Đông", is_headquarters: false },
];

export default function SettingsModule({ rolePermissions: _rolePermissions, onPermissionsChange: _onPermissionsChange }: { rolePermissions?: Record<string, string[]>; onPermissionsChange?: (newPerms: any) => void } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { staff } = useAuth();
  const isMasterAdmin = staff?.role_id === "master_admin" || staff?.station_scope_all;

  const rawTabFromUrl = location.pathname.split("/")[3];
  // Redirect legacy /general or /staff tabs to merged tabs
  const tabFromUrl = rawTabFromUrl === "general" ? "config" : rawTabFromUrl === "staff" ? "users" : rawTabFromUrl;

  const [stationsList, setStationsList] = useState<StationOption[]>(SAMPLE_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState<string>(
    () => localStorage.getItem("wassup_station_id") || "st-001"
  );

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    localStorage.setItem("wassup_station_id", stationId);
    window.dispatchEvent(new Event("wassup_station_id_updated"));
    window.dispatchEvent(new Event("wassup_stations_updated"));
  };

  const TABS = [
    {
      id: "stations",
      label: "Danh sách Trạm (S0.0)",
      icon: Building2,
      component: <StationsList currentStationId={selectedStationId} onSelectStation={handleSelectStation} />,
    },
    {
      id: "users",
      label: "User & Phân quyền RBAC",
      icon: Users,
      component: <UsersRoles />,
    },
    {
      id: "config",
      label: "Cấu hình hệ thống & Trạm",
      icon: Sliders,
      component: <ConfigOverview currentStationId={selectedStationId} onSelectStation={handleSelectStation} />,
    },
    {
      id: "integrations",
      label: "Tích hợp thiết bị",
      icon: Bot,
      component: <Integrations />,
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(
    TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : "stations"
  );

  useEffect(() => {
    async function loadStations() {
      const stored = localStorage.getItem("wassup_stations");
      let localOptions: StationOption[] = SAMPLE_STATIONS;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localOptions = parsed.map((st: any) => ({
              id: st.id,
              name: st.name,
              is_headquarters: st.is_headquarters ?? false,
            }));
          }
        } catch (e) {}
      }

      if (supabase) {
        try {
          const { data } = await supabase
            .from("stations")
            .select("id, name, is_headquarters")
            .order("is_headquarters", { ascending: false });

          if (data && data.length > 0) {
            const merged = data.map((d: any) => {
              const loc = localOptions.find((l) => l.id === d.id);
              return {
                id: d.id,
                name: loc ? loc.name : d.name,
                is_headquarters: d.is_headquarters ?? false,
              };
            });
            setStationsList(merged);
            return;
          }
        } catch (e) {
          // fallback
        }
      }

      setStationsList(localOptions);
    }

    void loadStations();

    const handleUpdate = () => {
      void loadStations();
    };
    window.addEventListener("wassup_stations_updated", handleUpdate);
    return () => {
      window.removeEventListener("wassup_stations_updated", handleUpdate);
    };
  }, []);

  const selectTab = (id: string) => {
    setActiveTab(id);
    navigate(`/admin/system/${id}`);
  };

  const selectedStationObj = stationsList.find((s) => s.id === selectedStationId) || stationsList[0];

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Module 0 Header & Multi-Station Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="px-2">
          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-forest-green" />
            MODULE 0 — CÀI ĐẶT TRẠM & PHÂN QUYỀN
          </h1>
          <p className="text-mid-gray text-xs font-sans mt-0.5">
            Quản lý đa trạm vận hành (Multi Station), phân quyền vai trò tùy chỉnh, cấu hình tổng hợp, tích hợp thiết bị và nhật ký kiểm toán.
          </p>
        </div>

        {/* Multi-Station Context Selector Dropdown */}
        {isMasterAdmin && (
          <div className="flex items-center gap-2 bg-slate-950 text-white p-2.5 px-4 rounded-xl shadow-xs border border-slate-800 shrink-0 w-full md:w-auto">
            <ArrowLeftRight className="h-4 w-4 text-[#A2C62C] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Góc nhìn Trạm Vận Hành:</span>
              <select
                value={selectedStationId}
                onChange={(e) => handleSelectStation(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#A2C62C] focus:outline-none cursor-pointer pr-2"
              >
                {stationsList.map((st) => (
                  <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                    {st.name} {st.is_headquarters ? "★ (Trạm Tổng)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Non-HQ Station Context Notice Banner */}
      {!selectedStationObj.is_headquarters && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-amber-900 font-sans shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold uppercase text-amber-950">
                Đang Giám Sát Góc Nhìn Trạm Chi Nhánh: <span className="underline">{selectedStationObj.name}</span>
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Dữ liệu hiển thị thuộc về riêng trạm này. Master Admin có thể quản lý hoặc chuyển đổi lại trạm tổng bất kỳ lúc nào.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const hq = stationsList.find((s) => s.is_headquarters) || stationsList[0];
              setSelectedStationId(hq.id);
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer border-0 shrink-0 flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Về Trạm Tổng
          </button>
        </div>
      )}

      {/* Module 0 Sub-Menu Navigation Bar */}
      <div className="flex border border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-sm gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2 border-0 ${
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

      <div className="animate-fadeIn">
        {TABS.find((t) => t.id === activeTab)?.component}
      </div>
    </div>
  );
}

