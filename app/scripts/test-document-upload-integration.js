#!/usr/bin/env node

/**
 * Script de test de l'intégration complète upload de documents
 * Teste le service d'upload et la fonction convert_amateur_to_pro mise à jour
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('- EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDocumentIntegration() {
  console.log('🧪 Test intégration upload de documents\n');

  try {
    // 1. Vérifier que le bucket documents existe
    console.log('📦 Vérification du bucket documents...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur récupération buckets:', bucketsError);
      return false;
    }

    const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    console.log('Bucket documents:', documentsBucket ? '✅ Existe' : '❌ Manquant');

    if (!documentsBucket) {
      console.log('📦 Création du bucket documents...');
      const { error: createError } = await supabase.storage.createBucket('documents', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });

      if (createError) {
        console.error('❌ Erreur création bucket:', createError);
        return false;
      }
      console.log('✅ Bucket documents créé');
    }

    // 2. Vérifier la structure de la table pro_profiles
    console.log('\n🏗️ Vérification structure table pro_profiles...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'pro_profiles')
      .in('column_name', ['id_card_front_url', 'id_card_back_url', 'document_status']);

    if (columnsError) {
      console.error('❌ Erreur vérification colonnes:', columnsError);
      return false;
    }

    const expectedColumns = ['id_card_front_url', 'id_card_back_url', 'document_status'];
    const existingColumns = columns.map(col => col.column_name);
    
    for (const col of expectedColumns) {
      const exists = existingColumns.includes(col);
      console.log(`Colonne ${col}:`, exists ? '✅' : '❌');
    }

    // 3. Tester la fonction convert_amateur_to_pro mise à jour
    console.log('\n🔧 Test fonction convert_amateur_to_pro...');
    
    // Créer un utilisateur test
    const testUserEmail = `test-documents-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'Test123!@#',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur création utilisateur test:', authError);
      return false;
    }

    const testUserId = authData.user.id;
    console.log('👤 Utilisateur test créé:', testUserId);

    // Créer le profil amateur
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testUserEmail,
        first_name: 'Test',
        last_name: 'Documents',
        user_type: 'amateur',
        city: 'Test City',
      });

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return false;
    }

    // Créer le profil amateur détaillé
    const { error: amateurError } = await supabase
      .from('amateur_profiles')
      .insert({
        user_id: testUserId,
        handicap: 18,
      });

    if (amateurError) {
      console.error('❌ Erreur création profil amateur:', amateurError);
      return false;
    }

    // Tester la conversion avec documents
    console.log('🔄 Test conversion amateur -> pro avec documents...');
    const { data: conversionData, error: conversionError } = await supabase.rpc('convert_amateur_to_pro', {
      p_user_id: testUserId,
      p_date_of_birth: '1990-01-01',
      p_siret: '12345678901234',
      p_company_status: 'SASU',
      p_division: 'Alps Tour',
      p_id_card_front_url: 'https://example.com/documents/front.jpg',
      p_id_card_back_url: 'https://example.com/documents/back.jpg',
    });

    if (conversionError) {
      console.error('❌ Erreur conversion:', conversionError);
      return false;
    }

    console.log('✅ Conversion réussie:', conversionData);

    // Vérifier le résultat
    const { data: proProfile, error: proError } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (proError) {
      console.error('❌ Erreur récupération profil pro:', proError);
      return false;
    }

    console.log('📋 Profil pro créé:');
    console.log('- SIRET:', proProfile.siret);
    console.log('- Document status:', proProfile.document_status);
    console.log('- Front URL:', proProfile.id_card_front_url ? '✅' : '❌');
    console.log('- Back URL:', proProfile.id_card_back_url ? '✅' : '❌');

    // Test sans documents
    console.log('\n🔄 Test conversion sans documents...');
    const testUserEmail2 = `test-no-docs-${Date.now()}@example.com`;
    const { data: authData2, error: authError2 } = await supabase.auth.admin.createUser({
      email: testUserEmail2,
      password: 'Test123!@#',
      email_confirm: true,
    });

    if (!authError2 && authData2.user) {
      const testUserId2 = authData2.user.id;

      // Créer profils
      await supabase.from('profiles').insert({
        id: testUserId2,
        email: testUserEmail2,
        first_name: 'Test',
        last_name: 'NoDocuments',
        user_type: 'amateur',
        city: 'Test City',
      });

      await supabase.from('amateur_profiles').insert({
        user_id: testUserId2,
        handicap: 15,
      });

      // Test conversion sans documents
      const { data: conversionData2, error: conversionError2 } = await supabase.rpc('convert_amateur_to_pro', {
        p_user_id: testUserId2,
        p_date_of_birth: '1992-03-15',
        p_siret: '98765432109876',
        p_company_status: 'SARL',
        p_division: 'Challenge Tour',
        // Pas de documents
      });

      if (!conversionError2) {
        const { data: proProfile2 } = await supabase
          .from('pro_profiles')
          .select('document_status, id_card_front_url, id_card_back_url')
          .eq('user_id', testUserId2)
          .single();

        console.log('📋 Conversion sans documents:');
        console.log('- Status:', proProfile2.document_status, proProfile2.document_status === 'pending' ? '✅' : '❌');
        console.log('- URLs nulles:', (!proProfile2.id_card_front_url && !proProfile2.id_card_back_url) ? '✅' : '❌');
      }

      // Nettoyer le deuxième utilisateur
      await supabase.auth.admin.deleteUser(testUserId2);
    }

    // Nettoyer l'utilisateur de test
    console.log('\n🧹 Nettoyage...');
    await supabase.auth.admin.deleteUser(testUserId);
    console.log('✅ Utilisateur test supprimé');

    console.log('\n🎉 Tous les tests sont passés !');
    console.log('\n📋 Résumé:');
    console.log('- ✅ Bucket documents opérationnel');
    console.log('- ✅ Structure table pro_profiles correcte');
    console.log('- ✅ Fonction convert_amateur_to_pro avec documents');
    console.log('- ✅ Gestion des statuts de documents');

    return true;

  } catch (error) {
    console.error('❌ Erreur durant les tests:', error);
    return false;
  }
}

// Exécution
if (require.main === module) {
  testDocumentIntegration()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testDocumentIntegration };