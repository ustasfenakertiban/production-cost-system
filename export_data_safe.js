const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAllData() {
  try {
    console.log('🔍 Экспортируем все данные из базы...');
    
    const data = {
      exportDate: new Date().toISOString(),
      users: await prisma.user.findMany(),
      products: await prisma.product.findMany(),
      materials: await prisma.material.findMany(),
      equipment: await prisma.equipment.findMany(),
      employeeRoles: await prisma.employeeRole.findMany(),
      productionProcesses: await prisma.productionProcess.findMany(),
      operationChains: await prisma.operationChain.findMany(),
      operations: await prisma.operation.findMany(),
      backups: await prisma.backup.findMany()
    };
    
    // Считаем записи
    const counts = {
      users: data.users.length,
      products: data.products.length,
      materials: data.materials.length,
      equipment: data.equipment.length,
      employeeRoles: data.employeeRoles.length,
      productionProcesses: data.productionProcesses.length,
      operationChains: data.operationChains.length,
      operations: data.operations.length,
      backups: data.backups.length
    };
    
    console.log('\n📊 Количество записей:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
    });
    
    // Сохраняем в JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFile = path.join('/home/ubuntu', `EMERGENCY_BACKUP_${timestamp}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
    console.log(`\n✅ JSON экспорт сохранен: ${jsonFile}`);
    
    // Сохраняем в читаемом текстовом формате
    const txtFile = path.join('/home/ubuntu', `EMERGENCY_BACKUP_${timestamp}.txt`);
    let txt = `ЭКСТРЕННЫЙ БЭКАП ДАННЫХ\nДата: ${data.exportDate}\n\n`;
    txt += '='.repeat(80) + '\n';
    
    Object.entries(counts).forEach(([table, count]) => {
      txt += `\n${table.toUpperCase()}: ${count} записей\n`;
      txt += '-'.repeat(80) + '\n';
      data[table].forEach((record, i) => {
        txt += `\n[${i + 1}] ${JSON.stringify(record, null, 2)}\n`;
      });
      txt += '\n';
    });
    
    fs.writeFileSync(txtFile, txt);
    console.log(`✅ Текстовый экспорт сохранен: ${txtFile}`);
    
    console.log('\n✅ Все данные успешно экспортированы!');
    console.log('📁 Файлы находятся в /home/ubuntu/ и не зависят от базы данных');
    
    return { jsonFile, txtFile, counts };
  } catch (error) {
    console.error('❌ Ошибка при экспорте:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportAllData();
