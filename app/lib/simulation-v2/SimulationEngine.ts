
import { PeriodicExpenseSpec, ProcessSpec, SimulationSettings } from './types';
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

  constructor(process: ProcessSpec, resources: ResourceManager, settings: SimulationSettings, targets: Map<string, number>) {
    this.process = process;
    this.settings = settings;
    this.resources = resources;
    this.chains = process.chains.map(ch => new OperationChain(ch, targets.get(ch.id) ?? 0));
  }

  setPeriodicExpenses(exps: PeriodicExpenseSpec[]) {
    this.periodicExpenses = exps ?? [];
  }
  setPaymentInflows(items: Array<{ dayNumber: number; amount: number }>) {
    this.inflows = items ?? [];
  }

  private getActiveOrderIndex(): number | null {
    const unfinished = this.chains.filter(c => !c.isCompleted());
    if (unfinished.length === 0) return null;
    return Math.min(...unfinished.map(c => c.orderIndex));
  }
  private getActiveChains(orderIndex: number): OperationChain[] {
    return this.chains.filter(c => !c.isCompleted() && c.orderIndex === orderIndex);
  }
  allCompleted(): boolean { return this.chains.every(c => c.isCompleted()); }

  async run() {
    while (!this.allCompleted()) {
      // Утро: клиентские поступления
      const inflow = this.inflows.filter(p => p.dayNumber === this.currentDay).reduce((a, b) => a + (b.amount ?? 0), 0);
      if (inflow > 0) this.resources.creditClientInflow(this.currentDay, inflow);

      // Утро: автозаказы и постоплаты, приход материалов
      this.resources.dailyMaterialReplenishment(this.currentDay, this.settings);
      this.resources.processMaterialPostpay(this.currentDay);
      this.resources.processIncomingMaterials(this.currentDay);

      // Рабочие часы
      for (let h = 1; h <= this.settings.workingHoursPerDay; h++) {
        const activeOrder = this.getActiveOrderIndex();
        if (activeOrder === null) break;
        const activeChains = this.getActiveChains(activeOrder);
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
            if (alloc.capacityFactor <= 0) continue;

            const byResources = effProd * alloc.capacityFactor;
            const hourQtyCandidate = Math.max(0, Math.min(byResources, op.remaining, incomingCap));
            if (hourQtyCandidate <= 0) continue;

            const materialsToConsume = op.spec.materialUsages.map(mu => ({
              materialId: mu.materialId, qty: mu.quantityPerUnit * hourQtyCandidate
            }));
            const materialsOk = this.resources.reserveAndConsumeMaterials(materialsToConsume);
            if (!materialsOk) continue;

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
          }
        }
      }

      // Конец дня: периодические расходы по policy
      if (this.settings.periodicExpensePaymentPolicy === 'daily') {
        this.resources.applyPeriodicExpensesForDay(this.currentDay, this.periodicExpenses, this.settings);
      } else {
        this.resources.accruePeriodicExpensesForDayOnly(this.periodicExpenses, this.settings);
      }

      // Конец дня: зарплаты, опция амортизации
      this.resources.bookEndOfDayPayments(this.currentDay, this.settings);

      this.currentDay += 1;
    }

    // Если периодические расходы списываются в конце симуляции — проводим их последним днём
    if (this.settings.periodicExpensePaymentPolicy === 'end_of_simulation') {
      this.resources.bookEndOfSimulationPeriodicCashOut(this.currentDay);
    }

    const rm: any = this.resources;
    return {
      daysTaken: this.currentDay - 1,
      totals: {
        materialNet: rm.materialCostAccrued ?? 0,
        materialVAT: rm.materialVatAccrued ?? 0,
        labor: rm.laborCostAccrued ?? 0, // к моменту конца дня будет 0, но суммарное за симуляцию мы накапливаем в ежедневных cashOut.labor
        depreciation: rm.equipmentDepreciationAccrued ?? 0,
        periodicNet: rm.periodicNetAccrued ?? 0,
        periodicVAT: rm.periodicVatAccrued ?? 0,
        cashEnding: rm.cashBalance ?? 0
      },
      days: Array.from(rm.daily?.entries?.() ?? []).map(([day, v]: any) => ({ day, ...v })),
      logs: []
    };
  }
}
