require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkAllData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking all data in database:\n');
    
    const counts = {
      'Users': await prisma.user.count(),
      'Products': await prisma.product.count(),
      'Materials': await prisma.materials.count(),
      'Material Categories': await prisma.materialCategory.count(),
      'Equipment': await prisma.equipment.count(),
      'Employee Roles': await prisma.employeeRole.count(),
      'Production Processes': await prisma.productionProcess.count(),
      'Operation Chains': await prisma.operationChain.count(),
      'Operations': await prisma.productionOperation.count(),
      'Backups': await prisma.backup.count(),
    };
    
    for (const [name, count] of Object.entries(counts)) {
      console.log(`${name}: ${count}`);
    }
    
    console.log('\n--- Recent records ---\n');
    
    // Show recent materials
    const materials = await prisma.materials.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });
    console.log('Recent Materials:');
    materials.forEach(m => {
      console.log(`  - ${m.name} (${m.category?.name || 'No category'})`);
    });
    
    // Show equipment
    const equipment = await prisma.equipment.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    console.log('\nRecent Equipment:');
    equipment.forEach(e => {
      console.log(`  - ${e.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
