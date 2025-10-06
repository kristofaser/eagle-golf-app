/**
 * Validation utilities - Centralise toutes les validations de formulaire
 */

/**
 * Regex email RFC 5322 compliant (version simplifiée)
 * Accepte les caractères spéciaux courants et les formats valides
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Valide un email selon RFC 5322
 * @param email - Email à valider
 * @returns true si email valide
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 254) return false; // RFC max length

  return EMAIL_REGEX.test(trimmed);
};

/**
 * Validation email avec message d'erreur
 * @param email - Email à valider
 * @returns Objet avec valid et error optionnel
 */
export const validateEmailWithError = (
  email: string
): {
  valid: boolean;
  error?: string;
} => {
  if (!email?.trim()) {
    return { valid: false, error: "L'email est requis" };
  }
  if (!validateEmail(email)) {
    return { valid: false, error: 'Format email invalide' };
  }
  return { valid: true };
};

/**
 * Valide un nom (prénom ou nom de famille)
 * @param name - Nom à valider
 * @returns true si nom valide
 */
export const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
};

/**
 * Validation nom avec message d'erreur
 * @param name - Nom à valider
 * @param fieldName - Nom du champ pour le message d'erreur
 * @returns Objet avec valid et error optionnel
 */
export const validateNameWithError = (
  name: string,
  fieldName: string = 'Ce champ'
): {
  valid: boolean;
  error?: string;
} => {
  if (!name?.trim()) {
    return { valid: false, error: `${fieldName} est requis` };
  }
  if (!validateName(name)) {
    return {
      valid: false,
      error: `${fieldName} doit contenir entre 2 et 50 caractères`,
    };
  }
  return { valid: true };
};

/**
 * Valide un numéro de téléphone
 * Format international accepté
 * @param phone - Numéro de téléphone
 * @returns true si numéro valide
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  // Format international flexible
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Valide un code OTP (6 chiffres)
 * @param code - Code OTP
 * @returns true si code valide
 */
export const validateOTP = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  return /^[0-9]{6}$/.test(code.trim());
};

/**
 * Validation OTP avec message d'erreur
 * @param code - Code OTP
 * @returns Objet avec valid et error optionnel
 */
export const validateOTPWithError = (
  code: string
): {
  valid: boolean;
  error?: string;
} => {
  if (!code?.trim()) {
    return { valid: false, error: 'Le code est requis' };
  }
  if (!validateOTP(code)) {
    return { valid: false, error: 'Le code doit contenir 6 chiffres' };
  }
  return { valid: true };
};

/**
 * Valide un mot de passe (si utilisé plus tard)
 * @param password - Mot de passe
 * @returns true si mot de passe valide
 */
export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  // Minimum 8 caractères, au moins une lettre et un chiffre
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};

/**
 * Validation mot de passe avec message d'erreur
 * @param password - Mot de passe
 * @returns Objet avec valid et error optionnel
 */
export const validatePasswordWithError = (
  password: string
): {
  valid: boolean;
  error?: string;
} => {
  if (!password) {
    return { valid: false, error: 'Le mot de passe est requis' };
  }
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Le mot de passe doit contenir au moins 8 caractères',
    };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Le mot de passe doit contenir au moins une lettre',
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Le mot de passe doit contenir au moins un chiffre',
    };
  }
  return { valid: true };
};

/**
 * Nettoie un email (trim + lowercase)
 * @param email - Email à nettoyer
 * @returns Email nettoyé
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Nettoie un nom (trim + capitalize)
 * @param name - Nom à nettoyer
 * @returns Nom nettoyé
 */
export const sanitizeName = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};
