# 📘 Подробный справочник по коду симуляции

---

## Оглавление

1. [Основная структура файла](#основная-структура-файла)
2. [Типы данных и интерфейсы](#типы-данных-и-интерфейсы)
3. [Функция applyVariance](#функция-applyvariance)
4. [Функция validateOrder](#функция-validateorder)
5. [Главная функция simulateOrder](#главная-функция-simulateorder)
6. [Вспомогательные функции](#вспомогательные-функции)

---

## Основная структура файла

Файл `simulation-engine.ts` содержит всю логику симуляции производственных заказов.

**Путь к файлу:** `/home/ubuntu/production_cost_system/app/lib/simulation-engine.ts`

### Основные компоненты:

```
├── Типы данных (VarianceMode, ProductivityAlgorithm, etc.)
├── Интерфейсы (SimulationParams, Operation, Chain, Order, etc.)
├── applyVariance() - применение вариативности к значениям
├── validateOrder() - проверка корректности данных заказа
├── simulateOrder() - главная функция симуляции
└── Вспомогательные функции:
    ├── releaseResources() - освобождение ресурсов
    ├── processActiveOperations() - обработка активных операций
    ├── tryStartNewOperations() - попытка запуска новых операций
    └── tryStartChainOperation() - попытка запуска операции в цепочке
```

---

## Типы данных и интерфейсы

### VarianceMode

Определяет режим вариативности для симуляции:

```typescript
export type VarianceMode = 
  | "MAX"                          // Максимальные значения (лучший сценарий)
  | "MIN"                          // Минимальные значения (худший сценарий)
  | "NONE"                         // Без вариаций
  | "RANDOM_POSITIVE"              // Случайные положительные вариации (0 до +разброс)
  | "RANDOM_FULL"                  // Случайные вариации в обе стороны (-разброс до +разброс)
  | "MIN_PRODUCTIVITY_MAX_COSTS"   // Минимальная продуктивность + максимальные затраты
  | "RANDOM_ASYMMETRIC";           // Асимметричные вариации (производительность: 0 до -разброс, расходы: 0 до +разброс)
```

**Применение:**
- `MAX` - Оптимистичный сценарий (высокая производительность, низкие затраты)
- `MIN` - Пессимистичный сценарий (низкая производительность, высокие затраты)
- `NONE` - Номинальные значения без учета вариативности
- `MIN_PRODUCTIVITY_MAX_COSTS` - Худший сценарий (низкая производительность И высокие затраты одновременно)

### ProductivityAlgorithm

Определяет алгоритм расчета продуктивности:

```typescript
export type ProductivityAlgorithm = "BOTTLENECK" | "NOMINAL";
```

**Различия:**

1. **BOTTLENECK (Бутылочное горлышко)**
   - Итоговая производительность = MIN(номинальная, оборудование, работники)
   - Самый медленный ресурс ограничивает всю операцию
   - Более реалистичный подход

2. **NOMINAL (По номиналу)**
   - Используется только номинальная производительность операции
   - Игнорирует ограничения оборудования и работников
   - Упрощенный расчет

---

## Функция applyVariance

### Назначение

Применяет вариативность к базовому значению в зависимости от выбранного режима.

### Сигнатура

```typescript
export function applyVariance(
  baseValue: number,          // Базовое значение (например, 100 шт/час)
  variance: number | null,    // Процент разброса (например, 10 = ±10%)
  mode: VarianceMode,         // Режим вариативности
  isProductivity: boolean = true  // true = производительность, false = расходы
): number
```

### Логика работы

```typescript
// 1. Если variance = null, undefined или 0, или mode = "NONE"
//    → возвращаем baseValue без изменений

// 2. Преобразуем процент в десятичную дробь
const varianceDecimal = variance / 100;  // 10% → 0.1

// 3. Применяем в зависимости от режима:

switch (mode) {
  case "MAX":
    return baseValue * (1 + varianceDecimal);
    // Пример: 100 * (1 + 0.1) = 110

  case "MIN":
    return baseValue * (1 - varianceDecimal);
    // Пример: 100 * (1 - 0.1) = 90

  case "RANDOM_POSITIVE":
    return baseValue * (1 + Math.random() * varianceDecimal);
    // Пример: 100 * (1 + random(0...0.1)) = 100...110

  case "RANDOM_FULL":
    return baseValue * (1 + (Math.random() * 2 - 1) * varianceDecimal);
    // Пример: 100 * (1 + random(-0.1...+0.1)) = 90...110

  case "MIN_PRODUCTIVITY_MAX_COSTS":
    if (isProductivity) {
      return baseValue * (1 - varianceDecimal);  // Производительность УМЕНЬШАЕТСЯ
    } else {
      return baseValue * (1 + varianceDecimal);  // Расходы УВЕЛИЧИВАЮТСЯ
    }

  case "RANDOM_ASYMMETRIC":
    if (isProductivity) {
      return baseValue * (1 - Math.random() * varianceDecimal);  // 0 до -разброс
    } else {
      return baseValue * (1 + Math.random() * varianceDecimal);  // 0 до +разброс
    }
}
```

### Примеры использования

```typescript
// Производительность с разбросом ±10%
applyVariance(100, 10, "MAX", true);      // → 110 шт/час
applyVariance(100, 10, "MIN", true);      // → 90 шт/час
applyVariance(100, 10, "NONE", true);     // → 100 шт/час (без изменений)

// Стоимость материала с разбросом ±5%
applyVariance(50, 5, "MAX", false);       // → 52.5 руб (расходы растут)
applyVariance(50, 5, "MIN", false);       // → 47.5 руб (расходы падают)

// Режим MIN_PRODUCTIVITY_MAX_COSTS (худший сценарий)
applyVariance(100, 10, "MIN_PRODUCTIVITY_MAX_COSTS", true);   // → 90 (производительность падает)
applyVariance(50, 10, "MIN_PRODUCTIVITY_MAX_COSTS", false);   // → 55 (расходы растут)
```

---

## Функция validateOrder

### Назначение

Проверяет, что у заказа заполнены все необходимые параметры для симуляции.

### Возвращает

```typescript
{
  valid: boolean;            // true, если все параметры заполнены
  missingParams: string[];   // Список отсутствующих параметров
}
```

### Проверки для разных типов цепочек

#### Для ONE_TIME (разовых операций):
- ✅ Должно быть время работы оборудования ИЛИ время работы ролей
- ⚠️ Если оба отсутствуют → ошибка

#### Для PER_UNIT (поточных операций):
1. ✅ Должна быть длина рабочего цикла (cycleHours > 0)
2. ✅ Должна быть хотя бы одна производительность:
   - Номинальная производительность операции (estimatedProductivityPerHour), ИЛИ
   - Производительность оборудования (piecesPerHour), ИЛИ
   - Производительность ролей (piecesPerHour)

### Пример вывода ошибок

```
Товар1 → Процесс1 → Цепочка1 → Операция1: отсутствует длина рабочего цикла
Товар1 → Процесс1 → Цепочка1 → Операция2: для разовой операции укажите время работы оборудования или ролей
```

---

## Главная функция simulateOrder

### Назначение

Выполняет симуляцию производственного заказа от начала до конца.

### Сигнатура

```typescript
export function simulateOrder(
  order: Order,               // Данные заказа
  params: SimulationParams    // Параметры симуляции
): SimulationResult
```

### Входные параметры (SimulationParams)

```typescript
{
  hoursPerDay: 8,                        // Часов в рабочем дне
  physicalWorkers: 5,                    // Количество физических работников
  breakMinutesPerHour: 10,               // Минут перерыва в час
  varianceMode: "NONE",                  // Режим вариативности
  productivityAlgorithm: "BOTTLENECK"    // Алгоритм расчета производительности
}
```

### Выходные данные (SimulationResult)

```typescript
{
  log: string;                           // Текстовый лог симуляции
  operationBreakdown: OperationCostBreakdown[];  // Разбивка затрат по операциям
  totalCosts: {                          // Итоговые затраты
    materials: 1500.00,                  // Стоимость материалов
    equipment: 800.00,                   // Амортизация оборудования
    labor: 2000.00,                      // Оплата труда
    total: 4300.00                       // Итого
  }
}
```

### Основной цикл симуляции

```typescript
while (true) {
  absoluteHour++;  // Увеличиваем счетчик часов
  
  // 1. Передача деталей между операциями (для PER_UNIT)
  //    В начале каждого часа детали, произведенные в прошлом часу,
  //    становятся доступными для следующей операции
  
  // 2. Обработка активных операций
  //    - Проверяем, завершился ли рабочий цикл
  //    - Рассчитываем произведенное количество
  //    - Рассчитываем затраты (материалы, оборудование, труд)
  //    - Если операция завершена → помечаем как завершенную
  //    - Если нет → планируем следующий цикл
  
  // 3. Освобождение ресурсов
  //    - Освобождаем работников, чье время истекло
  //    - Освобождаем оборудование
  
  // 4. Попытка запуска новых операций
  //    - Проверяем, выполнены ли предыдущие операции
  //    - Проверяем доступность ресурсов
  //    - Если все условия выполнены → запускаем операцию
  
  // 5. Проверка завершения
  //    Если все операции завершены → выходим из цикла
  
  // 6. Защита от зависания
  //    Если нет прогресса 100 часов → прерываем с диагностикой
}
```

---

## Вспомогательные функции

### releaseResources()

**Назначение:** Освобождает ресурсы (работников и оборудование), чье время использования истекло.

**Логика:**
```typescript
function releaseResources(resources, currentHour, log) {
  // 1. Проходим по всем занятым работникам
  resources.busyWorkers.forEach((info, workerId) => {
    if (info.untilHour <= currentHour) {
      // Время работы истекло → освобождаем
      resources.busyWorkers.delete(workerId);
      log.push(`✅ Освободился работник #${workerId}`);
    }
  });
  
  // 2. Проходим по всему занятому оборудованию
  resources.busyEquipment.forEach((info, equipmentId) => {
    if (info.untilHour <= currentHour) {
      // Время работы истекло → освобождаем
      resources.busyEquipment.delete(equipmentId);
      log.push(`✅ Освободилось оборудование "${info.equipmentName}"`);
    }
  });
}
```

---

### processActiveOperations()

**Назначение:** Обрабатывает все активные операции в текущем часу.

**Основные шаги:**

#### 1. Проверка завершения цикла

```typescript
const cycleEnd = opState.cycleStartHour + opState.operationDuration;

if (cycleEnd === currentHour) {
  // Цикл завершился → считаем произведенное количество
}
```

#### 2. Расчет произведенного количества

**Для ONE_TIME (разовых операций):**
```typescript
// Весь тираж выполняется за один раз
producedThisCycle = totalQuantity - completedQuantity;
```

**Для PER_UNIT (поточных операций):**

```typescript
// Шаг 1: Расчет базовой производительности
let baseProductivity = applyVariance(
  operation.estimatedProductivityPerHour,
  operation.estimatedProductivityPerHourVariance,
  varianceMode
);

// Шаг 2: Расчет производительности оборудования
let equipmentProductivity = Infinity;
if (есть_оборудование_с_производительностью) {
  equipmentProductivity = MIN(производительность_всего_оборудования);
}

// Шаг 3: Расчет производительности работников
let roleProductivity = Infinity;
if (есть_роли_с_производительностью) {
  if (работников >= количество_ролей) {
    // Каждой роли достаточно людей
    roleProductivity = MIN(производительность_всех_ролей);
  } else {
    // Работников меньше, чем ролей → распределяем
    roleProductivity = 1 / SUM(1 / производительность_каждой_роли);
  }
}

// Шаг 4: Выбор итоговой производительности
if (productivityAlgorithm === "NOMINAL") {
  realProductivity = baseProductivity;  // Только номинальная
} else {
  realProductivity = MIN(baseProductivity, equipmentProductivity, roleProductivity);  // Бутылочное горлышко
}

// Шаг 5: Учет перерывов
realProductivity *= breakCoefficient;  // breakCoefficient = 1 - (breakMinutes / 60)

// Шаг 6: Расчет произведенного количества
const exactProduction = realProductivity * cycleHours;

// ВАЖНО: для коротких циклов (< 1 час) округление с учетом порога 0.5
producedThisCycle = exactProduction >= 0.5 
  ? Math.max(1, Math.floor(exactProduction)) 
  : Math.floor(exactProduction);

// Шаг 7: Ограничение доступностью деталей (для зависимых операций)
if (!isFirstInChain && chainType === "PER_UNIT") {
  const availableFromPrevious = previousOperation.transferredQuantity - completedQuantity;
  
  // Проверка минимальной партии
  if (operation.minimumBatchSize && availableFromPrevious < operation.minimumBatchSize) {
    producedThisCycle = 0;  // Ждем накопления минимальной партии
    log.push("⏸️ Ожидание минимальной партии");
  } else {
    producedThisCycle = MIN(producedThisCycle, availableFromPrevious);
  }
}
```

#### 3. Расчет затрат

**Материалы:**
```typescript
enabledMaterials.forEach(mat => {
  // Применяем variance к количеству материала
  const adjustedQuantity = applyVariance(mat.quantity, mat.variance, varianceMode, false);
  
  // Расход = скорректированное_количество × произведено_деталей
  const quantityUsed = adjustedQuantity * producedThisCycle;
  
  // Стоимость = расход × цена_за_единицу
  const cost = mat.unitPrice * quantityUsed;
  
  // НДС
  const vatAmount = cost * (mat.material.vatPercentage / 100);
  
  totalMaterialCost += cost;
  totalMaterialVAT += vatAmount;
});
```

**Оборудование:**
```typescript
enabledEquipment.forEach(eq => {
  // Применяем variance к часовой ставке амортизации
  const adjustedHourlyRate = applyVariance(eq.hourlyRate, eq.variance, varianceMode, false);
  
  // Стоимость = ставка × длительность_операции
  const cost = adjustedHourlyRate * operationDuration;
  
  totalEquipmentCost += cost;
});
```

**Труд:**
```typescript
enabledRoles.forEach(role => {
  // Применяем variance к ставке
  const adjustedRate = applyVariance(role.rate, role.variance, varianceMode, false);
  
  let cost = 0;
  
  if (role.requiresContinuousPresence) {
    // Постоянное присутствие → оплачиваем за всю длительность
    cost = adjustedRate * operationDuration;
    
  } else if (role.piecesPerHour > 0) {
    // Оплата по деталям
    const costPerPiece = adjustedRate / role.piecesPerHour;
    cost = costPerPiece * producedThisCycle;
    
  } else {
    // Оплата только за время настройки
    cost = adjustedRate * role.timeSpent;
  }
  
  totalLaborCost += cost;
});
```

#### 4. Проверка завершения операции

```typescript
let isOperationComplete = false;

if (chainType === "PER_UNIT" && !isFirstInChain) {
  // Для зависимых операций: завершена, когда обработаны ВСЕ детали от предыдущей
  const prevOpCompleted = completedOperations.has(previousOperationKey);
  
  if (prevOpCompleted && completedQuantity >= totalQuantity) {
    isOperationComplete = true;
  }
} else {
  // Для первых операций или ONE_TIME: стандартная проверка
  if (completedQuantity >= totalQuantity) {
    isOperationComplete = true;
  }
}

if (isOperationComplete) {
  // Помечаем как завершенную
  completedOperations.add(operationKey);
  
  // Освобождаем все ресурсы
  releaseAllResources(opState, resources);
  
} else {
  // Планируем следующий цикл
  opState.cycleStartHour = currentHour;
  opState.operationDuration = recalculateDuration();
  
  // Обновляем время занятости непрерывных ресурсов
  updateContinuousResources(opState, resources, currentHour);
}
```

---

### tryStartNewOperations()

**Назначение:** Пытается запустить новые операции, если выполнены все условия.

**Логика:**

```typescript
function tryStartNewOperations(order, activeOperations, completedOperations, resources, currentHour) {
  for (const item of order.orderItems) {
    const process = item.productionProcess;
    
    // Разделяем цепочки по типам
    const oneTimeChains = process.operationChains.filter(c => c.chainType === "ONE_TIME");
    const perUnitChains = process.operationChains.filter(c => c.chainType === "PER_UNIT");
    
    // Проверяем, завершены ли все ONE_TIME цепочки
    const oneTimeCompleted = allOneTimeOperationsCompleted(oneTimeChains);
    
    if (!oneTimeCompleted) {
      // Сначала выполняем ONE_TIME операции (подготовка)
      oneTimeChains.forEach(chain => {
        tryStartChainOperation(chain, ...);
      });
    } else {
      // После подготовки выполняем PER_UNIT операции (производство)
      perUnitChains.forEach(chain => {
        tryStartChainOperation(chain, ...);
      });
    }
  }
}
```

---

### tryStartChainOperation()

**Назначение:** Пытается запустить конкретную операцию в цепочке.

**Проверки перед запуском:**

#### 1. Операция уже завершена?
```typescript
if (completedOperations.has(operationKey)) {
  log.push("✅ Операция уже завершена, пропускаем...");
  continue;  // Переходим к следующей операции
}
```

#### 2. Операция уже выполняется?
```typescript
const existingActiveOp = activeOperations.find(op => op.operation.id === operation.id);
if (existingActiveOp && hasAllocatedResources) {
  log.push("⏩ Операция уже выполняется, пропускаем...");
  continue;
}
```

#### 3. Предыдущие операции готовы?

**Для ONE_TIME:**
```typescript
// Все предыдущие операции должны быть ЗАВЕРШЕНЫ
const prevOpsCompleted = previousOperations.every(op => 
  completedOperations.has(operationKey)
);

if (!prevOpsCompleted) {
  log.push("⏸️ Ожидание завершения предыдущих операций...");
  continue;
}
```

**Для PER_UNIT:**
```typescript
// Предыдущие операции должны быть запущены И передать хотя бы 1 деталь
const prevOpsReady = previousOperations.every(op => {
  // Завершена?
  if (completedOperations.has(operationKey)) return true;
  
  // Активна и передала хотя бы 1 деталь?
  const activeOp = findActiveOperation(op);
  return activeOp && activeOp.transferredQuantity > 0;
});

if (!prevOpsReady) {
  log.push("⏸️ Ожидание деталей от предыдущей операции...");
  continue;
}
```

#### 4. Оборудование свободно?
```typescript
const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);

for (const equipment of enabledEquipment) {
  if (resources.busyEquipment.has(equipment.id)) {
    const busyInfo = resources.busyEquipment.get(equipment.id);
    log.push(`⏸️ Ожидание оборудования "${equipment.name}" (занято до часа ${busyInfo.untilHour})`);
    canStart = false;
    break;
  }
}

if (!canStart) continue;
```

#### 5. Достаточно работников?
```typescript
const enabledRoles = operation.operationRoles.filter(r => r.enabled);
const availableWorkers = resources.physicalWorkers - resources.busyWorkers.size;

if (enabledRoles.length > availableWorkers) {
  log.push(`⏸️ Не хватает работников (требуется: ${enabledRoles.length}, свободно: ${availableWorkers})`);
  continue;
}
```

#### 6. Запуск операции

```typescript
// Выделяем работников
const assignedWorkerIds = [];
for (let i = 0; i < enabledRoles.length; i++) {
  const workerId = findFreeWorker(resources);
  assignedWorkerIds.push(workerId);
  
  resources.busyWorkers.set(workerId, {
    operationName: operation.name,
    productName: item.product.name,
    untilHour: currentHour + operationDuration
  });
}

// Выделяем оборудование
const assignedEquipmentIds = [];
enabledEquipment.forEach(eq => {
  assignedEquipmentIds.push(eq.id);
  
  resources.busyEquipment.set(eq.id, {
    equipmentName: eq.equipment.name,
    operationName: operation.name,
    productName: item.product.name,
    untilHour: currentHour + operationDuration
  });
});

// Создаем активную операцию
const activeOp = {
  itemId: item.id,
  productName: item.product.name,
  chainId: chain.id,
  chainName: chain.name,
  chainType: chain.chainType,
  operation: operation,
  totalQuantity: totalQuantity,
  completedQuantity: 0,
  transferredQuantity: 0,
  pendingTransferQuantity: 0,
  cycleStartHour: currentHour,
  operationDuration: operationDuration,
  assignedWorkerIds: assignedWorkerIds,
  assignedEquipmentIds: assignedEquipmentIds,
  continuousWorkerIds: new Set(непрерывные_работники),
  continuousEquipmentIds: new Set(непрерывное_оборудование),
  initialDuration: operationDuration,
  isFirstInChain: isFirstOperation,
  previousOperationId: previousOperation?.id
};

activeOperations.push(activeOp);

log.push("🚀 НАЧАЛО ОПЕРАЦИИ: \"" + operation.name + "\"");
log.push("     Товар: " + item.product.name);
log.push("     Цепочка: " + chain.name);
log.push("     Тираж: " + totalQuantity + " шт.");
```

---

## Ключевые моменты для понимания

### 1. Разница между ONE_TIME и PER_UNIT

**ONE_TIME (разовые операции):**
- Выполняются один раз для всего тиража
- Следующая операция начинается только после ПОЛНОГО завершения предыдущей
- Пример: подготовка оборудования, настройка формы

**PER_UNIT (поточные операции):**
- Выполняются циклами, производя детали постепенно
- Следующая операция может начинаться, как только появилась ПЕРВАЯ деталь от предыдущей
- Пример: литье, зачистка, галтовка

### 2. Система передачи деталей (для PER_UNIT)

```typescript
// В конце цикла:
opState.pendingTransferQuantity = opState.completedQuantity;

// В начале следующего часа:
opState.transferredQuantity = opState.pendingTransferQuantity;
```

Это моделирует задержку в 1 час между производством и доступностью для следующей операции.

### 3. Минимальная партия (minimumBatchSize)

Если у операции указана минимальная партия (например, 100 шт), то операция:
1. Ждет накопления минимального количества деталей
2. Освобождает ресурсы на время ожидания
3. Возобновляется, когда минимальная партия накоплена

### 4. Непрерывные ресурсы

Некоторые ресурсы требуют непрерывной работы:
- `requiresContinuousPresence` (для ролей)
- `requiresContinuousOperation` (для оборудования)

Такие ресурсы остаются занятыми между циклами и оплачиваются за все время работы.

### 5. Защита от зависания

Если симуляция не показывает прогресса 100 часов подряд:
1. Прерывается автоматически
2. Выводится подробная диагностика:
   - Какие операции ждут
   - Причины ожидания (нет ресурсов, ждут деталей и т.д.)

---

## Часто встречающиеся проблемы

### Проблема 1: Операция не начинается

**Возможные причины:**
1. ❌ Предыдущая операция не завершена (ONE_TIME) или не передала детали (PER_UNIT)
2. ❌ Оборудование занято
3. ❌ Не хватает работников
4. ❌ Ждет минимальную партию

**Решение:** Смотрите в лог секцию "⏸️ Ожидающие операции"

### Проблема 2: Низкая производительность

**Возможные причины:**
1. ❌ Режим вариативности MIN или MIN_PRODUCTIVITY_MAX_COSTS
2. ❌ Алгоритм BOTTLENECK ограничен медленным ресурсом
3. ❌ Большой процент разброса (variance)
4. ❌ Много времени на перерывы (breakMinutesPerHour)

**Решение:** 
- Проверьте параметры симуляции
- Посмотрите в лог секцию расчета производительности

### Проблема 3: Операция производит 0 деталей в цикле

**Возможные причины:**
1. ❌ Ожидание минимальной партии
2. ❌ Нет доступных деталей от предыдущей операции
3. ❌ Очень короткий цикл + низкая производительность (< 0.5 детали за цикл)

**Решение:**
- Увеличьте cycleHours
- Увеличьте производительность
- Проверьте minimumBatchSize

---

## Как читать лог симуляции

### Структура лога

```
╔═══════════════════════════════════════╗
║   СИМУЛЯЦИЯ ВЫПОЛНЕНИЯ ЗАКАЗА         ║
╚═══════════════════════════════════════╝

📋 Заказ: Название заказа

⚙️ Параметры симуляции:
   • Часов в рабочем дне: 8
   • Физических работников: 5
   • Отдых (мин/час): 10
   • Режим разброса: По номиналу
   • Алгоритм: Бутылочное горлышко

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📅 ДЕНЬ 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Час 1 (абсолютный час: 1)
──────────────────────────────────

  🚀 НАЧАЛО ОПЕРАЦИИ: "литье"
     Товар: Заготовка
     Цепочка: Производство (поточная)
     Тираж: 1600 шт.

  📊 Выполняется операций: 1
     • "литье" (Заготовка)
       Деталей в работе: 0 шт.
       До завершения цикла: 1 час(ов)
       Занято работников: #1, #2
       Занято оборудования: Литейная машина

⏰ Час 2 (абсолютный час: 2)
──────────────────────────────────

  🔧 Операция: "литье"
     Товар: Заготовка
     Цепочка: Производство (поточная)
     Номинальная производительность: 1600.00 шт/час
     Производительность по оборудованию: 1600.00 шт/час
     Производительность по работникам: 1600.00 шт/час
     ⚙️ Алгоритм: Бутылочное горлышко
     Итоговая производительность: 1600.00 шт/час
     Реальная производительность (с учетом отдыха): 1466.67 шт/час
     🔢 Произведено в этом цикле: 1466 шт.
     ✔️ Выполнено: 1466 шт. (всего: 1466/1600)
     💎 Материал "Металл": 1466.00 кг × 10.00 = 14660.00 руб.
     💰 Стоимость материалов: 14660.00 руб.
     ⚙️ Оборудование "Литейная машина": 1.00 час × 500.00 = 500.00 руб.
     💰 Амортизация оборудования: 500.00 руб.
     👤 Роль "Литейщик": 500.00 руб
     💰 Оплата труда: 500.00 руб.
     🔄 Продолжение операции в следующем цикле...
```

### Ключевые секции

1. **🚀 НАЧАЛО ОПЕРАЦИИ** - операция запустилась
2. **🔧 Операция** - операция завершила цикл и произвела детали
3. **⏸️ Ожидающие операции** - операции, которые не могут начаться (с причинами)
4. **✅ Освободился...** - ресурс освободился
5. **📊 Выполняется операций** - статус активных операций

---

## Заключение

Этот справочник покрывает основные аспекты работы симуляции. Для более детального изучения рекомендуется:

1. Открыть файл `/home/ubuntu/production_cost_system/app/lib/simulation-engine.ts`
2. Читать код последовательно, используя этот справочник как навигацию
3. Запускать тестовые симуляции с разными параметрами
4. Изучать логи симуляции для понимания процесса

