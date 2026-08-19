export type OrderCommerceStatus = 'draft' | 'pending_payment' | 'paid' | 'cancelled' | 'closed';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  pin?: string;             // 4-6 digit PIN
  licensePlate?: string;
  licensePlates?: string[]; // Multiple vehicles support
  dob?: string;             // Date of birth
  address?: string;         // Address
  points: number;
  createdAt: string;
  vehicles?: { plate: string; vehicleClass: 'sedan' | 'suv' | 'truck'; car_brand?: string; car_model?: string }[];
}

export interface Booth {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'maintenance';
  createdAt: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  type: 'package' | 'addon';
  price: number;
  description?: string;
  createdAt: string;
  label?: string;
  colorType?: 'normal' | 'primary' | 'gold' | 'custom';
  colorBg?: string;
  textColor?: string;
  thumbnail?: string;
  tags?: string[];
  duration?: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  licensePlate: string;
  vehicleSegment: 'sedan' | 'suv' | 'truck';
  packageCode: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  status: OrderCommerceStatus;
  boothId?: string;
  createdAt: string;
}
