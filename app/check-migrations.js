require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkMigrations() {
  const prisma = new PrismaClient();
  try {
    const migrations = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;
    `;
    console.log('=== Recent Migrations ===');
    migrations.forEach(m => {
      console.log(`${m.migration_name} - ${m.applied_steps_count} steps - ${m.finished_at}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
