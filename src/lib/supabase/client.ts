import { createClient } from "@supabase/supabase-js";
import { OrderStatusView, WoStatus } from "../../types/workOrder.types";
import { Order, Customer, Booth, Service } from "../../types/order.types";
import { Voucher } from "../../types/voucher.types";

// Standard Supabase ENV check (supporting both Vite and Next.js)
const supabaseUrl = 
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseAnonKey = 
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isRealSupabase) {
  console.warn("VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY not found. WASSUP Station OS running on high-fidelity Realtime State Simulator.");
}

// ------------------------------------------------------------
// HIGH FIDELITY SIMULATION STORE
// ------------------------------------------------------------
interface SimState {
  orders: Order[];
  workOrders: any[];
  customers: Customer[];
  staff: any[];
  booths: Booth[];
  thresholds: { daily_target: number; warning_level: number };
  vouchers: Voucher[];
  revenueToday: number;
  voucherRedemptions?: any[];
  customerGroups?: any[];
}

// Initial Mock Seed Data
const INITIAL_STATE: SimState = {
  customers: [
    {
      id: 'c1',
      name: 'Trần Minh Quân',
      phone: '0901234567',
      licensePlate: '30A-123.45',
      licensePlates: ['30A-123.45', '29A-555.55'],
      dob: '1990-05-15',
      address: '12 Cầu Giấy, Hà Nội',
      points: 150,
      createdAt: new Date().toISOString(),
      vehicles: [
        { plate: '30A-123.45', vehicleClass: 'suv' },
        { plate: '29A-555.55', vehicleClass: 'sedan' }
      ]
    },
    {
      id: 'c2',
      name: 'Nguyễn Thị Bích',
      phone: '0911223344',
      licensePlate: '51G-999.99',
      licensePlates: ['51G-999.99'],
      dob: '1995-10-20',
      address: '456 Lê Lợi, Quận 1, TP. HCM',
      points: 40,
      createdAt: new Date().toISOString(),
      vehicles: [
        { plate: '51G-999.99', vehicleClass: 'sedan' }
      ]
    },
    {
      id: 'c3',
      name: 'Lê Hoàng Long',
      phone: '0988776655',
      licensePlate: '29H-888.88',
      licensePlates: ['29H-888.88', '30F-999.88', '30L-111.22'],
      dob: '1988-12-01',
      address: '789 Nguyễn Trãi, Thanh Xuân, Hà Nội',
      points: 300,
      createdAt: new Date().toISOString(),
      vehicles: [
        { plate: '29H-888.88', vehicleClass: 'truck' },
        { plate: '30F-999.88', vehicleClass: 'suv' },
        { plate: '30L-111.22', vehicleClass: 'sedan' }
      ]
    },
  ],
  staff: [
    { id: 's1', name: 'Trần Minh Quân (Admin)', role: 'master_admin', phone: '0901234567', pin: '123456' },
    { id: 's2', name: 'Nguyễn Văn Hùng (Quản Lý)', role: 'manager', phone: '0911234567', pin: '123456' },
    { id: 's3', name: 'Nguyễn Văn A (KTV 1)', role: 'technician', phone: '0921234567', pin: '123456' },
    { id: 's4', name: 'Lê Văn B (KTV 2)', role: 'technician', phone: '0931234567', pin: '123456' },
    { id: 's5', name: 'Phạm Văn C (KTV 3)', role: 'technician', phone: '0987654321', pin: '123456' },
    { id: 's6', name: 'Trần Thị D (Kế toán)', role: 'accountant', phone: '0941234567', pin: '123456' },
  ],
  booths: [
    { id: 'b1', name: 'Wash Bay A', status: 'busy', createdAt: new Date().toISOString() },
    { id: 'b2', name: 'Wash Bay B', status: 'busy', createdAt: new Date().toISOString() },
    { id: 'b3', name: 'Detailing Bay C', status: 'idle', createdAt: new Date().toISOString() },
    { id: 'b4', name: 'Quality Check Bay', status: 'idle', createdAt: new Date().toISOString() },
  ],
  thresholds: {
    daily_target: 50000000, // 50,000,000 VND
    warning_level: 35000000, // 35,000,000 VND
  },
  orders: [
    { id: 'o1', customerId: 'c1', licensePlate: '30A-123.45', vehicleSegment: 'suv', packageCode: 'W2', subtotal: 250000, discount: 0, total: 250000, status: 'paid', boothId: 'b1', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'o2', customerId: 'c2', licensePlate: '51G-999.99', vehicleSegment: 'sedan', packageCode: 'W1', subtotal: 150000, discount: 0, total: 150000, status: 'paid', boothId: 'b2', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'o3', customerId: 'c3', licensePlate: '29H-888.88', vehicleSegment: 'truck', packageCode: 'W3', subtotal: 450000, discount: 50000, total: 400000, status: 'paid', boothId: 'b3', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  ],
  workOrders: [
    { id: 'wo1', orderId: 'o1', status: 'in_progress', technicianId: 's3', boothId: 'b1', reworkCount: 0, estimatedDuration: 30, startedAt: new Date(Date.now() - 20 * 60000).toISOString(), createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'wo2', orderId: 'o2', status: 'assigned', technicianId: 's4', boothId: 'b2', reworkCount: 0, estimatedDuration: 25, startedAt: null, createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'wo3', orderId: 'o3', status: 'queued', technicianId: null, boothId: null, reworkCount: 0, estimatedDuration: 40, startedAt: null, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  ],
  vouchers: [
    { id: 'v1', customerId: 'c1', code: 'WASSUPNEW', type: 'percent', value: 10, maxDiscount: 50000, minOrderValue: 150000, validFrom: new Date(Date.now() - 86400000).toISOString(), validTo: new Date(Date.now() + 864000000).toISOString(), source: 'manual_grant', createdAt: new Date().toISOString() },
    { id: 'v2', customerId: 'c2', code: 'FIX50', type: 'fixed_amount', value: 50000, minOrderValue: 100000, validFrom: new Date(Date.now() - 86400000).toISOString(), validTo: new Date(Date.now() + 864000000).toISOString(), source: 'sup_redeem', createdAt: new Date().toISOString() },
  ],
  revenueToday: 18450000, // Cumulative mock baseline revenue
  voucherRedemptions: [
    {
      id: "vr_1",
      voucherId: "v1",
      customerId: "c1",
      orderId: "o1",
      amountApplied: 25000,
      redeemedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  customerGroups: [
    {
      id: "g_vip",
      name: "Nhóm VIP (Chi tiêu > 5M)",
      mode: "dynamic",
      filterCriteria: {
        spent: "over_5m",
        visits: "all",
        lastVisit: "all",
        vouchers: "all",
        dobMonth: "all"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "g_loyal",
      name: "Khách hàng Thân Thiết (Ghé > 3 lần)",
      mode: "dynamic",
      filterCriteria: {
        spent: "all",
        visits: "3_10",
        lastVisit: "all",
        vouchers: "all",
        dobMonth: "all"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "g_static_1",
      name: "Khách VIP Chăm Sóc Riêng",
      mode: "static",
      customerIds: ["c1", "c3"],
      createdAt: new Date().toISOString()
    }
  ]
};

// Initialize Store from LocalStorage if exists
const STORE_KEY = 'wassup_store_state';
const getStoredState = (): SimState => {
  if (typeof window === 'undefined') {
    return INITIAL_STATE;
  }
  const data = localStorage.getItem(STORE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.staff)) {
        // Detect duplicate IDs in staff list
        const idMap = new Map<string, string[]>();
        parsed.staff.forEach((s: any) => {
          if (s && s.id) {
            if (!idMap.has(s.id)) {
              idMap.set(s.id, []);
            }
            idMap.get(s.id)!.push(s.phone || s.name);
          }
        });

        let needsSave = false;
        const idReplacements = new Map<string, string>(); // oldId + "_" + phone -> newId

        const seenIds = new Set<string>();
        const updatedStaff = parsed.staff.map((s: any) => {
          if (!s || !s.id) return s;
          
          const isDuplicateId = idMap.get(s.id)!.length > 1;
          const alreadySeen = seenIds.has(s.id);

          if (isDuplicateId && alreadySeen) {
            const oldId = s.id;
            const newId = "s_" + Date.now() + "_" + Math.floor(Math.random() * 1000000) + "_" + Math.floor(Math.random() * 1000);
            s.id = newId;
            idReplacements.set(oldId + "_" + s.phone, newId);
            needsSave = true;
          }
          seenIds.add(s.id);
          return s;
        });

        if (needsSave) {
          parsed.staff = updatedStaff;

          idReplacements.forEach((newId, keyKey) => {
            const [oldId, phone] = keyKey.split("_");
            
            // Update wassup_hr_profiles
            try {
              const profilesStr = localStorage.getItem("wassup_hr_profiles");
              if (profilesStr) {
                const profiles = JSON.parse(profilesStr);
                let changed = false;
                const updatedProfiles = profiles.map((p: any) => {
                  const staffMember = parsed.staff.find((st: any) => st.phone === phone);
                  if (p.staffId === oldId && staffMember && staffMember.id === newId) {
                    p.staffId = newId;
                    changed = true;
                  }
                  return p;
                });
                if (changed) {
                  localStorage.setItem("wassup_hr_profiles", JSON.stringify(updatedProfiles));
                }
              }
            } catch (e) {
              console.error("Heal profiles error:", e);
            }

            // Update wassup_hr_certs
            try {
              const certsStr = localStorage.getItem("wassup_hr_certs");
              if (certsStr) {
                const certs = JSON.parse(certsStr);
                let changed = false;
                const updatedCerts = certs.map((c: any) => {
                  const staffMember = parsed.staff.find((st: any) => st.phone === phone);
                  if (c.staffId === oldId && staffMember && staffMember.id === newId) {
                    c.staffId = newId;
                    changed = true;
                  }
                  return c;
                });
                if (changed) {
                  localStorage.setItem("wassup_hr_certs", JSON.stringify(updatedCerts));
                }
              }
            } catch (e) {
              console.error("Heal certs error:", e);
            }

            // Update wassup_hr_discipline_logs
            try {
              const logsStr = localStorage.getItem("wassup_hr_discipline_logs");
              if (logsStr) {
                const logs = JSON.parse(logsStr);
                let changed = false;
                const updatedLogs = logs.map((l: any) => {
                  const staffMember = parsed.staff.find((st: any) => st.phone === phone);
                  if (l.staffId === oldId && staffMember && staffMember.id === newId) {
                    l.staffId = newId;
                    changed = true;
                  }
                  return l;
                });
                if (changed) {
                  localStorage.setItem("wassup_hr_discipline_logs", JSON.stringify(updatedLogs));
                }
              }
            } catch (e) {
              console.error("Heal logs error:", e);
            }
          });

          localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch (e) {
       return INITIAL_STATE;
    }
  }
  return INITIAL_STATE;
};

let currentState: SimState = getStoredState();

const saveState = () => {
  localStorage.setItem(STORE_KEY, JSON.stringify(currentState));
  // Broadcast update
  listeners.forEach(cb => cb(getMergedOrderStatusView()));
  revenueListeners.forEach(cb => cb(getRevenueStats()));
  staffListeners.forEach(cb => cb(currentState.staff));
  voucherListeners.forEach(cb => cb(currentState.vouchers));
  customerListeners.forEach(cb => cb(currentState.customers));
};

// Cross-tab Synchronization Listener for High Fidelity Simulator Mode
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORE_KEY) {
      currentState = getStoredState();
      // Broadcast to local listeners in this tab
      listeners.forEach(cb => cb(getMergedOrderStatusView()));
      revenueListeners.forEach(cb => cb(getRevenueStats()));
      staffListeners.forEach(cb => cb(currentState.staff));
      voucherListeners.forEach(cb => cb(currentState.vouchers));
      customerListeners.forEach(cb => cb(currentState.customers));
    }
  });
}

// Listeners Registry
const listeners = new Set<(orders: OrderStatusView[]) => void>();
const revenueListeners = new Set<(stats: any) => void>();
const staffListeners = new Set<(staff: any[]) => void>();
const voucherListeners = new Set<(vouchers: Voucher[]) => void>();
const customerListeners = new Set<(customers: Customer[]) => void>();

export function getMergedOrderStatusView(): OrderStatusView[] {
  return currentState.orders.map(o => {
    const wo = currentState.workOrders.find(w => w.orderId === o.id) || {
      id: 'mock-wo-' + o.id,
      status: 'queued' as WoStatus,
      reworkCount: 0,
      estimatedDuration: 30,
      etaExtensionRequest: null,
    };
    const cust = currentState.customers.find(c => c.id === o.customerId);
    const tech = currentState.staff.find(s => s.id === wo.technicianId);
    const booth = currentState.booths.find(b => b.id === wo.boothId);

    return {
      id: wo.id,
      orderId: o.id,
      status: wo.status,
      technicianId: wo.technicianId,
      technicianName: tech ? tech.name : undefined,
      boothId: wo.boothId,
      boothName: booth ? booth.name : undefined,
      reworkCount: wo.reworkCount,
      estimatedDuration: wo.estimatedDuration,
      startedAt: wo.startedAt,
      completedAt: wo.completedAt,
      createdAt: wo.createdAt,
      etaExtensionRequest: wo.etaExtensionRequest || null,
      lastChannel: wo.lastChannel || 'web',
      notes: wo.notes,
      customerId: o.customerId,
      customerName: cust ? cust.name : "Khách vãng lai",
      customerPhone: cust ? cust.phone : undefined,
      licensePlate: o.licensePlate,
      vehicleSegment: o.vehicleSegment,
      packageCode: o.packageCode,
      total: o.total,
      commerceStatus: o.status,
      orderCreatedAt: o.createdAt
    };
  });
}

export function getRevenueStats() {
  const baseRevenue = currentState.revenueToday;
  const target = currentState.thresholds.daily_target;
  const warning = currentState.thresholds.warning_level;
  
  // Calculate today's completed orders total
  const ordersTotal = currentState.orders
    .filter(o => o.status === 'paid' || o.status === 'closed')
    .reduce((sum, o) => sum + o.total, 0);

  const totalRevenue = baseRevenue + ordersTotal;
  const progressPercent = Math.min(Math.round((totalRevenue / target) * 100), 100);

  return {
    totalRevenue,
    target,
    warning,
    progressPercent,
    targetMet: totalRevenue >= target,
    warningLevelMet: totalRevenue >= warning,
    orderCount: currentState.orders.length,
    completedCount: currentState.workOrders.filter(w => w.status === 'done').length,
    activeCount: currentState.workOrders.filter(w => w.status === 'in_progress' || w.status === 'quality_check').length,
    queuedCount: currentState.workOrders.filter(w => w.status === 'queued' || w.status === 'assigned').length,
    reworkCount: currentState.workOrders.reduce((sum, w) => sum + (w.reworkCount || 0), 0),
  };
}

// ------------------------------------------------------------
// SIMULATION ENGINE ACTIONS
// ------------------------------------------------------------

export const simActions = {
  getStaff: () => currentState.staff,
  getBooths: () => currentState.booths,
  getCustomers: () => currentState.customers,
  getVouchers: () => currentState.vouchers,
  getThresholds: () => currentState.thresholds,
  
  addCustomer: (data: { name: string; phone: string; licensePlate?: string; licensePlates?: string[]; dob?: string; address?: string; points?: number; vehicles?: { plate: string; vehicleClass: 'sedan' | 'suv' | 'truck' }[] }) => {
    const plates = data.licensePlates || (data.licensePlate ? [data.licensePlate] : []);
    const vehiclesList = data.vehicles || plates.map(p => ({ plate: p, vehicleClass: 'sedan' as const }));
    const newCust = {
      id: 'c_' + Date.now(),
      name: data.name,
      phone: data.phone,
      licensePlate: data.licensePlate || "",
      licensePlates: plates,
      dob: data.dob || "",
      address: data.address || "",
      points: data.points || 0,
      createdAt: new Date().toISOString(),
      vehicles: vehiclesList
    };
    currentState.customers.push(newCust);
    saveState();

    if (isRealSupabase && supabase) {
      (async () => {
        try {
          await supabase
            .from("customers")
            .insert({
              name: data.name,
              phone: data.phone,
              license_plate: data.licensePlate || "",
              points: data.points || 0
            });
        } catch (err) {
          console.error("Error in Supabase addCustomer:", err);
        }
      })();
    }

    return newCust;
  },

  updateCustomer: (id: string, data: { name?: string; phone?: string; licensePlate?: string; licensePlates?: string[]; dob?: string; address?: string; points?: number; vehicles?: { plate: string; vehicleClass: 'sedan' | 'suv' | 'truck' }[] }) => {
    const cust = currentState.customers.find(c => c.id === id);
    if (cust) {
      if (data.name !== undefined) cust.name = data.name;
      if (data.phone !== undefined) cust.phone = data.phone;
      if (data.licensePlate !== undefined) cust.licensePlate = data.licensePlate;
      if (data.licensePlates !== undefined) cust.licensePlates = data.licensePlates;
      if (data.dob !== undefined) cust.dob = data.dob;
      if (data.address !== undefined) cust.address = data.address;
      if (data.points !== undefined) cust.points = data.points;
      if (data.vehicles !== undefined) cust.vehicles = data.vehicles;
      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            const updates: any = {};
            if (data.name !== undefined) updates.name = data.name;
            if (data.phone !== undefined) updates.phone = data.phone;
            if (data.licensePlate !== undefined) updates.license_plate = data.licensePlate;
            if (data.points !== undefined) updates.points = data.points;

            await supabase
              .from("customers")
              .update(updates)
              .eq("id", id);
          } catch (err) {
            console.error("Error in Supabase updateCustomer:", err);
          }
        })();
      }

      return cust;
    }
    return null;
  },

  updateThresholds: (daily_target: number, warning_level: number) => {
    currentState.thresholds = { daily_target, warning_level };
    saveState();

    if (isRealSupabase && supabase) {
      (async () => {
        try {
          await supabase
            .from("revenue_thresholds")
            .insert({
              daily_target,
              warning_level
            });
        } catch (err) {
          console.error("Error in Supabase updateThresholds:", err);
        }
      })();
    }
  },

  addStaff: (data: { name: string; phone: string; role: "master_admin" | "manager" | "technician" | "accountant"; pin?: string }) => {
    const newStaff = {
      id: "s_" + Date.now() + "_" + Math.floor(Math.random() * 1000000) + "_" + Math.floor(Math.random() * 1000),
      name: data.name,
      phone: data.phone,
      role: data.role,
      pin: data.pin || "123456",
      status: "active"
    };
    currentState.staff.push(newStaff);
    saveState();

    if (isRealSupabase && supabase) {
      (async () => {
        try {
          await supabase
            .from("staff")
            .insert({
              name: data.name,
              phone: data.phone,
              role: data.role,
              pin: data.pin || "123456",
              status: "active"
            });
        } catch (err) {
          console.error("Error in Supabase addStaff:", err);
        }
      })();
    }

    return newStaff;
  },

  updateStaff: (id: string, data: { name?: string; phone?: string; role?: "master_admin" | "manager" | "technician" | "accountant"; status?: "active" | "blocked"; pin?: string }) => {
    const staffMember = currentState.staff.find(s => s.id === id);
    if (staffMember) {
      if (data.name !== undefined) staffMember.name = data.name;
      if (data.phone !== undefined) staffMember.phone = data.phone;
      if (data.role !== undefined) staffMember.role = data.role;
      if (data.status !== undefined) staffMember.status = data.status;
      if (data.pin !== undefined) staffMember.pin = data.pin;
      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            const updates: any = {};
            if (data.name !== undefined) updates.name = data.name;
            if (data.phone !== undefined) updates.phone = data.phone;
            if (data.role !== undefined) updates.role = data.role;
            if (data.status !== undefined) updates.status = data.status;
            if (data.pin !== undefined) updates.pin = data.pin;

            await supabase
              .from("staff")
              .update(updates)
              .eq("id", id);
          } catch (err) {
            console.error("Error in Supabase updateStaff:", err);
          }
        })();
      }

      return staffMember;
    }
    return null;
  },

  deleteStaff: (id: string) => {
    const idx = currentState.staff.findIndex(s => s.id === id);
    if (idx !== -1) {
      currentState.staff.splice(idx, 1);
      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            await supabase
              .from("staff")
              .delete()
              .eq("id", id);
          } catch (err) {
            console.error("Error in Supabase deleteStaff:", err);
          }
        })();
      }
      return true;
    }
    return false;
  },

  createOrder: (data: {
    customerPhone?: string;
    customerName?: string;
    licensePlate: string;
    vehicleSegment: 'sedan' | 'suv' | 'truck';
    packageCode: string;
    subtotal: number;
    discount: number;
    total: number;
    boothId?: string;
    estimatedDuration?: number;
    notes?: string;
  }) => {
    let customerId = undefined;
    if (data.customerPhone) {
      let cust = currentState.customers.find(c => c.phone === data.customerPhone);
      if (!cust) {
        cust = {
          id: 'c_' + Date.now(),
          name: data.customerName || "Khách mới",
          phone: data.customerPhone,
          licensePlate: data.licensePlate,
          points: Math.floor(data.total * 0.001), // 1 point per 1000VND
          createdAt: new Date().toISOString()
        };
        currentState.customers.push(cust);
      } else {
        cust.points += Math.floor(data.total * 0.001);
      }
      customerId = cust.id;
    }

    const orderId = 'o_' + Date.now();
    const newOrder: Order = {
      id: orderId,
      customerId,
      licensePlate: data.licensePlate,
      vehicleSegment: data.vehicleSegment,
      packageCode: data.packageCode,
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      status: 'paid', // Kiosk usually paid immediately
      boothId: data.boothId,
      createdAt: new Date().toISOString()
    };

    const newWo = {
      id: 'wo_' + Date.now(),
      orderId: orderId,
      status: data.boothId ? 'assigned' as WoStatus : 'queued' as WoStatus,
      technicianId: data.boothId ? currentState.staff.find(s => s.role === 'technician')?.id || null : null,
      boothId: data.boothId || null,
      reworkCount: 0,
      estimatedDuration: data.estimatedDuration || 30,
      notes: data.notes || null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString()
    };

    currentState.orders.push(newOrder);
    currentState.workOrders.push(newWo);

    if (data.boothId) {
      const b = currentState.booths.find(b => b.id === data.boothId);
      if (b) b.status = 'busy';
    }

    saveState();

    if (isRealSupabase && supabase) {
      (async () => {
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc("create_kiosk_order_v2", {
            p_phone: data.customerPhone || null,
            p_name: data.customerName || null,
            p_license_plate: data.licensePlate,
            p_vehicle_segment: data.vehicleSegment,
            p_package_code: data.packageCode,
            p_subtotal: data.subtotal,
            p_discount: data.discount,
            p_total: data.total,
            p_booth_id: data.boothId || null
          });

          if (rpcErr) {
            console.error("Error invoking create_kiosk_order_v2 RPC:", rpcErr);
          } else {
            console.log("Atomic Kiosk Order Sync Succeeded:", rpcRes);
          }
        } catch (err) {
          console.error("Error in Supabase atomic order creation:", err);
        }
      })();
    }

    return { orderId, workOrderId: newWo.id };
  },

  assignWorkOrder: (woId: string, technicianId: string, boothId: string) => {
    const wo = currentState.workOrders.find(w => w.id === woId);
    if (wo) {
      wo.technicianId = technicianId;
      wo.boothId = boothId;
      wo.status = 'assigned';
      
      const b = currentState.booths.find(b => b.id === boothId);
      if (b) b.status = 'busy';
      
      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            await supabase
              .from("work_orders")
              .update({
                technician_id: technicianId,
                booth_id: boothId,
                status: 'assigned'
              })
              .eq("id", woId);

            await supabase
              .from("booths")
              .update({ status: 'busy' })
              .eq("id", boothId);
          } catch (err) {
            console.error("Error in Supabase assignWorkOrder:", err);
          }
        })();
      }

      return true;
    }
    return false;
  },

  rejectWorkOrder: (woId: string) => {
    const wo = currentState.workOrders.find(w => w.id === woId);
    if (wo) {
      const oldBoothId = wo.boothId;
      wo.technicianId = null;
      wo.boothId = null;
      wo.status = 'queued';
      
      if (oldBoothId) {
        const remainingActive = currentState.workOrders.some(w => w.boothId === oldBoothId && w.id !== woId && w.status !== 'done');
        if (!remainingActive) {
          const oldB = currentState.booths.find(b => b.id === oldBoothId);
          if (oldB) oldB.status = 'idle';
        }
      }
      
      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            await supabase
              .from("work_orders")
              .update({
                technician_id: null,
                booth_id: null,
                status: 'queued'
              })
              .eq("id", woId);
            
            if (oldBoothId) {
              const remainingActive = currentState.workOrders.some(w => w.boothId === oldBoothId && w.id !== woId && w.status !== 'done');
              if (!remainingActive) {
                await supabase
                  .from("booths")
                  .update({ status: 'idle' })
                  .eq("id", oldBoothId);
              }
            }
          } catch (err) {
            console.error("Error in Supabase rejectWorkOrder:", err);
          }
        })();
      }
      return true;
    }
    return false;
  },

  moveWorkOrderBooth: (woId: string, targetBoothId: string) => {
    const wo = currentState.workOrders.find(w => w.id === woId);
    if (wo) {
      const oldBoothId = wo.boothId;
      wo.boothId = targetBoothId;
      
      // Update booth statuses
      const targetB = currentState.booths.find(b => b.id === targetBoothId);
      if (targetB) targetB.status = 'busy';
      
      if (oldBoothId && oldBoothId !== targetBoothId) {
        // Check if there are other active work orders in the old booth
        const remainingActive = currentState.workOrders.some(w => w.boothId === oldBoothId && w.id !== woId && w.status !== 'done');
        if (!remainingActive) {
          const oldB = currentState.booths.find(b => b.id === oldBoothId);
          if (oldB) oldB.status = 'idle';
        }
      }
      
      saveState();
      
      if (isRealSupabase && supabase) {
        (async () => {
          try {
            await supabase
              .from("work_orders")
              .update({ booth_id: targetBoothId })
              .eq("id", woId);
            
            await supabase
              .from("booths")
              .update({ status: 'busy' })
              .eq("id", targetBoothId);
              
            if (oldBoothId && oldBoothId !== targetBoothId) {
              const remainingActive = currentState.workOrders.some(w => w.boothId === oldBoothId && w.id !== woId && w.status !== 'done');
              if (!remainingActive) {
                await supabase
                  .from("booths")
                  .update({ status: 'idle' })
                  .eq("id", oldBoothId);
              }
            }
          } catch (err) {
            console.error("Error in Supabase moveWorkOrderBooth:", err);
          }
        })();
      }
      return true;
    }
    return false;
  },

  updateWorkOrderStatus: (woId: string, status: WoStatus, actorId?: string, channel: 'web' | 'telegram' | 'system' = 'web', notes?: string) => {
    const wo = currentState.workOrders.find(w => w.id === woId);
    if (wo) {
      wo.status = status;
      wo.lastChannel = channel;
      if (status === 'in_progress' && !wo.startedAt) {
        wo.startedAt = new Date().toISOString();
      }
      if (status === 'done') {
        wo.completedAt = new Date().toISOString();
        // Free booth
        if (wo.boothId) {
          const b = currentState.booths.find(b => b.id === wo.boothId);
          if (b) b.status = 'idle';
        }

        // AUTOMATED INVENTORY DEDUCTION (Auto-BOM)
        try {
          const cachedItems = localStorage.getItem("wassup_inventory_items");
          const cachedLedger = localStorage.getItem("wassup_inventory_ledger");
          
          if (cachedItems) {
            let invItems = JSON.parse(cachedItems);
            let invLedger = cachedLedger ? JSON.parse(cachedLedger) : [];
            
            // Get order details
            const matchedOrder = currentState.orders.find(o => o.id === wo.orderId);
            if (matchedOrder) {
              const pkg = matchedOrder.packageCode || "W1";
              let itemsToDeduct: { id: string; amount: number; reason: string }[] = [];
              
              if (pkg === "W0") {
                itemsToDeduct = [
                  { id: "inv-02", amount: 1, reason: `Hao phí tự động (BOM) Gói Standard ${pkg} - Xe ${matchedOrder.licensePlate}` }
                ];
              } else if (pkg === "W1" || pkg === "W5") {
                itemsToDeduct = [
                  { id: "inv-02", amount: 1, reason: `Hao phí tự động (BOM) Gói Premium ${pkg} - Xe ${matchedOrder.licensePlate}` },
                  { id: "inv-01", amount: 1, reason: `Dưỡng chất tự động (BOM) Gói Premium ${pkg} - Xe ${matchedOrder.licensePlate}` }
                ];
              } else {
                itemsToDeduct = [
                  { id: "inv-02", amount: 1, reason: `Hao phí tự động (BOM) Gói Cao Cấp ${pkg} - Xe ${matchedOrder.licensePlate}` },
                  { id: "inv-01", amount: 1, reason: `Dưỡng chất tự động (BOM) Gói Cao Cấp ${pkg} - Xe ${matchedOrder.licensePlate}` },
                  { id: "inv-03", amount: 1, reason: `Đất sét làm sạch (BOM) Gói Cao Cấp ${pkg} - Xe ${matchedOrder.licensePlate}` }
                ];
              }
              
              // Apply deductions
              invItems = invItems.map((item: any) => {
                const deduction = itemsToDeduct.find(d => d.id === item.id);
                if (deduction) {
                  const remaining = Math.max(item.quantity - deduction.amount, 0);
                  
                  // Add ledger entry
                  const logRow = {
                    id: "lg_auto_" + Date.now() + "_" + item.id,
                    itemId: item.id,
                    itemName: item.name,
                    date: new Date().toISOString(),
                    type: "export",
                    typeLabel: "Hao phí định mức (Auto-BOM)",
                    quantityChanged: -deduction.amount,
                    balanceAfter: remaining,
                    actor: "Hệ thống tự động",
                    reason: deduction.reason
                  };
                  invLedger.unshift(logRow);
                  
                  return {
                    ...item,
                    quantity: remaining,
                    lastUpdated: new Date().toISOString()
                  };
                }
                return item;
              });
              
              localStorage.setItem("wassup_inventory_items", JSON.stringify(invItems));
              localStorage.setItem("wassup_inventory_ledger", JSON.stringify(invLedger));
              
              // Broadcast custom event so active inventory screens reload automatically
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("wassup-inventory-update", { detail: invItems }));
              }
            }
          }
        } catch (e) {
          console.error("Error in automated inventory deduction:", e);
        }
      }
      if (status === 'rework') {
        wo.reworkCount = Math.min(wo.reworkCount + 1, 2);
      }

      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            const updates: any = { status };
            if (status === 'in_progress') {
              updates.started_at = new Date().toISOString();
            }
            if (status === 'done') {
              updates.completed_at = new Date().toISOString();

              const { data: woData } = await supabase
                .from("work_orders")
                .select("booth_id")
                .eq("id", woId)
                .maybeSingle();
              
              if (woData?.booth_id) {
                await supabase
                  .from("booths")
                  .update({ status: 'idle' })
                  .eq("id", woData.booth_id);
              }
            }

            if (status === 'rework') {
              const { data: woData } = await supabase
                .from("work_orders")
                .select("rework_count")
                .eq("id", woId)
                .maybeSingle();
              const currentRework = woData?.rework_count || 0;
              updates.rework_count = Math.min(currentRework + 1, 2);
            }

            await supabase
              .from("work_orders")
              .update(updates)
              .eq("id", woId);

            await supabase
              .from("work_order_events")
              .insert({
                work_order_id: woId,
                status,
                actor_id: actorId || null,
                channel,
                notes
              });
          } catch (err) {
            console.error("Error in Supabase updateWorkOrderStatus:", err);
          }
        })();
      }

      return true;
    }
    return false;
  },

  validateVoucher: (code: string, customerPhone?: string) => {
    const normalizedCode = code.toUpperCase().trim();
    const voucher = currentState.vouchers.find(v => v.code.toUpperCase() === normalizedCode);
    if (!voucher) return { valid: false, message: 'Mã voucher không tồn tại!' };
    if (voucher.usedAt) return { valid: false, message: 'Voucher này đã được sử dụng!' };
    
    // Check customer phone match if provided
    if (customerPhone && voucher.customerId !== "all" && voucher.customerId !== "system" && voucher.customerId !== "") {
      const cust = currentState.customers.find(c => c.phone === customerPhone);
      if (!cust || cust.id !== voucher.customerId) {
        return { valid: false, message: 'Voucher này dành riêng cho tài khoản khách hàng khác!' };
      }
    }
    
    return { valid: true, voucher };
  },

  addVoucher: (voucherData: Omit<Voucher, 'id' | 'createdAt'>) => {
    const newVoucher: Voucher = {
      ...voucherData,
      id: 'v_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    currentState.vouchers.push(newVoucher);
    saveState();
    return newVoucher;
  },

  updateVoucher: (id: string, updatedData: Partial<Voucher>) => {
    const idx = currentState.vouchers.findIndex(v => v.id === id);
    if (idx !== -1) {
      currentState.vouchers[idx] = {
        ...currentState.vouchers[idx],
        ...updatedData
      };
      saveState();
      return currentState.vouchers[idx];
    }
    return null;
  },

  deleteVoucher: (id: string) => {
    const idx = currentState.vouchers.findIndex(v => v.id === id);
    if (idx !== -1) {
      currentState.vouchers.splice(idx, 1);
      saveState();
      return true;
    }
    return false;
  },

  requestEtaExtension: (woId: string, minutes: number, reason: string) => {
    const wo = currentState.workOrders.find(w => w.id === woId);
    if (wo) {
      wo.etaExtensionRequest = {
        minutes,
        reason,
        status: 'pending'
      };
      saveState();
      return true;
    }
    return false;
  },

  resolveEtaExtension: (woId: string, action: 'approve' | 'reject') => {
    const wo = currentState.workOrders.find(w => w.id === woId);
    if (wo) {
      if (action === 'approve' && wo.etaExtensionRequest) {
        // Automatically add minutes to estimatedDuration
        wo.estimatedDuration = (wo.estimatedDuration || 30) + wo.etaExtensionRequest.minutes;
      }
      // Reset the request so it clears from the active alerts
      wo.etaExtensionRequest = null;
      saveState();
      return true;
    }
    return false;
  },

  updateOrderStatus: (orderId: string, status: 'draft' | 'pending_payment' | 'paid' | 'cancelled' | 'closed', total?: number, discount?: number) => {
    const order = currentState.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (total !== undefined) order.total = total;
      if (discount !== undefined) order.discount = discount;
      saveState();

      if (isRealSupabase && supabase) {
        (async () => {
          try {
            const updates: any = { status };
            if (total !== undefined) updates.total = total;
            if (discount !== undefined) updates.discount = discount;

            await supabase
              .from("orders")
              .update(updates)
              .eq("id", orderId);
          } catch (err) {
            console.error("Error in Supabase updateOrderStatus:", err);
          }
        })();
      }

      return true;
    }
    return false;
  },

  getVoucherRedemptions: () => {
    return currentState.voucherRedemptions || [];
  },

  addVoucherRedemption: (redemption: any) => {
    if (!currentState.voucherRedemptions) {
      currentState.voucherRedemptions = [];
    }
    const newRedemption = {
      ...redemption,
      id: "vr_" + Date.now(),
      redeemedAt: new Date().toISOString()
    };
    currentState.voucherRedemptions.push(newRedemption);
    saveState();
    return newRedemption;
  },

  getCustomerGroups: () => {
    return currentState.customerGroups || [];
  },

  addCustomerGroup: (group: any) => {
    if (!currentState.customerGroups) {
      currentState.customerGroups = [];
    }
    const newGroup = {
      ...group,
      id: "g_" + Date.now(),
      createdAt: new Date().toISOString()
    };
    currentState.customerGroups.push(newGroup);
    saveState();
    return newGroup;
  },

  updateCustomerGroup: (id: string, updatedData: any) => {
    if (!currentState.customerGroups) return null;
    const idx = currentState.customerGroups.findIndex(g => g.id === id);
    if (idx !== -1) {
      currentState.customerGroups[idx] = {
        ...currentState.customerGroups[idx],
        ...updatedData
      };
      saveState();
      return currentState.customerGroups[idx];
    }
    return null;
  },

  deleteCustomerGroup: (id: string) => {
    if (!currentState.customerGroups) return false;
    const idx = currentState.customerGroups.findIndex(g => g.id === id);
    if (idx !== -1) {
      currentState.customerGroups.splice(idx, 1);
      saveState();
      return true;
    }
    return false;
  },

  resetStore: () => {
    currentState = JSON.parse(JSON.stringify(INITIAL_STATE));
    saveState();
  }
};

// ------------------------------------------------------------
// REAL-TIME BROADCAST ENGINE (SIMULATED OR SUPABASE VIEW)
// ------------------------------------------------------------
export const supabaseRealtime = {
  subscribeOrders: (callback: (orders: OrderStatusView[]) => void) => {
    if (!isRealSupabase || !supabase) {
      listeners.add(callback);
      // Initial emission
      callback(getMergedOrderStatusView());
      return {
        unsubscribe: () => {
          listeners.delete(callback);
        }
      };
    }

    // Real Supabase View Implementation
    const fetchAndEmit = async () => {
      try {
        const { data, error } = await supabase
          .from("order_status_view")
          .select("*")
          .order("order_created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching order_status_view, falling back to simulator:", error);
          callback(getMergedOrderStatusView());
          return;
        }

        const mapped: OrderStatusView[] = (data || []).map((row: any) => ({
          id: row.work_order_id || ("mock-wo-" + row.order_id),
          orderId: row.order_id,
          status: row.work_order_status || "queued",
          technicianId: row.technician_id || undefined,
          technicianName: row.technician_name || undefined,
          boothId: row.booth_id || undefined,
          boothName: row.booth_name || undefined,
          reworkCount: row.rework_count || 0,
          estimatedDuration: row.estimated_duration || 30,
          startedAt: row.started_at || undefined,
          completedAt: row.completed_at || undefined,
          createdAt: row.created_at || row.order_created_at,
          customerId: row.customer_id || undefined,
          customerName: row.customer_name || "Khách vãng lai",
          customerPhone: row.customer_phone || undefined,
          licensePlate: row.license_plate,
          vehicleSegment: row.vehicle_segment,
          packageCode: row.package_code,
          total: Number(row.total),
          commerceStatus: row.commerce_status,
          orderCreatedAt: row.order_created_at
        }));

        callback(mapped);
      } catch (err) {
        console.error("Error in fetchAndEmit order_status_view, falling back to simulator:", err);
        callback(getMergedOrderStatusView());
      }
    };

    fetchAndEmit();

    // Subscribe to changes on underlying tables to refresh the view in real-time with a unique channel name
    const channel = supabase
      .channel("order-status-view-sync-" + Math.random().toString(36).slice(2))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchAndEmit();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_orders" },
        () => {
          fetchAndEmit();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff" },
        () => {
          fetchAndEmit();
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  },

  subscribeRevenue: (callback: (stats: any) => void) => {
    if (!isRealSupabase || !supabase) {
      revenueListeners.add(callback);
      // Initial emission
      callback(getRevenueStats());
      return {
        unsubscribe: () => {
          revenueListeners.delete(callback);
        }
      };
    }

    const fetchAndEmit = async () => {
      try {
        const { data: thresholdData, error: thresholdError } = await supabase
          .from("revenue_thresholds")
          .select("daily_target, warning_level")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (thresholdError) {
          console.warn("Threshold fetch error:", thresholdError);
        }

        const target = thresholdData?.daily_target ? Number(thresholdData.daily_target) : 50000000;
        const warning = thresholdData?.warning_level ? Number(thresholdData.warning_level) : 35000000;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("total, status")
          .gte("created_at", startOfToday.toISOString());

        if (ordersError) throw ordersError;

        const { data: woData, error: woError } = await supabase
          .from("work_orders")
          .select("status, rework_count")
          .gte("created_at", startOfToday.toISOString());

        if (woError) throw woError;

        const paidOrdersTotal = (ordersData || [])
          .filter((o: any) => o.status === "paid" || o.status === "closed")
          .reduce((sum: number, o: any) => sum + Number(o.total), 0);

        const baseRevenue = currentState.revenueToday || 18450000;
        const totalRevenue = baseRevenue + paidOrdersTotal;
        const progressPercent = Math.min(Math.round((totalRevenue / target) * 100), 100);

        const completedCount = (woData || []).filter((w: any) => w.status === "done").length;
        const activeCount = (woData || []).filter((w: any) => w.status === "in_progress" || w.status === "quality_check").length;
        const queuedCount = (woData || []).filter((w: any) => w.status === "queued" || w.status === "assigned").length;
        const reworkCount = (woData || []).reduce((sum: number, w: any) => sum + (w.rework_count || 0), 0);

        callback({
          totalRevenue,
          target,
          warning,
          progressPercent,
          targetMet: totalRevenue >= target,
          warningLevelMet: totalRevenue >= warning,
          orderCount: (ordersData || []).length,
          completedCount,
          activeCount,
          queuedCount,
          reworkCount
        });
      } catch (err) {
        console.error("Error fetching revenue stats from Supabase, falling back to simulator:", err);
        callback(getRevenueStats());
      }
    };

    fetchAndEmit();

    const channel = supabase
      .channel("revenue-sync-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAndEmit())
      .on("postgres_changes", { event: "*", schema: "public", table: "work_orders" }, () => fetchAndEmit())
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_thresholds" }, () => fetchAndEmit())
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  },

  subscribeStaff: (callback: (staff: any[]) => void) => {
    if (!isRealSupabase || !supabase) {
      staffListeners.add(callback);
      callback(currentState.staff);
      return {
        unsubscribe: () => {
          staffListeners.delete(callback);
        }
      };
    }

    const fetchAndEmit = async () => {
      try {
        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .order("name", { ascending: true });
        if (error) throw error;
        if (data) {
          callback(data);
        }
      } catch (err) {
        console.error("Error fetching staff from Supabase, falling back to simulator:", err);
        callback(currentState.staff);
      }
    };

    fetchAndEmit();

    const channel = supabase
      .channel("staff-sync-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, () => fetchAndEmit())
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  },

  subscribeVouchers: (callback: (vouchers: Voucher[]) => void) => {
    if (!isRealSupabase || !supabase) {
      voucherListeners.add(callback);
      callback(currentState.vouchers);
      return {
        unsubscribe: () => {
          voucherListeners.delete(callback);
        }
      };
    }

    const fetchAndEmit = async () => {
      try {
        const { data, error } = await supabase
          .from("vouchers")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data) {
          const mapped: Voucher[] = data.map((row: any) => ({
            id: row.id,
            customerId: row.customer_id,
            code: row.code,
            type: row.type,
            value: Number(row.value),
            maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
            minOrderValue: row.min_order_value ? Number(row.min_order_value) : undefined,
            validFrom: row.valid_from,
            validTo: row.valid_to,
            usedAt: row.used_at || undefined,
            orderId: row.order_id || undefined,
            source: row.source,
            createdAt: row.created_at
          }));
          callback(mapped);
        }
      } catch (err) {
        console.error("Error fetching vouchers from Supabase, falling back to simulator:", err);
        callback(currentState.vouchers);
      }
    };

    fetchAndEmit();

    const channel = supabase
      .channel("vouchers-sync-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "vouchers" }, () => fetchAndEmit())
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  },

  subscribeCustomers: (callback: (customers: Customer[]) => void) => {
    if (!isRealSupabase || !supabase) {
      customerListeners.add(callback);
      callback(currentState.customers);
      return {
        unsubscribe: () => {
          customerListeners.delete(callback);
        }
      };
    }

    const fetchAndEmit = async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data) {
          const mapped: Customer[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            licensePlate: row.license_plate,
            licensePlates: row.license_plates || (row.license_plate ? [row.license_plate] : []),
            dob: row.dob || row.date_of_birth,
            address: row.address,
            points: Number(row.points || 0),
            createdAt: row.created_at,
            vehicles: row.vehicles || (row.license_plate ? [{ plate: row.license_plate, vehicleClass: 'sedan' }] : [])
          }));
          callback(mapped);
        }
      } catch (err) {
        console.error("Error fetching customers from Supabase, falling back to simulator:", err);
        callback(currentState.customers);
      }
    };

    fetchAndEmit();

    const channel = supabase
      .channel("customers-sync-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => fetchAndEmit())
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }
};

// Active Car Wash Simulation Loop (progresses car wash automatically based on local storage configurations)
if (typeof window !== 'undefined') {
  let tickCounter = 0;
  setInterval(() => {
    const isAuto = localStorage.getItem('wassup_sim_auto') !== 'false';
    if (!isAuto) return;

    const speedStr = localStorage.getItem('wassup_sim_speed') || '45';
    const speedSec = parseInt(speedStr, 10) || 45;
    
    tickCounter += 15;
    if (tickCounter < speedSec) {
      return; // Wait for configured time
    }
    tickCounter = 0; // Reset counter

    let stateChanged = false;
    currentState.workOrders.forEach(wo => {
      if (wo.status === 'assigned') {
        wo.status = 'in_progress';
        wo.startedAt = new Date().toISOString();
        stateChanged = true;
      } else if (wo.status === 'in_progress') {
        wo.status = 'quality_check';
        stateChanged = true;
      } else if (wo.status === 'quality_check') {
        wo.status = 'done';
        wo.completedAt = new Date().toISOString();
        if (wo.boothId) {
          const b = currentState.booths.find(b => b.id === wo.boothId);
          if (b) b.status = 'idle';
        }
        stateChanged = true;
      }
    });

    if (stateChanged) {
      saveState();
    }
  }, 15000);
}
