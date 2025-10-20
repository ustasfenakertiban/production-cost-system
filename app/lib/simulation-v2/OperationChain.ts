
import { ChainSpec } from './types';
import { Operation } from './Operation';

export class OperationChain {
  readonly spec: ChainSpec;
  readonly operations: Operation[];

  constructor(spec: ChainSpec, initialTarget: number) {
    this.spec = spec;
    const sorted = [...spec.operations].sort((a, b) => a.orderIndex - b.orderIndex);
    this.operations = sorted.map(op => new Operation(op, initialTarget));
  }

  getOperationsInOrder(): Operation[] { return this.operations; }

  getPreviousOperation(op: Operation): Operation | null {
    const idx = this.operations.indexOf(op);
    if (idx <= 0) return null;
    return this.operations[idx - 1];
  }

  isFirstInChain(op: Operation): boolean { return this.getPreviousOperation(op) === null; }
  isCompleted(): boolean { return this.operations.every(o => o.isCompleted()); }
  get orderIndex(): number { return this.spec.orderIndex; }
  get type() { return this.spec.type; }
  
  resetHourCounters() {
    this.operations.forEach(o => o.resetHourCounters());
  }
}
