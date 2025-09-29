import { Platform } from 'react-native';

// Export conditionnel selon la plateforme
// Sur web, utiliser ProfileScreen.web.tsx
// Sur mobile (iOS/Android), utiliser ProfileScreen.tsx
const ProfileScreen = Platform.select({
  web: () => require('./ProfileScreen.web').default,
  default: () => require('./ProfileScreen').default,
})!();

export default ProfileScreen;