require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkAllMigrations() {
  const prisma = new PrismaClient();
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, applied_steps_count, logs 
      FROM "_prisma_migrations" 
      ORDER BY started_at;
    `;
    console.log('=== All Migrations ===');
    console.log(JSON.stringify(migrations, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllMigrations();
