
import {
  PeriodicExpenseSpec, ProcessSpec, SimulationSettings,
  SimulationResult, DayLog, OperationHourLog, SimulationWarnings
} from './types';
import { OperationChain } from './OperationChain';
import { productivityWithVariance, materialsOrDepVarianceMultiplier } from './variance';
import { ResourceManager } from './ResourceManager';

export class SimulationEngine {
  readonly settings: SimulationSettings;
  readonly process: ProcessSpec;
  readonly chains: OperationChain[];
  readonly resources: ResourceManager;
  private currentDay = 1;

  private periodicExpenses: PeriodicExpenseSpec[] = [];
  private inflows: Array<{ dayNumber: number; amount: number }> = [];
  private revenueTotal = 0;
  private totalOrderAmount?: number;

  constructor(process: ProcessSpec, resources: ResourceManager, settings: SimulationSettings, targets: Map<string, number>) {
    this.process = process;
    this.settings = settings;
    this.resources = resources;
    // one-time цепочки: если цель не задана, ставим 1
    this.chains = process.chains.map(ch => {
      const t = targets.get(ch.id);
      const target = t != null ? t : (ch.type === 'one-time' ? 1 : 0);
      return new OperationChain(ch, target);
    });
  }

  setPeriodicExpenses(exps: PeriodicExpenseSpec[]) { this.periodicExpenses = exps ?? []; }
  setPaymentInflows(items: Array<{ dayNumber: number; amount: number }>) { this.inflows = items ?? []; }
  setTotalOrderAmount(amount?: number) { this.totalOrderAmount = amount; }

  private getActiveOrderIndex(): number | null {
    const unfinished = this.chains.filter(c => !c.isCompleted());
    if (unfinished.length === 0) return null;
    return Math.min(...unfinished.map(c => c.orderIndex));
  }
  private getActiveChains(orderIndex: number): OperationChain[] {
    return this.chains.filter(c => !c.isCompleted() && c.orderIndex === orderIndex);
  }
  allCompleted(): boolean { return this.chains.every(c => c.isCompleted()); }

  private validatePaymentSchedule(): SimulationWarnings {
    const w: SimulationWarnings = {};
    if (this.inflows.length && this.totalOrderAmount != null) {
      const sum = this.inflows.reduce((a, b) => a + (b.amount ?? 0), 0);
      w.paymentSchedulePercentTotal = (sum / this.totalOrderAmount) * 100;
      if (w.paymentSchedulePercentTotal > 100.0001) w.paymentScheduleOver100 = true;
    }
    const zeroes = this.inflows.some(i => !i.amount || i.amount <= 0);
    if (zeroes) w.paymentScheduleHasEmptyAmount = true;
    return w;
  }

  async run(): Promise<SimulationResult> {
    const warnings = this.validatePaymentSchedule();
    const MAX_SIMULATION_DAYS = 365; // Защита от бесконечного цикла

    console.log('[SimEngine] Starting simulation. Initial state:');
    for (const chain of this.chains) {
      const lastOp = chain.operations[chain.operations.length - 1];
      const target = lastOp ? (lastOp.remaining + lastOp.transferredCount) : 0;
      console.log(`[SimEngine] Chain "${chain.spec.name}": target=${target}, completed=${chain.isCompleted()}`);
    }

    while (!this.allCompleted() && this.currentDay <= MAX_SIMULATION_DAYS) {
      if (this.currentDay % 10 === 0) {
        console.log(`[SimEngine] Day ${this.currentDay}: Progress check...`);
        for (const chain of this.chains) {
          const lastOp = chain.operations[chain.operations.length - 1];
          if (lastOp) {
            const target = lastOp.remaining + lastOp.transferredCount;
            const completed = lastOp.transferredCount;
            const progress = target > 0 ? `${((completed / target) * 100).toFixed(1)}%` : 'N/A';
            console.log(`[SimEngine]   Chain "${chain.spec.name}": ${completed}/${target} (${progress})`);
          }
        }
      }

      // Утро: поступления от клиента
      const inflow = this.inflows.filter(p => p.dayNumber === this.currentDay).reduce((a, b) => a + (b.amount ?? 0), 0);
      if (inflow > 0) {
        this.resources.creditClientInflow(this.currentDay, inflow);
        this.revenueTotal += inflow;
      }

      // Утро: поставки/оплаты
      this.resources.dailyMaterialReplenishment(this.currentDay, this.settings);
      this.resources.processMaterialPostpay(this.currentDay);
      this.resources.processIncomingMaterials(this.currentDay);

      // Рабочий день: по часам
      for (let h = 1; h <= this.settings.workingHoursPerDay; h++) {
        this.resources.beginHour(this.currentDay, h);
        const activeOrder = this.getActiveOrderIndex();
        if (activeOrder === null) { this.resources.endHour(this.currentDay, h); break; }
        const activeChains = this.getActiveChains(activeOrder);

        // Сброс почасовых счётчиков операций
        for (const chain of activeChains) chain.resetHourCounters();

        this.resources.resetHourAllocations();
        const minutesLeft = 60 - this.settings.restMinutesPerHour;

        for (const chain of activeChains) {
          for (const op of chain.getOperationsInOrder()) {
            if (op.isCompleted()) continue;

            // Вытягивание
            let incomingCap = Number.POSITIVE_INFINITY;
            const prev = chain.getPreviousOperation(op);
            if (prev) {
              const available = prev.getOutgoingBuffer();
              if (available < op.getMinStartInput()) continue;
              incomingCap = available;
            }

            const effProd = productivityWithVariance(op.spec.baseProductivityPerHour, this.settings) * (minutesLeft / 60);
            if (effProd <= 0) continue;

            const alloc = this.resources.allocateForOperation(
              op.spec.requiredRoleIds,
              op.spec.requiredEquipmentIds,
              minutesLeft,
              {
                requireFullForStaff: op.spec.staffPresenceMode === 'full',
                requireFullForEquipment: !!op.spec.requiresContinuousEquipmentWork
              }
            );
            let capacityFactor = alloc.capacityFactor;
            if (capacityFactor <= 0) {
              // Попытка swap
              const swapped = this.resources.trySwapToUnlockOperation(op.spec.requiredRoleIds, minutesLeft);
              if (!swapped) continue;
              // После swap считаем, что фактор = 1 (полный час доступен)
              capacityFactor = 1;
            }

            const byResources = effProd * capacityFactor;
            const hourQtyCandidate = Math.max(0, Math.min(byResources, op.remaining, incomingCap));
            if (hourQtyCandidate <= 0) continue;

            // Списываем материалы
            const toConsume = op.spec.materialUsages.map(mu => ({
              materialId: mu.materialId, qty: mu.quantityPerUnit * hourQtyCandidate
            }));
            const res = this.resources.reserveAndConsumeMaterials(toConsume);
            if (!res?.ok) continue;

            const pulled = prev ? op.pullFromPrevious(prev, hourQtyCandidate) : hourQtyCandidate;
            if (pulled <= 0) continue;

            const mult = materialsOrDepVarianceMultiplier(this.settings);
            this.resources.commitHourWork(
              alloc.employeesUsed,
              alloc.equipmentUsed,
              1, mult,
              (id) => this.resources.employees.get(id)!.hourlyWage,
              (id) => this.resources.equipment.get(id)!.hourlyDepreciation,
              this.currentDay
            );

            op.produceForHour(pulled);

            // Логирование операции
            const laborCost = alloc.employeesUsed.reduce((sum, e) => sum + (this.resources.employees.get(e.id)!.hourlyWage * (e.minutes / 60)), 0);
            const depreciation = alloc.equipmentUsed.reduce((sum, eq) => sum + (this.resources.equipment.get(eq.id)!.hourlyDepreciation * (eq.minutes / 60) * mult), 0);
            const entry: OperationHourLog = {
              opId: op.spec.id,
              produced: pulled,
              pulledFromPrev: prev ? pulled : 0,
              materialsConsumed: res.details,
              laborCost,
              depreciation
            };
            this.resources.logOperationHour(this.currentDay, h, chain.spec.id, entry);
          }
        }
        this.resources.endHour(this.currentDay, h);
      }

      // Конец дня: периодические расходы по policy
      if (this.settings.periodicExpensePaymentPolicy === 'daily') {
        this.resources.applyPeriodicExpensesForDay(this.currentDay, this.periodicExpenses, this.settings);
      } else {
        this.resources.accruePeriodicExpensesForDayOnly(this.periodicExpenses, this.settings);
      }

      // Конец дня: амортизация cash-политика (зарплаты теперь по payroll policy)
      this.resources.bookEndOfDayPayments(this.currentDay, this.settings);

      // Списать зарплаты, если наступил срок по policy
      this.resources.bookPayrollPolicyCashOut(this.currentDay, this.settings);

      // Сохранить почасовые логи в дневной срез
      this.resources.flushDayLogsToDaily(this.currentDay);

      this.currentDay += 1;
    }

    console.log(`[SimEngine] Simulation loop ended. Day: ${this.currentDay}, All completed: ${this.allCompleted()}`);
    if (this.currentDay > 365) {
      console.warn('[SimEngine] ⚠️ WARNING: Simulation reached maximum day limit (365 days)!');
      warnings.simulationIncomplete = true;
      warnings.simulationDaysLimit = 365;
    }

    // Периодические расходы при policy=end_of_simulation — списать последним днём
    let periodicCashOutDay: number | undefined = undefined;
    if (this.settings.periodicExpensePaymentPolicy === 'end_of_simulation') {
      this.resources.bookEndOfSimulationPeriodicCashOut(this.currentDay);
      periodicCashOutDay = this.currentDay;
      // Зафиксировать дневной срез для последнего дня
      this.resources.flushDayLogsToDaily(this.currentDay);
    }

    // Конечная выплата зарплат, если что-то осталось несквитировано по policy (хвост)
    this.resources.bookPayrollPolicyCashOut(this.currentDay, this.settings);
    this.resources.flushDayLogsToDaily(this.currentDay);

    const rm: any = this.resources;

    const revenue = this.revenueTotal || (this.totalOrderAmount ?? 0);
    const costCore = (rm.materialCostAccrued ?? 0) + (rm.laborCostAccrued ?? 0) + (rm.equipmentDepreciationAccrued ?? 0) + (rm.periodicNetAccrued ?? 0);
    const grossMargin = revenue - costCore;

    const daysArr: DayLog[] = Array.from((rm.daily?.entries?.() ?? [])).map(([day, v]: any) => {
      // Совместимость: если в v нет hours — подставить []
      if (!v.hours) v.hours = [];
      return { day, ...v };
    });

    const result: SimulationResult = {
      daysTaken: this.currentDay - 1,
      totals: {
        materialNet: rm.materialCostAccrued ?? 0,
        materialVAT: rm.materialVatAccrued ?? 0,
        labor: rm.laborCostAccrued ?? 0,
        depreciation: rm.equipmentDepreciationAccrued ?? 0,
        periodicNet: rm.periodicNetAccrued ?? 0,
        periodicVAT: rm.periodicVatAccrued ?? 0,
        revenue,
        grossMargin,
        cashEnding: rm.cashBalance ?? 0
      },
      days: daysArr,
      periodicCashOutDay,
      materialBatches: (rm.materialBatchesDebug ?? []),
      warnings,
      logs: []
    };
    return result;
  }
}
