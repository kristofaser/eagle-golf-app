/**
 * Error Codes - Codes d'erreur constants pour l'authentification
 * Centralise tous les codes d'erreur pour éviter les checks sur strings
 */

export const AUTH_ERROR_CODES = {
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'auth/rate-limit-exceeded',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  TOO_MANY_ATTEMPTS: 'auth/too-many-attempts',

  // User existence
  EMAIL_ALREADY_EXISTS: 'auth/email-already-in-use',
  EMAIL_ALREADY_REGISTERED: 'auth/email-already-registered',
  USER_NOT_FOUND: 'auth/user-not-found',
  USER_DISABLED: 'auth/user-disabled',

  // OTP
  INVALID_OTP: 'auth/invalid-otp',
  OTP_EXPIRED: 'auth/otp-expired',
  OTP_VERIFICATION_FAILED: 'auth/otp-verification-failed',

  // Email
  INVALID_EMAIL: 'auth/invalid-email',
  EMAIL_NOT_VERIFIED: 'auth/email-not-verified',

  // Network
  NETWORK_ERROR: 'auth/network-error',
  TIMEOUT: 'auth/timeout',
  SERVER_ERROR: 'auth/server-error',

  // Generic
  UNKNOWN_ERROR: 'auth/unknown-error',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "Vous avez effectué trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.",
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]:
    "Trop de requêtes. Veuillez patienter quelques instants.",
  [AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS]:
    "Trop de tentatives. Demandez un nouveau code.",

  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]:
    "Cette adresse email est déjà associée à un compte. Essayez de vous connecter ou utilisez une autre adresse.",
  [AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED]:
    "Cette adresse email est déjà utilisée.",
  [AUTH_ERROR_CODES.USER_NOT_FOUND]:
    "Aucun compte trouvé avec cette adresse email.",
  [AUTH_ERROR_CODES.USER_DISABLED]:
    "Ce compte a été désactivé. Contactez le support.",

  [AUTH_ERROR_CODES.INVALID_OTP]: "Code incorrect. Vérifiez et réessayez.",
  [AUTH_ERROR_CODES.OTP_EXPIRED]: "Code expiré. Demandez un nouveau code.",
  [AUTH_ERROR_CODES.OTP_VERIFICATION_FAILED]:
    "La vérification a échoué. Veuillez réessayer.",

  [AUTH_ERROR_CODES.INVALID_EMAIL]: "Format email invalide.",
  [AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED]:
    "Veuillez vérifier votre adresse email.",

  [AUTH_ERROR_CODES.NETWORK_ERROR]:
    "Erreur de connexion. Vérifiez votre connexion internet.",
  [AUTH_ERROR_CODES.TIMEOUT]: "La requête a expiré. Veuillez réessayer.",
  [AUTH_ERROR_CODES.SERVER_ERROR]:
    "Erreur serveur. Veuillez réessayer plus tard.",

  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: "Une erreur inattendue s'est produite.",
  [AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED]: "Opération non autorisée.",
};

/**
 * Détecte le code d'erreur à partir du message Supabase
 * @param error - Erreur Supabase
 * @returns Code d'erreur constant
 */
export const detectErrorCode = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';

  // Rate limiting
  if (
    message.includes('trop de tentatives') ||
    message.includes('too many attempts')
  ) {
    return AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS;
  }
  if (
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED;
  }

  // Email already exists
  if (
    message.includes('déjà utilisée') ||
    message.includes('already registered') ||
    message.includes('already in use') ||
    message.includes('email already exists')
  ) {
    return AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS;
  }

  // OTP errors
  if (message.includes('invalid') && message.includes('otp')) {
    return AUTH_ERROR_CODES.INVALID_OTP;
  }
  if (message.includes('expired') && message.includes('otp')) {
    return AUTH_ERROR_CODES.OTP_EXPIRED;
  }
  if (message.includes('expired')) {
    return AUTH_ERROR_CODES.OTP_EXPIRED;
  }

  // User not found
  if (
    message.includes('user not found') ||
    message.includes('no user found')
  ) {
    return AUTH_ERROR_CODES.USER_NOT_FOUND;
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch failed')) {
    return AUTH_ERROR_CODES.NETWORK_ERROR;
  }
  if (message.includes('timeout')) {
    return AUTH_ERROR_CODES.TIMEOUT;
  }

  // Supabase error code mapping
  if (error?.code) {
    switch (error.code) {
      case 'user_already_exists':
        return AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS;
      case 'invalid_credentials':
        return AUTH_ERROR_CODES.INVALID_OTP;
      case 'otp_expired':
        return AUTH_ERROR_CODES.OTP_EXPIRED;
      default:
        break;
    }
  }

  return AUTH_ERROR_CODES.UNKNOWN_ERROR;
};

/**
 * Obtient le message d'erreur formaté
 * @param errorCode - Code d'erreur
 * @returns Message d'erreur localisé
 */
export const getErrorMessage = (errorCode: string): string => {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR];
};
