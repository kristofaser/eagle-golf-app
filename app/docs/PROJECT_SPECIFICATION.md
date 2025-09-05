# 🦅 Eagle - Spécification du Projet

## 📋 Table des Matières
1. [Vue d'Ensemble](#vue-densemble)
2. [Concept & Vision](#concept--vision)
3. [Types d'Utilisateurs](#types-dutilisateurs)
4. [Fonctionnalités Principales](#fonctionnalités-principales)
5. [Architecture Navigation](#architecture-navigation)
6. [Écrans & Interfaces](#écrans--interfaces)
7. [Flux Utilisateurs](#flux-utilisateurs)
8. [Architecture Technique](#architecture-technique)
9. [Modèle de Données](#modèle-de-données)
10. [Points à Clarifier](#points-à-clarifier)

---

## 📌 Vue d'Ensemble

**Nom du Projet**: Eagle  
**Type**: Application mobile (React Native / Expo)  
**Plateforme**: iOS et Android  
**Backend**: Supabase  
**Langue**: Français  

---

## 🎯 Concept & Vision

### Concept Principal ✅
Eagle permet aux golfeurs amateurs de **jouer une partie de golf AVEC un golfeur professionnel**. 

**Ce n'est PAS** :
- Du coaching
- Des cours
- De l'accompagnement technique

**C'est** :
- Une expérience unique de jouer aux côtés d'un pro
- Le plaisir de partager une partie avec un joueur de haut niveau
- Une alternative accessible aux événements PRO-AM traditionnels

### Proposition de Valeur Unique
- **Pour les amateurs** : Vivre l'expérience exceptionnelle de jouer avec un pro, habituellement réservée aux événements PRO-AM exclusifs
- **Pour les pros** : Monétiser leur temps en jouant, partager leur passion, rencontrer des passionnés

### Innovation
Ce type de service n'existe pas actuellement sur le marché, sauf lors d'événements PRO-AM organisés qui sont rares et souvent inaccessibles.

---

## 👥 Types d'Utilisateurs

### Rôles dans l'Application

### 1. Golfeur Amateur
- **Inscription**: Tout nouveau utilisateur commence comme amateur
- **Profil**: 
  - Informations personnelles (nom, email, photo)
  - Handicap
  - Numéro de licence
  - Club d'affiliation
  - Parcours de golf préféré
- **Actions possibles**:
  - Consulter la liste des pros disponibles
  - Réserver une partie avec un pro
  - Gérer son profil
  - Se convertir en pro (sous conditions)

### 2. Golfeur Professionnel
- **Accès**: Conversion depuis un compte amateur (validation + adhésion)
- **Adhésion**: 69€ HT/an (renouvelable annuellement)
- **Profil enrichi**:
  - Toutes les infos amateur +
  - Date de naissance
  - SIRET / Statut entreprise
  - Division (niveau professionnel)
  - **Tarification flexible** :
    - Prix pour 9 trous (1, 2 ou 3 amateurs)
    - Prix pour 18 trous (1, 2 ou 3 amateurs)
  - **Rayon de déplacement** : jusqu'à X km
  - Expérience (années, palmarès)
  - Compétences (pour information, pas pour coaching)
  - Classement mondial
  - **Disponibilités** :
    - Par jour de la semaine (Lundi → Dimanche)
    - Par demi-journée (matin et/ou après-midi)
    - Toggle global disponible/indisponible (vacances, tournoi)
- **Actions possibles**:
  - Apparaître dans la liste des pros dans leur zone
  - Recevoir des réservations de parties
  - Gérer ses disponibilités de jeu
  - Gérer son profil pro
  - Renouveler son adhésion annuelle

### 3. Admin Eagle (Back-office Web NextJS)
- **Rôle** : Validation et gestion complète de la plateforme
- **Actions Réservations** :
  - Vérifier la disponibilité auprès des parcours
  - Confirmer ou proposer des créneaux alternatifs
  - Valider les réservations finales
  - Gérer les cas particuliers
  - Suivi des transactions
- **Actions Pros** :
  - Recevoir notifications d'inscription pro
  - Vérifier carte d'identité vs informations saisies
  - Valider ou rejeter les candidatures pro
  - Envoyer lien de paiement adhésion après validation
- **Configuration** :
  - Définir le % de commission Eagle
  - Gérer les tarifs d'adhésion pro
- **Communication** :
  - Recevoir les messages des utilisateurs (voyages, support)
  - Gérer les notifications

### Questions à Clarifier
- [x] Interface admin : **Application web NextJS (backoffice complet)**
- [x] Validation/vérification des pros : **API INSEE + vérification manuelle + paiement adhésion**
- [x] Montant adhésion pro : **69€ HT (configurable dans admin)**
- [x] Renouvellement : **Annuel**
- [x] Processus conversion amateur → pro : **Flux complet défini avec validation multi-étapes**

---

## 🚀 Fonctionnalités Principales

### 1. Recherche et Découverte
- **Géolocalisation** : Les amateurs voient les pros disponibles autour d'eux
- **Rayon de déplacement** : Chaque pro indique jusqu'à combien de km il peut se déplacer
- Filtres de recherche (distance, disponibilité, tarif, niveau)
- Parcours de golf (où les parties peuvent avoir lieu)

### 2. Réservation de Partie
- Consultation des disponibilités des pros pour jouer
- Réservation d'une partie de golf avec le pro
- **Formats disponibles** : 9 trous ou 18 trous
- **Groupe** : 1 à 3 amateurs maximum + le pro
- **Tarification** : 
  - Pro fixe ses prix de base (9/18 trous, 1/2-3 personnes)
  - Eagle ajoute sa commission (% configurable)
  - Client voit le prix final (prix pro + commission)
  - Green fee NON inclus (à payer sur place)
- **Politique d'annulation** :
  - Annulation gratuite jusqu'à 24h avant
  - Remboursement 50% si annulation < 24h
  - Cas de force majeure étudiés au cas par cas
- Choix du parcours dans le rayon du pro
- Gestion des créneaux de jeu
- **Après la partie** : Amateur note le pro

### 3. Profils
- Consultation des profils pros (interface premium) - pour donner envie de jouer avec eux
- Édition de son propre profil
- Upload de photos

### 4. Premium (Abonnement)
- **Contenu Premium** :
  - Vidéos exclusives (à définir)
  - Résultats de tournois
  - Reportages sur événements golf
- **Essai gratuit** : 15 jours à l'inscription
- **Après essai** : Abonnement payant requis
- **Cible** : Tous les utilisateurs (amateurs et pros)

### 5. Voyages
- **Statut actuel** : "Bientôt disponible"
- **Fonctionnalités** :
  - Toggle/checkbox pour être notifié du lancement
  - Bouton "Contactez-nous" → BottomSheet pour envoyer message à l'admin
- **Vision future** : Voyages golf organisés (à développer)

### Questions à Clarifier
- [x] Le parcours est-il payé séparément ou inclus ? → **Green fee à payer sur place, non inclus**
- [x] Format de partie ? → **9 ou 18 trous au choix**
- [x] Nombre de joueurs ? → **1 à 3 amateurs + le pro**
- [x] Comment fonctionne le paiement ? → **Via Stripe après confirmation finale**
- [x] Communication ? → **Via notifications, pas de messagerie directe**
- [x] Design profil pro ? → **Garder le design animé actuel**
- [x] Split du paiement si plusieurs amateurs ? → **Phase 1: Non, les clients s'arrangent entre eux. Phase 2: À implémenter**
- [x] Système de notation/avis ? → **Amateurs notent les pros après la partie**
- [x] Commission Eagle ? → **% sur chaque réservation (configurable dans admin)**
- [x] Notifications ? → **Push + Email + In-app**
- [x] Politique d'annulation ? → **Gratuite >24h, 50% remboursé <24h, cas de force majeure étudiés**

---

## 🗺️ Architecture Navigation

```
Application
├── Authentification
│   ├── Login
│   ├── Register
│   └── Forgot Password
│
└── Tabs Principaux
    ├── Pros (liste des professionnels)
    ├── Parcours (parcours de golf)
    ├── Voyages (bientôt disponible)
    ├── Premium (abonnement)
    └── [Header] Avatar → Profile
```

### Questions à Clarifier
- [x] Navigation depuis la réservation ? → **Redirection vers Mon Profil, section réservations**
- [x] Écrans de paiement ? → **Dans l'app avec Stripe pour les réservations**
- [x] Historique des réservations ? → **Dans Mon Profil, conservation 3 ans**

---

## 📱 Écrans & Interfaces

### 1. Écran Pros (`/pros`)
- Liste de cartes de professionnels
- Design premium avec animations
- Navigation vers profil pro en cliquant

### 2. Écran Profile (`/profile/[id]`)

### 2a. Page Vitrine Pro (`/profile/[proId]`)
- **Accès**: Depuis l'écran Pros en tapant sur une card
- **Qui peut voir**: 
  - Amateurs cherchant un pro
  - Autres pros (consultation concurrence)
  - Le pro lui-même (preview)
- **Design**: Interface premium animée avec parallaxe
- **Objectif**: Donner envie de réserver
- **Sections**:
  - Photo hero avec effet parallaxe
  - Informations générales
  - Compétences et niveau
  - Tarifs (9/18 trous, 1/2/3 personnes)
  - Disponibilités
  - Bouton réservation fixe
- **Lecture seule**: Pas d'édition possible ici

### 2b. Mon Profil (`/mon-profil` ou `/settings/profile`)
- **Accès**: En tapant sur l'avatar dans le header
- **Qui peut voir**: Seulement l'utilisateur connecté
- **Design**: Interface classique de formulaire
- **Objectif**: Gérer ses informations personnelles et ses réservations
- **Sections Communes**:
  - Photo de profil
  - Nom, prénom, email
  - **Mes réservations** (à venir, en cours, passées)
- **Sections Amateur**:
  - Handicap, licence, club
  - Bouton "Devenir Pro"
- **Sections Pro** (en plus):
  - SIRET, statut entreprise
  - Tarifs (éditable)
  - Rayon de déplacement
  - Disponibilités
  - Gestion adhésion
  - **Mes réservations reçues** (demandes de parties)

### Questions à Clarifier
- [x] L'écran profil doit-il avoir 2 designs différents ? → **OUI : Vitrine pro (animé) vs Mon Profil (édition)**
- [x] Les pros peuvent-ils voir leur propre profil en mode "preview" ? → **OUI, et voir les autres pros aussi**
- [x] Design pour les profils amateurs vus par d'autres ? → **Non applicable, seuls les pros ont une vitrine publique**

### 3. Écran Parcours
- Liste des parcours de golf
- Détails des parcours

### 4. Écrans à Développer
- Voyages
- Premium
- Processus de réservation complet

---

## 🔄 Flux Utilisateurs

### Flux 1: Amateur réserve une partie avec un pro ✅
```
1. Ouvre l'app → Écran Pros
2. Voit les pros disponibles autour de sa position
3. Filtre par distance, prix, disponibilité
4. Clique sur un pro qui l'intéresse
5. Voit le profil détaillé (design premium animé)
   - Découvre son parcours, son niveau, son palmarès
   - Voit son rayon de déplacement
   - Consulte ses disponibilités
   - Voit les tarifs (9/18 trous, 1/2/3 joueurs)
6. Clique "Réserver une partie"
7. Écran de réservation :
   a) Choix du format (9 ou 18 trous)
   b) Nombre de joueurs (1, 2 ou 3 amateurs)
   c) Sélection de la date (calendrier)
   d) Choix de la période (matin ou après-midi)
   e) Sélection du parcours dans la zone
   f) Récapitulatif avec prix total

8. PROCESSUS DE VALIDATION :
   a) Client envoie la demande → Notification "Demande en cours"
   b) Pro reçoit notification → "Nouvelle demande de partie"
   c) Admin Eagle vérifie disponibilité auprès du parcours
   
   Si disponible :
   d) Admin confirme → Notifications de confirmation aux 2 parties
   e) Client est débité via Stripe (montant total, arrangement entre amateurs)
   f) Partie confirmée !
   g) Redirection vers Mon Profil → Section "Mes réservations"
   
   Si non disponible :
   d) Admin propose nouveau créneau → Notifications aux 2 parties
   e) Les 2 parties confirment le nouveau créneau
   f) Admin reçoit les confirmations
   g) Admin valide → Client débité → Partie confirmée !
```

### Flux 2: Utilisateur édite son profil
```
1. Clique sur avatar dans le header
2. Arrive sur son profil en mode édition
3. Modifie les informations
4. Sauvegarde
```

### Flux 3: Conversion Amateur → Pro ✅
```
1. Amateur clique "Devenir Professionnel" dans son profil
2. Remplit formulaire pro :
   - SIRET
   - Date de naissance
   - Statut entreprise
   - Division
   - Tarifs (9/18 trous, 1/2-3 personnes)
   - Rayon de déplacement
   
3. VALIDATION AUTOMATIQUE SIRET :
   - API INSEE vérifie SIRET
   - Vérifie correspondance nom/prénom
   
4. UPLOAD DOCUMENTS :
   - Photo carte d'identité (recto/verso)
   
5. VALIDATION ADMIN :
   - Admin reçoit notification
   - Vérifie carte d'identité vs infos saisies
   - Approuve ou rejette
   
6. SI APPROUVÉ :
   - Pro reçoit email avec lien de paiement
   - Paie l'adhésion sur page web (pas dans l'app)
   - Compte pro activé après paiement
   
7. SI REJETÉ :
   - Amateur reçoit notification avec raison
   - Peut resoumettre après corrections
```

### Questions à Clarifier
- [x] Flux complet de réservation ? → **Partiellement implémenté. À ajouter: format 9/18 trous en 1er écran, nb joueurs, validation admin**
- [x] Flux de paiement ? → **Dans l'app avec Stripe (intégration à finaliser)**

---

## 🏗️ Architecture Technique

### Stack Technique

#### Application Mobile (React Native + Expo)
- **Frontend**: React Native + Expo
- **Navigation**: Expo Router (file-based)
- **State Management**: Hooks locaux (migration Zustand prévue)
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - Storage (photos, cartes d'identité)
  - Row Level Security (RLS)
- **Animations**: React Native Reanimated v3
- **UI Components**: Custom Atomic Design
- **Paiement**: Stripe (réservations uniquement)
- **Notifications**: Push (Expo), Email, In-app

#### Back-office Admin (Web)
- **Framework**: NextJS
- **UI**: À définir (Tailwind, MUI, etc.)
- **Auth**: Supabase Admin
- **Features**: Dashboard complet, gestion réservations, validation pros

#### Services Externes
- **API INSEE**: Validation SIRET et informations entreprise
- **Stripe**: Paiements (app mobile + page web adhésion)
- **Email**: Notifications et liens de paiement

### Structure du Code
```
/app                 # Expo Router pages
  /(auth)           # Auth screens
  /(tabs)           # Main app tabs
  /profile          # Profile screens
/components         # Atomic Design components
  /atoms
  /molecules
  /organisms
/services           # API services
/hooks              # Custom hooks
/utils              # Utilities
/constants          # Theme, colors, etc.
```

---

## 💾 Modèle de Données

### Tables Principales
1. **profiles** - Infos de base de tous les utilisateurs
2. **amateur_profiles** - Infos spécifiques amateurs
3. **pro_profiles** - Infos spécifiques pros
4. **bookings** - Réservations
5. **availabilities** - Disponibilités des pros
6. **golf_courses** - Parcours de golf

### Questions à Clarifier
- [ ] Relations exactes entre les tables ?
- [x] Gestion des disponibilités ? → **Par jour et demi-journée (matin/après-midi), pas d'horaires précis + toggle global dispo/indispo**
- [x] Historique et archivage ? → **Conservation 3 ans dans Mon Profil**

---

## ❓ Points à Clarifier

### Priorité Haute
1. **Concept exact** : ✅ Parties de golf avec des pros (pas de coaching)
2. **Tarification** : ✅ Prix par partie, dégressif selon nombre de joueurs, green fee non inclus
3. **Géolocalisation** : ✅ Pros visibles selon leur rayon de déplacement
4. **Processus de réservation** : ✅ Validation manuelle par admin Eagle
5. **Paiement** : ✅ Via Stripe après confirmation finale
6. **Communication** : ✅ Par notifications (pas de chat direct)

### Priorité Moyenne
7. **Split paiement** : ✅ Phase 1: Paiement unique (clients s'arrangent). Phase 2: Split Stripe
8. **Monétisation Eagle** : ✅ Commission % sur réservations (configurable admin)
9. **Notifications** : ✅ Push + Email + In-app
10. **Premium** : ✅ Vidéos, résultats tournois, reportages. 15j gratuit puis payant
11. **Voyages** : ✅ "Bientôt disponible" avec notification d'intérêt et contact

### Priorité Basse
12. **Système de notation** : ✅ Amateurs notent les pros après partie
13. **Politique d'annulation** : ✅ Gratuite >24h, 50% <24h, force majeure étudiée
14. **Adhésion Pro** : ✅ 69€ HT/an (configurable admin)
15. **Statistiques** : Tracking des parties, progression ? (à définir plus tard)
16. **Social** : Aspects communautaires, partage ? (à définir plus tard)

---

## 📝 Notes de Mise à Jour

### Version 1.6 - 08/08/2025 
- **Gestion des disponibilités Pro** :
  - Par jour et demi-journée (matin/après-midi)
  - Pas d'horaires précis (trop complexe avec les parcours)
  - Toggle global disponible/indisponible (vacances, tournoi)
- **Flux de réservation clarifié** :
  - Choix 9/18 trous dès le premier écran après "Réserver"
  - Paiement dans l'app avec Stripe
  - Historique conservé 3 ans

### Version 1.5 - 08/08/2025
- **Clarification Profils** : 
  - Page Vitrine Pro : Design animé pour consultation (tous peuvent voir)
  - Mon Profil : Interface édition classique (utilisateur connecté uniquement)
  - Pros peuvent consulter autres pros
- **Séparation claire** entre vitrine commerciale et gestion de compte

### Version 1.4 - 08/08/2025
- **Adhésion Pro** : 69€ HT/an (configurable dans admin)
- **Politique d'annulation** :
  - Gratuite jusqu'à 24h avant
  - 50% remboursé si < 24h
  - Cas de force majeure étudiés

### Version 1.3 - 08/08/2025
- **Back-office Admin** : Application web NextJS séparée
- **Validation des Pros** : 
  - API INSEE pour vérification SIRET
  - Vérification manuelle carte d'identité
  - Paiement adhésion via page web (hors app)
- **Processus conversion Amateur → Pro** : Complet avec validation multi-étapes

### Version 1.2 - 08/08/2025
- **Monétisation** : Commission Eagle configurable dans admin
- **Premium** : 15 jours gratuit puis payant (vidéos, résultats, reportages)
- **Voyages** : Phase 1 avec notification d'intérêt et contact
- **Notifications** : Push + Email + In-app
- **Notation** : Amateurs notent les pros après partie

### Version 1.1 - 08/08/2025
- Clarification complète du concept : jouer AVEC des pros (pas de coaching)
- Processus de réservation avec validation admin Eagle
- Tarification : prix dégressif, green fee non inclus
- Paiement unique via Stripe (split en phase 2)
- Communication par notifications uniquement

### Version 1.0 - 08/08/2025
- Document initial créé
- Basé sur la compréhension initiale du projet

---

## 🎯 Prochaines Étapes

1. Clarifier les points en suspens
2. Valider la compréhension du concept
3. Définir les priorités de développement
4. Établir un roadmap clair

---

*Ce document est évolutif et sera mis à jour au fur et à mesure des clarifications.*