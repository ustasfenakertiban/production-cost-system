
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertCircle, CheckCircle, Database, HardDrive } from 'lucide-react';

interface SystemStatus {
  environment: string;
  database: {
    connected: boolean;
    counts: Record<string, number>;
    totalRecords: number;
    isEmpty: boolean;
  };
  backup: {
    tableExists: boolean;
    count: number;
    lastBackup: {
      id: string;
      createdAt: string;
      type: string;
      size: number;
      filename: string;
    } | null;
  };
  timestamp: string;
}

export function SystemStatusChecker() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || 'Неизвестная ошибка');
      }
    } catch (err: any) {
      setError('Не удалось получить статус системы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Статус системы
        </CardTitle>
        <CardDescription>
          Проверка состояния базы данных и системы бэкапов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkStatus} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Проверка...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Проверить статус
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Ошибка</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {status && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  База данных подключена
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Окружение: {status.environment}
                </p>
              </div>
            </div>

            {status.database.isEmpty && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    База данных пуста
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Данные не найдены. Начните добавлять данные или восстановите из бэкапа.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Данные в базе
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Продукты</p>
                  <p className="font-medium">{status.database.counts.products}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Материалы</p>
                  <p className="font-medium">{status.database.counts.materials}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Оборудование</p>
                  <p className="font-medium">{status.database.counts.equipment}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Роли</p>
                  <p className="font-medium">{status.database.counts.employeeRoles}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Процессы</p>
                  <p className="font-medium">{status.database.counts.productionProcesses}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Операции</p>
                  <p className="font-medium">{status.database.counts.operations}</p>
                </div>
              </div>
              <div className="p-2 rounded bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Всего записей</p>
                <p className="text-lg font-bold">{status.database.totalRecords}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Система бэкапов
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted">
                  <span className="text-muted-foreground">Таблица создана</span>
                  <span className="font-medium">
                    {status.backup.tableExists ? '✓ Да' : '✗ Нет'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted">
                  <span className="text-muted-foreground">Количество бэкапов</span>
                  <span className="font-medium">{status.backup.count}</span>
                </div>
                {status.backup.lastBackup && (
                  <div className="p-2 rounded bg-muted space-y-1">
                    <p className="text-muted-foreground">Последний бэкап:</p>
                    <p className="font-medium">{status.backup.lastBackup.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(status.backup.lastBackup.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Обновлено: {new Date(status.timestamp).toLocaleString('ru-RU')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
