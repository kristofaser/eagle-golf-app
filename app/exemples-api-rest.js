#!/usr/bin/env node

/**
 * Exemples d'utilisation de l'API REST Supabase
 * Usage: node exemples-api-rest.js [operation]
 * 
 * Operations disponibles:
 * - list-pros: Lister les profils professionnels
 * - search-pros: Chercher des pros par critères
 * - get-profile: Obtenir un profil spécifique
 * - list-bookings: Lister les réservations
 * - test-auth: Tester l'authentification
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ';

/**
 * Fonction helper pour faire des requêtes REST avec Supabase
 */
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
 * Exemples d'opérations
 */
async function listPros() {
  console.log('🏌️ Liste des professionnels de golf:');
  console.log('=====================================');
  
  try {
    const result = await supabaseRequest('profiles', {
      select: 'id,first_name,last_name,user_type,city',
      filter: { 'user_type': 'eq.pro' },
      limit: 5,
      order: 'created_at.desc'
    });

    if (result.status === 200) {
      result.data.forEach((pro, index) => {
        console.log(`${index + 1}. ${pro.first_name} ${pro.last_name}`);
        console.log(`   📍 ${pro.city || 'Non spécifié'}`);
        console.log(`   🆔 ID: ${pro.id}`);
        console.log('');
      });
    } else {
      console.log('❌ Erreur:', result.status, result.data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function getProDetails() {
  console.log('🔍 Détails d\'un professionnel:');
  console.log('===============================');
  
  try {
    // D'abord, obtenir un ID de pro
    const prosResult = await supabaseRequest('profiles', {
      select: 'id,first_name,last_name',
      filter: { 'user_type': 'eq.pro' },
      limit: 1
    });

    if (prosResult.status === 200 && prosResult.data.length > 0) {
      const proId = prosResult.data[0].id;
      console.log(`📋 Récupération des détails pour: ${prosResult.data[0].first_name} ${prosResult.data[0].last_name}`);
      
      // Obtenir les détails du profil pro
      const detailsResult = await supabaseRequest('pro_profiles', {
        select: 'user_id,division,skill_driving,skill_putting,experience,can_travel,travel_radius_km',
        filter: { 'user_id': `eq.${proId}` }
      });

      if (detailsResult.status === 200 && detailsResult.data.length > 0) {
        const details = detailsResult.data[0];
        console.log(`🏆 Division: ${details.division || 'Non spécifiée'}`);
        console.log(`🏌️ Compétences:`);
        console.log(`   - Driving: ${details.skill_driving}/100`);
        console.log(`   - Putting: ${details.skill_putting}/100`);
        console.log(`🚗 Peut se déplacer: ${details.can_travel ? 'Oui' : 'Non'}`);
        if (details.can_travel) {
          console.log(`📏 Rayon de déplacement: ${details.travel_radius_km} km`);
        }
        if (details.experience && details.experience.length > 0) {
          console.log(`🏅 Expériences:`);
          details.experience.forEach((exp, i) => {
            console.log(`   ${i + 1}. ${exp.description}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function searchProsBySkill() {
  console.log('🎯 Recherche de pros par compétence:');
  console.log('====================================');
  
  try {
    // Chercher les pros avec un bon niveau de putting (>= 80)
    const result = await supabaseRequest('pro_profiles', {
      select: 'user_id,skill_putting,skill_driving,division',
      filter: { 'skill_putting': 'gte.80' },
      order: 'skill_putting.desc',
      limit: 3
    });

    if (result.status === 200) {
      console.log('🏆 Pros avec excellent putting (≥80):');
      
      for (const pro of result.data) {
        // Obtenir les infos de base du profil
        const profileResult = await supabaseRequest('profiles', {
          select: 'first_name,last_name,city',
          filter: { 'id': `eq.${pro.user_id}` }
        });
        
        if (profileResult.status === 200 && profileResult.data.length > 0) {
          const profile = profileResult.data[0];
          console.log(`🏌️ ${profile.first_name} ${profile.last_name}`);
          console.log(`   📍 ${profile.city || 'Non spécifié'}`);
          console.log(`   🥇 Putting: ${pro.skill_putting}/100`);
          console.log(`   🏌️ Driving: ${pro.skill_driving}/100`);
          console.log(`   🏆 Division: ${pro.division || 'Non spécifiée'}`);
          console.log('');
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function listBookings() {
  console.log('📅 Liste des réservations:');
  console.log('==========================');
  
  try {
    const result = await supabaseRequest('bookings', {
      select: 'id,status,created_at',
      limit: 5,
      order: 'created_at.desc'
    });

    if (result.status === 200) {
      if (result.data.length === 0) {
        console.log('ℹ️ Aucune réservation trouvée');
      } else {
        result.data.forEach((booking, index) => {
          console.log(`${index + 1}. Réservation #${booking.id}`);
          console.log(`   📊 Status: ${booking.status}`);
          console.log(`   📅 Créée: ${new Date(booking.created_at).toLocaleString('fr-FR')}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Erreur:', result.status, result.data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function testAuth() {
  console.log('🔐 Test de l\'authentification:');
  console.log('==============================');
  
  try {
    // Test avec endpoint auth (devrait retourner 401 sans token)
    const authResult = await supabaseRequest('../auth/v1/user');
    
    console.log(`Status: ${authResult.status}`);
    if (authResult.status === 401) {
      console.log('✅ Endpoint auth fonctionne (401 = normal sans session)');
    }
    
    // Test d'inscription mock (ne sera pas exécuté)
    console.log('');
    console.log('📋 Exemple de commande pour l\'inscription:');
    console.log('curl -X POST \\');
    console.log(`  -H "apikey: ${SUPABASE_ANON_KEY}" \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "user@example.com", "password": "motdepasse"}\' \\');
    console.log(`  "${SUPABASE_URL}/auth/v1/signup"`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

/**
 * Menu principal
 */
async function main() {
  const operation = process.argv[2];
  
  console.log('🚀 Exemples API REST Supabase');
  console.log('=============================');
  console.log('');

  switch (operation) {
    case 'list-pros':
      await listPros();
      break;
    case 'search-pros':
      await searchProsBySkill();
      break;
    case 'get-profile':
      await getProDetails();
      break;
    case 'list-bookings':
      await listBookings();
      break;
    case 'test-auth':
      await testAuth();
      break;
    case 'all':
      await listPros();
      console.log('\\n' + '='.repeat(50) + '\\n');
      await getProDetails();
      console.log('\\n' + '='.repeat(50) + '\\n');
      await searchProsBySkill();
      console.log('\\n' + '='.repeat(50) + '\\n');
      await listBookings();
      break;
    default:
      console.log('Usage: node exemples-api-rest.js [operation]');
      console.log('');
      console.log('Operations disponibles:');
      console.log('  list-pros     - Lister les professionnels');
      console.log('  search-pros   - Chercher par compétences');
      console.log('  get-profile   - Détails d\'un profil');
      console.log('  list-bookings - Lister les réservations');
      console.log('  test-auth     - Tester l\'authentification');
      console.log('  all           - Exécuter tous les exemples');
      console.log('');
      console.log('Exemple: node exemples-api-rest.js list-pros');
  }
}

// Exporter les fonctions pour usage externe
module.exports = {
  supabaseRequest,
  listPros,
  getProDetails,
  searchProsBySkill,
  listBookings,
  testAuth
};

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(console.error);
}