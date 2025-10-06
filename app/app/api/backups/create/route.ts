
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const backupType = body.type || 'full'; // 'full' или 'data-only'
    
    const backupScript = path.join(process.cwd(), '..', 'backup-node.js');
    const nodeModules = path.join(process.cwd(), 'node_modules');
    
    // Выполняем скрипт бэкапа с передачей типа
    const { stdout, stderr } = await execAsync(
      `cd ${path.join(process.cwd(), '..')} && NODE_PATH=${nodeModules} node ${backupScript} ${backupType}`
    );
    
    if (stderr && !stderr.includes('CREATE') && !stderr.includes('ALTER')) {
      console.error('Backup stderr:', stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: `Бэкап (${backupType === 'data-only' ? 'только данные' : 'схема + данные'}) успешно создан`,
      type: backupType,
      output: stdout
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}
