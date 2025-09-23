import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

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
      .eq('id', user.id)
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
        admin_notes: admin_notes || null,
        alternative_date: alternative_date || null,
        alternative_time: alternative_time || null,
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

    // La réservation a été validée manuellement par l'admin (appel téléphonique au golf)
    // Plus besoin d'API automatique - le processus humain prime
    console.log(`✅ Réservation validée manuellement par l'admin: ${adminProfile.email}`);

    // 🔔 Envoyer notification push à l'utilisateur
    try {
      console.log('📱 Envoi notification push pour validation admin...');

      let pushTitle = '';
      let pushMessage = '';
      let pushType = '';

      switch (action) {
        case 'confirm':
          pushTitle = '✅ Réservation confirmée';
          pushMessage = 'Votre réservation a été confirmée par notre équipe !';
          pushType = 'booking_confirmed';
          break;
        case 'reject':
          pushTitle = '❌ Réservation annulée';
          pushMessage = admin_notes || 'Votre réservation a été annulée par notre équipe.';
          pushType = 'booking_cancelled';
          break;
        case 'alternative':
          pushTitle = '🔄 Alternative proposée';
          pushMessage = 'Une alternative a été proposée pour votre réservation.';
          pushType = 'booking_alternative';
          break;
      }

      const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          userId: booking.amateur_id,
          title: pushTitle,
          body: pushMessage,
          type: pushType,
          data: {
            bookingId: booking.id,
            action: action,
            adminNotes: admin_notes,
            validatedBy: adminProfile.email,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (pushResponse.ok) {
        const pushResult = await pushResponse.json();
        console.log('✅ Notification push envoyée:', pushResult);
      } else {
        const pushError = await pushResponse.text();
        console.error('❌ Erreur envoi push notification:', pushError);
      }
    } catch (pushError) {
      // Ne pas faire échouer la validation si la push notification échoue
      console.error('❌ Erreur lors de l\'envoi de la notification push:', pushError);
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

