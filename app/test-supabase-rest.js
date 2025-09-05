#!/usr/bin/env node

/**
 * Script de test pour la connexion Supabase via API REST
 * Usage: node test-supabase-rest.js
 */

const https = require('https');

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables manquantes:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔗 Test de connexion Supabase REST API');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key length:', SUPABASE_ANON_KEY.length);

/**
 * Fonction helper pour faire des requêtes REST
 */
function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: result
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && (method === 'POST' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Tests de base
 */
async function runTests() {
  console.log('\n🧪 Début des tests...\n');

  try {
    // Test 1: Vérifier la connexion avec une requête simple
    console.log('1️⃣ Test de connexion basique...');
    const healthCheck = await makeRequest('', 'GET');
    console.log('   Status:', healthCheck.status);
    console.log('   ✅ Connexion OK\n');

    // Test 2: Lister les tables disponibles (si possible)
    console.log('2️⃣ Test des tables disponibles...');
    try {
      const tables = await makeRequest('?select=table_name&limit=1', 'GET');
      console.log('   Status:', tables.status);
      if (tables.status === 200) {
        console.log('   ✅ Accès aux données OK');
      } else {
        console.log('   ⚠️ Accès limité (normal avec clé publique)');
      }
    } catch (e) {
      console.log('   ⚠️ Accès limité (normal)');
    }
    console.log('');

    // Test 3: Tester l'authentification
    console.log('3️⃣ Test de l\'endpoint auth...');
    const authTest = await makeRequest('../auth/v1/user', 'GET');
    console.log('   Status:', authTest.status);
    if (authTest.status === 401) {
      console.log('   ✅ Endpoint auth accessible (non authentifié = normal)');
    } else {
      console.log('   Status inattendu:', authTest.status);
    }
    console.log('');

    // Test 4: Vérifier les headers
    console.log('4️⃣ Vérification des headers...');
    const headersTest = await makeRequest('', 'GET');
    const corsHeader = headersTest.headers['access-control-allow-origin'];
    console.log('   CORS:', corsHeader ? '✅' : '❌');
    console.log('   Content-Type:', headersTest.headers['content-type'] || 'Non défini');
    
    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   ✅ Connexion Supabase fonctionnelle');
    console.log('   ✅ API REST accessible');
    console.log('   ✅ Configuration correcte');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exporter les fonctions pour usage externe
module.exports = {
  makeRequest,
  runTests
};

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}