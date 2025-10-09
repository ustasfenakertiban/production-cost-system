
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createBackup, listBackups } from '@/lib/backup-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backups = listBackups();
    return NextResponse.json({ backups });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filename = await createBackup('manual');
    return NextResponse.json({ 
      success: true, 
      filename,
      message: 'Бэкап успешно создан' 
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
