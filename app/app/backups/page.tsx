
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download, 
  Trash2, 
  RotateCcw, 
  Plus,
  Database,
  Clock,
  HardDrive,
  ArrowLeft,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface BackupInfo {
  id?: string;
  filename: string;
  type?: string;
  size: number;
  created: string;
  metadata?: {
    reason: 'manual' | 'auto' | 'before_restore';
    timestamp: string;
  };
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [backupType, setBackupType] = useState<'data-only' | 'full'>('data-only');
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadBackups = async () => {
    try {
      console.log('[Client] Loading backups list...');
      // Добавляем параметр для предотвращения кэширования
      const response = await fetch('/api/backups/list?' + new Date().getTime(), {
        credentials: 'include',
        cache: 'no-store' // Отключаем кэширование
      });
      console.log('[Client] Backups list response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Client] Backups list data:', data);
        console.log('[Client] Number of backups:', data.backups?.length || 0);
        
        // Преобразуем данные из БД-формата в формат, ожидаемый компонентом
        const formattedBackups = (data.backups || []).map((backup: any) => ({
          id: backup.id,
          filename: backup.name,
          type: backup.type || 'unknown',
          size: backup.size,
          created: backup.created,
          metadata: {
            reason: 'manual',
            timestamp: backup.created
          }
        }));
        
        console.log('[Client] Formatted backups:', formattedBackups.length);
        setBackups(formattedBackups);
      } else {
        console.error('[Client] Failed to load backups, status:', response.status);
        toast.error('Ошибка загрузки списка бэкапов');
      }
    } catch (error) {
      console.error('[Client] Error loading backups:', error);
      toast.error('Ошибка загрузки списка бэкапов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleUploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/backups/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Бэкап успешно загружен');
        loadBackups();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка загрузки бэкапа');
      }
    } catch (error) {
      console.error('Error uploading backup:', error);
      toast.error('Ошибка загрузки бэкапа');
    } finally {
      setUploading(false);
      // Сбрасываем input для возможности загрузить тот же файл снова
      event.target.value = '';
    }
  };

  const handleSyncBackups = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/backups/sync', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadBackups();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка синхронизации');
      }
    } catch (error) {
      console.error('Error syncing backups:', error);
      toast.error('Ошибка синхронизации');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setShowCreateDialog(false);
    
    console.log('[Client] Starting backup creation, type:', backupType);
    toast.loading('Создание бэкапа...', { id: 'backup-create' });
    
    try {
      console.log('[Client] Sending request to /api/backups/create');
      const response = await fetch('/api/backups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type: backupType })
      });

      console.log('[Client] Response status:', response.status);
      console.log('[Client] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[Client] Response data:', data);
        
        toast.success(data.message || 'Бэкап успешно создан', { id: 'backup-create' });
        
        // Если бэкап возвращается в ответе (fallback режим), предлагаем скачать
        if (data.backup && data.warning) {
          toast.warning(data.warning);
          
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
        
        // Небольшая задержка для надежности, затем обновляем список
        console.log('[Client] Waiting 2 seconds before reloading list...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('[Client] Reloading backups list');
        setLoading(true);
        await loadBackups();
        
        console.log('[Client] List reloaded successfully');
        toast.success('Список обновлён', { id: 'backup-list-reload' });
      } else {
        const data = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        console.error('[Client] Error response:', data);
        toast.error(data.error || 'Ошибка создания бэкапа', { id: 'backup-create' });
      }
    } catch (error) {
      console.error('[Client] Error creating backup:', error);
      toast.error('Ошибка создания бэкапа: ' + (error instanceof Error ? error.message : 'неизвестная ошибка'), { id: 'backup-create' });
    } finally {
      setCreating(false);
      console.log('[Client] Backup creation finished');
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      console.log('[Client] Starting download for:', filename);
      
      // Получаем список бэкапов, чтобы найти ID
      const response = await fetch('/api/backups/list', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('[Client] Failed to fetch backup list:', response.status);
        toast.error('Ошибка загрузки списка бэкапов');
        return;
      }
      
      const data = await response.json();
      console.log('[Client] Backup list response:', data);
      console.log('[Client] Looking for filename:', filename);
      
      const backup = data.backups.find((b: any) => b.name === filename);
      console.log('[Client] Found backup:', backup);
      
      if (!backup) {
        console.error('[Client] Backup not found in list');
        toast.error('Бэкап не найден в списке');
        return;
      }
      
      if (!backup.id) {
        console.error('[Client] Backup has no ID');
        toast.error('У бэкапа нет ID');
        return;
      }
      
      // Скачиваем бэкап используя правильный endpoint
      const downloadUrl = `/api/backups/download?id=${backup.id}`;
      console.log('[Client] Downloading from:', downloadUrl);
      
      const downloadResponse = await fetch(downloadUrl, {
        credentials: 'include' // Важно! Передаём cookies с сессией
      });
      console.log('[Client] Download response status:', downloadResponse.status);
      console.log('[Client] Download response headers:', Object.fromEntries(downloadResponse.headers.entries()));
      
      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('[Client] Download failed:', errorText);
        toast.error(`Ошибка скачивания: ${errorText}`);
        return;
      }
      
      // Получаем blob и создаем ссылку для скачивания
      const blob = await downloadResponse.blob();
      console.log('[Client] Blob created, size:', blob.size, 'type:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      console.log('[Client] Click triggered for download');
      
      // Очистка
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('[Client] Cleanup completed');
      }, 100);
      
      toast.success('Бэкап скачан');
    } catch (error) {
      console.error('[Client] Error downloading backup:', error);
      toast.error('Ошибка скачивания бэкапа: ' + (error instanceof Error ? error.message : 'неизвестная ошибка'));
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;

    try {
      // Получаем ID бэкапа из БД
      const listResponse = await fetch('/api/backups/list', {
        credentials: 'include'
      });
      if (!listResponse.ok) {
        throw new Error('Не удалось получить список бэкапов');
      }
      
      const listData = await listResponse.json();
      const backup = listData.backups.find((b: any) => b.name === selectedBackup);
      
      if (!backup || !backup.id) {
        throw new Error('Бэкап не найден');
      }

      const response = await fetch(`/api/backups/${backup.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Бэкап удален');
        loadBackups();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления бэкапа');
      }
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      toast.error(error.message || 'Ошибка удаления бэкапа');
    } finally {
      setShowDeleteDialog(false);
      setSelectedBackup(null);
    }
  };

  const handleRestore = async (ignoreWarnings: boolean = false) => {
    if (!selectedBackup) return;

    setRestoring(true);
    try {
      // Получаем ID бэкапа из БД
      const listResponse = await fetch('/api/backups/list', {
        credentials: 'include'
      });
      if (!listResponse.ok) {
        throw new Error('Не удалось получить список бэкапов');
      }
      
      const listData = await listResponse.json();
      const backup = listData.backups.find((b: any) => b.name === selectedBackup);
      
      if (!backup || !backup.id) {
        throw new Error('Бэкап не найден');
      }

      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          backupId: backup.id,
          ignoreWarnings 
        }),
      });

      if (response.ok) {
        toast.success('Данные успешно восстановлены из бэкапа');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const data = await response.json();
        
        // Если схема несовместима, показываем предупреждение
        if (data.error === 'schema_incompatible' && !ignoreWarnings) {
          setRestoring(false);
          const confirmRestore = window.confirm(
            `⚠️ ПРЕДУПРЕЖДЕНИЕ О НЕСОВМЕСТИМОСТИ СХЕМЫ\n\n` +
            `${data.warning}\n\n` +
            `Тип бэкапа: ${getBackupTypeLabel(backup.type)}\n\n` +
            (backup.type === 'full' 
              ? `⚠️ ВНИМАНИЕ: Этот бэкап содержит структуру базы данных!\n` +
                `При восстановлении:\n` +
                `• Структура базы данных будет заменена на старую версию\n` +
                `• Все новые поля и таблицы будут УДАЛЕНЫ\n` +
                `• Это может привести к потере данных и функциональности\n\n`
              : `Рекомендация: используйте бэкапы типа "Только данные" при регулярном восстановлении.\n\n`
            ) +
            `Вы ДЕЙСТВИТЕЛЬНО хотите продолжить?`
          );
          
          if (confirmRestore) {
            // Повторяем запрос с ignoreWarnings = true
            handleRestore(true);
          } else {
            setShowRestoreDialog(false);
            setSelectedBackup(null);
          }
        } else {
          toast.error(data.error || 'Ошибка восстановления из бэкапа');
        }
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error(error.message || 'Ошибка восстановления из бэкапа');
    } finally {
      if (!ignoreWarnings) {
        setRestoring(false);
        setShowRestoreDialog(false);
        setSelectedBackup(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBackupTypeLabel = (type?: string): string => {
    switch (type) {
      case 'data-only':
        return 'Только данные';
      case 'full':
        return 'Данные + структура';
      default:
        return 'Неизвестный';
    }
  };

  const getBackupTypeBadgeColor = (type?: string): string => {
    switch (type) {
      case 'data-only':
        return 'bg-blue-100 text-blue-800';
      case 'full':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться в главное меню
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Управление бэкапами</h1>
        <p className="text-muted-foreground">
          Создавайте, скачивайте и восстанавливайте бэкапы базы данных
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Управление бэкапами
          </CardTitle>
          <CardDescription>
            Создайте, загрузите или синхронизируйте резервные копии
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              disabled={creating}
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              {creating ? 'Создание...' : 'Создать новый бэкап'}
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              disabled={uploading}
              onClick={() => document.getElementById('backup-file-input')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Загрузка...' : 'Загрузить файл бэкапа'}
            </Button>
            <input
              id="backup-file-input"
              type="file"
              accept=".json,.sql"
              style={{ display: 'none' }}
              onChange={handleUploadBackup}
            />

            <Button 
              variant="outline" 
              size="lg"
              disabled={syncing}
              onClick={handleSyncBackups}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Синхронизация...' : 'Синхронизировать с диском'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            💡 <strong>Совет:</strong> Используйте "Синхронизировать с диском" для синхронизации базы данных с облачным хранилищем S3. 
            Это удалит записи о несуществующих файлах и добавит новые файлы из S3
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Список бэкапов
          </CardTitle>
          <CardDescription>
            Всего бэкапов: {backups.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Бэкапы отсутствуют. Создайте первый бэкап.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя файла</TableHead>
                    <TableHead>Тип</TableHead>
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
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBackupTypeBadgeColor(backup.type)}`}>
                          <Database className="h-3 w-3" />
                          {getBackupTypeLabel(backup.type)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(backup.created)}</TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(backup.filename)}
                            title="Скачать бэкап"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup.filename);
                              setShowRestoreDialog(true);
                            }}
                            title="Восстановить из бэкапа"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup.filename);
                              setShowDeleteDialog(true);
                            }}
                            title="Удалить бэкап"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Выберите тип бэкапа</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите, какие данные следует включить в резервную копию
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <RadioGroup value={backupType} onValueChange={(value: 'data-only' | 'full') => setBackupType(value)}>
              <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg mb-3 cursor-pointer hover:bg-accent" onClick={() => setBackupType('data-only')}>
                <RadioGroupItem value="data-only" id="data-only" />
                <div className="flex-1">
                  <Label htmlFor="data-only" className="font-medium cursor-pointer">
                    Только данные
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Создаёт бэкап всех данных (продукты, материалы, операции и т.д.) без структуры базы данных. 
                    Рекомендуется для регулярного резервного копирования.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setBackupType('full')}>
                <RadioGroupItem value="full" id="full" />
                <div className="flex-1">
                  <Label htmlFor="full" className="font-medium cursor-pointer">
                    Данные + структура
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Создаёт полный бэкап, включая структуру базы данных и все данные.
                  </p>
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <strong>⚠️ Осторожно:</strong> При восстановлении этого типа бэкапа структура БД будет заменена на старую версию. 
                    Все новые поля и таблицы будут удалены. Используйте только для полного отката системы.
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateBackup} disabled={creating}>
              {creating ? 'Создание...' : 'Создать бэкап'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Восстановить из бэкапа?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Все текущие данные будут заменены данными из бэкапа{' '}
                <strong>{selectedBackup}</strong>.
              </div>
              
              {(() => {
                const backup = backups.find(b => b.filename === selectedBackup);
                if (backup?.type === 'full') {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold text-lg">⚠️</span>
                        <div className="text-sm text-amber-800">
                          <strong>ВНИМАНИЕ:</strong> Этот бэкап типа "Данные + структура"!
                          <br />
                          При восстановлении структура базы данных будет заменена на старую версию.
                          <br />
                          Все новые поля и таблицы, добавленные после создания бэкапа, будут удалены.
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div>
                Перед восстановлением будет автоматически создан бэкап текущих данных.
              </div>
              
              <div className="font-semibold">
                Это действие нельзя отменить. Вы уверены?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRestore(false)} disabled={restoring}>
              {restoring ? 'Восстановление...' : 'Восстановить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить бэкап?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить бэкап{' '}
              <strong>{selectedBackup}</strong>?
              <br />
              <br />
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
