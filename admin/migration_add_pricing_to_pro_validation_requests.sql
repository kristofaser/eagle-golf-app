-- Migration : Ajouter les colonnes de tarifs à la table pro_validation_requests
-- À exécuter manuellement dans l'interface Supabase SQL Editor

-- Ajouter les colonnes de tarifs à la table pro_validation_requests
ALTER TABLE pro_validation_requests 
ADD COLUMN price_9_holes_1_player integer,
ADD COLUMN price_9_holes_2_players integer,
ADD COLUMN price_9_holes_3_players integer,
ADD COLUMN price_18_holes_1_player integer,
ADD COLUMN price_18_holes_2_players integer,
ADD COLUMN price_18_holes_3_players integer;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN pro_validation_requests.price_9_holes_1_player IS 'Tarif 9 trous pour 1 joueur en centimes';
COMMENT ON COLUMN pro_validation_requests.price_9_holes_2_players IS 'Tarif 9 trous pour 2 joueurs en centimes';
COMMENT ON COLUMN pro_validation_requests.price_9_holes_3_players IS 'Tarif 9 trous pour 3 joueurs en centimes';
COMMENT ON COLUMN pro_validation_requests.price_18_holes_1_player IS 'Tarif 18 trous pour 1 joueur en centimes';
COMMENT ON COLUMN pro_validation_requests.price_18_holes_2_players IS 'Tarif 18 trous pour 2 joueurs en centimes';
COMMENT ON COLUMN pro_validation_requests.price_18_holes_3_players IS 'Tarif 18 trous pour 3 joueurs en centimes';

-- Vérifier que les colonnes ont été ajoutées correctement
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pro_validation_requests' 
AND column_name LIKE 'price_%'
ORDER BY column_name;