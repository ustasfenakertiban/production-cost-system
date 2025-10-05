
#!/bin/bash

# Скрипт восстановления базы данных из бэкапа

BACKUP_DIR="/home/ubuntu/production_cost_system/backups"
ENV_FILE="/home/ubuntu/production_cost_system/app/.env"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Восстановление базы данных из бэкапа${NC}"
echo "=============================================="
echo ""

# Проверяем наличие бэкапов
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/backup_*.sql 2>/dev/null)" ]; then
    echo -e "${RED}❌ Бэкапы не найдены в $BACKUP_DIR${NC}"
    exit 1
fi

# Показываем список доступных бэкапов
echo "📁 Доступные бэкапы:"
echo ""
ls -lht "$BACKUP_DIR"/backup_*.sql | awk '{printf "%2d) %s  %s  %s %s %s\n", NR, $9, $5, $6, $7, $8}'
echo ""

# Подсчитываем количество бэкапов
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql | wc -l)

# Запрашиваем выбор бэкапа
echo -n "Выберите номер бэкапа для восстановления (1-$BACKUP_COUNT) или 'q' для выхода: "
read CHOICE

if [ "$CHOICE" = "q" ] || [ "$CHOICE" = "Q" ]; then
    echo "Отменено."
    exit 0
fi

# Проверяем корректность выбора
if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt "$BACKUP_COUNT" ]; then
    echo -e "${RED}❌ Неверный выбор!${NC}"
    exit 1
fi

# Получаем путь к выбранному бэкапу
BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/backup_*.sql | sed -n "${CHOICE}p")

echo ""
echo -e "${YELLOW}⚠️  ВНИМАНИЕ!${NC}"
echo "Будет выполнено восстановление из файла:"
echo "  $BACKUP_FILE"
echo ""
echo "Это удалит ВСЕ текущие данные в базе и заменит их данными из бэкапа!"
echo ""
echo -n "Вы уверены? Введите 'yes' для подтверждения: "
read CONFIRMATION

if [ "$CONFIRMATION" != "yes" ]; then
    echo "Отменено."
    exit 0
fi

# Загружаем переменные окружения
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo -e "${RED}❌ Файл .env не найден: $ENV_FILE${NC}"
    exit 1
fi

# Создаем бэкап перед восстановлением
echo ""
echo "📦 Создание страховочного бэкапа перед восстановлением..."
SAFETY_BACKUP="$BACKUP_DIR/before_restore_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$SAFETY_BACKUP" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Страховочный бэкап создан: $SAFETY_BACKUP${NC}"
else
    echo -e "${YELLOW}⚠️  Не удалось создать страховочный бэкап, но продолжаем...${NC}"
fi

# Восстановление из бэкапа
echo ""
echo "🔄 Восстановление из бэкапа..."
psql "$DATABASE_URL" < "$BACKUP_FILE" 2>&1 | grep -v "^SET" | grep -v "^--" | head -20

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ База данных успешно восстановлена!${NC}"
    echo ""
    echo "📊 Информация:"
    echo "  • Восстановлено из: $(basename $BACKUP_FILE)"
    echo "  • Страховочный бэкап: $(basename $SAFETY_BACKUP)"
    echo ""
    echo "💡 Не забудьте перезапустить приложение:"
    echo "   cd /home/ubuntu/production_cost_system/app"
    echo "   yarn prisma generate"
else
    echo ""
    echo -e "${RED}❌ Ошибка при восстановлении базы данных!${NC}"
    echo ""
    echo "Если данные повреждены, вы можете восстановиться из страховочного бэкапа:"
    echo "  psql \"\$DATABASE_URL\" < $SAFETY_BACKUP"
    exit 1
fi
