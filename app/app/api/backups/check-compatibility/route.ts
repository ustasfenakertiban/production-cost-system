
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-helpers';
import { checkSchemaCompatibility } from '@/lib/schema-utils';

export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { backupId } = await request.json();

    if (!backupId) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    // Получаем информацию о бэкапе
    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
      select: {
        id: true,
        type: true,
        schemaHash: true,
        filename: true,
        createdAt: true
      }
    });

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      );
    }

    // Проверяем совместимость схемы
    const compatibility = await checkSchemaCompatibility(backup.schemaHash);

    return NextResponse.json({
      success: true,
      backup: {
        id: backup.id,
        type: backup.type,
        filename: backup.filename,
        createdAt: backup.createdAt
      },
      compatibility: {
        compatible: compatibility.compatible,
        warning: compatibility.warning,
        currentSchemaHash: compatibility.currentHash.substring(0, 8),
        backupSchemaHash: compatibility.backupHash.substring(0, 8)
      }
    });
  } catch (error: any) {
    console.error('Error checking backup compatibility:', error);
    return NextResponse.json(
      { error: 'Failed to check compatibility', details: error.message },
      { status: 500 }
    );
  }
}
