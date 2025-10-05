import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { simulateOrder } from './lib/simulation-engine';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: {
      name: {
        contains: 'Кремлин',
        mode: 'insensitive'
      }
    },
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
                      },
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

  if (!order) {
    console.log('Заказ не найден');
    return;
  }

  console.log(`Запуск симуляции для заказа: ${order.name}`);
  
  const params = {
    hoursPerDay: 8,
    physicalWorkers: 5,
    breakMinutesPerHour: 0,
    varianceMode: 'NONE' as const
  };

  const result = simulateOrder(order as any, params);
  
  console.log('\n\n═══════════════ ЛОГ СИМУЛЯЦИИ ═══════════════');
  console.log(result.log);
  console.log('\n\n═══════════════ ИТОГИ ═══════════════');
  console.log(`Материалы: ${result.totalCosts.materials.toFixed(2)} руб.`);
  console.log(`Оборудование: ${result.totalCosts.equipment.toFixed(2)} руб.`);
  console.log(`Труд: ${result.totalCosts.labor.toFixed(2)} руб.`);
  console.log(`ИТОГО: ${result.totalCosts.total.toFixed(2)} руб.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
