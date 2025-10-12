
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { uploadBackup } from '@/lib/s3';

export async function POST(req: NextRequest) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Проверяем расширение файла
    if (!file.name.endsWith('.json') && !file.name.endsWith('.sql')) {
      return NextResponse.json({ 
        error: 'Неверный формат файла. Поддерживаются только .json и .sql файлы' 
      }, { status: 400 });
    }

    // Читаем содержимое файла
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Проверяем, что это валидный JSON (если файл .json)
    if (file.name.endsWith('.json')) {
      try {
        JSON.parse(buffer.toString('utf-8'));
      } catch (error) {
        return NextResponse.json({ 
          error: 'Неверный формат JSON файла' 
        }, { status: 400 });
      }
    }

    // Генерируем уникальное имя файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // убираем расширение
    const extension = file.name.split('.').pop();
    const filename = `${originalName}_uploaded_${timestamp}.${extension}`;

    // Загружаем файл в S3
    const { key, size } = await uploadBackup(buffer, filename);

    // Определяем тип бэкапа по имени файла
    const type = filename.includes('_full_') ? 'full' : 'data-only';
    
    console.log('[Upload] Uploaded to S3:', {
      filename,
      key,
      type,
      size
    });

    // Сохраняем метаданные в БД
    const backup = await prisma.backup.create({
      data: {
        filename,
        filePath: key, // Используем S3 key как filePath
        type,
        size,
        schemaHash: null
      }
    });

    console.log('[Upload] Backup record created:', {
      id: backup.id,
      filename: backup.filename,
      type: backup.type,
      size: backup.size
    });

    return NextResponse.json({
      success: true,
      message: 'Бэкап успешно загружен',
      backup: {
        id: backup.id,
        filename: backup.filename,
        type: backup.type,
        size: backup.size,
        created: backup.createdAt
      }
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return NextResponse.json({ 
      error: 'Ошибка загрузки файла', 
      details: error.message 
    }, { status: 500 });
  }
}
