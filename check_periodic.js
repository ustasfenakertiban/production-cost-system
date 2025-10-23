const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.recurringExpense.findMany({
    where: { isActive: true }
  });
  
  console.log('Active periodic expenses:');
  expenses.forEach(e => {
    console.log(`  ${e.name}: ${e.amount} ${e.currency} / ${e.period}, VAT: ${e.vatRate}%`);
  });
  
  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\nTotal monthly: ${totalMonthly}`);
  console.log(`Expected daily: ${totalMonthly / 30} (approx)`);
  console.log(`Expected for 30 days: ${totalMonthly}`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
