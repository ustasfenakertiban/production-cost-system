
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-helpers';
import { listBackups, downloadBackup } from '@/lib/s3';

/**
 * Синхронизировать БД с S3:
 * - Удалить записи из БД, если файлов нет в S3
 * - Добавить записи в БД для файлов из S3, которых нет в БД
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Sync] Starting DB-S3 synchronization...');
    
    // Получаем все записи из БД
    const dbBackups = await prisma.backup.findMany({
      select: {
        id: true,
        filename: true,
        filePath: true,
        type: true,
        size: true,
        createdAt: true
      }
    });
    
    console.log(`[Sync] Found ${dbBackups.length} backups in DB`);
    
    // Получаем все файлы из S3
    const s3Backups = await listBackups();
    console.log(`[Sync] Found ${s3Backups.length} backups in S3`);
    
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
    }
    
    // Добавляем записи в БД для файлов из S3, которых нет в БД
    const dbFilePaths = new Set(dbBackups.map(b => b.filePath));
    const toAdd = s3Backups.filter(b => !dbFilePaths.has(b.key));
    
    if (toAdd.length > 0) {
      console.log(`[Sync] Adding ${toAdd.length} missing records to DB`);
      
      for (const s3Backup of toAdd) {
        const filename = s3Backup.key.split('/').pop() || s3Backup.key;
        const type = filename.includes('_full_') ? 'full' : 'data-only';
        
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
      }
    }
    
    console.log('[Sync] Synchronization complete');
    
    return NextResponse.json({
      success: true,
      deleted: toDelete.length,
      added: toAdd.length,
      total: dbBackups.length - toDelete.length + toAdd.length
    });
  } catch (error: any) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка при синхронизации', details: error.message },
      { status: 500 }
    );
  }
}
