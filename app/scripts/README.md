# Scripts Eagle Golf

Ce dossier contient les scripts utilitaires pour le projet Eagle Golf.

## Scripts disponibles

### migrate-mock-data.ts

Script de migration des données mock vers Supabase.

**Prérequis :**

- Avoir configuré les variables d'environnement dans `.env.local`
- Ajouter la variable `SUPABASE_SERVICE_ROLE_KEY` (récupérable depuis le dashboard Supabase)

**Utilisation :**

```bash
# Installer les dépendances si nécessaire
npm install dotenv

# Exécuter la migration
npx tsx scripts/migrate-mock-data.ts
```

**Ce que fait le script :**

1. Crée 3 parcours de golf (Saint-Cloud, Golf National, Fontainebleau)
2. Crée 3 professionnels avec leurs profils complets
3. Crée 2 amateurs avec leurs profils
4. Génère des disponibilités pour les pros sur les 7 prochains jours

**Identifiants de test créés :**

- Pros : thomas.martin@example.com, marie.dubois@example.com, jean.bernard@example.com
- Amateurs : pierre.durand@example.com, sophie.laurent@example.com
- Mot de passe : password123

## Notes importantes

- La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit JAMAIS être exposée côté client
- Ces scripts sont uniquement pour le développement et les tests
- En production, utiliser les migrations Supabase officielles
