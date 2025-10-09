
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking existing users...");
  
  const existingUsers = await prisma.user.findMany();
  console.log(`Found ${existingUsers.length} users:`);
  existingUsers.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id})`);
  });

  // Удаляем существующих пользователей
  console.log("\n🗑️  Deleting existing users...");
  await prisma.user.deleteMany({});

  // Создаем нового админа с правильным хэшированием
  console.log("\n✨ Creating new admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      name: "Administrator",
      password: hashedPassword,
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);
  console.log(`   Password: admin123`);
  
  // Проверяем хэш
  console.log("\n🔐 Verifying password hash...");
  const isValid = await bcrypt.compare("admin123", hashedPassword);
  console.log(`   Password hash is ${isValid ? 'VALID' : 'INVALID'}`);

  // Создаем тестового пользователя
  const testPassword = await bcrypt.hash("test123", 10);
  const testUser = await prisma.user.create({
    data: {
      email: "user@test.com",
      name: "Test User",
      password: testPassword,
    },
  });

  console.log(`✅ Created test user: ${testUser.email}`);
  console.log(`   Password: test123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
