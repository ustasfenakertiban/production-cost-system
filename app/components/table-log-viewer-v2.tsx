
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
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SimulationResult, DayLog, HourLog, ChainHourLog, OperationHourLog } from "@/lib/simulation-v2/types";

interface HourDetails {
  absoluteHour: number;
  hourInDay: number;
  dayNum: number;
  quantity: number;
  pulledFromPrev: number;
  materialsConsumed: Array<{ materialId: string; materialName: string; qty: number; net: number; vat: number }>;
  laborCost: number;
  depreciation: number;
  totalCost: number;
}

interface OperationProduction {
  chainId: string;
  chainName: string;
  chainOrder: number;
  operationId: string;
  operationName: string;
  operationOrder: number;
  hourlyProduction: Map<number, OperationHourLog>; // absoluteHour -> log
  dailyProduction: Map<number, number>; // day -> total quantity produced
  operationSpans: Array<{ startHour: number; endHour: number; quantity: number }>;
  operationDaySpans: Array<{ startDay: number; endDay: number; quantity: number }>;
}

interface TableLogViewerV2Props {
  simulationResult: SimulationResult;
  materialNames: Map<string, string>; // materialId -> materialName
  operationMetadata: Map<string, { chainName: string; operationName: string; chainOrder: number; operationOrder: number }>; // chainId|operationId -> metadata
}

export default function TableLogViewerV2({ simulationResult, materialNames, operationMetadata }: TableLogViewerV2Props) {
  const [viewMode, setViewMode] = useState<"hours" | "days">("hours");
  const [selectedCell, setSelectedCell] = useState<HourDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const tableData = useMemo(() => {
    const operationsMap = new Map<string, OperationProduction>();
    
    let maxAbsoluteHour = 0;
    let maxActiveAbsoluteHour = 0; // Максимальный час с реальной активностью
    const hoursPerDay = simulationResult.days[0]?.hours?.length || 8;

    // Проходим по всем дням и часам
    for (const day of simulationResult.days) {
      for (const hourLog of day.hours) {
        const absoluteHour = (day.day - 1) * hoursPerDay + hourLog.hour;
        maxAbsoluteHour = Math.max(maxAbsoluteHour, absoluteHour);
        
        // Проверяем, есть ли активность в этот час
        let hasActivity = false;

        // Проходим по всем цепочкам и операциям
        for (const chain of hourLog.chains) {
          for (const op of chain.ops) {
            // Проверяем, есть ли производство
            if (op.produced > 0) {
              hasActivity = true;
              maxActiveAbsoluteHour = Math.max(maxActiveAbsoluteHour, absoluteHour);
            }
            const key = `${chain.chainId}|${op.opId}`;

            if (!operationsMap.has(key)) {
              // Получаем метаданные операции
              const metadata = operationMetadata.get(key);
              
              operationsMap.set(key, {
                chainId: chain.chainId,
                chainName: metadata?.chainName || 'Unknown Chain',
                chainOrder: metadata?.chainOrder || 0,
                operationId: op.opId,
                operationName: metadata?.operationName || 'Unknown Operation',
                operationOrder: metadata?.operationOrder || 0,
                hourlyProduction: new Map(),
                dailyProduction: new Map(),
                operationSpans: [],
                operationDaySpans: [],
              });
            }

            const opData = operationsMap.get(key)!;
            opData.hourlyProduction.set(absoluteHour, op);

            // Агрегируем дневную продукцию
            const current = opData.dailyProduction.get(day.day) || 0;
            opData.dailyProduction.set(day.day, current + (op.produced || 0));
          }
        }
      }
    }

    // Определяем периоды выполнения операций
    operationsMap.forEach((opData) => {
      const sortedHours = Array.from(opData.hourlyProduction.keys()).sort((a, b) => a - b);
      
      if (sortedHours.length > 0) {
        let spanStart = sortedHours[0];
        let spanEnd = sortedHours[0];
        let spanQuantity = opData.hourlyProduction.get(sortedHours[0])!.produced || 0;

        for (let i = 1; i < sortedHours.length; i++) {
          const currentHour = sortedHours[i];
          const prevHour = sortedHours[i - 1];

          if (currentHour === prevHour + 1) {
            // Продолжение периода
            spanEnd = currentHour;
            spanQuantity += opData.hourlyProduction.get(currentHour)!.produced || 0;
          } else {
            // Новый период
            opData.operationSpans.push({ startHour: spanStart, endHour: spanEnd, quantity: spanQuantity });
            spanStart = currentHour;
            spanEnd = currentHour;
            spanQuantity = opData.hourlyProduction.get(currentHour)!.produced || 0;
          }
        }

        // Добавляем последний период
        opData.operationSpans.push({ startHour: spanStart, endHour: spanEnd, quantity: spanQuantity });
      }

      // Преобразуем в дневные периоды
      opData.operationSpans.forEach((span) => {
        const startDay = Math.ceil(span.startHour / hoursPerDay);
        const endDay = Math.ceil(span.endHour / hoursPerDay);

        const existingSpan = opData.operationDaySpans.find(
          ds => ds.startDay === startDay && ds.endDay === endDay
        );

        if (existingSpan) {
          existingSpan.quantity += span.quantity;
        } else {
          opData.operationDaySpans.push({ startDay, endDay, quantity: span.quantity });
        }
      });
    });

    // Используем максимальный час с активностью, добавляем небольшой буфер
    // Если активности не было, показываем хотя бы первый день
    const effectiveMaxHour = maxActiveAbsoluteHour > 0 
      ? maxActiveAbsoluteHour + hoursPerDay // Добавляем один день буфера
      : Math.min(hoursPerDay, maxAbsoluteHour);

    // Группируем часы по дням
    const days: Array<{ dayNum: number; hours: number[] }> = [];
    for (let absHour = 1; absHour <= effectiveMaxHour; absHour++) {
      const dayNum = Math.ceil(absHour / hoursPerDay);
      let day = days.find(d => d.dayNum === dayNum);
      if (!day) {
        day = { dayNum, hours: [] };
        days.push(day);
      }
      day.hours.push(absHour);
    }

    // Создаем массив только дней
    const daysOnly = Array.from(new Set(days.map(d => d.dayNum))).sort((a, b) => a - b);

    // Сортируем операции по порядку выполнения
    const sortedOperations = Array.from(operationsMap.values()).sort((a, b) => {
      if (a.chainOrder !== b.chainOrder) return a.chainOrder - b.chainOrder;
      if (a.operationOrder !== b.operationOrder) return a.operationOrder - b.operationOrder;
      return a.operationName.localeCompare(b.operationName);
    });

    return {
      operations: sortedOperations,
      days,
      daysOnly,
      maxAbsoluteHour: effectiveMaxHour,
      hoursPerDay,
    };
  }, [simulationResult, operationMetadata]);

  const handleCellClick = (
    operation: OperationProduction,
    absHour: number,
    dayNum: number,
    hourInDay: number
  ) => {
    const op = operation.hourlyProduction.get(absHour);
    if (!op) return;

    // Обогащаем данные именами материалов
    const materialsConsumed = (op.materialsConsumed || []).map(m => ({
      materialId: m.materialId,
      materialName: materialNames.get(m.materialId) || m.materialId,
      qty: m.qty,
      net: m.net,
      vat: m.vat,
    }));

    const totalCost = 
      materialsConsumed.reduce((sum, m) => sum + m.net + m.vat, 0) +
      (op.laborCost || 0) +
      (op.depreciation || 0);

    setSelectedCell({
      absoluteHour: absHour,
      hourInDay,
      dayNum,
      quantity: op.produced || 0,
      pulledFromPrev: op.pulledFromPrev || 0,
      materialsConsumed,
      laborCost: op.laborCost || 0,
      depreciation: op.depreciation || 0,
      totalCost,
    });
    setIsDialogOpen(true);
  };

  const handleDayCellClick = (
    operation: OperationProduction,
    dayNum: number
  ) => {
    const hoursInDay = tableData.days.find(d => d.dayNum === dayNum)?.hours || [];
    if (hoursInDay.length === 0) return;

    // Агрегируем данные за весь день
    let totalQuantity = 0;
    let totalPulledFromPrev = 0;
    const materialsMap = new Map<string, { materialName: string; qty: number; net: number; vat: number }>();
    let totalLaborCost = 0;
    let totalDepreciation = 0;

    for (const absHour of hoursInDay) {
      const op = operation.hourlyProduction.get(absHour);
      if (!op) continue;

      totalQuantity += op.produced || 0;
      totalPulledFromPrev += op.pulledFromPrev || 0;
      totalLaborCost += op.laborCost || 0;
      totalDepreciation += op.depreciation || 0;

      for (const mat of op.materialsConsumed || []) {
        const existing = materialsMap.get(mat.materialId);
        if (existing) {
          existing.qty += mat.qty;
          existing.net += mat.net;
          existing.vat += mat.vat;
        } else {
          materialsMap.set(mat.materialId, {
            materialName: materialNames.get(mat.materialId) || mat.materialId,
            qty: mat.qty,
            net: mat.net,
            vat: mat.vat,
          });
        }
      }
    }

    const materialsConsumed = Array.from(materialsMap.entries()).map(([id, data]) => ({
      materialId: id,
      ...data,
    }));

    const totalCost = 
      materialsConsumed.reduce((sum, m) => sum + m.net + m.vat, 0) +
      totalLaborCost +
      totalDepreciation;

    const firstHourOfDay = hoursInDay[0];
    const hourInDay = ((firstHourOfDay - 1) % tableData.hoursPerDay) + 1;

    setSelectedCell({
      absoluteHour: firstHourOfDay,
      hourInDay,
      dayNum,
      quantity: totalQuantity,
      pulledFromPrev: totalPulledFromPrev,
      materialsConsumed,
      laborCost: totalLaborCost,
      depreciation: totalDepreciation,
      totalCost,
    });
    setIsDialogOpen(true);
  };

  if (tableData.operations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Нет данных для отображения в таблице
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>Режим отображения:</Label>
        <Select value={viewMode} onValueChange={(value: "hours" | "days") => setViewMode(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hours">По часам</SelectItem>
            <SelectItem value="days">По дням</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-auto max-h-[600px] max-w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {viewMode === "hours" ? (
                <>
                  <TableRow>
                    <TableHead rowSpan={2} className="sticky left-0 bg-background z-20 border-r min-w-[200px]">
                      Операция
                    </TableHead>
                    <TableHead rowSpan={2} className="sticky left-[200px] bg-background z-20 border-r min-w-[150px]">
                      Цепочка
                    </TableHead>
                    {tableData.days.map((day) => (
                      <TableHead
                        key={day.dayNum}
                        colSpan={day.hours.length}
                        className="text-center border-x bg-muted/50"
                      >
                        День {day.dayNum}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    {tableData.days.map((day) =>
                      day.hours.map((absHour) => {
                        const hourInDay = ((absHour - 1) % tableData.hoursPerDay) + 1;
                        return (
                          <TableHead
                            key={absHour}
                            className="text-center text-xs min-w-[60px] border-l"
                          >
                            Ч{hourInDay}
                          </TableHead>
                        );
                      })
                    )}
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-20 border-r min-w-[200px]">
                    Операция
                  </TableHead>
                  <TableHead className="sticky left-[200px] bg-background z-20 border-r min-w-[150px]">
                    Цепочка
                  </TableHead>
                  {tableData.daysOnly.map((dayNum) => (
                    <TableHead key={dayNum} className="text-center border-x min-w-[100px]">
                      День {dayNum}
                    </TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {tableData.operations.map((op, idx) => {
                const key = `${op.chainId}|${op.operationId}`;
                return (
                  <TableRow key={key} className={cn(idx % 2 === 0 && "bg-muted/20")}>
                    <TableCell className="sticky left-0 bg-background z-10 border-r font-medium text-sm">
                      {op.operationName}
                    </TableCell>
                    <TableCell className="sticky left-[200px] bg-background z-10 border-r text-xs text-muted-foreground">
                      <div className="max-w-[150px] truncate" title={op.chainName}>
                        {op.chainName}
                      </div>
                    </TableCell>
                    {viewMode === "hours" ? (
                      tableData.days.map((day) =>
                        day.hours.map((absHour) => {
                          const opLog = op.hourlyProduction.get(absHour);
                          const quantity = opLog?.produced || 0;
                          const hourInDay = ((absHour - 1) % tableData.hoursPerDay) + 1;
                          
                          const isInOperationSpan = op.operationSpans.some(
                            span => absHour >= span.startHour && absHour <= span.endHour
                          );
                          
                          const isCompletionHour = quantity > 0;
                          
                          return (
                            <TableCell
                              key={`${key}-${absHour}`}
                              className={cn(
                                "text-center text-sm border-l transition-all",
                                isInOperationSpan && "cursor-pointer hover:ring-2 hover:ring-primary",
                                isCompletionHour 
                                  ? "bg-green-100 dark:bg-green-900/40 font-bold text-green-900 dark:text-green-100" 
                                  : isInOperationSpan 
                                  ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" 
                                  : "text-muted-foreground/30"
                              )}
                              onClick={() => isInOperationSpan && handleCellClick(op, absHour, day.dayNum, hourInDay)}
                            >
                              {isCompletionHour ? quantity : isInOperationSpan ? "●" : "—"}
                            </TableCell>
                          );
                        })
                      )
                    ) : (
                      tableData.daysOnly.map((dayNum) => {
                        const quantity = op.dailyProduction.get(dayNum) || 0;
                        
                        const isInOperationDaySpan = op.operationDaySpans.some(
                          span => dayNum >= span.startDay && dayNum <= span.endDay
                        );
                        
                        const isCompletionDay = quantity > 0;
                        
                        return (
                          <TableCell
                            key={`${key}-day-${dayNum}`}
                            className={cn(
                              "text-center text-sm border-l transition-all",
                              isInOperationDaySpan && "cursor-pointer hover:ring-2 hover:ring-primary",
                              isCompletionDay 
                                ? "bg-green-100 dark:bg-green-900/40 font-bold text-green-900 dark:text-green-100" 
                                : isInOperationDaySpan 
                                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" 
                                : "text-muted-foreground/30"
                            )}
                            onClick={() => isInOperationDaySpan && handleDayCellClick(op, dayNum)}
                          >
                            {isCompletionDay ? quantity : isInOperationDaySpan ? "●" : "—"}
                          </TableCell>
                        );
                      })
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Детали производства
            </DialogTitle>
            <DialogDescription>
              {selectedCell && (
                <>
                  День {selectedCell.dayNum}, Час {selectedCell.hourInDay} (Абсолютный час: {selectedCell.absoluteHour})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Произведено</div>
                  <div className="text-2xl font-semibold">{selectedCell.quantity} шт.</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Взято с предыдущей операции</div>
                  <div className="text-2xl font-semibold">{selectedCell.pulledFromPrev} шт.</div>
                </div>
              </div>

              {selectedCell.materialsConsumed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">📦 МАТЕРИАЛЫ:</h4>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    {selectedCell.materialsConsumed.map((mat, idx) => (
                      <div key={idx} className="border-b border-border/50 pb-2 last:border-0">
                        <div className="font-medium">{mat.materialName}: {mat.qty.toFixed(2)} ед.</div>
                        <div className="text-sm text-muted-foreground ml-4">
                          - Чистая стоимость: {mat.net.toFixed(2)} ₽
                        </div>
                        <div className="text-sm text-muted-foreground ml-4">
                          - НДС: {mat.vat.toFixed(2)} ₽
                        </div>
                        <div className="text-sm font-semibold ml-4">
                          - Всего: {(mat.net + mat.vat).toFixed(2)} ₽
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t-2 border-border">
                      <div className="font-semibold">ИТОГО МАТЕРИАЛЫ:</div>
                      <div className="text-sm ml-4">
                        - Чистая стоимость: {selectedCell.materialsConsumed.reduce((sum, m) => sum + m.net, 0).toFixed(2)} ₽
                      </div>
                      <div className="text-sm ml-4">
                        - НДС: {selectedCell.materialsConsumed.reduce((sum, m) => sum + m.vat, 0).toFixed(2)} ₽
                      </div>
                      <div className="text-sm font-bold ml-4">
                        - Всего: {selectedCell.materialsConsumed.reduce((sum, m) => sum + m.net + m.vat, 0).toFixed(2)} ₽
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">👷 ТРУД:</h4>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-lg font-semibold">{selectedCell.laborCost.toFixed(2)} ₽</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    (детализация по сотрудникам пока недоступна)
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">⚙️ АМОРТИЗАЦИЯ ОБОРУДОВАНИЯ:</h4>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-lg font-semibold">{selectedCell.depreciation.toFixed(2)} ₽</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    (детализация по оборудованию пока недоступна)
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
                <h4 className="font-semibold text-sm mb-2">💰 ИТОГО ЗА {viewMode === "hours" ? "ЧАС" : "ДЕНЬ"}:</h4>
                <div className="text-2xl font-bold">{selectedCell.totalCost.toFixed(2)} ₽</div>
                <div className="text-sm text-muted-foreground mt-2">
                  <div>Материалы: {selectedCell.materialsConsumed.reduce((sum, m) => sum + m.net + m.vat, 0).toFixed(2)} ₽</div>
                  <div>Труд: {selectedCell.laborCost.toFixed(2)} ₽</div>
                  <div>Амортизация: {selectedCell.depreciation.toFixed(2)} ₽</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
