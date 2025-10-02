require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function finalCheck() {
  const prisma = new PrismaClient();
  try {
    console.log('=== FINAL DATABASE CHECK ===\n');
    
    // 1. Проверяем все данные во всех таблицах
    const users = await prisma.user.findMany();
    const chains = await prisma.operationChain.findMany();
    const operations = await prisma.productionOperation.findMany();
    const materials = await prisma.material.findMany();
    const equipment = await prisma.equipment.findMany();
    const roles = await prisma.employeeRole.findMany();
    
    console.log('Current data in database:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Operation Chains: ${chains.length}`);
    console.log(`- Operations: ${operations.length}`);
    console.log(`- Materials: ${materials.length}`);
    console.log(`- Equipment: ${equipment.length}`);
    console.log(`- Employee Roles: ${roles.length}`);
    
    // 2. Проверяем статистику операций
    const stats = await prisma.$queryRaw`
      SELECT 
        relname as table_name,
        n_tup_ins as total_inserts,
        n_tup_del as total_deletes,
        n_live_tup as current_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND (n_tup_ins > 0 OR n_tup_del > 0)
      ORDER BY relname;
    `;
    
    console.log('\n=== Database Activity History ===');
    console.log('(Shows ALL operations since database creation)\n');
    stats.forEach(s => {
      console.log(`${s.table_name}:`);
      console.log(`  Total inserts ever: ${s.total_inserts}`);
      console.log(`  Total deletes ever: ${s.total_deletes}`);
      console.log(`  Current rows: ${s.current_rows}`);
      console.log('');
    });
    
    // 3. Итоговый вердикт
    const totalDataInserts = stats
      .filter(s => !s.table_name.includes('_prisma') && !s.table_name.includes('users'))
      .reduce((sum, s) => sum + Number(s.total_inserts || 0), 0);
    
    console.log('\n=== VERDICT ===');
    if (totalDataInserts === 0) {
      console.log('❌ NO PRODUCTION DATA WAS EVER INSERTED INTO THIS DATABASE');
      console.log('The database has been empty since creation (except for 1 user).');
      console.log('');
      console.log('Possible explanations:');
      console.log('1. Data was entered in a different database/environment');
      console.log('2. Data was lost before this checkpoint');
      console.log('3. Data was entered in browser localStorage (not database)');
    } else {
      console.log(`⚠️  ${totalDataInserts} production records were inserted, but later deleted`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalCheck();
