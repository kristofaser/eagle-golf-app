// Interface commune pour les paiements (native et web)
export interface PaymentFormProps {
  amount: number; // en centimes
  currency?: string;
  metadata: {
    booking_id?: string;
    pro_id: string;
    amateur_id: string;
    booking_date: string;
    start_time: string;
    description: string;
  };
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
}

export interface PaymentResult {
  success: boolean;
  payment_intent_id: string;
  error?: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata: PaymentFormProps['metadata'];
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  error?: string;
}