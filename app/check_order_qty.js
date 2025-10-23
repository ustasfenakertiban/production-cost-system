require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPurchaseTemplates() {
  const templates = await prisma.materialPurchaseBatchTemplate.findMany({
    select: {
      id: true,
      materialId: true,
      quantity: true,
      minStock: true,
      material: {
        select: {
          name: true
        }
      }
    },
    take: 10
  });
  
  console.log('=== ШАБЛОНЫ ЗАКУПОК ===\n');
  templates.forEach(t => {
    console.log(`${t.material.name}:`);
    console.log(`  quantity (minOrderQty): ${t.quantity}`);
    console.log(`  minStock: ${t.minStock}`);
    console.log('');
  });
}

checkPurchaseTemplates()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
