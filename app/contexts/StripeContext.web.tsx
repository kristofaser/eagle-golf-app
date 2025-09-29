import React, { ReactNode } from 'react';

interface StripeContextProps {
  children: ReactNode;
}

// Provider vide pour le web - Stripe Elements géré directement dans PaymentForm.web
export function StripeProviderWrapper({ children }: StripeContextProps) {
  return <>{children}</>;
}

export function useStripeContext() {
  return null;
}