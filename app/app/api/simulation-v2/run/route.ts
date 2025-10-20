
import { NextRequest, NextResponse } from 'next/server';
import {
  loadMaterials, loadEquipment, loadEmployees, loadOperationChains, loadSimulationSettingsV2,
  loadPaymentSchedule, loadPeriodicExpenses
} from '@/lib/simulation-v2/dataLoader';
import { ResourceManager } from '@/lib/simulation-v2/ResourceManager';
import { SimulationEngine } from '@/lib/simulation-v2/SimulationEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, initialTargetPerChain = {}, salePricePerUnit, orderQty } = body ?? {};
    
    const [materials, equipment, employees, processSpec, settings, periodicExpenses] = await Promise.all([
      loadMaterials(), 
      loadEquipment(), 
      loadEmployees(), 
      loadOperationChains(), 
      loadSimulationSettingsV2(), 
      loadPeriodicExpenses()
    ]);

    const resources = new ResourceManager(materials, equipment, employees, settings.initialCashBalance);
    const targets = new Map<string, number>(Object.entries(initialTargetPerChain));
    const engine = new SimulationEngine(processSpec, resources, settings, targets);

    const payments = orderId ? await loadPaymentSchedule(orderId) : [];
    const totalOrderAmount = (salePricePerUnit && orderQty) ? (Number(salePricePerUnit) * Number(orderQty)) : undefined;
    const inflows = payments.map(p => ({
      dayNumber: p.dayNumber,
      amount: p.amount ?? ((p.percentageOfTotal / 100) * (totalOrderAmount ?? 0))
    }));

    engine.setPaymentInflows(inflows);
    engine.setPeriodicExpenses(periodicExpenses);
    engine.setTotalOrderAmount(totalOrderAmount);

    const result = await engine.run();
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Simulation v2 error:', e);
    return NextResponse.json({ error: e?.message ?? 'Simulation error', stack: e?.stack }, { status: 500 });
  }
}
