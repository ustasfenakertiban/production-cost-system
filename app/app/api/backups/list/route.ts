
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Проверяем окружение
    const isProduction = process.env.NODE_ENV === 'production' || 
                        !process.env.DATABASE_URL?.includes('localhost');
    
    if (isProduction) {
      // В production читаем бэкапы из БД
      try {
        // Проверяем, существует ли таблица backups
        const tableExists = await prisma.$queryRawUnsafe<any[]>(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'backups'
          )
        `);
        
        if (!tableExists[0]?.exists) {
          return NextResponse.json({ backups: [], isProduction: true });
        }
        
        const dbBackups = await prisma.$queryRawUnsafe<any[]>(`
          SELECT id, type, created_at, 
                 pg_column_size(data) as size
          FROM backups 
          ORDER BY created_at DESC
        `);
        
        const backups = dbBackups.map(b => ({
          id: b.id.toString(),
          name: `backup_${b.type}_${new Date(b.created_at).toISOString().replace(/[:.]/g, '-').split('.')[0]}.json`,
          type: b.type,
          size: b.size || 0,
          created: new Date(b.created_at).toISOString(),
          source: 'database'
        }));
        
        return NextResponse.json({ backups, isProduction: true });
      } catch (dbError: any) {
        console.error('Database backup list error:', dbError);
        return NextResponse.json({ backups: [], isProduction: true, error: dbError.message });
      }
    } else {
      // В dev окружении читаем файловые бэкапы
      try {
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.join(process.cwd(), '..', 'backups');
        
        if (!fs.existsSync(backupDir)) {
          return NextResponse.json({ backups: [], isProduction: false });
        }
        
        const files = fs.readdirSync(backupDir)
          .filter((f: string) => f.endsWith('.sql'))
          .map((f: string) => {
            const filePath = path.join(backupDir, f);
            const stats = fs.statSync(filePath);
            
            let type = 'unknown';
            if (f.startsWith('backup_full_')) {
              type = 'full';
            } else if (f.startsWith('backup_data_')) {
              type = 'data-only';
            } else if (f.startsWith('backup_')) {
              type = 'full (legacy)';
            }
            
            return {
              name: f,
              type,
              size: stats.size,
              created: stats.mtime.toISOString(),
              source: 'file'
            };
          })
          .sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime());
        
        return NextResponse.json({ backups: files, isProduction: false });
      } catch (fileError: any) {
        console.error('File backup list error:', fileError);
        return NextResponse.json({ backups: [], isProduction: false, error: fileError.message });
      }
    }
  } catch (error: any) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка бэкапов', details: error.message },
      { status: 500 }
    );
  }
}
