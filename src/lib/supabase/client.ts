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

const rawSupabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Read-only Proxy wrapper ensuring ZERO mutations are ever written to Supabase
function createReadOnlyClient(client: any) {
  if (!client) return null;

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          const queryBuilder = target.from(table);
          return new Proxy(queryBuilder, {
            get(tableTarget, tableProp, tableReceiver) {
              if (
                tableProp === "insert" ||
                tableProp === "upsert" ||
                tableProp === "update" ||
                tableProp === "delete"
              ) {
                console.info(
                  `[Supabase Read-Only Guard] Blocked ${String(tableProp)} on table "${table}". Only reading data is permitted.`
                );
                // Return a chainable dummy builder that resolves safely with error: null
                const dummyBuilder: any = {
                  select: () => dummyBuilder,
                  eq: () => dummyBuilder,
                  in: () => dummyBuilder,
                  order: () => dummyBuilder,
                  limit: () => dummyBuilder,
                  single: async () => ({ data: { id: `ro_${Date.now()}` }, error: null }),
                  maybeSingle: async () => ({ data: null, error: null }),
                  then: (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve),
                };
                return () => dummyBuilder;
              }
              return Reflect.get(tableTarget, tableProp, tableReceiver);
            }
          });
        };
      }
      if (prop === "rpc") {
        return (fn: string) => {
          console.info(
            `[Supabase Read-Only Guard] Intercepted RPC "${fn}". Preventing remote DB changes.`
          );
          return Promise.resolve({ data: { success: true, mode: "read_only_simulated" }, error: null });
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

export const supabase = createReadOnlyClient(rawSupabase);

if (!isRealSupabase) {
  console.warn("VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY not found. WASSUP Station OS running on high-fidelity Realtime State Simulator.");
}

// ------------------------------------------------------------
// HIGH FIDELITY SIMULATION STORE
// ------------------------------------------------------------
export interface CustomerGroup {
  id: string;
  name: string;
  type?: "static" | "dynamic";
  mode?: "static" | "dynamic";
  customer_ids?: string[];
  customerIds?: string[];
  condition?: {
    spent?: string;
    visits?: string;
    lastVisit?: string;
    dobMonth?: string;
    [key: string]: any;
  };
  filterCriteria?: {
    spent?: string;
    visits?: string;
    lastVisit?: string;
    dobMonth?: string;
    [key: string]: any;
  };
  created_at?: string;
  createdAt?: string;
}

export interface VoucherRedemption {
  id: string;
  voucherId: string;
  customerId: string;
  orderId: string;
  discountApplied?: number;
  amountApplied?: number;
  redeemedAt: string;
}

export interface SimState {
  orders: Order[];
  workOrders: any[];
  customers: Customer[];
  staff: any[];
  booths: Booth[];
  thresholds: { daily_target: number; warning_level: number };
  vouchers: Voucher[];
  revenueToday: number;
  voucherRedemptions?: VoucherRedemption[];
  customerGroups?: CustomerGroup[];
}

// Initial Mock Seed Data
const INITIAL_STATE: SimState = {
  customers: [
    {
      id: 'c1',
      name: 'Trần Minh Quân',
      phone: '0901234567',
      pin: '123456',
      licensePlate: '30A-123.45',
      licensePlates: ['30A-123.45', '29A-555.55'],
      dob: '1990-05-15',
      address: '12 Cầu Giấy, Hà Nội',
      points: 280,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      vehicles: [
        { plate: '30A-123.45', vehicleClass: 'suv', car_brand: 'Mazda', car_model: 'CX-5' },
        { plate: '29A-555.55', vehicleClass: 'sedan', car_brand: 'Toyota', car_model: 'Camry' }
      ]
    },
    {
      id: 'c2',
      name: 'Nguyễn Thị Bích',
      phone: '0911223344',
      pin: '123456',
      licensePlate: '51G-999.99',
      licensePlates: ['51G-999.99', '51K-334.88'],
      dob: '1995-10-20',
      address: '456 Lê Lợi, Quận 1, TP. HCM',
      points: 140,
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      vehicles: [
        { plate: '51G-999.99', vehicleClass: 'sedan', car_brand: 'Mercedes-Benz', car_model: 'C300' },
        { plate: '51K-334.88', vehicleClass: 'suv', car_brand: 'Porsche', car_model: 'Macan' }
      ]
    },
    {
      id: 'c3',
      name: 'Lê Hoàng Long',
      phone: '0988776655',
      pin: '123456',
      licensePlate: '29H-888.88',
      licensePlates: ['29H-888.88', '30F-999.88', '30L-111.22'],
      dob: '1988-12-01',
      address: '789 Nguyễn Trãi, Thanh Xuân, Hà Nội',
      points: 450,
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      vehicles: [
        { plate: '29H-888.88', vehicleClass: 'truck', car_brand: 'Ford', car_model: 'Ranger Raptor' },
        { plate: '30F-999.88', vehicleClass: 'suv', car_brand: 'Hyundai', car_model: 'Santa Fe' },
        { plate: '30L-111.22', vehicleClass: 'sedan', car_brand: 'VinFast', car_model: 'VF 8' }
      ]
    },
    {
      id: 'c4',
      name: 'Phạm Đức Anh',
      phone: '0934567890',
      pin: '123456',
      licensePlate: '30K-688.68',
      licensePlates: ['30K-688.68', '30E-246.80'],
      dob: '1985-03-22',
      address: 'Biệt thự 08, Vinhomes Riverside, Long Biên, Hà Nội',
      points: 520,
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      vehicles: [
        { plate: '30K-688.68', vehicleClass: 'suv', car_brand: 'VinFast', car_model: 'VF 9' },
        { plate: '30E-246.80', vehicleClass: 'sedan', car_brand: 'Honda', car_model: 'Civic' }
      ]
    },
    {
      id: 'c5',
      name: 'Vũ Hoàng Yến',
      phone: '0977112233',
      pin: '123456',
      licensePlate: '29B-135.79',
      licensePlates: ['29B-135.79', '30H-868.68'],
      dob: '1993-08-14',
      address: '88 Phố Huế, Hai Bà Trưng, Hà Nội',
      points: 160,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      vehicles: [
        { plate: '29B-135.79', vehicleClass: 'sedan', car_brand: 'Toyota', car_model: 'Vios' },
        { plate: '30H-868.68', vehicleClass: 'suv', car_brand: 'Kia', car_model: 'Seltos' }
      ]
    },
    {
      id: 'c6',
      name: 'Đặng Quốc Cường',
      phone: '0966889900',
      pin: '123456',
      licensePlate: '51H-777.77',
      licensePlates: ['51H-777.77', '51L-234.56'],
      dob: '1982-11-05',
      address: '120 Nguyễn Thị Minh Khai, Quận 3, TP. HCM',
      points: 380,
      createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
      vehicles: [
        { plate: '51H-777.77', vehicleClass: 'suv', car_brand: 'BMW', car_model: 'X5' },
        { plate: '51L-234.56', vehicleClass: 'sedan', car_brand: 'Lexus', car_model: 'ES 250' }
      ]
    },
    {
      id: 'c7',
      name: 'Bùi Mai Phương',
      phone: '0945671234',
      pin: '123456',
      licensePlate: '30G-567.89',
      licensePlates: ['30G-567.89'],
      dob: '1998-02-18',
      address: '15 Trung Hòa, Cầu Giấy, Hà Nội',
      points: 75,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      vehicles: [
        { plate: '30G-567.89', vehicleClass: 'sedan', car_brand: 'Mazda', car_model: 'Mazda 3' }
      ]
    },
    {
      id: 'c8',
      name: 'Hoàng Trọng Nghĩa',
      phone: '0918998877',
      pin: '123456',
      licensePlate: '29D-444.44',
      licensePlates: ['29D-444.44', '30A-987.65'],
      dob: '1987-07-30',
      address: '68 Lạc Long Quân, Tây Hồ, Hà Nội',
      points: 230,
      createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
      vehicles: [
        { plate: '29D-444.44', vehicleClass: 'truck', car_brand: 'Mitsubishi', car_model: 'Triton' },
        { plate: '30A-987.65', vehicleClass: 'suv', car_brand: 'Toyota', car_model: 'Fortuner' }
      ]
    }
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
    { id: 'o1', customerId: 'c1', customerName: 'Trần Minh Quân', customerPhone: '0901234567', licensePlate: '30A-123.45', vehicleSegment: 'suv', packageCode: 'W2', subtotal: 250000, discount: 0, total: 250000, status: 'paid', boothId: 'b1', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'o2', customerId: 'c2', customerName: 'Nguyễn Thị Bích', customerPhone: '0911223344', licensePlate: '51G-999.99', vehicleSegment: 'sedan', packageCode: 'W1', subtotal: 150000, discount: 0, total: 150000, status: 'paid', boothId: 'b2', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'o3', customerId: 'c3', customerName: 'Lê Hoàng Long', customerPhone: '0988776655', licensePlate: '29H-888.88', vehicleSegment: 'truck', packageCode: 'W3', subtotal: 450000, discount: 50000, total: 400000, status: 'paid', boothId: 'b3', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'o4', customerId: 'c4', customerName: 'Phạm Đức Anh', customerPhone: '0934567890', licensePlate: '30K-688.68', vehicleSegment: 'suv', packageCode: 'W3', subtotal: 550000, discount: 0, total: 550000, status: 'paid', boothId: 'b1', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'o5', customerId: 'c4', customerName: 'Phạm Đức Anh', customerPhone: '0934567890', licensePlate: '30E-246.80', vehicleSegment: 'sedan', packageCode: 'W2', subtotal: 280000, discount: 30000, total: 250000, status: 'paid', boothId: 'b2', createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: 'o6', customerId: 'c5', customerName: 'Vũ Hoàng Yến', customerPhone: '0977112233', licensePlate: '29B-135.79', vehicleSegment: 'sedan', packageCode: 'W1', subtotal: 150000, discount: 0, total: 150000, status: 'paid', boothId: 'b1', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'o7', customerId: 'c6', customerName: 'Đặng Quốc Cường', customerPhone: '0966889900', licensePlate: '51H-777.77', vehicleSegment: 'suv', packageCode: 'W3', subtotal: 650000, discount: 50000, total: 600000, status: 'paid', boothId: 'b3', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
    { id: 'o8', customerId: 'c8', customerName: 'Hoàng Trọng Nghĩa', customerPhone: '0918998877', licensePlate: '29D-444.44', vehicleSegment: 'truck', packageCode: 'W2', subtotal: 320000, discount: 0, total: 320000, status: 'paid', boothId: 'b2', createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
  ],
  workOrders: [
    { id: 'wo1', orderId: 'o1', status: 'in_progress', technicianId: 's3', boothId: 'b1', reworkCount: 0, estimatedDuration: 30, startedAt: new Date(Date.now() - 20 * 60000).toISOString(), createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 'wo2', orderId: 'o2', status: 'assigned', technicianId: 's4', boothId: 'b2', reworkCount: 0, estimatedDuration: 25, startedAt: null, createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'wo3', orderId: 'o3', status: 'queued', technicianId: null, boothId: null, reworkCount: 0, estimatedDuration: 40, startedAt: null, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  ],
  vouchers: [
    { id: 'v1', customerId: 'c1', code: 'WASSUPNEW', type: 'percent', value: 10, maxDiscount: 50000, minOrderValue: 150000, validFrom: new Date(Date.now() - 86400000).toISOString(), validTo: new Date(Date.now() + 864000000).toISOString(), source: 'manual_grant', createdAt: new Date().toISOString() },
    { id: 'v2', customerId: 'c2', code: 'FIX50', type: 'fixed_amount', value: 50000, minOrderValue: 100000, validFrom: new Date(Date.now() - 86400000).toISOString(), validTo: new Date(Date.now() + 864000000).toISOString(), source: 'sup_redeem', createdAt: new Date().toISOString() },
    { id: 'v3', customerId: 'c4', code: 'VIP100', type: 'fixed_amount', value: 100000, minOrderValue: 300000, validFrom: new Date(Date.now() - 86400000).toISOString(), validTo: new Date(Date.now() + 864000000).toISOString(), source: 'manual_grant', createdAt: new Date().toISOString() },
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

        // Guarantee collection arrays exist
        if (!Array.isArray(parsed.customers) || parsed.customers.length === 0) {
          parsed.customers = [...INITIAL_STATE.customers];
          localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
        } else {
          let customerListChanged = false;
          const existingCustIds = new Set(parsed.customers.map((c: any) => c.id));
          
          INITIAL_STATE.customers.forEach((initCust) => {
            if (!existingCustIds.has(initCust.id)) {
              parsed.customers.push(initCust);
              customerListChanged = true;
            } else {
              // Ensure vehicles with brands/models are updated if empty
              const foundCust = parsed.customers.find((c: any) => c.id === initCust.id);
              if (foundCust) {
                if (!foundCust.vehicles || foundCust.vehicles.length === 0 || !foundCust.vehicles[0]?.car_brand) {
                  foundCust.vehicles = initCust.vehicles;
                  foundCust.licensePlates = initCust.licensePlates;
                  foundCust.licensePlate = initCust.licensePlate;
                  customerListChanged = true;
                }
              }
            }
          });

          // Normalize all customers in store
          parsed.customers.forEach((c: any) => {
            if (!c.vehicles || !Array.isArray(c.vehicles) || c.vehicles.length === 0) {
              const plates = Array.isArray(c.licensePlates) && c.licensePlates.length > 0 
                ? c.licensePlates 
                : (c.licensePlate ? [c.licensePlate] : []);
              c.vehicles = plates.map((p: string) => ({
                plate: p,
                vehicleClass: "sedan"
              }));
              customerListChanged = true;
            }
            if (!Array.isArray(c.licensePlates)) {
              c.licensePlates = c.vehicles.map((v: any) => v.plate).filter(Boolean);
              customerListChanged = true;
            }
            if (!c.licensePlate && c.licensePlates.length > 0) {
              c.licensePlate = c.licensePlates[0];
              customerListChanged = true;
            }
            if (typeof c.points !== "number") {
              c.points = Number(c.points) || 0;
              customerListChanged = true;
            }
          });

          // Auto-merge sample orders if missing
          if (!Array.isArray(parsed.orders) || parsed.orders.length === 0) {
            parsed.orders = [...INITIAL_STATE.orders];
            customerListChanged = true;
          } else {
            const existingOrderIds = new Set(parsed.orders.map((o: any) => o.id));
            INITIAL_STATE.orders.forEach((initOrder) => {
              if (!existingOrderIds.has(initOrder.id)) {
                parsed.orders.push(initOrder);
                customerListChanged = true;
              }
            });
          }

          // Auto-merge sample vouchers if missing
          if (!Array.isArray(parsed.vouchers) || parsed.vouchers.length === 0) {
            parsed.vouchers = [...INITIAL_STATE.vouchers];
            customerListChanged = true;
          } else {
            const existingVoucherIds = new Set(parsed.vouchers.map((v: any) => v.id));
            INITIAL_STATE.vouchers.forEach((initVoucher) => {
              if (!existingVoucherIds.has(initVoucher.id)) {
                parsed.vouchers.push(initVoucher);
                customerListChanged = true;
              }
            });
          }

          if (!Array.isArray(parsed.customerGroups)) {
            parsed.customerGroups = [...INITIAL_STATE.customerGroups];
            customerListChanged = true;
          }

          if (!Array.isArray(parsed.voucherRedemptions)) {
            parsed.voucherRedemptions = [...INITIAL_STATE.voucherRedemptions];
            customerListChanged = true;
          }

          if (customerListChanged) {
            localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
          }
        }

        // Deduplicate all arrays by ID to prevent duplicate React keys
        let needsDedupeSave = false;
        const dedupeById = <T extends { id?: string }>(arr: T[] | undefined): T[] => {
          if (!Array.isArray(arr)) return [];
          const seen = new Set<string>();
          return arr.filter((item) => {
            if (!item || !item.id) return false;
            if (seen.has(item.id)) {
              needsDedupeSave = true;
              return false;
            }
            seen.add(item.id);
            return true;
          });
        };

        if (Array.isArray(parsed.customers)) {
          parsed.customers = dedupeById(parsed.customers);
        }
        if (Array.isArray(parsed.orders)) {
          parsed.orders = dedupeById(parsed.orders);
        }
        if (Array.isArray(parsed.workOrders)) {
          parsed.workOrders = dedupeById(parsed.workOrders);
        }
        if (Array.isArray(parsed.vouchers)) {
          parsed.vouchers = dedupeById(parsed.vouchers);
        }
        if (Array.isArray(parsed.booths)) {
          parsed.booths = dedupeById(parsed.booths);
        }
        if (Array.isArray(parsed.customerGroups)) {
          parsed.customerGroups = dedupeById(parsed.customerGroups);
        }
        if (Array.isArray(parsed.staff)) {
          parsed.staff = dedupeById(parsed.staff);
        }

        if (needsDedupeSave) {
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

// Listeners Registry
const listeners = new Set<(orders: OrderStatusView[]) => void>();
const revenueListeners = new Set<(stats: any) => void>();
const staffListeners = new Set<(staff: any[]) => void>();
const voucherListeners = new Set<(vouchers: Voucher[]) => void>();
const customerListeners = new Set<(customers: Customer[]) => void>();
const customerGroupListeners = new Set<(groups: CustomerGroup[]) => void>();

const saveState = () => {
  localStorage.setItem(STORE_KEY, JSON.stringify(currentState));
  // Broadcast update to in-memory listeners
  listeners.forEach(cb => cb(getMergedOrderStatusView()));
  revenueListeners.forEach(cb => cb(getRevenueStats()));
  staffListeners.forEach(cb => cb(currentState.staff));
  voucherListeners.forEach(cb => cb(currentState.vouchers));
  customerListeners.forEach(cb => cb(currentState.customers));
  customerGroupListeners.forEach(cb => cb(currentState.customerGroups || []));

  // Global window event broadcasts for seamless instant UI reactivity without page refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wassup-store-update', { detail: currentState }));
    window.dispatchEvent(new CustomEvent('wassup-crm-update', { detail: currentState }));
  }
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
      customerGroupListeners.forEach(cb => cb(currentState.customerGroups || []));

      window.dispatchEvent(new CustomEvent('wassup-store-update', { detail: currentState }));
      window.dispatchEvent(new CustomEvent('wassup-crm-update', { detail: currentState }));
    }
  });
}

export function getMergedOrderStatusView(): OrderStatusView[] {
  const seenWoIds = new Set<string>();
  return currentState.orders.map((o, idx) => {
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

    let uniqueId = wo.id;
    if (seenWoIds.has(uniqueId)) {
      uniqueId = `${wo.id}_${o.id}_${idx}`;
    }
    seenWoIds.add(uniqueId);

    return {
      id: uniqueId,
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
  getState: () => currentState,
  getStaff: () => currentState.staff,
  getBooths: () => currentState.booths,
  getCustomers: () => currentState.customers,
  getVouchers: () => currentState.vouchers,
  getOrders: () => currentState.orders,
  getThresholds: () => currentState.thresholds,
  
  addCustomer: (data: any) => {
    const plates = data.licensePlates || (data.licensePlate ? [data.licensePlate] : []);
    const vehiclesList = data.vehicles || plates.map((p: string) => ({ plate: p, vehicleClass: 'sedan' as const }));
    const newCust: Customer = {
      id: data.id || ('c_' + Date.now()),
      name: data.name || '',
      phone: data.phone || '',
      pin: data.pin || "123456",
      licensePlate: data.licensePlate || (plates[0] || ""),
      licensePlates: plates,
      dob: data.dob || "",
      address: data.address || "",
      points: data.points || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      vehicles: vehiclesList
    };
    currentState.customers.push(newCust);
    saveState();
    return newCust;
  },

  updateCustomer: (customerOrId: any, data?: any) => {
    const id = typeof customerOrId === 'string' ? customerOrId : customerOrId?.id;
    const patch = typeof customerOrId === 'object' && !data ? customerOrId : (data || {});
    const cust = currentState.customers.find(c => c.id === id);
    if (cust) {
      if (patch.name !== undefined) cust.name = patch.name;
      if (patch.phone !== undefined) cust.phone = patch.phone;
      if (patch.licensePlate !== undefined) cust.licensePlate = patch.licensePlate;
      if (patch.licensePlates !== undefined) cust.licensePlates = patch.licensePlates;
      if (patch.dob !== undefined) cust.dob = patch.dob;
      if (patch.address !== undefined) cust.address = patch.address;
      if (patch.points !== undefined) cust.points = patch.points;
      if (patch.vehicles !== undefined) cust.vehicles = patch.vehicles;
      saveState();
      return cust;
    }
    return null;
  },

  deleteCustomer: (id: string) => {
    const idx = currentState.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      currentState.customers.splice(idx, 1);
      // Clean up customer from customerGroups
      if (currentState.customerGroups) {
        currentState.customerGroups.forEach(g => {
          if (g.customer_ids) {
            g.customer_ids = g.customer_ids.filter(cid => cid !== id);
          }
          if (g.customerIds) {
            g.customerIds = g.customerIds.filter(cid => cid !== id);
          }
        });
      }
      saveState();
      return true;
    }
    return false;
  },

  updateThresholds: (daily_target: number, warning_level: number) => {
    currentState.thresholds = { daily_target, warning_level };
    saveState();
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
      return staffMember;
    }
    return null;
  },

  deleteStaff: (id: string) => {
    const idx = currentState.staff.findIndex(s => s.id === id);
    if (idx !== -1) {
      currentState.staff.splice(idx, 1);
      saveState();
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
    paymentMethod?: string;
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

  updateVoucher: (voucherOrId: any, updatedData?: Partial<Voucher>) => {
    const id = typeof voucherOrId === 'string' ? voucherOrId : voucherOrId?.id;
    const patch = typeof voucherOrId === 'object' && !updatedData ? voucherOrId : (updatedData || {});
    const idx = currentState.vouchers.findIndex(v => v.id === id);
    if (idx !== -1) {
      currentState.vouchers[idx] = {
        ...currentState.vouchers[idx],
        ...patch
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

  updateCustomerGroup: (groupOrId: any, updatedData?: any) => {
    if (!currentState.customerGroups) return null;
    const id = typeof groupOrId === 'string' ? groupOrId : groupOrId?.id;
    const patch = typeof groupOrId === 'object' && !updatedData ? groupOrId : (updatedData || {});
    const idx = currentState.customerGroups.findIndex(g => g.id === id);
    if (idx !== -1) {
      currentState.customerGroups[idx] = {
        ...currentState.customerGroups[idx],
        ...patch
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
          console.warn("Notice fetching order_status_view, falling back to simulator:", error);
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
        console.warn("Notice in fetchAndEmit order_status_view, falling back to simulator:", err);
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
        console.warn("Notice fetching revenue stats from Supabase, falling back to simulator:", err);
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
        console.warn("Notice fetching staff from Supabase, falling back to simulator:", err);
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
        console.warn("Notice fetching vouchers from Supabase, falling back to simulator:", err);
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
        if (data && data.length > 0) {
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
          currentState.customers = mapped;
          callback(mapped);
        } else {
          callback(currentState.customers && currentState.customers.length > 0 ? currentState.customers : INITIAL_STATE.customers);
        }
      } catch (err) {
        console.warn("Notice fetching customers from Supabase, falling back to simulator:", err);
        callback(currentState.customers && currentState.customers.length > 0 ? currentState.customers : INITIAL_STATE.customers);
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
  },

  subscribeCustomerGroups: (callback: (groups: CustomerGroup[]) => void) => {
    customerGroupListeners.add(callback);
    callback(currentState.customerGroups || []);
    return {
      unsubscribe: () => {
        customerGroupListeners.delete(callback);
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
