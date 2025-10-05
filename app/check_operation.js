const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Найти операцию "подготовка мастер моделей"
  const operations = await prisma.productionOperation.findMany({
    where: {
      name: {
        contains: 'подготовка',
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
      },
      operationChain: true
    }
  });

  console.log('Найдено операций:', operations.length);
  operations.forEach(op => {
    console.log('\n========================================');
    console.log('Операция:', op.name);
    console.log('Цепочка:', op.operationChain?.name);
    console.log('Тип цепочки:', op.operationChain?.chainType);
    console.log('operationDuration:', op.operationDuration);
    console.log('cycleHours:', op.cycleHours);
    
    console.log('\nОборудование:');
    op.operationEquipment.forEach(eq => {
      console.log(`  - ${eq.equipment.name}:`);
      console.log(`    machineTime: ${eq.machineTime} часов`);
      console.log(`    machineTimeSeconds: ${eq.machineTimeSeconds} секунд`);
      console.log(`    enabled: ${eq.enabled}`);
    });
    
    console.log('\nРоли:');
    op.operationRoles.forEach(role => {
      console.log(`  - ${role.role.name}:`);
      console.log(`    timeSpent: ${role.timeSpent} часов`);
      console.log(`    timeSpentSeconds: ${role.timeSpentSeconds} секунд`);
      console.log(`    enabled: ${role.enabled}`);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
