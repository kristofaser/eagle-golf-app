import { createServiceClient } from '@/lib/supabase/server';
import BookingsClient from './BookingsClient';

export default async function BookingsPage() {
  // Utiliser le service client pour contourner les RLS
  const supabase = await createServiceClient();
  
  // Récupérer les données des réservations avec les jointures et validation admin
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      start_time,
      total_amount,
      status,
      admin_validation_status,
      created_at,
      amateur_id,
      pro_id,
      golf_course_id,
      special_requests,
      number_of_players,
      admin_booking_validations (
        status,
        admin_notes,
        validated_at
      )
    `)
    .order('created_at', { ascending: false });

  // Récupérer les profils des amateurs et pros avec contact
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone');

  // Récupérer les parcours de golf
  const { data: courses } = await supabase
    .from('golf_parcours')
    .select('id, name, city, postal_code, department, phone, email');

  if (bookingsError) {
    console.error('Erreur lors de la récupération des réservations:', bookingsError);
  }

  // Formater les données pour l'affichage et la sidebar
  const bookings = bookingsData?.map(booking => {
    const amateur = profiles?.find(p => p.id === booking.amateur_id);
    const pro = profiles?.find(p => p.id === booking.pro_id);
    const course = courses?.find(c => c.id === booking.golf_course_id);

    return {
      // Données pour l'affichage liste
      id: booking.id,
      golfer: `${amateur?.first_name || ''} ${amateur?.last_name || ''}`.trim() || 'Sans nom',
      pro: `${pro?.first_name || ''} ${pro?.last_name || ''}`.trim() || 'Sans nom',
      course: course?.name || 'Parcours inconnu',
      date: booking.booking_date,
      time: booking.start_time?.substring(0, 5), // Format HH:MM
      status: booking.status,
      price: `${(booking.total_amount / 100).toFixed(0)}€`, // Montant en centimes -> euros
      createdAt: booking.created_at,
      
      // Données complètes pour la sidebar
      fullData: {
        id: booking.id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        total_amount: booking.total_amount,
        status: booking.status,
        admin_validation_status: booking.admin_validation_status,
        amateur_id: booking.amateur_id,
        pro_id: booking.pro_id,
        golf_course_id: booking.golf_course_id,
        special_requests: booking.special_requests,
        number_of_players: booking.number_of_players,
        amateur: amateur ? {
          first_name: amateur.first_name,
          last_name: amateur.last_name,
          email: amateur.email,
          phone: amateur.phone
        } : undefined,
        pro: pro ? {
          first_name: pro.first_name,
          last_name: pro.last_name,
          email: pro.email,
          phone: pro.phone
        } : undefined,
        golf_course: course ? {
          name: course.name,
          city: course.city,
          postal_code: course.postal_code,
          department: course.department,
          phone: course.phone,
          email: course.email
        } : undefined
      }
    };
  }) || [];

  // Calculer les statistiques dynamiques
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pendingValidation: bookings.filter(b => 
      b.status === 'pending' || 
      (b as any).admin_validation_status === 'pending'
    ).length
  };

  return <BookingsClient initialBookings={bookings} stats={stats} />;
}