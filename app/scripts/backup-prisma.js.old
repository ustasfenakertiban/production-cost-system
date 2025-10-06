
/**
 * Система резервного копирования через Prisma
 * Экспортирует все данные в JSON формат
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30;

// Создаём директорию для бэкапов
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup(reason = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${reason}_${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  console.log(`\n🔄 Создание бэкапа: ${filename}`);
  console.log(`📝 Причина: ${reason}`);
  
  // Создаём новый экземпляр Prisma клиента для этой операции
  const backupPrisma = new PrismaClient();
  
  try {
    // Экспортируем все данные
    const data = {
      metadata: {
        timestamp: new Date().toISOString(),
        reason,
        version: '1.0'
      }
    };
    
    console.log('📥 Экспорт данных...');
    
    data.users = await backupPrisma.user.findMany();
    data.materialCategories = await backupPrisma.materialCategory.findMany();
    data.materials = await backupPrisma.material.findMany();
    data.equipment = await backupPrisma.equipment.findMany();
    data.employeeRoles = await backupPrisma.employeeRole.findMany();
    data.recurringExpenses = await backupPrisma.recurringExpense.findMany();
    data.products = await backupPrisma.product.findMany();
    data.productionProcesses = await backupPrisma.productionProcess.findMany();
    data.operationChains = await backupPrisma.operationChain.findMany();
    data.productionOperations = await backupPrisma.productionOperation.findMany({
      include: {
        operationMaterials: true,
        operationEquipment: true,
        operationRoles: true
      }
    });
    data.operationTemplates = await backupPrisma.operationTemplate.findMany({
      include: {
        materials: true,
        equipment: true,
        roles: true
      }
    });
    data.orders = await backupPrisma.order.findMany();
    data.orderItems = await backupPrisma.orderItem.findMany();
    
    // Подсчитываем статистику
    const stats = {};
    let totalRecords = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'metadata' && Array.isArray(value)) {
        stats[key] = value.length;
        totalRecords += value.length;
      }
    }
    
    // Сохраняем в файл
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    const fileSize = fs.statSync(filepath).size;
    
    console.log(`\n✅ Бэкап создан успешно!`);
    console.log(`📦 Размер: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Всего записей: ${totalRecords}\n`);
    
    console.log('📋 Статистика:');
    Object.entries(stats).forEach(([key, count]) => {
      if (count > 0) {
        console.log(`   ${key}: ${count}`);
      }
    });
    
    // Очищаем старые бэкапы
    cleanOldBackups();
    
    return filepath;
  } catch (error) {
    console.error('❌ Ошибка при создании бэкапа:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await backupPrisma.$disconnect();
  }
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Удалён старый бэкап: ${file.name}`);
    });
  }
}

function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  console.log('\n📋 Доступные бэкапы:\n');
  files.forEach((file, i) => {
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
  
  return files;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'create';
  const reason = args[1] || 'manual';

  if (command === 'create') {
    createBackup(reason).catch(console.error);
  } else if (command === 'list') {
    listBackups();
  } else {
    console.log(`
Использование:
  node scripts/backup-prisma.js create [причина]  - Создать бэкап
  node scripts/backup-prisma.js list               - Показать список бэкапов
  
Примеры:
  node scripts/backup-prisma.js create before_migration
  node scripts/backup-prisma.js create manual
  node scripts/backup-prisma.js list
    `);
  }
}

module.exports = { createBackup, listBackups, cleanOldBackups };
