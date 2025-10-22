
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SimulationResult } from "@/lib/simulation-v2/types";

interface CashFlowChartProps {
  simulationResult: SimulationResult;
}

export default function CashFlowChart({ simulationResult }: CashFlowChartProps) {
  // Подготовка данных для графика
  const chartData = simulationResult.days.map((day) => {
    const cashIn = day.cashIn || 0;
    const cashOutMaterials = (day.cashOut?.materials || 0) + (day.cashOut?.materialsVat || 0);
    const cashOutLabor = day.cashOut?.labor || 0;
    const cashOutPeriodic = (day.cashOut?.periodic || 0) + (day.cashOut?.periodicVat || 0);
    const totalCashOut = cashOutMaterials + cashOutLabor + cashOutPeriodic;

    return {
      day: day.day,
      cashIn,
      cashOutMaterials,
      cashOutLabor,
      cashOutPeriodic,
      totalCashOut,
      depreciation: day.nonCash?.depreciation || 0,
    };
  });

  // Рассчитываем накопительный баланс
  let cumulativeBalance = simulationResult.totals.cashEnding - 
                          chartData.reduce((sum, d) => sum + d.cashIn - d.totalCashOut, 0);
  
  const chartDataWithBalance = chartData.map((d) => {
    cumulativeBalance += d.cashIn - d.totalCashOut;
    return {
      ...d,
      balance: cumulativeBalance,
    };
  });

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
          <p className="font-semibold mb-2">День {data.day}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-green-600 dark:text-green-400">Приход:</span>
              <span className="font-semibold">{data.cashIn.toFixed(2)} ₽</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-600 dark:text-red-400">Расход:</span>
              <span className="font-semibold">{data.totalCashOut.toFixed(2)} ₽</span>
            </div>
            <div className="ml-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-4">
                <span className="text-red-500">- Материалы (вкл. НДС):</span>
                <span>{data.cashOutMaterials.toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-orange-500">- Труд:</span>
                <span>{data.cashOutLabor.toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-yellow-500">- Периодические расходы:</span>
                <span>{data.cashOutPeriodic.toFixed(2)} ₽</span>
              </div>
            </div>
            <div className="border-t border-border pt-1 mt-2">
              <div className="flex justify-between gap-4">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Баланс на конец дня:</span>
                <span className="font-bold">{data.balance.toFixed(2)} ₽</span>
              </div>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span className="text-purple-600 dark:text-purple-400">Амортизация (не денежная):</span>
              <span>{data.depreciation.toFixed(2)} ₽</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>График денежного потока по дням</CardTitle>
        <CardDescription>
          Приход и расход денежных средств с отображением баланса на конец каждого дня
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={chartDataWithBalance} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              label={{ value: "День", position: "insideBottom", offset: -10 }}
            />
            <YAxis 
              label={{ value: "Сумма (₽)", angle: -90, position: "insideLeft" }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="rect"
            />
            
            {/* Столбцы прихода */}
            <Bar 
              dataKey="cashIn" 
              name="Приход" 
              fill="#10b981" 
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
            
            {/* Столбцы расхода (stacked) */}
            <Bar 
              dataKey="cashOutMaterials" 
              name="Расход: Материалы" 
              fill="#ef4444" 
              stackId="b"
            />
            <Bar 
              dataKey="cashOutLabor" 
              name="Расход: Труд" 
              fill="#f97316" 
              stackId="b"
            />
            <Bar 
              dataKey="cashOutPeriodic" 
              name="Расход: Периодические" 
              fill="#eab308" 
              stackId="b"
              radius={[4, 4, 0, 0]}
            />
            
            {/* Линия баланса */}
            <Line 
              type="monotone" 
              dataKey="balance" 
              name="Баланс на конец дня" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Сводная информация */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-300 font-medium">Общий приход</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {chartData.reduce((sum, d) => sum + d.cashIn, 0).toFixed(2)} ₽
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-300 font-medium">Общий расход</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {chartData.reduce((sum, d) => sum + d.totalCashOut, 0).toFixed(2)} ₽
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <div>Материалы: {chartData.reduce((sum, d) => sum + d.cashOutMaterials, 0).toFixed(2)} ₽</div>
              <div>Труд: {chartData.reduce((sum, d) => sum + d.cashOutLabor, 0).toFixed(2)} ₽</div>
              <div>Периодические: {chartData.reduce((sum, d) => sum + d.cashOutPeriodic, 0).toFixed(2)} ₽</div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Конечный баланс</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {simulationResult.totals.cashEnding.toFixed(2)} ₽
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
