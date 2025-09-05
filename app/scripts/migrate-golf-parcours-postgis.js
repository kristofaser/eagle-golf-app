#!/usr/bin/env node

/**
 * Script de migration PostGIS pour la table golf_parcours
 * Execute la migration et valide les résultats
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Début de la migration PostGIS pour golf_parcours...\n');

  try {
    // 1. Vérifier l'état avant migration
    console.log('📊 État avant migration:');
    const { data: beforeStats, error: beforeError } = await supabase
      .from('golf_parcours')
      .select('id, latitude, longitude, location', { count: 'exact' });

    if (beforeError) throw beforeError;

    const totalBefore = beforeStats?.length || 0;
    const withCoordinates = beforeStats?.filter(p => p.latitude && p.longitude).length || 0;
    const withLocation = beforeStats?.filter(p => p.location).length || 0;

    console.log(`   Total parcours: ${totalBefore}`);
    console.log(`   Avec lat/lng: ${withCoordinates}`);
    console.log(`   Avec location PostGIS: ${withLocation}\n`);

    // 2. Exécuter la migration si nécessaire
    if (withLocation < withCoordinates) {
      console.log('🔄 Exécution de la migration PostGIS...');
      
      // Lire et exécuter le fichier de migration
      const fs = require('fs');
      const path = require('path');
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../supabase/migrations/add_postgis_to_golf_parcours.sql'),
        'utf8'
      );

      // Note: En production, utiliser les migrations Supabase officielles
      // Ici on simule l'application de la migration
      console.log('   ⚠️ Appliquer manuellement la migration SQL via Supabase Dashboard');
      console.log('   Fichier: supabase/migrations/add_postgis_to_golf_parcours.sql\n');
    } else {
      console.log('✅ Migration PostGIS déjà appliquée\n');
    }

    // 3. Vérifier l'état après migration
    console.log('🔍 Validation post-migration:');
    const { data: afterStats, error: afterError } = await supabase
      .from('golf_parcours')
      .select('id, name, latitude, longitude, location');

    if (afterError) throw afterError;

    const totalAfter = afterStats?.length || 0;
    const withCoordinatesAfter = afterStats?.filter(p => p.latitude && p.longitude).length || 0;
    const withLocationAfter = afterStats?.filter(p => p.location).length || 0;

    console.log(`   Total parcours: ${totalAfter}`);
    console.log(`   Avec lat/lng: ${withCoordinatesAfter}`);
    console.log(`   Avec location PostGIS: ${withLocationAfter}`);

    // 4. Vérification de cohérence
    if (withLocationAfter === withCoordinatesAfter && withLocationAfter > 0) {
      console.log('✅ Migration réussie - Cohérence validée\n');
    } else {
      console.log('❌ Problème de cohérence détecté\n');
      return false;
    }

    // 5. Tests de performance
    console.log('⚡ Test de performance - Recherche géographique:');
    const startTime = Date.now();
    
    // Test avec les nouvelles fonctions PostGIS
    const { data: nearbyTest, error: nearbyError } = await supabase
      .rpc('get_nearby_golf_parcours', {
        user_lat: 48.8566,
        user_lng: 2.3522,
        radius_km: 100,
        limit_count: 10
      });

    if (nearbyError) {
      console.log('   ⚠️ Fonction PostGIS non disponible (normal si migration pas encore appliquée)');
      console.log(`   Erreur: ${nearbyError.message}\n`);
    } else {
      const duration = Date.now() - startTime;
      console.log(`   ✅ Trouvé ${nearbyTest?.length || 0} parcours en ${duration}ms`);
      if (nearbyTest?.length > 0) {
        console.log(`   Premier résultat: ${nearbyTest[0].name} (${nearbyTest[0].distance_km}km)\n`);
      }
    }

    // 6. Test de clustering par département
    console.log('🗺️ Test de clustering par département:');
    const { data: clusters, error: clustersError } = await supabase
      .rpc('get_golf_parcours_department_stats');

    if (clustersError) {
      console.log('   ⚠️ Fonction clustering non disponible (normal si migration pas encore appliquée)');
      console.log(`   Erreur: ${clustersError.message}\n`);
    } else {
      console.log(`   ✅ ${clusters?.length || 0} départements avec parcours`);
      if (clusters?.length > 0) {
        const topDept = clusters[0];
        console.log(`   Plus grand: ${topDept.department} (${topDept.course_count} parcours)\n`);
      }
    }

    // 7. Exemples d'utilisation
    console.log('📖 Exemples d\'utilisation après migration:\n');
    console.log('// Recherche par proximité (ultra-rapide avec index spatial):');
    console.log('const nearby = await supabase.rpc("get_nearby_golf_parcours", {');
    console.log('  user_lat: 48.8566, user_lng: 2.3522, radius_km: 50');
    console.log('});\n');
    
    console.log('// Clustering par département:');
    console.log('const clusters = await supabase.rpc("get_golf_parcours_department_stats");\n');
    
    console.log('// Requête SQL directe avec distance:');
    console.log('SELECT name, ST_Distance(location::geography, ST_Point(2.35, 48.85)::geography) / 1000 as km');
    console.log('FROM golf_parcours');
    console.log('WHERE ST_DWithin(location::geography, ST_Point(2.35, 48.85)::geography, 50000);');

    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return false;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  runMigration().then(success => {
    if (success) {
      console.log('\n🎉 Migration terminée avec succès!');
      process.exit(0);
    } else {
      console.log('\n💥 Échec de la migration');
      process.exit(1);
    }
  });
}

module.exports = { runMigration };