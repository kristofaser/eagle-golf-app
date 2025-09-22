# 🧪 Guide de Tests - Eagle App

## 📊 État Actuel des Tests

### Couverture par Domaine
| Domaine | Fichiers | Testés | Coverage | Status |
|---------|----------|---------|----------|---------|
| Services | 19 | 3 | **16%** | ⚠️ En progression |
| Hooks | 22 | 10 | **45%** | 🟡 Amélioration |
| Components | 50 | 2 | **4%** | ❌ À développer |
| Contexts | 8 | 7 | **88%** | ✅ Bon |
| Integration | - | 1 | - | 🟡 Nouveau |

### Services Critiques Testés ✅
- **PaymentService** : 18 tests - 100% passent
- **BookingService** : 15 tests - 80% passent
- **SiretValidation** : Tests complets

### Hooks Testés ✅
- **useAuth** : Tests complets d'authentification
- **useUser** : Gestion profil et données utilisateur
- **useBookingValidation** : Validation des réservations
- **usePriceCalculation** : Calculs tarifaires

### Composants Testés ✅
- **PaymentSheet** : Processus de paiement Stripe
- **Button** : Composant atomique de base

## 🚀 Exécution des Tests

### Tests Rapides
```bash
# Tous les tests
npm test

# Tests en mode watch (développement)
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests modifiés seulement
npm run test:changed
```

### Tests Par Catégorie
```bash
# Services uniquement
npm run test:services

# Hooks uniquement
npm run test:hooks

# Composants uniquement
npm run test:components

# Tests d'intégration
npm run test:integration
```

### Tests CI/CD
```bash
# Tests pour la CI (optimisés)
npm run test:ci

# Vérification qualité complète
npm run quality
```

## 📝 Structure des Tests

```
__tests__/
├── services/           # Tests des services métier
│   ├── payment.service.test.ts
│   ├── booking.service.test.ts
│   └── siret-validation.test.ts
├── hooks/              # Tests des hooks React
│   ├── useAuth.test.tsx
│   ├── useUser.test.tsx
│   └── ...
├── components/         # Tests des composants
│   └── organisms/
│       └── PaymentSheet.test.tsx
├── integration/        # Tests d'intégration
│   └── booking-payment-flow.test.ts
└── unit/              # Tests unitaires purs
    └── utils/
```

## 🎯 Tests Critiques à Maintenir

### 1. Flux de Paiement (CRITIQUE) 💳
- `payment.service.test.ts`
- `PaymentSheet.test.tsx`
- Protection contre doubles paiements
- Gestion des erreurs Stripe

### 2. Flux de Réservation (CRITIQUE) 📅
- `booking.service.test.ts`
- `booking-payment-flow.test.ts`
- Validation des disponibilités
- Calculs de prix

### 3. Authentification (IMPORTANT) 🔐
- `useAuth.test.tsx`
- `useUser.test.tsx`
- Gestion de session
- Permissions utilisateur

## 🛠️ Écrire de Nouveaux Tests

### Template Service Test
```typescript
import { monService } from '@/services/mon.service';

describe('MonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait faire X correctement', async () => {
    // Arrange
    const input = { /* ... */ };

    // Act
    const result = await monService.method(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });
});
```

### Template Hook Test
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMonHook } from '@/hooks/useMonHook';

describe('useMonHook', () => {
  it('devrait retourner la valeur initiale', () => {
    const { result } = renderHook(() => useMonHook());

    expect(result.current.value).toBe(initialValue);
  });
});
```

## 🔧 CI/CD Configuration

### GitHub Actions
- **Fichier** : `.github/workflows/tests.yml`
- **Déclencheurs** : Push sur main/develop, Pull Requests
- **Actions** :
  - Linting
  - TypeScript check
  - Tests avec couverture
  - Rapport de couverture dans les PR

### Pre-push Hook
- **Fichier** : `.husky/pre-push`
- **Actions** :
  - Tests sur fichiers modifiés
  - Vérification linting
  - Bloque le push si tests échouent

## 📈 Objectifs de Couverture

### Court Terme (1 mois)
- Services : **40%** (actuellement 16%)
- Hooks : **60%** (actuellement 45%)
- Composants : **20%** (actuellement 4%)

### Moyen Terme (3 mois)
- Services : **60%**
- Hooks : **70%**
- Composants : **40%**
- Global : **60%**

## 🚨 Commandes Utiles

```bash
# Corriger automatiquement le linting
npm run lint:fix

# Formater le code
npm run format

# Vérifier les types TypeScript
npm run type-check

# Mettre à jour les snapshots
npm run test:update-snapshots

# Qualité complète (lint + types + tests)
npm run quality
```

## 💡 Bonnes Pratiques

1. **Toujours tester les flux critiques** : Paiements, réservations, auth
2. **Mocks cohérents** : Utiliser les mêmes structures que l'API réelle
3. **Tests isolés** : Chaque test doit être indépendant
4. **Nommage clair** : `devrait [action] quand [condition]`
5. **AAA Pattern** : Arrange, Act, Assert
6. **Cleanup** : Toujours nettoyer après les tests

## 🔍 Debugging Tests

```bash
# Tests en mode debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Test unique fichier
npm test -- payment.service.test.ts

# Test unique suite
npm test -- --testNamePattern="PaymentService"

# Voir la couverture détaillée
open coverage/lcov-report/index.html
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Dernière mise à jour** : Décembre 2024
**Mainteneur** : Équipe Eagle
**Contact** : dev@eagle-app.com