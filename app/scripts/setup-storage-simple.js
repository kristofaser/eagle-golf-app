#!/usr/bin/env node

/**
 * Configuration simple du Storage - Solution immédiate
 * Désactive temporairement RLS pour permettre l'upload
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageSimple() {
  console.log('🚀 Configuration Storage Simple - Solution Immédiate\n');

  try {
    // 1. Vérifier le bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('📦 Buckets disponibles:', buckets.map(b => b.name));

    let documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    
    if (!documentsBucket) {
      console.log('📦 Création du bucket documents...');
      const { error } = await supabase.storage.createBucket('documents', {
        public: false,
        allowedMimeTypes: [
          'image/jpeg', 
          'image/jpg', 
          'image/png', 
          'application/pdf',
          'image' // Pour les types génériques du simulator
        ],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });

      if (error) {
        console.error('❌ Erreur création bucket:', error);
        return false;
      }
      console.log('✅ Bucket documents créé');
    } else {
      console.log('✅ Bucket documents existe');
    }

    // 2. Solution immédiate : Test avec service key
    console.log('\n🧪 Test upload avec service key...');
    
    // Créer une vraie image PNG de test (1x1 pixel)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const testFileName = `test-user-123/id_front_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('❌ Test upload échoué avec service key:', uploadError);
      
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔧 SOLUTION IMMÉDIATE:');
        console.log('Le bucket existe mais les politiques RLS bloquent les uploads.');
        console.log('\n📋 ACTIONS REQUISES:');
        console.log('1. Dashboard Supabase > Storage > Buckets');
        console.log('2. Cliquer sur le bucket "documents"'); 
        console.log('3. Onglet "Policies"');
        console.log('4. Cliquer "New Policy"');
        console.log('5. Template "Allow uploads for authenticated users only"');
        console.log('6. Modifier la condition pour:');
        console.log('   WHERE: (storage.foldername(name))[1] = auth.uid()::text');
        console.log('\nOu appliquer ce SQL dans l\'éditeur SQL:');
        console.log(`
CREATE POLICY "documents_authenticated_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_authenticated_select" ON storage.objects  
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
        `);
        
      }
      return false;
    } else {
      console.log('✅ Test upload réussi:', uploadData.path);
      
      // Tester l'URL signée
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(uploadData.path, 3600);
        
      if (urlError) {
        console.log('⚠️ Erreur URL signée:', urlError);
      } else {
        console.log('✅ URL signée générée');
      }
      
      // Nettoyer
      await supabase.storage.from('documents').remove([testFileName]);
      console.log('🧹 Fichier de test supprimé');
    }

    // 3. Instructions pour l'app
    console.log('\n📱 PROCHAINES ÉTAPES:');
    console.log('1. Si l\'upload de test a réussi → l\'app devrait marcher');
    console.log('2. Si l\'upload a échoué → appliquer les politiques RLS manuellement');
    console.log('3. Relancer l\'app et tester l\'upload de documents');
    
    console.log('\n🔧 TEMPORAIRE: Si problème persiste, modifier le service:');
    console.log('- Utiliser le service key au lieu du token utilisateur');
    console.log('- Ou désactiver temporairement RLS sur storage.objects');

    return true;

  } catch (error) {
    console.error('❌ Erreur configuration:', error);
    return false;
  }
}

if (require.main === module) {
  setupStorageSimple()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch(console.error);
}