require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUnusedMaterials() {
  const materialsWithoutBatch = await prisma.material.findMany({
    where: { batchSize: null },
    include: {
      operationMaterials: {
        select: { id: true, operation: { select: { name: true } } }
      }
    }
  });
  
  console.log('=== Материалы без batchSize ===\n');
  
  if (materialsWithoutBatch.length === 0) {
    console.log('✅ Все материалы имеют batchSize!');
  } else {
    materialsWithoutBatch.forEach(m => {
      console.log(`⚠️ ${m.name}:`);
      if (m.operationMaterials.length > 0) {
        console.log(`   Используется в операциях: ${m.operationMaterials.length}`);
        console.log(`   ❌ ТРЕБУЕТСЯ ЗАПОЛНИТЬ batchSize!`);
      } else {
        console.log(`   Не используется в операциях`);
        console.log(`   ℹ️  Можно оставить пустым или удалить`);
      }
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

checkUnusedMaterials().catch(console.error);
