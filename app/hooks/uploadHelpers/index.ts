/**
 * Export conditionnel des helpers d'upload
 * React Native choisira automatiquement le bon fichier selon la plateforme
 *
 * Sur mobile : uploadHelper.native.ts
 * Sur web : uploadHelper.web.ts
 */

// React Native résoudra automatiquement vers .native.ts ou .web.ts
export * from './uploadHelper';

// Types communs exportés pour tous les consommateurs
export type { UploadHelperOptions } from './uploadHelper';