require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Проверка заказов и партий закупок ===\n');
  
  // Получаем все заказы
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      name: true,
      orderDate: true
    }
  });
  
  console.log(`Найдено заказов: ${orders.length}\n`);
  
  for (const order of orders) {
    console.log(`Заказ "${order.name}" (ID: ${order.id})`);
    console.log(`  Дата: ${order.orderDate.toLocaleDateString('ru-RU')}`);
    
    // Получаем партии закупок для этого заказа
    const batches = await prisma.materialPurchaseBatch.findMany({
      where: { orderId: order.id },
      include: {
        material: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`  Партий закупок: ${batches.length}`);
    
    if (batches.length === 0) {
      console.log('  ⚠️ НЕТ ПАРТИЙ ЗАКУПОК - симуляция не сможет заказать материалы!');
    } else {
      console.log('  Материалы для закупки:');
      for (const b of batches) {
        console.log(`    - ${b.material.name}: ${b.quantity} шт по ${b.pricePerUnit} руб`);
        console.log(`      Производство: ${b.manufacturingDays} дней, доставка: ${b.deliveryDays} дней`);
        console.log(`      Итого до прибытия: ${b.manufacturingDays + b.deliveryDays} дней`);
        console.log(`      Минимальный запас: ${b.minStock}`);
      }
    }
    console.log('');
  }
  
  // Проверим глобальные настройки
  const settings = await prisma.globalSimulationSettingsV2.findFirst();
  if (settings) {
    console.log('=== Глобальные настройки симуляции ===');
    console.log(`Ждать доставку: ${settings.waitForMaterialDelivery}`);
    console.log(`Двухфазная оплата: ${settings.materialTwoPhasePayment}`);
    console.log(`Предоплата: ${settings.materialPrepayPercent}%`);
    console.log(`Порог заказа: ${settings.thresholdRatio} (от minStock)`);
    console.log(`Начальный баланс: ${settings.initialCashBalance} руб`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
