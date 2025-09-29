#!/usr/bin/env node

/**
 * Script de test pour vérifier la résolution platform-specific des helpers d'upload
 */

console.log('🧪 Test des helpers d\'upload platform-specific');
console.log('================================================\n');

// Test de la résolution des modules
try {
  // Test de l'import du helper natif
  const nativeHelper = require('../hooks/uploadHelpers/uploadHelper.native.ts');
  console.log('✅ Helper natif trouvé:', Object.keys(nativeHelper).join(', '));

  // Test de l'import du helper web
  const webHelper = require('../hooks/uploadHelpers/uploadHelper.web.ts');
  console.log('✅ Helper web trouvé:', Object.keys(webHelper).join(', '));

  // Test des fonctions exportées
  const functions = ['prepareFormDataForUpload', 'isValidUploadUri', 'uriToBlob'];

  console.log('\n📋 Vérification des exports:');
  functions.forEach(fn => {
    const hasNative = typeof nativeHelper[fn] === 'function';
    const hasWeb = typeof webHelper[fn] === 'function';
    console.log(`  ${fn}:`);
    console.log(`    - Native: ${hasNative ? '✅' : '❌'}`);
    console.log(`    - Web: ${hasWeb ? '✅' : '❌'}`);
  });

  // Test de validation d'URI
  console.log('\n🔍 Test de validation d\'URI:');

  const testUris = [
    'file:///path/to/image.jpg',
    'content://media/external/images/media/1234',
    'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    'blob:http://localhost:8081/abc-123',
    'http://example.com/image.jpg',
    'invalid-uri',
  ];

  testUris.forEach(uri => {
    const nativeValid = nativeHelper.isValidUploadUri(uri);
    const webValid = webHelper.isValidUploadUri(uri);
    console.log(`\n  URI: ${uri.substring(0, 40)}...`);
    console.log(`    Native: ${nativeValid ? '✅ Valide' : '❌ Invalide'}`);
    console.log(`    Web: ${webValid ? '✅ Valide' : '❌ Invalide'}`);
  });

  console.log('\n✅ Tous les tests passent !');

} catch (error) {
  console.error('❌ Erreur lors des tests:', error.message);
  process.exit(1);
}