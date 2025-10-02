require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkHistory() {
  const prisma = new PrismaClient();
  try {
    // Проверяем статистику базы данных
    const stats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY relname;
    `;
    
    console.log('=== Table Statistics (History of Operations) ===');
    console.log('Inserts: total records ever inserted');
    console.log('Deletes: total records ever deleted');
    console.log('Live: current records in table\n');
    
    stats.forEach(s => {
      if (s.inserts > 0 || s.deletes > 0) {
        console.log(`Table: ${s.tablename}`);
        console.log(`  Inserts: ${s.inserts}, Updates: ${s.updates}, Deletes: ${s.deletes}`);
        console.log(`  Live tuples: ${s.live_tuples}, Dead tuples: ${s.dead_tuples}`);
        console.log('');
      }
    });
    
    const totalInserts = stats.reduce((sum, s) => sum + Number(s.inserts || 0), 0);
    const totalDeletes = stats.reduce((sum, s) => sum + Number(s.deletes || 0), 0);
    
    console.log(`\nTotal inserts ever made: ${totalInserts}`);
    console.log(`Total deletes ever made: ${totalDeletes}`);
    
    if (totalDeletes > 0) {
      console.log('\n⚠️  WARNING: Data was deleted from the database!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkHistory();
