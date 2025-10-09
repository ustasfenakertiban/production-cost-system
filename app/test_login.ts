import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@production.local' } });
  if (!user) {
    console.log('❌ Пользователь не найден!');
    return;
  }
  console.log('✅ Пользователь найден:', user.email);
  console.log('Хеш пароля:', user.password?.substring(0, 20) + '...');
  
  const isValid = await bcrypt.compare('admin123', user.password || '');
  console.log('Пароль admin123 валиден?', isValid);
  
  await prisma.$disconnect();
}

check();
