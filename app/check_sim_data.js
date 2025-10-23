require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSimulation() {
  try {
    console.log('Проверка данных для симуляции...\n');
    
    // Проверяем заказы
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true
      }
    });
    console.log(`Найдено заказов: ${orders.length}`);
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log(`\nПервый заказ: ${order.customerName} (ID: ${order.id})`);
      console.log(`Элементов заказа: ${order.orderItems.length}`);
      
      // Проверяем партии закупок для этого заказа
      const batches = await prisma.materialPurchaseBatch.findMany({
        where: { orderId: order.id },
        include: {
          material: true
        }
      });
      
      console.log(`\nПартии закупок для заказа: ${batches.length}`);
      if (batches.length === 0) {
        console.log('⚠️ НЕТ ПАРТИЙ ЗАКУПОК! Симуляция не сможет работать без них.');
        console.log('\nСимуляция НЕ может работать без партий закупок.');
        console.log('Откройте карточку заказа и добавьте партии закупок материалов.');
      } else {
        console.log('\nПримеры партий:');
        batches.slice(0, 3).forEach(b => {
          console.log(`  - ${b.material.name}: qty=${b.qty}, unitCost=${b.unitCost}, vat=${b.vatRate}%`);
        });
      }
      
      // Проверяем материалы
      const materials = await prisma.material.findMany();
      console.log(`\nВсего материалов в системе: ${materials.length}`);
      
      // Проверяем сотрудников
      const employees = await prisma.employee.findMany();
      console.log(`Всего сотрудников: ${employees.length}`);
      
      // Проверяем оборудование
      const equipment = await prisma.equipment.findMany();
      console.log(`Всего оборудования: ${equipment.length}`);
      
      // Проверяем производственные процессы
      const processes = await prisma.productionProcess.findMany({
        include: {
          operations: true
        }
      });
      console.log(`\nПроизводственных процессов: ${processes.length}`);
      if (processes.length > 0) {
        console.log(`Операций в первом процессе: ${processes[0].operations.length}`);
      }
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSimulation();
