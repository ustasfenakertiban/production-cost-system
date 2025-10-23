require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullSimulation() {
  try {
    const orders = await prisma.order.findMany();
    if (orders.length === 0) {
      console.log('Нет заказов');
      return;
    }
    
    const orderId = orders[0].id;
    console.log(`Запускаем симуляцию для заказа: ${orderId}\n`);
    
    // Загружаем модули симуляции
    const { loadMaterials, loadEquipment, loadEmployees, loadSimulationSettingsV2, loadPeriodicExpenses, loadProcess, loadPaymentSchedule } = require('./lib/simulation-v2/dataLoader');
    const { SimulationEngine } = require('./lib/simulation-v2/SimulationEngine');
    
    console.log('Загрузка данных...');
    const materials = await loadMaterials(orderId);
    const equipment = await loadEquipment();
    const employees = await loadEmployees();
    const settings = await loadSimulationSettingsV2();
    const periodicExpenses = await loadPeriodicExpenses();
    const process = await loadProcess(orderId);
    const paymentSchedule = await loadPaymentSchedule(orderId);
    
    console.log(`  Материалов: ${materials.length}`);
    console.log(`  Оборудования: ${equipment.length}`);
    console.log(`  Сотрудников: ${employees.length}`);
    console.log(`  Периодических расходов: ${periodicExpenses.length}`);
    console.log(`  Операций: ${process.chains.reduce((sum, c) => sum + c.operations.length, 0)}`);
    console.log(`  Начальный баланс: ${settings.initialCashBalance} ₽\n`);
    
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId }
    });
    
    if (!orderItem) {
      console.log('Нет элементов заказа');
      return;
    }
    
    console.log('Запуск симуляции...');
    const engine = new SimulationEngine(
      materials,
      equipment,
      employees,
      process,
      settings,
      periodicExpenses,
      paymentSchedule
    );
    
    const result = await engine.simulate(Number(orderItem.quantity));
    
    console.log('\n=== РЕЗУЛЬТАТЫ СИМУЛЯЦИИ ===');
    console.log(`Дней симуляции: ${result.days.length}`);
    console.log(`Партий материалов: ${result.materialBatches?.length || 0}`);
    
    if (result.days.length > 0) {
      const day1 = result.days[0];
      console.log(`\nДень 1:`);
      console.log(`  Начальный баланс: ${day1.cashStart?.toFixed(2)} ₽`);
      console.log(`  Поступления: ${day1.cashIn?.toFixed(2)} ₽`);
      console.log(`  Расходы на материалы: ${((day1.cashOut?.materials || 0) + (day1.cashOut?.materialsVat || 0)).toFixed(2)} ₽`);
      console.log(`  Расходы на зарплату: ${day1.cashOut?.labor?.toFixed(2)} ₽`);
      console.log(`  Конечный баланс: ${day1.cashEnd?.toFixed(2)} ₽`);
    }
    
    if (result.materialBatches && result.materialBatches.length > 0) {
      console.log(`\nПример партии материалов:`);
      const batch = result.materialBatches[0];
      console.log(`  Материал ID: ${batch.materialId}`);
      console.log(`  Количество: ${batch.qty}`);
      console.log(`  Цена: ${batch.unitCost} ₽`);
      console.log(`  День заказа: ${batch.orderDay}`);
      console.log(`  День прибытия: ${batch.etaArrivalDay}`);
      console.log(`  Предоплата (нетто): ${batch.prepayNet} ₽`);
      console.log(`  Постоплата (нетто): ${batch.postpayNet} ₽`);
    }
    
  } catch (error) {
    console.error('\n❌ Ошибка симуляции:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testFullSimulation();
