
import { createBackup } from './backup-service';

let backupInterval: NodeJS.Timeout | null = null;

export function startAutoBackup() {
  if (backupInterval) {
    console.log('Auto-backup already running');
    return;
  }

  // Запускаем бэкап каждый час
  backupInterval = setInterval(async () => {
    try {
      console.log('[Auto-Backup]', new Date().toISOString(), 'Creating automatic backup...');
      const filename = await createBackup('auto');
      console.log('[Auto-Backup]', new Date().toISOString(), 'Backup created:', filename);
    } catch (error) {
      console.error('[Auto-Backup] Error:', error);
    }
  }, 60 * 60 * 1000); // Каждый час (60 минут * 60 секунд * 1000 мс)

  console.log('[Auto-Backup] Scheduler started. Backups will be created every hour.');
}

export function stopAutoBackup() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('[Auto-Backup] Scheduler stopped');
  }
}
