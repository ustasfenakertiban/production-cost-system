require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function deepCheck() {
  const prisma = new PrismaClient();
  try {
    // Проверяем все схемы базы данных
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema');
    `;
    console.log('=== Available Schemas ===');
    console.log(schemas);
    
    // Проверяем, есть ли данные в других схемах
    for (const schema of schemas) {
      console.log(`\n=== Checking schema: ${schema.schema_name} ===`);
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schema.schema_name}
        AND table_type = 'BASE TABLE';
      `;
      console.log('Tables:', tables);
    }
    
    // Проверяем, есть ли shadow/backup таблицы
    const allTables = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%backup%' 
         OR table_name LIKE '%shadow%'
         OR table_name LIKE '%old%'
      ORDER BY table_schema, table_name;
    `;
    console.log('\n=== Backup/Shadow Tables ===');
    console.log(allTables);
    
    // Проверяем недавние операции в логах Prisma
    const recentMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, logs
      FROM "_prisma_migrations"
      ORDER BY started_at DESC;
    `;
    console.log('\n=== All Migrations ===');
    recentMigrations.forEach(m => {
      console.log('\nMigration:', m.migration_name);
      console.log('Started:', m.started_at);
      console.log('Finished:', m.finished_at);
      if (m.logs) console.log('Logs:', m.logs);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deepCheck();
