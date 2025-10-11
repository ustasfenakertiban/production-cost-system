
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-helpers';
import { getCurrentSchemaInfo } from '@/lib/schema-utils';
import { saveBackupToFile } from '@/lib/backup-utils';

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
    
    const body = await request.json().catch(() => ({}));
    const backupType: 'data-only' | 'full' = body.type || 'data-only';
    
    console.log('[Backup Create] Creating backup, type:', backupType);
    
    // Получаем информацию о текущей схеме
    const schemaInfo = await getCurrentSchemaInfo();
    
    // Создаем данные бэкапа
    const backupData = await createBackupData(backupType);
    
    // Сохраняем бэкап в файл
    const { filename, filePath, size } = await saveBackupToFile(backupData, backupType);
    
    // Сохраняем метаданные в БД
    const savedBackup = await prisma.backup.create({
      data: {
        filename,
        filePath,
        type: backupType,
        size,
        schemaHash: schemaInfo.hash
      }
    });
    
    console.log('[Backup Create] Backup created:', {
      id: savedBackup.id,
      filename: savedBackup.filename,
      type: savedBackup.type,
      size: savedBackup.size
    });
    
    // Проверяем, что бэкап действительно сохранился
    const verifyBackup = await prisma.backup.findUnique({
      where: { id: savedBackup.id }
    });
    
    if (!verifyBackup) {
      console.error('[Backup Create] WARNING: Backup not found after creation!');
      throw new Error('Backup was not saved to database');
    }
    
    console.log('[Backup Create] Backup verified in DB');
    
    // Удаляем старые бэкапы, оставляя последние 10
    const allBackups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, filePath: true }
    });
    
    if (allBackups.length > 10) {
      const { deleteBackupFile } = await import('@/lib/backup-utils');
      const backupsToDelete = allBackups.slice(10);
      
      for (const backup of backupsToDelete) {
        try {
          deleteBackupFile(backup.filePath);
        } catch (error) {
          console.error(`Failed to delete backup file: ${backup.filePath}`, error);
        }
      }
      
      await prisma.backup.deleteMany({
        where: {
          id: { in: backupsToDelete.map(b => b.id) }
        }
      });
      
      console.log('[Backup Create] Deleted old backups:', backupsToDelete.length);
    }
    
    return NextResponse.json({
      success: true,
      message: `Бэкап (${backupType === 'data-only' ? 'только данные' : 'данные + структура'}) успешно создан`,
      type: backupType,
      filename,
      size
    });
  } catch (error: any) {
    console.error('[Backup Create] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании бэкапа', details: error.message },
      { status: 500 }
    );
  }
}

async function createBackupData(backupType: 'data-only' | 'full') {
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
    
    const backupData: any = {
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
      version: '1.0',
      backupType
    };

    // Если это полный бэкап, добавляем схему базы данных
    if (backupType === 'full') {
      try {
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        
        if (fs.existsSync(schemaPath)) {
          const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
          backupData.schema = schemaContent;
          backupData.schemaIncluded = true;
        } else {
          backupData.schemaIncluded = false;
          backupData.schemaNote = 'Schema file not found';
        }
      } catch (schemaError: any) {
        console.error('Error reading schema file:', schemaError);
        backupData.schemaIncluded = false;
        backupData.schemaError = schemaError.message;
      }
    }
    
    return backupData;
  } catch (error: any) {
    console.error('Error creating backup data:', error);
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}
