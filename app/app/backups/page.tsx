
import { BackupManager } from '@/components/backup-manager';

export default function BackupsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Бэкапы базы данных</h1>
        <p className="text-muted-foreground mt-2">
          Управление резервными копиями базы данных
        </p>
      </div>
      
      <BackupManager />
    </div>
  );
}
