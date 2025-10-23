require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const orders = await prisma.order.findMany();
    if (orders.length === 0) {
      console.log('Нет заказов');
      return;
    }
    
    const settings = await prisma.simulationSettingsV2.findFirst({
      where: { orderId: orders[0].id }
    });
    
    if (!settings) {
      console.log('⚠️ НЕТ НАСТРОЕК СИМУЛЯЦИИ');
      return;
    }
    
    console.log('Сырые данные настроек симуляции:');
    console.log(JSON.stringify(settings, null, 2));
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
