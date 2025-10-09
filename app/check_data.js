const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const counts = {
      products: await prisma.product.count(),
      materials: await prisma.material.count(),
      equipment: await prisma.equipment.count(),
      employeeRoles: await prisma.employeeRole.count(),
      productionProcesses: await prisma.productionProcess.count(),
      operationChains: await prisma.operationChain.count(),
      operations: await prisma.productionOperation.count(),
      backups: await prisma.backup.count()
    };
    
    console.log('Количество записей в базе данных:');
    console.log(JSON.stringify(counts, null, 2));
    
    // Проверяем, есть ли бэкапы
    if (counts.backups > 0) {
      const latestBackup = await prisma.backup.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, type: true, size: true }
      });
      console.log('\nПоследний бэкап:');
      console.log(JSON.stringify(latestBackup, null, 2));
    }
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
