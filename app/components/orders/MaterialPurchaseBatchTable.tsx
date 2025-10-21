
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Save, X, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Material {
  id: string;
  name: string;
  unit: string;
  cost: number;
  vatPercentage: number;
}

interface MaterialPurchaseBatch {
  id?: string;
  orderId: string;
  materialId: string;
  material?: Material;
  quantity: number;
  pricePerUnit: number;
  vatPercent: number;
  totalCost: number;
  prepaymentPercentage: number;
  manufacturingDays: number;
  deliveryDays: number;
  minStock?: number;
  status: string;
}

interface Props {
  orderId: string;
}

export function MaterialPurchaseBatchTable({ orderId }: Props) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<MaterialPurchaseBatch[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<Partial<MaterialPurchaseBatch> | null>(null);
  const [newBatch, setNewBatch] = useState<Partial<MaterialPurchaseBatch>>({
    orderId,
    deliveryDays: 0,
    manufacturingDays: 0,
    quantity: 0,
    pricePerUnit: 0,
    vatPercent: 0,
    prepaymentPercentage: 0,
    minStock: 0,
    status: "planned",
  });
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Состояние для диалогов шаблонов
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showApplyTemplateDialog, setShowApplyTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);

  useEffect(() => {
    loadBatches();
    loadMaterials();
  }, [orderId]);

  const loadBatches = async () => {
    try {
      const response = await fetch(`/api/material-purchase-batches?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки партий закупки:", error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
    }
  };

  const handleAdd = async () => {
    if (!newBatch.materialId || newBatch.quantity === undefined || newBatch.deliveryDays === undefined) {
      toast({
        title: "Ошибка",
        description: "Заполните материал, количество и дни поставки",
        variant: "destructive",
      });
      return;
    }

    // Вычисляем итоговую стоимость
    const totalCost = (newBatch.quantity || 0) * (newBatch.pricePerUnit || 0);

    setLoading(true);
    try {
      const response = await fetch("/api/material-purchase-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBatch,
          totalCost,
        }),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Партия добавлена",
        });
        setNewBatch({
          orderId,
          deliveryDays: 1,
          manufacturingDays: 0,
          quantity: 0,
          pricePerUnit: 0,
          prepaymentPercentage: 0,
          status: "planned",
        });
        setSelectedMaterial(null);
        loadBatches();
      } else {
        throw new Error("Ошибка добавления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить партию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/material-purchase-batches/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Партия удалена",
        });
        loadBatches();
      } else {
        throw new Error("Ошибка удаления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить партию",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (batch: MaterialPurchaseBatch) => {
    setEditingId(batch.id || null);
    setEditingBatch({ ...batch });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingBatch(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingBatch) return;

    const totalCost = (editingBatch.quantity || 0) * (editingBatch.pricePerUnit || 0);

    setLoading(true);
    try {
      const response = await fetch(`/api/material-purchase-batches/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingBatch,
          totalCost,
        }),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Партия обновлена",
        });
        setEditingId(null);
        setEditingBatch(null);
        loadBatches();
      } else {
        throw new Error("Ошибка обновления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить партию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    setSelectedMaterial(material || null);
    
    // Автоматически заполняем поля из справочника материалов
    setNewBatch({
      ...newBatch,
      materialId,
      pricePerUnit: material?.cost || 0, // Цена берется из справочника
      vatPercent: material?.vatPercentage || 0, // % НДС берется из справочника
    });
  };

  // Кнопка "Взять из справочника" - обновляет pricePerUnit и vatPercent
  const handleCopyFromMaterial = () => {
    if (selectedMaterial) {
      setNewBatch({
        ...newBatch,
        pricePerUnit: selectedMaterial.cost,
        vatPercent: selectedMaterial.vatPercentage,
      });
      toast({
        title: "Успешно",
        description: "Цена и НДС скопированы из справочника",
      });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название шаблона",
        variant: "destructive",
      });
      return;
    }

    if (batches.length === 0) {
      toast({
        title: "Ошибка",
        description: "Нет партий для сохранения",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/material-batches/save-as-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Успешно",
          description: `Сохранено ${result.templates.length} шаблонов`,
        });
        setShowSaveTemplateDialog(false);
        setTemplateName("");
        setTemplateDescription("");
      } else {
        throw new Error("Ошибка сохранения шаблона");
      }
    } catch (error) {
      console.error("Ошибка сохранения шаблона:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить шаблон",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название шаблона",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/material-batches/apply-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName,
          replaceExisting,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Успешно",
          description: `Применено ${result.batches.length} партий из шаблона`,
        });
        setShowApplyTemplateDialog(false);
        setTemplateName("");
        setReplaceExisting(false);
        loadBatches();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка применения шаблона");
      }
    } catch (error: any) {
      console.error("Ошибка применения шаблона:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось применить шаблон",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Партии закупки материалов</CardTitle>
            <CardDescription>
              Для каждого материала заполняется минимальная партия закупки, % предоплаты, сроки изготовления и доставки.
              {selectedMaterial && (
                <div className="mt-2 text-sm">
                  <span className="font-semibold">Выбран: {selectedMaterial.name}</span>
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplateDialog(true)}
              disabled={batches.length === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Сохранить как шаблон
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApplyTemplateDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Восстановить из шаблона
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Материал</TableHead>
                <TableHead className="min-w-[100px]">Количество</TableHead>
                <TableHead className="min-w-[80px]">Цена/ед. (₽)</TableHead>
                <TableHead className="min-w-[60px]">% НДС</TableHead>
                <TableHead className="min-w-[80px]">% предоплаты</TableHead>
                <TableHead className="min-w-[90px]">Изготовление (дн)</TableHead>
                <TableHead className="min-w-[90px]">Доставка (дн)</TableHead>
                <TableHead className="min-w-[90px]">Мин. запас</TableHead>
                <TableHead className="min-w-[100px]">Сумма (₽)</TableHead>
                <TableHead className="w-[80px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const isEditing = editingId === batch.id;
                const displayBatch = isEditing ? editingBatch : batch;
                
                return (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="font-medium">{batch.material?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {batch.material?.unit || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={displayBatch?.quantity ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, quantity: val === "" ? 0 : parseFloat(val) });
                          }}
                          className="w-24"
                        />
                      ) : (
                        `${batch.quantity} ${batch.material?.unit || ""}`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={displayBatch?.pricePerUnit ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, pricePerUnit: val === "" ? 0 : parseFloat(val) });
                          }}
                          className="w-24"
                        />
                      ) : (
                        batch.pricePerUnit.toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          max="100"
                          value={displayBatch?.vatPercent ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, vatPercent: val === "" ? 0 : parseFloat(val) });
                          }}
                          className="w-20"
                        />
                      ) : (
                        `${batch.vatPercent}%`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          max="100"
                          value={displayBatch?.prepaymentPercentage ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, prepaymentPercentage: val === "" ? 0 : parseFloat(val) });
                          }}
                          className="w-20"
                        />
                      ) : (
                        `${batch.prepaymentPercentage}%`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={displayBatch?.manufacturingDays ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, manufacturingDays: val === "" ? 0 : parseInt(val) });
                          }}
                          className="w-20"
                        />
                      ) : (
                        batch.manufacturingDays ?? "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={displayBatch?.deliveryDays ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, deliveryDays: val === "" ? 0 : parseInt(val) });
                          }}
                          className="w-20"
                        />
                      ) : (
                        batch.deliveryDays ?? "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={displayBatch?.minStock ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBatch({ ...editingBatch, minStock: val === "" ? undefined : parseFloat(val) });
                          }}
                          className="w-20"
                          placeholder="—"
                        />
                      ) : (
                        batch.minStock !== null && batch.minStock !== undefined ? batch.minStock.toFixed(2) : "—"
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {isEditing && displayBatch
                        ? ((displayBatch.quantity || 0) * (displayBatch.pricePerUnit || 0)).toFixed(2)
                        : batch.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={loading}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(batch)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => batch.id && handleDelete(batch.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50">
                <TableCell>
                  <Select value={newBatch.materialId || ""} onValueChange={handleMaterialChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите материал" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMaterial && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyFromMaterial}
                      className="mt-1 w-full text-xs"
                    >
                      ↓ Взять из справочника
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={newBatch.quantity ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, quantity: val === "" ? 0 : parseFloat(val) });
                    }}
                    placeholder="0"
                    className="w-24"
                    disabled={!selectedMaterial}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={newBatch.pricePerUnit ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, pricePerUnit: val === "" ? 0 : parseFloat(val) });
                    }}
                    placeholder="0"
                    className="w-24"
                    disabled={!selectedMaterial}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Справ.: {selectedMaterial?.cost.toFixed(2) || "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    max="100"
                    value={newBatch.vatPercent ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, vatPercent: val === "" ? 0 : parseFloat(val) });
                    }}
                    placeholder="0"
                    className="w-20"
                    disabled={!selectedMaterial}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Справ.: {selectedMaterial?.vatPercentage || "—"}%
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    max="100"
                    value={newBatch.prepaymentPercentage ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, prepaymentPercentage: val === "" ? 0 : parseFloat(val) });
                    }}
                    placeholder="0"
                    className="w-20"
                    disabled={!selectedMaterial}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newBatch.manufacturingDays ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, manufacturingDays: val === "" ? 0 : parseInt(val) });
                    }}
                    placeholder="0"
                    className="w-20"
                    disabled={!selectedMaterial}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newBatch.deliveryDays ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, deliveryDays: val === "" ? 0 : parseInt(val) });
                    }}
                    placeholder="0"
                    className="w-20"
                    disabled={!selectedMaterial}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={newBatch.minStock ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewBatch({ ...newBatch, minStock: val === "" ? 0 : parseFloat(val) });
                    }}
                    placeholder="0"
                    className="w-20"
                    disabled={!selectedMaterial}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {newBatch.quantity && newBatch.pricePerUnit
                      ? (newBatch.quantity * newBatch.pricePerUnit).toFixed(2)
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={handleAdd} disabled={loading || !selectedMaterial}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Диалог сохранения в шаблон */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить как шаблон</DialogTitle>
            <DialogDescription>
              Сохраните текущие партии закупки как шаблон для использования в других заказах
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Название шаблона *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Например: Стандартная партия"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Описание (необязательно)</Label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Описание шаблона"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог применения шаблона */}
      <Dialog open={showApplyTemplateDialog} onOpenChange={setShowApplyTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Восстановить из шаблона</DialogTitle>
            <DialogDescription>
              Примените сохраненный шаблон партий закупки к этому заказу
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apply-template-name">Название шаблона *</Label>
              <Input
                id="apply-template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Например: Стандартная партия"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="replace-existing"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="replace-existing" className="cursor-pointer">
                Заменить существующие партии
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyTemplateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleApplyTemplate} disabled={loading}>
              {loading ? "Применение..." : "Применить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
