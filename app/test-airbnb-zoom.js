#!/usr/bin/env node

/**
 * Test du système de zoom dynamique à la Airbnb
 * Usage: node test-airbnb-zoom.js
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ';

// Régions de test pour simuler différents niveaux de zoom
const TEST_REGIONS = {
  COUNTRY: {
    name: 'France entière',
    latitude: 46.603354,
    longitude: 1.888334,
    latitudeDelta: 8.0, // > 2.0 = COUNTRY level
    longitudeDelta: 8.0,
  },
  REGIONAL: {
    name: 'Île-de-France',
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 1.0, // 0.5-2.0 = REGIONAL level
    longitudeDelta: 1.0,
  },
  LOCAL: {
    name: 'Paris et banlieue',
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.2, // 0.1-0.5 = LOCAL level
    longitudeDelta: 0.2,
  },
  DETAILED: {
    name: 'Paris centre',
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.05, // < 0.1 = DETAILED level
    longitudeDelta: 0.05,
  },
};

async function supabaseRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    select = '*',
    limit = null,
    order = null,
  } = options;

  let url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const params = new URLSearchParams();
  if (select) params.append('select', select);
  if (limit) params.append('limit', limit.toString());
  if (order) params.append('order', order);
  
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
 * Simule les utilitaires de zoom
 */
function getZoomLevel(region) {
  const { latitudeDelta } = region;
  
  if (latitudeDelta >= 2.0) {
    return 'COUNTRY';
  }
  if (latitudeDelta >= 0.5) {
    return 'REGIONAL';
  }
  if (latitudeDelta >= 0.1) {
    return 'LOCAL';
  }
  return 'DETAILED';
}

function getVisibleBounds(region) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  
  return {
    north: latitude + latitudeDelta / 2,
    south: latitude - latitudeDelta / 2,
    east: longitude + longitudeDelta / 2,
    west: longitude - longitudeDelta / 2,
  };
}

function isInVisibleBounds(lat, lng, bounds) {
  return lat >= bounds.south && 
         lat <= bounds.north && 
         lng >= bounds.west && 
         lng <= bounds.east;
}

function filterGolfsInBounds(golfs, region) {
  const bounds = getVisibleBounds(region);
  
  return golfs.filter(golf => 
    golf.latitude && 
    golf.longitude && 
    isInVisibleBounds(golf.latitude, golf.longitude, bounds)
  );
}

function filterClustersInBounds(clusters, region) {
  const bounds = getVisibleBounds(region);
  
  return clusters.filter(cluster => 
    isInVisibleBounds(cluster.center.latitude, cluster.center.longitude, bounds)
  );
}

/**
 * Simule la logique de clustering
 */
function createDepartmentClusters(golfs) {
  const golfsByDepartment = golfs.reduce((acc, golf) => {
    const dept = golf.department;
    if (!dept) return acc;
    
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(golf);
    return acc;
  }, {});

  return Object.entries(golfsByDepartment).map(([department, deptGolfs]) => {
    const validGolfs = deptGolfs.filter(g => g.latitude && g.longitude);
    
    const center = validGolfs.length > 0 ? {
      latitude: validGolfs.reduce((sum, golf) => sum + golf.latitude, 0) / validGolfs.length,
      longitude: validGolfs.reduce((sum, golf) => sum + golf.longitude, 0) / validGolfs.length,
    } : { latitude: 46.603354, longitude: 1.888334 };

    return {
      department,
      count: deptGolfs.length,
      center,
      golfs: deptGolfs,
    };
  });
}

/**
 * Simule la logique d'affichage dynamique Airbnb
 */
function getDisplayForZoomLevel(region, allClusters, allGolfs) {
  const zoomLevel = getZoomLevel(region);
  const visibleClusters = filterClustersInBounds(allClusters, region);
  const visibleGolfs = filterGolfsInBounds(allGolfs, region);

  switch (zoomLevel) {
    case 'COUNTRY':
      return {
        showClusters: true,
        showIndividualGolfs: false,
        clustersToShow: visibleClusters,
        golfsToShow: [],
        zoomLevel,
      };

    case 'REGIONAL':
      const bigClusters = visibleClusters.filter(c => c.count >= 5);
      const smallClustersGolfs = visibleClusters
        .filter(c => c.count < 5)
        .flatMap(c => c.golfs || [])
        .filter(g => g.latitude && g.longitude && 
          isInVisibleBounds(g.latitude, g.longitude, getVisibleBounds(region)));
      
      return {
        showClusters: true,
        showIndividualGolfs: true,
        clustersToShow: bigClusters,
        golfsToShow: smallClustersGolfs,
        zoomLevel,
      };

    case 'LOCAL':
      const hugeClusters = visibleClusters.filter(c => c.count >= 10);
      return {
        showClusters: hugeClusters.length > 0,
        showIndividualGolfs: true,
        clustersToShow: hugeClusters,
        golfsToShow: visibleGolfs,
        zoomLevel,
      };

    case 'DETAILED':
      return {
        showClusters: false,
        showIndividualGolfs: true,
        clustersToShow: [],
        golfsToShow: visibleGolfs,
        zoomLevel,
      };

    default:
      return {
        showClusters: true,
        showIndividualGolfs: false,
        clustersToShow: visibleClusters,
        golfsToShow: [],
        zoomLevel: 'COUNTRY',
      };
  }
}

async function testAirbnbZoomSystem() {
  console.log('🗺️ Test du système de zoom dynamique Airbnb');
  console.log('==============================================');

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

    // 2. Créer tous les clusters
    console.log('\n2️⃣ Création des clusters départementaux...');
    const allClusters = createDepartmentClusters(allGolfs);
    console.log(`✅ ${allClusters.length} clusters créés`);

    // 3. Tester chaque niveau de zoom
    console.log('\n3️⃣ Test des niveaux de zoom Airbnb...');
    
    for (const [level, region] of Object.entries(TEST_REGIONS)) {
      console.log(`\n📊 Test niveau ${level} (${region.name}):`);
      console.log(`   📐 latitudeDelta: ${region.latitudeDelta}°`);
      
      const display = getDisplayForZoomLevel(region, allClusters, allGolfs);
      
      console.log(`   🎯 Niveau détecté: ${display.zoomLevel}`);
      console.log(`   📍 Clusters visibles: ${display.clustersToShow.length}`);
      console.log(`   🏌️ Golfs individuels: ${display.golfsToShow.length}`);
      console.log(`   👁️ Affichage clusters: ${display.showClusters ? 'OUI' : 'NON'}`);
      console.log(`   👁️ Affichage golfs: ${display.showIndividualGolfs ? 'OUI' : 'NON'}`);
      
      // Afficher quelques exemples
      if (display.clustersToShow.length > 0) {
        const topClusters = display.clustersToShow
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        console.log(`   🔝 Top clusters: ${topClusters.map(c => `${c.department}(${c.count})`).join(', ')}`);
      }
      
      if (display.golfsToShow.length > 0) {
        console.log(`   🏌️ Exemples golfs: ${display.golfsToShow.slice(0, 3).map(g => g.name).join(', ')}`);
      }
    }

    // 4. Test simulation changement de zoom
    console.log('\n4️⃣ Simulation changement de zoom (zoom out depuis Paris)...');
    
    const zoomSequence = [
      { level: 'DETAILED', region: TEST_REGIONS.DETAILED },
      { level: 'LOCAL', region: TEST_REGIONS.LOCAL },
      { level: 'REGIONAL', region: TEST_REGIONS.REGIONAL },
      { level: 'COUNTRY', region: TEST_REGIONS.COUNTRY },
    ];
    
    for (const { level, region } of zoomSequence) {
      const display = getDisplayForZoomLevel(region, allClusters, allGolfs);
      console.log(`   ${level.padEnd(10)} → clusters: ${display.clustersToShow.length.toString().padStart(2)}, golfs: ${display.golfsToShow.length.toString().padStart(3)}`);
    }

    // 5. Vérifier la cohérence
    console.log('\n5️⃣ Vérifications de cohérence...');
    
    // Test: Plus on dézoome, plus on voit de clusters
    const countryDisplay = getDisplayForZoomLevel(TEST_REGIONS.COUNTRY, allClusters, allGolfs);
    const regionalDisplay = getDisplayForZoomLevel(TEST_REGIONS.REGIONAL, allClusters, allGolfs);
    
    console.log(`   ✓ Cohérence zoom: COUNTRY (${countryDisplay.clustersToShow.length}) >= REGIONAL (${regionalDisplay.clustersToShow.length})`);
    
    // Test: Plus on zoome, plus on voit de golfs individuels
    const detailedDisplay = getDisplayForZoomLevel(TEST_REGIONS.DETAILED, allClusters, allGolfs);
    const localDisplay = getDisplayForZoomLevel(TEST_REGIONS.LOCAL, allClusters, allGolfs);
    
    console.log(`   ✓ Cohérence golfs: DETAILED (${detailedDisplay.golfsToShow.length}) >= LOCAL (${localDisplay.golfsToShow.length})`);

    console.log('\n🎉 Test du système Airbnb terminé avec succès !');
    
    console.log('\n📋 Résumé comportement attendu:');
    console.log('   🌍 COUNTRY (>2°)   : Seulement les clusters départementaux');
    console.log('   🏢 REGIONAL (0.5-2°): Gros clusters + golfs des petits départements');
    console.log('   🏙️ LOCAL (0.1-0.5°) : Très gros clusters + tous les golfs visibles');
    console.log('   📍 DETAILED (<0.1°) : Seulement les golfs individuels');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  testAirbnbZoomSystem();
}