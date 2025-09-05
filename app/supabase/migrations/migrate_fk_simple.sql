-- Migration simple: Rediriger pro_availabilities vers golf_parcours
ALTER TABLE pro_availabilities DROP CONSTRAINT IF EXISTS pro_availabilities_golf_course_id_fkey;
ALTER TABLE pro_availabilities ADD CONSTRAINT pro_availabilities_golf_course_id_fkey FOREIGN KEY (golf_course_id) REFERENCES golf_parcours(id);
CREATE INDEX IF NOT EXISTS idx_pro_availabilities_golf_course_id ON pro_availabilities(golf_course_id);