require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkMigrations() {
  const prisma = new PrismaClient();
  
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC;
    `;
    
    console.log('Applied migrations:\n');
    migrations.forEach(m => {
      console.log(`${m.finished_at?.toISOString()} - ${m.migration_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
