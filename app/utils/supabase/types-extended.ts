// Types supplémentaires pour les nouvelles tables
// À fusionner avec types.ts après régénération

export interface ProPricing {
  id: string;
  pro_id: string;
  holes: 9 | 18;
  players_count: 1 | 2 | 3;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface ProMembership {
  id: string;
  pro_id: string;
  start_date: string;
  end_date: string;
  amount: number;
  status: 'active' | 'expired' | 'pending_payment';
  stripe_subscription_id?: string | null;
  created_at: string;
}

export interface AdminBookingValidation {
  id: string;
  booking_id: string;
  admin_id?: string | null;
  status: 'pending' | 'checking_availability' | 'confirmed' | 'alternative_proposed' | 'rejected';
  alternative_date?: string | null;
  alternative_time?: string | null;
  admin_notes?: string | null;
  created_at: string;
  validated_at?: string | null;
}

export interface CommissionSetting {
  id: string;
  percentage: number;
  effective_date: string;
  created_by?: string | null;
  created_at: string;
}

export interface CancellationPolicy {
  id: string;
  booking_id: string;
  cancelled_by: string;
  cancellation_date: string;
  hours_before_start: number;
  refund_percentage: number;
  refund_amount?: number | null;
  reason?: string | null;
  force_majeure: boolean;
  created_at: string;
}

// Extensions pour les tables modifiées
export interface BookingExtended {
  holes?: 9 | 18 | null;
  admin_validation_status?:
    | 'pending'
    | 'checking'
    | 'confirmed'
    | 'alternative_proposed'
    | 'rejected'
    | null;
  commission_percentage?: number | null;
  commission_amount?: number | null;
}

export interface ProAvailabilityExtended {
  period?: 'morning' | 'afternoon' | 'full_day' | null;
  is_available?: boolean | null;
}

export interface ProProfileExtended {
  is_globally_available?: boolean | null;
  unavailable_reason?: string | null;
}
