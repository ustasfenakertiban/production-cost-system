require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateBatchSizes() {
  console.log('🚀 Начинаем миграцию партий закупки...\n');
  
  // Получаем все партии
  const batches = await prisma.materialPurchaseBatch.findMany({
    include: {
      material: { select: { id: true, name: true, batchSize: true } }
    }
  });
  
  // Группируем по материалам и находим максимальную партию
  const materialBatches = {};
  batches.forEach(b => {
    const matId = b.material.id;
    if (!materialBatches[matId]) {
      materialBatches[matId] = {
        id: matId,
        name: b.material.name,
        currentBatchSize: b.material.batchSize,
        quantities: []
      };
    }
    materialBatches[matId].quantities.push(b.quantity);
  });
  
  // Обновляем batchSize для каждого материала
  let updated = 0;
  let skipped = 0;
  
  for (const matId in materialBatches) {
    const data = materialBatches[matId];
    const maxQty = Math.max(...data.quantities);
    
    if (data.currentBatchSize === null) {
      await prisma.material.update({
        where: { id: matId },
        data: { batchSize: maxQty }
      });
      
      console.log(`✅ ${data.name}: установлен batchSize = ${maxQty}`);
      updated++;
    } else {
      console.log(`⏭️  ${data.name}: уже заполнен (${data.currentBatchSize})`);
      skipped++;
    }
  }
  
  console.log(`\n📊 Результаты миграции:`);
  console.log(`   Обновлено: ${updated}`);
  console.log(`   Пропущено: ${skipped}`);
  console.log(`   Всего: ${updated + skipped}`);
  
  await prisma.$disconnect();
  console.log('\n✅ Миграция завершена!');
}

migrateBatchSizes().catch(console.error);
