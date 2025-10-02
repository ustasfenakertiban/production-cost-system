import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Найдем операцию "Сушка - 2+1 часа"
  const operation = await prisma.productionOperation.findFirst({
    where: {
      name: {
        contains: 'Сушка - 2+1',
        mode: 'insensitive'
      }
    },
    include: {
      operationRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (operation) {
    console.log('\n=== ОПЕРАЦИЯ ===');
    console.log(`Название: ${operation.name}`);
    console.log(`Производительность: ${operation.estimatedProductivityPerHour} шт/час`);
    console.log(`Цикл: ${operation.cycleHours} час(ов)`);
    
    console.log('\n=== РОЛИ ===');
    operation.operationRoles.forEach(role => {
      console.log(`\nРоль: ${role.role.name}`);
      console.log(`  Ставка: ${role.rate} руб/час`);
      console.log(`  timeSpent: ${role.timeSpent} час`);
      console.log(`  piecesPerHour: ${role.piecesPerHour} шт/час`);
      console.log(`  requiresContinuousPresence: ${role.requiresContinuousPresence}`);
      
      // Расчет стоимости на 1 деталь
      if (role.piecesPerHour && role.piecesPerHour > 0) {
        const costPerPiece = role.rate / role.piecesPerHour;
        console.log(`  📊 Стоимость на 1 деталь: ${costPerPiece.toFixed(6)} руб`);
        console.log(`  📊 Стоимость на 50000 деталей: ${(costPerPiece * 50000).toFixed(2)} руб`);
      }
      
      // Текущая логика (неправильная для больших партий)
      const wrongCost = role.rate * role.timeSpent;
      console.log(`  ❌ Текущий расчет (только настройка): ${wrongCost.toFixed(6)} руб`);
    });
  }
}

main()
  .catch(e => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
