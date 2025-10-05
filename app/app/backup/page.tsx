
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Database, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Backup {
  filename: string;
  size: number;
  created: string;
  timestamp?: string;
  reason?: string;
  totalRecords?: number;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const { toast } = useToast();

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backup/list');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось загрузить список бэкапов',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при загрузке бэкапов',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/backup/create', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Бэкап создан: ${data.filename}`,
        });
        loadBackups();
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось создать бэкап',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при создании бэкапа',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = (filename: string) => {
    window.open(`/api/backup/download/${filename}`, '_blank');
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setRestoring(true);
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: selectedBackup }),
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Данные успешно восстановлены. Страница будет перезагружена.',
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось восстановить данные',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при восстановлении данных',
      });
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
      setSelectedBackup(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Резервное копирование</h1>
        <p className="text-muted-foreground">
          Управление резервными копиями базы данных
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Создать резервную копию
          </CardTitle>
          <CardDescription>
            Создайте резервную копию текущего состояния базы данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            className="w-full sm:w-auto"
          >
            {creating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Создание бэкапа...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Создать бэкап
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Доступные резервные копии
          </CardTitle>
          <CardDescription>
            {backups.length === 0
              ? 'Резервные копии не найдены'
              : `Всего резервных копий: ${backups.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Резервные копии отсутствуют. Создайте первую резервную копию.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя файла</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.filename}>
                      <TableCell className="font-mono text-sm">
                        {backup.filename}
                      </TableCell>
                      <TableCell>{formatDate(backup.created)}</TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.filename)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Скачать
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup.filename);
                              setShowRestoreDialog(true);
                            }}
                            disabled={restoring}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Восстановить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Подтверждение восстановления
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Вы уверены, что хотите восстановить данные из бэкапа{' '}
                <span className="font-mono font-semibold">{selectedBackup}</span>?
              </p>
              <p className="text-yellow-600 dark:text-yellow-500 font-semibold">
                ⚠️ Все текущие данные будут заменены данными из бэкапа!
              </p>
              <p className="text-sm">
                Перед восстановлением будет автоматически создана резервная копия
                текущего состояния базы данных.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreBackup}
              disabled={restoring}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {restoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Восстановление...
                </>
              ) : (
                'Восстановить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
