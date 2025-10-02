require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function resetMigrations() {
  const prisma = new PrismaClient();
  try {
    // Удаляем неудачную миграцию из истории
    await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20251002141359_add_continuous_resource_fields';
    `;
    console.log('✓ Cleared failed migration from history');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetMigrations();
