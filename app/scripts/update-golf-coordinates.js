#!/usr/bin/env node

/**
 * Script de mise à jour des coordonnées des golfs via Google Maps API
 * Usage: GOOGLE_MAPS_API_KEY=your_key node scripts/update-golf-coordinates.js
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY environment variable is required');
  console.log('Usage: GOOGLE_MAPS_API_KEY=your_key node scripts/update-golf-coordinates.js');
  process.exit(1);
}

// Délai entre les requêtes pour respecter les limites de l'API
const DELAY_MS = 100; // 100ms entre chaque requête

/**
 * Requête HTTP HTTPS générique
 */
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Requête Supabase
 */
async function supabaseRequest(endpoint, options = {}) {
  const { method = 'GET', data = null, params = {} } = options;
  
  let url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key].toString());
    }
  });
  
  if (queryParams.toString()) {
    url += '?' + queryParams.toString();
  }

  const urlObj = new URL(url);
  
  const requestOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=minimal'
    }
  };

  return httpsRequest(requestOptions, data ? JSON.stringify(data) : null);
}

/**
 * Géocodage via Google Maps API
 */
async function geocodeGolf(name, city, address = null) {
  // Construire la requête de géocodage
  let query = name;
  if (city) query += `, ${city}`;
  if (address) query += `, ${address}`;
  query += ', France'; // Limiter à la France
  
  const encodedQuery = encodeURIComponent(query);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${GOOGLE_MAPS_API_KEY}&language=fr&region=fr`;
  
  const urlObj = new URL(url);
  
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  try {
    const response = await httpsRequest(options);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = response.data;
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      
      return {
        success: true,
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: data.results[0].formatted_address,
        place_id: data.results[0].place_id
      };
    } else {
      return {
        success: false,
        error: `Geocoding failed: ${data.status}`,
        query: query
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: query
    };
  }
}

/**
 * Attendre un délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fonction principale
 */
async function updateGolfCoordinates() {
  console.log('🌍 Mise à jour des coordonnées des golfs avec Google Maps API');
  console.log('================================================================');
  
  try {
    // 1. Récupérer tous les golfs
    console.log('1️⃣ Récupération des golfs...');
    const result = await supabaseRequest('golf_parcours', {
      params: {
        select: 'id,name,city,latitude,longitude',
        order: 'name'
      }
    });

    if (result.status !== 200 || !result.data) {
      throw new Error(`Erreur API Supabase: ${result.status}`);
    }

    const golfs = result.data;
    console.log(`✅ ${golfs.length} golfs récupérés`);

    // 2. Traitement par batch (MODE PRODUCTION)
    const TEST_MODE = false;
    const batchSize = TEST_MODE ? 5 : 10; // 5 pour test, 10 pour production
    const maxGolfs = TEST_MODE ? 5 : golfs.length;
    
    console.log(`\n2️⃣ Mode de traitement: ${TEST_MODE ? 'TEST (5 golfs)' : 'PRODUCTION'}`);
    console.log(`📊 Traitement par batch de ${batchSize}, délai ${DELAY_MS}ms`);
    
    const results = {
      success: 0,
      failed: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };

    for (let i = 0; i < Math.min(maxGolfs, golfs.length); i += batchSize) {
      const batch = golfs.slice(i, i + batchSize);
      
      console.log(`\n🔄 Batch ${Math.floor(i/batchSize) + 1} (golfs ${i+1}-${Math.min(i+batchSize, maxGolfs)}):`);
      
      for (const golf of batch) {
        console.log(`   🏌️ ${golf.name} (${golf.city || 'Ville inconnue'})`);
        
        // Géocodage
        const geocodeResult = await geocodeGolf(golf.name, golf.city, null);
        
        if (geocodeResult.success) {
          const oldLat = parseFloat(golf.latitude);
          const oldLng = parseFloat(golf.longitude);
          const newLat = geocodeResult.latitude;
          const newLng = geocodeResult.longitude;
          
          // Calculer la distance de déplacement
          const distance = Math.sqrt(
            Math.pow(newLat - oldLat, 2) + Math.pow(newLng - oldLng, 2)
          ) * 111; // Approximation en km
          
          if (distance > 0.01) { // Plus de 10m de différence
            console.log(`      📍 Anciennes: ${oldLat.toFixed(6)}, ${oldLng.toFixed(6)}`);
            console.log(`      📍 Nouvelles: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
            console.log(`      📏 Déplacement: ~${distance.toFixed(0)}m`);
            
            if (!TEST_MODE) {
              // Mise à jour en base
              const updateResult = await supabaseRequest(`golf_parcours?id=eq.${golf.id}`, {
                method: 'PATCH',
                data: {
                  latitude: newLat,
                  longitude: newLng,
                  updated_at: new Date().toISOString()
                }
              });
              
              if (updateResult.status === 204) {
                console.log(`      ✅ Mis à jour`);
                results.updated++;
              } else {
                console.log(`      ❌ Erreur mise à jour: ${updateResult.status}`);
                results.failed++;
                results.errors.push(`${golf.name}: Update failed (${updateResult.status})`);
              }
            } else {
              console.log(`      🧪 TEST - Pas de mise à jour`);
              results.updated++;
            }
          } else {
            console.log(`      ✅ Coordonnées déjà précises (${distance.toFixed(0)}m)`);
            results.unchanged++;
          }
          
          results.success++;
          
        } else {
          console.log(`      ❌ Géocodage échec: ${geocodeResult.error}`);
          results.failed++;
          results.errors.push(`${golf.name}: ${geocodeResult.error}`);
        }
        
        // Délai entre chaque requête
        if (batch.indexOf(golf) < batch.length - 1) {
          await delay(DELAY_MS);
        }
      }
      
      // Délai entre les batchs
      if (i + batchSize < Math.min(maxGolfs, golfs.length)) {
        console.log(`   ⏳ Pause ${DELAY_MS * 2}ms avant le batch suivant...`);
        await delay(DELAY_MS * 2);
      }
    }

    // 3. Résultats
    console.log('\n3️⃣ Résultats:');
    console.log('================');
    console.log(`✅ Succès: ${results.success}`);
    console.log(`🔄 Mis à jour: ${results.updated}`);
    console.log(`➖ Inchangés: ${results.unchanged}`);
    console.log(`❌ Échecs: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 Erreurs:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (TEST_MODE) {
      console.log('\n🧪 MODE TEST - Aucune donnée n\'a été modifiée');
      console.log('Pour exécuter en mode production, changez TEST_MODE = false dans le script');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  updateGolfCoordinates();
}