export type WoStatus = 'queued' | 'assigned' | 'in_progress' | 'quality_check' | 'rework' | 'done';

export interface EtaExtensionRequest {
  minutes: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface WorkOrder {
  id: string;
  orderId: string;
  status: WoStatus;
  technicianId?: string;
  technicianName?: string;
  boothId?: string;
  boothName?: string;
  reworkCount: number;
  estimatedDuration: number; // minutes
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  etaExtensionRequest?: EtaExtensionRequest | null;
  lastChannel?: 'web' | 'telegram' | 'system';
  notes?: string;
}

export interface WorkOrderEvent {
  id: string;
  workOrderId: string;
  status: WoStatus;
  actorId?: string;
  actorName?: string;
  channel: 'web' | 'telegram' | 'system';
  notes?: string;
  createdAt: string;
}

export interface OrderStatusView extends WorkOrder {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  licensePlate: string;
  vehicleSegment: 'sedan' | 'suv' | 'truck';
  packageCode: string;
  total: number;
  commerceStatus: 'draft' | 'pending_payment' | 'paid' | 'cancelled' | 'closed';
  orderCreatedAt: string;
}
