
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const backupType = body.type || 'data-only';
    
    // Проверяем окружение
    const isProduction = process.env.NODE_ENV === 'production' || 
                        !process.env.DATABASE_URL?.includes('localhost');
    
    if (isProduction) {
      // В production используем JSON бэкап через Prisma
      const backup = await createPrismaBackup();
      
      // Формируем имя файла бэкапа
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
      const filename = `backup_${timestamp[0]}_${timestamp[1].split('-')[0]}.json`;
      
      // Сохраняем бэкап в таблице базы данных
      const savedBackup = await prisma.backup.create({
        data: {
          data: backup as any,
          type: backupType,
          filename: filename,
          size: JSON.stringify(backup).length
        }
      });
      
      // Удаляем старые бэкапы, оставляя последние 10
      const allBackups = await prisma.backup.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });
      
      if (allBackups.length > 10) {
        const idsToDelete = allBackups.slice(10).map(b => b.id);
        await prisma.backup.deleteMany({
          where: {
            id: { in: idsToDelete }
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: `Бэкап (${backupType === 'data-only' ? 'только данные' : 'схема + данные'}) успешно создан в БД`,
        type: backupType,
        filename: filename,
        recordCount: Object.values(backup).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0),
        isProduction: true
      });
    } else {
      // В dev окружении используем файловый бэкап (если доступен)
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const path = require('path');
      const execAsync = promisify(exec);
      
      try {
        const backupScript = path.join(process.cwd(), '..', 'backup-node.js');
        const nodeModules = path.join(process.cwd(), 'node_modules');
        
        const { stdout, stderr } = await execAsync(
          `cd ${path.join(process.cwd(), '..')} && NODE_PATH=${nodeModules} node ${backupScript} ${backupType}`
        );
        
        return NextResponse.json({
          success: true,
          message: `Бэкап (${backupType === 'data-only' ? 'только данные' : 'схема + данные'}) успешно создан`,
          type: backupType,
          output: stdout,
          isProduction: false
        });
      } catch (fileBackupError: any) {
        // Если файловый бэкап не работает, fallback на JSON
        console.warn('File backup failed, using JSON backup:', fileBackupError.message);
        const backup = await createPrismaBackup();
        
        return NextResponse.json({
          success: true,
          message: 'Бэкап создан через Prisma (файловый метод недоступен)',
          type: 'json-fallback',
          recordCount: Object.values(backup).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0),
          backup: backup,
          isProduction: false
        });
      }
    }
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}

async function createPrismaBackup() {
  // Экспортируем все данные через Prisma
  const [
    productionProcesses,
    operationChains,
    productionOperations,
    materials,
    equipment,
    employeeRoles,
    operationMaterials,
    operationEquipment,
    operationRoles
  ] = await Promise.all([
    prisma.productionProcess.findMany(),
    prisma.operationChain.findMany(),
    prisma.productionOperation.findMany(),
    prisma.material.findMany(),
    prisma.equipment.findMany(),
    prisma.employeeRole.findMany(),
    prisma.operationMaterial.findMany(),
    prisma.operationEquipment.findMany(),
    prisma.operationRole.findMany()
  ]);
  
  return {
    productionProcesses,
    operationChains,
    productionOperations,
    materials,
    equipment,
    employeeRoles,
    operationMaterials,
    operationEquipment,
    operationRoles,
    exportedAt: new Date().toISOString()
  };
}
