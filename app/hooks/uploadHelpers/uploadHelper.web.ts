/**
 * Upload helper pour la plateforme Web
 * Convertit les URI en Blob avant l'ajout à FormData
 */

import { logger } from '@/utils/logger';

export interface UploadHelperOptions {
  uri: string;
  fileName: string;
  mimeType?: string;
}

/**
 * Convertit une URI (data: ou blob:) en Blob
 */
export async function uriToBlob(uri: string): Promise<Blob> {
  logger.dev('[Web] Converting URI to Blob', { uriPrefix: uri.substring(0, 50) });

  try {
    // Si c'est une data URI
    if (uri.startsWith('data:')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      logger.dev('[Web] Converted data URI to Blob', { size: blob.size, type: blob.type });
      return blob;
    }

    // Si c'est une blob URI
    if (uri.startsWith('blob:')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      logger.dev('[Web] Converted blob URI to Blob', { size: blob.size, type: blob.type });
      return blob;
    }

    // Si c'est une URL HTTP/HTTPS (image externe)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      logger.dev('[Web] Fetched remote image as Blob', { size: blob.size, type: blob.type });
      return blob;
    }

    // Si c'est un File object déguisé en string (peut arriver avec certains pickers)
    if (typeof uri === 'object' && uri instanceof File) {
      logger.dev('[Web] URI is already a File object');
      return uri;
    }

    throw new Error(`Unsupported URI format: ${uri.substring(0, 50)}`);
  } catch (error) {
    logger.error('[Web] Failed to convert URI to Blob:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Prépare FormData pour l'upload sur web
 * Convertit l'URI en Blob/File avant l'ajout
 */
export async function prepareFormDataForUpload(options: UploadHelperOptions): Promise<FormData> {
  const { uri, fileName, mimeType = 'image/jpeg' } = options;

  logger.dev('[Web] Preparing FormData for upload', { uri: uri.substring(0, 50), fileName, mimeType });

  try {
    // Convertir l'URI en Blob
    const blob = await uriToBlob(uri);

    // Créer un File à partir du Blob pour avoir un nom de fichier
    const file = new File([blob], fileName, {
      type: mimeType,
      lastModified: Date.now(),
    });

    logger.dev('[Web] Created File from Blob', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Créer le FormData
    const formData = new FormData();
    formData.append('file', file, fileName);

    // Vérification que le fichier est bien ajouté
    const fileEntry = formData.get('file');
    if (!fileEntry) {
      throw new Error('Failed to append file to FormData');
    }

    logger.dev('[Web] FormData prepared successfully', {
      hasFile: !!fileEntry,
      fileSize: fileEntry instanceof File ? fileEntry.size : 'unknown',
    });

    return formData;
  } catch (error) {
    logger.error('[Web] Failed to prepare FormData:', error);
    throw new Error(`Failed to prepare upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Vérifie si l'URI est valide pour l'upload sur web
 */
export function isValidUploadUri(uri: string): boolean {
  // Sur web, accepter data:, blob:, http(s):, ou File objects
  if (!uri) return false;

  // Vérifier les schémas supportés
  const validSchemes = [
    'data:',
    'blob:',
    'http://',
    'https://',
  ];

  const isValidScheme = validSchemes.some(scheme =>
    typeof uri === 'string' && uri.startsWith(scheme)
  );

  // Ou si c'est un File object
  const isFileObject = typeof uri === 'object' && uri instanceof File;

  return isValidScheme || isFileObject;
}