# PREMIUM IMPLEMENTATION - Eagle Golf

Document de travail pour l'implémentation du système d'abonnement premium avec IAP (In-App Purchases).

---

## 🎯 Système de Vidéos Skills (Feature Premium Principale)

### Architecture Actuelle

**Stockage Vidéos** :
- **Hébergement** : Scaleway Object Storage (S3-compatible)
- **Bucket** : Configuré dans `utils/scaleway.ts`
- **Format clé** : `videos/pros/{proId}/{skillName}.mp4`
- **Création** : Les **Pros** uploadent leurs propres vidéos via l'app
- **Accès** : URL publique générée via `getPublicUrl(objectKey)`

**Skills Disponibles** (table `pro_profiles`) :
- `skill_driving` (0-100) → ✅ **GRATUIT pour tous**
- `skill_irons` (0-100) → 🔒 **Premium uniquement**
- `skill_wedging` (0-100) → 🔒 **Premium uniquement**
- `skill_chipping` (0-100) → 🔒 **Premium uniquement**
- `skill_putting` (0-100) → 🔒 **Premium uniquement**
- `skill_mental` (0-100) → ❌ **Pas de vidéo (désactivé)**

### Composants Existants

**1. SkillsSection** (`components/profile/sections/SkillsSection.tsx`)
- Affiche les 6 skills avec barres de progression
- Icône vidéo 🎥 à côté de chaque skill (sauf Mental)
- Navigation vers `/video-skill/[proId]/[skill]` au clic
- **État actuel** : AUCUNE restriction, toutes les vidéos accessibles

**2. VideoSkillScreen** (`app/video-skill/[proId]/[skill].tsx`)
- Charge vidéo depuis Scaleway via `s3.headObject()`
- Player vidéo avec `expo-video` (VideoView)
- Affichage nom pro + badge skill
- **État actuel** : AUCUNE vérification de statut premium

**3. Upload Manager** (`components/organisms/VideoUploadManager.tsx`)
- Gestion upload vidéos par les pros
- Upload vers Scaleway avec clé standardisée
- Support multi-skills

### Règles d'Accès Premium

| Skill | User Non-Premium | User Premium | Composants Affectés |
|-------|------------------|--------------|---------------------|
| **Driving** | ✅ Accès vidéo | ✅ Accès vidéo | Aucune restriction |
| **Irons** | 🔒 Verrouillé + Badge Premium | ✅ Accès vidéo | SkillsSection, VideoSkillScreen |
| **Wedging** | 🔒 Verrouillé + Badge Premium | ✅ Accès vidéo | SkillsSection, VideoSkillScreen |
| **Chipping** | 🔒 Verrouillé + Badge Premium | ✅ Accès vidéo | SkillsSection, VideoSkillScreen |
| **Putting** | 🔒 Verrouillé + Badge Premium | ✅ Accès vidéo | SkillsSection, VideoSkillScreen |
| **Mental** | ❌ Pas de vidéo | ❌ Pas de vidéo | Désactivé globalement |

### Points d'Intégration Nécessaires

**Modifications à apporter** :

**1. SkillsSection.tsx** (lignes 88-106)
- ✅ Déjà : Affiche icône vidéo pour chaque skill
- 🔄 À ajouter : Importer hook `usePremium()` pour vérifier statut user
- 🔄 À ajouter : Si `!isPremium && skill !== 'driving'` → Afficher icône cadenas 🔒 + badge "Premium"
- 🔄 À ajouter : Clic sur vidéo verrouillée → Navigation vers `/premium` (tab premium)
- 🔄 À ajouter : Désactiver navigation vers VideoSkillScreen si verrouillé

**2. VideoSkillScreen.tsx** (fonction `loadVideo`, lignes 45-83)
- ✅ Déjà : Charge et affiche vidéos depuis Scaleway
- 🔄 À ajouter : Vérifier statut premium user AVANT `s3.headObject()`
- 🔄 À ajouter : Si `!isPremium && skill !== 'driving'` → Afficher `<PremiumPaywall />` au lieu de vidéo
- 🔄 À ajouter : Composant `PremiumPaywall` avec bouton "Passer Premium"
- 🔄 À ajouter : Navigation depuis paywall → `/premium` (tab premium)

**3. Table profiles** (Supabase)
- ❌ Actuellement : Pas de champs premium
- 🆕 À ajouter :
  ```sql
  ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  ALTER TABLE profiles ADD COLUMN premium_expires_at TIMESTAMP;
  ALTER TABLE profiles ADD COLUMN premium_platform TEXT; -- 'apple' | 'google'
  ```

**4. Nouveaux Services/Hooks** (à créer)
- `services/premium.service.ts` :
  - `isPremiumUser(userId: string): Promise<boolean>`
  - `canAccessSkillVideo(userId: string, skill: string): Promise<boolean>`
  - `getPremiumStatus(userId: string): Promise<PremiumStatus>`
- `hooks/usePremium.ts` :
  - `usePremium()` → `{ isPremium, isLoading, expiresAt }`
- `components/organisms/PremiumPaywall.tsx` :
  - Composant paywall pour VideoSkillScreen
  - Liste bénéfices premium
  - Bouton CTA vers écran premium

---

## 🎯 Objectifs

- [ ] Implémenter système IAP (Apple + Google)
- [ ] Intégrer RevenueCat pour gestion unified
- [ ] Créer architecture backend (Supabase)
- [ ] Gérer états premium/non-premium
- [ ] Développer contenu premium
- [ ] Tester en sandbox avant production

---

## 💬 Points de Discussion

### 1. Architecture Technique

**Questions** :
- Structure des services IAP ?
- Hooks personnalisés nécessaires ?
- Context global pour premium status ?
- Integration RevenueCat SDK ?

**Décisions** :


---

### 2. Pricing & Produits IAP

**Questions** :
- Quel(s) plan(s) proposer ? (Monthly, Yearly, Lifetime)
- Prix envisagé par plan ?
- Trial gratuit ? (7 jours, 14 jours ?)
- Offre de lancement pour early adopters ?

**Décisions** :


---

### 3. User Experience & Parcours

**Questions** :
- Comment afficher premium aux users non-premium ?
  - Écran accessible en lecture seule ?
  - Paywall complet ?
  - Teasing avec blur sur contenu ?
- Navigation vers premium depuis où ?
  - Tab bar ?
  - Profile ?
  - Paywalls dans app ?
- Que voir quand déjà premium ?
  - Status abonnement ?
  - Gestion/annulation ?
  - Accès direct au contenu ?

**Décisions** :


---

### 4. Contenu Premium

**État actuel** :
- ✅ **Feature 1 (Vidéos Skills)** : Système complet déjà implémenté
  - Upload par les pros fonctionnel
  - Stockage Scaleway configuré
  - Player vidéo opérationnel
  - **À faire** : Ajouter restrictions premium uniquement

- ❓ **Feature 2 (In the Bag)** : À clarifier si on garde
- ❓ **Feature 3 (Tips Semaine)** : À clarifier si on garde
- ❓ **Feature 4 (Parcours Vidéo)** : À clarifier si on garde

**Décisions** :
- **2025-01-04** : Feature principale = Vidéos Skills des pros
  - Driving gratuit, autres skills premium
  - Pas besoin de CMS centralisé (pros uploadent déjà)
  - Infrastructure Scaleway déjà en place


---

### 5. Base de Données Supabase

**✅ DÉCISION : Option 2 - Table Dédiée `premium_subscriptions`**

**Règles Métier Premium** :
1. **Pros** : Premium automatique gratuit (source = `pro_auto`)
2. **Amateurs Premium** : Souscription IAP (source = `apple`/`google`)
3. **Amateurs Non-Premium** : Accès gratuit limité (Driving uniquement)

**Architecture Choisie** :

```sql
-- Table principale premium_subscriptions
CREATE TABLE premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Source de l'abonnement
  source TEXT NOT NULL CHECK (source IN ('apple', 'google', 'pro_auto')),
  -- 'pro_auto' = premium automatique pour les pros

  -- Détails IAP (NULL si source = 'pro_auto')
  platform TEXT CHECK (platform IN ('apple', 'google')),
  product_id TEXT,
  revenuecat_subscriber_id TEXT,

  -- Statut et validité
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_date TIMESTAMP WITH TIME ZONE,
  -- NULL expires_date = illimité (cas des pros)

  auto_renew BOOLEAN DEFAULT true,

  -- Métadonnées annulation
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  UNIQUE(revenuecat_subscriber_id),
  CONSTRAINT unique_active_subscription
    EXCLUDE USING gist (user_id WITH =)
    WHERE (status = 'active')
);

-- Index pour performance
CREATE INDEX idx_premium_sub_user_id ON premium_subscriptions(user_id);
CREATE INDEX idx_premium_sub_status ON premium_subscriptions(status);
CREATE INDEX idx_premium_sub_expires ON premium_subscriptions(expires_date);
CREATE INDEX idx_premium_sub_source ON premium_subscriptions(source);
CREATE INDEX idx_premium_sub_revenuecat ON premium_subscriptions(revenuecat_subscriber_id);
```

**Vue Helper `user_premium_status`** :
```sql
CREATE OR REPLACE VIEW user_premium_status AS
SELECT
  p.id AS user_id,
  p.user_type,
  CASE
    -- Les pros ont toujours premium
    WHEN p.user_type = 'professional' THEN true
    -- Amateurs avec subscription active et non expirée
    WHEN EXISTS (
      SELECT 1 FROM premium_subscriptions ps
      WHERE ps.user_id = p.id
      AND ps.status = 'active'
      AND (ps.expires_date IS NULL OR ps.expires_date > NOW())
    ) THEN true
    ELSE false
  END AS is_premium,
  ps.source AS premium_source,
  ps.status AS subscription_status,
  ps.expires_date,
  ps.platform,
  ps.auto_renew
FROM profiles p
LEFT JOIN premium_subscriptions ps ON (
  p.id = ps.user_id
  AND ps.status = 'active'
);
```

**Fonctions SQL Helper** :
```sql
-- Vérifier si user a accès premium
CREATE OR REPLACE FUNCTION is_user_premium(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_type TEXT;
  has_active_subscription BOOLEAN;
BEGIN
  SELECT p.user_type INTO user_type
  FROM profiles p
  WHERE p.id = check_user_id;

  IF user_type IS NULL THEN
    RETURN false;
  END IF;

  -- Les pros ont toujours premium
  IF user_type = 'professional' THEN
    RETURN true;
  END IF;

  -- Pour les amateurs, vérifier subscription active
  SELECT EXISTS (
    SELECT 1 FROM premium_subscriptions ps
    WHERE ps.user_id = check_user_id
    AND ps.status = 'active'
    AND (ps.expires_date IS NULL OR ps.expires_date > NOW())
  ) INTO has_active_subscription;

  RETURN has_active_subscription;
END;
$$ LANGUAGE plpgsql STABLE;

-- Vérifier accès à une vidéo skill
CREATE OR REPLACE FUNCTION can_access_skill_video(
  check_user_id UUID,
  skill_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Driving gratuit pour tous
  IF skill_name = 'driving' THEN
    RETURN true;
  END IF;

  -- Mental pas de vidéo
  IF skill_name = 'mental' THEN
    RETURN false;
  END IF;

  -- Autres skills = premium uniquement
  RETURN is_user_premium(check_user_id);
END;
$$ LANGUAGE plpgsql STABLE;
```

**Trigger Auto-Premium pour Pros** :
```sql
-- Créer auto subscription premium quand pro validé
CREATE OR REPLACE FUNCTION create_pro_premium_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND (
    OLD.validation_status IS NULL OR
    OLD.validation_status != 'approved'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM premium_subscriptions
      WHERE user_id = NEW.user_id
      AND source = 'pro_auto'
    ) THEN
      INSERT INTO premium_subscriptions (
        user_id,
        source,
        status,
        purchase_date,
        expires_date,
        auto_renew
      ) VALUES (
        NEW.user_id,
        'pro_auto',
        'active',
        NOW(),
        NULL, -- Pas d'expiration pour les pros
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_pro_premium
  AFTER INSERT OR UPDATE OF validation_status ON pro_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_pro_premium_subscription();
```

**RLS Policies** :
```sql
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users peuvent lire leur propre subscription
CREATE POLICY "Users can read own premium subscription"
ON premium_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Admins peuvent tout lire
CREATE POLICY "Admins can read all premium subscriptions"
ON premium_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
  )
);

-- Service role full access (pour webhooks)
CREATE POLICY "Service role full access"
ON premium_subscriptions FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

**Décisions** :
- ✅ **2025-01-04** : Table dédiée `premium_subscriptions` choisie
- ✅ Pros = Premium automatique via `source = 'pro_auto'` et `expires_date = NULL`
- ✅ Trigger automatique créé pour donner premium aux pros validés
- ✅ Vue `user_premium_status` pour requêtes simplifiées
- ✅ Fonctions SQL `is_user_premium()` et `can_access_skill_video()`
- ✅ RLS policies configurées pour sécurité


---

### 6. Timeline & Priorités

**Questions** :
- Quel ordre de développement ?
  1. IAP + backend → puis contenu ?
  2. Contenu → puis IAP ?
  3. Parallèle ?
- Deadline pour v1 premium ?
- Phase de test sandbox combien de temps ?

**Planning proposé** :

**Semaine 1-2 : Setup IAP**
- [ ] Configuration RevenueCat
- [ ] Création produits Apple/Google
- [ ] Integration SDK
- [ ] Hooks premium

**Semaine 2-3 : Backend**
- [ ] Table Supabase
- [ ] Edge Function webhook
- [ ] RLS policies
- [ ] Tests webhook

**Semaine 3-4 : UI/UX Premium**
- [ ] Paywall component
- [ ] Premium status display
- [ ] Restore purchases
- [ ] Feature flags

**Semaine 4-6 : Contenu Premium**
- [ ] Upload vidéos
- [ ] Structure données
- [ ] Screens contenu
- [ ] CMS admin

**Semaine 6-7 : Testing**
- [ ] Sandbox Apple
- [ ] Test Google
- [ ] E2E flows
- [ ] Bug fixes

**Décisions** :


---

### 7. Testing & Sandbox

**Questions** :
- Comptes sandbox Apple configurés ?
- Test tracks Google Play prêts ?
- Comment tester localement ?
- Stratégie de test avant production ?

**Setup nécessaire** :
- [ ] Apple Sandbox tester accounts
- [ ] Google Play internal testing track
- [ ] RevenueCat test environment
- [ ] Demo accounts Supabase

**Décisions** :


---

### 8. Configuration Stores

**App Store Connect** :
- [ ] Agreements signés (fiscal)
- [ ] Banking info configurée
- [ ] Subscription group créé
- [ ] Produits IAP créés

**Google Play Console** :
- [ ] Merchant account configuré
- [ ] Banking info
- [ ] Subscription products créés
- [ ] Testing tracks configurés

**RevenueCat** :
- [ ] Compte créé
- [ ] Projet Eagle Golf
- [ ] Apps liées (iOS/Android)
- [ ] Offerings configurés
- [ ] Webhook vers Supabase

**Status** :


---

### 9. Features Premium - Détails Techniques

#### Feature 1 : Vidéos de Skills (PRINCIPALE)

**✅ Infrastructure Existante** :
- **Stockage** : Scaleway Object Storage (S3-compatible)
- **Format** : MP4 avec clé standardisée `videos/pros/{proId}/{skillName}.mp4`
- **Player** : expo-video (VideoView component)
- **Upload** : Les pros uploadent via `VideoUploadManager.tsx`
- **Accès** : URL publique via `getPublicUrl()`

**Structure Actuelle (pro_profiles)** :
```typescript
interface ProSkills {
  skill_driving: number;    // 0-100, vidéo GRATUITE
  skill_irons: number;      // 0-100, vidéo PREMIUM
  skill_wedging: number;    // 0-100, vidéo PREMIUM
  skill_chipping: number;   // 0-100, vidéo PREMIUM
  skill_putting: number;    // 0-100, vidéo PREMIUM
  skill_mental: number;     // 0-100, PAS DE VIDÉO
}
```

**Flow Utilisateur Non-Premium** :
1. Consulte profil d'un pro (ProProfile)
2. Voit section Skills avec barres progression
3. Clique sur icône vidéo Driving → ✅ Vidéo accessible
4. Clique sur icône verrouillée Irons → 🔒 Navigation vers écran Premium
5. Sur écran Premium → Peut souscrire abonnement

**Flow Utilisateur Premium** :
1. Consulte profil d'un pro
2. Voit section Skills
3. Clique sur n'importe quelle vidéo → ✅ Toutes accessibles

**Décisions** :
- ✅ Utiliser infrastructure Scaleway existante
- ✅ Pas de nouveau CMS nécessaire
- ✅ Driving reste gratuit comme "teaser"
- ✅ 4 autres skills (irons, wedging, chipping, putting) = premium


#### Feature 2 : In the Bag du Pro

**✅ SPÉCIFICATIONS VALIDÉES**

**Concept** :
- Vidéo verticale du pro qui explique son équipement en face caméra
- Format storytelling : "Voici mon sac de golf et pourquoi j'ai choisi chaque club"
- Durée recommandée : 3-5 minutes
- Tournage par le pro lui-même (smartphone)

**Infrastructure** :
- **Stockage** : Scaleway Object Storage (réutilisation infrastructure existante)
- **Format clé** : `videos/pros/{proId}/in-the-bag.mp4`
- **Player** : expo-video (VideoView component) - Même player que skills
- **Upload** : Extension de `VideoUploadManager.tsx` existant
- **Orientation** : Verticale (portrait mode)

**Structure Base de Données** :
```typescript
// Table pro_profiles - Ajouter champ
interface ProProfile {
  // ... champs existants
  has_bag_video: boolean; // Indicateur présence vidéo In the Bag
  bag_video_updated_at?: Date; // Date dernière mise à jour
}
```

**Flow Utilisateur Premium** :
1. Sur écran Premium (tab premium), user voit card "In the Bag du Pro"
2. Clic sur card → Navigation vers `/in-the-bag/[proId]`
3. Écran plein écran avec VideoView (orientation verticale)
4. Lecture vidéo du pro expliquant son équipement
5. Bouton retour vers écran Premium

**Flow Utilisateur Non-Premium** :
1. Sur écran Premium, voit card "In the Bag du Pro"
2. Clic sur card → Modal/Paywall expliquant nécessité abonnement premium
3. Bouton CTA "Devenir Premium" → Flow achat IAP

**Composants à Créer** :
- `app/in-the-bag/[proId].tsx` - Écran vidéo plein écran
- `components/premium/InTheBagCard.tsx` - Card dans écran premium
- Extension `VideoUploadManager.tsx` pour upload vidéo bag

**Décisions** :
- ✅ **2025-01-04** : Vidéo verticale face caméra validée
- ✅ Upload par les pros via infrastructure Scaleway existante
- ✅ Même player que vidéos skills (expo-video)
- ✅ Premium uniquement (pas de version gratuite/teaser)


#### Feature 3 : Tips de la Semaine

**✅ SPÉCIFICATIONS VALIDÉES**

**Concept** :
- Vidéos courtes verticales avec conseils golf (putting, swing, mental, etc.)
- Création collaborative : Pros + Équipe Eagle
- Durée : 30 secondes à 2 minutes (format court)
- Fréquence : Nouveau tip tous les ~10 jours
- Format éducatif et engageant

**Infrastructure** :
- **Stockage** : Scaleway Object Storage (réutilisation infrastructure existante)
- **Format clé** : `videos/tips/{tipId}.mp4`
- **Player** : expo-video (VideoView component) - Même player vertical
- **Upload** : Interface admin Eagle + upload pro
- **Orientation** : Verticale (portrait mode)

**Structure Base de Données** :
```typescript
// Nouvelle table weekly_tips
interface WeeklyTip {
  id: string; // UUID
  title: string; // Ex: "Le secret du putting parfait"
  description?: string; // Description courte (optionnel)
  video_key: string; // Clé Scaleway: videos/tips/{id}.mp4
  author_id?: string; // Pro créateur (NULL si équipe Eagle)
  published_at: Date; // Date publication
  expires_at?: Date; // Date expiration (NULL = pas d'expiration)
  is_active: boolean; // Permet de désactiver sans supprimer
  view_count: number; // Compteur de vues (analytics)
  created_at: Date;
  updated_at: Date;
}

// Index pour performance
CREATE INDEX idx_weekly_tips_active ON weekly_tips(is_active, published_at DESC);
CREATE INDEX idx_weekly_tips_author ON weekly_tips(author_id);
```

**Flow Utilisateur Premium** :
1. Sur écran Premium (tab premium), voit card "Tips de la Semaine"
2. Clic sur card → Navigation vers `/tips` (liste des tips)
3. Liste verticale de tips (cards avec thumbnail + titre)
4. Clic sur tip → Lecture plein écran (VideoView)
5. Swipe vertical pour passer au tip suivant (format TikTok-like optionnel)

**Flow Utilisateur Non-Premium** :
1. Sur écran Premium, voit card "Tips de la Semaine"
2. Clic sur card → Modal/Paywall expliquant nécessité abonnement premium
3. Bouton CTA "Devenir Premium" → Flow achat IAP

**Composants à Créer** :
- `app/tips/index.tsx` - Liste des tips disponibles
- `app/tips/[tipId].tsx` - Écran vidéo plein écran
- `components/premium/TipsCard.tsx` - Card dans écran premium
- `components/tips/TipListItem.tsx` - Item dans liste tips
- Panel admin pour upload/gestion tips

**Fonctionnalités Additionnelles** :
- Notifications push quand nouveau tip publié (premium users uniquement)
- Marquage "tip vu" pour tracking utilisateur
- Analytics : vues, durée visionnage, completion rate

**Décisions** :
- ✅ **2025-01-04** : Vidéos verticales courtes validées
- ✅ Création collaborative Pros + Équipe Eagle
- ✅ Table dédiée `weekly_tips` avec gestion lifecycle
- ✅ Premium uniquement (exclusivité totale)
- ✅ Format liste + lecture plein écran
- ✅ Notifications push pour nouveaux tips


#### Feature 4 : Parcours Vidéo 3 Trous

**✅ SPÉCIFICATIONS VALIDÉES**

**Concept** :
- **3 vidéos séparées** : Le pro filme 3 trous (1 vidéo par trou)
- Chaque vidéo montre le pro jouant 1 trou complet (du tee au green)
- **Score overlay dynamique** en haut de chaque vidéo
- Format vertical, durée ~1-2 minutes par trou
- Navigation entre les 3 trous (swipe ou boutons)

**Infrastructure** :
- **Stockage** : Scaleway Object Storage (réutilisation infrastructure existante)
- **Format clé** :
  - `videos/pros/{proId}/holes/hole-1.mp4`
  - `videos/pros/{proId}/holes/hole-2.mp4`
  - `videos/pros/{proId}/holes/hole-3.mp4`
- **Player** : expo-video (VideoView component) - Même player vertical
- **Upload** : Les pros uploadent leurs propres vidéos
- **Orientation** : Verticale (portrait mode)

**Structure Base de Données** :
```typescript
// Nouvelle table pro_hole_videos
interface ProHoleVideo {
  id: string;
  pro_id: string; // FK vers profiles (role: professional)
  hole_number: number; // Numéro du trou joué (1-18)
  video_key: string; // videos/pros/{proId}/holes/hole-{id}.mp4

  // Données pour overlay dynamique
  par: number; // Par du trou (3, 4, ou 5)
  score: number; // Score réalisé par le pro

  // Métadonnées
  created_at: Date;
  updated_at: Date;
}

// Index pour performance
CREATE INDEX idx_pro_hole_videos_pro ON pro_hole_videos(pro_id);
CREATE INDEX idx_pro_hole_videos_hole ON pro_hole_videos(hole_number);

// Contrainte : 3 vidéos max par pro
CREATE UNIQUE INDEX idx_pro_hole_unique ON pro_hole_videos(pro_id, hole_number);
```

**Composant Overlay Dynamique** :
```typescript
// Component ScoreOverlay.tsx
interface ScoreOverlayProps {
  holeNumber: number; // Ex: 1, 2, 3
  par: number;        // Ex: 4
  score: number;      // Ex: 3 (birdie)
}

// Affichage en haut de la vidéo :
// ┌─────────────────────┐
// │ TROU 1  │  PAR 4  │ -1 │  ← Overlay fixe en haut
// └─────────────────────┘
// [Vidéo du pro jouant]
```

**Flow Utilisateur Premium** :
1. Sur écran Premium, voit card "Parcours Vidéo 3 Trous"
2. Clic → Navigation vers `/pro-holes/[proId]`
3. Écran avec 3 vidéos (thumbnails ou carrousel)
4. Sélection d'un trou → Lecture plein écran avec overlay score
5. Swipe horizontal pour passer au trou suivant/précédent

**Flow Utilisateur Non-Premium** :
1. Sur écran Premium, voit card "Parcours Vidéo 3 Trous"
2. Clic → Modal/Paywall expliquant nécessité abonnement premium
3. Bouton CTA "Devenir Premium" → Flow achat IAP

**Composants à Créer** :
- `app/pro-holes/[proId].tsx` - Sélection des 3 trous (carrousel ou liste)
- `app/pro-holes/[proId]/[holeId].tsx` - Lecture vidéo plein écran avec overlay
- `components/premium/ProHolesCard.tsx` - Card dans écran premium
- `components/video/ScoreOverlay.tsx` - Overlay score dynamique
- Extension `VideoUploadManager.tsx` pour upload 3 vidéos + données par/score

**Décisions** :
- ✅ **2025-01-04** : 3 vidéos séparées (1 par trou) validées
- ✅ Score en overlay dynamique (données stockées en DB)
- ✅ Upload par les pros eux-mêmes
- ✅ Table dédiée `pro_hole_videos` avec métadonnées par/score
- ✅ Premium uniquement (exclusivité totale)
- ✅ Navigation swipe entre les 3 trous


---

## 🔧 Stack Technique

**Mobile App** :
- `react-native-purchases` (RevenueCat SDK) v8.x
- Expo config plugins pour IAP
- `expo-video` (VideoView) - Déjà utilisé

**Backend** :
- Supabase Edge Function : `revenuecat-webhook` (À créer)
- Supabase Database : Table `premium_subscriptions` + fonctions SQL
- Scaleway Object Storage : Vidéos déjà stockées

**Services Externes** :
- RevenueCat (IAP management & webhooks)
- Apple App Store Connect (produits IAP)
- Google Play Console (produits IAP)

**Services App** :
- `services/premium.service.ts` (À créer)
  - `isPremium(userId): Promise<boolean>`
  - `canAccessSkillVideo(userId, skill): Promise<boolean>`
  - `getPremiumStatus(userId): Promise<PremiumStatus>`

**Hooks** :
- `hooks/usePremium.ts` (À créer)
  - `usePremium()` → `{ isPremium, isLoading, source, expiresAt }`

**Components** :
- `components/organisms/PremiumPaywall.tsx` (À créer)
  - Affichage dans VideoSkillScreen
  - Navigation vers écran premium
  - Liste bénéfices premium

---

## 📋 Checklist Globale

### Phase 1 : Configuration
- [x] ✅ RevenueCat account créé
- [ ] App Store Connect configuré
- [ ] Google Play Console configuré
- [x] ✅ Produits IAP créés dans RevenueCat (Mensuel 7,50€, Annuel 65,99€)
- [ ] RevenueCat Entitlement "premium" créé
- [ ] RevenueCat Offering "default" créé avec produits attachés
- [ ] API keys RevenueCat récupérées

### Phase 2 : Backend
- [ ] Migration Supabase appliquée (table + vue + fonctions + trigger)
- [ ] Edge Function `revenuecat-webhook` créée et déployée
- [ ] RLS policies configurées et testées
- [ ] Tests webhook RevenueCat validés
- [ ] Premium auto-activé pour pros existants validés

### Phase 3 : Mobile App
- [ ] Package `react-native-purchases` installé et configuré
- [x] ✅ Service `premium.service.ts` créé
- [x] ✅ Hook `usePremium()` créé
- [x] ✅ Component `PremiumPaywall.tsx` créé et finalisé
  - [x] ✅ Design UI complet (fullScreenModal presentation)
  - [x] ✅ Titre "Devenez membre Premium"
  - [x] ✅ Description "Accédez à tous les contenus exclusifs"
  - [x] ✅ 5 bénéfices affichés dans capsules avec icônes checkmark
  - [x] ✅ Bloc prix intégré (fond sombre, texte clair)
  - [x] ✅ Mensuel 7,50€ + Annuel 65,99€ (5,50€/mois)
  - [x] ✅ Bouton "Devenir Premium" (navigation vers onglet premium)
  - [x] ✅ Layout fixe sans scrolling
- [ ] SkillsSection modifié (icônes verrouillées + badges premium)
- [ ] VideoSkillScreen modifié (vérification premium + paywall)
- [ ] Écran Premium mis à jour (bouton achat actif)
- [ ] Restore purchases implémenté

### Phase 4 : Contenu Premium
- [x] ✅ **Feature 1 - Vidéos Skills** : Infrastructure complète (Scaleway + upload + player)
- [ ] **Feature 2 - In the Bag** :
  - [ ] Ajouter champs `has_bag_video`, `bag_video_updated_at` à `pro_profiles`
  - [ ] Étendre `VideoUploadManager.tsx` pour upload vidéos bag
  - [ ] Créer écran `/in-the-bag/[proId].tsx`
  - [ ] Créer `InTheBagCard.tsx` component
- [ ] **Feature 3 - Tips Semaine** :
  - [ ] Créer table `weekly_tips` (migration SQL)
  - [ ] Panel admin pour upload/gestion tips
  - [ ] Créer écran `/tips/index.tsx` (liste tips)
  - [ ] Créer écran `/tips/[tipId].tsx` (lecture vidéo)
  - [ ] Notifications push pour nouveaux tips
- [ ] **Feature 4 - Parcours Vidéo 3 Trous** :
  - [ ] Créer table `pro_hole_videos` (migration SQL)
  - [ ] Étendre `VideoUploadManager.tsx` pour upload 3 vidéos + par/score
  - [ ] Créer écran `/pro-holes/[proId].tsx` (sélection 3 trous)
  - [ ] Créer écran `/pro-holes/[proId]/[holeId].tsx` (lecture + overlay)
  - [ ] Créer `ScoreOverlay.tsx` component (affichage dynamique trou/par/score)
  - [ ] Créer `ProHolesCard.tsx` component (card écran premium)

### Phase 5 : Testing
- [ ] Tests sandbox Apple validés
- [ ] Tests Google Play validés
- [ ] E2E flow complet testé
- [ ] Edge cases gérés

### Phase 6 : Déploiement
- [ ] Review Apple soumis
- [ ] Review Google soumis
- [ ] Monitoring mis en place
- [ ] Support client prêt

---

## 📝 Notes & Décisions Importantes

*Section pour tracker les décisions importantes prises durant les discussions*

### Date : 2025-01-04

**Décision 1** : Feature Premium Principale = Vidéos Skills des Pros

**Rationale** :
- Infrastructure complète déjà en place (Scaleway, upload, player)
- Les pros créent déjà du contenu (pas besoin de production centralisée)
- Model freemium clair : Driving gratuit = teaser, 4 autres skills = premium

**Impact** :
- Pas de nouveau développement infrastructure
- Focus sur IAP integration et restrictions d'accès uniquement
- Timeline réduite (pas de CMS à développer)

---

**Décision 2** : Driving Gratuit, Autres Skills Premium

**Rationale** :
- Permet aux users de tester la qualité des vidéos
- Incite à découvrir les pros
- Crée frustration positive pour conversion premium

**Impact** :
- Modifications ciblées : SkillsSection + VideoSkillScreen uniquement
- Logique simple : `if (!isPremium && skill !== 'driving') → locked`

---

**Décision 3** : Table dédiée `premium_subscriptions` (Option 2)

**Rationale** :
- Historique complet des abonnements (analytics, support client)
- Support multi-sources (IAP + auto pros)
- Gestion pros simplifiée via `source = 'pro_auto'`
- Évolutivité (trials, promo codes, lifetime, etc.)

**Impact** :
- Table dédiée + vue + fonctions SQL
- Trigger auto-premium pour pros validés
- Requêtes optimisées via vue `user_premium_status`
- Foundation solide pour analytics futures

---

**Décision 4** : Pros = Premium Automatique Gratuit

**Rationale** :
- Les pros créent le contenu premium (vidéos skills)
- Logique business : créateurs de contenu ont accès
- Pas de paiement requis pour les pros
- Simplifie onboarding pro

**Impact** :
- Trigger automatique : `validation_status = 'approved'` → création subscription `pro_auto`
- `expires_date = NULL` (illimité pour pros)
- Fonction `is_user_premium()` gère automatiquement les pros
- Pas besoin d'IAP pour les pros

---

**Décision 5** : Design Paywall Premium - Simplification UX

**Date** : 2025-01-05

**Rationale** :
- UX simplifiée : Layout fixe sans scrolling pour accès immédiat à l'info
- Visual hierarchy : Pricing intégré dans section action pour emphasis
- Design moderne : Capsules bénéfices + fond sombre pour prix
- Native iOS/Android : fullScreenModal pour présentation plein écran

**Design Final** :
- Header : Bouton close (X) en haut à droite avec safe area
- Contenu fixe : Titre + description + 5 bénéfices en capsules
- Bénéfices : Capsules grises avec icône checkmark verte + texte simple
- Prix : Fond charcoal avec texte blanc, 2 options (mensuel/annuel) côte à côte
- Action : Bouton "Devenir Premium" en bas avec safe area

**Textes Finalisés** :
- Titre : "Devenez membre Premium"
- Description : "Accédez à tous les contenus exclusifs"
- Bénéfices :
  1. "Accès à toutes les vidéos Skills"
  2. "Tips de la semaine d'un pro"
  3. "Vidéos 3 trous du pro"
  4. "In The Bag d'un pro"
  5. "Concours de Drive / Précision"
- Prix : Mensuel 7,50€/mois | Annuel 65,99€ (5,50€/mois)

**Impact** :
- `_layout.tsx` : presentation 'fullScreenModal' pour premium-paywall
- `premium-paywall.tsx` : Layout fixe (View au lieu de ScrollView)
- Design système cohérent : Colors, Spacing, Typography, BorderRadius
- Navigation simplifiée : router.back() + navigation vers onglet premium

---

## 🚀 Prochaines Étapes

### ✅ État d'Avancement (2025-01-05)

**Complété** :
- ✅ RevenueCat account créé
- ✅ Produits IAP créés dans RevenueCat (Mensuel 7,50€, Annuel 65,99€)
- ✅ Service `premium.service.ts` créé (8 fonctions + cache 5min)
- ✅ Hook `usePremium()` créé (réactivité Supabase temps réel)
- ✅ Hook `usePremiumContent()` créé (skills, tips, bag, holes)
- ✅ Types `types/premium.ts` créés (TypeScript complet)
- ✅ Component `PremiumPaywall.tsx` finalisé (design UI complet)
- ✅ Navigation _layout.tsx configurée (fullScreenModal)

**En Cours** :
- ⏳ Configuration RevenueCat (Entitlement + Offering + API keys)

**À Faire** :
1. Finaliser configuration RevenueCat (Entitlement "premium" + Offering "default")
2. Configurer produits IAP dans App Store Connect
3. Configurer produits IAP dans Google Play Console
4. Lier apps iOS/Android à RevenueCat
5. Migration Supabase (table premium_subscriptions)
6. Edge Function webhook RevenueCat
7. Modifier SkillsSection + VideoSkillScreen (restrictions premium)
8. Intégrer SDK RevenueCat dans app mobile

### Ordre d'Implémentation Recommandé

**Étape 1 : Migration Base de Données** (1-2 jours)
1. Créer fichier migration SQL complet
2. Tester migration sur environnement dev
3. Appliquer migration sur production
4. Vérifier trigger auto-premium pour pros existants
5. Valider fonctions SQL `is_user_premium()` et `can_access_skill_video()`

**Étape 2 : Edge Function Webhook** (1-2 jours)
1. Créer `supabase/functions/revenuecat-webhook/index.ts`
2. Gérer events RevenueCat (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)
3. Déployer fonction sans JWT verification (`--no-verify-jwt`)
4. Configurer webhook URL dans RevenueCat Dashboard
5. Tester avec RevenueCat sandbox

**Étape 3 : Services & Hooks App** ✅ **COMPLÉTÉ** (1 jour)
1. ✅ Créé `services/premium.service.ts` avec 8 fonctions métier + cache 5min
2. ✅ Créé `hooks/usePremium.ts` avec réactivité temps réel Supabase
3. ✅ Créé `hooks/usePremiumContent.ts` avec hooks pour contenu premium
4. ✅ Créé `types/premium.ts` avec types TypeScript complets
5. ✅ Créé écran de test `app/test-premium.tsx` pour validation
6. ✅ Ajouté bouton test dans écran Premium (dev only)
7. ✅ Testé avec users pros et amateurs - Fonctionnel ✅

**Étape 4 : Modifications UI Existantes** (2-3 jours)
1. Modifier `SkillsSection.tsx` (icônes verrouillées)
2. Modifier `VideoSkillScreen.tsx` (vérification premium)
3. Créer `PremiumPaywall.tsx` component
4. Tester flow complet user non-premium

**Étape 5 : Configuration Stores & RevenueCat** ⏳ **EN COURS** (2-3 jours)
1. ✅ Créer compte RevenueCat
2. ✅ Produits créés dans RevenueCat (Mensuel 7,50€, Annuel 65,99€)
3. ⏳ Créer Entitlement "premium" dans RevenueCat
4. ⏳ Créer Offering "default" et attacher produits
5. ⏳ Récupérer API keys RevenueCat (iOS + Android)
6. ⏳ Configurer produits IAP dans App Store Connect
7. ⏳ Configurer produits IAP dans Google Play Console
8. ⏳ Lier apps iOS/Android à RevenueCat

**Étape 6 : Intégration SDK RevenueCat** (2-3 jours)
1. Installer `react-native-purchases`
2. Configurer SDK (API keys, user identification)
3. Implémenter flow achat dans écran Premium
4. Implémenter restore purchases
5. Tester en sandbox Apple/Google

**Étape 7 : Testing Complet** (3-4 jours)
1. Tests sandbox Apple IAP
2. Tests sandbox Google IAP
3. Tests webhook RevenueCat
4. Tests premium auto pour pros
5. Tests E2E flow complet
6. Edge cases et error handling

**Timeline totale estimée** : 12-18 jours de développement

---

---

## 🔧 Workflow Upload Vidéos Premium

### Différence Skills vs Autres Features

| Feature | Qui Upload | Interface Upload | Workflow |
|---------|-----------|------------------|----------|
| **Feature 1 - Skills** | Pro | App mobile | Pro upload directement via `VideoUploadManager.tsx` ✅ |
| **Feature 2 - In the Bag** | Eagle Team | **Backoffice Admin** | Pro envoie vidéo (WhatsApp) → Eagle upload via admin |
| **Feature 3 - Tips** | Eagle Team | **Backoffice Admin** | Pros + Eagle créent → Eagle upload via admin |
| **Feature 4 - Parcours 3 Trous** | Eagle Team | **Backoffice Admin** | Pro envoie 3 vidéos → Eagle upload via admin |

### Configuration Scaleway (Déjà Existante)

**Credentials** ([app/utils/scaleway.ts](app/utils/scaleway.ts:1-30)) :
```typescript
{
  accessKeyId: 'SCW8Q6A1AZK3Z0KR607E',
  secretAccessKey: '991fd15c-f0ea-4a2c-b9b0-42e3e9ab62b1',
  endpoint: 'https://s3.fr-par.scw.cloud',
  region: 'fr-par',
  bucketName: 'eagle',
}
```

**Bucket** : `eagle` (S3-compatible)
**SDK** : AWS SDK v2 (compatible Scaleway)

### Backoffice Admin - Upload Interface

**Structure à Créer** :
```
admin/src/
├── app/(admin)/premium/
│   ├── in-the-bag/
│   │   └── page.tsx          # Gestion vidéos In the Bag
│   ├── tips/
│   │   └── page.tsx          # Gestion vidéos Tips
│   └── pro-holes/
│       └── page.tsx          # Gestion vidéos Parcours 3 Trous
├── lib/
│   └── scaleway.ts           # Config Scaleway pour admin (réutilisation credentials)
└── components/features/premium/
    ├── VideoUploadZone.tsx   # Zone upload vidéo (drag & drop)
    ├── VideoPreview.tsx      # Prévisualisation vidéo
    └── VideoMetadataForm.tsx # Formulaire métadonnées
```

**Pattern Upload Admin** (similaire aux voyages) :
1. **Drag & Drop** zone pour sélectionner vidéo locale
2. **Validation** : Format MP4, taille max 100MB
3. **Upload** vers Scaleway avec AWS SDK
4. **Métadonnées** : Formulaire React Hook Form + Zod
5. **Stockage DB** : Insertion métadonnées dans Supabase
6. **Prévisualisation** : Player vidéo dans admin

**Upload Flow** :
```typescript
// admin/lib/scaleway.ts
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.SCALEWAY_ACCESS_KEY,
  secretAccessKey: process.env.SCALEWAY_SECRET_KEY,
  endpoint: 'https://s3.fr-par.scw.cloud',
  region: 'fr-par',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

export async function uploadVideoToScaleway(
  file: File,
  objectKey: string
): Promise<string> {
  const params = {
    Bucket: 'eagle',
    Key: objectKey,
    Body: file,
    ContentType: 'video/mp4',
  };

  await s3.upload(params).promise();
  return `https://eagle.s3.fr-par.scw.cloud/${objectKey}`;
}
```

### Pages Admin à Créer

#### 1. In the Bag (`/admin/premium/in-the-bag`)

**Fonctionnalités** :
- Liste des pros avec/sans vidéo In the Bag
- Upload vidéo par pro (1 vidéo max par pro)
- Remplacement vidéo existante
- Suppression vidéo
- Prévisualisation

**Formulaire** :
- Sélection pro (dropdown)
- Upload vidéo (drag & drop)
- Date mise à jour (auto)

**Table Supabase** : `pro_profiles`
- `has_bag_video: boolean`
- `bag_video_updated_at: timestamp`

**Clé Scaleway** : `videos/pros/{proId}/in-the-bag.mp4`

---

#### 2. Tips de la Semaine (`/admin/premium/tips`)

**Fonctionnalités** :
- Liste des tips (actifs, expirés, brouillons)
- Création nouveau tip
- Upload vidéo + métadonnées
- Modification tip existant
- Suppression tip
- Activation/Désactivation
- Prévisualisation

**Formulaire** :
- Titre (requis)
- Description (optionnel)
- Upload vidéo (requis)
- Auteur (dropdown pros ou "Eagle Team")
- Date publication (date picker)
- Date expiration (optionnel)
- Statut (actif/inactif)

**Table Supabase** : `weekly_tips`
- `id, title, description, video_key, author_id, published_at, expires_at, is_active, view_count, created_at, updated_at`

**Clé Scaleway** : `videos/tips/{tipId}.mp4`

---

#### 3. Parcours Vidéo 3 Trous (`/admin/premium/pro-holes`)

**Fonctionnalités** :
- Liste des pros avec vidéos trous
- Sélection pro
- Upload 3 vidéos séparées
- Saisie métadonnées par trou (par, score)
- Modification/Remplacement vidéos
- Suppression complète ou par trou
- Prévisualisation 3 trous

**Formulaire** :
- Sélection pro (dropdown)
- **Trou 1** :
  - Numéro trou (1-18)
  - Par (3, 4, 5)
  - Score pro (nombre)
  - Upload vidéo
- **Trou 2** : (idem)
- **Trou 3** : (idem)

**Table Supabase** : `pro_hole_videos`
- `id, pro_id, hole_number, par, score, video_key, created_at, updated_at`

**Clés Scaleway** :
- `videos/pros/{proId}/holes/hole-{id}.mp4` (3 vidéos par pro)

---

**Dernière mise à jour** : 2025-01-05
