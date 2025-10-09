
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Upload, Database, AlertTriangle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Backup {
  id?: string;
  name: string;
  type: string;
  size: number;
  created: string;
  source?: 'database' | 'file';
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [backupType, setBackupType] = useState<'full' | 'data-only'>('data-only');
  const [isProduction, setIsProduction] = useState(false);
  const { toast } = useToast();

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backups/list');
      const data = await response.json();
      
      if (data.backups) {
        setBackups(data.backups);
        setIsProduction(data.isProduction || false);
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
    setShowCreateDialog(false);
    try {
      const response = await fetch('/api/backups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: backupType })
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: data.message || 'Бэкап успешно создан',
        });
        
        // Если бэкап возвращается в ответе (fallback режим), предлагаем скачать
        if (data.backup && data.warning) {
          toast({
            title: 'Внимание',
            description: data.warning,
            variant: 'default'
          });
          
          // Автоматически скачиваем бэкап
          const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || `backup_${new Date().toISOString()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        
        await loadBackups();
      } else {
        throw new Error(data.error || data.details);
      }
    } catch (error: any) {
      console.error('Backup creation error:', error);
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
      const requestBody = isProduction && selectedBackup.id
        ? { backupId: selectedBackup.id }
        : { backupFile: selectedBackup.name };
        
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
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
            {isProduction && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                Production
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {isProduction ? (
              <>
                Бэкапы сохраняются в базе данных через Prisma. 
                Этот метод работает во всех окружениях, включая serverless и managed hosting.
                Хранятся последние 10 бэкапов.
              </>
            ) : (
              <>
                Создание и восстановление бэкапов базы данных. 
                Автоматические бэкапы создаются каждый час (хранятся последние 10 каждого типа).
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)} disabled={creating}>
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
                  <TableHead>Тип</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Бэкапы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup) => (
                    <TableRow key={backup.name}>
                      <TableCell className="font-mono text-sm">
                        {backup.name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          backup.type === 'full' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          backup.type === 'data-only' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {backup.type === 'full' ? '📦 Full' :
                           backup.type === 'data-only' ? '📊 Data Only' :
                           '📄 Legacy'}
                        </span>
                      </TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell>{formatDate(backup.created)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(backup);
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Создание бэкапа
            </DialogTitle>
            <DialogDescription>
              Выберите тип бэкапа для создания
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup value={backupType} onValueChange={(val) => setBackupType(val as 'full' | 'data-only')}>
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="full" id="full" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="full" className="font-semibold cursor-pointer">
                    📦 Full backup (схема + данные)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Полный бэкап включает структуру базы данных и все данные. 
                    Используется для полного восстановления или переноса базы.
                  </p>
                  <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-700 dark:text-blue-300">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Восстановление перезапишет всю структуру и данные базы</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="data-only" id="data-only" />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="data-only" className="font-semibold cursor-pointer">
                    📊 Data-only backup (только данные)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Бэкап только данных без структуры базы. 
                    Используется для восстановления данных в измененную схему.
                  </p>
                  <div className="flex items-start gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950 rounded text-xs text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Безопасно для восстановления после изменений схемы (новые поля получат значения по умолчанию)</span>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={createBackup}>
              <Download className="mr-2 h-4 w-4" />
              Создать бэкап
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <span className="font-semibold">{selectedBackup?.name}</span>?
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
