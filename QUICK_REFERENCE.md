
# 🚀 Быстрая справка по бэкапам

## Основные команды

### 💾 Создать бэкап вручную
```bash
cd /home/ubuntu/production_cost_system && ./backup.sh
```

### 🔄 Восстановить из бэкапа (интерактивно)
```bash
cd /home/ubuntu/production_cost_system && ./restore.sh
```

### 📊 Посмотреть все бэкапы
```bash
ls -lht /home/ubuntu/production_cost_system/backups/
```

### 📝 Просмотр логов
```bash
# Последние 20 строк
tail -20 /home/ubuntu/production_cost_system/backup.log

# Следить в реальном времени
tail -f /home/ubuntu/production_cost_system/backup.log
```

### ⚙️ Управление расписанием
```bash
# Посмотреть текущее расписание
crontab -l

# Изменить расписание
crontab -e

# Отключить автоматические бэкапы
crontab -r
```

## 📅 Расписание бэкапов

**Текущее:** Каждый час в 00 минут  
**Хранение:** Последние 10 бэкапов  
**Папка:** `/home/ubuntu/production_cost_system/backups/`

### Примеры расписаний для crontab:

```bash
# Каждый час
0 * * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1

# Каждые 30 минут
*/30 * * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1

# Каждые 2 часа
0 */2 * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1

# Каждый день в 3:00 ночи
0 3 * * * /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1

# Каждую неделю в воскресенье в 2:00
0 2 * * 0 /home/ubuntu/production_cost_system/backup.sh >> /home/ubuntu/production_cost_system/backup.log 2>&1
```

## 🔍 Проверка системы

```bash
# Статус cron
sudo service cron status

# Последний бэкап
ls -lt /home/ubuntu/production_cost_system/backups/ | head -2

# Размер всех бэкапов
du -sh /home/ubuntu/production_cost_system/backups/

# Количество бэкапов
ls -1 /home/ubuntu/production_cost_system/backups/backup_*.sql | wc -l
```

## ⚠️ Важно

- Бэкапы создаются автоматически каждый час
- Хранятся только последние 10 бэкапов
- Перед восстановлением автоматически создается страховочный бэкап
- Восстановление УДАЛЯЕТ все текущие данные!

## 📖 Подробная документация

Полная инструкция: `/home/ubuntu/production_cost_system/BACKUP_README.md`
