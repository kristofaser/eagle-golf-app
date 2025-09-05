import React, { createContext, useContext, ReactNode } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

interface StripeContextProps {
  children: ReactNode;
}

const StripeContext = createContext<null>(null);

export function StripeProviderWrapper({ children }: StripeContextProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      'Clé Stripe manquante. Veuillez définir EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY dans votre fichier .env.local'
    );
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.eagle.golf" // Identifier unique de votre app
      urlScheme="eagle" // Pour les retours après paiement
    >
      {children}
    </StripeProvider>
  );
}

export function useStripeContext() {
  const context = useContext(StripeContext);
  return context;
}
