
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), 'scripts', 'backups');

    // Создаем директорию, если её нет
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return NextResponse.json({ success: true, backups: [] });
    }

    // Читаем список файлов
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        // Пытаемся прочитать метаданные из файла
        let metadata: any = {};
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          metadata = {
            timestamp: data.timestamp,
            reason: data.reason,
            totalRecords: Object.keys(data)
              .filter(key => Array.isArray(data[key]))
              .reduce((sum, key) => sum + data[key].length, 0),
          };
        } catch (e) {
          // Если не удалось прочитать метаданные
        }

        return {
          filename: file,
          size: stats.size,
          created: stats.mtime,
          ...metadata,
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json({ success: true, backups });
  } catch (error: any) {
    console.error('❌ Ошибка при получении списка бэкапов:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
