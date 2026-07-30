export type VoucherType = 'percent' | 'fixed_amount' | 'free_service';

export interface Voucher {
  id: string;
  customerId: string;
  code: string;
  name?: string;
  type: VoucherType;
  value: number;
  maxDiscount?: number;
  minOrderValue: number;
  validFrom: string;
  validTo: string;
  usedAt?: string;
  orderId?: string;
  source: 'sup_redeem' | 'manual_grant' | 'birthday' | 'compensation' | 'manual' | 'upgrade';
  issuedBy?: string;
  createdAt: string;
  status?: 'active' | 'paused' | 'expired' | 'draft';
  usage_limit_total?: number;
  usage_limit_per_customer?: number;
  target_type?: 'all_customers' | 'group' | 'specific_customers';
  target_group_id?: string;
  target_specific_customers?: string[];
}
