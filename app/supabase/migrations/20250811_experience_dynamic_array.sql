-- Migration: Convertir l'expérience du format objet compteurs vers tableau dynamique
-- Date: 2025-08-11
-- Description: Remplace le format {winner: 2, top5: 5} par un tableau [{type: "winner", description: "..."}]

-- Nouvelle structure pour l'expérience professionnelle :
-- Ancien format : {"winner": 2, "top5": 5, "top10": 8, ...}
-- Nouveau format : [{"type": "winner", "description": "Victoire Open de France 2023"}, ...]

-- Étape 1: Mettre à jour tous les profils avec le nouveau format
-- Pour le moment, on initialise avec un tableau vide car l'ancien format n'avait que des compteurs
UPDATE pro_profiles 
SET experience = '[]'::jsonb
WHERE experience IS NOT NULL;

-- Étape 2: Ajouter un commentaire pour documenter le nouveau format
COMMENT ON COLUMN pro_profiles.experience IS 'Tableau d''expériences: [{"type": "winner|top5|top10|top20|top30|top40|top50|top60", "description": "Description du résultat"}]';

-- Structure du nouveau format :
-- [
--   {
--     "type": "winner",         // Type de résultat (winner, top5, top10, etc.)
--     "description": "..."      // Description libre du résultat
--   }
-- ]
--
-- Types possibles :
-- - winner : 🏆 Victoire
-- - top5   : 🥇 Top 5  
-- - top10  : 🥈 Top 10
-- - top20  : 🥉 Top 20
-- - top30  : 📊 Top 30
-- - top40  : 📈 Top 40
-- - top50  : 📋 Top 50
-- - top60  : 📝 Top 60