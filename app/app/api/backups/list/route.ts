
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] });
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        
        // Определяем тип бэкапа
        let type = 'unknown';
        if (f.startsWith('backup_full_')) {
          type = 'full';
        } else if (f.startsWith('backup_data_')) {
          type = 'data-only';
        } else if (f.startsWith('backup_')) {
          // Старые бэкапы без префикса типа
          type = 'full (legacy)';
        }
        
        return {
          name: f,
          type,
          size: stats.size,
          created: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    return NextResponse.json({ backups: files });
  } catch (error: any) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка бэкапов', details: error.message },
      { status: 500 }
    );
  }
}
