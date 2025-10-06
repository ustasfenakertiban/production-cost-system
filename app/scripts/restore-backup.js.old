
/**
 * Восстановление данных из бэкапа
 * Позволяет выбрать бэкап и восстановить данные
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BACKUP_DIR = path.join(__dirname, 'backups');

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Директория backups не найдена');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
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
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL не найден в .env');
  }
  
  try {
    // Создаём бэкап текущего состояния перед восстановлением
    console.log('📦 Создание бэкапа текущего состояния...');
    const { createBackup } = require('./auto-backup.js');
    createBackup('before_restore');
    
    console.log('\n⚠️  ВНИМАНИЕ: Все текущие данные будут заменены!');
    console.log('🔄 Восстановление...\n');
    
    // Восстанавливаем из бэкапа
    const command = `psql "${dbUrl}" < "${backupPath}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Данные успешно восстановлены!');
    console.log('📝 Бэкап текущего состояния сохранён на случай отката\n');
    
  } catch (error) {
    console.error('❌ Ошибка при восстановлении:', error.message);
    throw error;
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
    console.log(`${i + 1}. ${file.name}`);
    console.log(`   Дата: ${file.time.toLocaleString('ru-RU')}`);
    console.log(`   Размер: ${(file.size / 1024).toFixed(2)} KB\n`);
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
const args = process.argv.slice(2);

if (args[0] === 'list') {
  const backups = listBackups();
  if (backups.length === 0) {
    console.log('❌ Бэкапы не найдены');
  }
} else if (args[0] && fs.existsSync(args[0])) {
  restoreBackup(args[0]).catch(console.error);
} else {
  interactiveRestore().catch(console.error);
}

module.exports = { restoreBackup, listBackups };
