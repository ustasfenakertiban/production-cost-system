
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Package, Wrench, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OperationMaterialDialog } from "./operation-material-dialog";
import { OperationEquipmentDialog } from "./operation-equipment-dialog";
import { OperationRoleDialog } from "./operation-role-dialog";

interface Operation {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  comments?: string;
  enabled: boolean;
  chain: {
    id: string;
    name: string;
    chainType: string;
    process: {
      id: string;
      name: string;
      product: {
        id: string;
        name: string;
      };
    };
  };
}

interface OperationMaterial {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  variance?: number;
  comments?: string;
  enabled: boolean;
  material: {
    id: string;
    name: string;
    unit: string;
    cost: number;
    category: {
      name: string;
    };
  };
}

interface OperationEquipment {
  id: string;
  equipmentId: string;
  machineTime: number;
  hourlyRate: number;
  totalCost: number;
  variance?: number;
  comments?: string;
  enabled: boolean;
  equipment: {
    id: string;
    name: string;
    hourlyDepreciation: number;
    maxProductivity: number;
    productivityUnits: string;
  };
}

interface OperationRole {
  id: string;
  roleId: string;
  timeSpent: number;
  paymentType: string;
  rate: number;
  totalCost: number;
  variance?: number;
  comments?: string;
  enabled: boolean;
  role: {
    id: string;
    name: string;
    paymentType: string;
    hourlyRate: number;
  };
}

export default function OperationDetailPage({ params }: { params: { id: string } }) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [materials, setMaterials] = useState<OperationMaterial[]>([]);
  const [equipment, setEquipment] = useState<OperationEquipment[]>([]);
  const [roles, setRoles] = useState<OperationRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  
  // Editing states
  const [editingMaterial, setEditingMaterial] = useState<OperationMaterial | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<OperationEquipment | null>(null);
  const [editingRole, setEditingRole] = useState<OperationRole | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadOperationData();
  }, [params.id]);

  const loadOperationData = async () => {
    try {
      // Load operation details
      const operationResponse = await fetch(`/api/production-operations/${params.id}`);
      if (operationResponse.ok) {
        const operationData = await operationResponse.json();
        setOperation(operationData);
      }

      // Load materials
      const materialsResponse = await fetch(`/api/operation-materials?operationId=${params.id}`);
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData);
      }

      // Load equipment
      const equipmentResponse = await fetch(`/api/operation-equipment?operationId=${params.id}`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
      }

      // Load roles
      const rolesResponse = await fetch(`/api/operation-roles?operationId=${params.id}`);
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData);
      }

    } catch (error) {
      console.error('Ошибка загрузки данных операции:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные операции",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал?')) return;

    try {
      const response = await fetch(`/api/operation-materials/${materialId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: "Успешно", description: "Материал удален" });
        loadOperationData();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить материал",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это оборудование?')) return;

    try {
      const response = await fetch(`/api/operation-equipment/${equipmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: "Успешно", description: "Оборудование удалено" });
        loadOperationData();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить оборудование",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return;

    try {
      const response = await fetch(`/api/operation-roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: "Успешно", description: "Роль удалена" });
        loadOperationData();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить роль",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'HOURLY': return 'Почасовая';
      case 'PIECE_RATE': return 'Сдельная';
      default: return paymentType;
    }
  };

  const getTotalCost = () => {
    const materialsCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
    const equipmentCost = equipment.reduce((sum, e) => sum + e.totalCost, 0);
    const rolesCost = roles.reduce((sum, r) => sum + r.totalCost, 0);
    return materialsCost + equipmentCost + rolesCost;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка операции...</div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Операция не найдена</div>
          <Button asChild>
            <Link href="/production-processes">Вернуться к процессам</Link>
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
            <Link href={`/production-processes/${operation.chain.process.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              К процессу
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{operation.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Процесс:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {operation.chain.process.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Товар:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {operation.chain.process.product.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Цепочка:</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {operation.chain.name}
                </Badge>
              </div>
            </div>
            {operation.description && (
              <p className="text-gray-600 mt-2">{operation.description}</p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Итоговая стоимость операции
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(getTotalCost())}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <div className="text-gray-500">Материалы</div>
                <div className="font-medium">{formatCurrency(materials.reduce((sum, m) => sum + m.totalCost, 0))}</div>
              </div>
              <div>
                <div className="text-gray-500">Оборудование</div>
                <div className="font-medium">{formatCurrency(equipment.reduce((sum, e) => sum + e.totalCost, 0))}</div>
              </div>
              <div>
                <div className="text-gray-500">Персонал</div>
                <div className="font-medium">{formatCurrency(roles.reduce((sum, r) => sum + r.totalCost, 0))}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different resource types */}
        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Материалы ({materials.length})
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Оборудование ({equipment.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Персонал ({roles.length})
            </TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Материалы операции</CardTitle>
                  <Button onClick={() => { setEditingMaterial(null); setMaterialDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить материал
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className="space-y-4">
                    {materials.map((material) => (
                      <div key={material.id} className={`flex items-center justify-between p-4 rounded border relative ${
                        material.enabled 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-red-50/50 border-red-200'
                      }`}>
                        {/* Индикатор состояния в углу */}
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                          material.enabled ? 'bg-green-500' : 'bg-red-500'
                        }`} title={material.enabled ? 'Включен в расчеты' : 'Выключен из расчетов'} />
                        
                        <div className="flex-1">
                          <div className={`font-medium flex items-center gap-2 ${
                            material.enabled ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {material.material.name}
                            <Badge 
                              variant={material.enabled ? 'default' : 'secondary'}
                              className={`text-xs ${material.enabled 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {material.enabled ? '✓ Включен' : '✗ Выключен'}
                            </Badge>
                          </div>
                          <div className={`text-sm mb-2 ${
                            material.enabled ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Категория: {material.material.category.name}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Количество:</span>
                              <div className={`font-medium ${!material.enabled ? 'opacity-60' : ''}`}>{material.quantity} {material.material.unit}</div>
                            </div>
                            <div>
                              <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Цена за единицу:</span>
                              <div className={`font-medium ${!material.enabled ? 'opacity-60' : ''}`}>{formatCurrency(material.unitPrice)}</div>
                            </div>
                            <div>
                              <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Общая стоимость:</span>
                              <div className={`font-medium ${
                                material.enabled ? 'text-green-600' : 'text-gray-400'
                              }`}>{formatCurrency(material.totalCost)}</div>
                            </div>
                            {material.variance && (
                              <div>
                                <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Разброс:</span>
                                <div className={`font-medium ${!material.enabled ? 'opacity-60' : ''}`}>±{material.variance}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex gap-2 ${!material.enabled ? 'opacity-60' : ''}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingMaterial(material); setMaterialDialogOpen(true); }}
                            className={!material.enabled ? 'opacity-70' : ''}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMaterial(material.id)}
                            className={`text-red-600 hover:text-red-700 ${!material.enabled ? 'opacity-70' : ''}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Материалы не добавлены</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => { setEditingMaterial(null); setMaterialDialogOpen(true); }}
                    >
                      Добавить первый материал
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Оборудование операции</CardTitle>
                  <Button onClick={() => { setEditingEquipment(null); setEquipmentDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить оборудование
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {equipment.length > 0 ? (
                  <div className="space-y-4">
                    {equipment.map((eq) => (
                      <div key={eq.id} className={`flex items-center justify-between p-4 rounded border relative ${
                        eq.enabled 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-red-50/50 border-red-200'
                      }`}>
                        {/* Индикатор состояния в углу */}
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                          eq.enabled ? 'bg-green-500' : 'bg-red-500'
                        }`} title={eq.enabled ? 'Включено в расчеты' : 'Выключено из расчетов'} />
                        
                        <div className="flex-1">
                          <div className={`font-medium flex items-center gap-2 ${
                            eq.enabled ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {eq.equipment.name}
                            <Badge 
                              variant={eq.enabled ? 'default' : 'secondary'}
                              className={`text-xs ${eq.enabled 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {eq.enabled ? '✓ Включено' : '✗ Выключено'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                            <div>
                              <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Машинное время:</span>
                              <div className={`font-medium ${!eq.enabled ? 'opacity-60' : ''}`}>{eq.machineTime} ч</div>
                            </div>
                            <div>
                              <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Ставка в час:</span>
                              <div className={`font-medium ${!eq.enabled ? 'opacity-60' : ''}`}>{formatCurrency(eq.hourlyRate)}</div>
                            </div>
                            <div>
                              <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Общая стоимость:</span>
                              <div className={`font-medium ${
                                eq.enabled ? 'text-green-600' : 'text-gray-400'
                              }`}>{formatCurrency(eq.totalCost)}</div>
                            </div>
                            {eq.variance && (
                              <div>
                                <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Разброс:</span>
                                <div className={`font-medium ${!eq.enabled ? 'opacity-60' : ''}`}>±{eq.variance}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex gap-2 ${!eq.enabled ? 'opacity-60' : ''}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingEquipment(eq); setEquipmentDialogOpen(true); }}
                            className={!eq.enabled ? 'opacity-70' : ''}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEquipment(eq.id)}
                            className={`text-red-600 hover:text-red-700 ${!eq.enabled ? 'opacity-70' : ''}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Оборудование не добавлено</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => { setEditingEquipment(null); setEquipmentDialogOpen(true); }}
                    >
                      Добавить первое оборудование
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Персонал операции</CardTitle>
                  <Button onClick={() => { setEditingRole(null); setRoleDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить роль
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {roles.length > 0 ? (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <div key={role.id} className={`flex items-center justify-between p-4 rounded border relative ${
                        role.enabled 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-red-50/50 border-red-200'
                      }`}>
                        {/* Индикатор состояния в углу */}
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                          role.enabled ? 'bg-green-500' : 'bg-red-500'
                        }`} title={role.enabled ? 'Включена в расчеты' : 'Выключена из расчетов'} />
                        
                        <div className="flex-1">
                          <div className={`font-medium flex items-center gap-2 ${
                            role.enabled ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {role.role.name}
                            <Badge 
                              variant={role.enabled ? 'default' : 'secondary'}
                              className={`text-xs ${role.enabled 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {role.enabled ? '✓ Включена' : '✗ Выключена'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                            <div>
                              <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Время работы:</span>
                              <div className={`font-medium ${!role.enabled ? 'opacity-60' : ''}`}>{role.timeSpent} ч</div>
                            </div>
                            <div>
                              <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Тип оплаты:</span>
                              <div className={`font-medium ${!role.enabled ? 'opacity-60' : ''}`}>{getPaymentTypeLabel(role.paymentType)}</div>
                            </div>
                            <div>
                              <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Ставка:</span>
                              <div className={`font-medium ${!role.enabled ? 'opacity-60' : ''}`}>{formatCurrency(role.rate)}</div>
                            </div>
                            <div>
                              <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Общая стоимость:</span>
                              <div className={`font-medium ${
                                role.enabled ? 'text-green-600' : 'text-gray-400'
                              }`}>{formatCurrency(role.totalCost)}</div>
                            </div>
                            {role.variance && (
                              <div className="col-span-4">
                                <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Разброс:</span>
                                <span className={`font-medium ml-2 ${!role.enabled ? 'opacity-60' : ''}`}>±{role.variance}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex gap-2 ${!role.enabled ? 'opacity-60' : ''}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingRole(role); setRoleDialogOpen(true); }}
                            className={!role.enabled ? 'opacity-70' : ''}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            className={`text-red-600 hover:text-red-700 ${!role.enabled ? 'opacity-70' : ''}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Персонал не добавлен</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => { setEditingRole(null); setRoleDialogOpen(true); }}
                    >
                      Добавить первую роль
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <OperationMaterialDialog
          material={editingMaterial}
          operationId={operation.id}
          open={materialDialogOpen}
          onClose={() => {
            setMaterialDialogOpen(false);
            setEditingMaterial(null);
            loadOperationData();
          }}
        />

        <OperationEquipmentDialog
          equipment={editingEquipment}
          operationId={operation.id}
          open={equipmentDialogOpen}
          onClose={() => {
            setEquipmentDialogOpen(false);
            setEditingEquipment(null);
            loadOperationData();
          }}
        />

        <OperationRoleDialog
          role={editingRole}
          operationId={operation.id}
          open={roleDialogOpen}
          onClose={() => {
            setRoleDialogOpen(false);
            setEditingRole(null);
            loadOperationData();
          }}
        />
      </div>
    </div>
  );
}
