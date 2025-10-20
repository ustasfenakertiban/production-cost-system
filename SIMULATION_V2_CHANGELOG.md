
# Simulation v2 — Full Implementation Changelog

## Дата обновления: 20 октября 2025

### Внедрённые возможности

#### 1. **One-time цепочки с автоматическим заданием цели**
- Если цель для цепочки типа `one-time` не указана явно, автоматически устанавливается значение 1
- Упрощает настройку для разовых операций

#### 2. **Периодические расходы с policy=end_of_simulation**
- Добавлена возможность накапливать периодические расходы в течение симуляции
- Списание всей накопленной суммы происходит в последний день
- В ответе API указывается `periodicCashOutDay` — день списания

#### 3. **Механизм trySwapToUnlockOperation**
- Автоматическая "перестановка" сотрудников в рамках часа
- Разблокирует операции, когда нужный сотрудник занят на другой операции
- Работает только если сотрудник ещё не работал в текущем часу
- Эвристический подход: если найден подходящий кандидат, capacity factor становится 1

#### 4. **Подробные логи (день/час/цепочка/операция)**
Новая структура логирования:
- **DayLog**: cashIn, cashOut (materials/materialsVat/labor/periodic/periodicVat), nonCash (depreciation), hours[]
- **HourLog**: hour, chains[]
- **ChainHourLog**: chainId, ops[]
- **OperationHourLog**: 
  - opId, produced, pulledFromPrev
  - materialsConsumed (с детализацией по materialId, qty, net, vat)
  - laborCost, depreciation

#### 5. **Выручка и валовая маржа**
- `revenue`: сумма всех inflows от клиента; если inflows пусты и известна totalOrderAmount — используется она
- `grossMargin`: revenue − (materialNet + labor + depreciation + periodicNet)
- Добавлено в totals ответа API

#### 6. **Payroll policy (политика выплаты зарплат)**
Новые режимы выплаты зарплат:
- **daily**: списание каждый день
- **weekly**: списание каждые 7 дней
- **biweekly**: списание каждые 14 дней
- **monthly**: списание каждые monthDivisor дней

Зарплаты накапливаются в `laborAccrualDaily` и списываются согласно выбранной политике.

#### 7. **materialTwoPhasePayment флаг**
- **true** (по умолчанию): двухфазная оплата материалов
  - Предоплата в день заказа (materialPrepayPercent)
  - Постоплата в день окончания производства
- **false**: вся оплата (net+VAT) списывается в день заказа

#### 8. **Валидация PaymentSchedule с warnings**
Новые предупреждения в ответе API:
- `paymentSchedulePercentTotal`: вычисленная доля от totalOrderAmount (в процентах)
- `paymentScheduleOver100`: true, если сумма платежей > 100% от суммы заказа
- `paymentScheduleHasEmptyAmount`: true, если найден платёж без суммы или с нулём

#### 9. **Экспорт партий материалов (materialBatches)**
Для отладки возвращается массив `MaterialBatchDebug`:
- materialId, qty, unitCost, vatRate
- orderDay, etaProductionDay, etaArrivalDay
- prepayNet, prepayVat, postpayNet, postpayVat

### Обновлённые файлы

#### lib/simulation-v2/types.ts
- Добавлены поля в SimulationSettings: `payrollPaymentPolicy`, `materialTwoPhasePayment`
- Новые интерфейсы: DayCashOut, DayNonCash, DayLog, HourLog, ChainHourLog, OperationHourLog
- MaterialBatchDebug, SimulationWarnings, SimulationResult

#### lib/simulation-v2/Operation.ts
- Добавлены методы: `resetHourCounters()`, `getProducedThisHour()`
- Поле `producedThisHour` для трекинга производства в текущем часу

#### lib/simulation-v2/OperationChain.ts
- Добавлен метод `resetHourCounters()` для сброса счётчиков всех операций

#### lib/simulation-v2/ResourceManager.ts
**Новые поля:**
- `materialBatchesDebug`: массив для экспорта партий материалов
- `hourLogs`: Map для хранения почасовых логов
- `employeeWorkedThisHour`: Set для отслеживания занятости сотрудников в текущем часу
- `laborAccrualDaily`: Map для накопления зарплат по дням

**Новые методы:**
- `beginHour()`, `endHour()`: управление почасовым циклом
- `logOperationHour()`: запись логов операции
- `flushDayLogsToDaily()`: сохранение почасовых логов в дневной срез
- `trySwapToUnlockOperation()`: попытка перестановки сотрудников
- `bookPayrollPolicyCashOut()`: списание зарплат по политике
- `getLaborAccruedForRange()`: получение накопленных зарплат за диапазон дней

**Обновлённые методы:**
- `dailyMaterialReplenishment()`: поддержка materialTwoPhasePayment, запись в materialBatchesDebug
- `reserveAndConsumeMaterials()`: возвращает детали списания (net, vat)
- `commitHourWork()`: накопление зарплат в laborAccrualDaily, отметка сотрудников в employeeWorkedThisHour
- `bookEndOfDayPayments()`: убрано прямое списание зарплат (теперь через payroll policy)

#### lib/simulation-v2/SimulationEngine.ts
**Полная переработка:**
- Поддержка one-time цепочек с автоматической целью = 1
- Интеграция почасового логирования (beginHour/endHour/logOperationHour)
- Использование trySwapToUnlockOperation при недостатке ресурсов
- Расчёт revenue и grossMargin
- Валидация payment schedule с warnings
- Поддержка periodicCashOutDay
- Интеграция payroll policy (вызов bookPayrollPolicyCashOut)
- Финальное "схлопывание хвоста" зарплат

#### app/api/simulation-v2/run/route.ts
- Добавлен вызов `engine.setTotalOrderAmount(totalOrderAmount)`
- Полная поддержка нового формата ответа SimulationResult

#### lib/simulation-v2/dataLoader.ts
- Добавлена загрузка новых полей из БД: `payrollPaymentPolicy`, `materialTwoPhasePayment`
- Дефолтные значения: 'daily' и true соответственно

#### prisma/schema.prisma
**Добавлены поля в SimulationSettingsV2:**
- `payrollPaymentPolicy String @default("daily")`
- `materialTwoPhasePayment Boolean @default(true)`

### Рекомендуемые настройки по умолчанию

```typescript
{
  thresholdRatio: 0.5,
  initialCashBalance: 0,
  materialPrepayPercent: 0.3,
  depreciationCashPolicy: 'end_of_simulation',
  periodicExpensePaymentPolicy: 'daily',
  monthDivisor: 30,
  payrollPaymentPolicy: 'daily',
  materialTwoPhasePayment: true
}
```

### Формат ответа API

```typescript
{
  daysTaken: number,
  totals: {
    materialNet, materialVAT, labor, depreciation,
    periodicNet, periodicVAT,
    revenue, grossMargin, cashEnding
  },
  days: DayLog[], // с почасовыми логами
  periodicCashOutDay?: number,
  materialBatches?: MaterialBatchDebug[],
  warnings?: SimulationWarnings,
  logs: []
}
```

### Тестовые сценарии

#### Periodic expenses
- **policy=daily**: при наличии активной записи расход списывается ежедневно
- **policy=end_of_simulation**: не списывается по дням; в конце — одним днём

#### Materials
- **thresholdRatio** триггерит автозаказ
- **materialTwoPhasePayment=true**: предоплата в день заказа, постоплата при готовности
- **materialTwoPhasePayment=false**: вся оплата в день заказа

#### Payroll
- **daily**: списание каждый день
- **weekly**: списание на 7-й, 14-й,… день
- **monthly**: списание на `dayIndex % monthDivisor === 0`

#### PaymentSchedule warnings
- Проверка при сумме >100%
- Проверка при amount=0
- Проверка при пустом графике

### Замечания

- **trySwapToUnlockOperation** реализован как эвристика для упрощения модели
- **monthly payroll** с monthDivisor — календарная аппроксимация (не бухгалтерский календарь)
- Все изменения обратно совместимы с существующим кодом
- База данных обновлена автоматически через `prisma db push`

### Статус

✅ Все функции реализованы и протестированы
✅ Приложение успешно собирается без ошибок
✅ Все типы обновлены и синхронизированы
✅ База данных обновлена с новыми полями
✅ Готово к использованию
