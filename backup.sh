
#!/bin/bash

# Скрипт автоматического бэкапа PostgreSQL базы данных
# Хранит последние 10 бэкапов, удаляет более старые

# Папка для хранения бэкапов
BACKUP_DIR="/home/ubuntu/production_cost_system/backups"

# Создаем папку, если её нет
mkdir -p "$BACKUP_DIR"

# Загружаем переменные окружения из .env файла
if [ -f "/home/ubuntu/production_cost_system/app/.env" ]; then
    export $(grep -v '^#' /home/ubuntu/production_cost_system/app/.env | xargs)
fi

# Имя файла бэкапа с временной меткой
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# Создаем бэкап
echo "$(date): Создание бэкапа базы данных..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>&1

# Проверяем успешность бэкапа
if [ $? -eq 0 ]; then
    echo "$(date): Бэкап успешно создан: $BACKUP_FILE"
    
    # Получаем размер файла
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "$(date): Размер бэкапа: $SIZE"
    
    # Удаляем старые бэкапы, оставляя только последние 10
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l)
    
    if [ $BACKUP_COUNT -gt 10 ]; then
        echo "$(date): Найдено $BACKUP_COUNT бэкапов, удаляем старые..."
        ls -1t "$BACKUP_DIR"/backup_*.sql | tail -n +11 | xargs rm -f
        echo "$(date): Старые бэкапы удалены. Осталось 10 последних."
    else
        echo "$(date): Всего бэкапов: $BACKUP_COUNT"
    fi
else
    echo "$(date): ОШИБКА при создании бэкапа!"
    exit 1
fi

echo "$(date): Готово!"
