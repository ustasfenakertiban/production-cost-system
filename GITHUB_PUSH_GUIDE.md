
# Инструкция по выгрузке проекта на GitHub

Ваш проект уже подключен к репозиторию: `https://github.com/ustasfenakertiban/production-cost-system.git`

Все изменения закоммичены. Осталось только настроить авторизацию и выгрузить код.

---

## ✅ Вариант 1: Personal Access Token (Проще)

### Шаг 1: Создайте токен на GitHub

1. Откройте: https://github.com/settings/tokens
2. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
3. Заполните форму:
   - **Note:** `production-cost-system` (или любое имя)
   - **Expiration:** 90 days (или больше)
   - **Scopes:** Отметьте галочку **`repo`** (весь блок)
4. Нажмите **"Generate token"**
5. **ВАЖНО:** Скопируйте токен немедленно! (Вы не сможете увидеть его снова)

### Шаг 2: Настройте Git с токеном

Выполните в терминале (замените `YOUR_TOKEN` на ваш токен):

```bash
cd /home/ubuntu/production_cost_system
git remote set-url origin https://YOUR_TOKEN@github.com/ustasfenakertiban/production-cost-system.git
```

### Шаг 3: Выгрузите код

```bash
git push origin master
```

### Пример:
Если ваш токен `ghp_abc123xyz`, команда будет:
```bash
git remote set-url origin https://ghp_abc123xyz@github.com/ustasfenakertiban/production-cost-system.git
git push origin master
```

---

## 🔐 Вариант 2: SSH Ключ (Более безопасный)

### Шаг 1: Создайте SSH ключ

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Нажмите Enter (используйте путь по умолчанию)
# Можете задать пароль или оставить пустым
```

### Шаг 2: Скопируйте публичный ключ

```bash
cat ~/.ssh/id_ed25519.pub
```

### Шаг 3: Добавьте ключ на GitHub

1. Откройте: https://github.com/settings/keys
2. Нажмите **"New SSH key"**
3. **Title:** `production-cost-system-server`
4. **Key:** Вставьте содержимое из `id_ed25519.pub`
5. Нажмите **"Add SSH key"**

### Шаг 4: Измените URL репозитория на SSH

```bash
cd /home/ubuntu/production_cost_system
git remote set-url origin git@github.com:ustasfenakertiban/production-cost-system.git
```

### Шаг 5: Выгрузите код

```bash
git push origin master
```

---

## 📊 Информация о текущем состоянии

- **Репозиторий:** https://github.com/ustasfenakertiban/production-cost-system.git
- **Ветка:** master
- **Последние коммиты:**
  - d237a34 Fixed material delivery logic
  - b2b1815 Fixed material purchases: orderId required
  - 9039a1c Fixed initial cash balance issue
  - bf01447 Material batches validation without templates
  - 12bda6a Fixed material purchase logic validation

- **Статус:** Все изменения закоммичены, готово к push

---

## ⚠️ Решение проблем

### Если push не работает:
```bash
# Проверьте статус
git status

# Проверьте remote URL
git remote -v

# Попробуйте с флагом -u
git push -u origin master

# Если нужно принудительно перезаписать (осторожно!)
git push -f origin master
```

### Если забыли токен:
- Создайте новый токен на https://github.com/settings/tokens
- Обновите remote URL снова

---

## ✨ После успешной выгрузки

Ваш код будет доступен по адресу:
**https://github.com/ustasfenakertiban/production-cost-system**

Вы сможете:
- Просматривать историю изменений
- Делиться ссылкой с коллегами
- Клонировать проект на другие машины
- Настроить CI/CD (автоматическую сборку и деплой)

---

**Рекомендация:** Используйте Вариант 1 (Personal Access Token) - это быстрее и проще для начала.
