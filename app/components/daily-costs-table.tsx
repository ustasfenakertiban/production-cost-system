"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SimulationResult, DayLog } from "@/lib/simulation-v2/types";

interface ReferenceData {
  materials: Record<string, { id: string; name: string; unitCost: number }>;
  equipment: Record<string, { id: string; name: string }>;
  employees: Record<string, { id: string; name: string; hourlyWage: number }>;
}

interface DailyCostsTableProps {
  simulationResult: SimulationResult;
  referenceData: ReferenceData | null;
}

interface MaterialPurchaseItem {
  materialId: string;
  materialName: string;
  qty: number;
  unitCost: number;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  orderDay: number;
  etaArrivalDay: number;
}

interface ExpenseDetail {
  day: number;
  type: 'materials' | 'labor' | 'depreciation' | 'periodic' | 'cashIn';
  details: string[];
  total: number;
  totalVat?: number;
}

export default function DailyCostsTable({ simulationResult, referenceData }: DailyCostsTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const tableData = useMemo(() => {
    if (!simulationResult?.days || simulationResult.days.length === 0) {
      return [];
    }

    return simulationResult.days.map((day) => {
      const materialsTotal = (day.cashOut?.materials ?? 0) + (day.cashOut?.materialsVat ?? 0);
      const laborTotal = day.cashOut?.labor ?? 0;
      const depreciationTotal = day.nonCash?.depreciation ?? 0;
      const periodicTotal = (day.cashOut?.periodic ?? 0) + (day.cashOut?.periodicVat ?? 0);
      const cashIn = day.cashIn ?? 0;
      
      const totalCostForDay = materialsTotal + laborTotal + depreciationTotal + periodicTotal;
      const netCashFlow = cashIn - totalCostForDay;

      return {
        day: day.day,
        cashStart: day.cashStart ?? 0,
        cashIn,
        materials: materialsTotal,
        labor: laborTotal,
        depreciation: depreciationTotal,
        periodic: periodicTotal,
        totalCost: totalCostForDay,
        netCashFlow,
        cashEnd: day.cashEnd ?? 0,
      };
    });
  }, [simulationResult]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' ₽';
  };

  const getExpenseDetails = (day: DayLog, type: 'materials' | 'labor' | 'depreciation' | 'periodic' | 'cashIn'): ExpenseDetail => {
    const details: string[] = [];
    let total = 0;
    let totalVat = 0;
    
    // Получаем доступ к simulationResult для детализации покупок материалов
    const currentSimResult = simulationResult;

    switch (type) {
      case 'materials':
        // Общая сумма оплаты за день
        const totalMaterialsPaid = (day.cashOut?.materials ?? 0) + (day.cashOut?.materialsVat ?? 0);
        const totalMaterialsNet = day.cashOut?.materials ?? 0;
        const totalMaterialsVat = day.cashOut?.materialsVat ?? 0;
        
        if (totalMaterialsPaid > 0) {
          details.push('💰 ОПЛАТА МАТЕРИАЛОВ ЗА ДЕНЬ:');
          details.push('');
          details.push(`Всего оплачено: ${totalMaterialsPaid.toFixed(2)} ₽`);
          details.push(`  └─ Базовая стоимость: ${totalMaterialsNet.toFixed(2)} ₽`);
          details.push(`  └─ НДС: ${totalMaterialsVat.toFixed(2)} ₽`);
          details.push('');
          
          // Детализация покупок материалов
          if (currentSimResult.materialBatches && currentSimResult.materialBatches.length > 0) {
            // Находим все покупки, которые оплачивались в этот день
            const purchasesThisDay: MaterialPurchaseItem[] = [];
            
            for (const batch of currentSimResult.materialBatches) {
              let netPaid = 0;
              let vatPaid = 0;
              
              // Проверяем предоплату
              if (batch.orderDay === day.day) {
                netPaid += batch.prepayNet;
                vatPaid += batch.prepayVat;
              }
              
              // Проверяем постоплату (происходит в день прибытия материалов)
              if (batch.etaArrivalDay === day.day) {
                netPaid += batch.postpayNet;
                vatPaid += batch.postpayVat;
              }
              
              if (netPaid > 0 || vatPaid > 0) {
                const matName = referenceData?.materials[batch.materialId]?.name || batch.materialId;
                purchasesThisDay.push({
                  materialId: batch.materialId,
                  materialName: matName,
                  qty: batch.qty,
                  unitCost: batch.unitCost,
                  vatRate: batch.vatRate,
                  netAmount: netPaid,
                  vatAmount: vatPaid,
                  totalAmount: netPaid + vatPaid,
                  orderDay: batch.orderDay,
                  etaArrivalDay: batch.etaArrivalDay,
                });
              }
            }
            
            if (purchasesThisDay.length > 0) {
              details.push('🛒 ДЕТАЛИЗАЦИЯ ПОКУПОК:');
              details.push('');
              
              let subtotalNet = 0;
              let subtotalVat = 0;
              
              purchasesThisDay.forEach((purchase, idx) => {
                details.push(`${idx + 1}. ${purchase.materialName}`);
                details.push(`   Количество: ${purchase.qty.toFixed(2)} ед.`);
                details.push(`   Цена за единицу: ${purchase.unitCost.toFixed(2)} ₽/ед.`);
                details.push(`   Базовая стоимость: ${(purchase.qty * purchase.unitCost).toFixed(2)} ₽`);
                details.push(`   НДС (${(purchase.vatRate * 100).toFixed(0)}%): ${(purchase.qty * purchase.unitCost * purchase.vatRate).toFixed(2)} ₽`);
                details.push(`   Оплачено сегодня: ${purchase.totalAmount.toFixed(2)} ₽`);
                
                if (purchase.orderDay === day.day && purchase.etaArrivalDay !== day.day) {
                  details.push(`   📅 Заказ размещен сегодня (День ${purchase.orderDay})`);
                  details.push(`   🚚 Ожидается прибытие: День ${purchase.etaArrivalDay}`);
                  details.push(`   💳 Тип оплаты: Предоплата`);
                } else if (purchase.etaArrivalDay === day.day && purchase.orderDay !== day.day) {
                  details.push(`   📅 Заказ размещен: День ${purchase.orderDay}`);
                  details.push(`   🚚 Прибытие сегодня (День ${purchase.etaArrivalDay})`);
                  details.push(`   💳 Тип оплаты: Постоплата`);
                } else if (purchase.orderDay === day.day && purchase.etaArrivalDay === day.day) {
                  details.push(`   📅 Заказ размещен и получен сегодня (День ${day.day})`);
                  details.push(`   💳 Тип оплаты: Полная оплата`);
                }
                
                details.push('');
                subtotalNet += purchase.netAmount;
                subtotalVat += purchase.vatAmount;
              });
              
              details.push(`Всего покупок: ${purchasesThisDay.length} шт.`);
              details.push(`Итого оплачено: ${(subtotalNet + subtotalVat).toFixed(2)} ₽`);
            }
          }
          
          details.push('');
          details.push('─'.repeat(50));
        }
        
        // Показываем фактически использованные материалы за день
        const materialsMap = new Map<string, { qty: number; net: number; vat: number }>();
        
        for (const hour of day.hours) {
          for (const chain of hour.chains) {
            for (const op of chain.ops) {
              if (op.materialsConsumed && op.materialsConsumed.length > 0) {
                for (const mat of op.materialsConsumed) {
                  const existing = materialsMap.get(mat.materialId);
                  if (existing) {
                    existing.qty += mat.qty;
                    existing.net += mat.net;
                    existing.vat += mat.vat;
                  } else {
                    materialsMap.set(mat.materialId, {
                      qty: mat.qty,
                      net: mat.net,
                      vat: mat.vat,
                    });
                  }
                }
              }
            }
          }
        }

        if (materialsMap.size > 0) {
          details.push('');
          details.push('📦 ФАКТИЧЕСКИ ИСПОЛЬЗОВАНО В ПРОИЗВОДСТВЕ:');
          details.push('');
          let totalUsedNet = 0;
          let totalUsedVat = 0;
          materialsMap.forEach((data, matId) => {
            const matName = referenceData?.materials[matId]?.name || matId;
            const unitCost = referenceData?.materials[matId]?.unitCost || 0;
            details.push(`• ${matName}: ${data.qty.toFixed(2)} ед. × ${unitCost.toFixed(2)} ₽/ед. = ${data.net.toFixed(2)} ₽ (+ НДС ${data.vat.toFixed(2)} ₽)`);
            totalUsedNet += data.net;
            totalUsedVat += data.vat;
          });
          details.push('');
          details.push(`Итого использовано: ${(totalUsedNet + totalUsedVat).toFixed(2)} ₽`);
          
          // Показываем разницу между оплатой и использованием
          if (totalMaterialsPaid > 0 && Math.abs(totalMaterialsPaid - (totalUsedNet + totalUsedVat)) > 100) {
            const diff = totalMaterialsPaid - (totalUsedNet + totalUsedVat);
            details.push('');
            details.push(`⚠️ РАЗНИЦА: ${diff.toFixed(2)} ₽`);
            if (diff > 0) {
              details.push('   Материалы оплачены, но еще не использованы в производстве.');
              details.push('   Они хранятся на складе для будущего использования.');
            } else {
              details.push('   Использованы материалы, оплаченные ранее.');
            }
          }
        } else if (totalMaterialsPaid > 0) {
          details.push('');
          details.push('📦 Материалы оплачены, но еще не использовались в производстве.');
          details.push('   Они будут использованы в последующие дни.');
        }

        if (totalMaterialsPaid === 0 && materialsMap.size === 0) {
          details.push('Материалы не закупались и не использовались в этот день');
        }
        
        total = totalMaterialsNet;
        totalVat = totalMaterialsVat;
        break;

      case 'labor':
        // Агрегируем зарплаты по сотрудникам с операциями
        const laborByEmployee = new Map<string, { cost: number; operations: Map<string, { operationName: string; chainName: string; cost: number }> }>();
        
        for (const hour of day.hours) {
          for (const chain of hour.chains) {
            for (const op of chain.ops) {
              if (op.employeesUsed && op.employeesUsed.length > 0) {
                for (const emp of op.employeesUsed) {
                  let empData = laborByEmployee.get(emp.employeeId);
                  if (!empData) {
                    empData = { cost: 0, operations: new Map() };
                    laborByEmployee.set(emp.employeeId, empData);
                  }
                  empData.cost += emp.cost;
                  total += emp.cost;
                  
                  // Добавляем информацию об операции
                  const opKey = `${chain.chainName}|${op.opName || op.opId}`;
                  const opData = empData.operations.get(opKey);
                  if (opData) {
                    opData.cost += emp.cost;
                  } else {
                    empData.operations.set(opKey, {
                      operationName: op.opName || op.opId || 'Unknown',
                      chainName: chain.chainName || 'Unknown Chain',
                      cost: emp.cost
                    });
                  }
                }
              } else if (op.laborCost > 0) {
                // Fallback если детализация недоступна
                total += op.laborCost;
              }
            }
          }
        }

        if (laborByEmployee.size > 0) {
          // Группируем сотрудников с их зарплатами и операциями
          const employeeDetails: Array<{ name: string; cost: number; operations: Array<{ operationName: string; chainName: string; cost: number }> }> = [];
          laborByEmployee.forEach((data, empId) => {
            const empName = referenceData?.employees[empId]?.name || empId;
            const operations = Array.from(data.operations.values());
            employeeDetails.push({ name: empName, cost: data.cost, operations });
          });
          
          // Сортируем по убыванию стоимости
          employeeDetails.sort((a, b) => b.cost - a.cost);
          
          details.push('👷 ЗАРПЛАТЫ ПО СОТРУДНИКАМ:');
          details.push('');
          employeeDetails.forEach(({ name, cost, operations }) => {
            details.push(`• ${name}: ${cost.toFixed(2)} ₽`);
            if (operations.length > 0) {
              operations.forEach(op => {
                details.push(`  └─ ${op.chainName} → ${op.operationName}: ${op.cost.toFixed(2)} ₽`);
              });
            }
          });
        } else {
          details.push('Зарплаты не начислялись в этот день');
        }
        break;

      case 'depreciation':
        // Агрегируем амортизацию по оборудованию
        const depreciationByEquipment = new Map<string, number>();
        
        for (const hour of day.hours) {
          for (const chain of hour.chains) {
            for (const op of chain.ops) {
              if (op.equipmentUsed && op.equipmentUsed.length > 0) {
                for (const eq of op.equipmentUsed) {
                  const existing = depreciationByEquipment.get(eq.equipmentId) || 0;
                  depreciationByEquipment.set(eq.equipmentId, existing + eq.cost);
                  total += eq.cost;
                }
              } else if (op.depreciation > 0) {
                // Fallback если детализация недоступна
                total += op.depreciation;
              }
            }
          }
        }

        if (depreciationByEquipment.size > 0) {
          // Группируем оборудование с амортизацией
          const equipmentDetails: Array<{ name: string; cost: number }> = [];
          depreciationByEquipment.forEach((cost, eqId) => {
            const eqName = referenceData?.equipment[eqId]?.name || eqId;
            equipmentDetails.push({ name: eqName, cost });
          });
          
          // Сортируем по убыванию стоимости
          equipmentDetails.sort((a, b) => b.cost - a.cost);
          
          details.push('⚙️ АМОРТИЗАЦИЯ ПО ОБОРУДОВАНИЮ:');
          details.push('');
          equipmentDetails.forEach(({ name, cost }) => {
            details.push(`• ${name}: ${cost.toFixed(2)} ₽`);
          });
        } else {
          details.push('Амортизация не начислялась в этот день');
        }
        break;

      case 'periodic':
        if (day.cashOut?.periodic > 0 || day.cashOut?.periodicVat > 0) {
          const periodicNet = day.cashOut?.periodic || 0;
          const periodicVat = day.cashOut?.periodicVat || 0;
          total = periodicNet;
          totalVat = periodicVat;
          details.push(`Периодические расходы (базовые): ${periodicNet.toFixed(2)} ₽`);
          details.push(`НДС на периодические расходы: ${periodicVat.toFixed(2)} ₽`);
          details.push(`Итого с НДС: ${(periodicNet + periodicVat).toFixed(2)} ₽`);
        } else {
          details.push('Периодические расходы не начислялись в этот день');
        }
        break;

      case 'cashIn':
        const cashIn = day.cashIn || 0;
        total = cashIn;
        if (cashIn > 0) {
          details.push(`Оплата от клиента по графику платежей: ${cashIn.toFixed(2)} ₽`);
        } else {
          details.push('Поступлений в этот день не было');
        }
        break;
    }

    return {
      day: day.day,
      type,
      details,
      total,
      totalVat: totalVat > 0 ? totalVat : undefined,
    };
  };

  const handleCellClick = (day: DayLog, type: 'materials' | 'labor' | 'depreciation' | 'periodic' | 'cashIn') => {
    const expenseDetail = getExpenseDetails(day, type);
    setSelectedExpense(expenseDetail);
    setIsDialogOpen(true);
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'materials': return 'Материалы';
      case 'labor': return 'Зарплаты';
      case 'depreciation': return 'Амортизация';
      case 'periodic': return 'Периодические расходы';
      case 'cashIn': return 'Поступления';
      default: return type;
    }
  };

  if (tableData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Нет данных для отображения
      </div>
    );
  }

  // Итоги
  const totals = tableData.reduce((acc, row) => ({
    cashIn: acc.cashIn + row.cashIn,
    materials: acc.materials + row.materials,
    labor: acc.labor + row.labor,
    depreciation: acc.depreciation + row.depreciation,
    periodic: acc.periodic + row.periodic,
    totalCost: acc.totalCost + row.totalCost,
    netCashFlow: acc.netCashFlow + row.netCashFlow,
  }), {
    cashIn: 0,
    materials: 0,
    labor: 0,
    depreciation: 0,
    periodic: 0,
    totalCost: 0,
    netCashFlow: 0,
  });

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Расходы и денежные потоки по дням</CardTitle>
        <CardDescription>
          Детализация всех расходов и остатков денежных средств за каждый день производства
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="text-center font-semibold">День</TableHead>
                <TableHead className="text-right font-semibold">Баланс начало</TableHead>
                <TableHead className="text-right font-semibold text-green-600">Поступления</TableHead>
                <TableHead className="text-right font-semibold text-red-600">Материалы</TableHead>
                <TableHead className="text-right font-semibold text-orange-600">Зарплаты</TableHead>
                <TableHead className="text-right font-semibold text-purple-600">Амортизация</TableHead>
                <TableHead className="text-right font-semibold text-yellow-600">Периодические</TableHead>
                <TableHead className="text-right font-semibold">Итого расходы</TableHead>
                <TableHead className="text-right font-semibold">Чистый поток</TableHead>
                <TableHead className="text-right font-semibold">Баланс конец</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, idx) => {
                const dayLog = simulationResult.days.find(d => d.day === row.day);
                return (
                  <TableRow key={row.day} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="text-center font-medium">{row.day}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.cashStart)}</TableCell>
                    <TableCell 
                      className="text-right font-mono text-green-600 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      onClick={() => dayLog && handleCellClick(dayLog, 'cashIn')}
                      title="Кликните для просмотра детализации поступлений"
                    >
                      {row.cashIn > 0 ? `+${formatCurrency(row.cashIn)}` : '—'}
                    </TableCell>
                    <TableCell 
                      className="text-right font-mono text-red-600 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      onClick={() => dayLog && handleCellClick(dayLog, 'materials')}
                      title="Кликните для просмотра детализации материалов"
                    >
                      {row.materials > 0 ? formatCurrency(row.materials) : '—'}
                    </TableCell>
                    <TableCell 
                      className="text-right font-mono text-orange-600 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                      onClick={() => dayLog && handleCellClick(dayLog, 'labor')}
                      title="Кликните для просмотра детализации зарплат"
                    >
                      {row.labor > 0 ? formatCurrency(row.labor) : '—'}
                    </TableCell>
                    <TableCell 
                      className="text-right font-mono text-purple-600 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                      onClick={() => dayLog && handleCellClick(dayLog, 'depreciation')}
                      title="Кликните для просмотра детализации амортизации"
                    >
                      {row.depreciation > 0 ? formatCurrency(row.depreciation) : '—'}
                    </TableCell>
                    <TableCell 
                      className="text-right font-mono text-yellow-600 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                      onClick={() => dayLog && handleCellClick(dayLog, 'periodic')}
                      title="Кликните для просмотра детализации периодических расходов"
                    >
                      {row.periodic > 0 ? formatCurrency(row.periodic) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(row.totalCost)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${row.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.netCashFlow >= 0 ? `+${formatCurrency(row.netCashFlow)}` : formatCurrency(row.netCashFlow)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(row.cashEnd)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Итоговая строка */}
              <TableRow className="bg-primary/10 font-bold border-t-2">
                <TableCell className="text-center">ИТОГО</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  +{formatCurrency(totals.cashIn)}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {formatCurrency(totals.materials)}
                </TableCell>
                <TableCell className="text-right font-mono text-orange-600">
                  {formatCurrency(totals.labor)}
                </TableCell>
                <TableCell className="text-right font-mono text-purple-600">
                  {formatCurrency(totals.depreciation)}
                </TableCell>
                <TableCell className="text-right font-mono text-yellow-600">
                  {formatCurrency(totals.periodic)}
                </TableCell>
                <TableCell className="text-right font-mono text-lg">
                  {formatCurrency(totals.totalCost)}
                </TableCell>
                <TableCell className={`text-right font-mono text-lg ${totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.netCashFlow >= 0 ? `+${formatCurrency(totals.netCashFlow)}` : formatCurrency(totals.netCashFlow)}
                </TableCell>
                <TableCell className="text-right font-mono text-lg">
                  {formatCurrency(tableData[tableData.length - 1]?.cashEnd ?? 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Диалог детализации расходов */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedExpense && `Детализация: ${getTypeName(selectedExpense.type)}`}
          </DialogTitle>
          <DialogDescription>
            {selectedExpense && `День ${selectedExpense.day}`}
          </DialogDescription>
        </DialogHeader>
        {selectedExpense && (
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
              <div className="text-sm text-muted-foreground mb-1">Общая сумма за день:</div>
              <div className="text-2xl font-bold">
                {formatCurrency(selectedExpense.total + (selectedExpense.totalVat || 0))}
              </div>
              {selectedExpense.totalVat && selectedExpense.totalVat > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  <div>Без НДС: {formatCurrency(selectedExpense.total)}</div>
                  <div>НДС: {formatCurrency(selectedExpense.totalVat)}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📋 ДЕТАЛИЗАЦИЯ:</h4>
              <div className="bg-muted/30 p-4 rounded-lg space-y-2 max-h-[400px] overflow-y-auto">
                {selectedExpense.details.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedExpense.details.map((detail, idx) => (
                      <li 
                        key={idx} 
                        className="border-b border-border/50 pb-2 last:border-0 text-sm"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Нет детализации для отображения
                  </div>
                )}
              </div>
            </div>


          </div>
        )}
      </DialogContent>
    </Dialog>
  </>
  );
}
