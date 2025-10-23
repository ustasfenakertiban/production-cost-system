require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGlobalSettings() {
  try {
    const global = await prisma.globalSimulationSettingsV2.findFirst();
    
    if (!global) {
      console.log('⚠️ НЕТ ГЛОБАЛЬНЫХ НАСТРОЕК СИМУЛЯЦИИ');
      console.log('Симуляция не может работать без глобальных настроек.');
      return;
    }
    
    console.log('Глобальные настройки симуляции:');
    console.log(JSON.stringify(global, null, 2));
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGlobalSettings();
