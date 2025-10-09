
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const password = 'admin123';
  
  // Проверяем, существует ли пользователь
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    console.log(`Пользователь ${email} уже существует`);
    console.log('Обновляем пароль...');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Пароль обновлен для ${email}`);
  } else {
    console.log(`Создаем нового пользователя ${email}...`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin'
      }
    });
    
    console.log(`✅ Пользователь создан: ${email}`);
  }
  
  console.log('\n=================================');
  console.log('Учетные данные для входа:');
  console.log('Email: admin@test.com');
  console.log('Пароль: admin123');
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
