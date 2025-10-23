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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SimulationResult } from "@/lib/simulation-v2/types";

interface DailyCostsTableProps {
  simulationResult: SimulationResult;
}

export default function DailyCostsTable({ simulationResult }: DailyCostsTableProps) {
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
              {tableData.map((row, idx) => (
                <TableRow key={row.day} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                  <TableCell className="text-center font-medium">{row.day}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(row.cashStart)}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {row.cashIn > 0 ? `+${formatCurrency(row.cashIn)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {row.materials > 0 ? formatCurrency(row.materials) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {row.labor > 0 ? formatCurrency(row.labor) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-purple-600">
                    {row.depreciation > 0 ? formatCurrency(row.depreciation) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-yellow-600">
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
              ))}
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
  );
}
