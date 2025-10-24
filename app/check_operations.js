require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Проверка операций и используемых материалов ===\n');
  
  const chains = await prisma.operationChain.findMany({
    where: { enabled: true },
    include: {
      operations: {
        where: { enabled: true },
        include: {
          operationMaterials: {
            where: { enabled: true },
            include: {
              material: true
            }
          }
        }
      }
    }
  });
  
  console.log(`Найдено цепочек операций: ${chains.length}\n`);
  
  for (const chain of chains) {
    console.log(`Цепочка: ${chain.name} (${chain.chainType})`);
    console.log(`  Операций: ${chain.operations.length}`);
    
    if (chain.operations.length === 0) {
      console.log('  ⚠️ НЕТ ОПЕРАЦИЙ!');
      continue;
    }
    
    for (const op of chain.operations) {
      console.log(`\n  Операция: ${op.name}`);
      console.log(`    Производительность: ${op.estimatedProductivityPerHour} ед/час`);
      console.log(`    Материалов: ${op.operationMaterials.length}`);
      
      if (op.operationMaterials.length === 0) {
        console.log(`    ⚠️ Операция не использует материалы`);
      } else {
        for (const om of op.operationMaterials) {
          console.log(`      - ${om.material.name}: ${om.quantity} на единицу`);
        }
      }
    }
    console.log('');
  }
  
  // Проверим, есть ли заказы с элементами
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          productionProcess: {
            include: {
              operations: true
            }
          }
        }
      }
    }
  });
  
  console.log('\n=== Проверка заказов ===\n');
  for (const order of orders) {
    console.log(`Заказ: ${order.name}`);
    console.log(`  Позиций: ${order.orderItems.length}`);
    
    if (order.orderItems.length === 0) {
      console.log('  ⚠️ НЕТ ПОЗИЦИЙ В ЗАКАЗЕ!');
    } else {
      for (const item of order.orderItems) {
        console.log(`    Позиция: процесс ${item.productionProcess?.name || 'N/A'}, количество: ${item.quantity}`);
      }
    }
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
