-- Migration SQL pour la création de la table golfs_france dans Supabase
-- Base de données enrichie des golfs français avec contacts

-- Création de la table principale
CREATE TABLE IF NOT EXISTS public.golfs_france (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(5),
    departement VARCHAR(3),
    departement_nom VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(100),
    site_web VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    nombre_trous INTEGER,
    type_parcours VARCHAR(50),
    status_donnees VARCHAR(20) DEFAULT 'partiel',
    notes TEXT,
    date_maj TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches géographiques
CREATE INDEX IF NOT EXISTS idx_golfs_location ON public.golfs_france USING GIST (
    ST_MakePoint(longitude, latitude)
);

-- Index pour les recherches par département
CREATE INDEX IF NOT EXISTS idx_golfs_departement ON public.golfs_france (departement);

-- Index pour les recherches par nom
CREATE INDEX IF NOT EXISTS idx_golfs_nom ON public.golfs_france (nom);

-- Index pour les recherches par nombre de trous
CREATE INDEX IF NOT EXISTS idx_golfs_trous ON public.golfs_france (nombre_trous);

-- Trigger pour mise à jour automatique de date_maj
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_maj = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER golfs_france_date_maj 
    BEFORE UPDATE ON public.golfs_france 
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();

-- Insertion des données enrichies - YVELINES (78)
INSERT INTO public.golfs_france (
    nom, adresse, ville, code_postal, departement, departement_nom,
    telephone, email, site_web, latitude, longitude, nombre_trous,
    type_parcours, status_donnees, notes
) VALUES
('Le Golf National', '2 Avenue du Golf', 'Guyancourt', '78280', '78', 'Yvelines', 
 '+33 1 30 43 36 00', 'accueil@golf-national.com', 'www.legolfnational.com',
 48.7667, 2.0833, 36, '36 trous', 'verifie', 'Parcours Albatros (Ryder Cup 2018), Aigle, Oiselet'),

('Golf de Saint-Nom-la-Bretèche', '2 Rue Henri Freyssineau', 'Saint-Nom-la-Bretèche', '78860', '78', 'Yvelines',
 '01 30 80 04 40', 'direction@golfsaintnom.com', 'www.golfdesaintnomlabreteche.com',
 48.8833, 2.1333, 36, '36 trous', 'verifie', 'Parcours Rouge et Bleu, club privé'),

('Golf des Yvelines (Fourqueux)', '36, rue de Saint Nom', 'Fourqueux', '78112', '78', 'Yvelines',
 '01 34 51 41 47', 'accueil@golfdefourqueux.com', 'www.golfdefourqueux.com',
 48.8833, 2.0667, 27, '27 trous', 'verifie', 'Golf & Country Club'),

('Golf Isabella', 'Sainte Appoline', 'Plaisir', '78370', '78', 'Yvelines',
 '01 30 54 10 62', 'info@golfisabella.com', 'www.golfisabella.fr',
 48.8167, 2.1000, 18, '18 trous', 'verifie', 'Club familial depuis 1969'),

('Golf de Maisons-Laffitte', '1 avenue de la Pelouse', 'Maisons-Laffitte', '78600', '78', 'Yvelines',
 '01 39 62 37 92', NULL, NULL,
 48.9500, 2.1500, 27, '18 + 9 trous', 'partiel', 'Sur hippodrome'),

-- ALPES-MARITIMES (06)
('Monte-Carlo Golf Club', 'Route du Mont Agel', 'La Turbie', '06320', '06', 'Alpes-Maritimes',
 '+33 4 92 41 50 70', NULL, 'golfdemontecarlo.com',
 43.7667, 7.4167, 18, '18 trous', 'partiel', '900m altitude, vue mer et montagnes'),

('Golf Country Club de Cannes-Mougins', '175 Avenue du Golf', 'Mougins', '06250', '06', 'Alpes-Maritimes',
 '+33 4 93 75 79 13', 'contact@golfcannesmougins.com', 'www.golfcannesmougins.com',
 43.6000, 7.0000, 18, '18 trous', 'verifie', 'Club prestigieux fondé en 1923'),

('Golf d''Opio Valbonne', 'Route de Roquefort-les-Pins', 'Opio', '06650', '06', 'Alpes-Maritimes',
 '+33 4 93 12 27 01', 'contact@asgolf-ov.fr', 'www.opiovalbonnegolfresort.com',
 43.6333, 7.0500, 18, '18 trous', 'verifie', 'Resort 220 hectares'),

-- GIRONDE (33)
('Golf de Bordeaux Lac', 'Avenue de Pernon', 'Bordeaux', '33300', '33', 'Gironde',
 '05 56 50 92 72', 'bordeaux.lac@bluegreen.com', 'bluegreen.fr/bordeaux-lac/',
 44.8833, -0.5833, 45, '2×18 + 9 trous', 'verifie', 'Blue Green, 120 hectares'),

('Golf d''Arcachon', '35 Bd d''Arcachon', 'La Teste-de-Buch', '33260', '33', 'Gironde',
 '05 56 54 44 00', 'accueil@golfarcachon.org', 'www.golfarcachon.org',
 44.6333, -1.1500, 18, '18 trous', 'verifie', 'Bassin d''Arcachon, par 72'),

('Golf du Médoc (Cabot Bordeaux)', '1366 Chemin de Courmateau', 'Le Pian-Médoc', '33290', '33', 'Gironde',
 '+33 5 56 70 31 31', NULL, 'www.cabotbordeaux.com',
 44.9500, -0.7000, 36, '2×18 trous', 'partiel', 'Resort 5 étoiles, ancien Golf du Médoc'),

-- HAUTE-SAVOIE (74)
('Evian Resort Golf Club', '1016 Rue du Chablais', 'Publier', '74500', '74', 'Haute-Savoie',
 '+33 4 50 81 53 80', 'academy@evianresort.com', 'golf-club.evianresort.com',
 46.3918, 6.5530, 24, '18 + 6 trous', 'verifie', 'Evian Championship, Alpes près Lac Léman'),

('Golf & Country Club de Bossey', 'Château de Crevin', 'Bossey', '74160', '74', 'Haute-Savoie',
 '+33 4 50 43 95 50', 'gccb@golfbossey.com', 'www.golfbossey.com',
 46.3167, 6.1500, 18, '18 trous', 'verifie', 'Aux portes de Genève, pied du Salève'),

('Golf Club Esery', '28, allée du Château', 'Reignier-Esery', '74930', '74', 'Haute-Savoie',
 '+33 4 50 36 58 70', 'info@golf-club-esery.com', 'www.golf-club-esery.com',
 46.1333, 6.2667, 27, '27 trous', 'verifie', 'Grand Genève, 30 min de Genève'),

('Golf Club du Lac d''Annecy', 'Route du Golf', 'Talloires', '74290', '74', 'Haute-Savoie',
 '+33 4 50 60 12 89', 'accueil@golf-lacannecy.com', 'www.golf-lacannecy.com',
 45.8333, 6.2167, 18, '18 trous', 'verifie', 'Réserve naturelle Roc de Chère, fondé 1953'),

('Golf du Mont d''Arbois', '3001 route Edmond de Rothschild', 'Megève', '74120', '74', 'Haute-Savoie',
 '04 50 21 29 79', NULL, NULL,
 45.8667, 6.6167, 18, '18 trous', 'partiel', 'Altitude 1320m, plus ancien golf de montagne'),

('Golf Club Chamonix', '35 Route du Golf', 'Chamonix-Mont-Blanc', '74400', '74', 'Haute-Savoie',
 '+33 4 50 53 06 28', 'info@golfdechamonix.com', 'www.golfdechamonix.com',
 45.9167, 6.8833, 18, '18 trous', 'verifie', '1000m altitude, Mont Blanc et Aiguilles Rouges'),

-- SEINE-ET-MARNE (77)
('Golf de Fontainebleau', 'Route d''Orléans', 'Fontainebleau', '77300', '77', 'Seine-et-Marne',
 '+33 1 64 22 22 95', NULL, 'golfdefontainebleau.org',
 48.4167, 2.7000, 18, '18 trous', 'partiel', 'Un des plus anciens golfs de France'),

('Golf de Meaux-Boutigny', 'Le Barrois', 'Boutigny', '77470', '77', 'Seine-et-Marne',
 '01 60 25 63 98', 'contact@golfmb.fr', 'www.golf-meaux-boutigny.com',
 48.9667, 2.8833, 27, '18 + 9 trous', 'verifie', '10 min du centre de Meaux'),

('Golf de Bussy-Guermantes', 'Promenade des Golfeurs', 'Bussy-Saint-Georges', '77600', '77', 'Seine-et-Marne',
 '01 64 66 00 00', 'accueil@bussygolf.com', 'www.golfbussyguermantes.com',
 48.8333, 2.6000, 27, '18 + 9 trous', 'verifie', 'Marne-la-Vallée, RER A Bussy-St-Georges'),

('Exclusiv Golf Château de Cély', 'Route de Saint-Germain', 'Cély-en-Bière', '77930', '77', 'Seine-et-Marne',
 '+33 1 64 38 03 07', 'contact@exclusivgolf-cely.fr', 'www.ngf-golf.com/exclusivgolf-cely/',
 48.4500, 2.5333, 18, '18 trous', 'verifie', 'Château 14ème siècle, 45km sud Paris'),

-- ILLE-ET-VILAINE (35)
('Golf de Dinard', '53 boulevard de la Houle', 'Saint-Briac-sur-Mer', '35800', '35', 'Ille-et-Vilaine',
 '+33 2 99 88 32 07', 'dinardgolf@dinardgolf.com', 'www.dinardgolf.com',
 48.6333, -2.1333, 18, '18 trous', 'verifie', '2ème plus ancien golf de France (1887)'),

('Golf Bluegreen Rennes', 'Le Temple du Cerisier', 'St Jacques de la Lande', '35136', '35', 'Ille-et-Vilaine',
 '02 99 30 18 18', 'rennes@bluegreen.fr', 'bluegreen.fr/rennes/',
 48.0833, -1.7000, 36, '18 + 9 + 9 trous', 'verifie', 'Plus grand complexe golf de Bretagne'),

('Golf de Saint-Malo', 'Domaine de Saint-Yvieux', 'Le Tronchet', '35540', '35', 'Ille-et-Vilaine',
 '02 99 40 71 11', NULL, 'www.saintmalogolf.com',
 48.5000, -1.8833, 27, '27 trous', 'partiel', 'Parcours Surcouf, vue lac Mirloup'),

('Domaine de Cicé-Blossac', 'Avenue de la Chaise', 'Bruz', '35170', '35', 'Ille-et-Vilaine',
 '02 99 52 76 76', NULL, 'www.domainedecice.com',
 48.0333, -1.6500, 18, '18 trous', 'partiel', 'Resort 4 étoiles, 15 min centre Rennes'),

-- NORD (59)
('Golf de Bondues', 'Château de la Vigne', 'Bondues', '59910', '59', 'Nord',
 '03 20 23 13 87', 'contact@golfdebondues.com', 'www.golfdebondues.com',
 50.7088, 3.0774, 36, '2×18 trous', 'verifie', 'Hawtree + Trent Jones, 120 hectares'),

('Golf Blue Green Dunkerque', 'Route du golf', 'Coudekerque Village', '59380', '59', 'Nord',
 '+33 3 28 61 07 43', 'dunkerque@bluegreen.com', 'bluegreen.fr/dunkerque/',
 51.0333, 2.3333, 27, '27 trous', 'verifie', '350 hectares croissant vert'),

('Golf Lille Métropole', 'Rond Point des Acacias', 'Ronchin', '59790', '59', 'Nord',
 '03 20 47 42 42', 'accueil.glm@gmail.com', 'golf-lille-metropole.fr',
 50.6000, 3.1167, 27, '18 + 9 trous', 'verifie', '3 communes : Ronchin, Lezennes, Lesquin'),

('Golf de Brigode', '36, Avenue du Golf', 'Villeneuve d''Ascq', '59650', '59', 'Nord',
 '03 20 91 17 86', 'contact@golfbrigode.com', 'www.golfbrigode.com',
 50.6167, 3.1500, 18, '18 trous', 'verifie', 'Créé 1971, Métropole lilloise');

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE public.golfs_france ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique
CREATE POLICY "Public read access" ON public.golfs_france
    FOR SELECT USING (true);

-- Politique pour modification authentifiée uniquement
CREATE POLICY "Authenticated users can modify" ON public.golfs_france
    FOR ALL USING (auth.role() = 'authenticated');

-- Vue pour recherche géographique facilitée
CREATE OR REPLACE VIEW public.golfs_avec_distance AS
SELECT *,
    ST_MakePoint(longitude, latitude) as point_geo
FROM public.golfs_france
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Fonction de recherche par proximité
CREATE OR REPLACE FUNCTION public.golfs_proches(
    lat DECIMAL,
    lng DECIMAL,
    rayon_km INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    nom VARCHAR,
    ville VARCHAR,
    departement VARCHAR,
    telephone VARCHAR,
    email VARCHAR,
    nombre_trous INTEGER,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.nom,
        g.ville,
        g.departement,
        g.telephone,
        g.email,
        g.nombre_trous,
        ROUND(
            ST_Distance(
                ST_MakePoint(lng, lat)::geography,
                ST_MakePoint(g.longitude, g.latitude)::geography
            ) / 1000, 2
        ) as distance_km
    FROM public.golfs_france g
    WHERE g.latitude IS NOT NULL 
      AND g.longitude IS NOT NULL
      AND ST_DWithin(
          ST_MakePoint(lng, lat)::geography,
          ST_MakePoint(g.longitude, g.latitude)::geography,
          rayon_km * 1000
      )
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table
COMMENT ON TABLE public.golfs_france IS 'Base de données enrichie des golfs français avec coordonnées complètes';
COMMENT ON COLUMN public.golfs_france.status_donnees IS 'verifie, partiel, manquant - indique le niveau de vérification des données';
COMMENT ON COLUMN public.golfs_france.type_parcours IS 'Description du nombre et type de trous (ex: 18 trous, 2×18 trous, compact)';
COMMENT ON COLUMN public.golfs_france.notes IS 'Informations complémentaires sur le golf';