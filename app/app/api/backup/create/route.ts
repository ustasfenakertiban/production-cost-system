
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Создание бэкапа через API...');

    // Получаем все данные из базы
    const data = {
      timestamp: new Date().toISOString(),
      reason: 'manual_web',
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

    // Создаем директорию для бэкапов, если её нет
    const backupDir = path.join(process.cwd(), 'scripts', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Формируем имя файла с датой и временем
    const dateStr = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `backup_manual_${dateStr}.json`;
    const backupFile = path.join(backupDir, filename);

    // Сохраняем данные в JSON файл
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');

    // Подсчитываем статистику
    const stats = {
      users: data.users.length,
      materialCategories: data.materialCategories.length,
      materials: data.materials.length,
      equipment: data.equipment.length,
      employeeRoles: data.employeeRoles.length,
      products: data.products.length,
      productionProcesses: data.productionProcesses.length,
      operationChains: data.operationChains.length,
      productionOperations: data.productionOperations.length,
      operationTemplates: data.operationTemplates.length,
      orders: data.orders.length,
      orderItems: data.orderItems.length,
    };

    const fileSize = fs.statSync(backupFile).size;
    const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);

    console.log('✅ Бэкап успешно создан через API');

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      filename,
      size: fileSize,
      totalRecords,
      stats,
      timestamp: data.timestamp,
    });
  } catch (error: any) {
    console.error('❌ Ошибка при создании бэкапа:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
