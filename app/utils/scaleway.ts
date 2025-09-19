import 'react-native-get-random-values';
import AWS from 'aws-sdk';

// Configuration Scaleway Object Storage
const scalewayConfig = {
  accessKeyId: 'SCW8Q6A1AZK3Z0KR607E',
  secretAccessKey: '991fd15c-f0ea-4a2c-b9b0-42e3e9ab62b1',
  endpoint: 'https://s3.fr-par.scw.cloud',
  region: 'fr-par',
  bucketName: 'eagle',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
};

// Instance S3 configurée pour Scaleway
export const s3 = new AWS.S3(scalewayConfig);

// Helper pour générer l'URL publique d'un objet
export const getPublicUrl = (objectKey: string): string => {
  return `https://eagle.s3.fr-par.scw.cloud/${objectKey}`;
};

// Helper pour générer la clé d'objet pour les vidéos
export const generateVideoKey = (userId: string, skillKey: string): string => {
  return `videos/${userId}/${skillKey}.mp4`;
};

// Configuration du bucket
export const BUCKET_NAME = scalewayConfig.bucketName;