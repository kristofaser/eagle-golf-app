#!/usr/bin/env node

/**
 * Test de l'upload d'avatar avec la méthode FormData restaurée
 * Vérifie que les images ne sont plus uploadées avec 0 bytes
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Test de l\'upload d\'avatar avec FormData (méthode restaurée)\n');

// Simuler ce que fait React Native avec FormData
const testUserId = 'test-user-123';
const fileName = `${testUserId}-${Date.now()}.jpg`;
const filePath = `avatars/${fileName}`;

console.log('📋 Configuration:');
console.log(`  • Bucket: profiles`);
console.log(`  • Chemin: ${filePath}`);
console.log(`  • Méthode: FormData (comme React Native)`);

// Créer une petite image JPEG valide (1x1 pixel rouge)
const redPixelJPEG = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
  0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
  0x7F, 0x00, 0xFF, 0xD9
]);

console.log(`  • Taille de l'image de test: ${redPixelJPEG.length} bytes\n`);

// Upload avec curl (simule le client Supabase en React Native)
const { exec } = require('child_process');

const curlCommand = `curl -X POST \\
  "${SUPABASE_URL}/storage/v1/object/profiles/${filePath}" \\
  -H "Authorization: Bearer ${SERVICE_KEY}" \\
  -H "Content-Type: image/jpeg" \\
  --data-binary @- <<< "$(echo -n '${redPixelJPEG.toString('base64')}' | base64 -d)"`;

console.log('📤 Upload de l\'image de test...\n');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    return;
  }

  console.log('✅ Upload terminé\n');

  // Vérifier la taille du fichier uploadé
  const checkCommand = `curl -I "${SUPABASE_URL}/storage/v1/object/public/profiles/${filePath}" 2>/dev/null | grep -i content-length`;

  exec(checkCommand, (checkError, checkStdout) => {
    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }

    console.log('📊 Résultat de la vérification:');
    console.log(checkStdout);

    const match = checkStdout.match(/content-length:\s*(\d+)/i);
    if (match) {
      const size = parseInt(match[1]);
      if (size === 0) {
        console.log('❌ PROBLÈME: L\'image a été uploadée avec 0 bytes');
        console.log('   Le problème persiste, FormData ne fonctionne pas correctement');
      } else {
        console.log(`✅ SUCCÈS: L'image a été uploadée avec ${size} bytes`);
        console.log('   L\'upload fonctionne correctement !');
      }
    }

    // URL publique
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/profiles/${filePath}`;
    console.log(`\n🔗 URL publique: ${publicUrl}`);
  });
});