require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function deleteAll() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Deleting all data in correct order...\n');
    
    // Delete in order to respect foreign keys (children first, parents last)
    const deleteOrder = [
      { name: 'operation_equipment', query: 'DELETE FROM operation_equipment' },
      { name: 'operation_materials', query: 'DELETE FROM operation_materials' },
      { name: 'operation_roles', query: 'DELETE FROM operation_roles' },
      { name: 'production_operations', query: 'DELETE FROM production_operations' },
      { name: 'operation_chains', query: 'DELETE FROM operation_chains' },
      { name: 'production_processes', query: 'DELETE FROM production_processes' },
      { name: 'operation_template_equipment', query: 'DELETE FROM operation_template_equipment' },
      { name: 'operation_template_materials', query: 'DELETE FROM operation_template_materials' },
      { name: 'operation_template_roles', query: 'DELETE FROM operation_template_roles' },
      { name: 'operation_templates', query: 'DELETE FROM operation_templates' },
      { name: 'order_items', query: 'DELETE FROM order_items' },
      { name: 'orders', query: 'DELETE FROM orders' },
      { name: 'materials', query: 'DELETE FROM materials' },
      { name: 'material_categories', query: 'DELETE FROM material_categories' },
      { name: 'equipment', query: 'DELETE FROM equipment' },
      { name: 'employee_roles', query: 'DELETE FROM employee_roles' },
      { name: 'products', query: 'DELETE FROM products' },
      { name: 'recurring_expenses', query: 'DELETE FROM recurring_expenses' },
      { name: 'backups', query: 'DELETE FROM backups' },
      { name: 'sessions', query: 'DELETE FROM sessions' },
      { name: 'accounts', query: 'DELETE FROM accounts' },
      { name: 'users', query: 'DELETE FROM users' },
      { name: 'verificationtokens', query: 'DELETE FROM verificationtokens' }
    ];
    
    for (const item of deleteOrder) {
      try {
        const result = await prisma.$executeRawUnsafe(item.query);
        console.log(`✓ Deleted from ${item.name}: ${result} rows`);
      } catch (error) {
        console.log(`✗ Error deleting from ${item.name}: ${error.message.substring(0, 100)}`);
      }
    }
    
    console.log('\nAll data deleted! Now ready for restore.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAll();
