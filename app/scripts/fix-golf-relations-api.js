#!/usr/bin/env node

// Script pour corriger les relations FK via l'API Supabase
// Utilise des requêtes HTTP directes pour contourner les limitations du client JS

const https = require('https');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Fonction pour faire une requête HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function fixGolfRelations() {
  try {
    console.log('🚀 Début de la correction des relations FK via API...');
    
    const baseUrl = new URL(supabaseUrl);
    const headers = {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Content-Type': 'application/json'
    };
    
    // Les commandes SQL à exécuter
    const sqlCommands = [
      // Supprimer les anciennes FK
      'ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_golf_course_id_fkey',
      'ALTER TABLE public.pro_availabilities DROP CONSTRAINT IF EXISTS pro_availabilities_golf_course_id_fkey',
      
      // Créer les nouvelles FK
      'ALTER TABLE public.bookings ADD CONSTRAINT bookings_golf_course_id_fkey FOREIGN KEY (golf_course_id) REFERENCES public.golf_parcours(id) ON DELETE CASCADE',
      'ALTER TABLE public.pro_availabilities ADD CONSTRAINT pro_availabilities_golf_course_id_fkey FOREIGN KEY (golf_course_id) REFERENCES public.golf_parcours(id) ON DELETE CASCADE'
    ];
    
    console.log('⚡ Exécution des commandes SQL...');
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`\n📝 Étape ${i + 1}/${sqlCommands.length}:`);
      console.log(`   ${sql.substring(0, 50)}...`);
      
      try {
        // Essayer d'exécuter via l'endpoint REST
        const options = {
          hostname: baseUrl.hostname,
          path: `/rest/v1/rpc/exec_sql`,
          method: 'POST',
          headers
        };
        
        const result = await makeRequest(options, { sql });
        
        if (result.status === 200 || result.status === 201) {
          console.log('   ✅ Réussi');
        } else {
          console.log('   ⚠️ Réponse:', result.status, result.data);
        }
        
      } catch (error) {
        console.log('   ❌ Erreur:', error.message);
      }
    }
    
    console.log('\n🧪 Test des jointures après migration...');
    
    // Test de jointure
    const testOptions = {
      hostname: baseUrl.hostname,
      path: `/rest/v1/pro_availabilities?select=id,golf_course_id,golf_courses:golf_parcours(name)&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': headers.Authorization,
        'apikey': headers.apikey
      }
    };
    
    try {
      const testResult = await makeRequest(testOptions);
      
      if (testResult.status === 200) {
        console.log('✅ Test de jointure réussi !');
        console.log('📊 Exemple:', JSON.stringify(testResult.data, null, 2));
      } else {
        console.log('⚠️ Test de jointure échoué:', testResult.status, testResult.data);
      }
    } catch (error) {
      console.log('❌ Erreur test jointure:', error.message);
    }
    
    console.log('\n🎉 Migration terminée !');
    console.log('💡 Redémarrez votre app pour voir les changements.');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
    process.exit(1);
  }
}

// Message informatif
console.log('📋 Ce script va corriger les relations FK dans Supabase:');
console.log('   bookings.golf_course_id → golf_parcours.id');  
console.log('   pro_availabilities.golf_course_id → golf_parcours.id');
console.log('');

// Exécuter le script
fixGolfRelations();