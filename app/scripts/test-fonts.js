#!/usr/bin/env node

/**
 * Script de test pour vérifier l'installation des polices Inter
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de l\'installation des polices Inter...\n');

// Vérifier le package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

if (packageJson.dependencies['@expo-google-fonts/inter']) {
  console.log('✅ Package @expo-google-fonts/inter installé:', packageJson.dependencies['@expo-google-fonts/inter']);
} else {
  console.log('❌ Package @expo-google-fonts/inter non trouvé dans package.json');
}

// Vérifier le fichier _layout.tsx
const layoutPath = path.join(__dirname, '..', 'app', '_layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

const interImports = [
  'Inter_300Light',
  'Inter_400Regular',
  'Inter_500Medium',
  'Inter_600SemiBold',
  'Inter_700Bold',
  'Inter_800ExtraBold'
];

console.log('\n📝 Imports dans _layout.tsx:');
interImports.forEach(importName => {
  if (layoutContent.includes(importName)) {
    console.log(`  ✅ ${importName} importé`);
  } else {
    console.log(`  ❌ ${importName} manquant`);
  }
});

// Vérifier useFonts
const fontConfigs = [
  'Inter-Light',
  'Inter-Regular',
  'Inter-Medium',
  'Inter-SemiBold',
  'Inter-Bold',
  'Inter-ExtraBold'
];

console.log('\n🔤 Configuration des polices dans useFonts:');
fontConfigs.forEach(fontName => {
  if (layoutContent.includes(`'${fontName}'`)) {
    console.log(`  ✅ ${fontName} configuré`);
  } else {
    console.log(`  ❌ ${fontName} non configuré`);
  }
});

// Vérifier le composant Text
const textPath = path.join(__dirname, '..', 'components', 'atoms', 'Text.tsx');
const textContent = fs.readFileSync(textPath, 'utf-8');

console.log('\n📱 Utilisation dans le composant Text:');
const textFonts = ['Inter-Regular', 'Inter-Medium', 'Inter-SemiBold', 'Inter-Bold'];
textFonts.forEach(fontName => {
  const count = (textContent.match(new RegExp(`'${fontName}'`, 'g')) || []).length;
  if (count > 0) {
    console.log(`  ✅ ${fontName} utilisé ${count} fois`);
  } else {
    console.log(`  ❌ ${fontName} non utilisé`);
  }
});

console.log('\n✨ Configuration des polices Inter terminée !');
console.log('\n📌 Pour tester visuellement:');
console.log('  1. Redémarrer l\'app Expo: npm start');
console.log('  2. Actualiser l\'app sur votre simulateur/device');
console.log('  3. Vérifier que les textes utilisent bien la police Inter');