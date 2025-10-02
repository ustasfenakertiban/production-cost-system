
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronUp, ChevronDown, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductionOperationDialog } from "./production-operation-dialog";
import { calculateOperationCosts, formatCurrency, formatPercent } from "@/lib/cost-calculations";

interface Operation {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  comments?: string;
  enabled: boolean;
  cycleHours?: number;
  operationMaterials?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    variance?: number;
    enabled: boolean;
    material: {
      vatPercentage: number;
    };
  }>;
  operationEquipment?: Array<{
    id: string;
    machineTime: number;
    hourlyRate: number;
    totalCost: number;
    variance?: number;
    enabled: boolean;
  }>;
  operationRoles?: Array<{
    id: string;
    timeSpent: number;
    rate: number;
    totalCost: number;
    variance?: number;
    enabled: boolean;
  }>;
}

interface Chain {
  id: string;
  name: string;
  chainType: string;
  comments?: string;
  orderIndex: number;
  enabled: boolean;
  operations: Operation[];
}

interface OperationChainCardProps {
  chain: Chain;
  onUpdate: () => void;
}

export function OperationChainCard({ chain, onUpdate }: OperationChainCardProps) {
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const { toast } = useToast();

  const handleAddOperation = () => {
    setEditingOperation(null);
    setOperationDialogOpen(true);
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
    setOperationDialogOpen(true);
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту операцию?')) {
      return;
    }

    try {
      const response = await fetch(`/api/production-operations/${operationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Операция удалена",
        });
        onUpdate();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления операции:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить операцию",
        variant: "destructive",
      });
    }
  };

  const handleMoveOperation = async (operationId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/production-operations/${operationId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка перемещения');
      }
    } catch (error) {
      console.error('Ошибка перемещения операции:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось переместить операцию",
        variant: "destructive",
      });
    }
  };

  const handleOperationDialogClose = () => {
    setOperationDialogOpen(false);
    setEditingOperation(null);
    onUpdate();
  };

  const sortedOperations = [...chain.operations].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Операции ({chain.operations.length})</h4>
          <Button variant="outline" size="sm" onClick={handleAddOperation}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить операцию
          </Button>
        </div>

        {sortedOperations.length > 0 ? (
          <div className="space-y-2">
            {sortedOperations.map((operation, index) => (
              <div 
                key={operation.id}
                className={`flex items-center justify-between p-3 rounded border relative ${
                  operation.enabled 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-red-50/50 border-red-200'
                }`}
              >
                {/* Индикатор состояния в углу */}
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  operation.enabled ? 'bg-green-500' : 'bg-red-500'
                }`} title={operation.enabled ? 'Включена в расчеты' : 'Выключена из расчетов'} />
                
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`min-w-[40px] justify-center ${
                    !operation.enabled ? 'opacity-60' : ''
                  }`}>
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      operation.enabled ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {operation.name}
                      {!operation.enabled && (
                        <span className="ml-2 text-xs text-red-600">
                          (выключена)
                        </span>
                      )}
                    </div>
                    {operation.description && (
                      <div className={`text-sm ${
                        operation.enabled ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {operation.description}
                      </div>
                    )}
                    {operation.cycleHours && (
                      <div className={`text-xs ${
                        operation.enabled ? 'text-blue-600' : 'text-blue-400'
                      }`}>
                        Рабочий цикл: {operation.cycleHours} ч
                      </div>
                    )}
                    
                    {/* Стоимость операции */}
                    {operation.operationMaterials || operation.operationEquipment || operation.operationRoles ? (() => {
                      const costs = calculateOperationCosts({
                        id: operation.id,
                        name: operation.name,
                        enabled: operation.enabled,
                        operationMaterials: operation.operationMaterials || [],
                        operationEquipment: operation.operationEquipment || [],
                        operationRoles: operation.operationRoles || []
                      });
                      
                      return costs.total > 0 && (
                        <div className={`text-xs mt-1 ${operation.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          <span className="font-medium text-green-600">
                            Стоимость: {formatCurrency(costs.total)}
                          </span>
                          {costs.vat > 0 && (
                            <span className="ml-2 text-orange-600">
                              (вкл. НДС: {formatCurrency(costs.vat)})
                            </span>
                          )}
                        </div>
                      );
                    })() : null}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={operation.enabled ? 'default' : 'secondary'}
                        className={`text-xs ${operation.enabled 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                          : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {operation.enabled ? '✓ Включена' : '✗ Выключена'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 ${!operation.enabled ? 'opacity-60' : ''}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    title="Управление материалами, оборудованием и персоналом"
                    className={!operation.enabled ? 'opacity-70' : ''}
                  >
                    <Link href={`/operations/${operation.id}`}>
                      <Settings className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveOperation(operation.id, 'up')}
                    disabled={index === 0}
                    title="Переместить вверх"
                    className={!operation.enabled ? 'opacity-70' : ''}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveOperation(operation.id, 'down')}
                    disabled={index === sortedOperations.length - 1}
                    title="Переместить вниз"
                    className={!operation.enabled ? 'opacity-70' : ''}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOperation(operation)}
                    title="Редактировать операцию"
                    className={!operation.enabled ? 'opacity-70' : ''}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOperation(operation.id)}
                    className={`text-red-600 hover:text-red-700 ${!operation.enabled ? 'opacity-70' : ''}`}
                    title="Удалить операцию"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <div className="mb-2">Операции не добавлены</div>
            <Button variant="ghost" size="sm" onClick={handleAddOperation}>
              Добавить первую операцию
            </Button>
          </div>
        )}
      </div>

      <ProductionOperationDialog
        operation={editingOperation}
        chainId={chain.id}
        open={operationDialogOpen}
        onClose={handleOperationDialogClose}
      />
    </>
  );
}
