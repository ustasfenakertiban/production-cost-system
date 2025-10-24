require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function loadMaterialsTest(orderId) {
  const rows = await prisma.material.findMany();
  console.log(`[Test] Loading ${rows.length} materials from database...`);
  
  const batches = await prisma.materialPurchaseBatch.findMany({
    where: { orderId }
  });
  console.log(`[Test] Loaded ${batches.length} batches for order ${orderId}\n`);
  
  const batchByMaterial = new Map(batches.map(b => [b.materialId, b]));
  
  const materials = rows.map(r => {
    const batch = batchByMaterial.get(r.id);
    
    if (batch) {
      const quantity = Number(batch.quantity ?? 0);
      const minStock = Number(batch.minStock ?? quantity * 0.2);
      const minOrderQty = quantity;
      
      console.log(`Material "${r.name}":`);
      console.log(`  batch.minStock (raw): ${batch.minStock}`);
      console.log(`  quantity: ${quantity}`);
      console.log(`  minStock (calculated): ${minStock} ${batch.minStock === null ? '(от 20% quantity)' : ''}`);
      console.log(`  minOrderQty: ${minOrderQty}`);
      console.log(`  leadTime: ${batch.manufacturingDays} + ${batch.deliveryDays} = ${batch.manufacturingDays + batch.deliveryDays} дней`);
      console.log('');
      
      return {
        id: String(r.id),
        name: r.name,
        unitCost: Number(batch.pricePerUnit ?? r.cost ?? 0),
        vatRate: Number(batch.vatPercent ?? r.vatPercentage ?? 0),
        minStock: minStock,
        minOrderQty: minOrderQty,
        leadTimeProductionDays: Number(batch.manufacturingDays ?? 0),
        leadTimeShippingDays: Number(batch.deliveryDays ?? 0),
      };
    }
    
    return null;
  }).filter(Boolean);
  
  // Проверим пороговые значения
  const settings = await prisma.globalSimulationSettingsV2.findFirst();
  console.log(`\n=== Проверка порогов заказа ===`);
  console.log(`thresholdRatio: ${settings.thresholdRatio}`);
  console.log(`waitForMaterialDelivery: ${settings.waitForMaterialDelivery}\n`);
  
  materials.slice(0, 3).forEach(m => {
    const threshold = settings.thresholdRatio * m.minStock;
    console.log(`Материал "${m.name}":`);
    console.log(`  minStock: ${m.minStock}`);
    console.log(`  threshold (${settings.thresholdRatio} * ${m.minStock}): ${threshold}`);
    console.log(`  Заказ будет сделан, когда stock <= ${threshold}`);
    console.log('');
  });
}

async function main() {
  const orderId = 'cmgdiok5s0000p6g1ok5kcf9y'; // Кремлин 05 вариант 1
  await loadMaterialsTest(orderId);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
