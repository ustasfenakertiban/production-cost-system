require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMaterials() {
  const materials = await prisma.material.findMany({
    select: {
      id: true,
      name: true,
      batchSize: true,
      cost: true,
    },
    take: 5
  });
  
  console.log('=== Первые 5 материалов из БД ===');
  materials.forEach(m => {
    console.log(`${m.name}:`);
    console.log(`  batchSize = ${m.batchSize} (тип: ${typeof m.batchSize})`);
    console.log(`  cost = ${m.cost} (тип: ${typeof m.cost})`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkMaterials().catch(console.error);
