# Variables d'environnement à configurer sur Vercel

## Via le Dashboard Vercel (Recommandé)

1. Allez sur https://vercel.com/kristofasers-projects/app/settings/environment-variables
2. Ajoutez les variables suivantes pour "Production", "Preview" et "Development" :

### Variables requises :

```
EXPO_PUBLIC_SUPABASE_URL=https://vrpsulmidpgxmkybgtwn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S14QO9rmqqgNzm9aXX2ejjGaq8dd3OyrRRrXKF3ETtozbWD304ArjAAa9hffAexLPa16VfGbwkHzM0gIkjTmP4v00z2T3aRrk
EXPO_PUBLIC_INSEE_API_TOKEN=af27f2f4-90ad-4789-a7f2-f490ad6789b4
```

3. Après avoir ajouté les variables, redéployez pour qu'elles prennent effet :
   ```bash
   npx vercel --prod
   ```

## URLs de ton application :

- **Production** : https://app-nu-beige.vercel.app
- **Dashboard Vercel** : https://vercel.com/kristofasers-projects/app

## Pour remplacer le projet Next.js :

1. **Supprimer l'ancien projet** :
   - Va sur https://vercel.com/kristofasers-projects/web/settings/general
   - Scroll jusqu'à "Delete Project"
   - Supprime le projet

2. **Optionnel : Renommer le nouveau projet** :
   - Va sur https://vercel.com/kristofasers-projects/app/settings/general
   - Change le nom de "app" à "web" si désiré

## Notes importantes :

- Le build Expo génère une SPA (Single Page Application) statique
- Les variables d'environnement EXPO_PUBLIC_* sont embarquées dans le build
- Après chaque modification de variables d'environnement, un redéploiement est nécessaire