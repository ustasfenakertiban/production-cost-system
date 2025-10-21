require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixElectricity() {
  const electricity = await prisma.material.findFirst({
    where: { name: { contains: 'Электроэнергия' } }
  });
  
  if (electricity) {
    await prisma.material.update({
      where: { id: electricity.id },
      data: { batchSize: 1000 }
    });
    
    console.log('✅ Электроэнергия: установлен batchSize = 1000 кВт·ч');
  } else {
    console.log('⚠️ Материал "Электроэнергия" не найден');
  }
  
  await prisma.$disconnect();
}

fixElectricity().catch(console.error);
