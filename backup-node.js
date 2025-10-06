
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function createBackup() {
  try {
    console.log(new Date().toISOString() + ': Создание бэкапа базы данных...');
    
    const backupDir = '/home/ubuntu/production_cost_system/backups';
    
    // Создаем директорию, если её нет
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Загружаем DATABASE_URL из .env
    require('dotenv').config({ path: path.join(__dirname, 'app', '.env') });
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL не найден в .env файле');
    }
    
    // Формируем имя файла бэкапа
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
    
    // Создаем бэкап с использованием pg_dump и игнорированием ошибок версии
    // Используем переменную окружения PGOPTIONS для подавления предупреждений
    const command = `PGOPTIONS='--client-min-messages=warning' pg_dump "${databaseUrl}" --no-owner --no-acl`;
    
    const { stdout, stderr } = await execAsync(command);
    
    // Сохраняем вывод в файл
    fs.writeFileSync(backupFile, stdout);
    
    // Проверяем размер файла
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(new Date().toISOString() + `: Бэкап успешно создан: ${backupFile}`);
    console.log(new Date().toISOString() + `: Размер бэкапа: ${sizeMB} MB`);
    
    // Удаляем старые бэкапы, оставляя последние 10
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        mtime: fs.statSync(path.join(backupDir, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    if (files.length > 10) {
      console.log(new Date().toISOString() + `: Найдено ${files.length} бэкапов, удаляем старые...`);
      const toDelete = files.slice(10);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
      });
      console.log(new Date().toISOString() + `: Старые бэкапы удалены. Осталось 10 последних.`);
    } else {
      console.log(new Date().toISOString() + `: Всего бэкапов: ${files.length}`);
    }
    
    console.log(new Date().toISOString() + ': Готово!');
    process.exit(0);
  } catch (error) {
    console.error(new Date().toISOString() + ': ОШИБКА при создании бэкапа!');
    console.error(error.message);
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    process.exit(1);
  }
}

createBackup();
