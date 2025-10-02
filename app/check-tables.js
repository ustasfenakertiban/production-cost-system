require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkTables() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    console.log('=== Tables in Database ===');
    tables.forEach(t => console.log('-', t.table_name));
    console.log('========================');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
