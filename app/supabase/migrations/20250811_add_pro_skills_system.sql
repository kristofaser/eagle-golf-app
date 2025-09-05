-- Ajout des compétences pour les professionnels
-- Chaque compétence est notée de 0 à 100%

ALTER TABLE pro_profiles 
ADD COLUMN skill_driving integer DEFAULT 0 CHECK (skill_driving >= 0 AND skill_driving <= 100),
ADD COLUMN skill_irons integer DEFAULT 0 CHECK (skill_irons >= 0 AND skill_irons <= 100),
ADD COLUMN skill_wedging integer DEFAULT 0 CHECK (skill_wedging >= 0 AND skill_wedging <= 100),
ADD COLUMN skill_chipping integer DEFAULT 0 CHECK (skill_chipping >= 0 AND skill_chipping <= 100),
ADD COLUMN skill_putting integer DEFAULT 0 CHECK (skill_putting >= 0 AND skill_putting <= 100),
ADD COLUMN skill_mental integer DEFAULT 0 CHECK (skill_mental >= 0 AND skill_mental <= 100);

-- Commentaires pour la documentation
COMMENT ON COLUMN pro_profiles.skill_driving IS 'Compétence en driving (0-100%)';
COMMENT ON COLUMN pro_profiles.skill_irons IS 'Compétence avec les fers (0-100%)';
COMMENT ON COLUMN pro_profiles.skill_wedging IS 'Compétence en wedging (0-100%)';
COMMENT ON COLUMN pro_profiles.skill_chipping IS 'Compétence en chipping (0-100%)';
COMMENT ON COLUMN pro_profiles.skill_putting IS 'Compétence en putting (0-100%)';
COMMENT ON COLUMN pro_profiles.skill_mental IS 'Compétence mentale (0-100%)';