
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const backupScript = path.join(process.cwd(), '..', 'backup.sh');
    
    // Выполняем скрипт бэкапа
    const { stdout, stderr } = await execAsync(`bash ${backupScript}`);
    
    if (stderr && !stderr.includes('CREATE') && !stderr.includes('ALTER')) {
      console.error('Backup stderr:', stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Бэкап успешно создан',
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
