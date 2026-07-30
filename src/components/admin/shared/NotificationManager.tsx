import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Package,
  Wrench,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { supabaseRealtime } from "../../../lib/supabase/client";
import { OrderStatusView } from "../../../types/workOrder.types";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

// Global programmatic toast utility
export const toast = {
  success: (title: string, message: string, duration = 6000) => triggerToast("success", title, message, duration),
  warning: (title: string, message: string, duration = 7000) => triggerToast("warning", title, message, duration),
  error: (title: string, message: string, duration = 8000) => triggerToast("error", title, message, duration),
  info: (title: string, message: string, duration = 5000) => triggerToast("info", title, message, duration),
};

function triggerToast(type: Toast["type"], title: string, message: string, duration: number) {
  const event = new CustomEvent("wassup-toast-notification", {
    detail: { type, title, message, duration }
  });
  window.dispatchEvent(event);
}

export default function NotificationManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevOrdersRef = useRef<OrderStatusView[] | null>(null);
  const prevLowStockIdsRef = useRef<Set<string>>(new Set());

  // 1. Listen for Programmatic Toasts
  useEffect(() => {
    const handleCustomToast = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { type, title, message, duration } = customEvent.detail;
        addToast(type, title, message, duration);
      }
    };

    window.addEventListener("wassup-toast-notification", handleCustomToast);
    return () => {
      window.removeEventListener("wassup-toast-notification", handleCustomToast);
    };
  }, []);

  // 2. Realtime Order Subscription (New Orders & Rework alerts)
  useEffect(() => {
    const subscription = supabaseRealtime.subscribeOrders((currentOrders) => {
      if (!currentOrders || currentOrders.length === 0) return;

      // Avoid spamming on first load
      if (prevOrdersRef.current === null) {
        prevOrdersRef.current = currentOrders;
        return;
      }

      const prevOrders = prevOrdersRef.current;

      // A. Check for New Orders
      currentOrders.forEach((order) => {
        const orderExistedBefore = prevOrders.some((prev) => prev.orderId === order.orderId);
        if (!orderExistedBefore) {
          toast.success(
            "ĐƠN HÀNG MỚI TIẾP NHẬN 🚗",
            `Biển số ${order.licensePlate} vừa được tạo (Gói ${order.packageCode} - ${order.total.toLocaleString("vi-VN")} VND)`,
            7000
          );
        }
      });

      // B. Check for Rework Requests (status is 'rework' or reworkCount increased)
      currentOrders.forEach((order) => {
        const prevOrder = prevOrders.find((prev) => prev.orderId === order.orderId);
        if (prevOrder) {
          const isNowRework = order.status === "rework" && prevOrder.status !== "rework";
          const countIncreased = order.reworkCount > prevOrder.reworkCount;

          if (isNowRework || countIncreased) {
            toast.error(
              "🚨 YÊU CẦU RỬA LẠI (REWORK)",
              `Xe biển số ${order.licensePlate} không đạt bài thi QC. Bắt buộc quay lại khu vực rửa xử lý gấp!`,
              9000
            );
          }
        }
      });

      prevOrdersRef.current = currentOrders;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Inventory Stock Monitor
  useEffect(() => {
    // Initial sync from localStorage
    const syncInventory = () => {
      try {
        const cached = localStorage.getItem("wassup_inventory_items");
        if (cached) {
          const items = JSON.parse(cached);
          if (Array.isArray(items)) {
            const currentLowStock = items.filter((item: any) => item.quantity <= item.minThreshold);
            
            // Check if any new item entered low stock state
            currentLowStock.forEach((item: any) => {
              if (!prevLowStockIdsRef.current.has(item.id)) {
                toast.warning(
                  "📦 CẢNH BÁO TỒN KHO THẤP",
                  `Hóa chất/vật tư "${item.name}" còn ${item.quantity} ${item.unit} (Dưới ngưỡng tối thiểu ${item.minThreshold}). Hãy bù hàng gấp!`,
                  8000
                );
              }
            });

            // Update current set of low stock IDs
            prevLowStockIdsRef.current = new Set(currentLowStock.map((i: any) => i.id));
          }
        }
      } catch (err) {
        console.error("Error reading inventory for alerts:", err);
      }
    };

    // Run initially
    syncInventory();

    // Listen to custom local inventory update event
    const handleInventoryUpdate = () => {
      syncInventory();
    };

    window.addEventListener("wassup-inventory-update", handleInventoryUpdate);
    return () => {
      window.removeEventListener("wassup-inventory-update", handleInventoryUpdate);
    };
  }, []);

  const addToast = (type: Toast["type"], title: string, message: string, duration = 5000) => {
    const id = "toast_" + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible to avoid clutter

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Icon selector based on toast type
  const getIcon = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-[#A2C62C]" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500 animate-pulse" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Border/background selector based on toast type
  const getStyleClasses = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-white border-[#A2C62C] text-matte-black shadow-lg shadow-[#A2C62C]/10";
      case "warning":
        return "bg-white border-amber-400 text-matte-black shadow-lg shadow-amber-400/10";
      case "error":
        return "bg-white border-red-500 text-matte-black shadow-lg shadow-red-500/10";
      case "info":
      default:
        return "bg-white border-blue-500 text-matte-black shadow-lg shadow-blue-500/10";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`pointer-events-auto border-l-4 p-4 rounded-xl flex gap-3.5 ${getStyleClasses(
              toast.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-grow">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-matte-black">
                  {toast.title}
                </h4>
                <span className="text-[9px] font-sans font-bold text-mid-gray shrink-0">
                  {toast.timestamp}
                </span>
              </div>
              <p className="text-xs text-mid-gray leading-snug mt-1 font-sans">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-mid-gray hover:text-matte-black flex-shrink-0 transition self-start cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
