require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function truncateAll() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Truncating all tables...\n');
    
    // Disable foreign key checks
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    
    const tables = [
      'operation_equipment',
      'operation_materials',
      'operation_roles',
      'production_operations',
      'operation_chains',
      'production_processes',
      'operation_template_equipment',
      'operation_template_materials',
      'operation_template_roles',
      'operation_templates',
      'order_items',
      'orders',
      'materials',
      'material_categories',
      'equipment',
      'employee_roles',
      'products',
      'recurring_expenses',
      'backups',
      'sessions',
      'accounts',
      'users',
      'verificationtokens'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✓ Truncated ${table}`);
      } catch (error) {
        console.log(`✗ Error truncating ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    
    console.log('\nAll tables truncated!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

truncateAll();
