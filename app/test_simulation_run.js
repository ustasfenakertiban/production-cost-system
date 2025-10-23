require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSimulation() {
  try {
    const orders = await prisma.order.findMany({
      include: { orderItems: true }
    });
    
    if (orders.length === 0) {
      console.log('Нет заказов для симуляции');
      return;
    }
    
    const order = orders[0];
    console.log(`Заказ: ${order.id}`);
    console.log(`Элементов: ${order.orderItems.length}\n`);
    
    // Проверяем настройки симуляции
    const settings = await prisma.simulationSettingsV2.findFirst({
      where: { orderId: order.id }
    });
    
    if (!settings) {
      console.log('⚠️ НЕТ НАСТРОЕК СИМУЛЯЦИИ для этого заказа!');
      console.log('Откройте карточку заказа и настройте параметры симуляции.');
      return;
    }
    
    console.log('Настройки симуляции:');
    console.log(`  Начальный баланс: ${settings.initialCash} ₽`);
    console.log(`  Периодические расходы: ${settings.periodicExpenseAmount} ₽ каждые ${settings.periodicExpenseDays} дней`);
    console.log(`  Рабочих часов в день: ${settings.workHoursPerDay}`);
    console.log(`  Дней в неделю: ${settings.workDaysPerWeek}`);
    
    // Проверяем партии
    const batches = await prisma.materialPurchaseBatch.findMany({
      where: { orderId: order.id }
    });
    console.log(`\nПартий закупок: ${batches.length}`);
    
    // Проверяем производственные процессы
    const processes = await prisma.productionProcess.findMany({
      where: { 
        orderItems: {
          some: { orderId: order.id }
        }
      },
      include: {
        operationChains: {
          include: {
            operations: true
          }
        }
      }
    });
    
    console.log(`Производственных процессов: ${processes.length}`);
    if (processes.length > 0) {
      console.log(`\nПервый процесс:`);
      console.log(`  Цепочек операций: ${processes[0].operationChains.length}`);
      if (processes[0].operationChains.length > 0) {
        const chain = processes[0].operationChains[0];
        console.log(`  Операций в первой цепочке: ${chain.operations.length}`);
      }
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSimulation();
