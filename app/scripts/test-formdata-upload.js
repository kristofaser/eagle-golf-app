#!/usr/bin/env node

/**
 * Test de l'upload avec FormData vers Supabase
 * Pour vérifier que l'approche FormData fonctionne correctement
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testFormDataUpload() {
  console.log('🧪 Test de l\'upload avec FormData vers Supabase\n');

  // Créer une image de test (1x1 pixel rouge)
  const redPixel = Buffer.from([
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

  const testFileName = `test-${Date.now()}.jpg`;
  const testFilePath = `avatars/${testFileName}`;

  try {
    // Test 1: Upload direct avec Buffer
    console.log('📤 Test 1: Upload direct avec Buffer...');
    const uploadResponse1 = await fetch(
      `${SUPABASE_URL}/storage/v1/object/profiles/${testFilePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'image/jpeg'
        },
        body: redPixel
      }
    );

    if (uploadResponse1.ok) {
      console.log('✅ Upload avec Buffer réussi');

      // Vérifier la taille
      const checkResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/public/profiles/${testFilePath}`,
        { method: 'HEAD' }
      );

      const contentLength = checkResponse.headers.get('content-length');
      console.log(`📊 Taille du fichier: ${contentLength} bytes`);

      if (contentLength === '0') {
        console.log('❌ Le fichier est vide (0 bytes)');
      } else {
        console.log('✅ Le fichier a du contenu');
      }
    } else {
      console.log('❌ Upload échoué:', await uploadResponse1.text());
    }

    // Test 2: Upload avec FormData (comme React Native)
    console.log('\n📤 Test 2: Upload avec FormData...');
    const formData = new FormData();
    formData.append('file', redPixel, {
      filename: testFileName,
      contentType: 'image/jpeg'
    });

    const testFilePath2 = `avatars/formdata-${testFileName}`;
    const uploadResponse2 = await fetch(
      `${SUPABASE_URL}/storage/v1/object/profiles/${testFilePath2}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      }
    );

    if (uploadResponse2.ok) {
      console.log('✅ Upload avec FormData réussi');

      // Vérifier la taille
      const checkResponse2 = await fetch(
        `${SUPABASE_URL}/storage/v1/object/public/profiles/${testFilePath2}`,
        { method: 'HEAD' }
      );

      const contentLength2 = checkResponse2.headers.get('content-length');
      console.log(`📊 Taille du fichier: ${contentLength2} bytes`);

      if (contentLength2 === '0') {
        console.log('❌ Le fichier est vide (0 bytes)');
      } else {
        console.log('✅ Le fichier a du contenu');
      }
    } else {
      console.log('❌ Upload avec FormData échoué:', await uploadResponse2.text());
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testFormDataUpload();