
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Backup Download] Request received');
    console.log('[Backup Download] Headers:', Object.fromEntries(request.headers.entries()));
    console.log('[Backup Download] Cookies:', request.cookies.getAll());
    
    // Проверка аутентификации - пробуем два способа
    let isAuthenticated = false;
    
    // Способ 1: через NextAuth session
    const session = await getServerSession(authOptions);
    console.log('[Backup Download] Session:', session ? { user: session.user?.email } : null);
    
    if (session) {
      isAuthenticated = true;
    } else {
      // Способ 2: проверяем JWT токен напрямую из cookie
      const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                          request.cookies.get('__Secure-next-auth.session-token')?.value;
      
      console.log('[Backup Download] Session token from cookie:', sessionToken ? 'exists' : 'missing');
      
      if (sessionToken) {
        try {
          const secret = new TextEncoder().encode(
            process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development'
          );
          await jwtVerify(sessionToken, secret);
          isAuthenticated = true;
          console.log('[Backup Download] Token verified successfully');
        } catch (error) {
          console.error('[Backup Download] Token verification failed:', error);
        }
      }
    }
    
    if (!isAuthenticated) {
      console.log('[Backup Download] Unauthorized - no valid session or token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
    
    // Получаем бэкап из базы данных
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });
    
    console.log('[Backup Download] Backup found:', backup ? {
      id: backup.id,
      filename: backup.filename,
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
    
    // Формируем JSON для скачивания
    const backupData = JSON.stringify(backup.data, null, 2);
    
    console.log('[Backup Download] Sending backup, size:', backupData.length);
    
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
    console.error('[Backup Download] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка при скачивании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}
