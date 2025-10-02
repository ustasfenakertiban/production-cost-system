
/**
 * Восстановление данных из JSON бэкапа (Prisma)
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, 'backups');

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Директория backups не найдена');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  return files;
}

async function restoreBackup(backupPath) {
  console.log(`\n🔄 Восстановление из бэкапа: ${path.basename(backupPath)}`);
  
  try {
    // Создаём бэкап текущего состояния
    console.log('📦 Создание бэкапа текущего состояния...');
    const { createBackup } = require('./backup-prisma.js');
    await createBackup('before_restore');
    
    // Читаем бэкап
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    
    console.log('\n⚠️  ВНИМАНИЕ: Все текущие данные будут заменены!');
    console.log('🔄 Восстановление...\n');
    
    // Удаляем все данные в правильном порядке (учитывая зависимости)
    await prisma.$transaction(async (tx) => {
      // Удаляем зависимые таблицы сначала
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      await tx.productionOperation.deleteMany();
      await tx.productionProcess.deleteMany();
      await tx.product.deleteMany();
      await tx.recurringExpense.deleteMany();
      
      await tx.operationTemplateMaterial.deleteMany();
      await tx.operationTemplateEquipment.deleteMany();
      await tx.operationTemplateRole.deleteMany();
      await tx.operationTemplate.deleteMany();
      
      await tx.operationMaterial.deleteMany();
      await tx.operationEquipment.deleteMany();
      await tx.operationRole.deleteMany();
      await tx.operation.deleteMany();
      await tx.operationChain.deleteMany();
      
      await tx.employeeRole.deleteMany();
      await tx.equipment.deleteMany();
      await tx.material.deleteMany();
      await tx.materialCategory.deleteMany();
      
      // Не удаляем пользователей, только если они есть в бэкапе
    });
    
    // Восстанавливаем данные в правильном порядке
    await prisma.$transaction(async (tx) => {
      // Базовые справочники
      if (data.materialCategories?.length) {
        for (const item of data.materialCategories) {
          await tx.materialCategory.create({ data: item });
        }
        console.log(`✅ Восстановлено категорий: ${data.materialCategories.length}`);
      }
      
      if (data.materials?.length) {
        for (const item of data.materials) {
          await tx.material.create({ data: item });
        }
        console.log(`✅ Восстановлено материалов: ${data.materials.length}`);
      }
      
      if (data.equipment?.length) {
        for (const item of data.equipment) {
          await tx.equipment.create({ data: item });
        }
        console.log(`✅ Восстановлено оборудования: ${data.equipment.length}`);
      }
      
      if (data.employeeRoles?.length) {
        for (const item of data.employeeRoles) {
          await tx.employeeRole.create({ data: item });
        }
        console.log(`✅ Восстановлено ролей: ${data.employeeRoles.length}`);
      }
      
      if (data.recurringExpenses?.length) {
        for (const item of data.recurringExpenses) {
          await tx.recurringExpense.create({ data: item });
        }
        console.log(`✅ Восстановлено расходов: ${data.recurringExpenses.length}`);
      }
      
      // Цепочки и операции
      if (data.operationChains?.length) {
        for (const item of data.operationChains) {
          await tx.operationChain.create({ data: item });
        }
        console.log(`✅ Восстановлено цепочек: ${data.operationChains.length}`);
      }
      
      if (data.operations?.length) {
        for (const item of data.operations) {
          const { materials, equipment, roles, ...operationData } = item;
          await tx.operation.create({
            data: {
              ...operationData,
              materials: { create: materials },
              equipment: { create: equipment },
              roles: { create: roles }
            }
          });
        }
        console.log(`✅ Восстановлено операций: ${data.operations.length}`);
      }
      
      // Шаблоны операций
      if (data.operationTemplates?.length) {
        for (const item of data.operationTemplates) {
          const { materials, equipment, roles, ...templateData } = item;
          await tx.operationTemplate.create({
            data: {
              ...templateData,
              materials: { create: materials },
              equipment: { create: equipment },
              roles: { create: roles }
            }
          });
        }
        console.log(`✅ Восстановлено шаблонов: ${data.operationTemplates.length}`);
      }
      
      // Продукты и процессы
      if (data.products?.length) {
        for (const item of data.products) {
          await tx.product.create({ data: item });
        }
        console.log(`✅ Восстановлено продуктов: ${data.products.length}`);
      }
      
      if (data.productionProcesses?.length) {
        for (const item of data.productionProcesses) {
          await tx.productionProcess.create({ data: item });
        }
        console.log(`✅ Восстановлено процессов: ${data.productionProcesses.length}`);
      }
      
      if (data.productionOperations?.length) {
        for (const item of data.productionOperations) {
          await tx.productionOperation.create({ data: item });
        }
        console.log(`✅ Восстановлено производственных операций: ${data.productionOperations.length}`);
      }
      
      // Заказы
      if (data.orders?.length) {
        for (const item of data.orders) {
          await tx.order.create({ data: item });
        }
        console.log(`✅ Восстановлено заказов: ${data.orders.length}`);
      }
      
      if (data.orderItems?.length) {
        for (const item of data.orderItems) {
          await tx.orderItem.create({ data: item });
        }
        console.log(`✅ Восстановлено позиций заказов: ${data.orderItems.length}`);
      }
    });
    
    console.log('\n✅ Данные успешно восстановлены!');
    console.log(`📅 Дата бэкапа: ${data.metadata.timestamp}`);
    console.log(`📝 Причина: ${data.metadata.reason}`);
    console.log('💾 Бэкап текущего состояния сохранён на случай отката\n');
    
  } catch (error) {
    console.error('❌ Ошибка при восстановлении:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function interactiveRestore() {
  const backups = listBackups();
  
  if (backups.length === 0) {
    console.log('❌ Бэкапы не найдены');
    return;
  }
  
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║       ВОССТАНОВЛЕНИЕ ИЗ РЕЗЕРВНОЙ КОПИИ          ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  console.log('📋 Доступные бэкапы:\n');
  backups.forEach((file, i) => {
    const data = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
    let totalRecords = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'metadata' && Array.isArray(value)) {
        totalRecords += value.length;
      }
    }
    
    console.log(`${i + 1}. ${file.name}`);
    console.log(`   Дата: ${file.time.toLocaleString('ru-RU')}`);
    console.log(`   Размер: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Записей: ${totalRecords}\n`);
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Выберите номер бэкапа для восстановления (или 0 для отмены): ', async (answer) => {
    const index = parseInt(answer) - 1;
    
    if (answer === '0') {
      console.log('❌ Отменено');
      rl.close();
      return;
    }
    
    if (index < 0 || index >= backups.length) {
      console.log('❌ Неверный номер');
      rl.close();
      return;
    }
    
    const selected = backups[index];
    
    rl.question(`\n⚠️  Восстановить из "${selected.name}"? (да/нет): `, async (confirm) => {
      if (confirm.toLowerCase() === 'да' || confirm.toLowerCase() === 'yes') {
        try {
          await restoreBackup(selected.path);
        } catch (error) {
          console.error('Ошибка:', error.message);
        }
      } else {
        console.log('❌ Отменено');
      }
      rl.close();
    });
  });
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'list') {
    const backups = listBackups();
    if (backups.length === 0) {
      console.log('❌ Бэкапы не найдены');
    } else {
      backups.forEach((file, i) => {
        const data = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
        let totalRecords = 0;
        for (const [key, value] of Object.entries(data)) {
          if (key !== 'metadata' && Array.isArray(value)) {
            totalRecords += value.length;
          }
        }
        
        console.log(`\n${i + 1}. ${file.name}`);
        console.log(`   Дата: ${file.time.toLocaleString('ru-RU')}`);
        console.log(`   Размер: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`   Записей: ${totalRecords}`);
      });
      console.log();
    }
  } else if (args[0] && fs.existsSync(args[0])) {
    restoreBackup(args[0]).catch(console.error);
  } else {
    interactiveRestore().catch(console.error);
  }
}

module.exports = { restoreBackup, listBackups };
