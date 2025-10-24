require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          product: true,
          productionProcess: {
            include: {
              operationChains: {
                include: {
                  operations: {
                    include: {
                      operationMaterials: {
                        include: {
                          material: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  
  console.log('\n=== Проверка заказов и позиций ===\n');
  for (const order of orders) {
    console.log(`Заказ: ${order.name} (ID: ${order.id})`);
    console.log(`  Позиций: ${order.orderItems.length}\n`);
    
    if (order.orderItems.length === 0) {
      console.log('  ⚠️ НЕТ ПОЗИЦИЙ В ЗАКАЗЕ - симуляция не будет производить ничего!\n');
      continue;
    }
    
    for (const item of order.orderItems) {
      console.log(`  Позиция: ${item.product?.name || 'N/A'}`);
      console.log(`    Количество: ${item.quantity}`);
      console.log(`    Процесс: ${item.productionProcess?.name || 'N/A'}`);
      console.log(`    Цепочек операций: ${item.productionProcess?.operationChains?.length || 0}`);
      
      if (!item.productionProcess || !item.productionProcess.operationChains || item.productionProcess.operationChains.length === 0) {
        console.log(`    ⚠️ Нет цепочек операций в производственном процессе!`);
      } else {
        const firstChain = item.productionProcess.operationChains[0];
        console.log(`    Первая цепочка: ${firstChain.name} (${firstChain.chainType})`);
        console.log(`      Операций: ${firstChain.operations?.length || 0}`);
        
        if (firstChain.operations && firstChain.operations.length > 0) {
          const firstOp = firstChain.operations[0];
          console.log(`      Первая операция: ${firstOp.name}`);
          console.log(`        Материалов: ${firstOp.operationMaterials?.length || 0}`);
        }
      }
      console.log('');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
