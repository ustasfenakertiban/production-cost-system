
import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const backupsDir = path.join(process.cwd(), '..', 'backups');
    
    // Читаем список файлов
    const files = await readdir(backupsDir);
    
    // Фильтруем только SQL файлы и получаем информацию
    const backupFiles = await Promise.all(
      files
        .filter(file => file.endsWith('.sql'))
        .map(async (file) => {
          const filePath = path.join(backupsDir, file);
          const stats = await stat(filePath);
          
          return {
            name: file,
            size: stats.size,
            created: stats.mtime,
            path: filePath
          };
        })
    );
    
    // Сортируем по дате создания (новые первыми)
    backupFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
    
    return NextResponse.json({
      success: true,
      backups: backupFiles
    });
  } catch (error: any) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка бэкапов', details: error.message },
      { status: 500 }
    );
  }
}
