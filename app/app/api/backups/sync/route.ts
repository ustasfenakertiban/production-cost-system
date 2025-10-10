
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { syncBackupsFromDisk } from '@/lib/backup-utils';

export async function POST(req: NextRequest) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncBackupsFromDisk();

    return NextResponse.json({
      success: true,
      message: `Синхронизация завершена. Добавлено: ${result.added}, Существует: ${result.existing}, Ошибок: ${result.errors}`,
      ...result
    });
  } catch (error: any) {
    console.error('[Sync] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
