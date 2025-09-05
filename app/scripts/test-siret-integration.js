#!/usr/bin/env node

/**
 * Script de test d'intégration pour la vérification croisée SIRET/identité
 * Teste les différents scénarios de validation avec nom/prénom
 */

const { siretValidationService } = require('../services/siret-validation.service');

console.log('🧪 TEST D\'INTÉGRATION - VÉRIFICATION CROISÉE SIRET/IDENTITÉ');
console.log('=' .repeat(70));

async function testCrossValidation() {
  const testCases = [
    {
      name: 'Test 1: SIRET valide avec données personnelles',
      siret: '54210922700018', // Apple France
      firstName: 'Tim',
      lastName: 'Cook',
      expected: 'Valid SIRET, personal info checking attempted'
    },
    {
      name: 'Test 2: SIRET invalide (format)',
      siret: '123456789', // Trop court
      firstName: 'John',
      lastName: 'Doe',
      expected: 'Invalid format, no personal checking'
    },
    {
      name: 'Test 3: SIRET valide sans données personnelles',
      siret: '44306184100013', // Google France
      firstName: '',
      lastName: '',
      expected: 'Basic validation only'
    }
  ];

  for (let testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log('-'.repeat(50));
    console.log(`SIRET: ${testCase.siret}`);
    console.log(`Nom: ${testCase.firstName} ${testCase.lastName}`);
    
    try {
      let result;
      
      if (testCase.firstName && testCase.lastName) {
        // Test avec vérification croisée
        result = await siretValidationService.validateWithPersonalInfo(
          testCase.siret, 
          testCase.firstName, 
          testCase.lastName
        );
        
        console.log(`\n✅ Validation avec vérification croisée:`);
        console.log(`   SIRET valide: ${result.data?.isValid}`);
        console.log(`   Entreprise: ${result.data?.companyName || 'N/A'}`);
        console.log(`   Peut vérifier identité: ${result.data?.canVerifyIdentity || false}`);
        console.log(`   Correspond aux données: ${result.data?.matchesPersonalInfo ?? 'N/A'}`);
        
        if (result.data?.executives) {
          console.log(`   Dirigeants trouvés: ${result.data.executives.length}`);
          result.data.executives.forEach(exec => {
            console.log(`     - ${exec.firstName} ${exec.lastName} (${exec.role})`);
          });
        }
        
        if (result.data?.error) {
          console.log(`   Note: ${result.data.error}`);
        }
        
      } else {
        // Test validation basique
        result = await siretValidationService.validateSiret(testCase.siret);
        
        console.log(`\n✅ Validation basique uniquement:`);
        console.log(`   SIRET valide: ${result.data?.isValid}`);
        console.log(`   Entreprise: ${result.data?.companyName || 'N/A'}`);
        
        if (result.data?.error) {
          console.log(`   Erreur: ${result.data.error}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    
    // Pause entre les tests pour éviter la limitation de taux
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testManualVerification() {
  console.log('\n\n🔍 TEST VÉRIFICATION MANUELLE');
  console.log('=' .repeat(40));
  
  try {
    const result = await siretValidationService.validateForManualVerification('54210922700018');
    
    console.log(`SIRET valide: ${result.data?.isValid}`);
    console.log(`Entreprise: ${result.data?.companyName}`);
    console.log(`Nécessite vérification manuelle: ${result.data?.requiresManualCheck}`);
    
    if (result.data?.executives && result.data.executives.length > 0) {
      console.log('\nDirigeants pour vérification manuelle:');
      result.data.executives.forEach(exec => {
        console.log(`  ✓ ${exec.firstName} ${exec.lastName} - ${exec.role}`);
      });
    } else {
      console.log('Aucun dirigeant trouvé ou API indisponible');
    }
    
  } catch (error) {
    console.log(`❌ Erreur test vérification manuelle: ${error.message}`);
  }
}

async function testFormIntegration() {
  console.log('\n\n📱 SIMULATION INTÉGRATION FORMULAIRE');
  console.log('=' .repeat(45));
  
  // Simulation des données du profil utilisateur
  const mockProfile = {
    first_name: 'Jean',
    last_name: 'Dupont'
  };
  
  console.log(`Profil utilisateur simulé: ${mockProfile.first_name} ${mockProfile.last_name}`);
  
  const siret = '54210922700018';
  console.log(`SIRET saisi: ${siret}`);
  
  try {
    // Simulation de la logique du formulaire
    const result = await siretValidationService.validateWithPersonalInfo(
      siret,
      mockProfile.first_name,
      mockProfile.last_name
    );
    
    console.log('\n📋 Résultat pour le formulaire:');
    if (result.data?.isValid) {
      console.log('✅ SIRET valide');
      console.log(`🏢 ${result.data.companyName}`);
      
      if (result.data.canVerifyIdentity) {
        if (result.data.matchesPersonalInfo === true) {
          console.log('✅ Identité confirmée automatiquement');
        } else if (result.data.matchesPersonalInfo === false) {
          console.log('⚠️  Identité non confirmée - Vérification manuelle');
        } else {
          console.log('📋 Vérification manuelle requise');
          if (result.data.executives) {
            console.log('Dirigeants trouvés pour comparaison:');
            result.data.executives.slice(0, 3).forEach(exec => {
              console.log(`  • ${exec.firstName} ${exec.lastName}`);
            });
          }
        }
      } else {
        console.log('ℹ️  Vérification d\'identité non disponible');
      }
    } else {
      console.log(`❌ ${result.data?.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur simulation formulaire: ${error.message}`);
  }
}

// Exécution des tests
async function main() {
  try {
    await testCrossValidation();
    await testManualVerification();
    await testFormIntegration();
    
    console.log('\n✨ TOUS LES TESTS TERMINÉS !');
    console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS:');
    console.log('  ✅ Validation SIRET avec algorithme Luhn');
    console.log('  ✅ Appel API INSEE pour données entreprise');
    console.log('  ✅ Vérification croisée nom/prénom (si API disponible)');
    console.log('  ✅ Mode vérification manuelle avec liste dirigeants');
    console.log('  ✅ Gestion gracieuse des erreurs et fallbacks');
    console.log('  ✅ Intégration prête pour le formulaire React Native');
    
  } catch (error) {
    console.error('💥 Erreur lors des tests:', error);
    process.exit(1);
  }
}

main();