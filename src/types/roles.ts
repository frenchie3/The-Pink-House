export type UserRole = "admin" | "staff" | "seller";

export interface UserWithRole {
  id: string;
  email?: string;
  name?: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

export interface Cubby {
  id: string;
  cubby_number: string;
  location?: string;
  status: "available" | "occupied" | "maintenance";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CubbyRental {
  id: string;
  cubby_id: string;
  seller_id: string;
  start_date: string;
  end_date: string;
  rental_fee: number;
  status: "active" | "expired" | "cancelled";
  payment_status: "paid" | "pending" | "overdue";
  created_at: string;
  updated_at: string;
  cubby?: Cubby;
}

export interface SellerPayout {
  id: string;
  seller_id: string;
  amount: number;
  status: "pending" | "approved" | "completed" | "rejected";
  payout_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SellerEarning {
  id: string;
  seller_id: string;
  sale_item_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  payout_id?: string;
  created_at: string;
  sale_item?: {
    inventory_item?: {
      name: string;
      sku: string;
    };
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type:
    | "info"
    | "warning"
    | "success"
    | "error"
    | "rental_expiry"
    | "payout_status";
  is_read: boolean;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRates {
  self_listed: number;
  staff_listed: number;
}

export interface CubbyRentalFees {
  weekly: number;
  monthly: number;
  quarterly: number;
}

export interface NotificationSettings {
  rental_expiry_days: number;
  payout_processing_days: number;
}
