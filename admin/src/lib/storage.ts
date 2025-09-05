import { createServiceClient } from '@/lib/supabase/server';

/**
 * Génère une URL signée fraîche pour un fichier dans le storage Supabase
 * @param filePath Le chemin du fichier dans le bucket
 * @param bucketName Le nom du bucket (par défaut: 'documents')
 * @param expiresIn Durée d'expiration en secondes (par défaut: 3600 = 1h)
 * @returns URL signée ou null en cas d'erreur
 */
export async function getSignedUrl(
  filePath: string, 
  bucketName: string = 'documents', 
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = await createServiceClient();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('Erreur génération URL signée:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Erreur getSignedUrl:', error);
    return null;
  }
}

/**
 * Extrait le chemin du fichier à partir d'une URL signée existante
 * @param signedUrl L'URL signée existante
 * @returns Le chemin du fichier ou null
 */
export function extractFilePathFromSignedUrl(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl);
    const pathParts = url.pathname.split('/');
    const objectIndex = pathParts.findIndex(part => part === 'object');
    
    if (objectIndex !== -1 && pathParts[objectIndex + 1] === 'sign') {
      const bucketIndex = objectIndex + 2;
      if (bucketIndex < pathParts.length) {
        // Récupère tout après le bucket name
        return pathParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur extraction chemin:', error);
    return null;
  }
}

/**
 * Régénère des URLs signées fraîches pour les documents d'identité
 * @param frontUrl URL du recto
 * @param backUrl URL du verso
 * @returns Objet avec les nouvelles URLs
 */
export async function refreshIdentityDocumentUrls(
  frontUrl: string | null, 
  backUrl: string | null
): Promise<{ frontUrl: string | null; backUrl: string | null }> {
  const results = { frontUrl: null as string | null, backUrl: null as string | null };
  
  if (frontUrl) {
    const frontPath = extractFilePathFromSignedUrl(frontUrl);
    if (frontPath) {
      results.frontUrl = await getSignedUrl(frontPath);
    }
  }
  
  if (backUrl) {
    const backPath = extractFilePathFromSignedUrl(backUrl);
    if (backPath) {
      results.backUrl = await getSignedUrl(backPath);
    }
  }
  
  return results;
}