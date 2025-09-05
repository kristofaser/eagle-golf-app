import { Tables } from './supabase';

// Re-export des types de base
export type Profile = Tables<'profiles'>;
export type ProProfile = Tables<'pro_profiles'>;
export type AmateurProfile = Tables<'amateur_profiles'>;
export type Booking = Tables<'bookings'>;
export type GolfCourse = Tables<'golf_courses'>;
export type Payment = Tables<'payments'>;
export type Review = Tables<'reviews'>;
export type ProAvailability = Tables<'pro_availabilities'>;
export type ProValidationRequest = Tables<'pro_validation_requests'>;

// Types étendus
export type FullProfile = Profile & {
  amateur_profiles?: AmateurProfile | null;
  pro_profiles?: ProProfile | null;
  email?: string | null;
};

export type BookingWithDetails = Booking & {
  profiles?: Profile;
  pro_profiles?: ProProfile;
  golf_courses?: GolfCourse;
  amateur?: Profile;
};

// Types pour l'admin
export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'analyst';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: string;
}

// Types pour les filtres
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

// Types pour les statistiques
export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalPros: number;
  activeBookings: number;
  pendingValidations: number;
  pendingProRequests: number;
  userGrowth: number; // Pourcentage
  revenueGrowth: number; // Pourcentage
}

// Types pour les demandes de validation pro
export type ProRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ProValidationRequestWithDetails extends ProValidationRequest {
  user_profile: {
    first_name: string;
    last_name: string;
    email: string;
    city?: string;
    avatar_url?: string;
  };
  admin_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ProRequestFilters {
  status: ProRequestStatus | 'all';
  dateRange?: DateRange;
  search?: string;
}