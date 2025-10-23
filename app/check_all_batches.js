require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllBatches() {
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
      include: { material: { select: { name: true } } }
    });
    
    console.log(`Найдено партий: ${batches.length}\n`);
    
    let hasData = 0;
    let noData = 0;
    
    batches.forEach(b => {
      const hasValues = b.quantity > 0 && b.pricePerUnit > 0;
      if (hasValues) {
        hasData++;
      } else {
        noData++;
        console.log(`⚠️ Партия без данных: ${b.material.name}`);
        console.log(`   quantity=${b.quantity}, pricePerUnit=${b.pricePerUnit}, vatPercent=${b.vatPercent}`);
      }
    });
    
    console.log(`\nИтого:`);
    console.log(`  Партий с данными: ${hasData}`);
    console.log(`  Партий без данных: ${noData}`);
    
    if (hasData > 0) {
      console.log('\nПример партии С данными:');
      const goodBatch = batches.find(b => b.quantity > 0 && b.pricePerUnit > 0);
      if (goodBatch) {
        console.log(`  Материал: ${goodBatch.material.name}`);
        console.log(`  Количество: ${goodBatch.quantity}`);
        console.log(`  Цена за единицу: ${goodBatch.pricePerUnit}`);
        console.log(`  НДС: ${goodBatch.vatPercent}%`);
        console.log(`  Предоплата: ${goodBatch.prepaymentPercentage}%`);
        console.log(`  Дни производства: ${goodBatch.manufacturingDays}`);
        console.log(`  Дни доставки: ${goodBatch.deliveryDays}`);
      }
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllBatches();
