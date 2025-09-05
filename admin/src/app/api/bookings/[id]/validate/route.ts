import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { golfApiService } from '@/lib/golf-api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔥 API Validation appelée:', { bookingId: params.id });
  
  try {
    const body = await request.json();
    const { action, admin_notes, alternative_date, alternative_time } = body;
    const bookingId = params.id;
    
    console.log('📥 Données reçues:', { bookingId, action, admin_notes, body });

    // Authentification admin réelle avec Supabase Auth
    console.log('🔐 Vérification authentification admin...');
    
    const supabase = await createServiceClient();
    
    // Créer un client avec les cookies pour récupérer la session
    const { createClient } = await import('@/lib/supabase/server');
    const sessionClient = await createClient();
    
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erreur authentification:', authError);
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    console.log('👤 Utilisateur authentifié:', { user_id: user.id, email: user.email });
    
    // Récupérer le profil admin correspondant à cet utilisateur
    const { data: adminProfile, error: adminError } = await supabase
      .from('admin_profiles')
      .select(`
        id,
        role,
        permissions,
        first_name,
        last_name,
        email,
        is_active
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (adminError || !adminProfile) {
      console.error('❌ Profil admin non trouvé:', adminError);
      return NextResponse.json({ error: 'Accès non autorisé - profil admin introuvable' }, { status: 403 });
    }
    
    console.log('✅ Profil admin trouvé:', {
      admin_id: adminProfile.id,
      role: adminProfile.role,
      email: adminProfile.email
    });

    // Récupérer la réservation
    console.log('📚 Récupération réservation...', { bookingId });
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('❌ Erreur récupération booking:', bookingError);
      return NextResponse.json({ error: 'Erreur lors de la récupération de la réservation' }, { status: 500 });
    }
    
    if (!booking) {
      console.error('❌ Réservation non trouvée:', bookingId);
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }
    
    console.log('✅ Réservation trouvée:', { 
      id: booking.id, 
      status: booking.status, 
      amateur_id: booking.amateur_id 
    });

    let newStatus = '';
    let bookingStatus = '';

    // Déterminer le nouveau statut selon l'action
    switch (action) {
      case 'confirm':
        newStatus = 'confirmed';
        bookingStatus = 'confirmed';
        // TODO: Ici on appellerait l'API du golf pour réserver
        break;
      case 'reject':
        newStatus = 'rejected';
        bookingStatus = 'cancelled';
        break;
      case 'alternative':
        newStatus = 'alternative_proposed';
        bookingStatus = 'pending';
        break;
      case 'checking':
        newStatus = 'checking_availability';
        bookingStatus = 'pending';
        break;
      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

    // Mettre à jour la table admin_booking_validations avec l'admin_id (qui correspond à admin_profiles.id)
    console.log('💾 Mise à jour validation avec admin_id:', adminProfile.id);
    const { error: validationError } = await supabase
      .from('admin_booking_validations')
      .update({
        status: newStatus,
        admin_id: adminProfile.id, // Utiliser l'ID admin_profiles
        admin_notes,
        alternative_date,
        alternative_time,
        validated_at: new Date().toISOString(),
      })
      .eq('booking_id', bookingId);

    if (validationError) {
      throw validationError;
    }

    // Mettre à jour la réservation
    const updateData: {
      status: string;
      admin_validation_status: string;
      confirmed_at?: string;
      cancelled_at?: string;
      cancellation_reason?: string;
    } = {
      status: bookingStatus,
      admin_validation_status: newStatus,
    };

    if (action === 'confirm') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (action === 'reject') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = admin_notes || 'Rejetée par l\'administration';
    }

    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (bookingUpdateError) {
      throw bookingUpdateError;
    }

    // Si c'est une confirmation, essayer de réserver auprès du golf
    if (action === 'confirm') {
      try {
        // Récupérer les données du profil amateur pour la réservation
        const { data: amateurProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', booking.amateur_id)
          .single();

        // Effectuer la réservation auprès du golf
        const golfBookingResult = await golfApiService.makeBooking(
          booking.golf_course_id,
          {
            golf_course_id: booking.golf_course_id,
            date: booking.booking_date,
            time: booking.start_time,
            players: booking.number_of_players || 1,
            player_details: {
              name: `${amateurProfile?.first_name || ''} ${amateurProfile?.last_name || ''}`.trim(),
              email: amateurProfile?.email || '',
              phone: amateurProfile?.phone,
            },
            special_requests: booking.special_requests,
          }
        );

        if (!golfBookingResult.success) {
          throw new Error(golfBookingResult.error || 'Échec de la réservation golf');
        }

        // Enregistrer l'ID de réservation du golf
        await supabase
          .from('bookings')
          .update({
            golf_booking_id: golfBookingResult.booking_id,
          })
          .eq('id', bookingId);

        console.log(`✅ Réservation golf confirmée: ${golfBookingResult.booking_id}`);
        
      } catch (golfError: unknown) {
        console.error('Erreur lors de la réservation golf:', golfError);
        
        // En cas d'échec, repasser en statut "checking"
        await supabase
          .from('admin_booking_validations')
          .update({
            status: 'checking_availability',
            admin_id: adminProfile.id, // Utiliser l'admin_id
            admin_notes: `Erreur lors de la réservation golf: ${golfError instanceof Error ? golfError.message : 'Erreur inconnue'}`,
            validated_at: new Date().toISOString(),
          })
          .eq('booking_id', bookingId);

        await supabase
          .from('bookings')
          .update({
            status: 'pending',
            admin_validation_status: 'checking_availability',
          })
          .eq('id', bookingId);

        return NextResponse.json({
          success: false,
          error: `Erreur lors de la réservation golf: ${golfError instanceof Error ? golfError.message : 'Erreur inconnue'}`,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Validation mise à jour avec succès' 
    });

  } catch (error: unknown) {
    console.error('❌ ERREUR COMPLETE validation booking:', {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

