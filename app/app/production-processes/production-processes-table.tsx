
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Factory, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductionProcessDialog } from "./production-process-dialog";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
}

interface ProductionProcess {
  id: string;
  name: string;
  description?: string;
  productId: string;
  product: Product;
  operationChains: Array<{
    id: string;
    name: string;
    chainType: string;
  }>;
  createdAt: string;
}

export function ProductionProcessesTable() {
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProductionProcess | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const response = await fetch('/api/production-processes');
      if (response.ok) {
        const data = await response.json();
        setProcesses(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки процессов:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список процессов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот производственный процесс?')) {
      return;
    }

    try {
      const response = await fetch(`/api/production-processes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Производственный процесс удален",
        });
        loadProcesses();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления процесса:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить производственный процесс",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (process: ProductionProcess) => {
    setEditingProcess(process);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProcess(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProcess(null);
    loadProcesses();
  };

  const getChainTypeLabel = (chainType: string) => {
    switch (chainType) {
      case 'ONE_TIME':
        return 'Разовая';
      case 'PER_UNIT':
        return 'На единицу';
      default:
        return chainType;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Всего процессов: {processes.length}</span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить процесс
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-semibold">Название процесса</th>
              <th className="text-left p-3 font-semibold">Товар</th>
              <th className="text-left p-3 font-semibold">Цепочки операций</th>
              <th className="text-left p-3 font-semibold">Описание</th>
              <th className="text-center p-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{process.name}</div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {process.product.name}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {process.operationChains.map((chain) => (
                      <Badge 
                        key={chain.id} 
                        variant="secondary" 
                        className={`text-xs ${
                          chain.chainType === 'ONE_TIME' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {chain.name} ({getChainTypeLabel(chain.chainType)})
                      </Badge>
                    ))}
                    {process.operationChains.length === 0 && (
                      <span className="text-gray-400 text-sm">Нет цепочек</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {process.description || "—"}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Просмотреть детали"
                    >
                      <Link href={`/production-processes/${process.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(process)}
                      title="Редактировать процесс"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(process.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Удалить процесс"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {processes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Производственные процессы не найдены</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первый процесс
          </Button>
        </div>
      )}

      <ProductionProcessDialog
        process={editingProcess}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
