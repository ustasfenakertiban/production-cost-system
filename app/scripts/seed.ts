
import { PrismaClient, PaymentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаю заполнение базы данных...');

  // Очистка существующих данных
  await prisma.product.deleteMany();
  await prisma.employeeRole.deleteMany();
  await prisma.equipment.deleteMany();

  // Заполнение таблицы Оборудование
  const equipment = await prisma.equipment.createMany({
    data: [
      {
        name: '3D-принтер Ultimaker S3',
        estimatedCost: 850000,
        hourlyDepreciation: 35.42,
        maxProductivity: 50,
        productivityUnits: 'этикеток/час',
        comment: 'Основной принтер для производства 3D этикеток',
      },
      {
        name: 'Станок лазерной резки CO2',
        estimatedCost: 1200000,
        hourlyDepreciation: 50,
        maxProductivity: 100,
        productivityUnits: 'заготовок/час',
        comment: 'Для резки и гравировки заготовок',
      },
      {
        name: 'УФ-принтер Roland LEF-200',
        estimatedCost: 750000,
        hourlyDepreciation: 31.25,
        maxProductivity: 80,
        productivityUnits: 'этикеток/час',
        comment: 'Печать цветных этикеток с УФ-отверждением',
      },
      {
        name: 'Термопресс 40x60 см',
        estimatedCost: 120000,
        hourlyDepreciation: 5,
        maxProductivity: 200,
        productivityUnits: 'изделий/час',
        comment: 'Для нанесения термопереводных пленок',
      },
      {
        name: 'Ламинатор GMP BluePrint BP-420E5+',
        estimatedCost: 180000,
        hourlyDepreciation: 7.5,
        maxProductivity: 150,
        productivityUnits: 'этикеток/час',
        comment: 'Ламинирование готовых этикеток',
      }
    ]
  });

  // Заполнение таблицы Роли сотрудников
  const employeeRoles = await prisma.employeeRole.createMany({
    data: [
      {
        name: 'Оператор 3D-принтера',
        paymentType: PaymentType.HOURLY,
        hourlyRate: 500,
      },
      {
        name: 'Дизайнер этикеток',
        paymentType: PaymentType.PIECE_RATE,
        hourlyRate: 800,
      },
      {
        name: 'Оператор лазерной резки',
        paymentType: PaymentType.HOURLY,
        hourlyRate: 600,
      },
      {
        name: 'Мастер участка',
        paymentType: PaymentType.HOURLY,
        hourlyRate: 900,
      },
      {
        name: 'Контролер качества',
        paymentType: PaymentType.HOURLY,
        hourlyRate: 450,
      },
      {
        name: 'Упаковщик',
        paymentType: PaymentType.PIECE_RATE,
        hourlyRate: 350,
      }
    ]
  });

  // Заполнение таблицы Товары/Продукты
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Этикетка для водки премиум',
        description: 'Рельефная 3D этикетка с золотым тиснением для бутылок водки премиум-класса. Размер 120x80мм',
        imagePath: null, // Изображения будем добавлять позже через интерфейс
      },
      {
        name: 'Этикетка пивная классическая',
        description: 'Традиционная этикетка для пивных бутылок с объемным логотипом. Размер 90x120мм',
        imagePath: null,
      },
      {
        name: 'Этикетка для коньяка VIP',
        description: 'Эксклюзивная 3D этикетка с кожаной текстурой и металлическими вставками. Размер 100x140мм',
        imagePath: null,
      },
      {
        name: 'Этикетка винная элитная',
        description: 'Этикетка для элитных вин с тиснением и перламутровым покрытием. Размер 95x130мм',
        imagePath: null,
      },
      {
        name: 'Этикетка для самогона',
        description: 'Стилизованная этикетка с эффектом старения и объемными элементами. Размер 80x100мм',
        imagePath: null,
      },
      {
        name: 'Этикетка подарочная универсальная',
        description: 'Универсальная подарочная этикетка с возможностью персонализации. Размер 70x90мм',
        imagePath: null,
      }
    ]
  });

  console.log(`Создано ${equipment.count} единиц оборудования`);
  console.log(`Создано ${employeeRoles.count} ролей сотрудников`);
  console.log(`Создано ${products.count} продуктов`);
  console.log('База данных успешно заполнена!');
}

main()
  .catch((e) => {
    console.error('Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
