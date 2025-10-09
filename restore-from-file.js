require('dotenv').config({ path: './app/.env' });
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function restoreBackup(backupFile) {
  console.log(`Restoring from ${backupFile}...`);
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found');
  }

  // Parse connection string
  const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const [, user, password, host, port, database] = match;
  
  console.log(`Connecting to: ${host}:${port}/${database} as ${user}`);

  const env = {
    ...process.env,
    PGPASSWORD: password
  };

  try {
    const cmd = `psql -h ${host} -p ${port} -U ${user} -d ${database} -f ${backupFile}`;
    console.log('Executing restore...');
    
    const { stdout, stderr } = await execAsync(cmd, { 
      env,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    if (stdout) console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);
    
    console.log('\nRestore completed successfully!');
  } catch (error) {
    console.error('Restore error:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    throw error;
  }
}

const backupFile = process.argv[2] || './backups/backup_20251006_000001.sql';
restoreBackup(backupFile).catch(console.error);
