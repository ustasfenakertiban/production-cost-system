require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function restoreDatabase(backupFile) {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Restoring database from backup...');
    console.log(`📁 File: ${backupFile}`);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log('⚠️  This will DELETE all current data and replace it with backup!');
    console.log(`📅 Backup date: ${data.timestamp}`);
    
    // Очищаем существующие данные
    console.log('🗑️  Clearing existing data...');
    await prisma.operationMaterial.deleteMany({});
    await prisma.operationEquipment.deleteMany({});
    await prisma.operationRole.deleteMany({});
    await prisma.productionOperation.deleteMany({});
    await prisma.operationChain.deleteMany({});
    await prisma.recurringExpense.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.materialCategory.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.employeeRole.deleteMany({});
    
    // Восстанавливаем данные
    console.log('📥 Restoring data...');
    
    // Материальные категории
    for (const cat of data.materialCategories || []) {
      await prisma.materialCategory.create({
        data: {
          id: cat.id,
          name: cat.name,
          enabled: cat.enabled ?? true,
          comment: cat.comment || ''
        }
      });
    }
    
    // Материалы
    for (const mat of data.materials || []) {
      await prisma.material.create({
        data: {
          id: mat.id,
          name: mat.name,
          unit: mat.unit,
          pricePerUnit: mat.pricePerUnit,
          categoryId: mat.categoryId,
          enabled: mat.enabled ?? true,
          comment: mat.comment || ''
        }
      });
    }
    
    // Оборудование
    for (const eq of data.equipment || []) {
      await prisma.equipment.create({
        data: {
          id: eq.id,
          name: eq.name,
          hourlyRate: eq.hourlyRate,
          enabled: eq.enabled ?? true,
          comment: eq.comment || ''
        }
      });
    }
    
    // Роли
    for (const role of data.roles || []) {
      await prisma.employeeRole.create({
        data: {
          id: role.id,
          name: role.name,
          hourlyRate: role.hourlyRate,
          enabled: role.enabled ?? true,
          comment: role.comment || ''
        }
      });
    }
    
    // Цепочки операций
    for (const chain of data.operationChains || []) {
      await prisma.operationChain.create({
        data: {
          id: chain.id,
          name: chain.name,
          description: chain.description,
          enabled: chain.enabled ?? true,
          comment: chain.comment || ''
        }
      });
    }
    
    // Операции
    for (const op of data.operations || []) {
      await prisma.productionOperation.create({
        data: {
          id: op.id,
          name: op.name,
          description: op.description,
          durationMinutes: op.durationMinutes,
          chainId: op.chainId,
          orderIndex: op.orderIndex,
          enabled: op.enabled ?? true,
          comment: op.comment || '',
          minimumBatchSize: op.minimumBatchSize || 1,
          canProcessInParallel: op.canProcessInParallel ?? false,
          parallelCapacity: op.parallelCapacity
        }
      });
    }
    
    // Связи операций с материалами
    for (const om of (data.operations || []).flatMap(op => op.operationMaterials || [])) {
      await prisma.operationMaterial.create({
        data: {
          operationId: om.operationId,
          materialId: om.materialId,
          quantityPerUnit: om.quantityPerUnit,
          enableInCalculation: om.enableInCalculation ?? true
        }
      });
    }
    
    // Связи операций с оборудованием
    for (const oe of (data.operations || []).flatMap(op => op.operationEquipment || [])) {
      await prisma.operationEquipment.create({
        data: {
          operationId: oe.operationId,
          equipmentId: oe.equipmentId,
          enableInCalculation: oe.enableInCalculation ?? true,
          requiresContinuousOperation: oe.requiresContinuousOperation ?? true
        }
      });
    }
    
    // Связи операций с ролями
    for (const or of (data.operations || []).flatMap(op => op.operationRoles || [])) {
      await prisma.operationRole.create({
        data: {
          operationId: or.operationId,
          roleId: or.roleId,
          workersCount: or.workersCount,
          enableInCalculation: or.enableInCalculation ?? true,
          requiresContinuousPresence: or.requiresContinuousPresence ?? true
        }
      });
    }
    
    // Повторяющиеся расходы
    for (const exp of data.recurringExpenses || []) {
      await prisma.recurringExpense.create({
        data: {
          id: exp.id,
          name: exp.name,
          amount: exp.amount,
          frequency: exp.frequency
        }
      });
    }
    
    console.log('✅ Database restored successfully!');
    console.log(`📊 Restored:`);
    console.log(`   - Operation Chains: ${data.operationChains?.length || 0}`);
    console.log(`   - Operations: ${data.operations?.length || 0}`);
    console.log(`   - Materials: ${data.materials?.length || 0}`);
    console.log(`   - Equipment: ${data.equipment?.length || 0}`);
    console.log(`   - Roles: ${data.roles?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Получаем имя файла из аргументов командной строки
const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Usage: node restore-db.js <backup-file>');
  console.error('Example: node restore-db.js backups/backup-2025-10-02.json');
  process.exit(1);
}

restoreDatabase(backupFile);
