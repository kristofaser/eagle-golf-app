#!/usr/bin/env node

/**
 * Script de test pour vérifier que l'upload d'image fonctionne
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test de la correction de l\'upload d\'image\n');

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const success = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);

let hasErrors = false;

// Test 1: Vérifier que ProfileService est importé correctement
console.log('📁 1. Vérification de l\'import ProfileService...');
const useImageUploadPath = path.join(__dirname, '..', 'hooks', 'useImageUpload.ts');
const useImageUploadContent = fs.readFileSync(useImageUploadPath, 'utf8');

if (useImageUploadContent.includes("import { profileService } from '@/services/profile.service'")) {
  success('Import profileService correct (instance, pas classe)');
} else if (useImageUploadContent.includes("import { ProfileService } from")) {
  error('Import ProfileService incorrect (classe au lieu d\'instance)');
  hasErrors = true;
} else {
  error('Import ProfileService non trouvé');
  hasErrors = true;
}

// Test 2: Vérifier qu'on n'instancie pas ProfileService
console.log('\n📁 2. Vérification de l\'utilisation de ProfileService...');
if (useImageUploadContent.includes('new ProfileService()')) {
  error('ProfileService est instancié avec "new" (ne devrait pas)');
  hasErrors = true;
} else {
  success('ProfileService n\'est pas instancié avec "new"');
}

// Test 3: Vérifier que MediaTypeOptions a été remplacé
console.log('\n📁 3. Vérification de MediaTypeOptions...');
if (useImageUploadContent.includes('MediaTypeOptions')) {
  error('MediaTypeOptions est encore utilisé (deprecated)');
  hasErrors = true;
} else if (useImageUploadContent.includes("mediaTypes: ['images']")) {
  success('Utilise le nouveau format mediaTypes');
} else {
  error('Format mediaTypes non trouvé');
  hasErrors = true;
}

// Test 4: Vérifier que profileService est exporté correctement
console.log('\n📁 4. Vérification de l\'export dans profile.service.ts...');
const profileServicePath = path.join(__dirname, '..', 'services', 'profile.service.ts');
const profileServiceContent = fs.readFileSync(profileServicePath, 'utf8');

if (profileServiceContent.includes('export const profileService = new ProfileService()')) {
  success('profileService est bien exporté comme instance');
} else if (profileServiceContent.includes('export class ProfileService')) {
  error('ProfileService est exporté comme classe (devrait être une instance)');
  hasErrors = true;
} else {
  info('Export profileService non standard');
}

// Test 5: Vérifier uploadProfileImage dans ProfileService
console.log('\n📁 5. Vérification de uploadProfileImage...');
if (profileServiceContent.includes('uploadProfileImage')) {
  success('Méthode uploadProfileImage existe dans ProfileService');
} else {
  error('Méthode uploadProfileImage non trouvée');
  hasErrors = true;
}

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DE LA CORRECTION');
console.log('='.repeat(50));

if (!hasErrors) {
  console.log(`\n${colors.green}🎉 SUCCÈS : Les corrections sont appliquées !${colors.reset}`);
  console.log('\n💡 Pour tester :');
  console.log('  1. Relance l\'app : npx expo start -c --port 8082');
  console.log('  2. Va dans Profil → Modifier le profil');
  console.log('  3. Sélectionne une photo');
  console.log('  4. L\'upload devrait fonctionner sans erreur');
  console.log('\n📌 Changements appliqués :');
  console.log('  • Import profileService (instance) au lieu de ProfileService (classe)');
  console.log('  • MediaTypeOptions remplacé par [\'images\']');
  console.log('  • Pas d\'instanciation avec new ProfileService()');
} else {
  console.log(`\n${colors.red}⚠️  ATTENTION : Des problèmes subsistent${colors.reset}`);
  console.log('Corrigez les erreurs ci-dessus avant de tester.');
}

process.exit(hasErrors ? 1 : 0);