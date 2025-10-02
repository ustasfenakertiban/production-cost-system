require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkMigrationIssue() {
  const prisma = new PrismaClient();
  try {
    // Получаем полную историю миграций
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        applied_steps_count,
        logs
      FROM "_prisma_migrations"
      ORDER BY started_at;
    `;
    
    console.log('=== FULL MIGRATION HISTORY ===\n');
    
    if (migrations.length === 0) {
      console.log('❌ No migrations found in history!');
      return;
    }
    
    migrations.forEach((m, index) => {
      console.log(`\n--- Migration ${index + 1} ---`);
      console.log(`Name: ${m.migration_name}`);
      console.log(`Started: ${m.started_at}`);
      console.log(`Finished: ${m.finished_at || 'FAILED'}`);
      console.log(`Applied steps: ${m.applied_steps_count}`);
      
      if (m.logs) {
        console.log(`\nLogs:`);
        console.log(m.logs);
      }
      console.log('\n' + '='.repeat(60));
    });
    
    // Проверяем, когда база была создана
    const dbAge = await prisma.$queryRaw`
      SELECT 
        pg_postmaster_start_time() as postgres_start,
        (SELECT started_at FROM "_prisma_migrations" ORDER BY started_at LIMIT 1) as first_migration
    `;
    
    console.log('\n\n=== DATABASE TIMELINE ===');
    console.log(dbAge);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationIssue();
