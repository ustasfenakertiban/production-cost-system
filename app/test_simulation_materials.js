require('dotenv').config();

async function testSimulation() {
  const { loadMaterials, loadSimulationSettingsV2 } = require('./lib/simulation-v2/dataLoader');
  const { ResourceManager } = require('./lib/simulation-v2/ResourceManager');
  
  const orderId = 'cmgdiok5s0000p6g1ok5kcf9y'; // Кремлин 05
  
  console.log('\n=== Загрузка данных ===\n');
  const materials = await loadMaterials(orderId);
  const settings = await loadSimulationSettingsV2();
  
  console.log(`Загружено материалов: ${materials.length}`);
  console.log(`Начальный баланс: ${settings.initialCashBalance} руб`);
  console.log(`waitForMaterialDelivery: ${settings.waitForMaterialDelivery}`);
  console.log(`thresholdRatio: ${settings.thresholdRatio}\n`);
  
  // Создаем ResourceManager
  const rm = new ResourceManager(materials, [], [], settings.initialCashBalance);
  
  console.log('\n=== Симуляция первых 5 дней ===\n');
  
  // Симуляция 5 дней
  for (let day = 1; day <= 5; day++) {
    console.log(`\n--- ДЕНЬ ${day} ---`);
    
    // Утро: заказ материалов
    console.log('\nУтро: Проверка заказов материалов');
    rm.dailyMaterialReplenishment(day, settings);
    
    // Утро: постоплата
    console.log('\nУтро: Обработка постоплаты');
    rm.processMaterialPostpay(day);
    
    // Утро: прибытие материалов
    console.log('\nУтро: Обработка прибывших материалов');
    rm.processIncomingMaterials(day);
    
    // Показываем запас первых 3 материалов
    console.log('\nТекущие запасы (первые 3 материала):');
    materials.slice(0, 3).forEach(m => {
      const stock = rm.getStock(m.id);
      console.log(`  ${m.name}: ${stock} (minStock: ${m.minStock}, threshold: ${settings.thresholdRatio * m.minStock})`);
    });
    
    console.log(`\nБаланс: ${rm.cashBalance.toFixed(2)} руб`);
  }
}

testSimulation()
  .catch(console.error)
  .finally(() => process.exit(0));
