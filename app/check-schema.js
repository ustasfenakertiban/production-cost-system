require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkSchema() {
  const prisma = new PrismaClient();
  
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name, 
             (SELECT COUNT(*) 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('Tables in database:\n');
    tables.forEach(t => {
      console.log(`${t.table_name}: ${t.column_count} columns`);
    });
    
    // Check if backups table exists
    const backupsTable = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'backups' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n=== Backups table structure ===');
    if (backupsTable.length > 0) {
      backupsTable.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('  Table "backups" does not exist!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
