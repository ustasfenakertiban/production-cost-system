require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPaymentTypes() {
  try {
    const orders = await prisma.order.findMany();
    if (orders.length === 0) {
      console.log('Нет заказов');
      return;
    }
    
    const batches = await prisma.materialPurchaseBatch.findMany({
      where: { orderId: orders[0].id },
      include: { material: { select: { name: true } } }
    });
    
    console.log(`Проверка типов оплаты для ${batches.length} партий:\n`);
    
    const paymentTypes = {
      prepay100: 0,   // Полная предоплата (100%)
      prepay: 0,      // Частичная предоплата (1-99%)
      postpay: 0,     // Полная постоплата (0%)
    };
    
    batches.forEach(b => {
      const percent = b.prepaymentPercentage || 0;
      if (percent === 100) {
        paymentTypes.prepay100++;
      } else if (percent > 0) {
        paymentTypes.prepay++;
      } else {
        paymentTypes.postpay++;
      }
    });
    
    console.log('Распределение по типам оплаты:');
    console.log(`  Полная предоплата (100%): ${paymentTypes.prepay100}`);
    console.log(`  Частичная предоплата (1-99%): ${paymentTypes.prepay}`);
    console.log(`  Полная постоплата (0%): ${paymentTypes.postpay}`);
    
    console.log('\nПримеры:');
    const examples = [
      batches.find(b => b.prepaymentPercentage === 100),
      batches.find(b => b.prepaymentPercentage > 0 && b.prepaymentPercentage < 100),
      batches.find(b => (b.prepaymentPercentage || 0) === 0)
    ];
    
    examples.forEach((b, i) => {
      if (b) {
        console.log(`\n${i+1}. ${b.material.name}`);
        console.log(`   Предоплата: ${b.prepaymentPercentage}%`);
        console.log(`   Количество: ${b.quantity}`);
        console.log(`   Цена: ${b.pricePerUnit} ₽/ед.`);
        console.log(`   Дни производства: ${b.manufacturingDays}`);
        console.log(`   Дни доставки: ${b.deliveryDays}`);
      }
    });
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentTypes();
