
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-helpers';
import { downloadBackup } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Backup Download] Request received');
    
    // Проверка аутентификации
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      console.log('[Backup Download] Unauthorized:', auth.error);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Backup Download] Authenticated user:', auth.user?.email);
    
    const searchParams = request.nextUrl.searchParams;
    const backupId = searchParams.get('id');
    
    console.log('[Backup Download] Backup ID:', backupId);
    
    if (!backupId) {
      console.log('[Backup Download] No backup ID provided');
      return NextResponse.json(
        { error: 'ID бэкапа не указан' },
        { status: 400 }
      );
    }
    
    // Получаем метаданные бэкапа из базы данных
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });
    
    console.log('[Backup Download] Backup found:', backup ? {
      id: backup.id,
      filename: backup.filename,
      filePath: backup.filePath,
      size: backup.size,
      type: backup.type
    } : null);
    
    if (!backup) {
      console.log('[Backup Download] Backup not found');
      return NextResponse.json(
        { error: 'Бэкап не найден' },
        { status: 404 }
      );
    }
    
    // Скачиваем файл из S3
    const fileContent = await downloadBackup(backup.filePath);
    
    console.log('[Backup Download] Sending backup, size:', fileContent.length);
    
    // Возвращаем файл для скачивания
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${backup.filename}"`,
        'Content-Length': fileContent.length.toString()
      }
    });
  } catch (error: any) {
    console.error('[Backup Download] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка при скачивании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}
