
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { backupFile } = await request.json();
    
    if (!backupFile) {
      return NextResponse.json(
        { error: 'Не указан файл бэкапа' },
        { status: 400 }
      );
    }
    
    // Проверяем, что файл имеет правильное расширение
    if (!backupFile.endsWith('.sql')) {
      return NextResponse.json(
        { error: 'Неверный формат файла бэкапа' },
        { status: 400 }
      );
    }
    
    const backupPath = path.join(process.cwd(), '..', 'backups', backupFile);
    const restoreScript = path.join(process.cwd(), '..', 'restore.sh');
    
    // Выполняем скрипт восстановления
    const { stdout, stderr } = await execAsync(`bash ${restoreScript} ${backupPath}`);
    
    if (stderr && !stderr.includes('CREATE') && !stderr.includes('ALTER') && !stderr.includes('DROP')) {
      console.error('Restore stderr:', stderr);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Данные успешно восстановлены из бэкапа',
      output: stdout
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Ошибка при восстановлении из бэкапа', details: error.message },
      { status: 500 }
    );
  }
}
