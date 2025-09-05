#!/usr/bin/env node

/**
 * Script de test pour le service de validation SIRET
 * Usage: node scripts/test-siret-validation.js [siret]
 */

// Import du service (adaptation pour Node.js)
const fetch = require('node-fetch');

// Simulation du service pour test en Node.js
class TestSiretValidationService {
  constructor() {
    this.API_BASE_URL = 'https://api.insee.fr/entreprises/sirene/V3';
    this.FALLBACK_API_URL = 'https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements';
  }

  /**
   * Validation basique du format SIRET
   */
  isValidSiretFormat(siret) {
    if (!siret || siret.length !== 14) return false;
    if (!/^\d{14}$/.test(siret)) return false;
    return this.validateSiretLuhn(siret);
  }

  /**
   * Validation SIRET avec algorithme de Luhn (selon spécification INSEE)
   */
  validateSiretLuhn(siret) {
    const digits = siret.split('').map(Number);
    
    // Cas spécial La Poste (SIREN 356000000)
    if (siret.startsWith('356000000')) {
      const sum = digits.reduce((total, digit) => total + digit, 0);
      return sum % 5 === 0;
    }
    
    // Algorithme standard de Luhn
    let sum = 0;
    
    // On parcourt de droite à gauche
    for (let i = 0; i < 14; i++) {
      let digit = digits[13 - i]; // Index inversé pour partir de la droite
      
      // Les positions paires en partant de la droite sont multipliées par 2
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Test de validation complète
   */
  async validateSiret(siret) {
    console.log(`\n🔍 Test validation SIRET: ${siret}`);
    console.log('=' .repeat(50));

    // 1. Test format basique
    const isValidFormat = this.isValidSiretFormat(siret);
    console.log(`📋 Format valide: ${isValidFormat ? '✅' : '❌'}`);
    
    if (!isValidFormat) {
      return { isValid: false, error: 'Format invalide' };
    }

    // 2. Test API INSEE (sans authentification pour le moment)
    try {
      console.log('🌐 Test API INSEE...');
      const result = await this.callPublicAPI(siret);
      return result;
    } catch (error) {
      console.log(`❌ Erreur API: ${error.message}`);
      return { 
        isValid: true, // Format OK
        error: 'API indisponible, format vérifié uniquement' 
      };
    }
  }

  /**
   * Appel API publique simplifiée
   */
  async callPublicAPI(siret) {
    // Pour le test, on utilise l'API publique data.gouv.fr
    const url = `https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements/${siret}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Eagle-Golf-Test/1.0'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.etablissement) {
        const etab = data.etablissement;
        const result = {
          isValid: true,
          companyName: etab.unite_legale?.denomination || 
                      `${etab.unite_legale?.nom || ''} ${etab.unite_legale?.prenom_usuel || ''}`.trim() ||
                      'Nom non disponible',
          address: this.formatAddress(etab.adresse || {}),
          isActive: etab.etat_administratif === 'A',
          establishmentState: etab.etat_administratif === 'A' ? 'ACTIVE' : 'CLOSED',
          lastUpdated: etab.date_dernier_traitement
        };

        // Affichage des résultats
        console.log('✅ SIRET trouvé dans la base INSEE');
        console.log(`🏢 Entreprise: ${result.companyName}`);
        console.log(`📍 Adresse: ${result.address}`);
        console.log(`📊 Statut: ${result.isActive ? 'Actif' : 'Fermé'} (${result.establishmentState})`);
        if (result.lastUpdated) {
          console.log(`📅 Dernière MAJ: ${result.lastUpdated}`);
        }

        return result;
      } else {
        console.log('❌ SIRET non trouvé dans la base INSEE');
        return {
          isValid: false,
          error: 'SIRET non trouvé dans la base INSEE'
        };
      }
    } catch (error) {
      throw new Error(`Erreur API: ${error.message}`);
    }
  }

  formatAddress(address) {
    const parts = [
      address.numero_voie,
      address.type_voie, 
      address.libelle_voie,
      address.code_postal,
      address.libelle_commune
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(' ') : 'Adresse non disponible';
  }
}

// Tests automatisés avec différents SIRET
async function runTests() {
  const service = new TestSiretValidationService();
  
  // SIRET de test (valides générés)
  const testCases = [
    {
      name: 'Apple France (valide)',
      siret: '54210922700018' // Apple France - SIRET valide généré
    },
    {
      name: 'Google France (valide)', 
      siret: '44306184100013' // Google France - SIRET valide généré
    },
    {
      name: 'La Poste (cas spécial)',
      siret: '35600000000010' // La Poste - validation spéciale
    },
    {
      name: 'Format invalide (13 chiffres)',
      siret: '5420109227001' // Trop court
    },
    {
      name: 'Format invalide (lettres)',
      siret: '54210922700ABC'
    },
    {
      name: 'SIRET format OK mais clé invalide',
      siret: '54210922700019' // Même base qu'Apple mais clé +1 = invalide
    }
  ];

  console.log('🧪 LANCEMENT DES TESTS AUTOMATISÉS');
  console.log('=' .repeat(60));

  for (const testCase of testCases) {
    console.log(`\n🎯 Test: ${testCase.name}`);
    const result = await service.validateSiret(testCase.siret);
    
    // Résumé du résultat
    if (result.isValid) {
      console.log(`✅ Résultat: VALIDE ${result.companyName ? `(${result.companyName})` : ''}`);
    } else {
      console.log(`❌ Résultat: INVALIDE (${result.error})`);
    }
    
    // Attendre un peu entre les appels pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test avec SIRET en paramètre ou tests automatisés
async function main() {
  const siretArg = process.argv[2];
  
  if (siretArg) {
    // Test d'un SIRET spécifique
    const service = new TestSiretValidationService();
    await service.validateSiret(siretArg);
  } else {
    // Tests automatisés
    await runTests();
  }
  
  console.log('\n✨ Tests terminés !');
}

// Installation des dépendances si nécessaire
if (typeof fetch === 'undefined') {
  console.log('⚠️  Installation de node-fetch nécessaire:');
  console.log('npm install node-fetch');
  process.exit(1);
}

main().catch(error => {
  console.error('💥 Erreur:', error);
  process.exit(1);
});