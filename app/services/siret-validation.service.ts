import { BaseService, ServiceResponse } from './base.service';

/**
 * Résultat de la validation SIRET
 */
export interface SiretValidationResult {
  isValid: boolean;
  companyName?: string;
  address?: string;
  legalStatus?: string;
  mappedCompanyStatus?: string; // Statut d'entreprise mappé automatiquement
  isActive?: boolean;
  establishmentState?: 'ACTIVE' | 'CLOSED' | 'UNKNOWN';
  lastUpdated?: string;
  error?: string;
}

/**
 * Données de l'API INSEE Sirene
 */
interface INSEESireneResponse {
  header: {
    statut: number;
    message: string;
  };
  etablissement?: {
    siret: string;
    nic: string;
    denominationUniteLegale?: string;
    nomUniteLegale?: string;
    prenomUsuelUniteLegale?: string;
    etatAdministratifEtablissement: 'A' | 'F'; // A=Actif, F=Fermé
    dateCreationEtablissement: string;
    dateDernierTraitementEtablissement: string;
    adresseEtablissement: {
      numeroVoieEtablissement?: string;
      typeVoieEtablissement?: string;
      libelleVoieEtablissement?: string;
      codePostalEtablissement?: string;
      libelleCommuneEtablissement?: string;
    };
    uniteLegale: {
      denominationUniteLegale?: string;
      nomUniteLegale?: string;
      prenomUsuelUniteLegale?: string;
      categorieJuridiqueUniteLegale?: string;
      etatAdministratifUniteLegale: 'A' | 'C'; // A=Actif, C=Cessé
    };
  };
}

/**
 * Mapping des codes juridiques INSEE vers les statuts d'entreprise
 * Basé sur les codes officiels de l'INSEE
 */
const LEGAL_STATUS_MAPPING: Record<string, string> = {
  // Entreprises individuelles
  '1000': 'Auto-entrepreneur',
  '1100': 'Auto-entrepreneur',
  '1200': 'Auto-entrepreneur',
  '1300': 'Auto-entrepreneur',
  '1400': 'Auto-entrepreneur',
  '1500': 'Auto-entrepreneur',
  '1600': 'Auto-entrepreneur',
  '1700': 'Auto-entrepreneur',
  '1800': 'Auto-entrepreneur',
  '1900': 'Auto-entrepreneur',

  // SARL et variantes
  '5202': 'SARL',
  '5203': 'SARL',
  '5385': 'SARL',

  // EURL (SARL unipersonnelle)
  '5315': 'EURL',

  // SAS
  '5710': 'SAS',

  // SASU (SAS unipersonnelle)
  '5720': 'SAS',

  // SA (Société Anonyme) - mappées vers SAS car plus courant
  '5499': 'SAS',
  '5505': 'SAS',
  '5510': 'SAS',
  '5515': 'SAS',
  '5520': 'SAS',
  '5522': 'SAS',
  '5525': 'SAS',
  '5530': 'SAS',
  '5531': 'SAS',
  '5532': 'SAS',
  '5542': 'SAS',
  '5543': 'SAS',
  '5546': 'SAS',
  '5547': 'SAS',
  '5548': 'SAS',
  '5551': 'SAS',
  '5552': 'SAS',
  '5553': 'SAS',
  '5554': 'SAS',
  '5558': 'SAS',
  '5559': 'SAS',

  // Auto-entrepreneur (micro-entreprise)
  '5307': 'Auto-entrepreneur',

  // Autres formes rares mappées vers SARL par défaut
  '5370': 'SARL',
  '5371': 'SARL',
  '5372': 'SARL',
  '5373': 'SARL',
  '5375': 'SARL',
  '5376': 'SARL',
  '5377': 'SARL',
  '5378': 'SARL',
  '5379': 'SARL',
  '5380': 'SARL',
  '5381': 'SARL',
  '5382': 'SARL',
  '5383': 'SARL',
  '5384': 'SARL',
  '5385': 'SARL',
  '5386': 'SARL',
  '5387': 'SARL',
  '5388': 'SARL',
  '5389': 'SARL',
  '5390': 'SARL',
  '5391': 'SARL',
  '5392': 'SARL',
  '5393': 'SARL',
  '5394': 'SARL',
  '5395': 'SARL',
  '5396': 'SARL',
  '5397': 'SARL',
  '5398': 'SARL',
  '5399': 'SARL',
};

/**
 * Service de validation SIRET via l'API INSEE
 */
export class SiretValidationService extends BaseService {
  private readonly API_BASE_URL = 'https://api.insee.fr/api-sirene/3.11';
  private readonly FALLBACK_API_URL =
    'https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements';

  // Token INSEE accessible côté client (préfixé EXPO_PUBLIC_)
  private readonly API_TOKEN = process.env.EXPO_PUBLIC_INSEE_API_TOKEN;

  /**
   * Mappe un code juridique INSEE vers un statut d'entreprise
   */
  private mapLegalStatusToCompanyStatus(legalStatusCode?: string): string | undefined {
    if (!legalStatusCode) return undefined;

    const mappedStatus = LEGAL_STATUS_MAPPING[legalStatusCode];
    if (mappedStatus) {
      console.log(`📋 Mapping ${legalStatusCode} → ${mappedStatus}`);
      return mappedStatus;
    }

    // Si pas de mapping exact, essayer de deviner selon le pattern
    if (legalStatusCode.startsWith('1')) {
      console.log(`📋 Code inconnu ${legalStatusCode}, mapping par défaut → Auto-entrepreneur`);
      return 'Auto-entrepreneur';
    } else if (legalStatusCode.startsWith('52')) {
      console.log(`📋 Code inconnu ${legalStatusCode}, mapping par défaut → SARL`);
      return 'SARL';
    } else if (legalStatusCode.startsWith('57')) {
      console.log(`📋 Code inconnu ${legalStatusCode}, mapping par défaut → SAS`);
      return 'SAS';
    }

    console.log(`⚠️ Code juridique ${legalStatusCode} non mappé`);
    return undefined;
  }

  /**
   * Validation basique du format SIRET
   */
  private isValidSiretFormat(siret: string): boolean {
    // SIRET doit faire exactement 14 chiffres
    if (!siret || siret.length !== 14) return false;

    // Tous les caractères doivent être des chiffres
    if (!/^\d{14}$/.test(siret)) return false;

    // Algorithme de Luhn pour validation
    return this.validateSiretLuhn(siret);
  }

  /**
   * Validation SIRET avec algorithme de Luhn (selon spécification INSEE)
   * On part de la droite, positions paires (en partant de 1) sont multipliées par 2
   */
  private validateSiretLuhn(siret: string): boolean {
    const digits = siret.split('').map(Number);

    // Cas spécial La Poste (SIREN 356000000)
    if (siret.startsWith('356000000')) {
      // Pour La Poste : somme simple des 14 chiffres doit être multiple de 5
      const sum = digits.reduce((total, digit) => total + digit, 0);
      return sum % 5 === 0;
    }

    // Algorithme standard de Luhn
    let sum = 0;

    // On parcourt de droite à gauche
    for (let i = 0; i < 14; i++) {
      let digit = digits[13 - i]; // Index inversé pour partir de la droite

      // Les positions paires en partant de la droite (2e, 4e, 6e...) sont multipliées par 2
      if (i % 2 === 1) {
        digit *= 2;
        // Si > 9, on soustrait 9
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
    }

    return sum % 10 === 0;
  }

  /**
   * Valide un SIRET via l'API INSEE officielle
   */
  async validateSiret(siret: string): Promise<ServiceResponse<SiretValidationResult>> {
    try {
      // Validation basique du format
      if (!this.isValidSiretFormat(siret)) {
        return {
          data: {
            isValid: false,
            error: 'Format SIRET invalide (14 chiffres requis)',
          },
          error: null,
        };
      }

      // Tentative avec l'API INSEE officielle
      try {
        const result = await this.callINSEEAPI(siret);
        if (result.data) {
          return result;
        }
      } catch (error) {
        console.warn('API INSEE indisponible, tentative avec API de fallback');
      }

      // Fallback vers API publique
      try {
        const result = await this.callFallbackAPI(siret);
        if (result.data) {
          return result;
        }
      } catch (error) {
        console.warn('API de fallback indisponible');
      }

      // Si toutes les APIs échouent, on retourne la validation basique
      return {
        data: {
          isValid: true, // Format valide
          error: 'Validation complète indisponible, format vérifié uniquement',
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: {
          isValid: false,
          error: `Erreur lors de la validation: ${error.message}`,
        },
        error: error.message,
      };
    }
  }

  /**
   * Appel à l'API INSEE officielle
   */
  private async callINSEEAPI(siret: string): Promise<ServiceResponse<SiretValidationResult>> {
    const url = `${this.API_BASE_URL}/siret/${siret}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'Eagle-Golf-App/1.0',
    };

    // Debug du token
    console.log('🔑 Token INSEE disponible:', this.API_TOKEN ? 'OUI' : 'NON');
    console.log('🔑 Token value:', this.API_TOKEN?.substring(0, 8) + '...');

    // Ajout du token si disponible (nouveau format API 3.11)
    if (this.API_TOKEN) {
      headers['X-INSEE-Api-Key-Integration'] = this.API_TOKEN;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API INSEE error: ${response.status}`);
    }

    const data: INSEESireneResponse = await response.json();

    if (data.header.statut !== 200 || !data.etablissement) {
      return {
        data: {
          isValid: false,
          error: data.header.message || 'SIRET non trouvé',
        },
        error: null,
      };
    }

    const etablissement = data.etablissement;
    const uniteLegale = etablissement.uniteLegale;

    // Construction de l'adresse
    const addr = etablissement.adresseEtablissement;
    const address = [
      addr.numeroVoieEtablissement,
      addr.typeVoieEtablissement,
      addr.libelleVoieEtablissement,
      addr.codePostalEtablissement,
      addr.libelleCommuneEtablissement,
    ]
      .filter(Boolean)
      .join(' ');

    // Nom de l'entreprise
    const companyName =
      uniteLegale.denominationUniteLegale ||
      `${uniteLegale.nomUniteLegale || ''} ${uniteLegale.prenomUsuelUniteLegale || ''}`.trim();

    // Mapping automatique du statut d'entreprise
    const mappedCompanyStatus = this.mapLegalStatusToCompanyStatus(
      uniteLegale.categorieJuridiqueUniteLegale
    );

    return {
      data: {
        isValid: true,
        companyName,
        address,
        legalStatus: uniteLegale.categorieJuridiqueUniteLegale,
        mappedCompanyStatus,
        isActive:
          etablissement.etatAdministratifEtablissement === 'A' &&
          uniteLegale.etatAdministratifUniteLegale === 'A',
        establishmentState:
          etablissement.etatAdministratifEtablissement === 'A' ? 'ACTIVE' : 'CLOSED',
        lastUpdated: etablissement.dateDernierTraitementEtablissement,
      },
      error: null,
    };
  }

  /**
   * Appel à l'API de fallback (API Entreprise)
   */
  private async callFallbackAPI(siret: string): Promise<ServiceResponse<SiretValidationResult>> {
    const url = `${this.FALLBACK_API_URL}/${siret}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Eagle-Golf-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Fallback API error: ${response.status}`);
    }

    const data = await response.json();

    // Format de l'API Entreprise différent, adaptation nécessaire
    if (!data.etablissement) {
      return {
        data: {
          isValid: false,
          error: 'SIRET non trouvé (API de fallback)',
        },
        error: null,
      };
    }

    return {
      data: {
        isValid: true,
        companyName: data.etablissement.unite_legale?.denomination || 'Non disponible',
        address: 'Adresse non disponible via API de fallback',
        isActive: data.etablissement.etat_administratif === 'A',
        establishmentState: data.etablissement.etat_administratif === 'A' ? 'ACTIVE' : 'CLOSED',
        error: 'Données limitées (API de fallback)',
      },
      error: null,
    };
  }
}

// Instance singleton
export const siretValidationService = new SiretValidationService();
