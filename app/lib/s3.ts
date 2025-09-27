
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
