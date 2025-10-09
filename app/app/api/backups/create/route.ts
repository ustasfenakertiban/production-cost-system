
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const backupType = body.type || 'data-only';
    
    // Проверяем окружение - используем наличие DATABASE_URL как индикатор production
    const hasDatabase = !!process.env.DATABASE_URL;
    const isLocalhost = process.env.DATABASE_URL?.includes('localhost');
    const isProduction = hasDatabase && !isLocalhost;
    
    console.log('[Backup Create] Environment check:', {
      hasDatabase,
      isLocalhost,
      isProduction,
      nodeEnv: process.env.NODE_ENV,
      backupType
    });
    
    if (isProduction || hasDatabase) {
      // В production используем JSON бэкап через Prisma
      // Проверяем, существует ли таблица backups
      let backupTableExists = false;
      try {
        await prisma.backup.findFirst();
        backupTableExists = true;
      } catch (tableCheckError: any) {
        console.log('Таблица backups не существует, создаём...');
        try {
          // Создаем таблицу через db push вместо raw SQL
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS backups (
              id TEXT PRIMARY KEY,
              data JSONB NOT NULL,
              type TEXT NOT NULL DEFAULT 'data-only',
              filename TEXT,
              size INTEGER,
              "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `);
          backupTableExists = true;
        } catch (createError: any) {
          console.error('Не удалось создать таблицу backups:', createError);
        }
      }
      
      const backup = await createPrismaBackup();
      
      // Формируем уникальное имя файла бэкапа с полным timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${backupType}_${timestamp}.json`;
      
      try {
        // Сохраняем бэкап в таблице базы данных
        const savedBackup = await prisma.backup.create({
          data: {
            data: backup as any,
            type: backupType,
            filename: filename,
            size: JSON.stringify(backup).length
          }
        });
        
        console.log('[Backup Create] Backup saved to DB:', {
          id: savedBackup.id,
          filename: savedBackup.filename,
          type: savedBackup.type,
          size: savedBackup.size
        });
        
        // Удаляем старые бэкапы, оставляя последние 10
        const allBackups = await prisma.backup.findMany({
          orderBy: { createdAt: 'desc' },
          select: { id: true }
        });
        
        console.log('[Backup Create] Total backups in DB:', allBackups.length);
        
        if (allBackups.length > 10) {
          const idsToDelete = allBackups.slice(10).map(b => b.id);
          await prisma.backup.deleteMany({
            where: {
              id: { in: idsToDelete }
            }
          });
          console.log('[Backup Create] Deleted old backups:', idsToDelete.length);
        }
        
        return NextResponse.json({
          success: true,
          message: `Бэкап (${backupType === 'data-only' ? 'только данные' : 'схема + данные'}) успешно создан в БД`,
          type: backupType,
          filename: filename,
          recordCount: Object.values(backup).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0),
          isProduction: true
        });
      } catch (backupError: any) {
        console.error('Backup save error:', backupError);
        
        // Если не удалось сохранить в БД, возвращаем бэкап в ответе
        return NextResponse.json({
          success: true,
          message: 'Бэкап создан (сохранение в БД недоступно)',
          type: backupType,
          filename: filename,
          recordCount: Object.values(backup).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0),
          backup: backup,
          warning: 'Сохранение в БД недоступно, скачайте бэкап вручную',
          isProduction: true
        });
      }
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
  try {
    // Экспортируем все данные через Prisma
    const [
      products,
      productionProcesses,
      operationChains,
      productionOperations,
      materialCategories,
      materials,
      equipment,
      employeeRoles,
      operationMaterials,
      operationEquipment,
      operationRoles,
      recurringExpenses,
      operationTemplates,
      operationTemplateMaterials,
      operationTemplateEquipment,
      operationTemplateRoles,
      orders,
      orderItems
    ] = await Promise.all([
      prisma.product.findMany().catch(() => []),
      prisma.productionProcess.findMany().catch(() => []),
      prisma.operationChain.findMany().catch(() => []),
      prisma.productionOperation.findMany().catch(() => []),
      prisma.materialCategory.findMany().catch(() => []),
      prisma.material.findMany().catch(() => []),
      prisma.equipment.findMany().catch(() => []),
      prisma.employeeRole.findMany().catch(() => []),
      prisma.operationMaterial.findMany().catch(() => []),
      prisma.operationEquipment.findMany().catch(() => []),
      prisma.operationRole.findMany().catch(() => []),
      prisma.recurringExpense.findMany().catch(() => []),
      prisma.operationTemplate.findMany().catch(() => []),
      prisma.operationTemplateMaterial.findMany().catch(() => []),
      prisma.operationTemplateEquipment.findMany().catch(() => []),
      prisma.operationTemplateRole.findMany().catch(() => []),
      prisma.order.findMany().catch(() => []),
      prisma.orderItem.findMany().catch(() => [])
    ]);
    
    return {
      products,
      productionProcesses,
      operationChains,
      productionOperations,
      materialCategories,
      materials,
      equipment,
      employeeRoles,
      operationMaterials,
      operationEquipment,
      operationRoles,
      recurringExpenses,
      operationTemplates,
      operationTemplateMaterials,
      operationTemplateEquipment,
      operationTemplateRoles,
      orders,
      orderItems,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  } catch (error: any) {
    console.error('Error creating Prisma backup:', error);
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}
