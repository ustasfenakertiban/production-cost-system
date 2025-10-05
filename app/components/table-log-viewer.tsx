
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

interface HourDetails {
  absoluteHour: number;
  hourInDay: number;
  dayNum: number;
  quantity: number;
  details: string[];
}

interface OperationProduction {
  operationName: string;
  productName: string;
  chainName: string;
  hourlyProduction: Map<number, number>; // absoluteHour -> quantity produced
  dailyProduction: Map<number, number>; // day -> total quantity produced
  hourlyDetails: Map<number, string[]>; // absoluteHour -> log details
  operationSpans: Array<{ startHour: number; endHour: number; quantity: number }>; // periods when operation was active
}

interface TableLogViewerProps {
  log: string;
}

export default function TableLogViewer({ log }: TableLogViewerProps) {
  const [viewMode, setViewMode] = useState<"hours" | "days">("hours");
  const [selectedCell, setSelectedCell] = useState<HourDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const tableData = useMemo(() => {
    const lines = log.split("\n");
    const operationsMap = new Map<string, OperationProduction>();
    
    // Храним активные операции: ключ -> стартовый час
    const activeOperations = new Map<string, { startHour: number; details: string[] }>();
    
    let maxAbsoluteHour = 0;
    let currentAbsoluteHour = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Определяем абсолютный час
      const hourMatch = line.match(/⏰\s*Час\s+\d+\s*\(абсолютный час:\s*(\d+)\)/i);
      if (hourMatch) {
        currentAbsoluteHour = parseInt(hourMatch[1]);
        maxAbsoluteHour = Math.max(maxAbsoluteHour, currentAbsoluteHour);
        continue;
      }

      // Ищем начало операции
      const operationStartMatch = line.match(/🚀\s*НАЧАЛО ОПЕРАЦИИ:\s*"([^"]+)"/i);
      if (operationStartMatch) {
        const operationName = operationStartMatch[1];
        let product = "";
        let chain = "";
        
        // Ищем товар и цепочку в следующих строках
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          
          const productMatch = nextLine.match(/Товар:\s*(.+)/i);
          if (productMatch && !productMatch[1].includes("─")) {
            product = productMatch[1].trim();
          }
          
          const chainMatch = nextLine.match(/Цепочка:\s*(.+?)\s*\(/i);
          if (chainMatch) {
            chain = chainMatch[1].trim();
          }
          
          // Если нашли и товар и цепочку, прекращаем поиск
          if (product && chain) break;
          
          // Если встретили новую операцию или новый час, прекращаем поиск
          if (nextLine.match(/🚀\s*НАЧАЛО ОПЕРАЦИИ/i) || nextLine.match(/⏰\s*Час/i)) break;
        }
        
        if (product && chain) {
          const key = `${product}|${chain}|${operationName}`;
          activeOperations.set(key, { startHour: currentAbsoluteHour, details: [line.trim()] });
        }
        continue;
      }

      // Ищем завершение операции (когда есть "Выполнено")
      const operationCompleteMatch = line.match(/🔧\s*Операция:\s*"([^"]+)"/i);
      if (operationCompleteMatch) {
        const operationName = operationCompleteMatch[1];
        let product = "";
        let chain = "";
        let quantity = 0;
        let blockDetails: string[] = [line.trim()];
        
        // Ищем товар, цепочку и количество в следующих строках
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j];
          blockDetails.push(nextLine.trim());
          
          const productMatch = nextLine.match(/Товар:\s*(.+)/i);
          if (productMatch && !productMatch[1].includes("─")) {
            product = productMatch[1].trim();
          }
          
          const chainMatch = nextLine.match(/Цепочка:\s*(.+?)\s*\(/i);
          if (chainMatch) {
            chain = chainMatch[1].trim();
          }
          
          const producedMatch = nextLine.match(/✔️\s*Выполнено:\s*(\d+)\s*шт\./i);
          if (producedMatch) {
            quantity = parseInt(producedMatch[1]);
            break;
          }
          
          // Если встретили новую операцию или новый час, прекращаем поиск
          if (nextLine.match(/🔧\s*Операция/i) || nextLine.match(/⏰\s*Час/i)) break;
        }
        
        if (product && chain && quantity > 0) {
          const key = `${product}|${chain}|${operationName}`;
          const startInfo = activeOperations.get(key);
          const startHour = startInfo ? startInfo.startHour : currentAbsoluteHour;
          
          if (!operationsMap.has(key)) {
            operationsMap.set(key, {
              operationName: operationName,
              productName: product,
              chainName: chain,
              hourlyProduction: new Map(),
              dailyProduction: new Map(),
              hourlyDetails: new Map(),
              operationSpans: [],
            });
          }

          const opData = operationsMap.get(key)!;
          const existingQuantity = opData.hourlyProduction.get(currentAbsoluteHour) || 0;
          opData.hourlyProduction.set(currentAbsoluteHour, existingQuantity + quantity);
          
          // Сохраняем период выполнения операции
          opData.operationSpans.push({
            startHour: startHour,
            endHour: currentAbsoluteHour,
            quantity: quantity,
          });
          
          // Сохраняем детали операции для всех часов в диапазоне
          for (let h = startHour; h <= currentAbsoluteHour; h++) {
            const existingDetails = opData.hourlyDetails.get(h) || [];
            opData.hourlyDetails.set(h, [...existingDetails, ...blockDetails]);
          }
          
          // Удаляем из активных операций
          activeOperations.delete(key);
        }
        continue;
      }
    }

    // Извлекаем hoursPerDay из лога
    let hoursPerDay = 8;
    const hoursPerDayMatch = log.match(/Часов в рабочем дне:\s*(\d+)/i);
    if (hoursPerDayMatch) {
      hoursPerDay = parseInt(hoursPerDayMatch[1]);
    }

    // Вычисляем дневную продукцию
    operationsMap.forEach((opData) => {
      opData.hourlyProduction.forEach((quantity, absHour) => {
        const dayNum = Math.ceil(absHour / hoursPerDay);
        const current = opData.dailyProduction.get(dayNum) || 0;
        opData.dailyProduction.set(dayNum, current + quantity);
      });
    });

    // Группируем часы по дням
    const days: Array<{ dayNum: number; hours: number[] }> = [];
    for (let absHour = 1; absHour <= maxAbsoluteHour; absHour++) {
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

    return {
      operations: Array.from(operationsMap.values()),
      days,
      daysOnly,
      maxAbsoluteHour,
      hoursPerDay,
    };
  }, [log]);

  const handleCellClick = (
    operation: OperationProduction,
    absHour: number,
    dayNum: number,
    hourInDay: number,
    quantity: number
  ) => {
    const details = operation.hourlyDetails.get(absHour) || [];
    setSelectedCell({
      absoluteHour: absHour,
      hourInDay,
      dayNum,
      quantity,
      details,
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
                      Товар
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
                    Товар
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
                const key = `${op.productName}|${op.chainName}|${op.operationName}`;
                return (
                  <TableRow key={key} className={cn(idx % 2 === 0 && "bg-muted/20")}>
                    <TableCell className="sticky left-0 bg-background z-10 border-r font-medium text-sm">
                      {op.operationName}
                    </TableCell>
                    <TableCell className="sticky left-[200px] bg-background z-10 border-r text-xs text-muted-foreground">
                      <div className="max-w-[150px] truncate" title={op.productName}>
                        {op.productName}
                      </div>
                      <div className="text-xs text-muted-foreground/70 truncate" title={op.chainName}>
                        {op.chainName}
                      </div>
                    </TableCell>
                    {viewMode === "hours" ? (
                      tableData.days.map((day) =>
                        day.hours.map((absHour) => {
                          const quantity = op.hourlyProduction.get(absHour);
                          const hourInDay = ((absHour - 1) % tableData.hoursPerDay) + 1;
                          
                          // Проверяем, находится ли текущий час в периоде выполнения операции
                          const isInOperationSpan = op.operationSpans.some(
                            span => absHour >= span.startHour && absHour <= span.endHour
                          );
                          
                          // Проверяем, является ли это час завершения операции
                          const isCompletionHour = quantity && quantity > 0;
                          
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
                              onClick={() => isInOperationSpan && handleCellClick(op, absHour, day.dayNum, hourInDay, quantity || 0)}
                            >
                              {isCompletionHour ? quantity : isInOperationSpan ? "●" : "—"}
                            </TableCell>
                          );
                        })
                      )
                    ) : (
                      tableData.daysOnly.map((dayNum) => {
                        const quantity = op.dailyProduction.get(dayNum);
                        return (
                          <TableCell
                            key={`${key}-day-${dayNum}`}
                            className={cn(
                              "text-center text-sm border-l",
                              quantity && quantity > 0 ? "bg-blue-50 dark:bg-blue-950/20 font-medium" : "text-muted-foreground/30"
                            )}
                          >
                            {quantity && quantity > 0 ? quantity : "—"}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
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
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-lg font-semibold">
                  Произведено: {selectedCell.quantity} шт.
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Подробная информация:</h4>
                <div className="bg-muted/30 p-4 rounded-lg space-y-1 font-mono text-xs max-h-[400px] overflow-auto">
                  {selectedCell.details.map((detail, idx) => (
                    <div key={idx} className="text-sm">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
