import { BackupManager } from '@/components/backup-manager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BackupPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться в главное меню
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Резервное копирование</h1>
        <p className="text-muted-foreground mt-2">
          Управление резервными копиями базы данных
        </p>
      </div>
      
      <BackupManager />
    </div>
  );
}