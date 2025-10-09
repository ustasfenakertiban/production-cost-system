
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { restoreFromBackup } from '@/lib/backup-service';

export async function POST(req: NextRequest) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    await restoreFromBackup(filename);

    return NextResponse.json({ 
      success: true, 
      message: 'Данные успешно восстановлены из бэкапа' 
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
