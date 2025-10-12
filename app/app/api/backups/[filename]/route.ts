
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { deleteBackupFromS3 } from '@/lib/backup-utils';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = params.filename;
    
    // Пытаемся удалить из БД (если это ID)
    try {
      const backup = await prisma.backup.findUnique({
        where: { id: identifier }
      });
      
      if (backup) {
        // Удаляем файл из S3
        try {
          await deleteBackupFromS3(backup.filePath);
        } catch (fileError) {
          console.error('Error deleting backup from S3:', fileError);
        }
        
        // Удаляем запись из БД
        await prisma.backup.delete({
          where: { id: identifier }
        });
        
        return NextResponse.json({ success: true, message: 'Бэкап удален' });
      }
    } catch (dbError) {
      console.log('Not found in database');
    }
    
    return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
