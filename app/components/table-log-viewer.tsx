
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
    let maxAbsoluteHour = 0;
    let currentAbsoluteHour = 0;
    let currentOperation: string | null = null;
    let currentProduct: string | null = null;
    let currentChain: string | null = null;
    let currentHourDetails: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Определяем абсолютный час
      const hourMatch = line.match(/⏰\s*Час\s+\d+\s*\(абсолютный час:\s*(\d+)\)/i);
      if (hourMatch) {
        currentAbsoluteHour = parseInt(hourMatch[1]);
        maxAbsoluteHour = Math.max(maxAbsoluteHour, currentAbsoluteHour);
        currentHourDetails = [];
        continue;
      }

      // Определяем операцию
      const operationMatch = line.match(/🔧\s*Операция:\s*"([^"]+)"/i);
      if (operationMatch) {
        currentOperation = operationMatch[1];
        currentHourDetails.push(line.trim());
        continue;
      }

      // Определяем товар
      const productMatch = line.match(/Товар:\s*(.+)/i);
      if (productMatch && !productMatch[1].includes("─")) {
        currentProduct = productMatch[1].trim();
        currentHourDetails.push(line.trim());
        continue;
      }

      // Определяем цепочку
      const chainMatch = line.match(/Цепочка:\s*(.+?)\s*\(/i);
      if (chainMatch) {
        currentChain = chainMatch[1].trim();
        currentHourDetails.push(line.trim());
        continue;
      }

      // Собираем детали для этого часа
      if (line.trim() && !line.includes("═══") && !line.includes("║")) {
        currentHourDetails.push(line.trim());
      }

      // Определяем произведенное количество
      const producedMatch = line.match(/✔️\s*Выполнено:\s*(\d+)\s*шт\./i);
      if (producedMatch && currentOperation && currentProduct && currentChain) {
        const quantity = parseInt(producedMatch[1]);
        const key = `${currentProduct}|${currentChain}|${currentOperation}`;
        
        if (!operationsMap.has(key)) {
          operationsMap.set(key, {
            operationName: currentOperation,
            productName: currentProduct,
            chainName: currentChain,
            hourlyProduction: new Map(),
            dailyProduction: new Map(),
            hourlyDetails: new Map(),
          });
        }

        const opData = operationsMap.get(key)!;
        opData.hourlyProduction.set(currentAbsoluteHour, quantity);
        opData.hourlyDetails.set(currentAbsoluteHour, [...currentHourDetails]);
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
                          return (
                            <TableCell
                              key={`${key}-${absHour}`}
                              className={cn(
                                "text-center text-sm border-l cursor-pointer hover:ring-2 hover:ring-primary transition-all",
                                quantity && quantity > 0 ? "bg-green-50 dark:bg-green-950/20 font-medium" : "text-muted-foreground/30"
                              )}
                              onClick={() => quantity && quantity > 0 && handleCellClick(op, absHour, day.dayNum, hourInDay, quantity)}
                            >
                              {quantity && quantity > 0 ? quantity : "—"}
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
