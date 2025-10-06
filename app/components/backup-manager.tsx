
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Download, Upload, Database, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Backup {
  name: string;
  size: number;
  created: string;
  path: string;
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const { toast } = useToast();

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backups/list');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить список бэкапов',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/backups/create', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Бэкап успешно создан',
        });
        await loadBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать бэкап',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;
    
    setRestoring(true);
    try {
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupFile: selectedBackup })
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Данные успешно восстановлены из бэкапа',
        });
        setShowRestoreDialog(false);
        setSelectedBackup(null);
        
        // Перезагружаем страницу для обновления данных
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось восстановить данные',
        variant: 'destructive'
      });
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    loadBackups();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Управление бэкапами
          </CardTitle>
          <CardDescription>
            Создание и восстановление бэкапов базы данных. 
            Автоматические бэкапы создаются каждый час (хранятся последние 10).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={createBackup} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Создать бэкап
                </>
              )}
            </Button>
            <Button onClick={loadBackups} variant="outline" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Обновить список'
              )}
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Бэкапы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup) => (
                    <TableRow key={backup.name}>
                      <TableCell className="font-mono text-sm">
                        {backup.name}
                      </TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell>{formatDate(backup.created)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(backup.name);
                            setShowRestoreDialog(true);
                          }}
                          disabled={restoring}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Восстановить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Восстановление из бэкапа
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Вы уверены, что хотите восстановить данные из бэкапа{' '}
                <span className="font-semibold">{selectedBackup}</span>?
              </p>
              <p className="text-yellow-600 dark:text-yellow-500 font-semibold">
                ⚠️ Все текущие данные будут заменены данными из бэкапа!
              </p>
              <p>Это действие нельзя отменить.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={restoreBackup}
              disabled={restoring}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {restoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Восстановление...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Восстановить
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
