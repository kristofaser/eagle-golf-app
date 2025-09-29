import { Platform } from 'react-native';
import { PaymentFormProps } from '@/types/payment.types';

// Composant conditionnel pour charger la bonne implémentation
export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  if (Platform.OS === 'web') {
    // Import dynamique pour éviter les erreurs sur native
    const PaymentFormWeb = require('./PaymentForm.web').PaymentFormWeb;
    return <PaymentFormWeb {...props} />;
  } else {
    // Import de l'ancien composant renommé
    const PaymentSheet = require('./PaymentSheet').PaymentSheet;
    return <PaymentSheet {...props} />;
  }
};