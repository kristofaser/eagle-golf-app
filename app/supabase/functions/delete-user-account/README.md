# Edge Function : Suppression Complète de Compte

Cette Edge Function permet de supprimer complètement un compte utilisateur, y compris de la table `auth.users`.

## Déploiement

### Prérequis
- Supabase CLI installé
- Accès au projet Supabase

### Étapes de déploiement

1. **Installer Supabase CLI** (si pas déjà fait) :
```bash
npm install -g supabase
```

2. **Se connecter à Supabase** :
```bash
supabase login
```

3. **Lier le projet** :
```bash
supabase link --project-ref kfscpohfipxfsjpqbxse
```

4. **Déployer la fonction** :
```bash
supabase functions deploy delete-user-account
```

5. **Définir les variables d'environnement** (si nécessaire) :
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Utilisation

La fonction est automatiquement appelée par l'application quand un utilisateur supprime son compte. Elle :

1. Vérifie l'authentification de l'utilisateur
2. Valide le mot de passe
3. Supprime les profils (amateur/pro et principal)
4. Supprime complètement le compte de `auth.users`

## Comportement

- **Avec Edge Function** : Le compte est complètement supprimé, l'utilisateur peut se réinscrire avec la même adresse email
- **Sans Edge Function** : Seuls les profils sont supprimés, le compte reste dans `auth.users` mais l'utilisateur peut quand même se réinscrire grâce à `signInWithOtp`

## Sécurité

- Authentification requise
- Vérification du mot de passe
- Utilise la clé service role pour les opérations admin

## Notes

- La fonction nécessite un plan Supabase payant pour être déployée
- Sans cette fonction, l'application fonctionne quand même grâce au fallback local