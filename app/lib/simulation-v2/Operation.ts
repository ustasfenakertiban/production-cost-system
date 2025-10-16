
/**
 * Класс операции производства
 */

import {
  OperationConfig,
  OperationProgress,
  OperationMaterialRequirement,
  OperationEquipmentRequirement,
  OperationRoleRequirement,
  VarianceMode,
} from "./types";

export class Operation {
  public readonly config: OperationConfig;
  public progress: OperationProgress;
  
  constructor(config: OperationConfig, targetQuantity: number) {
    this.config = config;
    this.progress = {
      operationId: config.id,
      completed: 0,
      target: targetQuantity,
      waiting: false,
    };
  }
  
  /**
   * Получить ID операции
   */
  getId(): string {
    return this.config.id;
  }
  
  /**
   * Получить название операции
   */
  getName(): string {
    return this.config.name;
  }
  
  /**
   * Получить целевое количество
   */
  getTarget(): number {
    return this.progress.target;
  }
  
  /**
   * Получить выполненное количество
   */
  getCompleted(): number {
    return this.progress.completed;
  }
  
  /**
   * Проверить, завершена ли операция
   */
  isCompleted(): boolean {
    return this.progress.completed >= this.progress.target;
  }
  
  /**
   * Получить оставшееся количество
   */
  getRemaining(): number {
    return this.progress.target - this.progress.completed;
  }
  
  /**
   * Установить статус ожидания
   */
  setWaiting(waiting: boolean): void {
    this.progress.waiting = waiting;
  }
  
  /**
   * Проверить, ожидает ли операция ресурсы
   */
  isWaiting(): boolean {
    return this.progress.waiting;
  }
  
  /**
   * Начать операцию
   */
  start(time: Date): void {
    this.progress.startTime = time;
  }
  
  /**
   * Завершить операцию
   */
  complete(time: Date): void {
    this.progress.endTime = time;
  }
  
  /**
   * Добавить выполненное количество
   */
  addCompleted(quantity: number): void {
    this.progress.completed = Math.min(
      this.progress.completed + quantity,
      this.progress.target
    );
  }
  
  /**
   * Получить требования к материалам с учетом разброса
   */
  getMaterialRequirements(varianceMode: VarianceMode): OperationMaterialRequirement[] {
    return this.config.materials
      .filter(m => m.enabled)
      .map(m => ({
        ...m,
        quantityPerUnit: this.applyVariance(m.quantityPerUnit, m.variance, varianceMode, true),
      }));
  }
  
  /**
   * Получить требования к оборудованию с учетом разброса
   */
  getEquipmentRequirements(varianceMode: VarianceMode): OperationEquipmentRequirement[] {
    return this.config.equipment
      .filter(e => e.enabled)
      .map(e => ({
        ...e,
        timePerUnit: this.applyVariance(e.timePerUnit, e.variance, varianceMode, false),
        productivityPerHour: e.productivityPerHour
          ? this.applyVariance(e.productivityPerHour, e.variance, varianceMode, true)
          : undefined,
      }));
  }
  
  /**
   * Получить требования к ролям с учетом разброса
   */
  getRoleRequirements(varianceMode: VarianceMode): OperationRoleRequirement[] {
    return this.config.roles
      .filter(r => r.enabled)
      .map(r => ({
        ...r,
        timePerUnit: this.applyVariance(r.timePerUnit, r.variance, varianceMode, false),
        productivityPerHour: r.productivityPerHour
          ? this.applyVariance(r.productivityPerHour, r.variance, varianceMode, true)
          : undefined,
      }));
  }
  
  /**
   * Применить разброс к значению
   */
  private applyVariance(
    value: number,
    variance: number,
    mode: VarianceMode,
    inverseForMinMax: boolean
  ): number {
    if (variance === 0 || mode === "NORMAL") {
      return value;
    }
    
    const variancePercent = variance / 100;
    
    switch (mode) {
      case "MIN_PRODUCTIVITY_MAX_COSTS":
        // Для производительности - минимум, для затрат - максимум
        if (inverseForMinMax) {
          return value * (1 - variancePercent);
        } else {
          return value * (1 + variancePercent);
        }
        
      case "RANDOM_ASYMMETRIC":
        // Случайное значение в диапазоне
        const randomFactor = Math.random() * 2 * variancePercent - variancePercent;
        return value * (1 + randomFactor);
        
      default:
        return value;
    }
  }
  
  /**
   * Рассчитать производительность операции
   * Учитывает производительность оборудования и ролей
   */
  calculateProductivity(varianceMode: VarianceMode): number {
    // Если задана явная производительность операции
    if (this.config.estimatedProductivityPerHour) {
      const variance = this.config.operationDuration || 0; // Используем operationDuration как variance
      return this.applyVariance(
        this.config.estimatedProductivityPerHour,
        variance,
        varianceMode,
        true
      );
    }
    
    // Иначе рассчитываем по оборудованию и ролям
    const equipmentProductivities = this.getEquipmentRequirements(varianceMode)
      .filter(e => e.productivityPerHour !== undefined)
      .map(e => e.productivityPerHour!);
      
    const roleProductivities = this.getRoleRequirements(varianceMode)
      .filter(r => r.productivityPerHour !== undefined)
      .map(r => r.productivityPerHour!);
      
    const allProductivities = [...equipmentProductivities, ...roleProductivities];
    
    // Минимальная производительность из всех ресурсов (узкое место)
    if (allProductivities.length > 0) {
      return Math.min(...allProductivities);
    }
    
    // По умолчанию 1 деталь в час
    return 1;
  }
  
  /**
   * Получить минимальный размер партии
   */
  getMinimumBatchSize(): number {
    return this.config.minimumBatchSize || 1;
  }
}
