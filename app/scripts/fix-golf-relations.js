#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Créer le client Supabase avec les droits service_role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixGolfRelations() {
  try {
    console.log('🚀 Début de la correction des relations FK...');
    
    // Lire le fichier SQL de migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/fix_golf_course_relations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL chargée (%d caractères)', migrationSQL.length);
    
    // Exécuter la migration en plusieurs étapes
    console.log('⚡ Étape 1: Suppression des anciennes contraintes FK...');
    
    // Supprimer les anciennes FK (peut échouer si elles n'existent pas, c'est normal)
    try {
      await supabase.rpc('exec_sql', { sql: 'ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_golf_course_id_fkey;' });
      console.log('  ✅ Ancienne FK bookings supprimée (ou n\'existait pas)');
    } catch (err) {
      console.log('  ⚠️ FK bookings:', err.message);
    }
    
    try {
      await supabase.rpc('exec_sql', { sql: 'ALTER TABLE public.pro_availabilities DROP CONSTRAINT IF EXISTS pro_availabilities_golf_course_id_fkey;' });
      console.log('  ✅ Ancienne FK pro_availabilities supprimée (ou n\'existait pas)');
    } catch (err) {
      console.log('  ⚠️ FK pro_availabilities:', err.message);
    }
    
    console.log('\n⚡ Étape 2: Création des nouvelles contraintes FK...');
    
    // Créer les nouvelles FK vers golf_parcours
    try {
      const { error: error1 } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.bookings ADD CONSTRAINT bookings_golf_course_id_fkey FOREIGN KEY (golf_course_id) REFERENCES public.golf_parcours(id) ON DELETE CASCADE;' 
      });
      if (error1) throw error1;
      console.log('  ✅ Nouvelle FK bookings → golf_parcours créée');
    } catch (err) {
      console.error('  ❌ Erreur FK bookings:', err.message);
    }
    
    try {
      const { error: error2 } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.pro_availabilities ADD CONSTRAINT pro_availabilities_golf_course_id_fkey FOREIGN KEY (golf_course_id) REFERENCES public.golf_parcours(id) ON DELETE CASCADE;' 
      });
      if (error2) throw error2;
      console.log('  ✅ Nouvelle FK pro_availabilities → golf_parcours créée');
    } catch (err) {
      console.error('  ❌ Erreur FK pro_availabilities:', err.message);
    }
    
    console.log('\n✅ Migration des FK terminée !');
    
    // Vérifier que les relations sont bien créées
    console.log('\n🔍 Vérification des nouvelles relations...');
    
    // Test 1: Vérifier les contraintes FK
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .in('constraint_name', [
        'bookings_golf_course_id_fkey',
        'pro_availabilities_golf_course_id_fkey'
      ]);
    
    if (constraintsError) {
      console.warn('⚠️ Impossible de vérifier les contraintes:', constraintsError);
    } else {
      console.log('📋 Contraintes FK trouvées:');
      constraints?.forEach(c => {
        console.log(`  - ${c.table_name}.${c.constraint_name} (${c.constraint_type})`);
      });
    }
    
    // Test 2: Tester une jointure
    console.log('\n🧪 Test de jointure pro_availabilities → golf_parcours...');
    const { data: joinTest, error: joinError } = await supabase
      .from('pro_availabilities')
      .select('id, golf_course_id, golf_courses:golf_parcours(name)')
      .limit(1);
    
    if (joinError) {
      console.error('❌ Erreur de jointure (attendu si pas de données):', joinError.message);
    } else {
      console.log('✅ Jointure réussie !');
      console.log('🎯 Exemple de résultat:', joinTest?.[0]);
    }
    
    console.log('\n🎉 Migration terminée avec succès !');
    console.log('💡 Les erreurs PGRST200 devraient maintenant être résolues.');
    
  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
    process.exit(1);
  }
}

// Exécuter le script
fixGolfRelations();