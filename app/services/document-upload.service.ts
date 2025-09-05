/**
 * Service d'upload de documents pour les profils professionnels
 * Gère l'upload des pièces d'identité vers Supabase Storage
 */

import { supabase } from '@/utils/supabase/client';
import { ImagePickerResult } from '@/hooks/useUnifiedImagePicker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface DocumentUploadResult {
  url: string;
  path: string;
  size: number;
}

export interface DocumentUploadError {
  code: string;
  message: string;
  details?: unknown;
}

export type DocumentType = 'id_front' | 'id_back' | 'passport' | 'other';

class DocumentUploadService {
  private readonly BUCKET_NAME = 'documents';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  // 🔧 PATCH: Types autorisés pour validation interne (inclut le type générique du simulator)
  private readonly VALIDATION_TYPES = [
    ...this.ALLOWED_TYPES,
    'image', // iOS Simulator retourne parfois juste "image"
  ];

  // 🔧 CLIENT TEMPORAIRE - Pour contourner RLS le temps de configurer les politiques
  private get storageClient() {
    // TODO: Une fois les politiques RLS configurées, revenir à 'return supabase;'
    // Pour l'instant, on utilise le client normal mais on va créer les politiques manuellement

    console.log(
      '🔒 Utilisation du client utilisateur (les politiques RLS doivent être configurées)'
    );
    return supabase;
  }

  /**
   * Vérifie que le bucket documents existe (assumé configuré via Dashboard)
   */
  private ensureBucketExists(): void {
    // ✅ Bucket documents assumé existant (créé via Supabase Dashboard)
    // Les politiques RLS empêchent la création programmatique du bucket
    // mais le bucket est déjà configuré et fonctionnel
    console.log('📦 Utilisation du bucket documents existant');
  }

  /**
   * Valide un fichier avant upload
   */
  private validateFile(file: ImagePickerResult): { isValid: boolean; error?: string } {
    // Vérifier la taille
    if (file.fileSize && file.fileSize > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Le fichier est trop volumineux (max ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB)`,
      };
    }

    // Vérifier les dimensions minimales pour les images
    if (file.width && file.height) {
      const minWidth = 800;
      const minHeight = 600;
      if (file.width < minWidth || file.height < minHeight) {
        return {
          isValid: false,
          error: `L'image doit faire au moins ${minWidth}x${minHeight} pixels pour être lisible`,
        };
      }
    }

    // Vérifier le type MIME si disponible
    if (file.type && !this.VALIDATION_TYPES.includes(file.type)) {
      console.log('❌ Type MIME rejeté:', file.type, 'vs autorisés:', this.VALIDATION_TYPES);
      return {
        isValid: false,
        error: `Format de fichier non autorisé (${file.type}). Utilisez JPG, PNG ou PDF.`,
      };
    }

    // 🔧 PATCH: Si type générique "image", vérifier l'extension
    if (file.type === 'image') {
      const extension = this.getFileExtension(file).toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png'];

      if (!validExtensions.includes(extension)) {
        return {
          isValid: false,
          error: `Type générique "image" avec extension invalide (.${extension}). Utilisez JPG ou PNG.`,
        };
      }

      console.log(`🔧 SIMULATOR FIX: Type générique "image" avec extension .${extension} accepté`);
    }

    // 🔧 PATCH TEMPORAIRE pour iOS Simulator
    // Le simulator ne retourne pas toujours le type MIME, on vérifie l'extension
    if (!file.type) {
      const extension = this.getFileExtension(file).toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

      if (!validExtensions.includes(extension)) {
        return {
          isValid: false,
          error: `Format de fichier non autorisé par extension (.${extension}). Utilisez JPG, PNG ou PDF.`,
        };
      }

      console.log('⚠️ SIMULATOR MODE: Validation par extension uniquement (.${extension})');
      console.log('📱 Sur device physique, le type MIME sera probablement disponible');
    }

    return { isValid: true };
  }

  /**
   * Génère un chemin unique pour le fichier
   */
  private generateFilePath(
    userId: string,
    documentType: DocumentType,
    fileExtension: string
  ): string {
    const timestamp = Date.now();
    return `${userId}/${documentType}_${timestamp}.${fileExtension}`;
  }

  /**
   * Détermine l'extension du fichier depuis l'URI ou le type MIME
   */
  private getFileExtension(file: ImagePickerResult): string {
    // Essayer d'extraire depuis le type MIME d'abord
    if (file.type) {
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'application/pdf': 'pdf',
      };
      const extension = mimeToExt[file.type];
      if (extension) {
        console.log(`📄 Extension depuis MIME type: ${file.type} → .${extension}`);
        return extension;
      }
    }

    // Fallback : Extraire depuis l'URI (important pour simulator)
    const uriParts = file.uri.split('.');
    const extension = uriParts[uriParts.length - 1]?.toLowerCase();

    console.log(`📁 Extension depuis URI: ${file.uri} → .${extension}`);

    // Normaliser jpeg → jpg
    if (extension === 'jpeg') return 'jpg';

    return ['jpg', 'png', 'pdf'].includes(extension) ? extension : 'jpg';
  }

  /**
   * Infère le type MIME depuis l'extension de fichier
   */
  private inferMimeType(extension: string): string {
    const cleanExtension = extension.toLowerCase().trim();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
    };

    const mimeType = mimeMap[cleanExtension] || 'image/jpeg';
    console.log(`📄 Inférence MIME: .${cleanExtension} → ${mimeType}`);
    return mimeType;
  }

  /**
   * Compresse une image pour optimiser la taille tout en gardant la lisibilité
   */
  private async compressImage(file: ImagePickerResult): Promise<ImagePickerResult> {
    try {
      // Taille cible optimale pour documents d'identité
      const MAX_WIDTH = 1500;
      const MAX_HEIGHT = 1200;
      const COMPRESSION_QUALITY = 0.8; // 80% après redimensionnement

      console.log('🗜️ Compression image:', {
        originalSize: `${file.width}x${file.height}`,
        originalFileSize: file.fileSize ? `${Math.round(file.fileSize / 1024)}KB` : 'unknown',
      });

      // Actions de manipulation
      const actions: ImageManipulator.Action[] = [];

      // Redimensionner si trop grande
      if (file.width > MAX_WIDTH || file.height > MAX_HEIGHT) {
        actions.push({
          resize: {
            width: Math.min(file.width, MAX_WIDTH),
            height: Math.min(file.height, MAX_HEIGHT),
          },
        });
        console.log('📏 Redimensionnement nécessaire');
      }

      // Appliquer les transformations si nécessaires
      if (actions.length > 0) {
        const result = await ImageManipulator.manipulateAsync(file.uri, actions, {
          compress: COMPRESSION_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG, // Toujours JPEG pour documents
        });

        console.log('✅ Image compressée:', {
          newSize: `${result.width}x${result.height}`,
          newUri: result.uri.split('/').pop(),
        });

        return {
          uri: result.uri,
          width: result.width,
          height: result.height,
          type: 'image/jpeg', // Force JPEG après compression
          // Note: fileSize n'est pas disponible dans le résultat d'ImageManipulator
        };
      }

      console.log('ℹ️ Aucune compression nécessaire');
      return file;
    } catch (error) {
      console.error('⚠️ Erreur compression image:', error);
      console.log('📷 Utilisation image originale en fallback');
      return file; // Fallback vers image originale
    }
  }

  /**
   * Upload un document vers Supabase Storage
   */
  async uploadDocument(
    userId: string,
    file: ImagePickerResult,
    documentType: DocumentType
  ): Promise<DocumentUploadResult> {
    try {
      console.log(`📤 Upload document ${documentType} pour user ${userId}`);

      // Validation du fichier
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // S'assurer que le bucket existe
      this.ensureBucketExists();

      // 🗜️ Compression optimisée pour documents
      const optimizedFile = await this.compressImage(file);

      // Préparer le fichier pour upload (utiliser le fichier optimisé)
      const fileExtension = this.getFileExtension(optimizedFile);
      const filePath = this.generateFilePath(userId, documentType, fileExtension);
      const contentType = this.inferMimeType(fileExtension);

      // 🔍 Validation finale du type MIME
      if (!this.ALLOWED_TYPES.includes(contentType)) {
        throw new Error(
          `Type MIME généré invalide: ${contentType}. Types acceptés: ${this.ALLOWED_TYPES.join(', ')}`
        );
      }

      console.log('📁 Chemin du fichier:', filePath);
      console.log('📄 Type MIME validé:', contentType);
      console.log('📏 Image optimisée:', {
        size: `${optimizedFile.width}x${optimizedFile.height}`,
        originalSize: file.fileSize ? `${Math.round(file.fileSize / 1024)}KB` : 'unknown',
      });

      // 🔧 FIX React Native: Convertir l'URI en ArrayBuffer pour Supabase
      console.log("📤 Lecture du fichier optimisé depuis l'URI...");
      const response = await fetch(optimizedFile.uri);
      if (!response.ok) {
        throw new Error(`Impossible de lire le fichier: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log('📦 ArrayBuffer créé:', {
        byteLength: arrayBuffer.byteLength,
        sizeMB: Math.round((arrayBuffer.byteLength / 1024 / 1024) * 100) / 100,
      });

      // Upload vers Supabase Storage avec le buffer et contentType explicite
      const { data, error } = await this.storageClient.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, uint8Array, {
          contentType: contentType, // Type MIME explicite
          cacheControl: '3600',
          upsert: false, // Éviter les écrasements accidentels
        });

      if (error) {
        console.error('❌ Erreur upload Supabase:', error);
        throw new Error(`Échec de l'upload: ${error.message}`);
      }

      if (!data?.path) {
        throw new Error('Upload réussi mais chemin manquant');
      }

      // Générer l'URL signée pour accès sécurisé (valide 1 heure)
      const { data: urlData, error: urlError } = await this.storageClient.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(data.path, 3600); // 1 heure

      if (urlError) {
        console.error('⚠️ Erreur génération URL signée:', urlError);
        // Continuer avec l'URL publique si la signature échoue
      }

      const finalUrl = urlData?.signedUrl || data.fullPath || '';

      // 🔍 Validation post-upload : vérifier que le fichier n'est pas vide
      await this.validateUploadedFile(data.path);

      console.log('✅ Document uploadé avec succès:', {
        path: data.path,
        url: finalUrl,
        size: file.fileSize || 0,
      });

      return {
        url: finalUrl,
        path: data.path,
        size: arrayBuffer.byteLength,
      };
    } catch (error: unknown) {
      console.error(`❌ Erreur upload document ${documentType}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un document du storage
   */
  async deleteDocument(filePath: string): Promise<void> {
    try {
      console.log('🗑️ Suppression du document:', filePath);

      const { error } = await this.storageClient.storage.from(this.BUCKET_NAME).remove([filePath]);

      if (error) {
        console.error('❌ Erreur suppression:', error);
        throw new Error(`Impossible de supprimer le document: ${error.message}`);
      }

      console.log('✅ Document supprimé avec succès');
    } catch (error: unknown) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un document existe
   */
  async documentExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.storageClient.storage
        .from(this.BUCKET_NAME)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop(),
        });

      if (error) {
        console.error('❌ Erreur vérification existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ Erreur vérification document:', error);
      return false;
    }
  }

  /**
   * Valide qu'un fichier uploadé n'est pas vide
   */
  private async validateUploadedFile(filePath: string): Promise<void> {
    try {
      const { data, error } = await this.storageClient.storage
        .from(this.BUCKET_NAME)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop(),
        });

      if (error) {
        console.warn('⚠️ Impossible de valider la taille du fichier:', error);
        return; // Ne pas bloquer si la validation échoue
      }

      const uploadedFile = data?.[0];
      if (uploadedFile && uploadedFile.metadata?.size === 0) {
        console.error('🚨 FICHIER VIDE DÉTECTÉ:', filePath);
        throw new Error('Le fichier uploadé est vide (0 bytes). Veuillez réessayer.');
      }

      if (uploadedFile) {
        console.log(
          '✅ Validation taille:',
          `${Math.round((uploadedFile.metadata?.size || 0) / 1024)}KB`
        );
      }
    } catch (error) {
      console.error('❌ Erreur validation fichier:', error);
      // Re-lancer l'erreur si c'est un fichier vide
      if (error instanceof Error && error.message.includes('vide')) {
        throw error;
      }
    }
  }

  /**
   * Liste tous les documents d'un utilisateur
   */
  async listUserDocuments(
    userId: string
  ): Promise<Array<{ name: string; path: string; size: number; createdAt: string }>> {
    try {
      const { data, error } = await this.storageClient.storage.from(this.BUCKET_NAME).list(userId, {
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        console.error('❌ Erreur liste documents:', error);
        return [];
      }

      return (
        data?.map((file: { name: string; metadata?: { size?: number }; created_at?: string }) => ({
          name: file.name,
          path: `${userId}/${file.name}`,
          size: file.metadata?.size || 0,
          createdAt: file.created_at || '',
        })) || []
      );
    } catch (error) {
      console.error('❌ Erreur listing documents:', error);
      return [];
    }
  }
}

export const documentUploadService = new DocumentUploadService();
