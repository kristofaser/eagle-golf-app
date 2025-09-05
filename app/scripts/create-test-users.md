# Guide pour créer des utilisateurs de test

## 1. Parcours de golf

Les parcours de golf ont déjà été créés :

- Golf de Saint-Cloud (ID: 9258f316-eee7-4ca9-a069-406c2739e771)
- Golf National (ID: 08daa4af-63d4-4db0-8adc-d0d8e8281a13)
- Golf de Fontainebleau (ID: 6bf67237-0830-4924-9edb-4ed6b2cde372)

## 2. Créer des utilisateurs de test

### Option A : Via le Dashboard Supabase

1. Aller dans Authentication > Users
2. Cliquer sur "Invite user"
3. Créer les utilisateurs suivants :

**Professionnels :**

- Email : thomas.martin@example.com
- Mot de passe : azerty
- Metadata : {"first_name": "Thomas", "last_name": "Martin"}

- Email : marie.dubois@example.com
- Mot de passe : azerty
- Metadata : {"first_name": "Marie", "last_name": "Dubois"}

- Email : jean.bernard@example.com
- Mot de passe : azerty
- Metadata : {"first_name": "Jean", "last_name": "Bernard"}

**Amateurs :**

- Email : pierre.durand@example.com
- Mot de passe : azerty
- Metadata : {"first_name": "Pierre", "last_name": "Durand"}

- Email : sophie.laurent@example.com
- Mot de passe : azerty
- Metadata : {"first_name": "Sophie", "last_name": "Laurent"}

### Option B : Via l'application

Une fois les hooks d'authentification intégrés, vous pouvez créer des utilisateurs directement depuis l'application en utilisant la fonction register.

## 3. Ajouter les profils détaillés

Après avoir créé les utilisateurs, exécutez ce SQL dans le SQL Editor en remplaçant les UUIDs par les vrais IDs des utilisateurs créés :

```sql
-- Remplacer ces UUIDs par les vrais IDs des utilisateurs créés
-- Vous pouvez les trouver dans Authentication > Users

-- Profils pros
INSERT INTO profiles (id, first_name, last_name, bio, phone, avatar_url, city, user_type) VALUES
  ('UUID_THOMAS', 'Thomas', 'Martin', 'Professionnel PGA avec 15 ans d''expérience. Spécialisé dans l''amélioration du petit jeu.', '+33 6 12 34 56 78', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400', 'Paris', 'pro'),
  ('UUID_MARIE', 'Marie', 'Dubois', 'Joueuse du tour européen, je partage ma passion et mon expertise technique.', '+33 6 98 76 54 32', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400', 'Versailles', 'pro'),
  ('UUID_JEAN', 'Jean', 'Bernard', 'Coach mental et technique, j''aide les golfeurs à atteindre leur plein potentiel.', '+33 6 45 67 89 01', 'https://images.unsplash.com/photo-1591491719574-7de5853b879a?w=400', 'Saint-Cloud', 'pro');

-- Détails pros
INSERT INTO pro_profiles (user_id, professional_status, hourly_rate, specialties, play_style, years_experience, certifications, languages, can_travel, travel_radius_km) VALUES
  ('UUID_THOMAS', 'PGA Professional', 8000, ARRAY['putting', 'short-game', 'course-strategy'], ARRAY['technique', 'practice'], 15, ARRAY['PGA France', 'TPI Certified'], ARRAY['fr', 'en'], true, 50),
  ('UUID_MARIE', 'LPGA Tour Player', 12000, ARRAY['swing-technique', 'mental-game', 'competition-prep'], ARRAY['performance', 'mental'], 10, ARRAY['LPGA Teaching Professional', 'Trackman Certified'], ARRAY['fr', 'en', 'es'], false, 0),
  ('UUID_JEAN', 'PGA Master Professional', 10000, ARRAY['mental-game', 'course-management', 'beginners'], ARRAY['pedagogie', 'fun'], 20, ARRAY['PGA Master Professional', 'Sport Psychology Certified'], ARRAY['fr', 'en'], true, 30);

-- Profils amateurs
INSERT INTO profiles (id, first_name, last_name, bio, phone, avatar_url, city, user_type) VALUES
  ('UUID_PIERRE', 'Pierre', 'Durand', 'Passionné de golf, je cherche à améliorer mon handicap.', '+33 6 11 22 33 44', 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400', 'Paris', 'amateur'),
  ('UUID_SOPHIE', 'Sophie', 'Laurent', 'Débutante motivée, je souhaite apprendre les bases du golf.', '+33 6 55 44 33 22', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Versailles', 'amateur');

-- Détails amateurs
INSERT INTO amateur_profiles (user_id, handicap, experience_level, preferred_play_style, budget_range) VALUES
  ('UUID_PIERRE', 18, 'intermediate', ARRAY['improve-handicap', 'competition'], 'medium'),
  ('UUID_SOPHIE', 54, 'beginner', ARRAY['learn-basics', 'fun'], 'medium');
```

## 4. Créer des disponibilités pour les pros

```sql
-- Créer des disponibilités pour les 7 prochains jours
-- Remplacer UUID_PRO par l'ID réel du pro

DO $$
DECLARE
  pro_id uuid;
  course_id uuid;
  i integer;
  slot_date date;
BEGIN
  -- Pour chaque pro
  FOR pro_id IN SELECT id FROM profiles WHERE user_type = 'pro' LOOP
    -- Pour les 7 prochains jours
    FOR i IN 0..6 LOOP
      slot_date := CURRENT_DATE + i;

      -- Créer 2-3 créneaux par jour sur différents parcours
      -- Matin au Golf de Saint-Cloud
      INSERT INTO pro_availabilities (pro_id, golf_course_id, date, start_time, end_time, max_players)
      VALUES (pro_id, '9258f316-eee7-4ca9-a069-406c2739e771', slot_date, '09:00', '11:00', 3);

      -- Après-midi au Golf National
      INSERT INTO pro_availabilities (pro_id, golf_course_id, date, start_time, end_time, max_players)
      VALUES (pro_id, '08daa4af-63d4-4db0-8adc-d0d8e8281a13', slot_date, '14:00', '16:00', 4);
    END LOOP;
  END LOOP;
END $$;
```

## 5. Tester l'application

Une fois les données créées :

1. Connectez-vous avec l'un des comptes de test
2. Testez la recherche par parcours
3. Testez la recherche par professionnel
4. Créez une réservation de test

## Identifiants de test

| Type    | Email                      | Mot de passe |
| ------- | -------------------------- | ------------ |
| Pro     | thomas.martin@example.com  | azerty       |
| Pro     | marie.dubois@example.com   | azerty       |
| Pro     | jean.bernard@example.com   | azerty       |
| Amateur | pierre.durand@example.com  | azerty       |
| Amateur | sophie.laurent@example.com | azerty       |
