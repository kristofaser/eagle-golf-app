import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Accepter les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  try {
    // Initialiser Supabase avec la clé service (pour écriture en base)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    if (!signature) {
      console.log('⚠️ Webhook appelé sans signature Stripe');
      return new Response(JSON.stringify({ error: 'Signature Stripe manquante' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Vérifier la signature du webhook (version asynchrone pour Deno)
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log(`Webhook reçu: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Log du paiement réussi
        console.log(`Paiement réussi: ${paymentIntent.id}`);

        // Optionnel: Mettre à jour le statut dans une table de logs
        const { error: logError } = await supabaseClient.from('payment_logs').insert({
          payment_intent_id: paymentIntent.id,
          status: 'succeeded',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
          processed_at: new Date().toISOString(),
        });

        if (logError) {
          console.error('Erreur log paiement:', logError);
        }

        // IMPORTANT: Mettre à jour la réservation correspondante
        const { data: booking, error: updateError } = await supabaseClient
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed', // Passage de pending à confirmed
            admin_validation_status: 'auto_approved', // Approbation automatique après paiement réussi
            confirmed_at: new Date().toISOString(),
          })
          .eq('payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erreur mise à jour réservation:', updateError);
        } else if (booking) {
          console.log('✅ Réservation confirmée automatiquement:', booking.id);

          // Mettre à jour également la table admin_booking_validations si elle existe
          const { error: validationError } = await supabaseClient
            .from('admin_booking_validations')
            .update({
              status: 'approved',
            })
            .eq('booking_id', booking.id);

          if (validationError) {
            console.warn(
              '⚠️ Impossible de mettre à jour admin_booking_validations:',
              validationError
            );
          }

          // 🚀 NOUVEAU: Envoyer notification push pour paiement réussi
          try {
            const { data: pushResult, error: pushError } = await supabaseClient.functions.invoke(
              'send-push-notification',
              {
                body: {
                  userId: booking.amateur_id,
                  title: '💳 Paiement confirmé',
                  body: 'Votre leçon de golf a été réservée avec succès !',
                  type: 'payment_received',
                  priority: 'high',
                  data: {
                    bookingId: booking.id,
                    screen: '/bookings/details',
                    action: 'view_booking',
                  },
                },
              }
            );

            if (pushError) {
              console.warn('⚠️ Erreur envoi push notification paiement:', pushError);
            } else {
              console.log('✅ Push notification paiement envoyée:', pushResult);
            }
          } catch (pushErr) {
            console.warn('⚠️ Exception push notification paiement:', pushErr);
            // Ne pas faire échouer le webhook si la push notification échoue
          }

          // 📨 Créer notification in-app (système existant)
          try {
            const { error: notifError } = await supabaseClient.from('notifications').insert({
              user_id: booking.amateur_id,
              type: 'payment_received',
              title: 'Paiement confirmé',
              message: `Votre paiement de ${(paymentIntent.amount / 100).toFixed(2)}€ a été confirmé. Votre leçon est réservée !`,
              data: {
                booking_id: booking.id,
                payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount,
              },
            });

            if (notifError) {
              console.warn('⚠️ Erreur création notification in-app:', notifError);
            } else {
              console.log('✅ Notification in-app créée pour paiement');
            }
          } catch (notifErr) {
            console.warn('⚠️ Exception notification in-app:', notifErr);
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log(`Paiement échoué: ${paymentIntent.id}`);

        // Log de l'échec
        const { error: logError } = await supabaseClient.from('payment_logs').insert({
          payment_intent_id: paymentIntent.id,
          status: 'failed',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
          processed_at: new Date().toISOString(),
          error_message: paymentIntent.last_payment_error?.message,
        });

        if (logError) {
          console.error('Erreur log échec paiement:', logError);
        }

        // 🚨 NOUVEAU: Envoyer notification push pour paiement échoué
        // Récupérer la réservation associée pour notifier l'utilisateur
        const { data: failedBooking } = await supabaseClient
          .from('bookings')
          .select('id, amateur_id')
          .eq('payment_intent_id', paymentIntent.id)
          .single();

        if (failedBooking) {
          try {
            const { data: pushResult, error: pushError } = await supabaseClient.functions.invoke(
              'send-push-notification',
              {
                body: {
                  userId: failedBooking.amateur_id,
                  title: '💳 Échec du paiement',
                  body: "Votre paiement n'a pas pu être traité. Veuillez réessayer.",
                  type: 'payment_failed',
                  priority: 'high',
                  data: {
                    bookingId: failedBooking.id,
                    screen: '/bookings/retry-payment',
                    action: 'retry_payment',
                    paymentIntentId: paymentIntent.id,
                  },
                },
              }
            );

            if (pushError) {
              console.warn('⚠️ Erreur envoi push notification échec paiement:', pushError);
            } else {
              console.log('✅ Push notification échec paiement envoyée:', pushResult);
            }
          } catch (pushErr) {
            console.warn('⚠️ Exception push notification échec paiement:', pushErr);
          }

          // 📨 Créer notification in-app pour échec paiement
          try {
            const errorMessage = paymentIntent.last_payment_error?.message || 'Erreur inconnue';
            const { error: notifError } = await supabaseClient.from('notifications').insert({
              user_id: failedBooking.amateur_id,
              type: 'payment_failed',
              title: 'Échec du paiement',
              message: `Votre paiement de ${(paymentIntent.amount / 100).toFixed(2)}€ a échoué: ${errorMessage}`,
              data: {
                booking_id: failedBooking.id,
                payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount,
                error_message: errorMessage,
              },
            });

            if (notifError) {
              console.warn('⚠️ Erreur création notification in-app échec:', notifError);
            } else {
              console.log('✅ Notification in-app créée pour échec paiement');
            }
          } catch (notifErr) {
            console.warn('⚠️ Exception notification in-app échec:', notifErr);
          }
        }

        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;

        console.log(`Litige créé: ${dispute.id}`);

        // Notifier l'équipe support (par email ou autre)
        // Ici vous pourriez ajouter une logique de notification

        break;
      }

      default:
        console.log(`Type d'événement non géré: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Erreur webhook Stripe:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur traitement webhook',
        received: false,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
