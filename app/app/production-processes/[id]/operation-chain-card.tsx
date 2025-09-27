
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronUp, ChevronDown, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductionOperationDialog } from "./production-operation-dialog";

interface Operation {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
}

interface Chain {
  id: string;
  name: string;
  chainType: string;
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
                className="flex items-center justify-between bg-gray-50 p-3 rounded border"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="min-w-[40px] justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{operation.name}</div>
                    {operation.description && (
                      <div className="text-sm text-gray-500">{operation.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    title="Управление материалами, оборудованием и персоналом"
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
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveOperation(operation.id, 'down')}
                    disabled={index === sortedOperations.length - 1}
                    title="Переместить вниз"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOperation(operation)}
                    title="Редактировать операцию"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOperation(operation.id)}
                    className="text-red-600 hover:text-red-700"
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
