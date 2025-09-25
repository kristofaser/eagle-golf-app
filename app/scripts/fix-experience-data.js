#!/usr/bin/env node

/**
 * Script pour corriger les données d'expérience mal formatées dans la base de données
 * Convertit les chaînes JSON et les anciens formats d'objet en tableaux d'objets corrects
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixExperienceData() {
  console.log('🔧 Début de la correction des données d\'expérience...\n');

  try {
    // Récupérer tous les profils pro avec des expériences
    const { data: profiles, error: fetchError } = await supabase
      .from('pro_profiles')
      .select('user_id, experience')
      .not('experience', 'is', null);

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des données:', fetchError);
      return;
    }

    console.log(`📊 ${profiles.length} profils trouvés avec des expériences\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      const { user_id, experience } = profile;
      let needsFix = false;
      let fixedExperience = null;

      // Analyser le format actuel
      if (typeof experience === 'string') {
        // C'est une chaîne JSON qui doit être parsée
        console.log(`🔍 User ${user_id}: Chaîne JSON détectée`);
        try {
          fixedExperience = JSON.parse(experience);
          if (!Array.isArray(fixedExperience)) {
            console.log(`  ⚠️ Le résultat n'est pas un tableau, conversion en tableau vide`);
            fixedExperience = [];
          }
          needsFix = true;
        } catch (e) {
          console.log(`  ❌ Erreur de parsing, conversion en tableau vide`);
          fixedExperience = [];
          needsFix = true;
        }
      } else if (typeof experience === 'object' && !Array.isArray(experience)) {
        // C'est un objet (ancien format avec compteurs)
        console.log(`🔍 User ${user_id}: Ancien format d'objet détecté`);
        fixedExperience = [];
        needsFix = true;
      } else if (Array.isArray(experience)) {
        // C'est déjà un tableau, vérifier qu'il est valide
        console.log(`✅ User ${user_id}: Format correct (tableau)`);
        // Pas besoin de correction
      } else {
        console.log(`❓ User ${user_id}: Format inconnu, conversion en tableau vide`);
        fixedExperience = [];
        needsFix = true;
      }

      // Appliquer la correction si nécessaire
      if (needsFix) {
        const { error: updateError } = await supabase
          .from('pro_profiles')
          .update({ experience: fixedExperience })
          .eq('user_id', user_id);

        if (updateError) {
          console.log(`  ❌ Erreur lors de la mise à jour:`, updateError);
          errorCount++;
        } else {
          console.log(`  ✅ Données corrigées avec succès`);
          fixedCount++;
        }
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  ✅ ${fixedCount} profils corrigés`);
    console.log(`  ❌ ${errorCount} erreurs`);
    console.log(`  📝 ${profiles.length - fixedCount - errorCount} profils déjà au bon format`);
    console.log('\n✨ Correction terminée!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
fixExperienceData();