require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMaterials() {
  const materials = await prisma.material.findMany({
    select: {
      id: true,
      name: true,
      cost: true,
      vatPercentage: true
    },
    take: 10
  });
  
  console.log('=== МАТЕРИАЛЫ В БАЗЕ ===\n');
  materials.forEach(mat => {
    console.log(`${mat.name}:`);
    console.log(`  cost: ${mat.cost}`);
    console.log(`  vatPercentage: ${mat.vatPercentage} (в БД)`);
    console.log(`  vatPercentage * 100: ${mat.vatPercentage * 100}%`);
    console.log('');
  });
}

checkMaterials()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
