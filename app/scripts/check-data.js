
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const materials = await prisma.material.findMany();
    const equipment = await prisma.equipment.findMany();
    const roles = await prisma.employeeRole.findMany();
    const productionOperations = await prisma.productionOperation.findMany();
    const chains = await prisma.operationChain.findMany();
    const templates = await prisma.operationTemplate.findMany();
    
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   ТЕКУЩЕЕ СОСТОЯНИЕ БАЗЫ ДАННЫХ     ║');
    console.log('╚══════════════════════════════════════╝\n');
    console.log('📦 Материалы:', materials.length);
    console.log('⚙️  Оборудование:', equipment.length);
    console.log('👤 Роли сотрудников:', roles.length);
    console.log('🔧 Операции:', operations.length);
    console.log('🔗 Цепочки операций:', chains.length);
    console.log('📋 Шаблоны операций:', templates.length);
    
    if (materials.length > 0) {
      console.log('\n--- Материалы ---');
      materials.forEach(m => console.log(`  • ${m.name} (${m.unit})`));
    }
    
    if (equipment.length > 0) {
      console.log('\n--- Оборудование ---');
      equipment.forEach(e => console.log(`  • ${e.name}`));
    }
    
    if (roles.length > 0) {
      console.log('\n--- Роли ---');
      roles.forEach(r => console.log(`  • ${r.name}`));
    }
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
