#!/usr/bin/env node

/**
 * Script pour vérifier la structure de la table pro_profiles
 * et chercher les types d'entreprises disponibles
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables manquantes dans .env.local');
  process.exit(1);
}

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
        'Accept': 'application/json'
      }
    };

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
            data: result,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function checkCompanyStatuses() {
  console.log('🔍 VÉRIFICATION DES STATUTS D\'ENTREPRISE');
  console.log('=' .repeat(50));

  try {
    // Test 1: Vérifier la structure pro_profiles
    console.log('\n1️⃣ Structure de la table pro_profiles...');
    
    // Récupérer quelques entrées pour voir la structure
    const proProfiles = await makeRequest('pro_profiles?select=company_status&limit=10');
    console.log('Status:', proProfiles.status);
    
    if (proProfiles.status === 200) {
      console.log('✅ Accès à pro_profiles réussi');
      console.log('Données:', JSON.stringify(proProfiles.data, null, 2));
      
      // Extraire les valeurs uniques de company_status
      const uniqueStatuses = [...new Set(proProfiles.data
        .map(row => row.company_status)
        .filter(status => status !== null))];
      
      console.log('\n📊 Statuts d\'entreprise trouvés:');
      uniqueStatuses.forEach(status => {
        console.log(`  • ${status}`);
      });
      
    } else {
      console.log('❌ Erreur accès pro_profiles:', proProfiles.data);
    }

    // Test 2: Vérifier s'il y a un enum/constraint
    console.log('\n2️⃣ Recherche de contraintes/enum...');
    
    // Essayer d'insérer une valeur invalide pour voir les contraintes
    const testInsert = await makeRequest('pro_profiles', 'POST', {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID invalide pour déclencher erreur
      company_status: 'TEST_INVALID_STATUS',
      division: 'Test'
    });
    
    console.log('Status tentative insert:', testInsert.status);
    if (testInsert.status !== 200) {
      console.log('Erreur (attendue):', testInsert.data);
    }

    // Test 3: Requête pour voir tous les statuts utilisés
    console.log('\n3️⃣ Tous les statuts company_status en base...');
    
    const allStatuses = await makeRequest('pro_profiles?select=company_status&company_status=not.is.null');
    
    if (allStatuses.status === 200) {
      const statuses = allStatuses.data.map(row => row.company_status);
      const uniqueStatuses = [...new Set(statuses)];
      
      console.log(`📈 ${statuses.length} entrées trouvées`);
      console.log(`🔄 ${uniqueStatuses.length} statuts uniques:`);
      
      uniqueStatuses.forEach(status => {
        const count = statuses.filter(s => s === status).length;
        console.log(`  • ${status} (${count} fois)`);
      });
    }

    // Test 4: Vérifier la structure via métadonnées PostgreSQL
    console.log('\n4️⃣ Métadonnées de la colonne...');
    
    // Cette requête peut ne pas marcher selon les permissions
    const columnInfo = await makeRequest(
      "rpc/get_column_info?table_name='pro_profiles'&column_name='company_status'"
    );
    
    console.log('Status métadonnées:', columnInfo.status);
    if (columnInfo.status === 200) {
      console.log('Métadonnées colonne:', JSON.stringify(columnInfo.data, null, 2));
    } else {
      console.log('❌ Métadonnées non accessibles (permissions limitées)');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n✨ Analyse terminée !');
}

// Exécuter l'analyse
checkCompanyStatuses();