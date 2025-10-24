const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Проверка параметров доставки материалов ===\n');
  
  // Получаем все материалы
  const materials = await prisma.material.findMany({
    select: {
      id: true,
      name: true,
      minStock: true,
      minOrderQty: true,
      leadTimeProductionDays: true,
      leadTimeShippingDays: true,
      unitCost: true,
      vatRate: true
    }
  });
  
  console.log(`Найдено материалов: ${materials.length}\n`);
  
  for (const m of materials) {
    console.log(`Материал: ${m.name}`);
    console.log(`  ID: ${m.id}`);
    console.log(`  minStock: ${m.minStock}`);
    console.log(`  minOrderQty: ${m.minOrderQty}`);
    console.log(`  leadTimeProductionDays: ${m.leadTimeProductionDays}`);
    console.log(`  leadTimeShippingDays: ${m.leadTimeShippingDays}`);
    console.log(`  Итого дней до прибытия: ${m.leadTimeProductionDays + m.leadTimeShippingDays}`);
    console.log(`  unitCost: ${m.unitCost}`);
    console.log(`  vatRate: ${m.vatRate}%`);
    console.log('');
  }
  
  // Проверим глобальные настройки симуляции
  const settings = await prisma.globalSimulationSettings.findFirst();
  if (settings) {
    console.log('\n=== Глобальные настройки симуляции ===');
    console.log(`waitForMaterialDelivery: ${settings.waitForMaterialDelivery}`);
    console.log(`materialTwoPhasePayment: ${settings.materialTwoPhasePayment}`);
    console.log(`materialPrepayPercent: ${settings.materialPrepayPercent}`);
    console.log(`thresholdRatio: ${settings.thresholdRatio}`);
    console.log(`initialCashBalance: ${settings.initialCashBalance}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
