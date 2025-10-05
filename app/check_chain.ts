import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const chains = await prisma.operationChain.findMany({
    where: {
      name: {
        contains: 'изготовление формы',
        mode: 'insensitive'
      }
    },
    include: {
      operations: {
        orderBy: {
          orderIndex: 'asc'
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
  });

  console.log('Найдено цепочек:', chains.length);
  chains.forEach(chain => {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log(`  Цепочка: ${chain.name}`);
    console.log(`  Тип: ${chain.chainType}`);
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    chain.operations.forEach((op, idx) => {
      console.log(`\n  ${idx + 1}. Операция: ${op.name}`);
      console.log(`     operationDuration: ${op.operationDuration} часов`);
      console.log(`     cycleHours: ${op.cycleHours} часов`);
      console.log(`     enabled: ${op.enabled}`);
      
      if (op.operationEquipment.length > 0) {
        console.log('\n     Оборудование:');
        op.operationEquipment.forEach(eq => {
          console.log(`       - ${eq.equipment.name}:`);
          console.log(`         machineTime: ${eq.machineTime} часов`);
          console.log(`         enabled: ${eq.enabled}`);
        });
      }
      
      if (op.operationRoles.length > 0) {
        console.log('\n     Роли:');
        op.operationRoles.forEach(role => {
          console.log(`       - ${role.role.name}:`);
          console.log(`         timeSpent: ${role.timeSpent} часов`);
          console.log(`         enabled: ${role.enabled}`);
        });
      }
      
      // Вычислим максимальное время
      const equipmentTimes = op.operationEquipment.filter(e => e.enabled).map(eq => eq.machineTime || 0);
      const roleTimes = op.operationRoles.filter(r => r.enabled).map(r => r.timeSpent || 0);
      const opDur = op.operationDuration || 0;
      const allTimes = [...equipmentTimes, ...roleTimes, opDur].filter(t => t > 0);
      const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 0;
      
      console.log(`\n     ⏱️  Расчетное время операции (макс.): ${maxTime} часов`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
