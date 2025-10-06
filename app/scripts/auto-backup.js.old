
/**
 * Автоматическая система резервного копирования
 * Создаёт бэкап перед каждой миграцией и может быть вызвана вручную
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30; // Хранить последние 30 бэкапов

// Создаём директорию для бэкапов
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup(reason = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${reason}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  console.log(`\n🔄 Создание бэкапа: ${filename}`);
  console.log(`📝 Причина: ${reason}`);
  
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL не найден в .env');
    }
    
    // Используем pg_dump для создания бэкапа
    const command = `pg_dump "${dbUrl}" > "${filepath}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Бэкап создан: ${filepath}`);
    console.log(`📦 Размер: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
    
    // Очищаем старые бэкапы
    cleanOldBackups();
    
    return filepath;
  } catch (error) {
    console.error('❌ Ошибка при создании бэкапа:', error.message);
    throw error;
  }
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
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
    .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  console.log('\n📋 Доступные бэкапы:\n');
  files.forEach((file, i) => {
    console.log(`${i + 1}. ${file.name}`);
    console.log(`   Дата: ${file.time.toLocaleString('ru-RU')}`);
    console.log(`   Размер: ${(file.size / 1024).toFixed(2)} KB\n`);
  });
  
  return files;
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'create';
const reason = args[1] || 'manual';

if (command === 'create') {
  createBackup(reason);
} else if (command === 'list') {
  listBackups();
} else {
  console.log(`
Использование:
  node scripts/auto-backup.js create [причина]  - Создать бэкап
  node scripts/auto-backup.js list               - Показать список бэкапов
  
Примеры:
  node scripts/auto-backup.js create before_migration
  node scripts/auto-backup.js create manual
  node scripts/auto-backup.js list
  `);
}

module.exports = { createBackup, listBackups, cleanOldBackups };
