
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function createBackup(type = 'full') {
  try {
    const typeLabel = type === 'data-only' ? 'data-only (только данные)' : 'full (схема + данные)';
    console.log(new Date().toISOString() + `: Создание ${typeLabel} бэкапа базы данных...`);
    
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
    const prefix = type === 'data-only' ? 'backup_data' : 'backup_full';
    const backupFile = path.join(backupDir, `${prefix}_${timestamp}.sql`);
    
    // Создаем бэкап с использованием pg_dump
    let command = `PGOPTIONS='--client-min-messages=warning' pg_dump "${databaseUrl}" --no-owner --no-acl`;
    
    // Для data-only бэкапа добавляем флаг --data-only и --column-inserts
    if (type === 'data-only') {
      command += ' --data-only --column-inserts';
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    // Сохраняем вывод в файл
    fs.writeFileSync(backupFile, stdout);
    
    // Проверяем размер файла
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(new Date().toISOString() + `: Бэкап успешно создан: ${backupFile}`);
    console.log(new Date().toISOString() + `: Тип: ${typeLabel}`);
    console.log(new Date().toISOString() + `: Размер бэкапа: ${sizeMB} MB`);
    
    // Удаляем старые бэкапы каждого типа, оставляя последние 10
    ['backup_full', 'backup_data'].forEach(prefix => {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith(prefix + '_') && f.endsWith('.sql'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          mtime: fs.statSync(path.join(backupDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      if (files.length > 10) {
        const toDelete = files.slice(10);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
        });
        console.log(new Date().toISOString() + `: Старые ${prefix} бэкапы удалены. Осталось 10 последних.`);
      }
    });
    
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

// Получаем тип бэкапа из аргументов командной строки
const backupType = process.argv[2] || 'full';
createBackup(backupType);
