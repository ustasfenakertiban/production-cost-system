require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  
  try {
    const results = await prisma.$queryRaw`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'products', COUNT(*) FROM products
      UNION ALL
      SELECT 'materials', COUNT(*) FROM materials
      UNION ALL
      SELECT 'material_categories', COUNT(*) FROM material_categories
      UNION ALL
      SELECT 'equipment', COUNT(*) FROM equipment
      UNION ALL
      SELECT 'employee_roles', COUNT(*) FROM employee_roles
      UNION ALL
      SELECT 'production_processes', COUNT(*) FROM production_processes
      UNION ALL
      SELECT 'operation_chains', COUNT(*) FROM operation_chains
      UNION ALL
      SELECT 'production_operations', COUNT(*) FROM production_operations
      UNION ALL
      SELECT 'backups', COUNT(*) FROM backups
      ORDER BY table_name;
    `;
    
    console.log('Data in database:\n');
    results.forEach(row => {
      console.log(`${row.table_name}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
