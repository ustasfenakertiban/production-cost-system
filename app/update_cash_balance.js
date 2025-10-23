require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCashBalance() {
  try {
    const settings = await prisma.globalSimulationSettingsV2.findFirst();
    
    if (!settings) {
      console.log('Нет глобальных настроек');
      return;
    }
    
    console.log('Текущий начальный баланс:', settings.initialCashBalance);
    
    // Обновляем начальный баланс на 10 миллионов рублей
    const newBalance = 10000000;
    
    await prisma.globalSimulationSettingsV2.update({
      where: { id: settings.id },
      data: { initialCashBalance: newBalance }
    });
    
    console.log('Обновлен начальный баланс на:', newBalance, '₽');
    console.log('✅ Теперь симуляция сможет выполнять закупки материалов');
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateCashBalance();
