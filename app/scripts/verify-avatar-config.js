#!/usr/bin/env node

/**
 * Script pour vérifier la configuration des avatars
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration des avatars\n');

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const success = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
const warning = (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);

// Vérifier ProfileService
const profileServicePath = path.join(__dirname, '..', 'services', 'profile.service.ts');
const profileServiceContent = fs.readFileSync(profileServicePath, 'utf8');

console.log('📦 Configuration du bucket et chemin:\n');

// Vérifier le bucket utilisé
if (profileServiceContent.includes(".from('profiles')")) {
  success("Utilise le bucket 'profiles' (correct)");
} else if (profileServiceContent.includes(".from('avatars')")) {
  error("Utilise le bucket 'avatars' (incorrect - devrait être 'profiles')");
}

// Vérifier le chemin
if (profileServiceContent.includes("const filePath = `avatars/${fileName}`") ||
    profileServiceContent.includes("const filePath = `avatars/${userId}")) {
  success("Utilise le sous-dossier 'avatars/' (correct)");
} else if (profileServiceContent.includes("const filePath = fileName") ||
           profileServiceContent.includes("const filePath = `${userId}")) {
  error("N'utilise pas de sous-dossier (incorrect - devrait être 'avatars/')");
}

console.log('\n📊 Configuration attendue:');
console.log('  • Bucket: profiles');
console.log('  • Chemin: avatars/userId-timestamp.jpg');
console.log('  • URL finale: .../storage/v1/object/public/profiles/avatars/userId-timestamp.jpg');

console.log('\n💾 Structure dans Supabase:');
console.log('  bucket: profiles/');
console.log('    └── avatars/');
console.log('        ├── userId1-timestamp1.jpg');
console.log('        ├── userId2-timestamp2.jpg');
console.log('        └── ...');

console.log('\n' + '='.repeat(50));
console.log('📋 RÉSUMÉ');
console.log('='.repeat(50));

info('\nConfiguration correcte pour le système Eagle:');
console.log('  1. Bucket "profiles" (public)');
console.log('  2. Sous-dossier "avatars/"');
console.log('  3. Format: avatars/userId-timestamp.jpg');
console.log('\n💡 Cette configuration est cohérente avec les données existantes dans Supabase.');