
import { prisma } from './db';
import { uploadBackup, downloadBackup, deleteBackup, listBackups, getBackupDownloadUrl } from './s3';

/**
 * Сохранить бэкап в S3
 */
export async function saveBackupToS3(data: any, type: 'data-only' | 'full'): Promise<{
  filename: string;
  s3Key: string;
  size: number;
}> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${type}_${timestamp}.json`;

  const jsonData = JSON.stringify(data, null, 2);
  const buffer = Buffer.from(jsonData, 'utf-8');

  console.log(`[Backup] Uploading to S3: ${filename}, size: ${buffer.length} bytes`);

  const result = await uploadBackup(buffer, filename);

  console.log(`[Backup] Uploaded to S3: ${result.key}`);

  return {
    filename,
    s3Key: result.key,
    size: result.size
  };
}

/**
 * Прочитать бэкап из S3
 */
export async function readBackupFromS3(s3Key: string): Promise<any> {
  console.log(`[Backup] Downloading from S3: ${s3Key}`);
  
  const buffer = await downloadBackup(s3Key);
  const data = buffer.toString('utf-8');
  
  return JSON.parse(data);
}

/**
 * Удалить бэкап из S3
 */
export async function deleteBackupFromS3(s3Key: string): Promise<void> {
  console.log(`[Backup] Deleting from S3: ${s3Key}`);
  await deleteBackup(s3Key);
}

/**
 * Получить URL для скачивания бэкапа
 */
export async function getBackupDownloadUrlFromS3(s3Key: string): Promise<string> {
  return await getBackupDownloadUrl(s3Key);
}

/**
 * Синхронизировать бэкапы из S3 с базой данных
 * - Удаляет записи из БД, если файлов нет в S3
 * - Добавляет записи в БД для файлов из S3, которых нет в БД
 */
export async function syncBackupsFromS3(): Promise<{
  added: number;
  existing: number;
  deleted: number;
  errors: number;
}> {
  let added = 0;
  let existing = 0;
  let deleted = 0;
  let errors = 0;

  try {
    console.log('[Sync] Fetching backups from S3...');
    const s3Backups = await listBackups();
    console.log(`[Sync] Found ${s3Backups.length} backup files in S3`);

    // Получаем все записи из БД
    const dbBackups = await prisma.backup.findMany({
      select: {
        id: true,
        filename: true,
        filePath: true
      }
    });
    console.log(`[Sync] Found ${dbBackups.length} backups in DB`);

    const s3Keys = new Set(s3Backups.map(b => b.key));
    
    // Удаляем записи из БД, для которых нет файлов в S3
    const toDelete = dbBackups.filter(b => !s3Keys.has(b.filePath));
    
    if (toDelete.length > 0) {
      console.log(`[Sync] Deleting ${toDelete.length} orphaned records from DB`);
      await prisma.backup.deleteMany({
        where: {
          id: { in: toDelete.map(b => b.id) }
        }
      });
      deleted = toDelete.length;
    }

    // Добавляем записи в БД для файлов из S3
    for (const s3Backup of s3Backups) {
      try {
        const filename = s3Backup.key.split('/').pop() || s3Backup.key;

        // Проверяем, есть ли уже запись в БД
        const existingBackup = await prisma.backup.findFirst({
          where: { filePath: s3Backup.key }
        });

        if (existingBackup) {
          existing++;
          console.log(`[Sync] Backup already in DB: ${filename}`);
          continue;
        }

        // Определяем тип бэкапа по имени файла
        const type = filename.includes('_full_') ? 'full' : 'data-only';

        // Добавляем запись в БД
        await prisma.backup.create({
          data: {
            filename,
            filePath: s3Backup.key,
            type,
            size: s3Backup.size,
            schemaHash: null,
            createdAt: s3Backup.lastModified
          }
        });

        added++;
        console.log(`[Sync] Added to DB: ${filename} (type: ${type})`);
      } catch (error) {
        errors++;
        console.error(`[Sync] Error processing ${s3Backup.key}:`, error);
      }
    }

    console.log(`[Sync] Summary: added=${added}, existing=${existing}, deleted=${deleted}, errors=${errors}`);
  } catch (error) {
    console.error('[Sync] Error fetching backups from S3:', error);
    throw error;
  }

  return { added, existing, deleted, errors };
}
