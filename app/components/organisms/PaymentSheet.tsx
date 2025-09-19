import React, { useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { paymentService, CreatePaymentIntentRequest } from '@/services/payment.service';

interface PaymentSheetProps {
  amount: number; // en centimes
  currency?: string;
  metadata: CreatePaymentIntentRequest['metadata'];
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  amount,
  currency = 'eur',
  metadata,
  onPaymentSuccess,
  onPaymentError,
  buttonText = 'Payer maintenant',
  disabled = false,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);

      // Créer le Payment Intent via notre service
      const response = await paymentService.createPaymentIntent({
        amount,
        currency,
        metadata,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Initialiser le Payment Sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Eagle Golf',
        paymentIntentClientSecret: response.client_secret,
        returnURL: 'eagle://payment-complete',
        customFlow: true, // Contrôle total sur les méthodes de paiement
        style: 'alwaysDark', // ou 'alwaysLight' selon votre thème
        googlePay: {
          merchantCountryCode: 'FR',
          testEnv: __DEV__, // true en développement
        },
        applePay: {
          merchantCountryCode: 'FR',
        },
        // ❌ DÉSACTIVATION COMPLÈTE DE LINK
        allowsDelayedPaymentMethods: false, // Désactive Link et autres méthodes différées
        // Configuration française
        defaultBillingDetails: {},
        appearance: {
          primaryButton: {
            colors: {
              background: '#4F46E5', // Couleur du bouton principal
            },
          },
        },
        // Localisation française
        locale: 'fr',
        // 🎯 ORDRE PRIORITAIRE SANS LINK
        paymentMethodOrder: ['apple_pay', 'google_pay', 'card'], // Apple Pay en premier
      });

      if (error) {
        throw new Error(error.message);
      }

      // Présenter le Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // L'utilisateur a annulé ou il y a eu une erreur
        if (paymentError.code !== 'Canceled') {
          throw new Error(paymentError.message);
        }
        return; // Annulé par l'utilisateur, ne pas montrer d'erreur
      }

      // Paiement réussi
      onPaymentSuccess(response.payment_intent_id);
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      onPaymentError(error.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.paymentButton,
          disabled && styles.paymentButtonDisabled,
          loading && styles.paymentButtonLoading,
        ]}
        onPress={initializePaymentSheet}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.neutral.white} />
        ) : (
          <>
            <Ionicons name="card-outline" size={20} color={Colors.neutral.white} />
            <Text variant="body" weight="semiBold" color="white">
              {buttonText} {formatAmount(amount, currency)}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text variant="caption" color="iron" style={styles.securityNote}>
        🔒 Paiement sécurisé par Stripe
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paymentButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 56,
    marginHorizontal: Spacing.xs,
  },
  paymentButtonDisabled: {
    backgroundColor: Colors.ui.inputBorder,
    opacity: 0.6,
  },
  paymentButtonLoading: {
    opacity: 0.8,
  },
  securityNote: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
