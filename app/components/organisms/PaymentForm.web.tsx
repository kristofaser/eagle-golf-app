import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '@/services/payment.service';
import { logger } from '@/utils/logger';
import { PaymentFormProps } from '@/types/payment.types';

// Chargement de Stripe (memoized pour éviter les rechargements)
const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Composant interne avec les hooks Stripe
const PaymentFormInternal: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'eur',
  metadata,
  onPaymentSuccess,
  onPaymentError,
  buttonText = 'Payer maintenant',
  disabled = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const initializePayment = async () => {
    if (!stripe || !elements) {
      onPaymentError('Stripe non initialisé');
      return;
    }

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

      setClientSecret(response.client_secret);

      // Confirmer le paiement
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required', // Évite la redirection si possible
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Paiement réussi
      onPaymentSuccess(response.payment_intent_id);
    } catch (error) {
      logger.error('Erreur paiement web:', error);
      onPaymentError(error instanceof Error ? error.message : 'Erreur lors du paiement');
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
      {/* Élément de paiement Stripe */}
      <View style={styles.paymentElementContainer}>
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
            fields: {
              billingDetails: {
                address: {
                  country: 'never',
                  postalCode: 'never',
                },
              },
            },
          }}
        />
      </View>

      {/* Bouton de paiement */}
      <TouchableOpacity
        testID="payment-button-web"
        style={[
          styles.paymentButton,
          disabled && styles.paymentButtonDisabled,
          loading && styles.paymentButtonLoading,
        ]}
        onPress={initializePayment}
        disabled={disabled || loading || !stripe || !elements}
      >
        {loading ? (
          <ActivityIndicator testID="payment-loading-web" color={Colors.neutral.white} />
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

// Composant principal avec provider Stripe Elements
export const PaymentFormWeb: React.FC<PaymentFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Initialiser le client secret au montage
  React.useEffect(() => {
    const initializeClientSecret = async () => {
      try {
        const response = await paymentService.createPaymentIntent({
          amount: props.amount,
          currency: props.currency || 'eur',
          metadata: props.metadata,
        });

        if (response.error) {
          props.onPaymentError(response.error);
          return;
        }

        setClientSecret(response.client_secret);
      } catch (error) {
        logger.error('Erreur initialisation Payment Intent:', error);
        props.onPaymentError('Erreur lors de l\'initialisation du paiement');
      }
    };

    initializeClientSecret();
  }, [props.amount, props.currency]);

  if (!clientSecret) {
    return (
      <View style={styles.container}>
        <ActivityIndicator testID="payment-init-loading" color={Colors.primary.accent} />
        <Text variant="body" color="charcoal" style={styles.loadingText}>
          Initialisation du paiement...
        </Text>
      </View>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: Colors.primary.accent,
        colorBackground: Colors.neutral.white,
        colorText: Colors.neutral.charcoal,
        colorDanger: Colors.feedback.error,
        borderRadius: `${BorderRadius.medium}px`,
        spacingUnit: `${Spacing.xs}px`,
      },
    },
    locale: 'fr' as const,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInternal {...props} />
    </Elements>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 200,
  },
  paymentElementContainer: {
    marginBottom: Spacing.m,
    padding: Spacing.s,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
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
    cursor: 'pointer', // Style web
  },
  paymentButtonDisabled: {
    backgroundColor: Colors.ui.inputBorder,
    opacity: 0.6,
    cursor: 'not-allowed', // Style web
  },
  paymentButtonLoading: {
    opacity: 0.8,
  },
  securityNote: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: Spacing.s,
  },
});