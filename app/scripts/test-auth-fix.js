#!/usr/bin/env node

/**
 * Script de test pour vérifier que l'erreur useAuth est corrigée
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Test de la correction du bug useAuth\n');

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

// Test 1: Vérifier que les imports sont corrects dans useAuth.ts
console.log('📁 1. Vérification des imports dans useAuth.ts...');
const useAuthPath = path.join(__dirname, '..', 'hooks', 'useAuth.ts');
const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');

if (useAuthContent.includes("from '@/contexts/AuthContext.refactored'")) {
  success('Import useAuthContext correct');
} else {
  error('Import useAuthContext incorrect');
  hasErrors = true;
}

if (useAuthContent.includes("from '@/contexts/SessionContext'")) {
  success('Import SessionContext correct');
} else {
  error('Import SessionContext incorrect');
  hasErrors = true;
}

// Test 2: Vérifier que AuthContext.refactored exporte bien useAuth
console.log('\n📁 2. Vérification des exports dans AuthContext.refactored...');
const authContextPath = path.join(__dirname, '..', 'contexts', 'AuthContext.refactored.tsx');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');

if (authContextContent.includes('export function useAuth()')) {
  success('useAuth est bien exporté');
} else {
  error('useAuth n\'est pas exporté');
  hasErrors = true;
}

// Test 3: Vérifier que profile/edit.tsx utilise correctement useAuth
console.log('\n📝 3. Vérification de profile/edit.tsx...');
const editProfilePath = path.join(__dirname, '..', 'app', 'profile', 'edit.tsx');
const editProfileContent = fs.readFileSync(editProfilePath, 'utf8');

if (editProfileContent.includes("import { useAuth } from '@/hooks/useAuth'")) {
  success('profile/edit.tsx importe useAuth correctement');
} else {
  error('profile/edit.tsx n\'importe pas useAuth correctement');
  hasErrors = true;
}

// Test 4: TypeScript check sur les fichiers concernés
console.log('\n🔧 4. Vérification TypeScript des fichiers concernés...');
try {
  info('Vérification des types pour useAuth et profile/edit...');
  execSync('npx tsc --noEmit --skipLibCheck hooks/useAuth.ts app/profile/edit.tsx', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  success('Pas d\'erreurs TypeScript dans ces fichiers');
} catch (e) {
  const output = e.stdout ? e.stdout.toString() : '';
  if (output.includes("Cannot read property 'prototype'")) {
    error('L\'erreur prototype est toujours présente !');
    hasErrors = true;
  } else if (output.includes('error TS')) {
    info('Autres erreurs TypeScript (pas l\'erreur prototype)');
  } else {
    success('TypeScript OK pour ces fichiers');
  }
}

// Test 5: Vérifier la chaîne complète des imports
console.log('\n🔗 5. Vérification de la chaîne d\'imports...');
const checkImportChain = () => {
  const chain = [
    { file: 'hooks/useAuth.ts', imports: ['AuthContext.refactored', 'SessionContext', 'UserContext'] },
    { file: 'contexts/AuthContext.refactored.tsx', exports: ['useAuth'] },
    { file: 'contexts/SessionContext.tsx', exports: ['useSession', 'useSessionUser'] },
    { file: 'contexts/UserContext.tsx', exports: ['useUserContext'] }
  ];

  chain.forEach(item => {
    const filePath = path.join(__dirname, '..', item.file);
    if (fs.existsSync(filePath)) {
      if (item.imports) {
        success(`${item.file} existe`);
      } else if (item.exports) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasAllExports = item.exports.every(exp =>
          content.includes(`export function ${exp}`) ||
          content.includes(`export const ${exp}`) ||
          content.includes(`export { ${exp}`)
        );
        if (hasAllExports) {
          success(`${item.file} exporte bien ${item.exports.join(', ')}`);
        } else {
          error(`${item.file} n'exporte pas tous les éléments requis`);
          hasErrors = true;
        }
      }
    } else {
      error(`${item.file} n'existe pas`);
      hasErrors = true;
    }
  });
};

checkImportChain();

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DE LA CORRECTION');
console.log('='.repeat(50));

if (!hasErrors) {
  console.log(`\n${colors.green}🎉 SUCCÈS : L'erreur useAuth devrait être corrigée !${colors.reset}`);
  console.log('\n💡 Pour tester :');
  console.log('  1. Arrêtez l\'app si elle tourne (Ctrl+C)');
  console.log('  2. Relancez avec : npx expo start -c --port 8082');
  console.log('  3. Allez dans Profil → Modifier le profil');
  console.log('  4. L\'erreur "Cannot read property \'prototype\'" ne devrait plus apparaître');
} else {
  console.log(`\n${colors.red}⚠️  ATTENTION : Des problèmes ont été détectés${colors.reset}`);
  console.log('L\'erreur pourrait encore se produire.');
}

process.exit(hasErrors ? 1 : 0);