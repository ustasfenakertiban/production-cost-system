
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBackupPath, deleteBackup } from '@/lib/backup-service';
import { prisma } from '@/lib/db';
import * as fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = params.filename;
    
    // Пробуем сначала найти в БД (если это ID)
    try {
      const backup = await prisma.backup.findUnique({
        where: { id: identifier }
      });
      
      if (backup) {
        const jsonData = JSON.stringify(backup.data, null, 2);
        const filename = backup.filename || `backup_${identifier}.json`;
        
        return new NextResponse(jsonData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }
    } catch (dbError) {
      console.log('Not found in database, trying file system...');
    }
    
    // Если не найдено в БД, пробуем файловую систему
    try {
      const filepath = getBackupPath(identifier);
      if (fs.existsSync(filepath)) {
        const fileBuffer = fs.readFileSync(filepath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${identifier}"`,
          },
        });
      }
    } catch (fsError) {
      console.log('Not found in file system');
    }

    return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = params.filename;
    
    // Пробуем удалить из БД (если это ID)
    try {
      await prisma.backup.delete({
        where: { id: identifier }
      });
      return NextResponse.json({ success: true, message: 'Бэкап удален' });
    } catch (dbError) {
      console.log('Not found in database, trying file system...');
    }
    
    // Если не найдено в БД, пробуем файловую систему
    const success = deleteBackup(identifier);
    if (!success) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Бэкап удален' });
  } catch (error: any) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
