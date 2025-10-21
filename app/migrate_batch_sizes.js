require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateBatchSizes() {
  // Получаем последние партии для каждого материала
  const batches = await prisma.materialPurchaseBatch.findMany({
    include: {
      material: { select: { id: true, name: true, batchSize: true } }
    }
  });
  
  // Группируем по материалам
  const materialBatches = {};
  batches.forEach(b => {
    const matId = b.material.id;
    if (!materialBatches[matId]) {
      materialBatches[matId] = {
        name: b.material.name,
        currentBatchSize: b.material.batchSize,
        quantities: []
      };
    }
    materialBatches[matId].quantities.push(b.quantity);
  });
  
  console.log('=== Анализ партий закупки ===\n');
  
  for (const matId in materialBatches) {
    const data = materialBatches[matId];
    const avgQty = data.quantities.reduce((a, b) => a + b, 0) / data.quantities.length;
    const maxQty = Math.max(...data.quantities);
    
    console.log(`${data.name}:`);
    console.log(`  Текущий batchSize: ${data.currentBatchSize}`);
    console.log(`  Средняя партия: ${avgQty.toFixed(2)}`);
    console.log(`  Макс. партия: ${maxQty}`);
    console.log(`  Рекомендуется: ${maxQty}`);
    console.log('');
  }
  
  await prisma.$disconnect();
}

migrateBatchSizes().catch(console.error);
