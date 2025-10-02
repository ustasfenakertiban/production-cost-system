require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  try {
    const operationChains = await prisma.operationChain.count();
    const operations = await prisma.productionOperation.count();
    const materials = await prisma.material.count();
    const equipment = await prisma.equipment.count();
    const roles = await prisma.employeeRole.count();
    
    console.log('=== Database Status ===');
    console.log('Operation Chains:', operationChains);
    console.log('Production Operations:', operations);
    console.log('Materials:', materials);
    console.log('Equipment:', equipment);
    console.log('Employee Roles:', roles);
    console.log('=====================');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
