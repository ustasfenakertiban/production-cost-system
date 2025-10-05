import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Найти заказ с цепочкой "Изготовление формы"
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          product: true,
          productionProcess: {
            include: {
              operationChains: {
                where: {
                  name: {
                    contains: 'изготовление формы',
                    mode: 'insensitive'
                  }
                },
                include: {
                  operations: {
                    where: {
                      name: {
                        contains: 'подготовка к печати',
                        mode: 'insensitive'
                      }
                    },
                    include: {
                      operationEquipment: {
                        include: {
                          equipment: true
                        }
                      },
                      operationRoles: {
                        include: {
                          role: true
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

  orders.forEach(order => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`Заказ: ${order.name}`);
    order.orderItems.forEach(item => {
      item.productionProcess.operationChains.forEach(chain => {
        console.log(`\nЦепочка: ${chain.name} (${chain.chainType})`);
        chain.operations.forEach(op => {
          console.log(`\n  Операция: ${op.name}`);
          console.log(`  operationDuration: ${op.operationDuration}`);
          console.log(`  cycleHours: ${op.cycleHours}`);
          
          console.log(`\n  Оборудование:`);
          op.operationEquipment.forEach(eq => {
            console.log(`    - ${eq.equipment.name}`);
            console.log(`      machineTime: ${eq.machineTime}`);
            console.log(`      machineTimeSeconds: ${eq.machineTimeSeconds}`);
            console.log(`      Какое значение используется в симуляции? machineTime = ${eq.machineTime}`);
          });
          
          console.log(`\n  Роли:`);
          op.operationRoles.forEach(role => {
            console.log(`    - ${role.role.name}`);
            console.log(`      timeSpent: ${role.timeSpent}`);
            console.log(`      timeSpentSeconds: ${role.timeSpentSeconds}`);
            console.log(`      Какое значение используется в симуляции? timeSpent = ${role.timeSpent}`);
          });
          
          // Проверка расчета времени
          const enabledEquipment = op.operationEquipment.filter(e => e.enabled);
          const enabledRoles = op.operationRoles.filter(r => r.enabled);
          const equipmentTimes = enabledEquipment.map(eq => eq.machineTime || 0);
          const roleTimes = enabledRoles.map(r => r.timeSpent || 0);
          const opDur = op.operationDuration || 0;
          const allTimes = [...equipmentTimes, ...roleTimes, opDur].filter(t => t > 0);
          const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 1;
          
          console.log(`\n  🔧 Расчет времени операции:`);
          console.log(`     equipmentTimes: [${equipmentTimes.join(', ')}]`);
          console.log(`     roleTimes: [${roleTimes.join(', ')}]`);
          console.log(`     operationDuration: ${opDur}`);
          console.log(`     allTimes: [${allTimes.join(', ')}]`);
          console.log(`     ⏱️  ИТОГОВОЕ ВРЕМЯ: ${maxTime} часов`);
        });
      });
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
