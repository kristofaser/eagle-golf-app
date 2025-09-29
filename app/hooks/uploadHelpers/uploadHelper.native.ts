/**
 * Upload helper pour les plateformes mobiles (iOS/Android)
 * Utilise FormData avec la structure native {uri, type, name}
 */

import { logger } from '@/utils/logger';

export interface UploadHelperOptions {
  uri: string;
  fileName: string;
  mimeType?: string;
}

/**
 * Prépare FormData pour l'upload sur mobile
 * Utilise la structure native qui fonctionne avec React Native
 */
export async function prepareFormDataForUpload(options: UploadHelperOptions): Promise<FormData> {
  const { uri, fileName, mimeType = 'image/jpeg' } = options;

  logger.dev('[Native] Preparing FormData for upload', { uri, fileName, mimeType });

  const formData = new FormData();

  // Sur mobile, FormData.append accepte un objet avec uri, type, name
  const photo = {
    uri,
    type: mimeType,
    name: fileName,
  } as any; // Type assertion nécessaire pour React Native

  formData.append('file', photo);

  logger.dev('[Native] FormData prepared with photo object');

  return formData;
}

/**
 * Convertit une URI en Blob (non utilisé sur mobile, juste pour compatibilité d'interface)
 */
export async function uriToBlob(uri: string): Promise<Blob> {
  // Sur mobile, on n'a pas besoin de convertir, on retourne un stub
  throw new Error('uriToBlob not needed on native platforms');
}

/**
 * Vérifie si l'URI est valide pour l'upload
 */
export function isValidUploadUri(uri: string): boolean {
  // Sur mobile, vérifier que l'URI commence par file:// ou contient un schéma valide
  return !!(uri && (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('assets-library://') ||
    uri.startsWith('ph://') // iOS Photo Library
  ));
}