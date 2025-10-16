
/**
 * Класс цепочки операций
 */

import { OperationChainConfig, ChainType } from "./types";
import { Operation } from "./Operation";

export class OperationChain {
  public readonly config: OperationChainConfig;
  public readonly operations: Operation[];
  
  constructor(config: OperationChainConfig, orderQuantity: number) {
    this.config = config;
    
    // Определить целевое количество для операций
    const targetQuantity = this.calculateTargetQuantity(orderQuantity);
    
    // Создать операции
    this.operations = config.operations
      .filter(op => op.enabled)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(opConfig => new Operation(opConfig, targetQuantity));
  }
  
  /**
   * Получить ID цепочки
   */
  getId(): string {
    return this.config.id;
  }
  
  /**
   * Получить название цепочки
   */
  getName(): string {
    return this.config.name;
  }
  
  /**
   * Получить тип цепочки
   */
  getType(): ChainType {
    return this.config.chainType;
  }
  
  /**
   * Получить все операции
   */
  getOperations(): Operation[] {
    return this.operations;
  }
  
  /**
   * Получить операцию по ID
   */
  getOperation(operationId: string): Operation | undefined {
    return this.operations.find(op => op.getId() === operationId);
  }
  
  /**
   * Проверить, завершена ли цепочка
   */
  isCompleted(): boolean {
    return this.operations.every(op => op.isCompleted());
  }
  
  /**
   * Получить процент выполнения цепочки
   */
  getCompletionPercent(): number {
    if (this.operations.length === 0) return 100;
    
    const totalProgress = this.operations.reduce(
      (sum, op) => sum + (op.getCompleted() / op.getTarget()) * 100,
      0
    );
    
    return totalProgress / this.operations.length;
  }
  
  /**
   * Рассчитать целевое количество для операций в цепочке
   */
  private calculateTargetQuantity(orderQuantity: number): number {
    if (this.config.chainType === "ONE_TIME") {
      // Для одноразовых операций используем estimatedQuantity
      return this.config.estimatedQuantity || 1;
    } else {
      // Для операций на каждую деталь используем количество заказа
      return orderQuantity;
    }
  }
}
