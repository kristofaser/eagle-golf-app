/**
 * Utilitaires de validation des dates
 */

export interface DateValidationResult {
  isValid: boolean;
  formattedDate?: string; // Format ISO (YYYY-MM-DD)
  error?: string;
}

/**
 * Valide une date de naissance au format JJ/MM/AAAA
 */
export function validateDateOfBirth(dateString: string): DateValidationResult {
  if (!dateString || !dateString.trim()) {
    return {
      isValid: false,
      error: 'Date de naissance requise',
    };
  }

  // Nettoyage de la chaîne
  const cleanDate = dateString.trim();

  // Vérification du format JJ/MM/AAAA
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDate.match(dateRegex);

  if (!match) {
    return {
      isValid: false,
      error: 'Format invalide. Utilisez JJ/MM/AAAA (ex: 15/03/1985)',
    };
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr!, 10);
  const month = parseInt(monthStr!, 10);
  const year = parseInt(yearStr!, 10);

  // Vérifications de base
  if (day < 1 || day > 31) {
    return {
      isValid: false,
      error: 'Jour invalide (1-31)',
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: 'Mois invalide (1-12)',
    };
  }

  if (year < 1900 || year > new Date().getFullYear()) {
    return {
      isValid: false,
      error: `Année invalide (1900-${new Date().getFullYear()})`,
    };
  }

  // Création de l'objet Date pour validation complète
  const dateObject = new Date(year, month - 1, day); // month est 0-indexé en JS

  // Vérification que la date est réelle (pas de 31/02 par exemple)
  if (
    dateObject.getDate() !== day ||
    dateObject.getMonth() !== month - 1 ||
    dateObject.getFullYear() !== year
  ) {
    return {
      isValid: false,
      error: 'Date inexistante (ex: 31/02/2023)',
    };
  }


  // Format ISO pour la base de données
  const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  return {
    isValid: true,
    formattedDate,
  };
}

/**
 * Formate une date depuis le format ISO vers JJ/MM/AAAA
 */
export function formatDateForDisplay(isoDate: string): string {
  try {
    if (!isoDate || isoDate.trim() === '') {
      return '';
    }

    const date = new Date(isoDate);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '';
  }
}

/**
 * Applique un masque de saisie pour la date JJ/MM/AAAA
 */
export function applyDateMask(input: string): string {
  // Supprimer tous les caractères non numériques
  const numbers = input.replace(/\D/g, '');

  // Appliquer le masque JJ/MM/AAAA
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return numbers.slice(0, 2) + '/' + numbers.slice(2);
  } else {
    return numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
  }
}

/**
 * Valide que la date correspond à un dirigeant d'entreprise
 * (vérifications spécifiques métier)
 */
export function validateBusinessLeaderAge(dateString: string): DateValidationResult {
  if (!dateString || !dateString.trim()) {
    return {
      isValid: false,
      error: 'Date de naissance requise',
    };
  }

  // Nettoyage de la chaîne
  const cleanDate = dateString.trim();

  // Vérification du format JJ/MM/AAAA
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDate.match(dateRegex);

  if (!match) {
    return {
      isValid: false,
      error: 'Format invalide. Utilisez JJ/MM/AAAA (ex: 15/03/1985)',
    };
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr!, 10);
  const month = parseInt(monthStr!, 10);
  const year = parseInt(yearStr!, 10);

  // Vérifications de base (identiques à validateDateOfBirth)
  if (day < 1 || day > 31) {
    return {
      isValid: false,
      error: 'Jour invalide (1-31)',
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: 'Mois invalide (1-12)',
    };
  }

  if (year < 1900 || year > new Date().getFullYear()) {
    return {
      isValid: false,
      error: `Année invalide (1900-${new Date().getFullYear()})`,
    };
  }

  // Création de l'objet Date pour validation complète
  const dateObject = new Date(year, month - 1, day);

  // Vérification que la date est réelle
  if (
    dateObject.getDate() !== day ||
    dateObject.getMonth() !== month - 1 ||
    dateObject.getFullYear() !== year
  ) {
    return {
      isValid: false,
      error: 'Date inexistante (ex: 31/02/2023)',
    };
  }


  // Format ISO pour la base de données
  const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  return {
    isValid: true,
    formattedDate,
  };
}
