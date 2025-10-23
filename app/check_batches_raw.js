require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBatches() {
  try {
    const orders = await prisma.order.findMany();
    if (orders.length === 0) {
      console.log('Нет заказов');
      return;
    }
    
    const orderId = orders[0].id;
    console.log(`Проверяем партии для заказа: ${orderId}\n`);
    
    const batches = await prisma.materialPurchaseBatch.findMany({
      where: { orderId },
      take: 2
    });
    
    console.log(`Найдено партий: ${batches.length}\n`);
    
    if (batches.length > 0) {
      console.log('Первая партия:');
      console.log(JSON.stringify(batches[0], null, 2));
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBatches();
