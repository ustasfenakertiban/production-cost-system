

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MaterialCategory {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  cost: number;
  vatPercentage: number;
  comment?: string;
  category: MaterialCategory;
}

interface MaterialDialogProps {
  material: Material | null;
  open: boolean;
  onClose: () => void;
}

export function MaterialDialog({ material, open, onClose }: MaterialDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    unit: "",
    cost: "",
    vatPercentage: "",
    comment: "",
  });
  
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; categoryId: string; categoryName: string }>({ open: false, categoryId: "", categoryName: "" });
  const [editConfirmDialog, setEditConfirmDialog] = useState<{ open: boolean; categoryId: string; categoryName: string }>({ open: false, categoryId: "", categoryName: "" });
  const [editCategoryName, setEditCategoryName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        categoryId: material.categoryId,
        unit: material.unit,
        cost: material.cost.toString(),
        vatPercentage: material.vatPercentage?.toString() || "0",
        comment: material.comment || "",
      });
    } else {
      setFormData({
        name: "",
        categoryId: "",
        unit: "",
        cost: "",
        vatPercentage: "0",
        comment: "",
      });
    }
  }, [material]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/material-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        categoryId: formData.categoryId,
        unit: formData.unit,
        cost: parseFloat(formData.cost),
        vatPercentage: parseFloat(formData.vatPercentage) || 0,
        comment: formData.comment || null,
      };

      const url = material ? `/api/materials/${material.id}` : '/api/materials';
      const method = material ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: material ? "Материал обновлен" : "Материал добавлен",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения материала:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить материал",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/material-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
        setNewCategoryName("");
        setShowAddCategory(false);
        toast({
          title: "Успешно",
          description: "Категория добавлена",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить категорию",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = (categoryId: string, categoryName: string) => {
    setEditConfirmDialog({ open: true, categoryId, categoryName });
    setEditCategoryName(categoryName);
  };

  const handleConfirmEdit = async () => {
    const { categoryId } = editConfirmDialog;
    if (!editCategoryName.trim()) return;

    try {
      const response = await fetch(`/api/material-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editCategoryName.trim() }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? updatedCategory : cat
        ));
        setEditConfirmDialog({ open: false, categoryId: "", categoryName: "" });
        setEditCategoryName("");
        toast({
          title: "Успешно",
          description: "Категория обновлена",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить категорию",
        variant: "destructive",
      });
    }
  };

  const handleOpenDeleteDialog = (categoryId: string, categoryName: string) => {
    setDeleteConfirmDialog({ open: true, categoryId, categoryName });
  };

  const handleConfirmDelete = async () => {
    const { categoryId } = deleteConfirmDialog;

    try {
      const response = await fetch(`/api/material-categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        if (formData.categoryId === categoryId) {
          setFormData(prev => ({ ...prev, categoryId: "" }));
        }
        setDeleteConfirmDialog({ open: false, categoryId: "", categoryName: "" });
        toast({
          title: "Успешно",
          description: "Категория удалена",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить категорию",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {material ? 'Редактировать материал' : 'Добавить материал'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название материала *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название материала"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Категория *</Label>
            <div className="space-y-2">
              <Select value={formData.categoryId || ""} onValueChange={(value) => handleChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Управление категориями */}
              {categories.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-sm font-medium mb-2">Управление категориями:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border">
                        <span className="text-sm">{category.name}</span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleOpenEditDialog(category.id, category.name)}
                            title="Редактировать категорию"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleOpenDeleteDialog(category.id, category.name)}
                            title="Удалить категорию"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showAddCategory ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCategory(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить категорию
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Название категории"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Единица измерения</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="кг, м, шт (опционально)"
              />
            </div>
            <div>
              <Label htmlFor="cost">Стоимость (₽) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vat">Процент НДС (%)</Label>
              <Input
                id="vat"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.vatPercentage}
                onChange={(e) => handleChange('vatPercentage', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="vat-amount">Сумма НДС (₽)</Label>
              <div className="relative">
                <Input
                  id="vat-amount"
                  type="text"
                  value={
                    formData.cost && formData.vatPercentage
                      ? (
                          (parseFloat(formData.cost) * parseFloat(formData.vatPercentage)) /
                          100
                        ).toLocaleString("ru-RU", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"
                  }
                  readOnly
                  className="bg-gray-50 text-gray-600"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  за {formData.unit || "ед"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('comment', e.target.value)}
              placeholder="Дополнительная информация о материале"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Диалог подтверждения удаления категории */}
      <AlertDialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog({ ...deleteConfirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить категорию "{deleteConfirmDialog.categoryName}"? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmDialog({ open: false, categoryId: "", categoryName: "" })}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения редактирования категории */}
      <AlertDialog open={editConfirmDialog.open} onOpenChange={(open) => setEditConfirmDialog({ ...editConfirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Редактировать категорию</AlertDialogTitle>
            <AlertDialogDescription>
              Изменить название категории "{editConfirmDialog.categoryName}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-category-name">Новое название категории</Label>
            <Input
              id="edit-category-name"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              placeholder="Введите новое название"
              onKeyPress={(e) => e.key === 'Enter' && handleConfirmEdit()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setEditConfirmDialog({ open: false, categoryId: "", categoryName: "" });
              setEditCategoryName("");
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit} disabled={!editCategoryName.trim()}>
              Сохранить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
