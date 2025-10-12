
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { checkSchemaCompatibility, getCurrentSchemaInfo } from '@/lib/schema-utils';
import { readBackupFromS3, saveBackupToS3 } from '@/lib/backup-utils';

export async function POST(req: NextRequest) {
  try {
    // Проверка аутентификации
    const auth = await verifyAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { backupId, ignoreWarnings } = await req.json();

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
    }

    // Получаем бэкап из БД
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Проверяем совместимость схемы
    const compatibility = await checkSchemaCompatibility(backup.schemaHash);

    // Если схема несовместима и пользователь не подтвердил, возвращаем предупреждение
    if (!compatibility.compatible && !ignoreWarnings) {
      return NextResponse.json({
        error: 'schema_incompatible',
        warning: compatibility.warning,
        requiresConfirmation: true
      }, { status: 400 });
    }

    // Создаем бэкап текущего состояния перед восстановлением
    try {
      const currentSchemaInfo = await getCurrentSchemaInfo();
      const currentData = await createBackupData('data-only');
      
      const { filename, s3Key, size } = await saveBackupToS3(currentData, 'data-only');
      
      // Сохраняем в БД
      await prisma.backup.create({
        data: {
          filename,
          filePath: s3Key,
          type: 'data-only',
          size,
          schemaHash: currentSchemaInfo.hash
        }
      });
      
      console.log('[Restore] Auto-backup created before restore');
    } catch (autoBackupError) {
      console.error('[Restore] Failed to create auto-backup:', autoBackupError);
      // Продолжаем восстановление даже если не удалось создать авто-бэкап
    }

    // Читаем данные бэкапа из S3
    const backupData = await readBackupFromS3(backup.filePath);

    // Восстанавливаем данные
    await restoreBackupData(backupData);

    return NextResponse.json({ 
      success: true, 
      message: 'Данные успешно восстановлены из бэкапа',
      type: backup.type
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Функция для создания данных бэкапа
async function createBackupData(backupType: 'data-only' | 'full') {
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
    version: '1.0',
    backupType
  };
}

// Функция для восстановления данных из бэкапа
async function restoreBackupData(backupData: any) {
  // Удаляем текущие данные (кроме пользователей и бэкапов)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.operationTemplateRole.deleteMany({});
  await prisma.operationTemplateEquipment.deleteMany({});
  await prisma.operationTemplateMaterial.deleteMany({});
  await prisma.operationTemplate.deleteMany({});
  await prisma.operationRole.deleteMany({});
  await prisma.operationEquipment.deleteMany({});
  await prisma.operationMaterial.deleteMany({});
  await prisma.productionOperation.deleteMany({});
  await prisma.operationChain.deleteMany({});
  await prisma.productionProcess.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.recurringExpense.deleteMany({});
  await prisma.employeeRole.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.materialCategory.deleteMany({});
  await prisma.equipment.deleteMany({});

  // Восстанавливаем данные
  if (backupData.materialCategories) {
    for (const item of backupData.materialCategories) {
      await prisma.materialCategory.create({ data: item });
    }
  }

  if (backupData.materials) {
    for (const item of backupData.materials) {
      await prisma.material.create({ data: item });
    }
  }

  if (backupData.equipment) {
    for (const item of backupData.equipment) {
      await prisma.equipment.create({ data: item });
    }
  }

  if (backupData.employeeRoles) {
    for (const item of backupData.employeeRoles) {
      await prisma.employeeRole.create({ data: item });
    }
  }

  if (backupData.recurringExpenses) {
    for (const item of backupData.recurringExpenses) {
      await prisma.recurringExpense.create({ data: item });
    }
  }

  if (backupData.products) {
    for (const item of backupData.products) {
      await prisma.product.create({ data: item });
    }
  }

  if (backupData.productionProcesses) {
    for (const item of backupData.productionProcesses) {
      await prisma.productionProcess.create({ data: item });
    }
  }

  if (backupData.operationChains) {
    for (const item of backupData.operationChains) {
      await prisma.operationChain.create({ data: item });
    }
  }

  if (backupData.productionOperations) {
    for (const item of backupData.productionOperations) {
      await prisma.productionOperation.create({ data: item });
    }
  }

  if (backupData.operationMaterials) {
    for (const item of backupData.operationMaterials) {
      await prisma.operationMaterial.create({ data: item });
    }
  }

  if (backupData.operationEquipment) {
    for (const item of backupData.operationEquipment) {
      await prisma.operationEquipment.create({ data: item });
    }
  }

  if (backupData.operationRoles) {
    for (const item of backupData.operationRoles) {
      await prisma.operationRole.create({ data: item });
    }
  }

  if (backupData.operationTemplates) {
    for (const item of backupData.operationTemplates) {
      await prisma.operationTemplate.create({ data: item });
    }
  }

  if (backupData.operationTemplateMaterials) {
    for (const item of backupData.operationTemplateMaterials) {
      await prisma.operationTemplateMaterial.create({ data: item });
    }
  }

  if (backupData.operationTemplateEquipment) {
    for (const item of backupData.operationTemplateEquipment) {
      await prisma.operationTemplateEquipment.create({ data: item });
    }
  }

  if (backupData.operationTemplateRoles) {
    for (const item of backupData.operationTemplateRoles) {
      await prisma.operationTemplateRole.create({ data: item });
    }
  }

  if (backupData.orders) {
    for (const item of backupData.orders) {
      await prisma.order.create({ data: item });
    }
  }

  if (backupData.orderItems) {
    for (const item of backupData.orderItems) {
      await prisma.orderItem.create({ data: item });
    }
  }
}
