
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const backupDir = path.join(process.cwd(), 'scripts', 'backups');
    const filePath = path.join(backupDir, filename);

    // Проверяем, что файл существует и находится в директории бэкапов
    if (!fs.existsSync(filePath) || !filePath.startsWith(backupDir)) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath);

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ Ошибка при скачивании бэкапа:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
