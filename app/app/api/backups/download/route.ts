
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const backupId = searchParams.get('id');
    
    if (!backupId) {
      return NextResponse.json(
        { error: 'ID бэкапа не указан' },
        { status: 400 }
      );
    }
    
    // Получаем бэкап из базы данных
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });
    
    if (!backup) {
      return NextResponse.json(
        { error: 'Бэкап не найден' },
        { status: 404 }
      );
    }
    
    // Формируем JSON для скачивания
    const backupData = JSON.stringify(backup.data, null, 2);
    
    // Возвращаем файл для скачивания
    return new NextResponse(backupData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${backup.filename || `backup_${backup.createdAt.toISOString()}.json`}"`,
        'Content-Length': backupData.length.toString()
      }
    });
  } catch (error: any) {
    console.error('Download backup error:', error);
    return NextResponse.json(
      { error: 'Ошибка при скачивании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}
