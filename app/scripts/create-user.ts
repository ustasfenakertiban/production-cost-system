
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function createUser() {
  const email = process.argv[2] || "admin@production.local";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Администратор";

  try {
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ Пользователь с email ${email} уже существует!`);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log("✅ Пользователь успешно создан!");
    console.log(`Email: ${user.email}`);
    console.log(`Пароль: ${password}`);
    console.log(`Имя: ${user.name}`);
  } catch (error) {
    console.error("❌ Ошибка при создании пользователя:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
