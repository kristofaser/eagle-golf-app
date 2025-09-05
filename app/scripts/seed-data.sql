-- Script de seed pour les données de test Eagle Golf
-- À exécuter dans le SQL Editor du dashboard Supabase

-- 1. Insérer les parcours de golf
INSERT INTO golf_courses (name, address, city, postal_code, country, location, phone, email, website, description, hole_count, par, green_fee_weekday, green_fee_weekend, amenities, booking_required, active) VALUES
  ('Golf de Saint-Cloud', 'Rue de l''Hirondelle', 'Saint-Cloud', '92210', 'France', ST_SetSRID(ST_MakePoint(2.21667, 48.8667), 4326), '+33 1 47 01 01 85', 'contact@golfsaintcloud.com', 'https://www.golfsaintcloud.com', 'Un parcours prestigieux aux portes de Paris', 36, 72, 8500, 12000, ARRAY['practice', 'restaurant', 'proshop', 'cart'], true, true),
  ('Golf National', '2 Avenue du Golf', 'Guyancourt', '78280', 'France', ST_SetSRID(ST_MakePoint(2.0758, 48.7539), 4326), '+33 1 30 43 36 00', 'info@golf-national.com', 'https://www.golf-national.com', 'Le parcours de la Ryder Cup 2018', 54, 72, 13000, 16000, ARRAY['practice', 'restaurant', 'proshop', 'cart', 'academy'], true, true),
  ('Golf de Fontainebleau', 'Route de Melun', 'Fontainebleau', '77300', 'France', ST_SetSRID(ST_MakePoint(2.6956, 48.4100), 4326), '+33 1 64 22 22 95', 'contact@golffontainebleau.fr', 'https://www.golffontainebleau.fr', 'Un parcours historique en forêt', 18, 72, 7000, 9500, ARRAY['practice', 'restaurant', 'proshop'], false, true);

-- 2. Créer des utilisateurs de test (nécessite auth.users)
-- Note: Ces utilisateurs doivent être créés via le dashboard Supabase ou l'API Auth
-- Voici les IDs fictifs pour les exemples

-- IDs des utilisateurs (à remplacer par les vrais IDs après création)
-- Pro 1: Thomas Martin
-- Pro 2: Marie Dubois  
-- Pro 3: Jean Bernard
-- Amateur 1: Pierre Durand
-- Amateur 2: Sophie Laurent

-- 3. Insérer les profils (après avoir créé les utilisateurs)
-- Remplacer les UUIDs par les vrais IDs des utilisateurs créés

/*
-- Exemple pour les pros (à adapter avec les vrais IDs)
INSERT INTO profiles (id, first_name, last_name, email, bio, phone, avatar_url, city, user_type) VALUES
  ('uuid-pro-1', 'Thomas', 'Martin', 'thomas.martin@example.com', 'Professionnel PGA avec 15 ans d''expérience. Spécialisé dans l''amélioration du petit jeu.', '+33 6 12 34 56 78', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400', 'Paris', 'pro'),
  ('uuid-pro-2', 'Marie', 'Dubois', 'marie.dubois@example.com', 'Joueuse du tour européen, je partage ma passion et mon expertise technique.', '+33 6 98 76 54 32', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400', 'Versailles', 'pro'),
  ('uuid-pro-3', 'Jean', 'Bernard', 'jean.bernard@example.com', 'Coach mental et technique, j''aide les golfeurs à atteindre leur plein potentiel.', '+33 6 45 67 89 01', 'https://images.unsplash.com/photo-1591491719574-7de5853b879a?w=400', 'Saint-Cloud', 'pro');

INSERT INTO pro_profiles (user_id, hourly_rate, years_experience, certifications, specialties, languages, can_travel, travel_distance, equipment_provided, lesson_duration_options, max_group_size) VALUES
  ('uuid-pro-1', 8000, 15, ARRAY['PGA France', 'TPI Certified'], ARRAY['putting', 'short-game', 'course-strategy'], ARRAY['fr', 'en'], true, 50, true, ARRAY[60, 90, 120], 4),
  ('uuid-pro-2', 12000, 10, ARRAY['LPGA Teaching Professional', 'Trackman Certified'], ARRAY['swing-technique', 'mental-game', 'competition-prep'], ARRAY['fr', 'en', 'es'], false, 0, true, ARRAY[60, 90], 2),
  ('uuid-pro-3', 10000, 20, ARRAY['PGA Master Professional', 'Sport Psychology Certified'], ARRAY['mental-game', 'course-management', 'beginners'], ARRAY['fr', 'en'], true, 30, false, ARRAY[60, 120, 240], 6);

-- Exemple pour les amateurs
INSERT INTO profiles (id, first_name, last_name, email, bio, phone, avatar_url, city, user_type) VALUES
  ('uuid-amateur-1', 'Pierre', 'Durand', 'pierre.durand@example.com', 'Passionné de golf, je cherche à améliorer mon handicap.', '+33 6 11 22 33 44', 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400', 'Paris', 'amateur'),
  ('uuid-amateur-2', 'Sophie', 'Laurent', 'sophie.laurent@example.com', 'Débutante motivée, je souhaite apprendre les bases du golf.', '+33 6 55 44 33 22', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Versailles', 'amateur');

INSERT INTO amateur_profiles (user_id, handicap, home_course, playing_frequency, goals, preferred_lesson_type) VALUES
  ('uuid-amateur-1', 18.5, 'Golf de Saint-Cloud', 'weekly', ARRAY['improve-handicap', 'competition'], 'individual'),
  ('uuid-amateur-2', 54, 'Golf National', 'monthly', ARRAY['learn-basics', 'fun'], 'group');
*/

-- 4. Fonction pour générer des disponibilités de test
CREATE OR REPLACE FUNCTION generate_test_availabilities()
RETURNS void AS $$
DECLARE
  pro_record RECORD;
  course_record RECORD;
  day_offset INTEGER;
  slot_time TIME;
  date_str DATE;
BEGIN
  -- Pour chaque pro
  FOR pro_record IN SELECT id FROM profiles WHERE user_type = 'pro' LOOP
    -- Pour les 7 prochains jours
    FOR day_offset IN 0..6 LOOP
      date_str := CURRENT_DATE + day_offset;
      
      -- Pour chaque parcours (aléatoire)
      FOR course_record IN SELECT id FROM golf_courses ORDER BY RANDOM() LIMIT 2 LOOP
        -- Créneaux du matin et après-midi
        FOREACH slot_time IN ARRAY ARRAY['09:00'::TIME, '14:00'::TIME] LOOP
          -- Insérer la disponibilité
          INSERT INTO pro_availabilities (
            pro_id, 
            golf_course_id, 
            date, 
            start_time, 
            end_time, 
            max_players, 
            current_bookings, 
            is_recurring
          ) VALUES (
            pro_record.id,
            course_record.id,
            date_str,
            slot_time,
            slot_time + INTERVAL '2 hours',
            FLOOR(RANDOM() * 3 + 2)::INTEGER, -- 2-4 joueurs
            0,
            false
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Exécuter cette fonction après avoir créé les utilisateurs et profils
-- SELECT generate_test_availabilities();