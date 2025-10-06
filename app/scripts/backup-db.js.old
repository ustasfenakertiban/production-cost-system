require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  const prisma = new PrismaClient();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  
  try {
    console.log('🔄 Creating database backup...');
    
    // Получаем все данные
    const data = {
      timestamp: new Date().toISOString(),
      operationChains: await prisma.operationChain.findMany({
        include: { operations: true }
      }),
      operations: await prisma.productionOperation.findMany({
        include: {
          operationMaterials: { include: { material: true } },
          operationEquipment: { include: { equipment: true } },
          operationRoles: { include: { role: true } }
        }
      }),
      materials: await prisma.material.findMany({ include: { category: true } }),
      materialCategories: await prisma.materialCategory.findMany(),
      equipment: await prisma.equipment.findMany(),
      roles: await prisma.employeeRole.findMany(),
      recurringExpenses: await prisma.recurringExpense.findMany()
    };
    
    // Считаем статистику
    const stats = {
      operationChains: data.operationChains.length,
      operations: data.operations.length,
      materials: data.materials.length,
      equipment: data.equipment.length,
      roles: data.roles.length,
      totalRecords: Object.values(data).reduce((sum, arr) => 
        sum + (Array.isArray(arr) ? arr.length : 0), 0
      )
    };
    
    // Сохраняем бэкап
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log('✅ Backup created successfully!');
    console.log(`📁 File: ${filepath}`);
    console.log(`📊 Stats:`, stats);
    console.log(`💾 Size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
    
    // Удаляем старые бэкапы (старше 7 дней)
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
