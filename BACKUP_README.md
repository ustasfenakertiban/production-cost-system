
# 🔄 Автоматические бэкапы базы данных

## 📋 Описание системы

Система автоматического резервного копирования PostgreSQL базы данных с ротацией бэкапов.

### ⏰ Расписание
- **Частота**: Каждый час (в 0 минут каждого часа)
- **Первый запуск**: В следующий полный час после настройки
- **Хранение**: Последние 10 бэкапов (старые удаляются автоматически)

### 📂 Расположение файлов

```
/home/ubuntu/production_cost_system/
├── backup.sh              # Скрипт бэкапа
├── backup.log            # Лог всех операций бэкапа
└── backups/              # Папка с бэкапами
    ├── backup_20251005_120000.sql
    ├── backup_20251005_130000.sql
    └── ...
```

## 🚀 Использование

### Ручной запуск бэкапа
```bash
cd /home/ubuntu/production_cost_system
./backup.sh
```

### Просмотр логов
```bash
# Последние 20 строк
tail -20 /home/ubuntu/production_cost_system/backup.log

# Непрерывный просмотр
tail -f /home/ubuntu/production_cost_system/backup.log
```

### Список всех бэкапов
```bash
ls -lh /home/ubuntu/production_cost_system/backups/
```

## 🔧 Восстановление из бэкапа

### 1. Выбрать нужный бэкап
```bash
ls -lh /home/ubuntu/production_cost_system/backups/
```

### 2. Восстановить базу данных
```bash
# Загрузить переменные окружения
cd /home/ubuntu/production_cost_system/app
export $(grep -v '^#' .env | xargs)

# Восстановить из выбранного бэкапа
psql "$DATABASE_URL" < /home/ubuntu/production_cost_system/backups/backup_20251005_120000.sql
```

### 3. Полное восстановление (с пересозданием БД)
```bash
# ВНИМАНИЕ: Удаляет все текущие данные!
cd /home/ubuntu/production_cost_system/app
export $(grep -v '^#' .env | xargs)

# Пересоздать схему
yarn prisma migrate reset --force

# Восстановить данные из бэкапа
psql "$DATABASE_URL" < /home/ubuntu/production_cost_system/backups/backup_YYYYMMDD_HHMMSS.sql
```

## ⚙️ Управление cron-задачей

### Просмотр расписания
```bash
crontab -l
```

### Редактирование расписания
```bash
crontab -e
```

### Изменить частоту бэкапов
```bash
# Каждые 30 минут
30 * * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1

# Каждые 2 часа
0 */2 * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1

# Каждый день в 2:00 ночи
0 2 * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1
```

### Отключить автоматические бэкапы
```bash
crontab -r
```

## 📊 Мониторинг

### Проверить статус cron
```bash
sudo service cron status
```

### Последний бэкап
```bash
ls -lt /home/ubuntu/production_cost_system/backups/ | head -n 2
```

### Размер всех бэкапов
```bash
du -sh /home/ubuntu/production_cost_system/backups/
```

## 🔍 Проверка бэкапа

### Проверить целостность бэкапа
```bash
# Проверить, что файл не пустой
wc -l /home/ubuntu/production_cost_system/backups/backup_20251005_120000.sql

# Проверить наличие таблиц в бэкапе
grep "CREATE TABLE" /home/ubuntu/production_cost_system/backups/backup_20251005_120000.sql
```

## ⚠️ Важные замечания

1. **Версия PostgreSQL**: Система использует PostgreSQL 17 для совместимости с сервером
2. **Ротация**: Автоматически сохраняются только последние 10 бэкапов
3. **Место на диске**: Следите за доступным местом, особенно если БД большая
4. **Безопасность**: Бэкапы содержат все данные, включая чувствительную информацию

## 🆘 Решение проблем

### Бэкапы не создаются
```bash
# Проверить cron
sudo service cron status

# Проверить права на скрипт
ls -l /home/ubuntu/production_cost_system/backup.sh

# Сделать скрипт исполняемым
chmod +x /home/ubuntu/production_cost_system/backup.sh

# Проверить ошибки
tail -50 /home/ubuntu/production_cost_system/backup.log
```

### Ошибка "permission denied"
```bash
chmod +x /home/ubuntu/production_cost_system/backup.sh
```

### Ошибка подключения к БД
```bash
# Проверить DATABASE_URL
cd /home/ubuntu/production_cost_system/app
grep DATABASE_URL .env

# Проверить подключение
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -c "SELECT version();"
```

## 📞 Дополнительная информация

При возникновении проблем:
1. Проверьте логи: `tail -50 /home/ubuntu/production_cost_system/backup.log`
2. Запустите бэкап вручную: `./backup.sh`
3. Проверьте статус cron: `sudo service cron status`
