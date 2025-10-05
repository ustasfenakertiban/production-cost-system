
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Не указан файл бэкапа' },
        { status: 400 }
      );
    }

    const backupDir = path.join(process.cwd(), 'scripts', 'backups');
    const filePath = path.join(backupDir, filename);

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Файл бэкапа не найден' },
        { status: 404 }
      );
    }

    console.log(`🔄 Восстановление из бэкапа: ${filename}`);

    // Читаем файл бэкапа
    const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Создаем бэкап текущего состояния перед восстановлением
    const currentData = {
      timestamp: new Date().toISOString(),
      reason: 'before_restore',
      users: await prisma.user.findMany(),
      materialCategories: await prisma.materialCategory.findMany(),
      materials: await prisma.material.findMany(),
      equipment: await prisma.equipment.findMany(),
      employeeRoles: await prisma.employeeRole.findMany(),
      products: await prisma.product.findMany(),
      productionProcesses: await prisma.productionProcess.findMany(),
      operationChains: await prisma.operationChain.findMany(),
      productionOperations: await prisma.productionOperation.findMany({
        include: {
          operationMaterials: true,
          operationEquipment: true,
          operationRoles: true,
        },
      }),
      operationTemplates: await prisma.operationTemplate.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
    };

    const beforeRestoreFilename = `backup_before_restore_${new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')}.json`;
    const beforeRestoreFile = path.join(backupDir, beforeRestoreFilename);
    fs.writeFileSync(beforeRestoreFile, JSON.stringify(currentData, null, 2), 'utf-8');
    console.log(`💾 Создан бэкап текущего состояния: ${beforeRestoreFilename}`);

    // Удаляем все данные (в обратном порядке зависимостей)
    console.log('🗑️  Очистка базы данных...');
    
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.operationTemplate.deleteMany({});
    
    // Удаляем связи операций
    await prisma.operationMaterial.deleteMany({});
    await prisma.operationEquipment.deleteMany({});
    await prisma.operationRole.deleteMany({});
    
    await prisma.productionOperation.deleteMany({});
    await prisma.operationChain.deleteMany({});
    await prisma.productionProcess.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.employeeRole.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.materialCategory.deleteMany({});
    // Не удаляем пользователей для безопасности

    console.log('📥 Восстановление данных...');

    // Восстанавливаем данные (в порядке зависимостей)
    if (backupData.materialCategories) {
      await prisma.materialCategory.createMany({ data: backupData.materialCategories });
    }
    if (backupData.materials) {
      await prisma.material.createMany({ data: backupData.materials });
    }
    if (backupData.equipment) {
      await prisma.equipment.createMany({ data: backupData.equipment });
    }
    if (backupData.employeeRoles) {
      await prisma.employeeRole.createMany({ data: backupData.employeeRoles });
    }
    if (backupData.products) {
      await prisma.product.createMany({ data: backupData.products });
    }
    if (backupData.productionProcesses) {
      await prisma.productionProcess.createMany({ data: backupData.productionProcesses });
    }
    if (backupData.operationChains) {
      await prisma.operationChain.createMany({ data: backupData.operationChains });
    }
    
    // Восстанавливаем операции с их связями
    if (backupData.productionOperations) {
      for (const operation of backupData.productionOperations) {
        const { operationMaterials, operationEquipment, operationRoles, ...operationData } = operation;
        
        await prisma.productionOperation.create({
          data: {
            ...operationData,
            operationMaterials: operationMaterials ? { create: operationMaterials } : undefined,
            operationEquipment: operationEquipment ? { create: operationEquipment } : undefined,
            operationRoles: operationRoles ? { create: operationRoles } : undefined,
          },
        });
      }
    }
    
    if (backupData.operationTemplates) {
      await prisma.operationTemplate.createMany({ data: backupData.operationTemplates });
    }
    if (backupData.orders) {
      await prisma.order.createMany({ data: backupData.orders });
    }
    if (backupData.orderItems) {
      await prisma.orderItem.createMany({ data: backupData.orderItems });
    }

    console.log('✅ Данные успешно восстановлены');

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Данные успешно восстановлены',
      backupBeforeRestore: beforeRestoreFilename,
    });
  } catch (error: any) {
    console.error('❌ Ошибка при восстановлении:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
