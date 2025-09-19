import { supabase } from '@/utils/supabase/client';

export interface PaymentIntentData {
  amount: number; // en centimes
  currency: string;
  metadata: {
    booking_id?: string;
    pro_id: string;
    amateur_id: string;
    booking_date: string;
    start_time: string;
    description: string;
  };
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata: PaymentIntentData['metadata'];
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  payment_intent_id: string;
  error?: string;
}

export const paymentService = {
  /**
   * Créer un Payment Intent Stripe via Edge Function Supabase
   */
  async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    try {
      const { data: response, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: data.amount,
          currency: data.currency || 'eur',
          metadata: data.metadata,
        },
      });

      if (error) {
        throw error;
      }

      return response;
    } catch (error: any) {
      console.error('Erreur création Payment Intent:', error);
      return {
        client_secret: '',
        payment_intent_id: '',
        error: error.message || 'Erreur lors de la création du paiement',
      };
    }
  },

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const { data: response, error } = await supabase.functions.invoke('check-payment-status', {
        body: {
          payment_intent_id: paymentIntentId,
        },
      });

      if (error) {
        throw error;
      }

      return response;
    } catch (error: any) {
      console.error('Erreur vérification paiement:', error);
      return {
        success: false,
        payment_intent_id: paymentIntentId,
        error: error.message || 'Erreur lors de la vérification du paiement',
      };
    }
  },

  /**
   * Vérifier qu'une availability existe et a de la place
   */
  async verifyAvailability(
    availabilityId: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pro_availabilities')
        .select('id, max_players, current_bookings')
        .eq('id', availabilityId)
        .single();

      if (error || !data) {
        console.error('❌ Availability non trouvée:', error);
        return { 
          valid: false, 
          error: 'Disponibilité non trouvée' 
        };
      }

      if (data.current_bookings >= data.max_players) {
        return { 
          valid: false, 
          error: 'Plus de place disponible pour ce créneau' 
        };
      }

      console.log('✅ Availability vérifiée:', availabilityId);
      return { valid: true };
    } catch (error: any) {
      console.error('❌ Error in verifyAvailability:', error);
      return { 
        valid: false, 
        error: error.message || 'Erreur lors de la vérification' 
      };
    }
  },

  /**
   * Calculer l'heure de fin basée sur l'heure de début
   */
  calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 2; // Durée de 2h par défaut
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  /**
   * Confirmer le paiement et créer la réservation
   * Fait confiance au Payment Sheet Stripe (bonnes pratiques officielles)
   */
  async confirmPaymentAndBooking(
    paymentIntentId: string,
    bookingData: any
  ): Promise<{ success: boolean; booking_id?: string; error?: string }> {
    try {
      // ✅ Suppression de la double vérification qui causait la race condition
      // Le Payment Sheet Stripe garantit que le paiement est valide
      // Le webhook confirmera automatiquement quand Stripe notifie le succès
      console.log('✅ Payment Intent validé par Stripe Payment Sheet:', paymentIntentId);

      // Vérifier que l'availability_id existe et est valide
      if (!bookingData.availability_id) {
        return {
          success: false,
          error: 'Aucune disponibilité sélectionnée',
        };
      }

      const availabilityCheck = await this.verifyAvailability(bookingData.availability_id);
      if (!availabilityCheck.valid) {
        return {
          success: false,
          error: availabilityCheck.error || 'Disponibilité invalide',
        };
      }

      // Créer la réservation avec statut pending - le webhook confirmera automatiquement
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          payment_intent_id: paymentIntentId,
          payment_status: 'pending', // ← Pending au début, webhook mettra 'paid'
          status: 'pending', // En attente de confirmation webhook
          admin_validation_status: 'pending', // En attente de validation
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // Créer une entrée dans admin_booking_validations via Edge Function
      try {
        const { data: validationResult, error: validationError } = await supabase.functions.invoke(
          'create-booking-validation',
          {
            body: {
              booking_id: booking.id,
            },
          }
        );

        if (validationError) {
          console.error('Erreur lors de la création de la validation admin:', validationError);
        } else {
          console.log('✅ Validation admin créée:', validationResult);
        }
      } catch (error) {
        console.error('Erreur appel Edge Function validation:', error);
      }

      return {
        success: true,
        booking_id: booking.id,
      };
    } catch (error: any) {
      console.error('Erreur confirmation paiement et réservation:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la confirmation',
      };
    }
  },

  /**
   * Annuler un paiement (remboursement)
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      const { data: response, error } = await supabase.functions.invoke('refund-payment', {
        body: {
          payment_intent_id: paymentIntentId,
          amount: amount, // optionnel, remboursement partiel
        },
      });

      if (error) {
        throw error;
      }

      return response;
    } catch (error: any) {
      console.error('Erreur remboursement:', error);
      return {
        success: false,
        payment_intent_id: paymentIntentId,
        error: error.message || 'Erreur lors du remboursement',
      };
    }
  },
};
