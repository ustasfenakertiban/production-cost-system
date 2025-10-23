
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SummaryTableProps {
  data: {
    totalMaterialCost: number;
    totalEquipmentCost: number;
    totalLaborCost: number;
    totalPeriodicCost: number;
    totalCost: number;
    revenue?: number;
    grossMargin?: number;
    cashEnding: number;
    totalDays: number;
    totalDuration: number;
  };
}

export default function SummaryTable({ data }: SummaryTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' ₽';
  };

  const costItems = [
    {
      name: "Материалы (с НДС)",
      value: data.totalMaterialCost,
      percentage: (data.totalMaterialCost / data.totalCost) * 100,
      color: "bg-red-500",
    },
    {
      name: "Оборудование (амортизация)",
      value: data.totalEquipmentCost,
      percentage: (data.totalEquipmentCost / data.totalCost) * 100,
      color: "bg-purple-500",
    },
    {
      name: "Сотрудники (зарплаты)",
      value: data.totalLaborCost,
      percentage: (data.totalLaborCost / data.totalCost) * 100,
      color: "bg-orange-500",
    },
    {
      name: "Периодические расходы (с НДС)",
      value: data.totalPeriodicCost,
      percentage: (data.totalPeriodicCost / data.totalCost) * 100,
      color: "bg-yellow-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Итоговая сводка по затратам</CardTitle>
        <CardDescription>
          Детализация всех затрат производства за {data.totalDays} дн. ({data.totalDuration.toFixed(1)} ч.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Таблица затрат */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Статья затрат</TableHead>
                <TableHead className="text-right font-semibold">Сумма</TableHead>
                <TableHead className="text-right font-semibold">Доля от общих затрат</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costItems.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-bold bg-muted/30">
                <TableCell>ОБЩИЕ ЗАТРАТЫ</TableCell>
                <TableCell className="text-right font-mono text-lg">
                  {formatCurrency(data.totalCost)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="default" className="font-mono">
                    100.0%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Финансовые показатели */}
        {(data.revenue !== undefined && data.revenue > 0) && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold" colSpan={3}>Финансовые показатели</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Выручка от заказа</TableCell>
                  <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                    {formatCurrency(data.revenue)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Валовая маржа</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(data.grossMargin || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.revenue > 0 && (
                      <Badge 
                        variant={(data.grossMargin || 0) > 0 ? "default" : "destructive"}
                        className="font-mono"
                      >
                        {(((data.grossMargin || 0) / data.revenue) * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t-2 font-bold bg-muted/30">
                  <TableCell>Конечный баланс наличных</TableCell>
                  <TableCell 
                    className={`text-right font-mono text-lg ${
                      data.cashEnding >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(data.cashEnding)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Визуальная шкала */}
        <div>
          <p className="text-sm font-medium mb-2">Структура затрат (визуально)</p>
          <div className="w-full h-12 flex rounded-lg overflow-hidden border">
            {costItems.map((item, index) => (
              <div
                key={index}
                className={`${item.color} flex items-center justify-center text-white text-xs font-semibold`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.name}: ${formatCurrency(item.value)} (${item.percentage.toFixed(1)}%)`}
              >
                {item.percentage > 5 && `${item.percentage.toFixed(0)}%`}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {costItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                <span className="text-muted-foreground">{item.name.split('(')[0].trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
