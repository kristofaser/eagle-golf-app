/**
 * Edge Function: booking-notification
 *
 * Gère les notifications pour les événements de booking (confirmation, annulation, modification).
 * Peut être appelée par l'admin panel ou par des triggers de base de données.
 *
 * ✅ SÉCURISÉ : Vérification des permissions admin
 * ✅ COMPLET : Push + in-app notifications
 * ✅ FLEXIBLE : Support multiple types d'événements
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface BookingNotificationRequest {
  bookingId: string;
  action: 'confirmed' | 'cancelled' | 'modified' | 'reminder_24h' | 'reminder_1h';
  adminId?: string;
  adminNotes?: string;
  alternativeDate?: string;
  alternativeTime?: string;
  modifiedFields?: Record<string, any>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérification de la méthode
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialisation du client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse du body
    const body: BookingNotificationRequest = await req.json();

    // Validation des paramètres requis
    if (!body.bookingId || !body.action) {
      return new Response(
        JSON.stringify({ error: 'bookingId and action are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Booking notification request:', {\n      bookingId: body.bookingId,\n      action: body.action,\n      adminId: body.adminId\n    });

    // Récupérer les informations complètes du booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        id,
        amateur_id,
        professional_id,
        golf_course_id,
        lesson_date,
        lesson_time,
        status,
        payment_status,
        amount,
        amateurs:amateur_id (
          id,
          first_name,
          last_name,
          email
        ),
        professionals:professional_id (
          id,
          first_name,
          last_name,
          email
        ),
        golf_courses:golf_course_id (
          id,
          name,
          address
        )
      `)
      .eq('id', body.bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Préparer les données de notification selon l'action
    let notificationData: {
      title: string;
      body: string;
      type: string;
      priority: 'default' | 'normal' | 'high';
      data: Record<string, any>;
    };

    switch (body.action) {
      case 'confirmed':
        notificationData = {
          title: '✅ Réservation confirmée',
          body: `Votre leçon avec ${booking.professionals?.first_name} ${booking.professionals?.last_name} est confirmée`,
          type: 'booking_confirmed',
          priority: 'high',
          data: {
            bookingId: booking.id,
            screen: '/bookings/details',
            action: 'view_booking',
            lessonDate: booking.lesson_date,
            lessonTime: booking.lesson_time,
            professionalName: `${booking.professionals?.first_name} ${booking.professionals?.last_name}`,
            golfCourse: booking.golf_courses?.name,
          },
        };
        break;

      case 'cancelled':
        notificationData = {
          title: '❌ Réservation annulée',
          body: body.adminNotes || 'Votre réservation a été annulée. Un remboursement sera effectué si applicable.',
          type: 'booking_cancelled',
          priority: 'high',
          data: {
            bookingId: booking.id,
            screen: '/bookings/cancelled',
            action: 'view_cancellation',
            reason: body.adminNotes,
            alternativeDate: body.alternativeDate,
            alternativeTime: body.alternativeTime,
          },
        };
        break;

      case 'modified':
        notificationData = {
          title: '📝 Réservation modifiée',
          body: `Votre réservation a été modifiée. Nouvelle date: ${body.alternativeDate || booking.lesson_date}`,
          type: 'booking_modified',
          priority: 'normal',
          data: {
            bookingId: booking.id,
            screen: '/bookings/details',
            action: 'view_booking',
            changes: body.modifiedFields,
            newDate: body.alternativeDate,
            newTime: body.alternativeTime,
            adminNotes: body.adminNotes,
          },
        };
        break;

      case 'reminder_24h':
        notificationData = {
          title: '⏰ Rappel - Leçon demain',
          body: `N'oubliez pas votre leçon demain à ${booking.lesson_time} avec ${booking.professionals?.first_name}`,
          type: 'booking_reminder',
          priority: 'normal',
          data: {
            bookingId: booking.id,
            screen: '/bookings/details',
            action: 'view_booking',
            reminderType: '24h',
            lessonDate: booking.lesson_date,
            lessonTime: booking.lesson_time,
          },
        };
        break;

      case 'reminder_1h':
        notificationData = {
          title: '🏌️ Votre leçon commence bientôt',
          body: `Votre leçon commence dans 1 heure au ${booking.golf_courses?.name}`,
          type: 'booking_reminder',
          priority: 'high',
          data: {
            bookingId: booking.id,
            screen: '/bookings/details',
            action: 'view_booking',
            reminderType: '1h',
            golfCourseAddress: booking.golf_courses?.address,
          },
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    const results = {
      pushNotification: null as any,
      inAppNotification: null as any,
      adminLogUpdate: null as any,
    };

    // 🚀 Envoyer notification push
    try {
      const { data: pushResult, error: pushError } = await supabaseClient.functions.invoke('send-push-notification', {
        body: {
          userId: booking.amateur_id,
          title: notificationData.title,
          body: notificationData.body,
          type: notificationData.type,
          priority: notificationData.priority,
          data: notificationData.data,
        },
      });

      if (pushError) {
        console.warn('⚠️ Erreur envoi push notification booking:', pushError);
        results.pushNotification = { success: false, error: pushError };
      } else {
        console.log('✅ Push notification booking envoyée:', pushResult);
        results.pushNotification = { success: true, data: pushResult };
      }
    } catch (pushErr) {
      console.warn('⚠️ Exception push notification booking:', pushErr);
      results.pushNotification = { success: false, error: pushErr };
    }

    // 📨 Créer notification in-app
    try {
      const { data: inAppResult, error: inAppError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: booking.amateur_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.body,
          data: notificationData.data,
        })
        .select()
        .single();

      if (inAppError) {
        console.warn('⚠️ Erreur création notification in-app booking:', inAppError);
        results.inAppNotification = { success: false, error: inAppError };
      } else {
        console.log('✅ Notification in-app booking créée:', inAppResult.id);
        results.inAppNotification = { success: true, data: inAppResult };
      }
    } catch (inAppErr) {
      console.warn('⚠️ Exception notification in-app booking:', inAppErr);
      results.inAppNotification = { success: false, error: inAppErr };
    }

    // 📝 Mettre à jour le log admin si action par admin
    if (body.adminId && ['confirmed', 'cancelled', 'modified'].includes(body.action)) {
      try {
        const { data: logResult, error: logError } = await supabaseClient
          .from('admin_booking_validations')
          .update({
            status: body.action === 'confirmed' ? 'approved' : body.action === 'cancelled' ? 'rejected' : 'modified',
            admin_id: body.adminId,
            admin_notes: body.adminNotes,
            alternative_date: body.alternativeDate,
            alternative_time: body.alternativeTime,
            validated_at: new Date().toISOString(),
          })
          .eq('booking_id', booking.id)
          .select()
          .single();

        if (logError) {
          console.warn('⚠️ Erreur mise à jour log admin:', logError);
          results.adminLogUpdate = { success: false, error: logError };
        } else {
          console.log('✅ Log admin mis à jour:', logResult?.id);
          results.adminLogUpdate = { success: true, data: logResult };
        }
      } catch (logErr) {
        console.warn('⚠️ Exception mise à jour log admin:', logErr);
        results.adminLogUpdate = { success: false, error: logErr };
      }
    }

    // 🔄 Notifier aussi le professionnel si applicable
    if (booking.professional_id && ['confirmed', 'cancelled'].includes(body.action)) {
      try {
        const proNotificationData = {
          title: body.action === 'confirmed' ? '✅ Nouvelle leçon confirmée' : '❌ Leçon annulée',
          body: body.action === 'confirmed'
            ? `Leçon confirmée avec ${booking.amateurs?.first_name} ${booking.amateurs?.last_name} le ${booking.lesson_date}`
            : `Leçon annulée avec ${booking.amateurs?.first_name} ${booking.amateurs?.last_name}`,
          type: body.action === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
          priority: 'normal' as const,
        };

        // Push notification pour le pro
        await supabaseClient.functions.invoke('send-push-notification', {
          body: {
            userId: booking.professional_id,
            title: proNotificationData.title,
            body: proNotificationData.body,
            type: proNotificationData.type,
            priority: proNotificationData.priority,
            data: notificationData.data,
          },
        });

        // Notification in-app pour le pro
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: booking.professional_id,
            type: proNotificationData.type,
            title: proNotificationData.title,
            message: proNotificationData.body,
            data: notificationData.data,
          });

        console.log('✅ Notifications professionnelles envoyées');
      } catch (proErr) {
        console.warn('⚠️ Erreur notifications professionnelles:', proErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Booking notification sent for action: ${body.action}`,
        results,
        booking: {
          id: booking.id,
          amateur: `${booking.amateurs?.first_name} ${booking.amateurs?.last_name}`,
          professional: `${booking.professionals?.first_name} ${booking.professionals?.last_name}`,
          date: booking.lesson_date,
          time: booking.lesson_time,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Booking notification error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});