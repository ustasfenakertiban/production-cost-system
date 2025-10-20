
# Симуляция v2 — интерфейсы и контракты

## Цели:

- Отделить бизнес-логику симуляции от БД.
- Поддержать две модели операций: per-unit и one-time.
- Учитывать кэш и некэш (амортизация), НДС, периодические расходы, клиентские поступления, двухфазную оплату материалов.

## Слои:

```
API Route → dataLoader (Prisma) → SimulationEngine → ResourceManager (in-memory)
```

**SimulationEngine** и **ResourceManager** никогда не обращаются к БД.

## Контракты:

### SimulationSettings:
- `workingHoursPerDay: number`
- `restMinutesPerHour: number`
- `waitForMaterialDelivery: boolean`
- `considerPeriodicExpenses?: boolean`
- `varianceMode: VarianceMode`
- `variancePercent: number`
- `thresholdRatio: number`
- `initialCashBalance: number`
- `materialPrepayPercent: number`
- `depreciationCashPolicy: 'daily' | 'end_of_simulation'`
- `periodicExpensePaymentPolicy: 'daily' | 'end_of_simulation'`
- `monthDivisor: number`

### MaterialSpec:
`id, name, unitCost, vatRate, minStock, minOrderQty, leadTimeProductionDays, leadTimeShippingDays`

### EquipmentSpec:
`id, name, hourlyDepreciation, considerInUtilization`

### RoleSpec, EmployeeSpec

### OperationSpec:
`id, name, orderIndex, materialUsages[{materialId,quantityPerUnit}], requiredRoleIds[], requiredEquipmentIds[], baseProductivityPerHour, minStartInput?, requiresContinuousEquipmentWork?, staffPresenceMode?('full'|'partial')`

### ChainSpec:
`id, name, type('one-time'|'per-unit'), orderIndex, operations[]`

### ProcessSpec:
`id, name, chains[]`

### PaymentScheduleItem:
`id, orderId, dayNumber, percentageOfTotal, amount?, description?`

### PeriodicExpenseSpec:
`id, name, period('DAY'|'WEEK'|'MONTH'|'QUARTER'|'YEAR'), amount(gross), isActive, vatRate`

## Возврат API /api/simulation-v2/run:

```typescript
{
  totals: {
    materialNet, materialVAT, labor, depreciation, 
    periodicNet, periodicVAT, cashEnding
  },
  days: [{
    day, cashIn, 
    cashOut: { materials, materialsVat, labor, periodic, periodicVat },
    nonCash: { depreciation }
  }],
  daysTaken, 
  logs[]
}
```

## Directory: lib/simulation-v2
