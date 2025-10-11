
import fs from 'fs';
import path from 'path';
import { prisma } from './db';
import { detectBackupTypeFromContent } from './schema-utils';

// Всегда используем постоянную папку, не зависимо от окружения
const BACKUP_DIR = process.env.BACKUP_DIR || '/home/ubuntu/production_cost_system/backups';

// Убеждаемся, что папка для бэкапов существует
export function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
}

// Сохранить бэкап в файл
export async function saveBackupToFile(data: any, type: 'data-only' | 'full'): Promise<{
  filename: string;
  filePath: string;
  size: number;
}> {
  const backupDir = ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${type}_${timestamp}.json`;
  const filePath = path.join(backupDir, filename);

  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonData, 'utf-8');

  const stats = fs.statSync(filePath);

  console.log(`[Backup] Saved to file: ${filePath}, size: ${stats.size} bytes`);

  return {
    filename,
    filePath,
    size: stats.size
  };
}

// Прочитать бэкап из файла
export function readBackupFromFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Удалить файл бэкапа
export function deleteBackupFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[Backup] Deleted file: ${filePath}`);
  }
}

// Синхронизировать файлы из папки backups с базой данных
export async function syncBackupsFromDisk(): Promise<{
  added: number;
  existing: number;
  errors: number;
}> {
  const backupDir = ensureBackupDir();
  const files = fs.readdirSync(backupDir);
  
  const backupFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.sql'));
  
  let added = 0;
  let existing = 0;
  let errors = 0;

  console.log(`[Sync] Found ${backupFiles.length} backup files in ${backupDir}`);

  for (const filename of backupFiles) {
    try {
      const filePath = path.join(backupDir, filename);
      const stats = fs.statSync(filePath);

      // Проверяем, есть ли уже запись в БД
      const existingBackup = await prisma.backup.findFirst({
        where: { filename }
      });

      if (existingBackup) {
        existing++;
        console.log(`[Sync] Backup already in DB: ${filename}`);
        continue;
      }

      // Определяем тип бэкапа по содержимому файла
      const typeInfo = detectBackupTypeFromContent(filePath);
      
      console.log(`[Sync] Detected type for ${filename}:`, {
        type: typeInfo.type,
        confidence: typeInfo.confidence,
        indicators: typeInfo.indicators
      });

      // Добавляем запись в БД
      await prisma.backup.create({
        data: {
          filename,
          filePath,
          type: typeInfo.type,
          size: stats.size,
          schemaHash: null, // Для старых бэкапов не знаем хэш схемы
          createdAt: stats.birthtime || stats.mtime
        }
      });

      added++;
      console.log(`[Sync] Added to DB: ${filename} (type: ${typeInfo.type}, confidence: ${typeInfo.confidence})`);
    } catch (error) {
      errors++;
      console.error(`[Sync] Error processing ${filename}:`, error);
    }
  }

  console.log(`[Sync] Summary: added=${added}, existing=${existing}, errors=${errors}`);

  return { added, existing, errors };
}

// Получить путь к папке бэкапов
export function getBackupDir(): string {
  return BACKUP_DIR;
}
