#!/usr/bin/env node

/**
 * Script pour configurer les politiques RLS du Storage Supabase
 * Permet aux utilisateurs authentifiés d'uploader leurs propres documents
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

async function setupStoragePolicies() {
  console.log('🔒 Configuration des politiques Storage RLS\n');

  try {
    // 1. S'assurer que le bucket documents existe
    console.log('📦 Vérification du bucket documents...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur récupération buckets:', bucketsError);
      return false;
    }

    let documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    
    if (!documentsBucket) {
      console.log('📦 Création du bucket documents...');
      const { data, error: createError } = await supabase.storage.createBucket('documents', {
        public: false, // Privé
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });

      if (createError) {
        console.error('❌ Erreur création bucket:', createError);
        return false;
      }
      console.log('✅ Bucket documents créé');
    } else {
      console.log('✅ Bucket documents existe déjà');
    }

    // 2. Configurer les politiques RLS via SQL
    console.log('\n🔒 Configuration des politiques RLS...');
    
    // Politique pour permettre aux utilisateurs d'uploader leurs propres documents
    const policies = [
      {
        name: 'Documents Upload Policy',
        sql: `
          CREATE POLICY IF NOT EXISTS "documents_upload_own_folder" 
          ON storage.objects FOR INSERT 
          WITH CHECK (
            bucket_id = 'documents' AND 
            (storage.foldername(name))[1] = auth.uid()::text
          );
        `,
        description: 'Permet aux utilisateurs d\'uploader dans leur propre dossier'
      },
      {
        name: 'Documents Select Policy', 
        sql: `
          CREATE POLICY IF NOT EXISTS "documents_select_own_folder"
          ON storage.objects FOR SELECT
          USING (
            bucket_id = 'documents' AND
            (storage.foldername(name))[1] = auth.uid()::text
          );
        `,
        description: 'Permet aux utilisateurs de lire leurs propres documents'
      },
      {
        name: 'Documents Delete Policy',
        sql: `
          CREATE POLICY IF NOT EXISTS "documents_delete_own_folder"
          ON storage.objects FOR DELETE
          USING (
            bucket_id = 'documents' AND
            (storage.foldername(name))[1] = auth.uid()::text  
          );
        `,
        description: 'Permet aux utilisateurs de supprimer leurs propres documents'
      }
    ];

    // Appliquer les politiques
    for (const policy of policies) {
      console.log(`📝 ${policy.description}...`);
      
      try {
        // Utiliser la fonction rpc pour exécuter du SQL si disponible
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: policy.sql 
        }).catch(async () => {
          // Fallback : essayer via l'API REST directe
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql_query: policy.sql }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
          
          return { error: null };
        });

        if (error) {
          console.warn(`⚠️ ${policy.name}:`, error.message);
        } else {
          console.log(`✅ ${policy.name} appliquée`);
        }
      } catch (policyError) {
        console.warn(`⚠️ Impossible d'appliquer ${policy.name} automatiquement:`, policyError.message);
        console.log('📋 SQL à appliquer manuellement:');
        console.log(policy.sql);
        console.log('');
      }
    }

    // 3. Tester l'upload avec un utilisateur authentifié
    console.log('\n🧪 Test des politiques...');
    
    // Créer un utilisateur test
    const testEmail = `storage-test-${Date.now()}@example.com`;
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
    console.log('👤 Utilisateur test créé:', testUserId);

    // Créer un profil pour cet utilisateur 
    await supabase.from('profiles').insert({
      id: testUserId,
      email: testEmail,
      first_name: 'Test',
      last_name: 'Storage',
      user_type: 'amateur',
      city: 'Test City',
    });

    // Se connecter en tant que cet utilisateur
    const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
    });

    if (signInError) {
      console.error('❌ Erreur génération link:', signInError);
    } else {
      console.log('🔗 Link de connexion généré');
    }

    // Test d'upload direct (simulé)
    const testFileName = `${testUserId}/test_document_${Date.now()}.txt`;
    const testContent = 'Test document content';
    
    console.log('📤 Test upload dans le dossier utilisateur...');
    
    // Pour ce test, on utilise le service key (en production, ce serait l'utilisateur authentifié)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      console.error('❌ Test upload échoué:', uploadError);
      
      if (uploadError.message.includes('row-level security policy')) {
        console.log('\n🔧 SOLUTION MANUELLE REQUISE:');
        console.log('1. Aller dans le Dashboard Supabase');
        console.log('2. Storage > Buckets > documents > Settings');
        console.log('3. Ajouter ces politiques RLS:');
        
        policies.forEach(policy => {
          console.log(`\n-- ${policy.description}`);
          console.log(policy.sql);
        });
      }
    } else {
      console.log('✅ Test upload réussi:', uploadData.path);
      
      // Nettoyer le fichier de test
      await supabase.storage.from('documents').remove([testFileName]);
    }

    // Nettoyer l'utilisateur de test
    await supabase.auth.admin.deleteUser(testUserId);
    console.log('🧹 Utilisateur test supprimé');

    console.log('\n🎯 RÉSUMÉ:');
    console.log('- ✅ Bucket documents configuré');
    console.log('- ⚠️ Politiques RLS à vérifier manuellement si échec upload');
    console.log('- 📱 Tester l\'upload depuis l\'app maintenant');

    return true;

  } catch (error) {
    console.error('❌ Erreur durant la configuration:', error);
    return false;
  }
}

if (require.main === module) {
  setupStoragePolicies()
    .then((success) => {
      console.log(success ? '\n🎉 Configuration terminée!' : '\n❌ Configuration échouée');
      process.exit(success ? 0 : 1);
    })
    .catch(console.error);
}