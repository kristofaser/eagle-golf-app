# TODO : Finalisation de l'Authentification Supabase

## 📌 Contexte

Eagle Golf utilise un **modèle freemium** où :

- **Accès public** : Consultation libre des profils et parcours
- **Connexion requise** : Pour réserver une partie avec un pro

## ✅ Ce qui est fait

1. **Backend Supabase**
   - Tables et RLS configurées
   - Utilisateurs test créés (mot de passe : azerty)
   - Services métier créés

2. **Frontend - Hooks et Context**
   - AuthContext et AuthProvider
   - Tous les hooks d'authentification
   - Pages d'authentification complètes (login, register, forgot-password)

3. **Intégration UI**
   - Données réelles intégrées (pros, parcours, disponibilités)
   - SearchOverlay connecté avec recherche duale
   - Flux freemium implémenté avec boutons conditionnels
   - Protection des routes avec redirection vers login

## 🔧 Ce qui reste à faire

### 1. Pages d'authentification

#### Pages existantes à améliorer

- [ ] **Register** : Ajouter la création automatique du profil pro/amateur
- [ ] **Forgot Password** : Améliorer le feedback visuel après envoi
- [ ] **Callback OAuth** : Créer la page pour gérer les retours OAuth/Magic Link

### 2. Flux de navigation (✅ Implémenté)

- ✅ Protection conditionnelle des routes implémentée
- ✅ Gestion du paramètre `returnTo` fonctionnelle
- ✅ Boutons conditionnels dans ContentCard et ProfileScreen
- ✅ Redirection vers login pour les actions protégées

### 3. Intégration des données (✅ Complété)

- ✅ Services Supabase utilisés partout
- ✅ Écran d'accueil connecté aux vraies données
- ✅ Pages de détail (pro et parcours) fonctionnelles
- ✅ SearchOverlay avec recherche temps réel
- ✅ Disponibilités affichées en temps réel

### 4. Flux de réservation (🚧 Priorité actuelle)

#### Créer le processus de booking

- [ ] **`/app/booking/[proId].tsx`** - Page de sélection de créneau
  - [ ] Interface calendrier avec disponibilités
  - [ ] Sélection du parcours et nombre de joueurs
  - [ ] Calcul du prix en temps réel
- [ ] **Système de validation pro**
  - [ ] Envoi de la demande au pro
  - [ ] Interface de gestion pour les pros
  - [ ] Notifications et timer 24h
- [ ] **Intégration Stripe**
  - [ ] Payment Intent après validation
  - [ ] Webhooks de confirmation

### 5. Tests et validation

- [ ] Tester le parcours visiteur → inscription → réservation
- [ ] Vérifier la persistance de session
- [ ] Tester la déconnexion/reconnexion
- [ ] Valider le returnTo après connexion

## 📝 Exemple de code pour le bouton de réservation conditionnel

```tsx
// Dans ContentCard ou ProfileScreen
const { isAuthenticated } = useAuth();
const router = useRouter();

const handleBookingPress = () => {
  if (!isAuthenticated) {
    // Sauvegarder l'intention de réservation
    router.push({
      pathname: '/login',
      params: {
        returnTo: `/booking/${proId}`,
        message: 'Connectez-vous pour réserver avec ce pro',
      },
    });
  } else {
    // Procéder directement à la réservation
    router.push(`/booking/${proId}`);
  }
};

<TouchableOpacity onPress={handleBookingPress}>
  <Text>{isAuthenticated ? 'Réserver' : 'Se connecter pour réserver'}</Text>
</TouchableOpacity>;
```

## 🎯 Priorités actuelles

1. **Créer la page de réservation** `/app/booking/[proId]`
2. **Implémenter le système de validation** par les pros
3. **Intégrer Stripe** pour les paiements
4. **Améliorer les pages auth** existantes (callback OAuth, profil auto-créé)

## 🔑 Comptes de test

| Type    | Email                      | Mot de passe |
| ------- | -------------------------- | ------------ |
| Pro     | thomas.martin@example.com  | azerty       |
| Pro     | marie.dubois@example.com   | azerty       |
| Pro     | jean.bernard@example.com   | azerty       |
| Amateur | pierre.durand@example.com  | azerty       |
| Amateur | sophie.laurent@example.com | azerty       |
