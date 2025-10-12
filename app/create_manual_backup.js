require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('./node_modules/.prisma/client');
const fs = require('fs');
const path = require('path');

async function createBackup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Подключение к базе данных...');
    
    // Получаем все данные из всех таблиц
    console.log('📥 Экспорт данных...');
    
    console.log('  - Экспорт users...');
    const users = await prisma.user.findMany();
    
    console.log('  - Экспорт products...');
    const products = await prisma.product.findMany();
    
    console.log('  - Экспорт materials...');
    const materials = await prisma.material.findMany();
    
    console.log('  - Экспорт equipment...');
    const equipment = await prisma.equipment.findMany();
    
    console.log('  - Экспорт employeeRoles...');
    const employeeRoles = await prisma.employeeRole.findMany();
    
    console.log('  - Экспорт productionProcesses...');
    const productionProcesses = await prisma.productionProcess.findMany();
    
    console.log('  - Экспорт operationChains...');
    const operationChains = await prisma.operationChain.findMany();
    
    console.log('  - Экспорт productionOperations...');
    const productionOperations = await prisma.productionOperation.findMany();
    
    console.log('  - Экспорт operationMaterials...');
    const operationMaterials = await prisma.operationMaterial.findMany();
    
    console.log('  - Экспорт operationEquipment...');
    const operationEquipment = await prisma.operationEquipment.findMany();
    
    console.log('  - Экспорт operationRoles...');
    const operationRoles = await prisma.operationRole.findMany();
    
    console.log('  - Экспорт operationTemplates...');
    const operationTemplates = await prisma.operationTemplate.findMany();
    
    console.log('  - Экспорт operationTemplateMaterials...');
    const operationTemplateMaterials = await prisma.operationTemplateMaterial.findMany();
    
    console.log('  - Экспорт operationTemplateEquipment...');
    const operationTemplateEquipment = await prisma.operationTemplateEquipment.findMany();
    
    console.log('  - Экспорт operationTemplateRoles...');
    const operationTemplateRoles = await prisma.operationTemplateRole.findMany();
    
    console.log('  - Экспорт backups...');
    const backups = await prisma.backup.findMany();
    
    const data = {
      users,
      products,
      materials,
      equipment,
      employeeRoles,
      productionProcesses,
      operationChains,
      productionOperations,
      operationMaterials,
      operationEquipment,
      operationRoles,
      operationTemplates,
      operationTemplateMaterials,
      operationTemplateEquipment,
      operationTemplateRoles,
      backups
    };
    
    // Сохраняем в файл
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `manual_full_backup_${timestamp}.json`;
    const backupDir = path.join(__dirname, '..', 'backups');
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ Бэкап успешно создан: ${filename}`);
    console.log(`📁 Размер файла: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
    console.log(`📂 Путь: ${filepath}`);
    
    // Выводим статистику
    console.log('\n📊 Статистика данных:');
    Object.entries(data).forEach(([table, records]) => {
      console.log(`  - ${table}: ${records.length} записей`);
    });
    
  } catch (error) {
    console.error('\n❌ Ошибка при создании бэкапа:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createBackup();
