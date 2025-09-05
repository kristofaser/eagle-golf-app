#!/usr/bin/env node

/**
 * Script de débogage pour analyser les données de la carte
 * Usage: node debug-map-data.js
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
 * Validation exhaustive des données
 */
function validateGolf(golf) {
  const issues = [];
  
  if (!golf) {
    issues.push('Golf object is null/undefined');
    return { valid: false, issues };
  }
  
  if (!golf.id) issues.push('Missing id');
  if (!golf.name) issues.push('Missing name');
  if (!golf.latitude) issues.push('Missing latitude');
  if (!golf.longitude) issues.push('Missing longitude');
  
  if (golf.latitude && (typeof golf.latitude !== 'number' || isNaN(golf.latitude))) {
    issues.push(`Invalid latitude: ${golf.latitude} (${typeof golf.latitude})`);
  }
  
  if (golf.longitude && (typeof golf.longitude !== 'number' || isNaN(golf.longitude))) {
    issues.push(`Invalid longitude: ${golf.longitude} (${typeof golf.longitude})`);
  }
  
  if (golf.latitude && (golf.latitude < -90 || golf.latitude > 90)) {
    issues.push(`Latitude out of bounds: ${golf.latitude}`);
  }
  
  if (golf.longitude && (golf.longitude < -180 || golf.longitude > 180)) {
    issues.push(`Longitude out of bounds: ${golf.longitude}`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function validateCluster(cluster) {
  const issues = [];
  
  if (!cluster) {
    issues.push('Cluster object is null/undefined');
    return { valid: false, issues };
  }
  
  if (!cluster.department) issues.push('Missing department');
  if (!cluster.center) issues.push('Missing center');
  if (typeof cluster.count !== 'number') issues.push(`Invalid count: ${cluster.count}`);
  
  if (cluster.center) {
    if (typeof cluster.center.latitude !== 'number' || isNaN(cluster.center.latitude)) {
      issues.push(`Invalid center latitude: ${cluster.center.latitude}`);
    }
    if (typeof cluster.center.longitude !== 'number' || isNaN(cluster.center.longitude)) {
      issues.push(`Invalid center longitude: ${cluster.center.longitude}`);
    }
    if (cluster.center.latitude && (cluster.center.latitude < -90 || cluster.center.latitude > 90)) {
      issues.push(`Center latitude out of bounds: ${cluster.center.latitude}`);
    }
    if (cluster.center.longitude && (cluster.center.longitude < -180 || cluster.center.longitude > 180)) {
      issues.push(`Center longitude out of bounds: ${cluster.center.longitude}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function calculateCenter(golfs) {
  if (golfs.length === 0) {
    return { latitude: 46.603354, longitude: 1.888334 }; // Centre de la France
  }

  const validGolfs = golfs.filter(g => 
    g.latitude && 
    g.longitude && 
    typeof g.latitude === 'number' && 
    typeof g.longitude === 'number' &&
    !isNaN(g.latitude) && 
    !isNaN(g.longitude) &&
    g.latitude >= -90 && 
    g.latitude <= 90 && 
    g.longitude >= -180 && 
    g.longitude <= 180
  );
  
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

  const center = {
    latitude: sum.latitude / validGolfs.length,
    longitude: sum.longitude / validGolfs.length,
  };

  // Validation finale du centre calculé
  if (isNaN(center.latitude) || isNaN(center.longitude)) {
    return { latitude: 46.603354, longitude: 1.888334 };
  }

  return center;
}

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

  return Object.entries(golfsByDepartment).map(([department, deptGolfs]) => ({
    department,
    count: deptGolfs.length,
    center: calculateCenter(deptGolfs),
    golfs: deptGolfs,
  }));
}

async function debugMapData() {
  console.log('🔍 Débogage des données de la carte');
  console.log('==================================');

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

    // 2. Validation de chaque golf
    console.log('\n2️⃣ Validation des golfs...');
    const invalidGolfs = [];
    const validGolfs = [];
    
    allGolfs.forEach((golf, index) => {
      const validation = validateGolf(golf);
      if (!validation.valid) {
        invalidGolfs.push({ index, golf, issues: validation.issues });
      } else {
        validGolfs.push(golf);
      }
    });

    console.log(`✅ Golfs valides: ${validGolfs.length}`);
    console.log(`❌ Golfs invalides: ${invalidGolfs.length}`);

    if (invalidGolfs.length > 0) {
      console.log('\n🚨 Golfs problématiques:');
      invalidGolfs.slice(0, 5).forEach(({ index, golf, issues }) => {
        console.log(`   ${index}: ${golf?.name || 'UNNAMED'}`);
        issues.forEach(issue => console.log(`      - ${issue}`));
      });
      if (invalidGolfs.length > 5) {
        console.log(`   ... et ${invalidGolfs.length - 5} autres`);
      }
    }

    // 3. Création et validation des clusters
    console.log('\n3️⃣ Création des clusters...');
    const allClusters = createDepartmentClusters(validGolfs);
    console.log(`✅ ${allClusters.length} clusters créés`);

    const invalidClusters = [];
    const validClusters = [];
    
    allClusters.forEach((cluster, index) => {
      const validation = validateCluster(cluster);
      if (!validation.valid) {
        invalidClusters.push({ index, cluster, issues: validation.issues });
      } else {
        validClusters.push(cluster);
      }
    });

    console.log(`✅ Clusters valides: ${validClusters.length}`);
    console.log(`❌ Clusters invalides: ${invalidClusters.length}`);

    if (invalidClusters.length > 0) {
      console.log('\n🚨 Clusters problématiques:');
      invalidClusters.forEach(({ index, cluster, issues }) => {
        console.log(`   ${index}: Département ${cluster?.department || 'UNKNOWN'}`);
        issues.forEach(issue => console.log(`      - ${issue}`));
      });
    }

    // 4. Analyse des données pour React Native Maps
    console.log('\n4️⃣ Analyse pour React Native Maps...');
    
    // Test de sérialisation JSON
    try {
      const serializedClusters = JSON.parse(JSON.stringify(validClusters.slice(0, 3)));
      console.log('✅ Sérialisation JSON des clusters: OK');
    } catch (e) {
      console.log('❌ Erreur sérialisation JSON clusters:', e.message);
    }

    try {
      const serializedGolfs = JSON.parse(JSON.stringify(validGolfs.slice(0, 3)));
      console.log('✅ Sérialisation JSON des golfs: OK');
    } catch (e) {
      console.log('❌ Erreur sérialisation JSON golfs:', e.message);
    }

    // 5. Suggestions de correction
    console.log('\n5️⃣ Suggestions:');
    
    if (invalidGolfs.length > 0) {
      console.log(`   🔧 Nettoyer ${invalidGolfs.length} golfs invalides`);
    }
    
    if (invalidClusters.length > 0) {
      console.log(`   🔧 Vérifier le calcul des centres pour ${invalidClusters.length} clusters`);
    }
    
    if (validGolfs.length === 0) {
      console.log('   🚨 CRITIQUE: Aucun golf valide trouvé !');
    }
    
    if (validClusters.length === 0) {
      console.log('   🚨 CRITIQUE: Aucun cluster valide trouvé !');
    }

    // 6. Export pour débogage
    console.log('\n6️⃣ Export des données pour débogage...');
    
    const debugData = {
      summary: {
        totalGolfs: allGolfs.length,
        validGolfs: validGolfs.length,
        invalidGolfs: invalidGolfs.length,
        totalClusters: allClusters.length,
        validClusters: validClusters.length,
        invalidClusters: invalidClusters.length,
      },
      sampleValidCluster: validClusters[0] || null,
      sampleValidGolf: validGolfs[0] || null,
      firstInvalidGolf: invalidGolfs[0] || null,
      firstInvalidCluster: invalidClusters[0] || null,
    };
    
    console.log('📊 Résumé:', JSON.stringify(debugData.summary, null, 2));
    
    if (debugData.sampleValidCluster) {
      console.log('🎯 Exemple cluster valide:', {
        department: debugData.sampleValidCluster.department,
        count: debugData.sampleValidCluster.count,
        center: debugData.sampleValidCluster.center,
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error.message);
  }
}

// Exécuter le débogage
if (require.main === module) {
  debugMapData();
}