
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createBackup() {
  try {
    console.log('⏳ Создаю бэкап базы данных...');
    
    // Получаем все данные из базы
    const data = {
      timestamp: new Date().toISOString(),
      materials: await prisma.material.findMany(),
      equipment: await prisma.equipment.findMany(),
      employees: await prisma.employee.findMany(),
      operationChains: await prisma.operationChain.findMany(),
      operations: await prisma.operation.findMany({
        include: {
          materials: true,
          equipment: true,
          roles: true,
        },
      }),
    };

    // Создаем директорию для бэкапов, если её нет
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Формируем имя файла с датой и временем
    const date = new Date();
    const dateStr = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupFile = path.join(backupDir, `backup_${dateStr}.json`);

    // Сохраняем данные в JSON файл
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');

    // Подсчитываем статистику
    const stats = {
      materials: data.materials.length,
      equipment: data.equipment.length,
      employees: data.employees.length,
      operationChains: data.operationChains.length,
      operations: data.operations.length,
    };

    const fileSize = fs.statSync(backupFile).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);

    console.log('\n✅ Бэкап успешно создан!');
    console.log(`📁 Файл: ${backupFile}`);
    console.log(`📊 Размер: ${fileSizeKB} KB`);
    console.log('\n📈 Статистика данных:');
    console.log(`   Материалы: ${stats.materials}`);
    console.log(`   Оборудование: ${stats.equipment}`);
    console.log(`   Сотрудники: ${stats.employees}`);
    console.log(`   Цепочки операций: ${stats.operationChains}`);
    console.log(`   Операции: ${stats.operations}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Ошибка при создании бэкапа:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createBackup()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
