import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password
    });

    if (user.password) {
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`Password test for "${testPassword}":`, isValid ? '✅ VALID' : '❌ INVALID');
      
      // Let's also check the hash format
      console.log('Password hash starts with:', user.password.substring(0, 10));
    }

    // List all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log('\nAll users in database:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - created: ${u.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
