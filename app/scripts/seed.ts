
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  // Проверяем, существует ли уже пользователь
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail }
  });

  if (existingUser) {
    console.log('Тестовый пользователь уже существует');
    return;
  }

  // Создаём хеш пароля
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Создаём пользователя
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      name: 'Test User',
    }
  });

  console.log('Создан тестовый пользователь:', user.email);
  console.log('Email: test@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('Ошибка при выполнении seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
