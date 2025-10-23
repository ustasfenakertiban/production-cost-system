
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
  payrollPaymentPolicy: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  materialTwoPhasePayment: boolean;
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

// Detailed logging types
export interface DayCashOut {
  materials: number;
  materialsVat: number;
  labor: number;
  periodic: number;
  periodicVat: number;
}

export interface DayNonCash {
  depreciation: number;
}

export interface DayLog {
  day: number;
  cashIn: number;
  cashOut: DayCashOut;
  nonCash: DayNonCash;
  hours: HourLog[];
  cashStart?: number;
  cashEnd?: number;
}

export interface HourLog {
  hour: number;
  chains: ChainHourLog[];
}

export interface ChainHourLog {
  chainId: string;
  chainName?: string;
  ops: OperationHourLog[];
}

export interface OperationHourLog {
  opId: string;
  opName?: string;
  produced: number;
  pulledFromPrev: number;
  materialsConsumed: Array<{ materialId: string; qty: number; net: number; vat: number }>;
  laborCost: number;
  depreciation: number;
}

export interface MaterialBatchDebug {
  materialId: string;
  qty: number;
  unitCost: number;
  vatRate: number;
  orderDay: number;
  etaProductionDay: number;
  etaArrivalDay: number;
  prepayNet: number;
  prepayVat: number;
  postpayNet: number;
  postpayVat: number;
}

export interface SimulationWarnings {
  paymentSchedulePercentTotal?: number;
  paymentScheduleOver100?: boolean;
  paymentScheduleHasEmptyAmount?: boolean;
  simulationIncomplete?: boolean;
  simulationDaysLimit?: number;
}

export interface SimulationResult {
  daysTaken: number;
  totals: {
    materialNet: number;
    materialVAT: number;
    labor: number;
    depreciation: number;
    periodicNet: number;
    periodicVAT: number;
    revenue?: number;
    grossMargin?: number;
    cashEnding: number;
  };
  days: DayLog[];
  periodicCashOutDay?: number;
  materialBatches?: MaterialBatchDebug[];
  warnings?: SimulationWarnings;
  logs: any[];
}
