const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function restoreBackup(backupFilePath) {
  const prisma = new PrismaClient();
  
  try {
    console.log(`Reading backup file: ${backupFilePath}`);
    const sqlContent = fs.readFileSync(backupFilePath, 'utf8');
    
    // Split SQL commands by semicolon (simple approach)
    // This won't handle all edge cases but should work for pg_dump output
    const commands = sqlContent
      .split(';\n')
      .map(cmd => cmd.trim())
      .filter(cmd => 
        cmd && 
        !cmd.startsWith('--') && 
        !cmd.startsWith('SET ') &&
        !cmd.startsWith('SELECT pg_catalog.set_config') &&
        !cmd.startsWith('\\')
      );
    
    console.log(`Found ${commands.length} SQL commands`);
    console.log('Starting restore...\n');
    
    let executed = 0;
    let failed = 0;
    
    for (const command of commands) {
      if (command.length < 10) continue; // Skip very short commands
      
      try {
        await prisma.$executeRawUnsafe(command + ';');
        executed++;
        if (executed % 10 === 0) {
          process.stdout.write(`\rExecuted: ${executed}/${commands.length}`);
        }
      } catch (error) {
        failed++;
        // Don't log every error, just count them
        if (failed <= 5) {
          console.error(`\nError executing command: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`\n\nRestore completed!`);
    console.log(`Successfully executed: ${executed}`);
    console.log(`Failed: ${failed}`);
    
    // Check results
    console.log('\nChecking restored data...');
    const userCount = await prisma.user.count();
    const backupCount = await prisma.backup.count();
    const productCount = await prisma.product.count();
    const materialCount = await prisma.materials.count();
    
    console.log(`Users: ${userCount}`);
    console.log(`Backups: ${backupCount}`);
    console.log(`Products: ${productCount}`);
    console.log(`Materials: ${materialCount}`);
    
  } catch (error) {
    console.error('Restore error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const backupFile = process.argv[2] || '../backups/backup_20251006_000001.sql';
const fullPath = path.resolve(__dirname, backupFile);

console.log(`Restoring from: ${fullPath}\n`);
restoreBackup(fullPath).catch(console.error);
