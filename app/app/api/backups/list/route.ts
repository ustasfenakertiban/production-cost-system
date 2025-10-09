
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Проверяем окружение - используем наличие DATABASE_URL как индикатор production
    const hasDatabase = !!process.env.DATABASE_URL;
    const isLocalhost = process.env.DATABASE_URL?.includes('localhost');
    const isProduction = hasDatabase && !isLocalhost;
    
    console.log('[Backup List] Environment check:', {
      hasDatabase,
      isLocalhost,
      isProduction,
      nodeEnv: process.env.NODE_ENV
    });
    
    if (isProduction || hasDatabase) {
      // Читаем бэкапы из БД
      try {
        const dbBackups = await prisma.backup.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            filename: true,
            size: true,
            createdAt: true
          }
        });
        
        console.log('[Backup List] Found backups in DB:', dbBackups.length);
        
        const backups = dbBackups.map(b => ({
          id: b.id,
          name: b.filename || `backup_${b.type}_${b.createdAt.toISOString().replace(/[:.]/g, '-').split('.')[0]}.json`,
          type: b.type,
          size: b.size || 0,
          created: b.createdAt.toISOString(),
          source: 'database' as const
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
