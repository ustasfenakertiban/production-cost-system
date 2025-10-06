
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function restoreBackup(backupFile) {
  try {
    console.log(new Date().toISOString() + ': Восстановление из бэкапа...');
    
    if (!backupFile) {
      throw new Error('Не указан файл бэкапа');
    }
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Файл бэкапа не найден: ${backupFile}`);
    }
    
    // Загружаем DATABASE_URL из .env
    require('dotenv').config({ path: path.join(__dirname, 'app', '.env') });
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL не найден в .env файле');
    }
    
    console.log(new Date().toISOString() + `: Восстановление из файла: ${backupFile}`);
    
    // Читаем содержимое файла бэкапа
    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    
    // Создаем временный файл для SQL команды
    const tmpFile = '/tmp/restore_backup.sql';
    fs.writeFileSync(tmpFile, sqlContent);
    
    // Восстанавливаем через psql
    const command = `PGOPTIONS='--client-min-messages=warning' psql "${databaseUrl}" -f "${tmpFile}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    // Удаляем временный файл
    fs.unlinkSync(tmpFile);
    
    console.log(new Date().toISOString() + ': Данные успешно восстановлены!');
    console.log(new Date().toISOString() + ': Готово!');
    process.exit(0);
  } catch (error) {
    console.error(new Date().toISOString() + ': ОШИБКА при восстановлении из бэкапа!');
    console.error(error.message);
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    process.exit(1);
  }
}

// Получаем путь к файлу бэкапа из аргументов командной строки
const backupFile = process.argv[2];
restoreBackup(backupFile);
