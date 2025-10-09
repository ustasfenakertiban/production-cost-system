
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function restoreFromBackup(backupPath) {
  try {
    console.log(`\n=== Восстановление из бэкапа: ${backupPath} ===\n`);
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('Очистка текущих данных...');
    
    // Удаляем данные в правильном порядке (из-за foreign keys)
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.operationRole.deleteMany({});
    await prisma.operationMaterial.deleteMany({});
    await prisma.operationEquipment.deleteMany({});
    await prisma.productionOperation.deleteMany({});
    await prisma.operationChain.deleteMany({});
    await prisma.productionProcess.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.recurringExpense.deleteMany({});
    await prisma.employeeRole.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.materialCategory.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Восстановление данных...\n');
    
    // Восстанавливаем данные
    if (backupData.users && backupData.users.length > 0) {
      console.log(`- Пользователи: ${backupData.users.length}`);
      for (const user of backupData.users) {
        await prisma.user.create({ data: user });
      }
    }
    
    if (backupData.accounts && backupData.accounts.length > 0) {
      console.log(`- Аккаунты: ${backupData.accounts.length}`);
      for (const account of backupData.accounts) {
        await prisma.account.create({ data: account });
      }
    }
    
    if (backupData.sessions && backupData.sessions.length > 0) {
      console.log(`- Сессии: ${backupData.sessions.length}`);
      for (const session of backupData.sessions) {
        await prisma.session.create({ data: session });
      }
    }
    
    if (backupData.materialCategories && backupData.materialCategories.length > 0) {
      console.log(`- Категории материалов: ${backupData.materialCategories.length}`);
      for (const category of backupData.materialCategories) {
        await prisma.materialCategory.create({ data: category });
      }
    }
    
    if (backupData.materials && backupData.materials.length > 0) {
      console.log(`- Материалы: ${backupData.materials.length}`);
      for (const material of backupData.materials) {
        await prisma.material.create({ data: material });
      }
    }
    
    if (backupData.equipment && backupData.equipment.length > 0) {
      console.log(`- Оборудование: ${backupData.equipment.length}`);
      for (const equip of backupData.equipment) {
        await prisma.equipment.create({ data: equip });
      }
    }
    
    if (backupData.employeeRoles && backupData.employeeRoles.length > 0) {
      console.log(`- Роли сотрудников: ${backupData.employeeRoles.length}`);
      for (const role of backupData.employeeRoles) {
        await prisma.employeeRole.create({ data: role });
      }
    }
    
    if (backupData.recurringExpenses && backupData.recurringExpenses.length > 0) {
      console.log(`- Регулярные расходы: ${backupData.recurringExpenses.length}`);
      for (const expense of backupData.recurringExpenses) {
        await prisma.recurringExpense.create({ data: expense });
      }
    }
    
    if (backupData.products && backupData.products.length > 0) {
      console.log(`- Продукты: ${backupData.products.length}`);
      for (const product of backupData.products) {
        await prisma.product.create({ data: product });
      }
    }
    
    if (backupData.productionProcesses && backupData.productionProcesses.length > 0) {
      console.log(`- Производственные процессы: ${backupData.productionProcesses.length}`);
      for (const process of backupData.productionProcesses) {
        await prisma.productionProcess.create({ data: process });
      }
    }
    
    if (backupData.operationChains && backupData.operationChains.length > 0) {
      console.log(`- Цепочки операций: ${backupData.operationChains.length}`);
      for (const chain of backupData.operationChains) {
        await prisma.operationChain.create({ data: chain });
      }
    }
    
    if (backupData.productionOperations && backupData.productionOperations.length > 0) {
      console.log(`- Производственные операции: ${backupData.productionOperations.length}`);
      for (const operation of backupData.productionOperations) {
        // Удаляем вложенные связи, так как они будут добавлены отдельно
        const { operationMaterials, operationEquipment, operationRoles, ...operationData } = operation;
        await prisma.productionOperation.create({ data: operationData });
      }
      
      // Теперь добавляем связанные данные
      let materialsCount = 0;
      let equipmentCount = 0;
      let rolesCount = 0;
      
      for (const operation of backupData.productionOperations) {
        if (operation.operationMaterials && operation.operationMaterials.length > 0) {
          for (const om of operation.operationMaterials) {
            await prisma.operationMaterial.create({ data: om });
            materialsCount++;
          }
        }
        
        if (operation.operationEquipment && operation.operationEquipment.length > 0) {
          for (const oe of operation.operationEquipment) {
            await prisma.operationEquipment.create({ data: oe });
            equipmentCount++;
          }
        }
        
        if (operation.operationRoles && operation.operationRoles.length > 0) {
          for (const or of operation.operationRoles) {
            await prisma.operationRole.create({ data: or });
            rolesCount++;
          }
        }
      }
      
      if (materialsCount > 0) console.log(`  - Материалы операций: ${materialsCount}`);
      if (equipmentCount > 0) console.log(`  - Оборудование операций: ${equipmentCount}`);
      if (rolesCount > 0) console.log(`  - Роли операций: ${rolesCount}`);
    }
    
    if (backupData.operations && backupData.operations.length > 0) {
      console.log(`- Операции (старый формат): ${backupData.operations.length}`);
      for (const operation of backupData.operations) {
        const { operationMaterials, operationEquipment, operationRoles, ...operationData } = operation;
        await prisma.productionOperation.create({ data: operationData });
      }
    }
    
    if (backupData.orders && backupData.orders.length > 0) {
      console.log(`- Заказы: ${backupData.orders.length}`);
      for (const order of backupData.orders) {
        await prisma.order.create({ data: order });
      }
    }
    
    if (backupData.orderItems && backupData.orderItems.length > 0) {
      console.log(`- Элементы заказов: ${backupData.orderItems.length}`);
      for (const orderItem of backupData.orderItems) {
        await prisma.orderItem.create({ data: orderItem });
      }
    }
    
    console.log('\n✅ Данные успешно восстановлены!\n');
    
  } catch (error) {
    console.error('❌ Ошибка при восстановлении:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Получаем путь к бэкапу из аргументов
const backupPath = process.argv[2] || path.join(__dirname, 'backups', 'backup_manual_2025-10-05T20-43-37-710Z.json');

restoreFromBackup(backupPath);
