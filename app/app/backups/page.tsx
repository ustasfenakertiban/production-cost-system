
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
  ArrowLeft
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
  filename: string;
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

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backups/list');
      if (response.ok) {
        const data = await response.json();
        // Преобразуем данные из БД-формата в формат, ожидаемый компонентом
        const formattedBackups = (data.backups || []).map((backup: any) => ({
          filename: backup.name,
          size: backup.size,
          created: backup.created,
          metadata: {
            reason: 'manual',
            timestamp: backup.created
          }
        }));
        setBackups(formattedBackups);
      } else {
        toast.error('Ошибка загрузки списка бэкапов');
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Ошибка загрузки списка бэкапов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
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

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Бэкап успешно создан');
        
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
        
        loadBackups();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка создания бэкапа');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Ошибка создания бэкапа');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      // Получаем список бэкапов, чтобы найти ID
      const response = await fetch('/api/backups/list');
      if (!response.ok) {
        toast.error('Ошибка загрузки списка бэкапов');
        return;
      }
      
      const data = await response.json();
      const backup = data.backups.find((b: any) => b.name === filename);
      
      if (!backup || !backup.id) {
        toast.error('Бэкап не найден');
        return;
      }
      
      // Скачиваем бэкап используя правильный endpoint
      const downloadResponse = await fetch(`/api/backups/download?id=${backup.id}`);
      
      if (!downloadResponse.ok) {
        toast.error('Ошибка скачивания бэкапа');
        return;
      }
      
      // Получаем blob и создаем ссылку для скачивания
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Очистка
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Бэкап скачан');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Ошибка скачивания бэкапа');
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;

    try {
      // Получаем ID бэкапа из БД
      const listResponse = await fetch('/api/backups/list');
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

  const handleRestore = async () => {
    if (!selectedBackup) return;

    setRestoring(true);
    try {
      // Получаем ID бэкапа из БД
      const listResponse = await fetch('/api/backups/list');
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
        body: JSON.stringify({ backupId: backup.id }),
      });

      if (response.ok) {
        toast.success('Данные успешно восстановлены из бэкапа');
        window.location.href = '/';
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка восстановления из бэкапа');
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error(error.message || 'Ошибка восстановления из бэкапа');
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
      setSelectedBackup(null);
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

  const getBackupTypeLabel = (reason?: string): string => {
    switch (reason) {
      case 'manual':
        return 'Ручной';
      case 'auto':
        return 'Автоматический';
      case 'before_restore':
        return 'Перед восстановлением';
      default:
        return 'Неизвестный';
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
            Создание бэкапа
          </CardTitle>
          <CardDescription>
            Создайте резервную копию всех данных системы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            disabled={creating}
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            {creating ? 'Создание...' : 'Создать новый бэкап'}
          </Button>
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
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3" />
                          {getBackupTypeLabel(backup.metadata?.reason)}
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
                    Используйте перед внесением изменений в схему базы данных.
                  </p>
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
            <AlertDialogDescription>
              Все текущие данные будут заменены данными из бэкапа{' '}
              <strong>{selectedBackup}</strong>.
              <br />
              <br />
              Перед восстановлением будет автоматически создан бэкап текущих данных.
              <br />
              <br />
              Это действие нельзя отменить. Вы уверены?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring}>
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
