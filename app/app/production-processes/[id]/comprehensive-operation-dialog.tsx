
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Wrench, Users, Plus, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OperationMaterialDialog } from "@/app/operations/[id]/operation-material-dialog";
import { OperationEquipmentDialog } from "@/app/operations/[id]/operation-equipment-dialog";
import { OperationRoleDialog } from "@/app/operations/[id]/operation-role-dialog";

interface Operation {
  id: string;
  name: string;
  description?: string;
  comments?: string;
  enabled: boolean;
  orderIndex: number;
  estimatedProductivityPerHour?: number;
  estimatedProductivityPerHourVariance?: number;
  cycleHours?: number;
  operationDuration?: number;
  minimumBatchSize?: number;
  chainId: string;
  chain: {
    chainType: string;
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
  machineTimeSeconds?: number;
  piecesPerHour?: number;
  hourlyRate: number;
  totalCost: number;
  variance?: number;
  comments?: string;
  enabled: boolean;
  requiresContinuousOperation: boolean;
  equipment: {
    id: string;
    name: string;
    hourlyDepreciation: number;
    maxProductivity?: number | null;
    productivityUnits?: string | null;
  };
}

interface OperationRole {
  id: string;
  roleId: string;
  timeSpent: number;
  timeSpentSeconds?: number;
  piecesPerHour?: number;
  paymentType: string;
  rate: number;
  totalCost: number;
  variance?: number;
  comments?: string;
  enabled: boolean;
  requiresContinuousPresence: boolean;
  role: {
    id: string;
    name: string;
    paymentType: string;
    hourlyRate: number;
  };
}

interface ComprehensiveOperationDialogProps {
  operationId: string;
  open: boolean;
  onClose: () => void;
}

export function ComprehensiveOperationDialog({ operationId, open, onClose }: ComprehensiveOperationDialogProps) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [materials, setMaterials] = useState<OperationMaterial[]>([]);
  const [equipment, setEquipment] = useState<OperationEquipment[]>([]);
  const [roles, setRoles] = useState<OperationRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data for operation details
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    comments: "",
    enabled: true,
    estimatedProductivityPerHour: "",
    estimatedProductivityPerHourVariance: "",
    cycleHours: "1",
    operationDuration: "",
    minimumBatchSize: "1",
  });

  // Dialog states for materials/equipment/roles
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState<OperationMaterial | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<OperationEquipment | null>(null);
  const [editingRole, setEditingRole] = useState<OperationRole | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (open && operationId) {
      loadOperationData();
    }
  }, [open, operationId]);

  const loadOperationData = async () => {
    setLoading(true);
    try {
      // Load operation details
      const operationResponse = await fetch(`/api/production-operations/${operationId}`);
      if (operationResponse.ok) {
        const operationData = await operationResponse.json();
        setOperation(operationData);
        
        setFormData({
          name: operationData.name,
          description: operationData.description || "",
          comments: operationData.comments || "",
          enabled: operationData.enabled ?? true,
          estimatedProductivityPerHour: operationData.estimatedProductivityPerHour?.toString() || "",
          estimatedProductivityPerHourVariance: operationData.estimatedProductivityPerHourVariance?.toString() || "",
          cycleHours: operationData.cycleHours?.toString() || "1",
          operationDuration: operationData.operationDuration?.toString() || "",
          minimumBatchSize: operationData.minimumBatchSize?.toString() || "1",
        });
      }

      // Load materials
      const materialsResponse = await fetch(`/api/operation-materials?operationId=${operationId}`);
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData);
      }

      // Load equipment
      const equipmentResponse = await fetch(`/api/operation-equipment?operationId=${operationId}`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
      }

      // Load roles
      const rolesResponse = await fetch(`/api/operation-roles?operationId=${operationId}`);
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

  const handleSaveOperation = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название операции",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const data = {
        chainId: operation?.chainId,
        name: formData.name,
        description: formData.description || null,
        comments: formData.comments || null,
        enabled: formData.enabled,
        estimatedProductivityPerHour: formData.estimatedProductivityPerHour ? parseFloat(formData.estimatedProductivityPerHour) : null,
        estimatedProductivityPerHourVariance: formData.estimatedProductivityPerHourVariance ? parseFloat(formData.estimatedProductivityPerHourVariance) : null,
        cycleHours: formData.cycleHours ? parseFloat(formData.cycleHours) : 1,
        operationDuration: formData.operationDuration ? parseFloat(formData.operationDuration) : null,
        minimumBatchSize: formData.minimumBatchSize ? parseInt(formData.minimumBatchSize) : 1,
      };

      const response = await fetch(`/api/production-operations/${operationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Операция обновлена",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения операции:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить операцию",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const isOneTime = operation?.chain?.chainType === 'ONE_TIME';

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Загрузка операции...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование операции</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Форма редактирования основных данных операции */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Основные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Название операции *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Введите название операции"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Описание операции"
                    rows={2}
                  />
                </div>

                {isOneTime && (
                  <div>
                    <Label htmlFor="operationDuration">Время выполнения операции (часов)</Label>
                    <Input
                      id="operationDuration"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.operationDuration}
                      onChange={(e) => handleChange('operationDuration', e.target.value)}
                      placeholder="Автоматически по времени оборудования/персонала"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      При расчете используется максимальное значение из: времени работы оборудования, времени работы персонала или этого значения (если указано)
                    </p>
                  </div>
                )}

                {!isOneTime && (
                  <>
                    <div>
                      <Label htmlFor="cycleHours">Размер рабочего цикла (часов) *</Label>
                      <Input
                        id="cycleHours"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.cycleHours}
                        onChange={(e) => handleChange('cycleHours', e.target.value)}
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Определяет длительность одного рабочего цикла операции (например: 1, 4, 8, 10 часов)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estimatedProductivityPerHour">Расчётная производительность в час</Label>
                        <Input
                          id="estimatedProductivityPerHour"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.estimatedProductivityPerHour}
                          onChange={(e) => handleChange('estimatedProductivityPerHour', e.target.value)}
                          placeholder="Количество циклов в час"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estimatedProductivityPerHourVariance">Разброс</Label>
                        <Input
                          id="estimatedProductivityPerHourVariance"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.estimatedProductivityPerHourVariance}
                          onChange={(e) => handleChange('estimatedProductivityPerHourVariance', e.target.value)}
                          placeholder="±"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 -mt-2">
                      Используется для автоматического расчёта времени операции
                    </p>

                    <div>
                      <Label htmlFor="minimumBatchSize">Минимальная партия (штук)</Label>
                      <Input
                        id="minimumBatchSize"
                        type="number"
                        step="1"
                        min="1"
                        value={formData.minimumBatchSize}
                        onChange={(e) => handleChange('minimumBatchSize', e.target.value)}
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Минимальное количество деталей для начала операции (для оптимизации производства)
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="comments">Комментарии</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    placeholder="Дополнительные комментарии"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => handleChange('enabled', checked)}
                  />
                  <Label htmlFor="enabled" className="text-sm font-medium">
                    Включить в расчеты
                  </Label>
                  <span className="text-sm text-gray-500">
                    (отключенные операции не учитываются при расчете стоимости)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Итоговая стоимость */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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

            {/* Табы с материалами, оборудованием и персоналом */}
            <Tabs defaultValue="materials" className="space-y-4">
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
                      <CardTitle className="text-base">Материалы операции</CardTitle>
                      <Button size="sm" onClick={() => { setEditingMaterial(null); setMaterialDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить материал
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {materials.length > 0 ? (
                      <div className="space-y-3">
                        {materials.map((material) => (
                          <div key={material.id} className={`flex items-center justify-between p-3 rounded border relative ${
                            material.enabled 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-red-50/50 border-red-200'
                          }`}>
                            {/* Индикатор состояния */}
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
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {material.enabled ? '✓ Включен' : '✗ Выключен'}
                                </Badge>
                              </div>
                              <div className={`text-sm ${
                                material.enabled ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                Категория: {material.material.category.name}
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm mt-1">
                                <div>
                                  <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Количество:</span>
                                  <div className={`font-medium ${!material.enabled ? 'opacity-60' : ''}`}>{material.quantity} {material.material.unit}</div>
                                </div>
                                <div>
                                  <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Цена:</span>
                                  <div className={`font-medium ${!material.enabled ? 'opacity-60' : ''}`}>{formatCurrency(material.unitPrice)}</div>
                                </div>
                                <div>
                                  <span className={material.enabled ? 'text-gray-500' : 'text-gray-400'}>Стоимость:</span>
                                  <div className={`font-medium ${
                                    material.enabled ? 'text-green-600' : 'text-gray-400'
                                  }`}>{formatCurrency(material.totalCost)}</div>
                                </div>
                              </div>
                            </div>
                            <div className={`flex gap-1 ${!material.enabled ? 'opacity-60' : ''}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingMaterial(material); setMaterialDialogOpen(true); }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Материалы не добавлены</p>
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
                      <CardTitle className="text-base">Оборудование операции</CardTitle>
                      <Button size="sm" onClick={() => { setEditingEquipment(null); setEquipmentDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить оборудование
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {equipment.length > 0 ? (
                      <div className="space-y-3">
                        {equipment.map((eq) => (
                          <div key={eq.id} className={`flex items-center justify-between p-3 rounded border relative ${
                            eq.enabled 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-red-50/50 border-red-200'
                          }`}>
                            {/* Индикатор состояния */}
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
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {eq.enabled ? '✓ Включено' : '✗ Выключено'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm mt-1">
                                <div>
                                  <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Время:</span>
                                  <div className={`font-medium ${!eq.enabled ? 'opacity-60' : ''}`}>{eq.machineTime} ч</div>
                                </div>
                                <div>
                                  <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Ставка:</span>
                                  <div className={`font-medium ${!eq.enabled ? 'opacity-60' : ''}`}>{formatCurrency(eq.hourlyRate)}</div>
                                </div>
                                <div>
                                  <span className={eq.enabled ? 'text-gray-500' : 'text-gray-400'}>Стоимость:</span>
                                  <div className={`font-medium ${
                                    eq.enabled ? 'text-green-600' : 'text-gray-400'
                                  }`}>{formatCurrency(eq.totalCost)}</div>
                                </div>
                              </div>
                            </div>
                            <div className={`flex gap-1 ${!eq.enabled ? 'opacity-60' : ''}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingEquipment(eq); setEquipmentDialogOpen(true); }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEquipment(eq.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Оборудование не добавлено</p>
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
                      <CardTitle className="text-base">Персонал операции</CardTitle>
                      <Button size="sm" onClick={() => { setEditingRole(null); setRoleDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить роль
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {roles.length > 0 ? (
                      <div className="space-y-3">
                        {roles.map((role) => (
                          <div key={role.id} className={`flex items-center justify-between p-3 rounded border relative ${
                            role.enabled 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-red-50/50 border-red-200'
                          }`}>
                            {/* Индикатор состояния */}
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
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {role.enabled ? '✓ Включена' : '✗ Выключена'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-sm mt-1">
                                <div>
                                  <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Время:</span>
                                  <div className={`font-medium ${!role.enabled ? 'opacity-60' : ''}`}>{role.timeSpent} ч</div>
                                </div>
                                <div>
                                  <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Тип:</span>
                                  <div className={`font-medium ${!role.enabled ? 'opacity-60' : ''}`}>{getPaymentTypeLabel(role.paymentType)}</div>
                                </div>
                                <div>
                                  <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Ставка:</span>
                                  <div className={`font-medium ${!role.enabled ? 'opacity-60' : ''}`}>{formatCurrency(role.rate)}</div>
                                </div>
                                <div>
                                  <span className={role.enabled ? 'text-gray-500' : 'text-gray-400'}>Стоимость:</span>
                                  <div className={`font-medium ${
                                    role.enabled ? 'text-green-600' : 'text-gray-400'
                                  }`}>{formatCurrency(role.totalCost)}</div>
                                </div>
                              </div>
                            </div>
                            <div className={`flex gap-1 ${!role.enabled ? 'opacity-60' : ''}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingRole(role); setRoleDialogOpen(true); }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRole(role.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Персонал не добавлен</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Кнопки действий */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={handleSaveOperation} disabled={saving || !formData.name}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Вложенные диалоги для добавления/редактирования материалов, оборудования и ролей */}
      <OperationMaterialDialog
        material={editingMaterial}
        operationId={operationId}
        open={materialDialogOpen}
        onClose={() => {
          setMaterialDialogOpen(false);
          setEditingMaterial(null);
          loadOperationData();
        }}
      />

      <OperationEquipmentDialog
        equipment={editingEquipment}
        operationId={operationId}
        estimatedProductivityPerHour={operation?.estimatedProductivityPerHour}
        open={equipmentDialogOpen}
        onClose={() => {
          setEquipmentDialogOpen(false);
          setEditingEquipment(null);
          loadOperationData();
        }}
      />

      <OperationRoleDialog
        role={editingRole}
        operationId={operationId}
        estimatedProductivityPerHour={operation?.estimatedProductivityPerHour}
        open={roleDialogOpen}
        onClose={() => {
          setRoleDialogOpen(false);
          setEditingRole(null);
          loadOperationData();
        }}
      />
    </>
  );
}
