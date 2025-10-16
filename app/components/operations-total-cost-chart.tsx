
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

interface OperationsTotalCostChartProps {
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
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#6366f1", // indigo
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export default function OperationsTotalCostChart({ 
  operations, 
  totalCosts 
}: OperationsTotalCostChartProps) {
  
  // Prepare data: each operation with its total cost
  const chartData = operations.map((op) => ({
    name: `${op.operationName} (${op.productName})`,
    value: op.totalCost,
    fullName: `${op.chainName} / ${op.operationName} / ${op.productName}`,
    materialCost: op.materialCost,
    equipmentCost: op.equipmentCost,
    laborCost: op.laborCost,
  }));

  const colors = generateColors(chartData.length);

  const formatCurrency = (value: number) => `${(value || 0).toFixed(2)} ₽`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalCosts.total > 0 
        ? ((data.value / totalCosts.total) * 100).toFixed(1)
        : "0.0";
      
      return (
        <div className="bg-background border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Всего:</span>
              <span className="font-medium">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Доля:</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-blue-600">Материалы:</span>
                <span className="font-mono text-xs">{formatCurrency(data.materialCost)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-purple-600">Оборудование:</span>
                <span className="font-mono text-xs">{formatCurrency(data.equipmentCost)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-green-600">Зарплата:</span>
                <span className="font-mono text-xs">{formatCurrency(data.laborCost)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const percentage = totalCosts.total > 0 
      ? ((entry.value / totalCosts.total) * 100).toFixed(1)
      : "0.0";
    
    // Only show label if percentage is significant enough
    if (parseFloat(percentage) < 5) return "";
    
    return `${percentage}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Суммарные затраты по операциям</CardTitle>
        <CardDescription>
          Общая стоимость каждой операции (материалы + оборудование + зарплата)
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
                    const percentage = totalCosts.total > 0 
                      ? ((entry.payload.value / totalCosts.total) * 100).toFixed(1)
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
                <div className="text-muted-foreground mb-1">Всего операций</div>
                <div className="text-2xl font-bold">{operations.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Общая стоимость</div>
                <div className="text-2xl font-bold">{formatCurrency(totalCosts.total)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Средняя стоимость</div>
                <div className="text-2xl font-bold">
                  {operations.length > 0 
                    ? formatCurrency(totalCosts.total / operations.length)
                    : formatCurrency(0)
                  }
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Макс. стоимость</div>
                <div className="text-2xl font-bold">
                  {operations.length > 0
                    ? formatCurrency(Math.max(...operations.map(op => op.totalCost)))
                    : formatCurrency(0)
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Детализация по операциям</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chartData.map((item, index) => {
                const percentage = totalCosts.total > 0 
                  ? ((item.value / totalCosts.total) * 100).toFixed(1)
                  : "0.0";
                
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colors[index] }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.fullName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.value)}</div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
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
