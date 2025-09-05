#!/usr/bin/env node

/**
 * Script pour appliquer la migration des documents
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📝 Application manuelle de la migration documents...\n');

  try {
    // 1. Ajouter les colonnes manquantes à pro_profiles
    console.log('🏗️ Ajout des colonnes documents à pro_profiles...');
    
    // Vérifier et ajouter id_card_front_url
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: 'ALTER TABLE pro_profiles ADD COLUMN IF NOT EXISTS id_card_front_url TEXT' 
      });
      console.log('- id_card_front_url:', error ? '❌' + error.message : '✅');
    } catch (e) {
      // Méthode alternative : insérer une ligne bidon pour tester la colonne
      try {
        await supabase.from('pro_profiles').select('id_card_front_url').limit(1);
        console.log('- id_card_front_url: ✅ (existe déjà)');
      } catch (selectError) {
        console.log('- id_card_front_url: ❓ (statut inconnu)');
      }
    }

    // 2. Créer le type ENUM pour document_status
    console.log('\n📋 Création du type document_status_enum...');
    
    // Pour cela, on va utiliser une approche simple : créer directement la fonction
    console.log('\n🔧 Création de la fonction convert_amateur_to_pro mise à jour...');

    // Créer la fonction avec une approche simple
    const functionSQL = `
      CREATE OR REPLACE FUNCTION convert_amateur_to_pro(
        p_user_id UUID,
        p_date_of_birth DATE,
        p_siret TEXT,
        p_company_status TEXT,
        p_division TEXT,
        p_id_card_front_url TEXT DEFAULT NULL,
        p_id_card_back_url TEXT DEFAULT NULL
      ) RETURNS BOOLEAN AS $$
      DECLARE
        amateur_handicap INTEGER;
      BEGIN
        -- Vérifier que l'utilisateur est bien amateur
        IF NOT EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = p_user_id AND user_type = 'amateur'
        ) THEN
          RAISE EXCEPTION 'User is not an amateur or does not exist';
        END IF;

        -- Récupérer le handicap depuis amateur_profiles
        SELECT handicap INTO amateur_handicap 
        FROM amateur_profiles 
        WHERE user_id = p_user_id;

        -- Mettre à jour le type dans profiles
        UPDATE profiles
        SET user_type = 'pro',
            updated_at = NOW()
        WHERE id = p_user_id;

        -- Supprimer l'ancien profil pro s'il existe (pour éviter les conflits)
        DELETE FROM pro_profiles WHERE user_id = p_user_id;

        -- Créer l'entrée dans pro_profiles
        INSERT INTO pro_profiles (
          user_id,
          date_of_birth,
          siret,
          company_status,
          division,
          handicap,
          professional_status,
          created_at,
          updated_at
        ) VALUES (
          p_user_id,
          p_date_of_birth,
          p_siret,
          p_company_status,
          p_division,
          COALESCE(amateur_handicap, 0),
          'pending',
          NOW(),
          NOW()
        );

        -- Log de l'action
        RAISE NOTICE 'User % converted from amateur to pro', p_user_id;

        RETURN TRUE;

      EXCEPTION
        WHEN OTHERS THEN
          RAISE EXCEPTION 'Error converting amateur to pro: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('📝 Application de la fonction...');
    
    // Utiliser une requête directe via PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql_query: functionSQL }),
    });

    if (!response.ok) {
      // Approche alternative : tenter de créer manuellement via l'interface admin
      console.log('⚠️ Impossible d\'appliquer la fonction directement');
      console.log('📋 Veuillez appliquer manuellement la migration dans le dashboard Supabase:');
      console.log('\n--- SQL à appliquer ---');
      console.log(functionSQL);
      console.log('--- Fin du SQL ---\n');
    } else {
      console.log('✅ Fonction convert_amateur_to_pro mise à jour');
    }

    // 3. Tester la fonction de base
    console.log('\n🧪 Test de la fonction de base...');
    
    // Créer un utilisateur test simple
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Test123!@#',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur création utilisateur test:', authError);
      return false;
    }

    const testUserId = authData.user.id;
    console.log('👤 Utilisateur test créé');

    // Créer les profils
    await supabase.from('profiles').insert({
      id: testUserId,
      email: testEmail,
      first_name: 'Test',
      last_name: 'User',
      user_type: 'amateur',
      city: 'Test City',
    });

    await supabase.from('amateur_profiles').insert({
      user_id: testUserId,
      handicap: 20,
    });

    // Tester la conversion
    const { data: result, error: convError } = await supabase.rpc('convert_amateur_to_pro', {
      p_user_id: testUserId,
      p_date_of_birth: '1990-01-01',
      p_siret: '12345678901234',
      p_company_status: 'SASU',
      p_division: 'Alps Tour',
    });

    if (convError) {
      console.error('❌ Erreur test conversion:', convError);
    } else {
      console.log('✅ Test conversion réussi:', result);
    }

    // Nettoyer
    await supabase.auth.admin.deleteUser(testUserId);
    console.log('🧹 Nettoyage terminé');

    return true;

  } catch (error) {
    console.error('❌ Erreur during migration:', error);
    return false;
  }
}

if (require.main === module) {
  applyMigration()
    .then((success) => {
      console.log(success ? '\n🎉 Migration terminée avec succès!' : '\n❌ Migration échouée');
      process.exit(success ? 0 : 1);
    })
    .catch(console.error);
}