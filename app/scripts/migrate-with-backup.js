
/**
 * Безопасная миграция с автоматическим бэкапом
 * Создаёт бэкап перед миграцией и применяет миграцию
 */
const { execSync } = require('child_process');
const { createBackup } = require('./auto-backup.js');

async function safelyMigrate() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║         БЕЗОПАСНАЯ МИГРАЦИЯ С БЭКАПОМ            ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  try {
    // Шаг 1: Создание бэкапа
    console.log('Шаг 1/2: Создание бэкапа перед миграцией...');
    createBackup('before_migration');
    
    // Шаг 2: Применение миграции
    console.log('\nШаг 2/2: Применение миграции...');
    execSync('yarn prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('\n✅ Миграция успешно применена!');
    console.log('💾 Бэкап сохранён в scripts/backups/\n');
    
  } catch (error) {
    console.error('\n❌ Ошибка при миграции!');
    console.error('💾 Бэкап сохранён - вы можете восстановить данные');
    console.error('📝 Используйте: node scripts/restore-backup.js\n');
    process.exit(1);
  }
}

safelyMigrate();
