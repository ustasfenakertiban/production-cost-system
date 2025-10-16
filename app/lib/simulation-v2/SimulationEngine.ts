/**
 * Главный движок симуляции производства
 * Управляет процессом симуляции, ресурсами и логированием
 */

import {
  SimulationParameters,
  SimulationResult,
  OperationResult,
  LogEvent,
  VarianceMode,
  ChainType,
} from "./types";
import { ResourceManager } from "./ResourceManager";
import { OperationChain } from "./OperationChain";
import { Operation } from "./Operation";

export class SimulationEngine {
  private resourceManager: ResourceManager;
  private chains: OperationChain[] = [];
  private parameters!: SimulationParameters;
  private logs: LogEvent[] = [];
  private currentTime: Date = new Date();
  
  constructor() {
    this.resourceManager = new ResourceManager();
  }
  
  /**
   * Инициализировать симуляцию
   */
  async initialize(parameters: SimulationParameters, data: {
    materials: any[];
    equipment: any[];
    roles: any[];
    employees: any[];
    chains: any[];
  }): Promise<void> {
    this.parameters = parameters;
    this.currentTime = parameters.startDate;
    this.logs = [];
    
    this.log("INFO", `Начало симуляции заказа ${parameters.orderId}`);
    this.log("INFO", `Продукт: ${parameters.productName}, Количество: ${parameters.orderQuantity}`);
    this.log("INFO", `Режим разброса: ${parameters.varianceMode}`);
    this.log("INFO", `Настройки: оплата простоя = ${parameters.settings.payIdleTime}, частичная работа = ${parameters.settings.enablePartialWork}`);
    
    // Загрузить данные в ResourceManager
    this.resourceManager.loadMaterials(data.materials);
    this.resourceManager.loadEquipment(data.equipment);
    this.resourceManager.loadRoles(data.roles);
    this.resourceManager.loadEmployees(data.employees);
    
    this.log("INFO", `Загружено ресурсов: материалов = ${data.materials.length}, оборудования = ${data.equipment.length}, ролей = ${data.roles.length}, сотрудников = ${data.employees.length}`);
    
    // Создать цепочки операций
    this.chains = data.chains
      .filter((c: any) => c.enabled)
      .map((c: any) => new OperationChain(c, parameters.orderQuantity));
    
    this.log("INFO", `Загружено цепочек операций: ${this.chains.length}`);
    
    // Вывести информацию по каждой цепочке
    for (const chain of this.chains) {
      this.log("INFO", `Цепочка "${chain.getName()}" (${chain.getType()}): операций = ${chain.getOperations().length}`);
      this.log("INFO", `  Порядок цепочки: ${chain.config.orderIndex}`);
      
      for (const op of chain.getOperations()) {
        this.log("INFO", `    Операция "${op.getName()}": целевое количество = ${op.getTarget()}`);
        this.log("INFO", `      Порядок операции: ${op.config.orderIndex}`);
      }
    }
  }
  
  /**
   * Запустить симуляцию
   */
  async run(): Promise<SimulationResult> {
    const startTime = this.currentTime;
    
    this.log("INFO", "=== Начало производства ===");
    
    // Выполнить все операции
    await this.executeAllOperations();
    
    this.log("INFO", "=== Завершение производства ===");
    
    // Собрать результаты
    const result = this.buildResult(startTime);
    
    return result;
  }
  
  /**
   * Выполнить все операции
   */
  private async executeAllOperations(): Promise<void> {
    let iterationCount = 0;
    const maxIterations = 10000; // Защита от зависания
    
    // Продолжаем пока есть незавершенные операции
    while (!this.allOperationsCompleted() && iterationCount < maxIterations) {
      iterationCount++;
      
      // Найти операцию для выполнения
      const operation = this.findNextOperation();
      
      if (!operation) {
        // Нет доступных операций - все ждут ресурсы
        this.log("WARNING", "Все операции ожидают ресурсы. Проверка возможности частичного выполнения...");
        
        // Попробовать выполнить частичную работу
        if (this.parameters.settings.enablePartialWork) {
          const partialOp = this.findPartialWorkOperation();
          if (partialOp) {
            await this.executeOperationPartial(partialOp);
            continue;
          }
        }
        
        // Если нельзя выполнить частичную работу, завершаем
        this.log("ERROR", "Невозможно продолжить симуляцию - недостаточно ресурсов");
        break;
      }
      
      // Выполнить операцию
      await this.executeOperation(operation);
    }
    
    if (iterationCount >= maxIterations) {
      this.log("ERROR", `Превышено максимальное количество итераций (${maxIterations})`);
    }
  }
  
  /**
   * Проверить, все ли операции завершены
   */
  private allOperationsCompleted(): boolean {
    return this.chains.every(chain => chain.isCompleted());
  }
  
  /**
   * Найти следующую операцию для выполнения
   */
  private findNextOperation(): Operation | null {
    for (const chain of this.chains) {
      for (const operation of chain.getOperations()) {
        if (!operation.isCompleted() && !operation.isWaiting()) {
          // Проверить доступность ресурсов
          if (this.checkResourcesAvailable(operation)) {
            return operation;
          } else {
            operation.setWaiting(true);
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Найти операцию для частичного выполнения
   */
  private findPartialWorkOperation(): Operation | null {
    for (const chain of this.chains) {
      for (const operation of chain.getOperations()) {
        if (!operation.isCompleted() && operation.isWaiting()) {
          // Проверить, есть ли хоть какие-то ресурсы
          if (this.checkPartialResourcesAvailable(operation)) {
            return operation;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Проверить доступность ресурсов для операции
   */
  private checkResourcesAvailable(operation: Operation): boolean {
    const materialReqs = operation.getMaterialRequirements(this.parameters.varianceMode);
    const equipmentReqs = operation.getEquipmentRequirements(this.parameters.varianceMode);
    const roleReqs = operation.getRoleRequirements(this.parameters.varianceMode);
    
    // Проверить материалы
    for (const req of materialReqs) {
      const needed = req.quantityPerUnit * operation.getRemaining();
      if (!this.resourceManager.checkMaterialAvailability(req.materialId, needed)) {
        return false;
      }
    }
    
    // Проверить оборудование
    for (const req of equipmentReqs) {
      const equipment = this.resourceManager.findAvailableEquipment(req.equipmentId, this.currentTime);
      if (!equipment) {
        return false;
      }
    }
    
    // Проверить сотрудников
    for (const req of roleReqs) {
      const employee = this.resourceManager.findAvailableEmployee(req.roleId, this.currentTime);
      if (!employee) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Проверить доступность частичных ресурсов
   */
  private checkPartialResourcesAvailable(operation: Operation): boolean {
    const equipmentReqs = operation.getEquipmentRequirements(this.parameters.varianceMode);
    const roleReqs = operation.getRoleRequirements(this.parameters.varianceMode);
    
    // Должно быть хотя бы одно оборудование и один сотрудник
    let hasEquipment = false;
    let hasEmployee = false;
    
    for (const req of equipmentReqs) {
      if (this.resourceManager.findAvailableEquipment(req.equipmentId, this.currentTime)) {
        hasEquipment = true;
        break;
      }
    }
    
    for (const req of roleReqs) {
      if (this.resourceManager.findAvailableEmployee(req.roleId, this.currentTime)) {
        hasEmployee = true;
        break;
      }
    }
    
    return hasEquipment && hasEmployee;
  }
  
  /**
   * Выполнить операцию полностью
   */
  private async executeOperation(operation: Operation): Promise<void> {
    if (!operation.progress.startTime) {
      operation.start(this.currentTime);
      this.log("OPERATION_START", `Начало операции: ${operation.getName()}`, operation.getId());
    }
    
    const quantity = operation.getRemaining();
    const productivity = operation.calculateProductivity(this.parameters.varianceMode);
    const duration = quantity / productivity;
    
    // Закупить материалы
    await this.purchaseMaterials(operation, quantity);
    
    // Использовать материалы
    await this.consumeMaterials(operation, quantity);
    
    // Занять оборудование и сотрудников
    await this.occupyResources(operation, duration);
    
    // Обновить время
    this.currentTime = new Date(this.currentTime.getTime() + duration * 60 * 60 * 1000);
    
    // Обновить прогресс
    operation.addCompleted(quantity);
    
    if (operation.isCompleted()) {
      operation.complete(this.currentTime);
      this.log("OPERATION_END", `Завершение операции: ${operation.getName()}`, operation.getId());
    }
  }
  
  /**
   * Выполнить операцию частично (1 час работы)
   */
  private async executeOperationPartial(operation: Operation): Promise<void> {
    if (!operation.progress.startTime) {
      operation.start(this.currentTime);
      this.log("OPERATION_START", `Начало операции: ${operation.getName()} (частично)`, operation.getId());
    }
    
    const productivity = operation.calculateProductivity(this.parameters.varianceMode);
    const quantityPerHour = productivity;
    const quantity = Math.min(quantityPerHour, operation.getRemaining());
    const duration = 1; // 1 час
    
    // Проверить и закупить материалы
    const materialReqs = operation.getMaterialRequirements(this.parameters.varianceMode);
    let canProceed = true;
    
    for (const req of materialReqs) {
      const needed = req.quantityPerUnit * quantity;
      if (!this.resourceManager.checkMaterialAvailability(req.materialId, needed)) {
        // Закупить материалы
        await this.purchaseMaterials(operation, quantity);
      }
    }
    
    // Использовать материалы
    await this.consumeMaterials(operation, quantity);
    
    // Занять оборудование и сотрудников
    await this.occupyResources(operation, duration);
    
    // Обновить время
    this.currentTime = new Date(this.currentTime.getTime() + duration * 60 * 60 * 1000);
    
    // Обновить прогресс
    operation.addCompleted(quantity);
    operation.setWaiting(false);
    
    this.log("INFO", `Частичное выполнение операции ${operation.getName()}: +${quantity} деталей`);
    
    if (operation.isCompleted()) {
      operation.complete(this.currentTime);
      this.log("OPERATION_END", `Завершение операции: ${operation.getName()}`, operation.getId());
    }
  }
  
  /**
   * Закупить материалы для операции
   */
  private async purchaseMaterials(operation: Operation, quantity: number): Promise<void> {
    const materialReqs = operation.getMaterialRequirements(this.parameters.varianceMode);
    
    for (const req of materialReqs) {
      const needed = req.quantityPerUnit * quantity;
      const stock = this.resourceManager.getMaterialStock(req.materialId);
      
      if (stock && stock.quantity - stock.minStock < needed) {
        const toPurchase = needed - (stock.quantity - stock.minStock);
        this.resourceManager.purchaseMaterial(req.materialId, toPurchase);
        
        const materialInfo = this.resourceManager.getMaterialInfo(req.materialId);
        this.log("INFO", `Закупка материала: ${materialInfo?.name}, количество: ${toPurchase}`);
      }
    }
  }
  
  /**
   * Использовать материалы для операции
   */
  private async consumeMaterials(operation: Operation, quantity: number): Promise<void> {
    const materialReqs = operation.getMaterialRequirements(this.parameters.varianceMode);
    
    for (const req of materialReqs) {
      const needed = req.quantityPerUnit * quantity;
      this.resourceManager.consumeMaterial(req.materialId, needed);
    }
  }
  
  /**
   * Занять ресурсы (оборудование и сотрудников)
   */
  private async occupyResources(operation: Operation, duration: number): Promise<void> {
    const equipmentReqs = operation.getEquipmentRequirements(this.parameters.varianceMode);
    const roleReqs = operation.getRoleRequirements(this.parameters.varianceMode);
    
    // Занять оборудование
    for (const req of equipmentReqs) {
      const state = this.resourceManager.findAvailableEquipment(req.equipmentId, this.currentTime);
      if (state) {
        this.resourceManager.occupyEquipment(
          req.equipmentId,
          operation.getId(),
          this.currentTime,
          duration
        );
      }
    }
    
    // Занять сотрудников
    for (const req of roleReqs) {
      const state = this.resourceManager.findAvailableEmployee(req.roleId, this.currentTime);
      if (state) {
        this.resourceManager.occupyEmployee(
          state.employeeId,
          operation.getId(),
          this.currentTime,
          duration
        );
      }
    }
  }
  
  /**
   * Собрать результаты симуляции
   */
  private buildResult(startTime: Date): SimulationResult {
    console.log("📊 Сборка результатов симуляции...");
    
    const operations: OperationResult[] = [];
    let totalMaterialCost = 0;
    let totalEquipmentCost = 0;
    let totalLaborCost = 0;
    
    console.log(`  Цепочек операций: ${this.chains?.length || 0}`);
    
    // Собрать результаты по операциям
    for (const chain of this.chains || []) {
      const chainOps = chain.getOperations();
      console.log(`  Цепочка "${chain.getName()}": операций ${chainOps?.length || 0}`);
      
      for (const operation of chainOps || []) {
        const opStartTime = operation.progress.startTime || startTime;
        const opEndTime = operation.progress.endTime || this.currentTime;
        const totalHours = (opEndTime.getTime() - opStartTime.getTime()) / (1000 * 60 * 60);
        
        // Рассчитать затраты на материалы
        const materialCosts = this.calculateMaterialCosts(operation) || [];
        const materialTotal = materialCosts.reduce((sum, m) => sum + (m.totalCost || 0), 0);
        
        // Рассчитать затраты на оборудование
        const equipmentCosts = this.calculateEquipmentCosts(operation) || [];
        const equipmentTotal = equipmentCosts.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        
        // Рассчитать затраты на персонал
        const laborCosts = this.calculateLaborCosts(operation) || [];
        const laborTotal = laborCosts.reduce((sum, l) => sum + (l.totalCost || 0), 0);
        
        totalMaterialCost += materialTotal || 0;
        totalEquipmentCost += equipmentTotal || 0;
        totalLaborCost += laborTotal || 0;
        
        operations.push({
          operationId: operation.getId(),
          operationName: operation.getName(),
          chainId: chain.getId(),
          chainName: chain.getName(),
          chainOrder: chain.config.orderIndex,
          operationOrder: operation.config.orderIndex,
          targetQuantity: operation.getTarget(),
          completedQuantity: operation.getCompleted(),
          startTime: opStartTime,
          endTime: opEndTime,
          totalHours: totalHours || 0,
          materialCosts,
          equipmentCosts,
          laborCosts,
          totalCost: (materialTotal || 0) + (equipmentTotal || 0) + (laborTotal || 0),
        });
      }
    }
    
    console.log(`  Собрано операций: ${operations.length}`);
    console.log(`  Материалы: ${totalMaterialCost}`);
    console.log(`  Оборудование: ${totalEquipmentCost}`);
    console.log(`  Персонал: ${totalLaborCost}`);
    
    // Собрать утилизацию оборудования
    const equipmentUtilization = this.calculateEquipmentUtilization(startTime) || [];
    
    // Собрать утилизацию сотрудников
    const employeeUtilization = this.calculateEmployeeUtilization(startTime) || [];
    
    const totalDuration = (this.currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalCost = (totalMaterialCost || 0) + (totalEquipmentCost || 0) + (totalLaborCost || 0);
    
    console.log(`  Общая длительность: ${totalDuration} часов`);
    console.log(`  Общая стоимость: ${totalCost}`);
    
    return {
      orderId: this.parameters.orderId,
      orderQuantity: this.parameters.orderQuantity,
      parameters: this.parameters,
      startTime,
      endTime: this.currentTime,
      totalDuration: totalDuration || 0,
      operations: operations || [],
      totalMaterialCost: totalMaterialCost || 0,
      totalEquipmentCost: totalEquipmentCost || 0,
      totalLaborCost: totalLaborCost || 0,
      totalCost: totalCost || 0,
      materialUsage: this.resourceManager.getAllMaterialStocks() || [],
      equipmentUtilization: equipmentUtilization || [],
      employeeUtilization: employeeUtilization || [],
    };
  }
  
  /**
   * Рассчитать затраты на материалы для операции
   */
  private calculateMaterialCosts(operation: Operation) {
    const materialReqs = operation.getMaterialRequirements(this.parameters.varianceMode);
    const completedQuantity = operation.getCompleted();
    
    return materialReqs.map((req) => {
      const material = this.resourceManager.getMaterialInfo(req.materialId);
      const quantity = req.quantityPerUnit * completedQuantity;
      const unitCost = material?.cost || 0;
      
      return {
        materialId: req.materialId,
        materialName: material?.name || "Unknown",
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
      };
    });
  }
  
  /**
   * Рассчитать затраты на оборудование для операции
   */
  private calculateEquipmentCosts(operation: Operation) {
    const equipmentReqs = operation.getEquipmentRequirements(this.parameters.varianceMode);
    
    return equipmentReqs.map((req) => {
      const equipment = this.resourceManager.getEquipmentInfo(req.equipmentId);
      const state = this.resourceManager.getEquipmentState(req.equipmentId);
      
      const workHours = state?.workHours || 0;
      const idleHours = state?.idleHours || 0;
      const hourlyRate = equipment?.hourlyDepreciation || 0;
      
      return {
        equipmentId: req.equipmentId,
        equipmentName: equipment?.name || "Unknown",
        workHours,
        idleHours,
        hourlyRate,
        totalCost: workHours * hourlyRate,
      };
    });
  }
  
  /**
   * Рассчитать затраты на персонал для операции
   */
  private calculateLaborCosts(operation: Operation) {
    const roleReqs = operation.getRoleRequirements(this.parameters.varianceMode);
    
    return roleReqs.map((req) => {
      const role = this.resourceManager.getRoleInfo(req.roleId);
      
      // Найти всех сотрудников с этой ролью, которые работали на операции
      const employeeStates = this.resourceManager.getAllEmployeeStates()
        .filter((state) => {
          const employee = this.resourceManager.getEmployeeInfo(state.employeeId);
          return employee?.roles.includes(req.roleId);
        });
      
      // Для простоты берем первого (можно улучшить)
      const state = employeeStates[0];
      const employee = state ? this.resourceManager.getEmployeeInfo(state.employeeId) : undefined;
      
      const workHours = state?.workHours || 0;
      const idleHours = state?.idleHours || 0;
      const paidIdleHours = this.parameters.settings.payIdleTime ? idleHours : 0;
      const hourlyRate = role?.hourlyRate || 0;
      
      return {
        roleId: req.roleId,
        roleName: role?.name || "Unknown",
        employeeId: state?.employeeId || "unknown",
        employeeName: employee?.name || "Unknown",
        workHours,
        idleHours,
        paidIdleHours,
        hourlyRate,
        totalCost: (workHours + paidIdleHours) * hourlyRate,
      };
    });
  }
  
  /**
   * Рассчитать утилизацию оборудования
   */
  private calculateEquipmentUtilization(startTime: Date) {
    const totalDuration = (this.currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    return this.resourceManager.getAllEquipmentStates().map((state) => {
      const equipment = this.resourceManager.getEquipmentInfo(state.equipmentId);
      const workHours = state.workHours;
      const idleHours = totalDuration - workHours;
      const utilizationPercent = totalDuration > 0 ? (workHours / totalDuration) * 100 : 0;
      
      return {
        equipmentId: state.equipmentId,
        equipmentName: equipment?.name || "Unknown",
        totalHours: totalDuration,
        workHours,
        idleHours,
        utilizationPercent,
      };
    });
  }
  
  /**
   * Рассчитать утилизацию сотрудников
   */
  private calculateEmployeeUtilization(startTime: Date) {
    const totalDuration = (this.currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    return this.resourceManager.getAllEmployeeStates().map((state) => {
      const employee = this.resourceManager.getEmployeeInfo(state.employeeId);
      const workHours = state.workHours;
      const idleHours = state.idleHours;
      const paidIdleHours = this.parameters.settings.payIdleTime ? idleHours : 0;
      const utilizationPercent = totalDuration > 0 ? (workHours / totalDuration) * 100 : 0;
      
      return {
        employeeId: state.employeeId,
        employeeName: employee?.name || "Unknown",
        totalHours: totalDuration,
        workHours,
        idleHours,
        paidIdleHours,
        utilizationPercent,
      };
    });
  }
  
  /**
   * Добавить запись в лог
   */
  private log(
    type: LogEvent["type"],
    message: string,
    operationId?: string,
    details?: any
  ): void {
    const operation = operationId
      ? this.findOperationById(operationId)
      : undefined;
      
    const chain = operation
      ? this.findChainByOperation(operation)
      : undefined;
    
    this.logs.push({
      timestamp: this.currentTime,
      type,
      message,
      operationId,
      operationName: operation?.getName(),
      chainId: chain?.getId(),
      chainName: chain?.getName(),
      details,
    });
    
    console.log(`[${this.currentTime.toISOString()}] [${type}] ${message}`);
  }
  
  /**
   * Найти операцию по ID
   */
  private findOperationById(operationId: string): Operation | undefined {
    for (const chain of this.chains) {
      const operation = chain.getOperation(operationId);
      if (operation) return operation;
    }
    return undefined;
  }
  
  /**
   * Найти цепочку по операции
   */
  private findChainByOperation(operation: Operation): OperationChain | undefined {
    return this.chains.find(chain =>
      chain.getOperations().some(op => op.getId() === operation.getId())
    );
  }
  
  /**
   * Получить логи
   */
  getLogs(): LogEvent[] {
    return this.logs;
  }
}
