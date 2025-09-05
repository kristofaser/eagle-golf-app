-- Migration pour ajouter les champs manquants aux profils amateur et pro

-- 1. Ajouter les champs manquants pour amateur_profiles
ALTER TABLE amateur_profiles
ADD COLUMN IF NOT EXISTS club_affiliation TEXT,
ADD COLUMN IF NOT EXISTS golf_course_id UUID REFERENCES golf_courses(id),
ADD COLUMN IF NOT EXISTS license_number TEXT;

-- 2. Ajouter les champs manquants pour pro_profiles
ALTER TABLE pro_profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS siret TEXT,
ADD COLUMN IF NOT EXISTS company_status TEXT,
ADD COLUMN IF NOT EXISTS division TEXT,
ADD COLUMN IF NOT EXISTS golf_affiliations UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{
  "driving": null,
  "fers": null,
  "wedging": null,
  "chipping": null,
  "putting": null,
  "mental": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '{
  "winner": 0,
  "top5": 0,
  "top10": 0,
  "top20": 0,
  "top30": 0,
  "top40": 0,
  "top50": 0,
  "top60": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS world_ranking INTEGER;

-- 3. Créer une table pour les soumissions de parcours de golf
CREATE TABLE IF NOT EXISTS golf_course_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  hole_count INTEGER DEFAULT 18,
  par INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES profiles(id)
);

-- 4. Créer une table de liaison pour les affiliations golf des pros (many-to-many)
CREATE TABLE IF NOT EXISTS pro_golf_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES pro_profiles(user_id) ON DELETE CASCADE,
  golf_course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pro_id, golf_course_id)
);

-- 5. Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_amateur_profiles_golf_course ON amateur_profiles(golf_course_id);
CREATE INDEX IF NOT EXISTS idx_pro_golf_affiliations_pro ON pro_golf_affiliations(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_golf_affiliations_golf ON pro_golf_affiliations(golf_course_id);
CREATE INDEX IF NOT EXISTS idx_golf_course_submissions_status ON golf_course_submissions(status);
CREATE INDEX IF NOT EXISTS idx_golf_course_submissions_submitted_by ON golf_course_submissions(submitted_by);

-- 6. Ajouter les politiques RLS pour les nouvelles tables
ALTER TABLE golf_course_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_golf_affiliations ENABLE ROW LEVEL SECURITY;

-- Politique pour golf_course_submissions
CREATE POLICY "Users can view all submissions" ON golf_course_submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own submissions" ON golf_course_submissions
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own pending submissions" ON golf_course_submissions
  FOR UPDATE USING (auth.uid() = submitted_by AND status = 'pending');

-- Politique pour pro_golf_affiliations
CREATE POLICY "Anyone can view pro affiliations" ON pro_golf_affiliations
  FOR SELECT USING (true);

CREATE POLICY "Pros can manage their own affiliations" ON pro_golf_affiliations
  FOR ALL USING (auth.uid() = pro_id);

-- 7. Fonction pour convertir un amateur en pro
CREATE OR REPLACE FUNCTION convert_amateur_to_pro(
  p_user_id UUID,
  p_date_of_birth DATE,
  p_siret TEXT,
  p_company_status TEXT,
  p_division TEXT,
  p_hourly_rate INTEGER,
  p_professional_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur est bien amateur
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id AND user_type = 'amateur'
  ) THEN
    RAISE EXCEPTION 'User is not an amateur or does not exist';
  END IF;

  -- Mettre à jour le type dans profiles
  UPDATE profiles
  SET user_type = 'pro',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Créer l'entrée dans pro_profiles
  INSERT INTO pro_profiles (
    user_id,
    date_of_birth,
    siret,
    company_status,
    division,
    hourly_rate,
    professional_status,
    handicap,
    created_at
  )
  SELECT 
    p_user_id,
    p_date_of_birth,
    p_siret,
    p_company_status,
    p_division,
    p_hourly_rate,
    p_professional_status,
    ap.handicap, -- Récupérer le handicap depuis amateur_profiles
    NOW()
  FROM amateur_profiles ap
  WHERE ap.user_id = p_user_id;

  -- Optionnel : supprimer ou garder l'entrée amateur_profiles
  -- Pour l'instant on la garde pour l'historique
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Ajouter une colonne email dans profiles (récupérée depuis auth.users)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Fonction pour synchroniser l'email depuis auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = (SELECT email FROM auth.users WHERE id = NEW.id)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour synchroniser l'email lors de la création/mise à jour du profil
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON profiles;
CREATE TRIGGER sync_profile_email_trigger
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();

-- Synchroniser les emails existants
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;