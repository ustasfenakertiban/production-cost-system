
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface OperationCostBreakdown {
  operationId: string;
  operationName: string;
  chainName: string;
  productName: string;
  materialCost: number;
  equipmentCost: number;
  laborCost: number;
  totalCost: number;
  materialPercentage: number;
  equipmentPercentage: number;
  laborPercentage: number;
  percentageOfTotal: number;
}

interface CostBreakdownChartProps {
  operations: OperationCostBreakdown[];
  totalCosts: {
    materials: number;
    equipment: number;
    labor: number;
    total: number;
  };
}

const COLORS = {
  material: "#3b82f6", // blue
  equipment: "#8b5cf6", // purple
  labor: "#10b981", // green
};

export default function CostBreakdownChart({ operations, totalCosts }: CostBreakdownChartProps) {
  const [selectedOperation, setSelectedOperation] = useState<OperationCostBreakdown | null>(
    operations.length > 0 ? operations[0] : null
  );

  // Overall cost distribution data
  const overallData = [
    { name: "Материалы", value: totalCosts.materials, color: COLORS.material },
    { name: "Оборудование", value: totalCosts.equipment, color: COLORS.equipment },
    { name: "Сотрудники", value: totalCosts.labor, color: COLORS.labor },
  ].filter(item => item.value > 0);

  // Selected operation cost distribution
  const operationData = selectedOperation ? [
    { name: "Материалы", value: selectedOperation.materialCost, color: COLORS.material },
    { name: "Оборудование", value: selectedOperation.equipmentCost, color: COLORS.equipment },
    { name: "Сотрудники", value: selectedOperation.laborCost, color: COLORS.labor },
  ].filter(item => item.value > 0) : [];

  const formatCurrency = (value: number) => `${(value || 0).toFixed(2)} ₽`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const value = data.value || 0;
      const percent = data.payload.percent ?? 0;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(value)} ({percent.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего затрат</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalCosts.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Материалы</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{formatCurrency(totalCosts.materials)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalCosts.total > 0 ? ((totalCosts.materials / totalCosts.total) * 100).toFixed(1) : 0}%
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Оборудование</CardDescription>
            <CardTitle className="text-2xl text-purple-600">{formatCurrency(totalCosts.equipment)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalCosts.total > 0 ? ((totalCosts.equipment / totalCosts.total) * 100).toFixed(1) : 0}%
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Сотрудники</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(totalCosts.labor)}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalCosts.total > 0 ? ((totalCosts.labor / totalCosts.total) * 100).toFixed(1) : 0}%
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Operations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Операции</CardTitle>
            <CardDescription>
              Всего операций: {operations.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Операция</TableHead>
                    <TableHead className="text-right">Стоимость</TableHead>
                    <TableHead className="text-right">% от общих</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow
                      key={`${op.productName}-${op.operationId}`}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedOperation?.operationId === op.operationId &&
                        selectedOperation?.productName === op.productName
                          ? "bg-muted"
                          : ""
                      }`}
                      onClick={() => setSelectedOperation(op)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{op.operationName}</div>
                          <div className="text-sm text-muted-foreground">{op.productName}</div>
                          <div className="text-xs text-muted-foreground">{op.chainName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(op.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{(op.percentageOfTotal || 0).toFixed(1)}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-6">
          {/* Overall Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Общее распределение затрат</CardTitle>
              <CardDescription>По всем операциям</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overallData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / totalCosts.total) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {overallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Selected Operation Distribution */}
          {selectedOperation && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedOperation.operationName}</CardTitle>
                <CardDescription>
                  {selectedOperation.productName} • {formatCurrency(selectedOperation.totalCost)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={operationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${((entry.value / selectedOperation.totalCost) * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {operationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Материалы:</span>
                    <span className="font-mono">{formatCurrency(selectedOperation.materialCost)} ({(selectedOperation.materialPercentage || 0).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Оборудование:</span>
                    <span className="font-mono">{formatCurrency(selectedOperation.equipmentCost)} ({(selectedOperation.equipmentPercentage || 0).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Сотрудники:</span>
                    <span className="font-mono">{formatCurrency(selectedOperation.laborCost)} ({(selectedOperation.laborPercentage || 0).toFixed(1)}%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
