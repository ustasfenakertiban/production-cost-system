require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database tables...\n');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Available tables:');
    console.log(JSON.stringify(tables, null, 2));
    
    try {
      const userCount = await prisma.user.count();
      console.log(`\nUsers: ${userCount}`);
    } catch (e) {
      console.log('\nUsers table: ERROR -', e.message);
    }
    
    try {
      const backupCount = await prisma.backup.count();
      console.log(`Backups: ${backupCount}`);
    } catch (e) {
      console.log('Backups table: ERROR -', e.message);
    }
    
    try {
      const productCount = await prisma.product.count();
      console.log(`Products: ${productCount}`);
    } catch (e) {
      console.log('Products table: ERROR -', e.message);
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
