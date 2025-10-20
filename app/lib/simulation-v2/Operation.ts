
import { OperationSpec } from './types';

export class Operation {
  readonly spec: OperationSpec;
  remaining: number;
  outgoingBuffer: number;
  transferredCount: number;
  hourCycleCounter: number;
  private producedThisHour = 0;

  constructor(spec: OperationSpec, initialTarget: number) {
    this.spec = spec;
    this.remaining = initialTarget;
    this.outgoingBuffer = 0;
    this.transferredCount = 0;
    this.hourCycleCounter = 0;
  }

  isCompleted(): boolean { return this.remaining <= 0; }
  getMinStartInput(): number { return this.spec.minStartInput ?? 0; }
  getOutgoingBuffer(): number { return this.outgoingBuffer; }
  resetHourCounters() { this.producedThisHour = 0; }
  getProducedThisHour() { return this.producedThisHour; }

  pullFromPrevious(prev: Operation, desiredQty: number): number {
    const available = prev.getOutgoingBuffer();
    if (available <= 0) return 0;
    const pulled = Math.min(available, desiredQty);
    prev.outgoingBuffer -= pulled;
    prev.transferredCount += pulled;
    return pulled;
  }

  produceForHour(qty: number) {
    const produced = Math.min(qty, this.remaining);
    this.remaining -= produced;
    this.outgoingBuffer += produced;
    this.hourCycleCounter += 1;
    this.producedThisHour += produced;
    return produced;
  }
}
