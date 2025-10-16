
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationCostBreakdown } from "./cost-breakdown-chart";

interface OperationsLaborCostChartProps {
  operations: OperationCostBreakdown[];
  totalCosts: {
    materials: number;
    equipment: number;
    labor: number;
    total: number;
  };
}

// Generate colors for operations
const generateColors = (count: number) => {
  const colors = [
    "#10b981", // green
    "#059669", // dark green
    "#34d399", // light green
    "#6ee7b7", // lighter green
    "#a7f3d0", // lightest green
    "#84cc16", // lime
    "#22c55e", // green-500
    "#16a34a", // green-600
    "#15803d", // green-700
    "#14532d", // green-900
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export default function OperationsLaborCostChart({ 
  operations, 
  totalCosts 
}: OperationsLaborCostChartProps) {
  
  // Prepare data: each operation with its labor cost only
  // Filter out operations with zero labor cost
  const chartData = operations
    .filter(op => op.laborCost > 0)
    .map((op) => ({
      name: `${op.operationName} (${op.productName})`,
      value: op.laborCost,
      fullName: `${op.chainName} / ${op.operationName} / ${op.productName}`,
      totalCost: op.totalCost,
    }));

  const colors = generateColors(chartData.length);

  const formatCurrency = (value: number) => `${(value || 0).toFixed(2)} ₽`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalCosts.labor > 0 
        ? ((data.value / totalCosts.labor) * 100).toFixed(1)
        : "0.0";
      const percentageOfTotal = totalCosts.total > 0
        ? ((data.value / totalCosts.total) * 100).toFixed(1)
        : "0.0";
      
      return (
        <div className="bg-background border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Зарплата:</span>
              <span className="font-medium text-green-600">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">От всех зарплат:</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">От общих затрат:</span>
              <span className="font-medium">{percentageOfTotal}%</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Полная стоимость:</span>
                <span className="font-mono text-xs">{formatCurrency(data.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const percentage = totalCosts.labor > 0 
      ? ((entry.value / totalCosts.labor) * 100).toFixed(1)
      : "0.0";
    
    // Only show label if percentage is significant enough
    if (parseFloat(percentage) < 5) return "";
    
    return `${percentage}%`;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Затраты на зарплату по операциям</CardTitle>
          <CardDescription>
            Стоимость зарплаты сотрудников для каждой операции
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            Нет данных о зарплатах в операциях
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Затраты на зарплату по операциям</CardTitle>
        <CardDescription>
          Стоимость зарплаты сотрудников для каждой операции
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomLabel}
                  outerRadius={180}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => {
                    const percentage = totalCosts.labor > 0 
                      ? ((entry.payload.value / totalCosts.labor) * 100).toFixed(1)
                      : "0.0";
                    return `${value} (${percentage}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Statistics */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Операций с зарплатами</div>
                <div className="text-2xl font-bold">{chartData.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Всего зарплат</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCosts.labor)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Средняя зарплата</div>
                <div className="text-2xl font-bold">
                  {chartData.length > 0 
                    ? formatCurrency(totalCosts.labor / chartData.length)
                    : formatCurrency(0)
                  }
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Доля в общих затратах</div>
                <div className="text-2xl font-bold">
                  {totalCosts.total > 0
                    ? `${((totalCosts.labor / totalCosts.total) * 100).toFixed(1)}%`
                    : "0%"
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Детализация зарплат по операциям</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((item, index) => {
                  const percentage = totalCosts.labor > 0 
                    ? ((item.value / totalCosts.labor) * 100).toFixed(1)
                    : "0.0";
                  const originalIndex = chartData.indexOf(item);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors[originalIndex] }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.fullName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(item.value)}</div>
                        <div className="text-sm text-muted-foreground">{percentage}% от зарплат</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
