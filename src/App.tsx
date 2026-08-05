import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Car,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  Users,
  Layers,
  Wrench,
  Tag,
  Monitor,
  Tv,
  Plus,
  RefreshCw,
  Search,
  Check,
  Percent,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  Boxes,
  LockKeyhole,
  Laptop,
  Star,
  Volume2,
  Menu,
  X
} from "lucide-react";

import { HashRouter, useNavigate, useLocation } from "react-router-dom";

import {
  simActions,
  supabaseRealtime,
  getRevenueStats,
  getMergedOrderStatusView
} from "./lib/supabase/client";
import { OrderStatusView, WoStatus } from "./types/workOrder.types";
import { Booth, Customer, Service } from "./types/order.types";
import KioskCheckoutView from "./components/kiosk/KioskCheckoutView";
import { Voucher } from "./types/voucher.types";

// Import Admin Modules
import { SERVICES_CATALOG, ADDONS_CATALOG } from "./lib/services";
import DashboardModule from "./components/admin/DashboardModule";
import ReceptionModule from "./components/admin/ReceptionModule";
import KtvModule from "./components/admin/KtvModule";
import PosModule from "./components/admin/PosModule";
import FinanceModule from "./components/admin/FinanceModule";
import CrmModule from "./components/admin/CrmModule";
import ServicesModule from "./components/admin/ServicesModule";
import InventoryModule from "./components/admin/InventoryModule";
import MonitorModule from "./components/admin/MonitorModule";
import StaffModule from "./components/admin/StaffModule";
import SettingsModule from "./components/admin/SettingsModule";
import NotificationManager from "./components/admin/shared/NotificationManager";
import LoginModule from "./components/admin/LoginModule";
import HrModule from "./components/admin/HrModule";

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  master_admin: ["dashboard", "reception", "ktv", "pos", "finance", "crm", "services", "inventory", "monitor", "staff", "settings", "hr"],
  manager: ["dashboard", "reception", "ktv", "crm", "services", "inventory", "monitor", "hr"],
  technician: ["ktv", "monitor"],
  accountant: ["dashboard", "pos", "finance", "crm", "services", "inventory"]
};

// Unified dynamic 10-module navigation list according to PRD v2.3 & Module 8
const ADMIN_MODULES = [
  { id: "dashboard", label: "M1: Dashboard & Live Ops", icon: TrendingUp, category: "QUẢN TRỊ VẬN HÀNH" },
  { id: "reception", label: "M2: Tiếp nhận & Điều phối", icon: Laptop, category: "QUẢN TRỊ VẬN HÀNH" },
  { id: "pos", label: "M3: POS Thu ngân & Ca kíp", icon: CreditCard, category: "QUẢN TRỊ VẬN HÀNH" },
  { id: "finance", label: "M4.5: Sổ cái Tài chính", icon: DollarSign, category: "QUẢN TRỊ VẬN HÀNH" },
  { id: "crm", label: "M4: Khách Hàng & CRM", icon: Tag, category: "QUẢN TRỊ VẬN HÀNH" },
  { id: "services", label: "M5: Gói dịch vụ & Định mức (BOM)", icon: Layers, category: "DỮ LIỆU & DANH MỤC" },
  { id: "inventory", label: "M6: Kho vật tư & Hao phí", icon: Boxes, category: "DỮ LIỆU & DANH MỤC" },
  { id: "monitor", label: "M7: IoT Monitor Giám Sát", icon: Monitor, category: "HỆ THỐNG TRẠM" },
  { id: "hr", label: "M8: Carer Performance", icon: Users, category: "HỆ THỐNG TRẠM" },
  { id: "system", label: "M0: Hệ thống & Cài đặt", icon: Settings, category: "HỆ THỐNG TRẠM" }
];

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("wassup_role_permissions");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.master_admin && parsed.master_admin.includes("crm") && parsed.master_admin.includes("hr") && parsed.master_admin.includes("monitor") && parsed.master_admin.includes("finance")) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const stored = localStorage.getItem("wassup_current_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const isAllowed = (moduleName: string) => {
    if (!currentUser) return false;
    const allowed = rolePermissions[currentUser.role] || [];
    return allowed.includes(moduleName);
  };

  const isModuleVisible = (mId: string) => {
    if (mId === "system") {
      return isAllowed("staff") || isAllowed("settings") || isAllowed("monitor");
    }
    return isAllowed(mId);
  };

  // Extract navigation parameters from URL path
  const activeScreen: "admin" | "kiosk" | "tv" | "ktv" = location.pathname.startsWith("/tv")
    ? "tv"
    : location.pathname.startsWith("/kiosk")
      ? "kiosk"
      : location.pathname.startsWith("/ktv")
        ? "ktv"
        : "admin";

  let activeAdminModule = "dashboard";
  if (location.pathname.startsWith("/admin/")) {
    activeAdminModule = location.pathname.split("/")[2] || "dashboard";
  }

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeModule7Tab, setActiveModule7Tab] = useState<string>("staff");

  // Realtime state synchronized with our client store
  const [orders, setOrders] = useState<OrderStatusView[]>([]);
  const [revenueStats, setRevenueStats] = useState<any>(getRevenueStats());
  const [booths, setBooths] = useState<Booth[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Default redirect from / to admin/dashboard
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Keep active sub-module safe and authorized for current user's role
  useEffect(() => {
    if (currentUser && activeScreen === "admin") {
      const allowed = rolePermissions[currentUser.role] || [];
      let resolvedModule = activeAdminModule;

      if (activeAdminModule === "system") {
        const hasSystemPerm = allowed.includes("staff") || allowed.includes("settings") || allowed.includes("monitor");
        if (!hasSystemPerm) {
          resolvedModule = allowed[0] || "dashboard";
        }
      } else if (!isModuleVisible(activeAdminModule)) {
        // Fallback or map child tabs
        if (["staff", "settings", "monitor"].includes(activeAdminModule)) {
          resolvedModule = "system";
        } else {
          resolvedModule = allowed[0] || "dashboard";
        }
      }

      if (resolvedModule !== activeAdminModule) {
        navigate(`/admin/${resolvedModule}`, { replace: true });
      }
    }
  }, [currentUser, activeAdminModule, rolePermissions, activeScreen, navigate]);

  // Synchronize currentUser session if staff details change or user gets blocked
  useEffect(() => {
    if (currentUser && staff.length > 0) {
      const latest = staff.find(s => s.id === currentUser.id);
      if (latest) {
        if (latest.status === "blocked") {
          setCurrentUser(null);
          localStorage.removeItem("wassup_current_user");
          alert("Tài khoản của bạn đã bị quản trị viên khóa!");
        } else if (latest.role !== currentUser.role || latest.name !== currentUser.name || latest.phone !== currentUser.phone || latest.pin !== currentUser.pin) {
          setCurrentUser(latest);
          localStorage.setItem("wassup_current_user", JSON.stringify(latest));
        }
      }
    }
  }, [staff, currentUser]);

  // Refresh state listener on mount
  useEffect(() => {
    // Sync booths, staff, vouchers initially
    setBooths(simActions.getBooths());
    setStaff(simActions.getStaff());
    setVouchers(simActions.getVouchers());
    setCustomers(simActions.getCustomers());

    const unsubOrders = supabaseRealtime.subscribeOrders((updatedOrders) => {
      setOrders(updatedOrders);
      // Sync booth state updates too
      setBooths(simActions.getBooths());
    });

    const unsubRevenue = supabaseRealtime.subscribeRevenue((updatedStats) => {
      setRevenueStats(updatedStats);
    });

    const unsubStaff = supabaseRealtime.subscribeStaff((updatedStaff) => {
      setStaff(updatedStaff);
    });

    const unsubVouchers = supabaseRealtime.subscribeVouchers((updatedVouchers) => {
      setVouchers(updatedVouchers);
    });

    const unsubCustomers = supabaseRealtime.subscribeCustomers((updatedCustomers) => {
      setCustomers(updatedCustomers);
    });

    return () => {
      unsubOrders.unsubscribe();
      unsubRevenue.unsubscribe();
      unsubStaff.unsubscribe();
      unsubVouchers.unsubscribe();
      unsubCustomers.unsubscribe();
    };
  }, []);

  // Set up Module 0 tab layouts (System & Staff Management)
  const allowedSubTabs = [
    {
      id: "staff",
      label: "Nhân Sự & RBAC",
      icon: Users,
      component: <StaffModule staff={staff} orders={orders} />
    },
    {
      id: "settings",
      label: "Cấu Hình & Audit Logs",
      icon: Settings,
      component: (
        <SettingsModule
          rolePermissions={rolePermissions}
          onPermissionsChange={(newPerms) => {
            setRolePermissions(newPerms);
            localStorage.setItem("wassup_role_permissions", JSON.stringify(newPerms));
          }}
        />
      )
    }
  ].filter(tab => isAllowed(tab.id));

  // Default active tab for Module 7 if current tab becomes unauthorized
  useEffect(() => {
    if (activeAdminModule === "system" && allowedSubTabs.length > 0) {
      const isTabAllowed = allowedSubTabs.some(t => t.id === activeModule7Tab);
      if (!isTabAllowed) {
        setActiveModule7Tab(allowedSubTabs[0].id);
      }
    }
  }, [activeAdminModule, currentUser]);

  return (
    <div className="h-screen bg-warm-white text-matte-black font-sans antialiased selection:bg-brand-green selection:text-matte-black flex flex-col overflow-hidden">
      <NotificationManager />

      {/* MOBILE DRAWER PORTAL / OVERLAY */}
      <AnimatePresence>
        {activeScreen === "admin" && currentUser && isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Drawer Container */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-matte-black text-white z-[100] lg:hidden flex flex-col justify-between select-none shadow-2xl border-r border-[#262626] overflow-y-auto"
            >
              <div>
                {/* Header of Drawer */}
                <div className="p-5 border-b border-[#262626] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-brand-green flex items-center justify-center">
                      <span className="font-display text-sm font-black text-matte-black">W</span>
                    </div>
                    <span className="font-display font-black text-sm tracking-wider text-white">ADMIN MENU</span>
                  </div>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#333333] border-0 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation links inside drawer */}
                <div className="p-4 space-y-6">
                  {/* Categorized operational modules loop */}
                  {["QUẢN TRỊ VẬN HÀNH", "DỮ LIỆU & DANH MỤC", "HỆ THỐNG TRẠM"].map((cat) => {
                    const catModules = ADMIN_MODULES.filter(m => m.category === cat && isModuleVisible(m.id));
                    if (catModules.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1">
                        <span className="px-3 text-[9px] text-gray-500 font-extrabold tracking-widest block uppercase font-sans mb-2">{cat}</span>
                        {catModules.map((m) => {
                          const Icon = m.icon;
                          const isActive = activeAdminModule === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                navigate(`/admin/${m.id}`);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                                isActive ? "bg-brand-green text-matte-black font-extrabold" : "text-gray-400 hover:bg-gray-900 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <Icon className="h-4 w-4" />
                                {m.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation bottom utility inside drawer */}
              <div className="p-5 border-t border-[#262626] space-y-2.5 bg-[#0f0f0f]/30">
                <span className="text-[9px] text-gray-500 font-extrabold block uppercase tracking-wider font-sans">SIMULATION UTILITIES</span>
                <button
                  onClick={() => {
                    if (window.confirm("Khôi phục toàn bộ database về hạt giống dữ liệu gốc ban đầu?")) {
                      simActions.resetStore();
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition text-[10px] font-black uppercase font-display cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Reset Database State
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* GLOBAL SYSTEM TOP CONTROLLER BAR */}
      <header className="border-b border-[#2d2d2d] bg-matte-black px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          {activeScreen === "admin" && (
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#262626] border border-stone-800 transition cursor-pointer flex items-center justify-center bg-transparent"
              title="Mở menu quản lý"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="h-9 w-9 rounded-xl bg-brand-green flex items-center justify-center shadow-md shadow-brand-green/10">
            <span className="font-display text-base font-black text-matte-black tracking-widest">W</span>
          </div>
          <div>
            <span className="font-display font-black text-md tracking-wider text-white">WASSUP STATION OS</span>
            <span className="text-[10px] text-brand-green block font-display font-extrabold tracking-widest">CARE. CREATE. GROW.</span>
          </div>
        </div>

        {/* Global Screen Router Switcher */}
        <div className="flex items-center bg-[#262626] p-1 rounded-xl border border-[#3a3a3a]">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-extrabold tracking-wider transition-all duration-300 cursor-pointer border-0 ${
              activeScreen === "admin"
                ? "bg-brand-green text-matte-black shadow-md shadow-brand-green/10"
                : "text-gray-400 hover:text-white hover:bg-[#333333]"
            }`}
          >
            <Shield className="h-4 w-4" />
            ADMIN HUB (QUẢN TRỊ)
          </button>
          <button
            onClick={() => navigate("/kiosk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-extrabold tracking-wider transition-all duration-300 cursor-pointer border-0 ${
              activeScreen === "kiosk"
                ? "bg-brand-green text-matte-black shadow-md shadow-brand-green/10"
                : "text-gray-400 hover:text-white hover:bg-[#333333]"
            }`}
          >
            <Car className="h-4 w-4" />
            M0: KIOSK SẢNH
          </button>
          <button
            onClick={() => navigate("/tv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-extrabold tracking-wider transition-all duration-300 cursor-pointer border-0 ${
              activeScreen === "tv"
                ? "bg-brand-green text-matte-black shadow-md shadow-brand-green/10"
                : "text-gray-400 hover:text-white hover:bg-[#333333]"
            }`}
          >
            <Tv className="h-4 w-4" />
            TV BROADCAST QUEUE
          </button>
          <button
            onClick={() => navigate("/ktv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-extrabold tracking-wider transition-all duration-300 cursor-pointer border-0 ${
              activeScreen === "ktv"
                ? "bg-brand-green text-matte-black shadow-md shadow-brand-green/10"
                : "text-gray-400 hover:text-white hover:bg-[#333333]"
            }`}
          >
            <Wrench className="h-4 w-4" />
            MX: KỸ THUẬT VIÊN MOBILE
          </button>
        </div>

        {/* Realtime indicators & User Session */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex lg:hidden xl:flex items-center gap-2 text-xs font-semibold bg-[#262626] border border-[#3a3a3a] px-3 py-1.5 rounded-lg text-brand-green">
            <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
            Realtime Active
          </div>

          {currentUser && (
            <div className="flex items-center gap-2.5 bg-[#1a1a1a] border border-[#333] px-2.5 py-1.5 rounded-xl text-xs font-sans text-stone-200">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white uppercase shrink-0 ${
                  currentUser.role === "master_admin" ? "bg-purple-600" :
                  currentUser.role === "manager" ? "bg-blue-600" :
                  currentUser.role === "technician" ? "bg-emerald-600" : "bg-amber-600"
                }`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left shrink-0">
                  <div className="font-extrabold text-stone-100 max-w-28 truncate">{currentUser.name}</div>
                  <div className="text-[8.5px] text-stone-400 font-extrabold uppercase tracking-wide">
                    {currentUser.role === "master_admin" ? "Master Admin" :
                     currentUser.role === "manager" ? "Quản Lý Trạm" :
                     currentUser.role === "technician" ? "Kỹ Thuật Viên" : "Kế Toán"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                    setCurrentUser(null);
                    localStorage.removeItem("wassup_current_user");
                    navigate("/admin/dashboard");
                  }
                }}
                className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:text-red-200 transition font-display font-black tracking-wider text-[9px] uppercase rounded-lg border border-red-500/20 cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CORE CONTENT REGION */}
      <div className="flex-1 flex overflow-hidden animate-fadeIn">
        {/* SIDEBAR WORKSPACE: Only visible when activeScreen is "admin" */}
        {activeScreen === "admin" && currentUser && (
          <aside className="w-64 bg-matte-black text-white border-r border-[#262626] flex flex-col justify-between shrink-0 select-none hidden lg:flex sticky top-0 h-[calc(100vh-73px)] overflow-y-auto scrollbar-none">
            {/* Categorized Navigation Link Slabs */}
            <div className="p-4 space-y-6">
              {["QUẢN TRỊ VẬN HÀNH", "DỮ LIỆU & DANH MỤC", "HỆ THỐNG TRẠM"].map((cat) => {
                const catModules = ADMIN_MODULES.filter(m => m.category === cat && isModuleVisible(m.id));
                if (catModules.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <span className="px-3 text-[10px] text-gray-500 font-extrabold tracking-widest block uppercase font-sans mb-2">{cat}</span>
                    {catModules.map((m) => {
                      const Icon = m.icon;
                      const isActive = activeAdminModule === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => navigate(`/admin/${m.id}`)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer border-0 ${
                            isActive
                              ? "bg-brand-green text-matte-black"
                              : "text-gray-400 hover:bg-gray-900 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2.5 text-left">
                            <Icon className="h-4 w-4" />
                            {m.label}
                          </span>
                          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-matte-black" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Quick Simulation Controller at Bottom of Sidebar */}
            <div className="p-4 border-t border-[#262626] space-y-2.5 bg-[#0f0f0f]/30">
              <span className="text-[9px] text-gray-500 font-extrabold block uppercase tracking-wider font-sans">SIMULATION UTILITIES</span>
              <button
                onClick={() => {
                  if (window.confirm("Khôi phục toàn bộ database về hạt giống dữ liệu gốc ban đầu?")) {
                    simActions.resetStore();
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition text-[10px] font-black uppercase font-display cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Reset Database State
              </button>
            </div>
          </aside>
        )}

        {/* WORKSPACE DISPLAY AREA */}
        <main className={`flex-1 overflow-y-auto ${activeScreen === "admin" && currentUser ? "p-6" : "p-0"}`}>
          {activeScreen === "admin" && !currentUser ? (
            <div className="w-full h-full">
              <LoginModule
                staff={staff}
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  localStorage.setItem("wassup_current_user", JSON.stringify(user));
                }}
              />
            </div>
          ) : (
            <>
              {activeScreen === "admin" && currentUser && (
                <div className="lg:hidden mb-6 -mx-6 px-6 overflow-x-auto whitespace-nowrap flex items-center gap-2 pb-3 border-b border-stone-200 scrollbar-none">
                  {ADMIN_MODULES.filter(m => isModuleVisible(m.id)).map((m) => {
                    const isActive = activeAdminModule === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => navigate(`/admin/${m.id}`)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all shrink-0 cursor-pointer border-0 ${
                          isActive
                            ? "bg-brand-green text-matte-black font-extrabold shadow animate-pulse"
                            : "bg-white text-slate-600 hover:text-slate-900 border border-stone-200"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {m.label.split(":")[1]?.trim() || m.label}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {activeScreen === "admin" && currentUser && (
                  <motion.div
                    key={`admin-${activeAdminModule}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-7xl mx-auto"
                  >
                    {isAllowed("dashboard") && activeAdminModule === "dashboard" && (
                      <DashboardModule
                        orders={orders}
                        revenueStats={revenueStats}
                        booths={booths}
                        staff={staff}
                      />
                    )}

                    {isAllowed("reception") && activeAdminModule === "reception" && (
                      <ReceptionModule
                        orders={orders}
                        booths={booths}
                        staff={staff}
                      />
                    )}

                    {isAllowed("ktv") && activeAdminModule === "ktv" && (
                      <KtvModule
                        orders={orders}
                        staff={staff}
                      />
                    )}

                    {isAllowed("pos") && activeAdminModule === "pos" && (
                      <PosModule
                        orders={orders}
                        revenueStats={revenueStats}
                      />
                    )}

                    {isAllowed("finance") && activeAdminModule === "finance" && (
                      <FinanceModule />
                    )}

                    {isAllowed("crm") && activeAdminModule === "crm" && (
                      <CrmModule
                        customers={customers}
                        vouchers={vouchers}
                        orders={orders}
                      />
                    )}

                    {isAllowed("services") && activeAdminModule === "services" && (
                      <ServicesModule />
                    )}

                    {isAllowed("inventory") && activeAdminModule === "inventory" && (
                      <InventoryModule />
                    )}

                    {isAllowed("hr") && activeAdminModule === "hr" && (
                      <HrModule
                        staff={staff}
                        orders={orders}
                        currentUser={currentUser}
                      />
                    )}

                    {isAllowed("monitor") && activeAdminModule === "monitor" && (
                      <MonitorModule />
                    )}

                    {activeAdminModule === "system" && isModuleVisible("system") && (
                      <div className="space-y-6">
                        {/* Module 7 Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2">
                          <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-matte-black font-display uppercase">THIẾT LẬP HỆ THỐNG</h1>
                            <p className="text-mid-gray text-sm mt-1 font-sans">
                              Quản lý nhân sự, cấu hình quyền hạn (RBAC), kiểm toán bảo mật, quản trị CRM Khách hàng và giám sát IoT
                            </p>
                          </div>
                        </div>

                        {/* Module 7 Sub-tabs */}
                        <div className="flex border border-stone-200/80 bg-white p-1.5 rounded-2xl gap-1.5 overflow-x-auto pb-px scrollbar-none shadow-xs">
                          {allowedSubTabs.map((tab) => {
                            const TabIcon = tab.icon;
                            const isTabActive = activeModule7Tab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveModule7Tab(tab.id)}
                                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-display font-black tracking-wider uppercase transition-all duration-200 cursor-pointer border-0 ${
                                  isTabActive
                                    ? "bg-matte-black text-white shadow-sm"
                                    : "bg-[#f8f8f8] text-[#8e8e8e] hover:text-matte-black hover:bg-stone-100"
                                }`}
                              >
                                <TabIcon className="h-4 w-4 shrink-0" />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Active Sub-tab View */}
                        <div className="mt-4 animate-fadeIn">
                          {allowedSubTabs.find(tab => tab.id === activeModule7Tab)?.component}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeScreen === "kiosk" && (
                  <motion.div
                    key="kiosk"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-full"
                  >
                    <KioskCheckoutView />
                  </motion.div>
                )}

                {activeScreen === "tv" && (
                  <motion.div
                    key="tv"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-7xl mx-auto animate-fadeIn"
                  >
                    <TvQueueDisplayView orders={orders} booths={booths} />
                  </motion.div>
                )}

                {activeScreen === "ktv" && (
                  <motion.div
                    key="ktv"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-full min-h-[calc(100vh-73px)] p-4 sm:p-6 bg-[#0f172a]/95 flex flex-col items-center justify-start overflow-y-auto"
                  >
                    <KtvModule orders={orders} staff={staff} isStandalone={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------------------------------------------------------------
// VIEW: ADMIN HUB & MODULE 1 (DASHBOARD)
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------
interface AdminDashboardViewProps {
  orders: OrderStatusView[];
  revenueStats: any;
  booths: Booth[];
  staff: any[];
  vouchers: Voucher[];
}

function AdminDashboardView({ orders, revenueStats, booths, staff, vouchers }: AdminDashboardViewProps) {
  // Threshold Settings Drawer State
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [targetInput, setTargetInput] = useState(revenueStats.target);
  const [warningInput, setWarningInput] = useState(revenueStats.warning);
  
  // Manual Dispatch States
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [dispatchTechId, setDispatchTechId] = useState("");
  const [dispatchBoothId, setDispatchBoothId] = useState("");

  const handleUpdateThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    simActions.updateThresholds(Number(targetInput), Number(warningInput));
    setShowThresholdConfig(false);
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWoId && dispatchTechId && dispatchBoothId) {
      simActions.assignWorkOrder(selectedWoId, dispatchTechId, dispatchBoothId);
      // Log event
      setSelectedWoId(null);
      setDispatchTechId("");
      setDispatchBoothId("");
    }
  };

  // Safe formatting helpers
  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const activeWorkOrders = orders.filter(o => o.status !== 'done');
  const finishedWorkOrders = orders.filter(o => o.status === 'done');

  return (
    <div className="space-y-6">
      {/* MODULE HEADER AND QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-matte-black font-display uppercase">BÀN ĐIỀU PHỐI WASSUP</h1>
          <p className="text-mid-gray text-sm mt-1 font-sans">Đồng bộ hàng chờ thời gian thực, quản lý buồng rửa xe và giám sát mục tiêu doanh thu</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowThresholdConfig(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5e5e5] bg-white text-matte-black hover:bg-warm-white transition text-xs font-extrabold font-display tracking-wide shadow-sm"
          >
            <Settings className="h-4 w-4 text-mid-gray" />
            CẤU HÌNH NGƯỠNG DOANH THU
          </button>
        </div>
      </div>

      {/* ROW 1: 4 TOP METRIC CARDS WITH REVENUE PROGRESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* CARD 1: TODAY'S REVENUE WITH LIVE PROGRESS */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <TrendingUp className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Doanh thu hôm nay</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-matte-black tracking-tight">
              {formatVnd(revenueStats.totalRevenue)}
            </h3>

            {/* Target warning level metrics indicator */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-sans mb-1 text-mid-gray">
                <span>Tiến độ: {revenueStats.progressPercent}%</span>
                <span>Mục tiêu: {formatVnd(revenueStats.target)}</span>
              </div>
              
              {/* Progress track */}
              <div className="w-full h-2.5 bg-warm-white rounded-full overflow-hidden relative border border-[#e5e5e5]">
                {/* Warning marker line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" 
                  style={{ left: `${(revenueStats.warning / revenueStats.target) * 100}%` }}
                  title="Ngưỡng cảnh báo doanh thu thấp"
                />
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    revenueStats.targetMet 
                      ? "bg-brand-green" 
                      : revenueStats.warningLevelMet 
                        ? "bg-forest-green" 
                        : "bg-amber-500"
                  }`} 
                  style={{ width: `${revenueStats.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Threshold flags badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {revenueStats.targetMet ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-sans px-2.5 py-1 rounded-md bg-brand-green text-matte-black uppercase tracking-widest">
                  <CheckCircle className="h-3 w-3" /> Đạt Target Ngày
                </span>
              ) : revenueStats.warningLevelMet ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-sans px-2.5 py-1 rounded-md bg-brand-green-light text-forest-green border border-brand-green/20 uppercase tracking-widest">
                  <Activity className="h-3 w-3" /> Trên Cảnh Báo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-sans px-2.5 py-1 rounded-md bg-red-100 text-red-700 border border-red-200 uppercase tracking-widest animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Doanh Thu Thấp
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: CAR WASH QUEUE (HÀNG CHỜ) */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <Clock className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Hàng chờ điều phối</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-matte-black tracking-tight">
              {revenueStats.queuedCount} <span className="text-sm font-normal text-mid-gray">lệnh chờ</span>
            </h3>
            
            <div className="pt-2 text-xs font-sans text-mid-gray space-y-1">
              <div className="flex justify-between">
                <span>Đang thi công:</span>
                <span className="text-matte-black font-bold">{revenueStats.activeCount} xe</span>
              </div>
              <div className="flex justify-between">
                <span>Chờ phân buồng:</span>
                <span className="text-amber-600 font-bold">{orders.filter(o => o.status === 'queued').length} xe</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: HOÀN THÀNH VÀ REWORK */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <Wrench className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Hiệu suất trạm</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <Wrench className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-matte-black tracking-tight">
              {revenueStats.completedCount} <span className="text-sm font-normal text-mid-gray">đã xong</span>
            </h3>
            
            <div className="pt-2 text-xs font-sans text-mid-gray space-y-1">
              <div className="flex justify-between">
                <span>Yêu cầu rửa lại (Rework):</span>
                <span className={`font-bold ${revenueStats.reworkCount > 0 ? "text-red-500 animate-pulse" : "text-matte-black"}`}>
                  {revenueStats.reworkCount} lượt
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-mid-gray italic">
                <span>* Rework tối đa 2 lần/lệnh</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: GIAO CA QUỸ CHỐT */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500">
            <Users className="h-20 w-20 text-brand-green" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans tracking-wider text-mid-gray uppercase">Ca làm việc POS</span>
            <div className="h-8 w-8 rounded-lg bg-brand-green-light flex items-center justify-center text-forest-green">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold font-display text-matte-black tracking-tight uppercase">
              Ca sáng active
            </h3>
            
            <div className="pt-1 text-xs font-sans text-mid-gray space-y-1">
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span className="text-matte-black font-bold">Nguyễn Thu Ngân</span>
              </div>
              <div className="flex justify-between">
                <span>Mở ca lúc:</span>
                <span className="text-matte-black">07:00 (Hôm nay)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: ACTIVE BOOTHS MONITOR GRID (SƠ ĐỒ BUỒNG THI CÔNG TRỰC QUAN) */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <Layers className="h-5 w-5 text-forest-green" />
          SƠ ĐỒ TRẠNG THÁI BUỒNG THI CÔNG (BAY STATUS MONITOR)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {booths.map((booth) => {
            // Find active work orders inside this booth
            const activeWos = orders.filter(
              o => o.boothId === booth.id && o.status !== 'done'
            );

            const activeWo = activeWos[0]; // Take current active wash

            return (
              <div
                key={booth.id}
                className={`border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden shadow-sm ${
                  activeWo
                    ? "bg-white border-2 border-brand-green ring-4 ring-brand-green-light"
                    : "bg-white border-[#e5e5e5] hover:border-brand-green"
                }`}
              >
                {/* Header of Booth */}
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3 mb-4">
                  <h3 className="font-display font-extrabold text-sm text-matte-black tracking-wide">{booth.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold font-sans uppercase tracking-widest border ${
                      activeWo
                        ? "bg-brand-green text-matte-black border-brand-green"
                        : "bg-warm-white text-mid-gray border-[#e5e5e5]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${activeWo ? 'bg-matte-black animate-pulse' : 'bg-mid-gray'}`} />
                    {activeWo ? "BẬN (BUSY)" : "TRỐNG (IDLE)"}
                  </span>
                </div>

                {/* Booth content */}
                {activeWo ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center bg-warm-white p-3 rounded-xl border border-[#e5e5e5]">
                        <div>
                          <span className="text-[10px] font-sans font-extrabold text-mid-gray block uppercase">Biển số xe</span>
                          <span className="text-base font-extrabold font-sans text-matte-black tracking-wider">
                            {activeWo.licensePlate}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-sans font-extrabold text-mid-gray block uppercase">Dịch vụ</span>
                          <span className="inline-flex text-xs font-extrabold font-sans px-2.5 py-1 rounded bg-brand-green text-matte-black">
                            {activeWo.packageCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-sans bg-warm-white p-2.5 rounded-lg border border-[#e5e5e5]">
                      <div>
                        <span className="text-[9px] text-mid-gray font-extrabold block uppercase">KTV Điều Phối</span>
                        <span className="text-matte-black truncate block font-bold">
                          {activeWo.technicianName || "Chưa gán"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-mid-gray font-extrabold block uppercase">Bước Vận Hành</span>
                        <span className="text-forest-green font-extrabold block uppercase tracking-wider text-[11px]">
                          {activeWo.status === 'assigned' ? 'Đã gán' : activeWo.status === 'in_progress' ? 'Đang rửa' : activeWo.status === 'quality_check' ? 'QC Check' : activeWo.status === 'rework' ? 'Rework' : activeWo.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-sans font-bold text-mid-gray">
                        <span>Tiến độ dịch vụ</span>
                        <span>{activeWo.status === 'assigned' ? '15%' : activeWo.status === 'in_progress' ? '55%' : activeWo.status === 'quality_check' ? '85%' : activeWo.status === 'rework' ? '40%' : '0%'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#eaeaea] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-green transition-all duration-500"
                          style={{ 
                            width: activeWo.status === 'assigned' 
                              ? '15%' 
                              : activeWo.status === 'in_progress' 
                                ? '55%' 
                                : activeWo.status === 'quality_check' 
                                  ? '85%' 
                                  : activeWo.status === 'rework'
                                    ? '40%'
                                    : '0%' 
                          }}
                        />
                      </div>
                    </div>

                    {/* Interactive controls for testing pipeline */}
                    <div className="pt-2 border-t border-[#e5e5e5] flex flex-wrap gap-1.5">
                      {activeWo.status === 'assigned' && (
                        <button
                          onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'in_progress')}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green hover:bg-brand-green-hover text-matte-black text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5" /> BẮT ĐẦU RỬA
                        </button>
                      )}
                      {activeWo.status === 'in_progress' && (
                        <button
                          onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'quality_check')}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> QC CHECK
                        </button>
                      )}
                      {activeWo.status === 'quality_check' && (
                        <div className="grid grid-cols-2 gap-1.5 w-full">
                          <button
                            onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'done')}
                            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> HOÀN THÀNH
                          </button>
                          <button
                            onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'rework')}
                            disabled={activeWo.reworkCount >= 2}
                            className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold font-display transition cursor-pointer ${
                              activeWo.reworkCount >= 2 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                                : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                            }`}
                            title={activeWo.reworkCount >= 2 ? "Rework đạt tối đa 2 lần!" : "Yêu cầu thi công lại"}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> REWORK ({activeWo.reworkCount}/2)
                          </button>
                        </div>
                      )}
                      {activeWo.status === 'rework' && (
                        <button
                          onClick={() => simActions.updateWorkOrderStatus(activeWo.id, 'in_progress')}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold font-display transition shadow-sm cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5" /> CHẠY LẠI REWORK
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-[#e5e5e5] rounded-xl bg-warm-white">
                    <Car className="h-8 w-8 text-mid-gray mb-2" />
                    <span className="text-xs font-display text-matte-black font-extrabold tracking-wider">BUỒNG TRỐNG (IDLE)</span>
                    <span className="text-[10px] text-mid-gray mt-1 font-sans">Gán lệnh chờ tại bảng điều phối bên dưới</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 3: REAL-TIME VEHICLES QUEUE BOARD (BẢNG THAO TÁC HÀNG ĐỢI ĐIỀU PHỐI CHUYÊN SÂU) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PENDING QUEUED ORDERS TABLE (HÀNG ĐỢI CHO PHÂN PHỐI GÁN THỦ CÔNG) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
              <Activity className="h-5 w-5 text-forest-green" />
              DANH SÁCH LỆNH VẬN HÀNH REALTIME (WORK ORDER TELEMETRY)
            </h2>
            <span className="text-xs font-bold font-sans text-forest-green bg-brand-green-light px-2.5 py-1 rounded-full border border-brand-green/20">Tổng cộng: {orders.length} đơn</span>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray">Biển Số Xe</th>
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray">Phân Khúc</th>
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray">Dịch Vụ</th>
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray">KTV Phụ Trách</th>
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray">Buồng</th>
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray">Trạng Thái</th>
                    <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-mid-gray text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-mid-gray font-sans text-sm">
                        Chưa có lệnh rửa xe nào hoạt động. Sử dụng màn hình Kiosk để thêm đơn hàng mới!
                      </td>
                    </tr>
                  ) : (
                    orders.map((wo) => (
                      <tr
                        key={wo.id}
                        className={`hover:bg-warm-white/50 transition-colors ${
                          wo.status === 'done' ? "opacity-55" : ""
                        }`}
                      >
                        <td className="p-4 font-extrabold text-matte-black tracking-wider text-sm font-sans">{wo.licensePlate}</td>
                        <td className="p-4 capitalize text-mid-gray font-sans font-medium">{wo.vehicleSegment}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-brand-green text-matte-black font-extrabold text-[11px] font-sans">
                            {wo.packageCode}
                          </span>
                        </td>
                        <td className="p-4 text-matte-black font-medium">
                          {wo.technicianName ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-forest-green" /> {wo.technicianName}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic font-bold">Chưa phân công</span>
                          )}
                        </td>
                        <td className="p-4 text-forest-green font-extrabold">{wo.boothName || "—"}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                              wo.status === 'done'
                                ? "bg-brand-green text-matte-black border-brand-green"
                                : wo.status === 'quality_check'
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : wo.status === 'rework'
                                    ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                                    : wo.status === 'in_progress'
                                      ? "bg-brand-green-light text-forest-green border-brand-green/20"
                                      : "bg-gray-100 text-mid-gray border-gray-200"
                            }`}
                          >
                            {wo.status === 'queued' ? 'Chờ phân buồng' : wo.status === 'assigned' ? 'Đã gán' : wo.status === 'in_progress' ? 'Đang rửa' : wo.status === 'quality_check' ? 'QC Check' : wo.status === 'rework' ? 'Rework' : wo.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {wo.status === 'queued' ? (
                            <button
                              onClick={() => {
                                setSelectedWoId(wo.id);
                                setDispatchBoothId(booths.find(b => b.status === 'idle')?.id || "");
                                setDispatchTechId(staff.find(s => s.role === 'technician')?.id || "");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-hover text-matte-black font-extrabold font-display transition text-[11px] tracking-wide cursor-pointer shadow-sm"
                            >
                              ĐIỀU PHỐI (DISPATCH)
                            </button>
                          ) : wo.status !== 'done' ? (
                            <span className="text-[10px] text-mid-gray italic">Đang thi công bay...</span>
                          ) : (
                            <span className="text-[10px] text-forest-green font-extrabold flex items-center justify-end gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Hoàn tất
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL DISPATCH FORM PANEL & SEED DATABASE INFORMATION */}
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
            <Wrench className="h-5 w-5 text-forest-green" />
            BÀN ĐIỀU PHỐI LỆNH (DISPATCH DESK)
          </h2>

          <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
            {selectedWoId ? (
              <form onSubmit={handleDispatch} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
                  <span className="font-display text-xs font-black text-matte-black uppercase">Gán KTV & Buồng Thi Công</span>
                  <button
                    type="button"
                    onClick={() => setSelectedWoId(null)}
                    className="text-xs text-mid-gray hover:text-matte-black font-bold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold block">
                    Gán Buồng Thi Công
                  </label>
                  <select
                    required
                    value={dispatchBoothId}
                    onChange={(e) => setDispatchBoothId(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Chọn buồng rỗi...</option>
                    {booths.map(b => (
                      <option key={b.id} value={b.id} disabled={b.status === 'busy'}>
                        {b.name} {b.status === 'busy' ? '(Đầy)' : '(Sẵn sàng)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans text-mid-gray uppercase font-extrabold block">
                    Gán Kỹ Thuật Viên (KTV)
                  </label>
                  <select
                    required
                    value={dispatchTechId}
                    onChange={(e) => setDispatchTechId(e.target.value)}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                  >
                    <option value="">Chọn kỹ thuật viên...</option>
                    {staff.filter(s => s.role === 'technician').map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-extrabold tracking-wider text-xs font-display transition shadow-md shadow-brand-green/10 cursor-pointer"
                >
                  XÁC NHẬN GÁN & CHUYỂN TRẠNG THÁI
                </button>
              </form>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#e5e5e5] rounded-xl bg-warm-white">
                <Activity className="h-6 w-6 text-mid-gray mb-2" />
                <span className="text-xs text-matte-black font-extrabold font-display">BÀN ĐIỀU PHỐI ĐANG RỖI</span>
                <span className="text-[10px] text-mid-gray mt-1 max-w-[200px] font-sans">
                  Nhấn nút "Điều phối" ở hàng đợi phía bên cạnh để tiến hành gán nhanh kỹ thuật viên và buồng thi công.
                </span>
              </div>
            )}
          </div>

          {/* SIMULATION TELEGRAM LINK CONFIG / SEED SYSTEM METADATA */}
          <div className="bg-matte-black border border-[#2d2d2d] p-5 rounded-2xl space-y-3 shadow-md">
            <h4 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              Dual-Channel Telegram Integration
            </h4>
            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
              Hệ thống WASSUP OS đồng bộ trạng thái Web-View này song song với <strong>Telegram Bot KTV</strong>. Khi KTV cập nhật trạng thái rửa xe trên Bot điện thoại, bảng Admin Dashboard này sẽ tự động tải lại trạng thái Realtime mới nhất.
            </p>
            <div className="pt-2 flex justify-between gap-2 border-t border-[#3a3a3a]">
              <span className="text-[10px] font-sans text-gray-500">Bot Webhook:</span>
              <span className="text-[10px] font-sans text-brand-green">/api/telegram/webhook</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[10px] font-sans text-gray-500">DB Schema View:</span>
              <span className="text-[10px] font-sans text-brand-green">order_status_view</span>
            </div>
          </div>
        </div>
      </div>

      {/* THRESHOLD CONFIGURATION MODAL DIALOG */}
      {showThresholdConfig && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-extrabold font-display tracking-wider text-matte-black uppercase mb-4 flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
              <Settings className="h-5 w-5 text-forest-green" />
              CẤU HÌNH NGƯỠNG TARGET NGÀY
            </h3>

            <form onSubmit={handleUpdateThresholds} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Chỉ tiêu Doanh thu Ngày (Target)
                </label>
                <input
                  type="number"
                  required
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Ngưỡng Cảnh báo Doanh thu Thấp (Warning)
                </label>
                <input
                  type="number"
                  required
                  value={warningInput}
                  onChange={(e) => setWarningInput(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowThresholdConfig(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold font-display uppercase cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-matte-black font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                >
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// KioskCheckoutView has been refactored and is now imported from ./components/kiosk/KioskCheckoutView

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------
// VIEW: LARGE SCREEN TV QUEUE DISPLAY
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------
interface TvQueueDisplayViewProps {
  orders: OrderStatusView[];
  booths: Booth[];
}

function TvQueueDisplayView({ orders, booths }: TvQueueDisplayViewProps) {
  // Safe filtering
  const waitingOrders = orders.filter(o => o.status === 'queued');
  const ongoingWos = orders.filter(o => o.status !== 'done' && o.status !== 'queued');

  return (
    <div className="space-y-6">
      {/* TV Header */}
      <div className="bg-white border border-[#e5e5e5] p-6 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-green" />
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-brand-green-light rounded-xl flex items-center justify-center text-forest-green border border-brand-green/20">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display text-matte-black tracking-tight uppercase">
              BẢNG HIỂN THỊ ĐIỀU PHỐI TRẠNG THÁI KHÁCH HÀNG
            </h1>
            <p className="text-mid-gray font-sans text-xs uppercase tracking-wider font-extrabold mt-0.5">
              WASSUP BROADCAST NETWORK · CẬP NHẬT TRỰC TUYẾN
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="font-display text-xs font-black text-forest-green bg-brand-green-light px-3 py-1 rounded-full border border-brand-green/20 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" /> Realtime Connected
          </span>
          <span className="font-sans text-[10px] text-mid-gray uppercase font-medium">Tự động làm mới theo thời gian thực</span>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting queue display (HÀNG ĐỢI TIẾP NHẬN) */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-3xl space-y-4 shadow-sm">
          <h2 className="text-sm font-black font-display tracking-wider text-matte-black uppercase border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-forest-green" /> HÀNG ĐỢI TIẾP NHẬN
          </h2>

          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {waitingOrders.length === 0 ? (
                <motion.div
                  key="empty-waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-[300px] flex flex-col items-center justify-center text-center p-6"
                >
                  <Car className="h-10 w-10 text-[#d5d5d5] mb-3" />
                  <span className="text-xs font-extrabold text-matte-black font-display uppercase tracking-wider">Không có xe đợi gán</span>
                  <span className="text-[10px] text-mid-gray mt-1 max-w-[200px] leading-relaxed font-sans">
                    Toàn bộ xe đã được gán vào buồng sản xuất hoặc đã xử lý xong!
                  </span>
                </motion.div>
              ) : (
                waitingOrders.map((ord) => (
                  <motion.div
                    key={ord.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className="bg-warm-white border border-[#e5e5e5] rounded-2xl p-4.5 flex items-center justify-between font-sans shadow-sm hover:border-[#bcbcbc] transition-all"
                  >
                    <div className="space-y-1">
                      <span className="text-lg font-black text-matte-black tracking-widest font-display">
                        {ord.licensePlate}
                      </span>
                      <span className="text-[10px] text-mid-gray block uppercase font-extrabold font-sans">
                        Gói: {ord.packageCode} · {ord.vehicleSegment.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-brand-green-light text-forest-green border border-brand-green/20 text-[10px] font-black uppercase tracking-wider animate-pulse">
                        Chờ gán bay
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active Booth Grid (TRẠNG THÁI CÁC BUỒNG HOẠT ĐỘNG) */}
        <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-6 rounded-3xl space-y-4 shadow-sm">
          <h2 className="text-sm font-black font-display tracking-wider text-matte-black uppercase border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-forest-green" /> TRẠNG THÁI CÁC BUỒNG SẢN XUẤT (ACTIVE BAYS)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booths.map((booth) => {
              const matchedWo = ongoingWos.find(w => w.boothId === booth.id);

              return (
                <motion.div
                  key={booth.id}
                  layout
                  className={`border rounded-2xl p-5 space-y-4 relative overflow-hidden transition-colors duration-500 min-h-[260px] flex flex-col justify-between ${
                    matchedWo
                      ? "bg-white border-brand-green border-2 shadow-sm"
                      : "bg-warm-white border-[#e5e5e5] border-dashed text-mid-gray"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2.5">
                    <span className="text-xs font-black text-matte-black uppercase font-display tracking-wider">
                      {booth.name}
                    </span>
                    {matchedWo ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-forest-green uppercase font-sans">
                        <span className="h-2 w-2 rounded-full bg-brand-green animate-ping inline-block mr-1" />
                        Đang xử lý
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-mid-gray uppercase font-sans">
                        Sẵn sàng
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      {matchedWo ? (
                        <motion.div
                          key={`active-${matchedWo.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 w-full"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-mid-gray font-extrabold uppercase font-sans tracking-wider block">BIỂN SỐ XE</span>
                              <span className="text-xl font-black text-matte-black tracking-widest font-display block mt-0.5 animate-pulse">
                                {matchedWo.licensePlate}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-mid-gray font-extrabold uppercase font-sans tracking-wider block">KTV CHUYÊN TRÁCH</span>
                              <span className="text-xs text-matte-black font-extrabold font-sans block truncate max-w-[140px] mt-0.5">
                                {matchedWo.technicianName || "Chưa phân"}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between text-[11px] items-center bg-warm-white px-3 py-2 rounded-xl border border-[#e5e5e5]">
                            <span className="text-mid-gray font-sans font-medium">Quy trình hiện tại:</span>
                            <span className="text-forest-green font-black uppercase text-[11px] tracking-wider font-sans">
                              {matchedWo.status === 'assigned' ? 'Đã gán buồng' : 
                               matchedWo.status === 'in_progress' ? 'Đang rửa gầm & khoang' : 
                               matchedWo.status === 'quality_check' ? 'QC Kiểm định chất lượng' : 
                               matchedWo.status === 'rework' ? 'Rửa lại (Rework)' : 
                               matchedWo.status || 'Chờ tiếp nhận'}
                            </span>
                          </div>

                          {/* Bar indicator */}
                          <div className="space-y-1">
                            <div className="w-full h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-brand-green rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: matchedWo.status === 'assigned' 
                                    ? '25%' 
                                    : matchedWo.status === 'in_progress' 
                                      ? '60%' 
                                      : matchedWo.status === 'quality_check' 
                                        ? '90%' 
                                        : '0%' 
                                }}
                                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] font-extrabold text-mid-gray font-sans uppercase">
                              <span>Bắt đầu</span>
                              <span>Đang làm</span>
                              <span>QC</span>
                              <span>Xong</span>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center justify-center text-center py-4 w-full"
                        >
                          <Car className="h-8 w-8 text-[#d5d5d5] mb-2" />
                          <span className="text-[11px] font-black font-display text-mid-gray uppercase tracking-widest">
                            Bay trống (IDLE)
                          </span>
                          <span className="text-[9px] text-mid-gray mt-1 max-w-[150px] font-sans">
                            Có thể phân xe mới vào để thực hiện rửa ngay lập tức.
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
