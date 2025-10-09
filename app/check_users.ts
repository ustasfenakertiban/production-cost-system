import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
    
    console.log('=== Пользователи в базе данных ===');
    if (users.length === 0) {
      console.log('Пользователей не найдено!');
    } else {
      console.log(`Найдено пользователей: ${users.length}`);
      users.forEach(user => {
        console.log(`- ${user.email} (${user.name || 'без имени'}) - создан ${user.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
