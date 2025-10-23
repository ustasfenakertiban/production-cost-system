require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Checking Material Purchase Batch Templates ===\n');
  
  const templates = await prisma.materialPurchaseBatchTemplate.findMany({
    include: {
      material: {
        select: {
          name: true,
          unit: true
        }
      }
    },
    orderBy: {
      materialId: 'asc'
    }
  });

  console.log(`Found ${templates.length} templates\n`);

  for (const t of templates) {
    console.log(`Template ID: ${t.id}`);
    console.log(`Material: ${t.material.name}`);
    console.log(`Quantity: ${t.quantity} ${t.material.unit}`);
    console.log(`Unit Price: ${t.unitPrice} руб`);
    console.log(`VAT: ${t.vatRate}%`);
    console.log(`Payment Type: ${t.paymentType}`);
    if (t.prepayPercent) console.log(`Prepay: ${t.prepayPercent}%`);
    console.log('---');
  }

  console.log('\n=== Checking Materials (for reference) ===\n');
  
  const materials = await prisma.material.findMany({
    select: {
      id: true,
      name: true,
      unit: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(`Found ${materials.length} materials\n`);
  materials.forEach(m => {
    console.log(`ID: ${m.id} | ${m.name} (${m.unit})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
