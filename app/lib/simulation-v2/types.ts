
/**
 * Типы и интерфейсы для симуляции производства v2
 * С использованием ООП подхода
 */

// ==================== Базовые типы ====================

export type ChainType = "ONE_TIME" | "PER_UNIT";
export type PaymentType = "HOURLY" | "PIECE_RATE";
export type VarianceMode = "NORMAL" | "MIN_PRODUCTIVITY_MAX_COSTS" | "RANDOM_ASYMMETRIC";

// ==================== Настройки симуляции ====================

export interface SimulationSettings {
  payIdleTime: boolean;           // Доплачивать за простой сотрудникам
  enablePartialWork: boolean;     // Выполнять частичные операции при наличии свободных ресурсов
}

export interface SimulationParameters {
  orderId: string;
  orderQuantity: number;
  productId: string;
  productName: string;
  processId: string;
  processName: string;
  varianceMode: VarianceMode;
  startDate: Date;
  settings: SimulationSettings;
}

// ==================== Ресурсы ====================

export interface MaterialInfo {
  id: string;
  name: string;
  unit: string;
  cost: number;
  minStockPercentage: number;     // Минимальный неснижаемый остаток (%)
  batchSize: number;              // Размер партии закупки
}

export interface EquipmentInfo {
  id: string;
  name: string;
  hourlyDepreciation: number;
  maxProductivity?: number;       // Максимальная производительность
  productivityUnits?: string;     // Единицы измерения производительности
}

export interface EmployeeRoleInfo {
  id: string;
  name: string;
  paymentType: PaymentType;
  hourlyRate: number;
}

export interface EmployeeInfo {
  id: string;
  name: string;
  roles: string[];                // ID ролей, которые может выполнять
}

// ==================== Операции и цепочки ====================

export interface OperationMaterialRequirement {
  materialId: string;
  quantityPerUnit: number;        // Количество материала на 1 деталь
  variance: number;               // Разброс (%)
  enabled: boolean;
}

export interface OperationEquipmentRequirement {
  equipmentId: string;
  timePerUnit: number;            // Время работы оборудования на 1 деталь (часы)
  productivityPerHour?: number;   // Производительность (деталей/час)
  variance: number;               // Разброс (%)
  enabled: boolean;
  requiresContinuousOperation: boolean;
}

export interface OperationRoleRequirement {
  roleId: string;
  timePerUnit: number;            // Время работы сотрудника на 1 деталь (часы)
  productivityPerHour?: number;   // Производительность (деталей/час)
  variance: number;               // Разброс (%)
  enabled: boolean;
  requiresContinuousPresence: boolean;
}

export interface OperationConfig {
  id: string;
  name: string;
  chainId: string;
  orderIndex: number;
  enabled: boolean;
  
  // Параметры производительности
  estimatedProductivityPerHour?: number;
  cycleHours?: number;            // Длительность цикла (часы)
  operationDuration?: number;     // Длительность операции (часы)
  minimumBatchSize: number;
  
  // Ресурсы
  materials: OperationMaterialRequirement[];
  equipment: OperationEquipmentRequirement[];
  roles: OperationRoleRequirement[];
}

export interface OperationChainConfig {
  id: string;
  name: string;
  chainType: ChainType;
  orderIndex: number;
  enabled: boolean;
  estimatedQuantity?: number;     // Для ONE_TIME операций
  operations: OperationConfig[];
}

// ==================== Состояние симуляции ====================

export interface MaterialStock {
  materialId: string;
  quantity: number;               // Текущий остаток
  minStock: number;               // Минимальный неснижаемый остаток
  totalPurchased: number;         // Всего закуплено
  totalCost: number;              // Общая стоимость закупок
}

export interface EmployeeState {
  employeeId: string;
  currentOperationId?: string;    // ID операции, которую выполняет
  busyUntil: Date;                // Занят до
  idleHours: number;              // Часы простоя
  workHours: number;              // Часы работы
}

export interface EquipmentState {
  equipmentId: string;
  currentOperationId?: string;    // ID операции, на которой используется
  busyUntil: Date;                // Занято до
  idleHours: number;              // Часы простоя
  workHours: number;              // Часы работы
}

export interface OperationProgress {
  operationId: string;
  completed: number;              // Выполнено деталей
  target: number;                 // Целевое количество
  waiting: boolean;               // Ожидает ресурсы
  startTime?: Date;
  endTime?: Date;
}

// ==================== Результаты ====================

export interface OperationResult {
  operationId: string;
  operationName: string;
  chainId: string;
  chainName: string;
  chainOrder: number;
  operationOrder: number;
  
  // Производство
  targetQuantity: number;
  completedQuantity: number;
  
  // Время
  startTime: Date;
  endTime: Date;
  totalHours: number;
  
  // Затраты на материалы
  materialCosts: {
    materialId: string;
    materialName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  
  // Затраты на оборудование
  equipmentCosts: {
    equipmentId: string;
    equipmentName: string;
    workHours: number;
    idleHours: number;
    hourlyRate: number;
    totalCost: number;
  }[];
  
  // Затраты на персонал
  laborCosts: {
    roleId: string;
    roleName: string;
    employeeId: string;
    employeeName: string;
    workHours: number;
    idleHours: number;
    paidIdleHours: number;        // Оплаченные часы простоя
    hourlyRate: number;
    totalCost: number;
  }[];
  
  totalCost: number;
}

export interface SimulationResult {
  orderId: string;
  orderQuantity: number;
  parameters: SimulationParameters;
  
  startTime: Date;
  endTime: Date;
  totalDuration: number;          // Общее время в часах
  
  operations: OperationResult[];
  
  // Итоговые затраты
  totalMaterialCost: number;
  totalEquipmentCost: number;
  totalLaborCost: number;
  totalCost: number;
  
  // Статистика по ресурсам
  materialUsage: MaterialStock[];
  equipmentUtilization: {
    equipmentId: string;
    equipmentName: string;
    totalHours: number;
    workHours: number;
    idleHours: number;
    utilizationPercent: number;
  }[];
  employeeUtilization: {
    employeeId: string;
    employeeName: string;
    totalHours: number;
    workHours: number;
    idleHours: number;
    paidIdleHours: number;
    utilizationPercent: number;
  }[];
}

// ==================== События лога ====================

export interface LogEvent {
  timestamp: Date;
  type: "INFO" | "WARNING" | "ERROR" | "OPERATION_START" | "OPERATION_END" | "RESOURCE_WAIT";
  message: string;
  operationId?: string;
  operationName?: string;
  chainId?: string;
  chainName?: string;
  details?: any;
}
