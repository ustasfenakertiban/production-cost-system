
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OperationChainCard } from "./operation-chain-card";
import { OperationChainDialog } from "./operation-chain-dialog";
import { calculateChainCosts, formatCurrency, formatPercent } from "@/lib/cost-calculations";

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
    comments?: string;
    orderIndex: number;
    enabled: boolean;
    operations: Array<{
      id: string;
      name: string;
      orderIndex: number;
      enabled: boolean;
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
    }>;
  }>;
}

export default function ProductionProcessDetailPage({ params }: { params: { id: string } }) {
  const [process, setProcess] = useState<ProductionProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [chainDialogOpen, setChainDialogOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProcess();
  }, [params.id]);

  const loadProcess = async () => {
    try {
      const response = await fetch(`/api/production-processes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProcess(data);
      } else {
        throw new Error('Процесс не найден');
      }
    } catch (error) {
      console.error('Ошибка загрузки процесса:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить процесс",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChain = () => {
    setEditingChain(null);
    setChainDialogOpen(true);
  };

  const handleEditChain = (chain: any) => {
    setEditingChain(chain);
    setChainDialogOpen(true);
  };

  const handleChainDialogClose = () => {
    setChainDialogOpen(false);
    setEditingChain(null);
    loadProcess();
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

  const getChainTypeBadgeColor = (chainType: string) => {
    switch (chainType) {
      case 'ONE_TIME':
        return 'bg-orange-100 text-orange-700';
      case 'PER_UNIT':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка процесса...</div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Процесс не найден</div>
          <Button asChild>
            <Link href="/production-processes">Вернуться к списку</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/production-processes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              К списку процессов
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{process.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">Товар:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {process.product.name}
              </Badge>
            </div>
            {process.description && (
              <p className="text-gray-600 mt-2">{process.description}</p>
            )}
          </div>
        </div>

        {/* Цепочки операций */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Цепочки операций</h2>
            <Button onClick={handleAddChain}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить цепочку
            </Button>
          </div>

          {process.operationChains.length > 0 ? (
            <div className="grid gap-6">
              {process.operationChains
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((chain, index) => {
                  const chainCosts = calculateChainCosts(chain.operations);
                  return (
                <Card key={chain.id} className={`border-l-4 ${
                  chain.enabled 
                    ? 'border-l-blue-500 bg-white' 
                    : 'border-l-gray-400 bg-gray-50/50'
                } relative`}>
                  {/* Индикатор состояния в углу */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    chain.enabled ? 'bg-green-500' : 'bg-red-500'
                  }`} title={chain.enabled ? 'Включена в расчеты' : 'Выключена из расчетов'} />
                  
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="min-w-[40px] justify-center font-bold text-blue-700 border-blue-300">
                            {index + 1}
                          </Badge>
                          <CardTitle className={`text-lg ${
                            chain.enabled ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {chain.name}
                            {!chain.enabled && (
                              <span className="ml-2 text-sm font-normal text-red-600">
                                (выключена)
                              </span>
                            )}
                          </CardTitle>
                        </div>
                        
                        {/* Стоимость цепочки */}
                        {chainCosts.total > 0 && (
                          <div className={`mt-2 text-sm ${chain.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                            <div className="font-semibold text-green-700">
                              Общая стоимость: {formatCurrency(chainCosts.total)}
                            </div>
                            <div className="mt-1 space-y-1">
                              {chainCosts.materials > 0 && (
                                <span className="inline-block mr-4">
                                  Материалы: {formatCurrency(chainCosts.materials)} ({formatPercent(chainCosts.materialsPercent)})
                                </span>
                              )}
                              {chainCosts.equipment > 0 && (
                                <span className="inline-block mr-4">
                                  Оборудование: {formatCurrency(chainCosts.equipment)} ({formatPercent(chainCosts.equipmentPercent)})
                                </span>
                              )}
                              {chainCosts.roles > 0 && (
                                <span className="inline-block mr-4">
                                  Сотрудники: {formatCurrency(chainCosts.roles)} ({formatPercent(chainCosts.rolesPercent)})
                                </span>
                              )}
                              {chainCosts.vat > 0 && (
                                <span className="inline-block text-orange-600 font-medium">
                                  НДС: {formatCurrency(chainCosts.vat)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="secondary" 
                            className={`${getChainTypeBadgeColor(chain.chainType)} ${
                              !chain.enabled ? 'opacity-60' : ''
                            }`}
                          >
                            {getChainTypeLabel(chain.chainType)}
                          </Badge>
                          <Badge 
                            variant={chain.enabled ? 'default' : 'secondary'}
                            className={chain.enabled 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                              : 'bg-red-100 text-red-700'
                            }
                          >
                            {chain.enabled ? '✓ Включена' : '✗ Выключена'}
                          </Badge>
                        </div>
                        
                        {/* Порядок выполнения */}
                        <div className={`text-sm mt-2 ${
                          chain.enabled ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          <span className="font-medium">Порядок: {chain.orderIndex}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditChain(chain)}
                        className={!chain.enabled ? 'opacity-60' : ''}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className={!chain.enabled ? 'opacity-80' : ''}>
                    <OperationChainCard 
                      chain={chain} 
                      onUpdate={loadProcess}
                    />
                  </CardContent>
                </Card>
                  );
                })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Цепочки операций не созданы</p>
                  <Button variant="outline" className="mt-4" onClick={handleAddChain}>
                    Добавить первую цепочку
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <OperationChainDialog
          chain={editingChain}
          processId={process.id}
          open={chainDialogOpen}
          onClose={handleChainDialogClose}
        />
      </div>
    </div>
  );
}
