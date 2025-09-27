
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Создать тестового пользователя
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Тестовый пользователь',
      password: hashedPassword,
    },
  });

  console.log('Тестовый пользователь создан');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
