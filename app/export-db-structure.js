require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function exportData() {
  const prisma = new PrismaClient();
  try {
    // Проверяем все таблицы
    const data = {
      operationChains: await prisma.operationChain.findMany({ include: { operations: true } }),
      operations: await prisma.productionOperation.findMany({ 
        include: { 
          operationMaterials: true, 
          operationEquipment: true, 
          operationRoles: true 
        } 
      }),
      materials: await prisma.material.findMany(),
      equipment: await prisma.equipment.findMany(),
      roles: await prisma.employeeRole.findMany(),
      materialCategories: await prisma.materialCategory.findMany(),
      recurringExpenses: await prisma.recurringExpense.findMany()
    };
    
    console.log('=== Current Database Status ===');
    console.log('Operation Chains:', data.operationChains.length);
    console.log('Operations:', data.operations.length);
    console.log('Materials:', data.materials.length);
    console.log('Equipment:', data.equipment.length);
    console.log('Roles:', data.roles.length);
    console.log('Material Categories:', data.materialCategories.length);
    console.log('Recurring Expenses:', data.recurringExpenses.length);
    
    if (data.operationChains.length > 0 || data.operations.length > 0 || data.materials.length > 0) {
      // Сохраняем в файл только если есть данные
      const fs = require('fs');
      const filename = 'db-backup-' + Date.now() + '.json';
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log('\n✓ Data exported to', filename);
    } else {
      console.log('\n✗ No data to export - database is empty');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
