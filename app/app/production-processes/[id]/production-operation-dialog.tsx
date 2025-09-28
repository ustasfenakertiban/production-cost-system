
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Operation {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  comments?: string;
  enabled: boolean;
}

interface ProductionOperationDialogProps {
  operation: Operation | null;
  chainId: string;
  open: boolean;
  onClose: () => void;
}

export function ProductionOperationDialog({ operation, chainId, open, onClose }: ProductionOperationDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    comments: "",
    enabled: true,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (operation) {
      setFormData({
        name: operation.name,
        description: operation.description || "",
        comments: operation.comments || "",
        enabled: operation.enabled ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        comments: "",
        enabled: true,
      });
    }
  }, [operation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        chainId,
        name: formData.name,
        description: formData.description || null,
        comments: formData.comments || null,
        enabled: formData.enabled,
      };

      const url = operation ? `/api/production-operations/${operation.id}` : '/api/production-operations';
      const method = operation ? 'PUT' : 'POST';

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
          description: operation ? "Операция обновлена" : "Операция добавлена",
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
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {operation ? 'Редактировать операцию' : 'Добавить операцию'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название операции *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название операции"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Описание операции"
              rows={3}
            />
          </div>

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
            <Label htmlFor="enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Включить в расчеты
            </Label>
            <p className="text-sm text-gray-500">
              (отключенные операции не учитываются при расчете стоимости)
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
