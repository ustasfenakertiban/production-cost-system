// Проверка логики для материала с deliveryDays=0

const currentDay = 1;
const waitForMaterialDelivery = true;
const leadTimeProductionDays = 0;
const leadTimeShippingDays = 0;

const leadProd = waitForMaterialDelivery ? leadTimeProductionDays : 0;
const leadShip = waitForMaterialDelivery ? leadTimeShippingDays : 0;
const etaProdDay = currentDay + leadProd;
const etaArrivalDay = currentDay + leadProd + leadShip;

console.log('Материал: Вода холодная (deliveryDays=0)');
console.log(`День заказа: ${currentDay}`);
console.log(`leadProd: ${leadProd}, leadShip: ${leadShip}`);
console.log(`etaProductionDay: ${etaProdDay}`);
console.log(`etaArrivalDay: ${etaArrivalDay}`);
console.log('');
console.log('Вывод:');
console.log(`  Заказ сделан в день ${currentDay}`);
console.log(`  Прибытие в день ${etaArrivalDay}`);
console.log(`  В методе processIncomingMaterials будет проверка: etaArrivalDay === currentDay`);
console.log(`  День ${currentDay}: etaArrivalDay (${etaArrivalDay}) === currentDay (${currentDay})? ${etaArrivalDay === currentDay}`);
console.log('  ✓ Материал должен прибыть в тот же день');
