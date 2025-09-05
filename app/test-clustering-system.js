#!/usr/bin/env node

/**
 * Test du système de clustering complet
 * Usage: node test-clustering-system.js
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ';

// Position utilisateur simulée (Paris)
const USER_LOCATION = {
  latitude: 48.8566,
  longitude: 2.3522,
};

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
            data: result
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
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

/**
 * Calcule la distance entre deux points en kilomètres
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calcule le centre géographique d'un groupe de golfs
 */
function calculateCenter(golfs) {
  if (golfs.length === 0) {
    return { latitude: 46.603354, longitude: 1.888334 }; // Centre de la France
  }

  const validGolfs = golfs.filter(g => g.latitude && g.longitude);
  if (validGolfs.length === 0) {
    return { latitude: 46.603354, longitude: 1.888334 };
  }

  const sum = validGolfs.reduce(
    (acc, golf) => ({
      latitude: acc.latitude + golf.latitude,
      longitude: acc.longitude + golf.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / validGolfs.length,
    longitude: sum.longitude / validGolfs.length,
  };
}

/**
 * Simule le service de clustering
 */
function simulateClusteringService(golfs, userLat, userLng, maxDistance = 50) {
  console.log('🔄 Simulation du clustering...');

  // 1. Grouper par département
  const golfsByDepartment = golfs.reduce((acc, golf) => {
    const dept = golf.department;
    if (!dept) return acc;
    
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(golf);
    return acc;
  }, {});

  // 2. Créer les clusters départementaux
  const clusters = Object.entries(golfsByDepartment).map(([department, deptGolfs]) => ({
    department,
    count: deptGolfs.length,
    center: calculateCenter(deptGolfs),
    golfs: deptGolfs,
  }));

  // 3. Trouver les golfs proches de l'utilisateur
  const nearbyGolfs = golfs
    .filter(golf => 
      golf.latitude && 
      golf.longitude && 
      calculateDistance(userLat, userLng, golf.latitude, golf.longitude) <= maxDistance
    )
    .sort((a, b) => {
      const distA = calculateDistance(userLat, userLng, a.latitude, a.longitude);
      const distB = calculateDistance(userLat, userLng, b.latitude, b.longitude);
      return distA - distB;
    });

  // 4. Déterminer le mode d'affichage
  let mode = 'clusters';
  if (nearbyGolfs.length > 0) {
    mode = 'hybrid';
  }
  if (nearbyGolfs.length > 20) {
    mode = 'individual';
  }

  return {
    mode,
    clusters,
    nearbyIndividualGolfs: nearbyGolfs,
    totalGolfs: golfs.length,
  };
}

async function testClusteringSystem() {
  console.log('🏌️ Test du système de clustering');
  console.log('==================================');
  console.log(`📍 Position utilisateur simulée: ${USER_LOCATION.latitude}, ${USER_LOCATION.longitude}`);
  console.log('');

  try {
    // 1. Récupérer tous les golfs
    console.log('1️⃣ Récupération de tous les golfs...');
    const result = await supabaseRequest('golf_parcours', {
      select: '*',
      order: 'name'
    });

    if (result.status !== 200 || !result.data) {
      throw new Error(`Erreur API: ${result.status}`);
    }

    const allGolfs = result.data;
    console.log(`✅ ${allGolfs.length} golfs récupérés`);

    // 2. Analyser la répartition par département
    console.log('\n2️⃣ Analyse de la répartition par département...');
    const deptStats = allGolfs.reduce((acc, golf) => {
      const dept = golf.department;
      if (dept) {
        acc[dept] = (acc[dept] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedDepts = Object.entries(deptStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('Top 10 départements:');
    sortedDepts.forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count} golfs`);
    });

    // 3. Simulation du clustering
    console.log('\n3️⃣ Simulation du clustering...');
    const clusteringResult = simulateClusteringService(
      allGolfs,
      USER_LOCATION.latitude,
      USER_LOCATION.longitude,
      50 // 50km
    );

    console.log(`🎯 Mode recommandé: ${clusteringResult.mode}`);
    console.log(`📍 Clusters créés: ${clusteringResult.clusters.length}`);
    console.log(`🏌️ Golfs proches (≤50km): ${clusteringResult.nearbyIndividualGolfs.length}`);

    // 4. Afficher les clusters les plus importants
    console.log('\n4️⃣ Top 5 clusters par nombre de golfs:');
    const topClusters = clusteringResult.clusters
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    topClusters.forEach((cluster, index) => {
      console.log(`   ${index + 1}. Département ${cluster.department}: ${cluster.count} golfs`);
      console.log(`      📍 Centre: ${cluster.center.latitude.toFixed(4)}, ${cluster.center.longitude.toFixed(4)}`);
      const distanceToUser = calculateDistance(
        USER_LOCATION.latitude,
        USER_LOCATION.longitude,
        cluster.center.latitude,
        cluster.center.longitude
      );
      console.log(`      📏 Distance utilisateur: ${distanceToUser.toFixed(1)} km`);
    });

    // 5. Afficher les golfs les plus proches
    console.log('\n5️⃣ Top 5 golfs les plus proches de l\'utilisateur:');
    const nearbyTop5 = clusteringResult.nearbyIndividualGolfs.slice(0, 5);
    
    nearbyTop5.forEach((golf, index) => {
      const distance = calculateDistance(
        USER_LOCATION.latitude,
        USER_LOCATION.longitude,
        golf.latitude,
        golf.longitude
      );
      console.log(`   ${index + 1}. ${golf.name}`);
      console.log(`      🏙️ ${golf.city || 'Ville inconnue'} (${golf.department})`);
      console.log(`      📏 ${distance.toFixed(1)} km`);
      console.log(`      🕳️ ${golf.holes_count || 'N/A'} trous`);
    });

    // 6. Test d'un zoom sur département
    console.log('\n6️⃣ Test zoom sur département avec le plus de golfs...');
    const biggestCluster = topClusters[0];
    console.log(`🎯 Zoom sur département ${biggestCluster.department}`);
    
    const deptGolfs = biggestCluster.golfs;
    console.log(`   📊 ${deptGolfs.length} golfs dans ce département:`);
    
    deptGolfs.slice(0, 3).forEach((golf, index) => {
      console.log(`      ${index + 1}. ${golf.name} (${golf.city || 'N/A'})`);
    });
    
    if (deptGolfs.length > 3) {
      console.log(`      ... et ${deptGolfs.length - 3} autres`);
    }

    // 7. Calcul des bounds pour ce département
    const validDeptGolfs = deptGolfs.filter(g => g.latitude && g.longitude);
    if (validDeptGolfs.length > 0) {
      const lats = validDeptGolfs.map(g => g.latitude);
      const lngs = validDeptGolfs.map(g => g.longitude);
      
      const bounds = {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
        center: {
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
          longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        }
      };
      
      console.log(`   📐 Bounds calculés:`);
      console.log(`      Centre: ${bounds.center.latitude.toFixed(4)}, ${bounds.center.longitude.toFixed(4)}`);
      console.log(`      Étendue: ${(bounds.maxLat - bounds.minLat).toFixed(4)}° x ${(bounds.maxLng - bounds.minLng).toFixed(4)}°`);
    }

    console.log('\n🎉 Test du système de clustering réussi !');
    console.log('\n📋 Résumé:');
    console.log(`   📊 ${allGolfs.length} golfs au total`);
    console.log(`   🏛️ ${Object.keys(deptStats).length} départements`);
    console.log(`   📍 ${clusteringResult.clusters.length} clusters créés`);
    console.log(`   🎯 Mode d'affichage: ${clusteringResult.mode}`);
    console.log(`   🏌️ ${clusteringResult.nearbyIndividualGolfs.length} golfs près de l'utilisateur`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  testClusteringSystem();
}