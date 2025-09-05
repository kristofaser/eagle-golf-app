#!/usr/bin/env node

/**
 * Test du nouveau service golf-parcours
 * Usage: node test-golf-parcours.js
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ';

async function supabaseRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    data = null,
    headers = {},
    select = '*',
    limit = null,
    order = null,
    filter = null
  } = options;

  let url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  // Construction des paramètres de requête
  const params = new URLSearchParams();
  if (select) params.append('select', select);
  if (limit) params.append('limit', limit.toString());
  if (order) params.append('order', order);
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, value);
    });
  }
  
  if (params.toString()) {
    url += '?' + params.toString();
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
      ...headers
    }
  };

  if (data && (method === 'POST' || method === 'PATCH')) {
    const jsonData = JSON.stringify(data);
    requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
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
 * Simule la transformation des données comme dans le service
 */
function transformGolfParcours(rawData) {
  return {
    ...rawData,
    // Créer un objet location PostGIS à partir de latitude/longitude
    location: rawData.latitude && rawData.longitude ? {
      type: 'Point',
      coordinates: [rawData.longitude, rawData.latitude]
    } : null,
    // Mapper holes_count vers hole_count pour compatibilité
    hole_count: rawData.holes_count || undefined,
    // Valeurs par défaut pour les champs manquants
    images: [], // Aucune image dans golf_parcours
    amenities: [], // Aucune commodité dans golf_parcours
    par: undefined, // Pas d'info par dans golf_parcours
    green_fee_weekday: undefined, // Pas de tarifs dans golf_parcours
    green_fee_weekend: undefined, // Pas de tarifs dans golf_parcours
    booking_required: true, // Par défaut, réservation requise
    active: true, // Tous les parcours dans golf_parcours sont actifs
  };
}

async function testGolfParcours() {
  console.log('🏌️ Test du service golf-parcours');
  console.log('=================================');
  
  try {
    // Récupérer les données brutes
    console.log('1️⃣ Récupération des données brutes...');
    const result = await supabaseRequest('golf_parcours', {
      select: '*',
      limit: 5,
      order: 'name'
    });

    if (result.status === 200 && result.data) {
      console.log(`✅ ${result.data.length} parcours récupérés`);
      
      // Transformer les données
      console.log('\n2️⃣ Transformation des données...');
      const transformedData = result.data.map(transformGolfParcours);
      
      transformedData.forEach((course, index) => {
        console.log(`\n🏌️ Parcours ${index + 1}:`);
        console.log(`   📍 Nom: ${course.name}`);
        console.log(`   🏙️ Ville: ${course.city || 'Non spécifiée'}`);
        console.log(`   🕳️ Trous: ${course.holes_count || 'Non spécifié'} (hole_count: ${course.hole_count || 'undefined'})`);
        console.log(`   📍 Coordonnées: ${course.latitude}, ${course.longitude}`);
        console.log(`   🌍 Location PostGIS: ${JSON.stringify(course.location)}`);
        console.log(`   📞 Téléphone: ${course.phone || 'Non spécifié'}`);
        console.log(`   🌐 Site web: ${course.website || 'Non spécifié'}`);
        
        // Vérifier les champs ajoutés
        console.log(`   🖼️ Images: ${course.images?.length || 0} image(s)`);
        console.log(`   ⭐ Par: ${course.par || 'Non spécifié'}`);
        console.log(`   💰 Tarif: ${course.green_fee_weekday ? course.green_fee_weekday/100 + '€' : 'Non spécifié'}`);
        console.log(`   ✅ Actif: ${course.active}`);
      });
      
      // Vérifier la compatibilité avec l'UI
      console.log('\n3️⃣ Vérification compatibilité UI...');
      const firstCourse = transformedData[0];
      const uiFields = {
        'ID': firstCourse.id ? '✅' : '❌',
        'Nom': firstCourse.name ? '✅' : '❌',
        'Ville': firstCourse.city ? '✅' : '❌',
        'Trous (hole_count)': firstCourse.hole_count ? '✅' : '❌',
        'Location PostGIS': firstCourse.location ? '✅' : '❌',
        'Images (array)': Array.isArray(firstCourse.images) ? '✅' : '❌',
        'Par': firstCourse.par !== undefined ? '✅' : '❌ (normal)',
        'Tarifs': firstCourse.green_fee_weekday !== undefined ? '✅' : '❌ (normal)',
      };
      
      Object.entries(uiFields).forEach(([field, status]) => {
        console.log(`   ${field}: ${status}`);
      });
      
      console.log('\n🎉 Test terminé avec succès !');
      
    } else {
      console.error('❌ Erreur:', result.status, result.data);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  testGolfParcours();
}