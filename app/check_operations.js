const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Найдем операции с названием содержащим "сушка"
  const operations = await prisma.operation.findMany({
    where: {
      name: {
        contains: 'сушка',
        mode: 'insensitive'
      }
    },
    include: {
      operationRoles: {
        include: {
          role: true
        }
      },
      operationEquipment: {
        include: {
          equipment: true
        }
      },
      operationMaterials: {
        include: {
          material: true
        }
      }
    }
  });

  console.log('\n=== ОПЕРАЦИИ СУШКИ ===\n');
  
  for (const op of operations) {
    console.log(`\n📋 Операция: ${op.name}`);
    console.log(`   ID: ${op.id}`);
    console.log(`   Производительность: ${op.estimatedProductivityPerHour} шт/час (variance: ${op.estimatedProductivityPerHourVariance})`);
    console.log(`   Цикл: ${op.cycleHours} час(ов)`);
    console.log(`   Включена: ${op.enabled ? 'Да' : 'Нет'}`);
    
    console.log(`\n   👤 РОЛИ (${op.operationRoles.length}):`);
    op.operationRoles.forEach(role => {
      console.log(`      - ${role.role.name}`);
      console.log(`        Ставка: ${role.rate} руб/час`);
      console.log(`        Время: ${role.timeSpent} час`);
      console.log(`        Производительность: ${role.piecesPerHour} шт/час`);
      console.log(`        Постоянное присутствие: ${role.requiresContinuousPresence ? 'Да' : 'Нет'}`);
      console.log(`        Включена: ${role.enabled ? 'Да' : 'Нет'}`);
    });

    console.log(`\n   ⚙️  ОБОРУДОВАНИЕ (${op.operationEquipment.length}):`);
    op.operationEquipment.forEach(eq => {
      console.log(`      - ${eq.equipment.name}`);
      console.log(`        Стоимость: ${eq.hourlyRate} руб/час`);
      console.log(`        Время работы: ${eq.machineTime} час`);
      console.log(`        Производительность: ${eq.piecesPerHour} шт/час`);
      console.log(`        Включено: ${eq.enabled ? 'Да' : 'Нет'}`);
    });

    console.log(`\n   💎 МАТЕРИАЛЫ (${op.operationMaterials.length}):`);
    op.operationMaterials.forEach(mat => {
      console.log(`      - ${mat.material.name}`);
      console.log(`        Количество: ${mat.quantity} ед.`);
      console.log(`        Цена: ${mat.unitPrice} руб/ед.`);
      console.log(`        Включен: ${mat.enabled ? 'Да' : 'Нет'}`);
    });
    
    console.log('\n' + '='.repeat(80));
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
