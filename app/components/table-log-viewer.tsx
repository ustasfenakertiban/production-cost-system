
"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface OperationProduction {
  operationName: string;
  productName: string;
  chainName: string;
  hourlyProduction: Map<number, number>; // absoluteHour -> quantity produced
}

interface TableLogViewerProps {
  log: string;
}

export default function TableLogViewer({ log }: TableLogViewerProps) {
  const tableData = useMemo(() => {
    const lines = log.split("\n");
    const operationsMap = new Map<string, OperationProduction>();
    let maxAbsoluteHour = 0;
    let currentAbsoluteHour = 0;
    let currentOperation: string | null = null;
    let currentProduct: string | null = null;
    let currentChain: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Определяем абсолютный час
      const hourMatch = line.match(/⏰\s*Час\s+\d+\s*\(абсолютный час:\s*(\d+)\)/i);
      if (hourMatch) {
        currentAbsoluteHour = parseInt(hourMatch[1]);
        maxAbsoluteHour = Math.max(maxAbsoluteHour, currentAbsoluteHour);
        continue;
      }

      // Определяем операцию
      const operationMatch = line.match(/🔧\s*Операция:\s*"([^"]+)"/i);
      if (operationMatch) {
        currentOperation = operationMatch[1];
        continue;
      }

      // Определяем товар
      const productMatch = line.match(/Товар:\s*(.+)/i);
      if (productMatch && !productMatch[1].includes("─")) {
        currentProduct = productMatch[1].trim();
        continue;
      }

      // Определяем цепочку
      const chainMatch = line.match(/Цепочка:\s*(.+?)\s*\(/i);
      if (chainMatch) {
        currentChain = chainMatch[1].trim();
        continue;
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
          });
        }

        const opData = operationsMap.get(key)!;
        opData.hourlyProduction.set(currentAbsoluteHour, quantity);
      }
    }

    // Группируем часы по дням (предполагая hoursPerDay из контекста)
    // Извлекаем hoursPerDay из лога
    let hoursPerDay = 8;
    const hoursPerDayMatch = log.match(/Часов в рабочем дне:\s*(\d+)/i);
    if (hoursPerDayMatch) {
      hoursPerDay = parseInt(hoursPerDayMatch[1]);
    }

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

    return {
      operations: Array.from(operationsMap.values()),
      days,
      maxAbsoluteHour,
      hoursPerDay,
    };
  }, [log]);

  if (tableData.operations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Нет данных для отображения в таблице
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
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
                {tableData.days.map((day) =>
                  day.hours.map((absHour) => {
                    const quantity = op.hourlyProduction.get(absHour);
                    return (
                      <TableCell
                        key={`${key}-${absHour}`}
                        className={cn(
                          "text-center text-sm border-l",
                          quantity && quantity > 0 ? "bg-green-50 dark:bg-green-950/20 font-medium" : "text-muted-foreground/30"
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
    </ScrollArea>
  );
}
