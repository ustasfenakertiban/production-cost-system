
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { backupFile, backupId } = await request.json();
    
    // Проверяем окружение
    const isProduction = process.env.NODE_ENV === 'production' || 
                        !process.env.DATABASE_URL?.includes('localhost');
    
    if (isProduction) {
      // В production восстанавливаем из БД
      if (!backupId) {
        return NextResponse.json(
          { error: 'Не указан ID бэкапа' },
          { status: 400 }
        );
      }
      
      // Получаем бэкап из БД
      const backupData = await prisma.$queryRawUnsafe<any[]>(`
        SELECT data FROM backups WHERE id = $1
      `, parseInt(backupId));
      
      if (!backupData || backupData.length === 0) {
        return NextResponse.json(
          { error: 'Бэкап не найден' },
          { status: 404 }
        );
      }
      
      const backup = backupData[0].data;
      
      // Восстанавливаем данные
      const result = await restorePrismaBackup(backup);
      
      return NextResponse.json({
        success: true,
        message: 'Данные успешно восстановлены из бэкапа',
        ...result,
        isProduction: true
      });
    } else {
      // В dev окружении восстанавливаем из файла
      if (!backupFile) {
        return NextResponse.json(
          { error: 'Не указан файл бэкапа' },
          { status: 400 }
        );
      }
      
      if (!backupFile.endsWith('.sql')) {
        return NextResponse.json(
          { error: 'Неверный формат файла бэкапа' },
          { status: 400 }
        );
      }
      
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const path = require('path');
        const execAsync = promisify(exec);
        
        const backupPath = path.join(process.cwd(), '..', 'backups', backupFile);
        const restoreScript = path.join(process.cwd(), '..', 'restore.sh');
        
        const { stdout, stderr } = await execAsync(`bash ${restoreScript} ${backupPath}`);
        
        return NextResponse.json({
          success: true,
          message: 'Данные успешно восстановлены из бэкапа',
          output: stdout,
          isProduction: false
        });
      } catch (fileRestoreError: any) {
        return NextResponse.json(
          { error: 'Ошибка при восстановлении из файла', details: fileRestoreError.message },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Ошибка при восстановлении из бэкапа', details: error.message },
      { status: 500 }
    );
  }
}

async function restorePrismaBackup(backup: any) {
  const stats = {
    deleted: {} as Record<string, number>,
    created: {} as Record<string, number>
  };

  try {
    // Удаляем все данные в правильном порядке (учитываем связи)
    const deleteOrder = [
      { key: 'operationMaterials', model: 'operationMaterial' },
      { key: 'operationEquipment', model: 'operationEquipment' },
      { key: 'operationRoles', model: 'operationRole' },
      { key: 'productionOperations', model: 'productionOperation' },
      { key: 'operationChains', model: 'operationChain' },
      { key: 'productionProcesses', model: 'productionProcess' },
      { key: 'materials', model: 'material' },
      { key: 'equipment', model: 'equipment' },
      { key: 'employeeRoles', model: 'employeeRole' }
    ];

    for (const { key, model: modelName } of deleteOrder) {
      const model = (prisma as any)[modelName];
      
      if (model) {
        const result = await model.deleteMany();
        stats.deleted[key] = result.count || 0;
      }
    }

    // Восстанавливаем данные в правильном порядке
    const createOrder = [
      { key: 'productionProcesses', model: 'productionProcess' },
      { key: 'materials', model: 'material' },
      { key: 'equipment', model: 'equipment' },
      { key: 'employeeRoles', model: 'employeeRole' },
      { key: 'operationChains', model: 'operationChain' },
      { key: 'productionOperations', model: 'productionOperation' },
      { key: 'operationMaterials', model: 'operationMaterial' },
      { key: 'operationEquipment', model: 'operationEquipment' },
      { key: 'operationRoles', model: 'operationRole' }
    ];

    for (const { key, model: modelName } of createOrder) {
      const data = backup[key];
      if (!data || !Array.isArray(data) || data.length === 0) {
        stats.created[key] = 0;
        continue;
      }

      const model = (prisma as any)[modelName];
      
      if (model) {
        // Очищаем данные от полей, которые Prisma создает автоматически
        const cleanedData = data.map((record: any) => {
          const { createdAt, updatedAt, ...rest } = record;
          return rest;
        });

        // Создаем записи
        for (const record of cleanedData) {
          await model.create({ data: record });
        }
        
        stats.created[key] = cleanedData.length;
      }
    }

    return {
      stats,
      totalDeleted: Object.values(stats.deleted).reduce((sum, count) => sum + count, 0),
      totalCreated: Object.values(stats.created).reduce((sum, count) => sum + count, 0)
    };
  } catch (error: any) {
    console.error('Restore Prisma backup error:', error);
    throw error;
  }
}
