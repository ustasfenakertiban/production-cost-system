
import { BackupManager } from '@/components/backup-manager';
import { SystemStatusChecker } from '@/components/system-status-checker';

export default function BackupsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Бэкапы базы данных</h1>
        <p className="text-muted-foreground mt-2">
          Управление резервными копиями базы данных
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <SystemStatusChecker />
      </div>
      
      <BackupManager />
    </div>
  );
}
