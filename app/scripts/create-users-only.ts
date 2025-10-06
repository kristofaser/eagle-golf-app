import { createClient } from '@supabase/supabase-js';
import { Database } from '@/utils/supabase/types';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client admin avec la clé service role
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Données des utilisateurs pros
const proProfessionals = [
  {
    email: 'thomas.martin@example.com',
    password: 'azerty',
    profile: {
      first_name: 'Thomas',
      last_name: 'Martin',
      bio: "Professionnel PGA avec 15 ans d'expérience. Spécialisé dans l'amélioration du petit jeu.",
      phone: '+33 6 12 34 56 78',
      avatar_url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
      city: 'Paris',
      user_type: 'pro' as const,
    },
    proProfile: {
      professional_status: 'PGA Professional',
      hourly_rate: 8000, // 80€
      years_experience: 15,
      certifications: ['PGA France', 'TPI Certified'],
      specialties: ['putting', 'short-game', 'course-strategy'],
      languages: ['fr', 'en'],
      play_style: ['technique', 'practice'],
    },
  },
  {
    email: 'marie.dubois@example.com',
    password: 'azerty',
    profile: {
      first_name: 'Marie',
      last_name: 'Dubois',
      bio: 'Joueuse du tour européen, je partage ma passion et mon expertise technique.',
      phone: '+33 6 98 76 54 32',
      avatar_url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400',
      city: 'Versailles',
      user_type: 'pro' as const,
    },
    proProfile: {
      professional_status: 'LPGA Tour Player',
      hourly_rate: 12000, // 120€
      years_experience: 10,
      certifications: ['LPGA Teaching Professional', 'Trackman Certified'],
      specialties: ['swing-technique', 'mental-game', 'competition-prep'],
      languages: ['fr', 'en', 'es'],
      play_style: ['performance', 'mental'],
    },
  },
  {
    email: 'jean.bernard@example.com',
    password: 'azerty',
    profile: {
      first_name: 'Jean',
      last_name: 'Bernard',
      bio: "Coach mental et technique, j'aide les golfeurs à atteindre leur plein potentiel.",
      phone: '+33 6 45 67 89 01',
      avatar_url: 'https://images.unsplash.com/photo-1591491719574-7de5853b879a?w=400',
      city: 'Saint-Cloud',
      user_type: 'pro' as const,
    },
    proProfile: {
      professional_status: 'PGA Master Professional',
      hourly_rate: 10000, // 100€
      years_experience: 20,
      certifications: ['PGA Master Professional', 'Sport Psychology Certified'],
      specialties: ['mental-game', 'course-management', 'beginners'],
      languages: ['fr', 'en'],
      play_style: ['pedagogie', 'fun'],
    },
  },
];

// Données des utilisateurs amateurs
const amateurUsers = [
  {
    email: 'pierre.durand@example.com',
    password: 'azerty',
    profile: {
      first_name: 'Pierre',
      last_name: 'Durand',
      bio: 'Passionné de golf, je cherche à améliorer mon handicap.',
      phone: '+33 6 11 22 33 44',
      avatar_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
      city: 'Paris',
      user_type: 'amateur' as const,
    },
    amateurProfile: {
      handicap: 18,
      experience_level: 'intermediate' as const,
      preferred_play_style: ['improve-handicap', 'competition'],
      budget_range: 'medium' as const,
    },
  },
  {
    email: 'sophie.laurent@example.com',
    password: 'azerty',
    profile: {
      first_name: 'Sophie',
      last_name: 'Laurent',
      bio: 'Débutante motivée, je souhaite apprendre les bases du golf.',
      phone: '+33 6 55 44 33 22',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      city: 'Versailles',
      user_type: 'amateur' as const,
    },
    amateurProfile: {
      handicap: 54,
      experience_level: 'beginner' as const,
      preferred_play_style: ['learn-basics', 'fun'],
      budget_range: 'medium' as const,
    },
  },
];

async function createUsers() {
  console.log('🚀 Création des utilisateurs de test...');

  try {
    // Créer les professionnels
    console.log('\n👨‍🏫 Création des professionnels...');
    for (const pro of proProfessionals) {
      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: pro.email,
        password: pro.password,
        email_confirm: true,
        user_metadata: {
          first_name: pro.profile.first_name,
          last_name: pro.profile.last_name,
        },
      });

      if (authError) {
        console.error(`❌ Erreur création utilisateur ${pro.email}:`, authError);
        continue;
      }

      // Créer le profil
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        ...pro.profile,
      });

      if (profileError) {
        console.error(`❌ Erreur création profil ${pro.email}:`, profileError);
        continue;
      }

      // Créer le profil pro
      const { error: proProfileError } = await supabase.from('pro_profiles').insert({
        user_id: authData.user.id,
        ...pro.proProfile,
      });

      if (proProfileError) {
        console.error(`❌ Erreur création profil pro ${pro.email}:`, proProfileError);
        continue;
      }

      console.log(
        `✅ Pro créé: ${pro.profile.first_name} ${pro.profile.last_name} (${authData.user.id})`
      );
    }

    // Créer les amateurs
    console.log('\n🏌️ Création des amateurs...');
    for (const amateur of amateurUsers) {
      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: amateur.email,
        password: amateur.password,
        email_confirm: true,
        user_metadata: {
          first_name: amateur.profile.first_name,
          last_name: amateur.profile.last_name,
        },
      });

      if (authError) {
        console.error(`❌ Erreur création utilisateur ${amateur.email}:`, authError);
        continue;
      }

      // Créer le profil
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        ...amateur.profile,
      });

      if (profileError) {
        console.error(`❌ Erreur création profil ${amateur.email}:`, profileError);
        continue;
      }

      // Créer le profil amateur
      const { error: amateurProfileError } = await supabase.from('amateur_profiles').insert({
        user_id: authData.user.id,
        ...amateur.amateurProfile,
      });

      if (amateurProfileError) {
        console.error(`❌ Erreur création profil amateur ${amateur.email}:`, amateurProfileError);
        continue;
      }

      console.log(
        `✅ Amateur créé: ${amateur.profile.first_name} ${amateur.profile.last_name} (${authData.user.id})`
      );
    }

    // Créer des disponibilités pour les pros
    console.log('\n📅 Création des disponibilités...');
    const { data: pros } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('user_type', 'pro');

    const golfCourseIds = [
      '9258f316-eee7-4ca9-a069-406c2739e771', // Saint-Cloud
      '08daa4af-63d4-4db0-8adc-d0d8e8281a13', // Golf National
      '6bf67237-0830-4924-9edb-4ed6b2cde372', // Fontainebleau
    ];

    if (pros) {
      for (const pro of pros) {
        // Créer des disponibilités pour les 7 prochains jours
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          const dateStr = date.toISOString().split('T')[0];

          // 2 créneaux par jour sur différents parcours
          const slots = [
            { start: '09:00', end: '11:00', courseIdx: 0 },
            { start: '14:00', end: '16:00', courseIdx: 1 },
          ];

          for (const slot of slots) {
            const { error } = await supabase.from('pro_availabilities').insert({
              pro_id: pro.id,
              golf_course_id: golfCourseIds[slot.courseIdx],
              date: dateStr,
              start_time: slot.start,
              end_time: slot.end,
              max_players: Math.floor(Math.random() * 3) + 2, // 2-4 joueurs
              current_bookings: 0,
              is_recurring: false,
            });

            if (error) {
              console.error(`❌ Erreur création disponibilité:`, error);
            }
          }
        }
        console.log(`✅ Disponibilités créées pour ${pro.first_name} ${pro.last_name}`);
      }
    }

    console.log('\n✨ Création des utilisateurs terminée!');
    console.log('\n🔑 Identifiants de test:');
    console.log('Pros:', proProfessionals.map((p) => p.email).join(', '));
    console.log('Amateurs:', amateurUsers.map((a) => a.email).join(', '));
    console.log('Mot de passe: azerty');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la création
createUsers();
