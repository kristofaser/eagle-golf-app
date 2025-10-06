import AWS from 'aws-sdk';

// Configuration Scaleway Object Storage (même config que l'app mobile)
const scalewayConfig = {
  accessKeyId: process.env.NEXT_PUBLIC_SCALEWAY_ACCESS_KEY || 'SCW8Q6A1AZK3Z0KR607E',
  secretAccessKey: process.env.NEXT_PUBLIC_SCALEWAY_SECRET_KEY || '991fd15c-f0ea-4a2c-b9b0-42e3e9ab62b1',
  endpoint: 'https://s3.fr-par.scw.cloud',
  region: 'fr-par',
  bucketName: 'eagle',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
};

// Instance S3 configurée pour Scaleway
export const s3 = new AWS.S3(scalewayConfig);

// Nom du bucket
export const BUCKET_NAME = scalewayConfig.bucketName;

/**
 * Upload une vidéo vers Scaleway Object Storage
 * @param file - Fichier vidéo à uploader
 * @param objectKey - Clé de l'objet (chemin dans le bucket)
 * @returns URL publique de la vidéo
 */
export async function uploadVideoToScaleway(
  file: File,
  objectKey: string
): Promise<string> {
  // Convertir File en Buffer pour AWS SDK
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: buffer,
    ContentType: file.type || 'video/mp4',
    ACL: 'public-read', // Rendre la vidéo publique
  };

  await s3.upload(params).promise();

  return getPublicUrl(objectKey);
}

/**
 * Génère l'URL publique d'une vidéo sur Scaleway
 * @param objectKey - Clé de l'objet
 * @returns URL publique
 */
export function getPublicUrl(objectKey: string): string {
  return `https://${BUCKET_NAME}.s3.fr-par.scw.cloud/${objectKey}`;
}

/**
 * Supprime une vidéo de Scaleway
 * @param objectKey - Clé de l'objet à supprimer
 */
export async function deleteVideoFromScaleway(objectKey: string): Promise<void> {
  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: objectKey,
  };

  await s3.deleteObject(params).promise();
}

/**
 * Vérifie si une vidéo existe sur Scaleway
 * @param objectKey - Clé de l'objet
 * @returns true si la vidéo existe
 */
export async function videoExists(objectKey: string): Promise<boolean> {
  try {
    await s3.headObject({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    }).promise();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Génère une clé Scaleway pour une vidéo In the Bag
 * @param proId - ID du pro
 * @returns Clé Scaleway
 */
export function generateInTheBagKey(proId: string): string {
  return `videos/pros/${proId}/in-the-bag.mp4`;
}

/**
 * Génère une clé Scaleway pour un tip
 * @param tipId - ID du tip
 * @returns Clé Scaleway
 */
export function generateTipKey(tipId: string): string {
  return `videos/tips/${tipId}.mp4`;
}

/**
 * Génère une clé Scaleway pour une vidéo de trou
 * @param proId - ID du pro
 * @param holeId - ID de la vidéo de trou
 * @returns Clé Scaleway
 */
export function generateProHoleKey(proId: string, holeId: string): string {
  return `videos/pros/${proId}/holes/hole-${holeId}.mp4`;
}
