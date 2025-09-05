import { createServiceClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import { getProRequestsStats } from '../pro-requests/actions';
import type { DashboardStats } from '@/types';

export default async function DashboardPage() {
  const supabase = await createServiceClient();
  
  try {
    // Récupérer les statistiques générales
    const [
      { data: usersCount },
      { data: bookingsCount }, 
      { data: prosCount },
      { data: activeBookingsCount },
      proRequestsStatsResult
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('pro_profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
      getProRequestsStats()
    ]);
    
    const proRequestsStats = proRequestsStatsResult.data || { pending: 0, approved: 0, rejected: 0, total: 0 };
    
    // Récupérer les réservations récentes avec les détails
    const { data: recentBookingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_date,
        amateur:profiles!amateur_id(first_name, last_name),
        pro:profiles!pro_id(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
      
    const stats: DashboardStats = {
      totalUsers: usersCount?.length || 0,
      totalBookings: bookingsCount?.length || 0,
      totalRevenue: 12450, // TODO: Calculer vraiment
      totalPros: prosCount?.length || 0,
      activeBookings: activeBookingsCount?.length || 0,
      pendingValidations: 5, // TODO: Récupérer vraiment depuis booking validations
      pendingProRequests: proRequestsStats.pending,
      userGrowth: 12.5, // TODO: Calculer vraiment
      revenueGrowth: 23.1 // TODO: Calculer vraiment
    };
    
    const recentBookings = recentBookingsData?.map((booking: any, index: number) => ({
      id: index + 1,
      user: `${booking.amateur?.first_name || ''} ${booking.amateur?.last_name || ''}`.trim() || 'Utilisateur inconnu',
      pro: `${booking.pro?.first_name || ''} ${booking.pro?.last_name || ''}`.trim() || 'Pro inconnu',
      date: new Date(booking.booking_date).toLocaleDateString('fr-FR'),
      status: booking.status
    })) || [];
    
    return (
      <DashboardClient 
        stats={stats}
        recentBookings={recentBookings}
      />
    );
    
  } catch (error) {
    console.error('Erreur dashboard:', error);
    
    // Fallback avec des données par défaut
    const fallbackStats: DashboardStats = {
      totalUsers: 0,
      totalBookings: 0,
      totalRevenue: 0,
      totalPros: 0,
      activeBookings: 0,
      pendingValidations: 0,
      pendingProRequests: 0,
      userGrowth: 0,
      revenueGrowth: 0
    };
    
    return (
      <DashboardClient 
        stats={fallbackStats}
        recentBookings={[]}
      />
    );
  }
}

