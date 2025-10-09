
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Читаем тип бэкапа из body запроса
    const body = await request.json().catch(() => ({}));
    const backupType = body.type || 'data-only'; // По умолчанию data-only
    
    const backupScript = path.join(process.cwd(), '..', 'backup-node.js');
    
    // Выполняем скрипт бэкапа с указанием типа
    const { stdout, stderr } = await execAsync(`NODE_PATH=${path.join(process.cwd(), 'node_modules')} node ${backupScript} ${backupType}`);
    
    if (stderr && !stderr.includes('CREATE') && !stderr.includes('ALTER') && !stderr.includes('INSERT')) {
      console.error('Backup stderr:', stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: `Бэкап успешно создан (${backupType === 'data-only' ? 'только данные' : 'схема + данные'})`,
      output: stdout,
      type: backupType
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}
