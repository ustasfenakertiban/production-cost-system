
export type ChainType = 'one-time' | 'per-unit';
export type VarianceMode =
  | 'no_variance'
  | 'min_only'
  | 'max_only'
  | 'random_nonnegative'
  | 'random_full_range'
  | 'perf_min_materials_max'
  | 'perf_random_down_materials_random_up';

export interface SimulationSettings {
  workingHoursPerDay: number;
  restMinutesPerHour: number;
  waitForMaterialDelivery: boolean;
  considerPeriodicExpenses?: boolean;
  varianceMode: VarianceMode;
  variancePercent: number;
  thresholdRatio: number;
  initialCashBalance: number;
  materialPrepayPercent: number;
  depreciationCashPolicy: 'daily' | 'end_of_simulation';
  periodicExpensePaymentPolicy: 'daily' | 'end_of_simulation';
  monthDivisor: number;
}

export interface MaterialSpec {
  id: string;
  name: string;
  unitCost: number;
  vatRate: number;
  minStock: number;
  minOrderQty: number;
  leadTimeProductionDays: number;
  leadTimeShippingDays: number;
}

export interface EquipmentSpec {
  id: string;
  name: string;
  hourlyDepreciation: number;
  considerInUtilization: boolean;
}

export interface RoleSpec {
  id: string;
  name: string;
}

export interface EmployeeSpec {
  id: string;
  name: string;
  roleIds: string[];
  hourlyWage: number;
}

export interface OperationSpec {
  id: string;
  name: string;
  orderIndex: number;
  materialUsages: Array<{ materialId: string; quantityPerUnit: number }>;
  requiredRoleIds: string[];
  requiredEquipmentIds: string[];
  baseProductivityPerHour: number;
  minStartInput?: number;
  requiresContinuousEquipmentWork?: boolean;
  staffPresenceMode?: 'full' | 'partial';
}

export interface ChainSpec {
  id: string;
  name: string;
  type: ChainType;
  orderIndex: number;
  operations: OperationSpec[];
}

export interface ProcessSpec {
  id: string;
  name: string;
  chains: ChainSpec[];
}

export interface PaymentScheduleItem {
  id: string;
  orderId: string;
  dayNumber: number;
  percentageOfTotal: number;
  amount?: number;
  description?: string;
}

export interface PeriodicExpenseSpec {
  id: string;
  name: string;
  period: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  amount: number; // gross (с НДС)
  isActive: boolean;
  vatRate: number;
}
