# 📱 NOTIFICATIONS IMPLEMENTATION TRACKING

> Fichier de suivi pour l'implémentation du système de notifications Eagle
> Dernière mise à jour : 2025-01-11

## 📊 Vue d'ensemble

### Objectif
Implémenter un système de notifications complet (Push + Email + In-App) sans casser l'existant.

### Stack technique
- **Push**: Expo Push Notifications
- **Email**: Resend (déjà configuré)
- **In-App**: Supabase Realtime + useUIStore
- **Backend**: Supabase (Edge Functions + Triggers)

### Statut global : 🟡 EN PRÉPARATION

---

## ✅ Phase 0 : Analyse et Préparation
**Statut : ✅ TERMINÉ**
**Date : 2025-01-11**

- [x] Analyse de l'infrastructure existante
- [x] Identification des risques et dépendances
- [x] Vérification Resend configuré
- [x] Vérification Realtime actif
- [x] Mapping des hooks existants
- [x] Plan d'intégration sans rupture

### Découvertes importantes
- ✅ Resend déjà configuré avec clé API
- ✅ Realtime utilisé dans 2 hooks
- ✅ `travel_notification_preferences` existe
- ✅ `useUIStore` a déjà un système de toast
- ⚠️ Pas de push notifications installées
- ⚠️ Pas de table notifications

---

## 🔄 Phase 1 : Infrastructure Base (In-App)
**Statut : 🔴 À FAIRE**
**Estimation : 1 semaine**
**Priorité : HAUTE**

### 1.1 Base de données
- [ ] Créer table `notifications`
  ```sql
  -- Table pour historique des notifications
  CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Créer table `push_tokens`
  ```sql
  CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    token TEXT NOT NULL UNIQUE,
    platform TEXT CHECK (platform IN ('ios', 'android')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Étendre `travel_notification_preferences`
  ```sql
  ALTER TABLE travel_notification_preferences 
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_hours_start TIME,
  ADD COLUMN IF NOT EXISTS quiet_hours_end TIME;
  ```
- [ ] Créer les index nécessaires
- [ ] Tester les migrations

### 1.2 Hooks React Native
- [ ] Créer `useNotificationRealtime` (basé sur pattern existant)
- [ ] Créer `useNotificationList` pour l'historique
- [ ] Créer `useNotificationBadge` pour le compteur
- [ ] Tests unitaires des hooks

### 1.3 UI Components
- [ ] Étendre `useUIStore` avec notifications array
- [ ] Créer `NotificationBadge` component
- [ ] Créer `NotificationList` component
- [ ] Créer `NotificationItem` component
- [ ] Intégrer dans l'app (header badge)

### 1.4 Backend Triggers
- [ ] Trigger sur `bookings` UPDATE
- [ ] Trigger sur `payments` INSERT
- [ ] Trigger sur `pro_validation_requests` UPDATE
- [ ] Tests des triggers

---

## 🔄 Phase 2 : Push Notifications
**Statut : 🔴 À FAIRE**
**Estimation : 1 semaine**
**Priorité : MOYENNE**

### 2.1 Setup Expo Push
- [ ] Installer `expo-notifications`
- [ ] Configurer app.json/app.config.js
- [ ] Créer `NotificationService`
- [ ] Gérer les permissions iOS/Android

### 2.2 Token Management
- [ ] Fonction `registerForPushNotifications()`
- [ ] Sauvegarder token dans `push_tokens`
- [ ] Gérer refresh token
- [ ] Gérer opt-out

### 2.3 Edge Functions
- [ ] Créer `send-push-notification`
- [ ] Créer `process-notification`
- [ ] Intégration Expo Push API
- [ ] Gestion des erreurs

### 2.4 Deep Linking
- [ ] Configuration deep links
- [ ] Navigation vers bon écran
- [ ] Tests iOS/Android

---

## 🔄 Phase 3 : Email Notifications
**Statut : 🔴 À FAIRE**
**Estimation : 1 semaine**
**Priorité : BASSE**

### 3.1 Templates Email
- [ ] Template confirmation réservation
- [ ] Template paiement reçu
- [ ] Template alternative proposée
- [ ] Template pro validé

### 3.2 Edge Functions
- [ ] Créer `send-email-notification`
- [ ] Intégration Resend existant
- [ ] Gestion file d'attente

### 3.3 Admin Digest
- [ ] Créer `admin-daily-digest`
- [ ] Cron job quotidien
- [ ] Template email admin

---

## 📋 Checklist Pré-Production

### Tests
- [ ] Tests unitaires (>80% coverage)
- [ ] Tests d'intégration
- [ ] Tests E2E notifications
- [ ] Tests sur devices réels

### Performance
- [ ] Benchmark realtime <100ms
- [ ] Optimisation requêtes
- [ ] Caching approprié
- [ ] Rate limiting

### Sécurité
- [ ] Validation des inputs
- [ ] RLS policies
- [ ] Token validation
- [ ] Audit logs

### Documentation
- [ ] Guide développeur
- [ ] Guide utilisateur
- [ ] API documentation
- [ ] Troubleshooting guide

---

## 📈 Métriques à Suivre

### KPIs
- Taux de delivery push : _À mesurer_
- Taux d'ouverture : _À mesurer_
- Temps médian de lecture : _À mesurer_
- Taux de désactivation : _À mesurer_

### Monitoring
- [ ] Sentry pour les erreurs
- [ ] Analytics des notifications
- [ ] Dashboard métriques
- [ ] Alertes automatiques

---

## 🐛 Issues & Blockers

### Issues actuels
- Aucun pour le moment

### Risques identifiés
1. Conflits de channels Realtime
2. Backward compatibility avec Alert.alert
3. Performance avec beaucoup de notifications

---

## 📝 Notes de développement

### Patterns à respecter
- Utiliser le pattern des hooks realtime existants
- Wrapper Alert.alert, ne pas remplacer
- Réutiliser useUIStore pour toasts
- Channels uniques : `user-notifications-{userId}`

### À éviter
- ❌ Modifier les Edge Functions existantes
- ❌ Changer le singleton Supabase
- ❌ Toucher à la config Resend auth
- ❌ Créer un nouveau store Zustand

---

## 📅 Timeline

| Phase | Début | Fin estimée | Statut |
|-------|-------|-------------|--------|
| Phase 0 | 2025-01-11 | 2025-01-11 | ✅ TERMINÉ |
| Phase 1 | - | - | 🔴 À FAIRE |
| Phase 2 | - | - | 🔴 À FAIRE |
| Phase 3 | - | - | 🔴 À FAIRE |

---

## 🔗 Ressources

### Documentation
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Resend API](https://resend.com/docs)

### Fichiers clés
- `/app/hooks/useProRequestRealtime.ts` - Pattern à copier
- `/app/stores/useUIStore.ts` - Store à étendre
- `/app/services/travel-notification.service.ts` - Service à enrichir

---

## 📞 Contacts

- **Dev Lead**: Christophe
- **Supabase Project**: vrpsulmidpgxmkybgtwn
- **GitHub**: https://github.com/kristofaser/eagle-golf-app

---

_Ce document sera mis à jour au fur et à mesure de l'avancement._