
import { startAutoBackup } from './auto-backup-scheduler';

let initialized = false;

export function initializeStartupServices() {
  if (initialized) {
    return;
  }

  console.log('[Startup] Initializing services...');
  
  // Запускаем автоматические бэкапы
  startAutoBackup();
  
  initialized = true;
  console.log('[Startup] Services initialized successfully');
}
