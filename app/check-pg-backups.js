require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkBackups() {
  const prisma = new PrismaClient();
  try {
    // Проверяем, есть ли Point-in-Time Recovery или бэкапы
    const result = await prisma.$queryRaw`
      SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size
      FROM pg_database
      WHERE datname = current_database();
    `;
    console.log('=== Database Info ===');
    console.log(result);
    
    // Проверяем историю операций
    const migrations = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" ORDER BY started_at;
    `;
    console.log('\n=== Migration History ===');
    migrations.forEach(m => {
      console.log(`${m.migration_name}`);
      console.log(`  Started: ${m.started_at}`);
      console.log(`  Finished: ${m.finished_at}`);
      console.log(`  Applied steps: ${m.applied_steps_count}`);
      if (m.logs) console.log(`  Logs: ${m.logs.substring(0, 200)}...`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBackups();
