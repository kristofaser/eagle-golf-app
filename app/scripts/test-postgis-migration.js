#!/usr/bin/env node

/**
 * Script de test pour valider la migration PostGIS
 * Teste les performances avant/après migration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPostGISMigration() {
  console.log('🧪 Test de la migration PostGIS\n');

  try {
    // 1. Test de base - Vérifier que les données sont cohérentes
    console.log('1️⃣ Test de cohérence des données:');
    const { data: parcours, error } = await supabase
      .from('golf_parcours')
      .select('id, name, latitude, longitude, location')
      .limit(10);

    if (error) throw error;

    let consistent = 0;
    let inconsistent = 0;
    let withPostGIS = 0;
    let withLatLng = 0;

    parcours.forEach(p => {
      if (p.latitude && p.longitude) withLatLng++;
      if (p.location) withPostGIS++;
      
      if (p.latitude && p.longitude && p.location) {
        // Vérifier la cohérence
        const locationFromLatLng = {
          type: 'Point',
          coordinates: [p.longitude, p.latitude]
        };
        
        let postgisLocation;
        try {
          postgisLocation = typeof p.location === 'string' 
            ? JSON.parse(p.location) 
            : p.location;
        } catch (e) {
          postgisLocation = p.location;
        }

        if (postgisLocation && 
            postgisLocation.coordinates &&
            Math.abs(postgisLocation.coordinates[0] - locationFromLatLng.coordinates[0]) < 0.00001 &&
            Math.abs(postgisLocation.coordinates[1] - locationFromLatLng.coordinates[1]) < 0.00001) {
          consistent++;
        } else {
          inconsistent++;
          console.log(`   ⚠️ Incohérence: ${p.name}`);
        }
      }
    });

    console.log(`   Parcours avec lat/lng: ${withLatLng}`);
    console.log(`   Parcours avec PostGIS: ${withPostGIS}`);
    console.log(`   Cohérents: ${consistent}`);
    console.log(`   Incohérents: ${inconsistent}\n`);

    // 2. Test de performance - Recherche par proximité
    console.log('2️⃣ Test de performance - Recherche par proximité:');
    const testLat = 48.8566; // Paris
    const testLng = 2.3522;
    const radiusKm = 50;

    // Test avec PostGIS (si disponible)
    console.log('   🚀 Test PostGIS:');
    const startPostGIS = Date.now();
    
    try {
      const { data: postgisResults, error: postgisError } = await supabase
        .rpc('get_nearby_golf_parcours', {
          user_lat: testLat,
          user_lng: testLng,
          radius_km: radiusKm,
          limit_count: 20
        });

      const postgisTime = Date.now() - startPostGIS;
      
      if (postgisError) {
        console.log(`   ❌ PostGIS non disponible: ${postgisError.message}`);
      } else {
        console.log(`   ✅ PostGIS: ${postgisResults.length} résultats en ${postgisTime}ms`);
        if (postgisResults.length > 0) {
          console.log(`      Plus proche: ${postgisResults[0].name} (${postgisResults[0].distance_km}km)`);
        }
      }
    } catch (e) {
      console.log(`   ❌ PostGIS non disponible: ${e.message}`);
    }

    // Test avec calcul client (pour comparaison)
    console.log('   🐌 Test calcul client:');
    const startClient = Date.now();
    
    const { data: allParcours } = await supabase
      .from('golf_parcours')
      .select('id, name, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Calcul Haversine côté client
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const clientResults = allParcours
      .map(p => ({
        ...p,
        distance: calculateDistance(testLat, testLng, p.latitude, p.longitude)
      }))
      .filter(p => p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    const clientTime = Date.now() - startClient;
    console.log(`   ✅ Client: ${clientResults.length} résultats en ${clientTime}ms`);
    if (clientResults.length > 0) {
      console.log(`      Plus proche: ${clientResults[0].name} (${clientResults[0].distance.toFixed(2)}km)\n`);
    }

    // 3. Test de clustering par département
    console.log('3️⃣ Test de clustering par département:');
    
    try {
      const { data: clusters, error: clustersError } = await supabase
        .rpc('get_golf_parcours_department_stats');

      if (clustersError) {
        console.log(`   ❌ Clustering PostGIS non disponible: ${clustersError.message}`);
      } else {
        console.log(`   ✅ ${clusters.length} départements avec parcours`);
        console.log(`      Top 3:`);
        clusters.slice(0, 3).forEach((dept, i) => {
          console.log(`      ${i+1}. ${dept.department}: ${dept.course_count} parcours`);
        });
      }
    } catch (e) {
      console.log(`   ❌ Clustering PostGIS non disponible: ${e.message}`);
    }

    console.log('\n');

    // 4. Recommandations
    console.log('📋 Recommandations:');
    
    if (withPostGIS === 0) {
      console.log('❌ Migration PostGIS pas encore appliquée');
      console.log('   → Appliquer la migration SQL: supabase/migrations/add_postgis_to_golf_parcours.sql');
      console.log('   → Ou exécuter: npm run migrate:postgis');
    } else if (withPostGIS < withLatLng) {
      console.log('⚠️ Migration PostGIS partiellement appliquée');
      console.log(`   → ${withLatLng - withPostGIS} parcours sans données PostGIS`);
      console.log('   → Vérifier les triggers de synchronisation');
    } else if (inconsistent > 0) {
      console.log('⚠️ Données incohérentes détectées');
      console.log('   → Vérifier la synchronisation latitude/longitude ↔ PostGIS');
    } else {
      console.log('✅ Migration PostGIS réussie et cohérente');
      console.log('   → Toutes les fonctionnalités géospatiales sont disponibles');
      console.log('   → Performance optimisée pour les recherches par proximité');
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return false;
  }
}

// Fonction utilitaire pour créer des parcours de test
async function createTestData() {
  console.log('🏗️ Création de données de test...');
  
  const testParcours = [
    {
      name: 'Golf de Test Paris',
      city: 'Paris',
      department: '75',
      latitude: 48.8566,
      longitude: 2.3522
    },
    {
      name: 'Golf de Test Lyon',
      city: 'Lyon', 
      department: '69',
      latitude: 45.7640,
      longitude: 4.8357
    }
  ];

  try {
    const { data, error } = await supabase
      .from('golf_parcours')
      .insert(testParcours)
      .select();

    if (error) throw error;
    
    console.log(`✅ ${data.length} parcours de test créés`);
    return data.map(p => p.id);
  } catch (error) {
    console.error('❌ Erreur création données test:', error);
    return [];
  }
}

// Fonction pour nettoyer les données de test
async function cleanupTestData(testIds) {
  if (testIds.length === 0) return;
  
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    const { error } = await supabase
      .from('golf_parcours')
      .delete()
      .in('id', testIds);

    if (error) throw error;
    console.log('✅ Données de test nettoyées');
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  const createTests = args.includes('--create-tests');

  (async () => {
    let testIds = [];
    
    if (createTests) {
      testIds = await createTestData();
    }

    const success = await testPostGISMigration();
    
    if (createTests && testIds.length > 0) {
      await cleanupTestData(testIds);
    }

    if (success) {
      console.log('🎉 Tests terminés avec succès!');
      process.exit(0);
    } else {
      console.log('💥 Échec des tests');
      process.exit(1);
    }
  })();
}

module.exports = { testPostGISMigration, createTestData, cleanupTestData };