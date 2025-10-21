require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBatches() {
  const batches = await prisma.materialPurchaseBatch.findMany({
    include: {
      material: { select: { name: true } },
      order: { select: { id: true } }
    },
    take: 10
  });
  
  console.log('=== Партии закупки из БД ===');
  console.log(`Найдено записей: ${batches.length}`);
  batches.forEach(b => {
    console.log(`\n${b.material.name}:`);
    console.log(`  quantity = ${b.quantity}`);
    console.log(`  pricePerUnit = ${b.pricePerUnit}`);
    console.log(`  orderId = ${b.orderId}`);
  });
  
  await prisma.$disconnect();
}

checkBatches().catch(console.error);
