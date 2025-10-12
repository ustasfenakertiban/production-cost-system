
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const key = `${folderPrefix}uploads/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg', // Default for images, can be made dynamic
  });
  
  await s3Client.send(command);
  return key;
}

export async function getFileUrl(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  await s3Client.send(command);
}

// ============= Функции для работы с бэкапами =============

/**
 * Загрузить бэкап в S3
 */
export async function uploadBackup(buffer: Buffer, fileName: string): Promise<{
  key: string;
  size: number;
}> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const key = `${folderPrefix}backups/${fileName}`;
  
  console.log('[S3] Uploading backup:', { bucketName, key, size: buffer.length });
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'application/json',
    Metadata: {
      'upload-time': new Date().toISOString()
    }
  });
  
  await s3Client.send(command);
  
  console.log('[S3] Backup uploaded successfully:', key);
  
  return {
    key,
    size: buffer.length
  };
}

/**
 * Скачать бэкап из S3
 */
export async function downloadBackup(key: string): Promise<Buffer> {
  const { bucketName } = getBucketConfig();
  
  console.log('[S3] Downloading backup:', { bucketName, key });
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('Empty response body from S3');
  }
  
  // Конвертируем stream в buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  const buffer = Buffer.concat(chunks);
  console.log('[S3] Backup downloaded successfully:', { key, size: buffer.length });
  
  return buffer;
}

/**
 * Получить signed URL для скачивания бэкапа
 */
export async function getBackupDownloadUrl(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 час
}

/**
 * Удалить бэкап из S3
 */
export async function deleteBackup(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  
  console.log('[S3] Deleting backup:', { bucketName, key });
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  await s3Client.send(command);
  
  console.log('[S3] Backup deleted successfully:', key);
}

/**
 * Получить список всех бэкапов в S3
 */
export async function listBackups(): Promise<Array<{
  key: string;
  size: number;
  lastModified: Date;
}>> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const prefix = `${folderPrefix}backups/`;
  
  console.log('[S3] Listing backups:', { bucketName, prefix });
  
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  
  const response = await s3Client.send(command);
  
  const backups = (response.Contents || []).map(item => ({
    key: item.Key!,
    size: item.Size || 0,
    lastModified: item.LastModified || new Date()
  }));
  
  console.log('[S3] Found backups:', backups.length);
  
  return backups;
}
