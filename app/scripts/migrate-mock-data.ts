import { createClient } from '@supabase/supabase-js';
import { Database } from '@/utils/supabase/types';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client admin avec la clé service role
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Données mock pour les parcours de golf
const golfCourses = [
  {
    name: 'Golf de Saint-Cloud',
    address: "Rue de l'Hirondelle",
    city: 'Saint-Cloud',
    postal_code: '92210',
    country: 'France',
    location: { type: 'Point', coordinates: [2.21667, 48.8667] },
    phone: '+33 1 47 01 01 85',
    email: 'contact@golfsaintcloud.com',
    website: 'https://www.golfsaintcloud.com',
    description: 'Un parcours prestigieux aux portes de Paris',
    hole_count: 36,
    par: 72,
    green_fee_weekday: 8500, // 85€ en centimes
    green_fee_weekend: 12000, // 120€ en centimes
    amenities: ['practice', 'restaurant', 'proshop', 'cart'],
    booking_required: true,
    active: true,
  },
  {
    name: 'Golf National',
    address: '2 Avenue du Golf',
    city: 'Guyancourt',
    postal_code: '78280',
    country: 'France',
    location: { type: 'Point', coordinates: [2.0758, 48.7539] },
    phone: '+33 1 30 43 36 00',
    email: 'info@golf-national.com',
    website: 'https://www.golf-national.com',
    description: 'Le parcours de la Ryder Cup 2018',
    hole_count: 54,
    par: 72,
    green_fee_weekday: 13000, // 130€
    green_fee_weekend: 16000, // 160€
    amenities: ['practice', 'restaurant', 'proshop', 'cart', 'academy'],
    booking_required: true,
    active: true,
  },
  {
    name: 'Golf de Fontainebleau',
    address: 'Route de Melun',
    city: 'Fontainebleau',
    postal_code: '77300',
    country: 'France',
    location: { type: 'Point', coordinates: [2.6956, 48.41] },
    phone: '+33 1 64 22 22 95',
    email: 'contact@golffontainebleau.fr',
    website: 'https://www.golffontainebleau.fr',
    description: 'Un parcours historique en forêt',
    hole_count: 18,
    par: 72,
    green_fee_weekday: 7000, // 70€
    green_fee_weekend: 9500, // 95€
    amenities: ['practice', 'restaurant', 'proshop'],
    booking_required: false,
    active: true,
  },
];

// Données mock pour les utilisateurs pros
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
      hourly_rate: 8000, // 80€
      years_experience: 15,
      certifications: ['PGA France', 'TPI Certified'],
      specialties: ['putting', 'short-game', 'course-strategy'],
      languages: ['fr', 'en'],
      equipment_provided: true,
      lesson_duration_options: [60, 90, 120],
      max_group_size: 4,
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
      hourly_rate: 12000, // 120€
      years_experience: 10,
      certifications: ['LPGA Teaching Professional', 'Trackman Certified'],
      specialties: ['swing-technique', 'mental-game', 'competition-prep'],
      languages: ['fr', 'en', 'es'],
      equipment_provided: true,
      lesson_duration_options: [60, 90],
      max_group_size: 2,
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
      hourly_rate: 10000, // 100€
      years_experience: 20,
      certifications: ['PGA Master Professional', 'Sport Psychology Certified'],
      specialties: ['mental-game', 'course-management', 'beginners'],
      languages: ['fr', 'en'],
      equipment_provided: false,
      lesson_duration_options: [60, 120, 240], // Inclut les stages demi-journée
      max_group_size: 6,
    },
  },
];

// Données mock pour les utilisateurs amateurs
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
      handicap: 18.5,
      home_course: 'Golf de Saint-Cloud',
      playing_frequency: 'weekly',
      goals: ['improve-handicap', 'competition'],
      preferred_lesson_type: 'individual',
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
      home_course: 'Golf National',
      playing_frequency: 'monthly',
      goals: ['learn-basics', 'fun'],
      preferred_lesson_type: 'group',
    },
  },
];

async function migrateData() {
  console.log('🚀 Début de la migration des données mock vers Supabase...');

  try {
    // 1. Créer les parcours de golf
    console.log('\n📍 Création des parcours de golf...');
    const { data: insertedCourses, error: coursesError } = await supabase
      .from('golf_courses')
      .insert(golfCourses)
      .select();

    if (coursesError) {
      console.error('❌ Erreur lors de la création des parcours:', coursesError);
      return;
    }
    console.log(`✅ ${insertedCourses?.length} parcours créés`);

    // 2. Créer les professionnels
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

      console.log(`✅ Pro créé: ${pro.profile.first_name} ${pro.profile.last_name}`);
    }

    // 3. Créer les amateurs
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

      console.log(`✅ Amateur créé: ${amateur.profile.first_name} ${amateur.profile.last_name}`);
    }

    // 4. Créer quelques disponibilités pour les pros
    console.log('\n📅 Création des disponibilités...');
    const { data: pros } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('user_type', 'pro');

    const { data: courses } = await supabase.from('golf_courses').select('id, name');

    if (pros && courses) {
      for (const pro of pros) {
        // Créer des disponibilités pour les 7 prochains jours
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          const dateStr = date.toISOString().split('T')[0];

          // 2-3 créneaux par jour
          const slots = [
            { start: '09:00', end: '11:00' },
            { start: '14:00', end: '16:00' },
            ...(Math.random() > 0.5 ? [{ start: '16:30', end: '18:30' }] : []),
          ];

          for (const slot of slots) {
            const course = courses[Math.floor(Math.random() * courses.length)];

            const { error } = await supabase.from('pro_availabilities').insert({
              pro_id: pro.id,
              golf_course_id: course.id,
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

    console.log('\n✨ Migration terminée avec succès!');
    console.log('\n📊 Résumé:');
    console.log(`- ${insertedCourses?.length} parcours de golf`);
    console.log(`- ${proProfessionals.length} professionnels`);
    console.log(`- ${amateurUsers.length} amateurs`);
    console.log('\n🔑 Identifiants de test:');
    console.log('Pros:', proProfessionals.map((p) => p.email).join(', '));
    console.log('Amateurs:', amateurUsers.map((a) => a.email).join(', '));
    console.log('Mot de passe: azerty');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la migration
migrateData();
